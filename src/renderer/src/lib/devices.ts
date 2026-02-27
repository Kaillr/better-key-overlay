import analogsense from './AnalogSense.js'

export interface AnalogReport {
  data: { key: number; value: number }[]
}

declare global {
  interface HIDDevice {
    onanalogreport: ((this: HIDDevice, ev: AnalogReport) => void) | undefined
  }
}

export interface AnalogDevice {
  hidDevice: HIDDevice
  startListening: (handler: (keys: { scancode: number; value: number }[]) => void) => void
  stopListening: () => void
  getProductName: () => string
}

// --- Custom device config (localStorage) ---

export interface CustomDeviceConfig {
  vendorId: number
  productId: number
  name: string
}

const STORAGE_KEY = 'customDevices'

export function getCustomDevices(): CustomDeviceConfig[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function addCustomDevice(config: CustomDeviceConfig): void {
  const devices = getCustomDevices()
  if (devices.some((d) => d.vendorId === config.vendorId && d.productId === config.productId)) return
  devices.push(config)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices))
}

export function removeCustomDevice(vendorId: number, productId: number): void {
  const devices = getCustomDevices().filter((d) => d.vendorId !== vendorId || d.productId !== productId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices))
}

// --- Generic Wooting-style device ---

function createGenericDevice(dev: HIDDevice): AnalogDevice {
  return {
    hidDevice: dev,
    getProductName: () => dev.productName || 'Unknown device',
    startListening(handler) {
      dev.oninputreport = function (event) {
        const active_keys: { scancode: number; value: number }[] = []
        for (let i = 0; i < event.data.byteLength; ) {
          const scancode = (event.data.getUint8(i++) << 8) | event.data.getUint8(i++)
          if (scancode === 0) break
          const value = event.data.getUint8(i++)
          active_keys.push({ scancode, value: value / 255 })
        }
        handler(active_keys)
      }
    },
    stopListening() {
      dev.oninputreport = undefined
    }
  }
}

async function connectCustomDevices(exclude: Set<string>): Promise<AnalogDevice[]> {
  const configs = getCustomDevices().filter((c) => !exclude.has(`${c.vendorId}:${c.productId}`))
  if (configs.length === 0) return []
  const allHid = await navigator.hid.getDevices()
  const result: AnalogDevice[] = []
  for (const config of configs) {
    // Prefer interfaces with vendor-specific usage pages (where analog data lives)
    const candidates = allHid
      .filter((d) => d.vendorId === config.vendorId && d.productId === config.productId)
      .sort((a, b) => {
        const aVendor = a.collections.some((c) => c.usagePage >= 0xff00) ? 1 : 0
        const bVendor = b.collections.some((c) => c.usagePage >= 0xff00) ? 1 : 0
        return bVendor - aVendor
      })
    for (const dev of candidates) {
      try {
        if (!dev.opened) await dev.open()
        result.push(createGenericDevice(dev))
        break
      } catch {}
    }
  }
  return result
}

// --- Public API ---

/** Connect to all available analog devices (AnalogSense + custom). Used by overlay. */
export async function getDevices(): Promise<AnalogDevice[]> {
  if (!navigator.hid) return []
  const supported: AnalogDevice[] = await analogsense.getDevices()
  const supportedIds = new Set(supported.map((d: AnalogDevice) => `${d.hidDevice.vendorId}:${d.hidDevice.productId}`))
  const custom = await connectCustomDevices(supportedIds)
  return [...supported, ...custom]
}

/** List device names without opening them. Used by settings page. */
export async function listConnectedDeviceNames(): Promise<string[]> {
  if (!navigator.hid) return []
  const devices = await navigator.hid.getDevices()
  const seen = new Set<string>()
  const names: string[] = []
  for (const d of devices) {
    if (!d.productName) continue
    const key = `${d.vendorId}:${d.productId}`
    if (seen.has(key)) continue
    seen.add(key)
    if (analogsense.findProviderForDevice(d)) names.push(d.productName)
  }
  return names
}

export async function requestDevice(): Promise<AnalogDevice | undefined> {
  if (!navigator.hid) return undefined
  return analogsense.requestDevice()
}
