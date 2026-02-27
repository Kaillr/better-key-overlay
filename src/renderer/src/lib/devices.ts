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

export interface CustomDeviceConfig {
  vendorId: number
  productId: number
  name: string
}

export function getCustomDevices(): CustomDeviceConfig[] {
  try {
    return JSON.parse(localStorage.getItem('customDevices') || '[]')
  } catch {
    return []
  }
}

export function saveCustomDevices(devices: CustomDeviceConfig[]): void {
  localStorage.setItem('customDevices', JSON.stringify(devices))
}

export function addCustomDevice(config: CustomDeviceConfig): void {
  const devices = getCustomDevices()
  if (devices.some((d) => d.vendorId === config.vendorId && d.productId === config.productId)) return
  devices.push(config)
  saveCustomDevices(devices)
}

export function removeCustomDevice(vendorId: number, productId: number): void {
  saveCustomDevices(getCustomDevices().filter((d) => d.vendorId !== vendorId || d.productId !== productId))
}

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


export async function getDevices(): Promise<AnalogDevice[]> {
  if (!navigator.hid) return []
  const supported: AnalogDevice[] = await analogsense.getDevices()
  const supportedIds = new Set(supported.map((d: AnalogDevice) => `${d.hidDevice.vendorId}:${d.hidDevice.productId}`))
  const configs = getCustomDevices().filter((c) => !supportedIds.has(`${c.vendorId}:${c.productId}`))
  if (configs.length === 0) return supported
  const allHidDevices = await navigator.hid.getDevices()
  const custom: AnalogDevice[] = []
  for (const config of configs) {
    const matching = allHidDevices.filter(
      (d) => d.vendorId === config.vendorId && d.productId === config.productId
    )
    for (const dev of matching) {
      try {
        if (!dev.opened) await dev.open()
        custom.push(createGenericDevice(dev))
        break
      } catch {}
    }
  }
  return [...supported, ...custom]
}

/** List connected device names without opening them (safe for settings page) */
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
    const isSupported = !!analogsense.findProviderForDevice(d)
    const isCustom = getCustomDevices().some((c) => c.vendorId === d.vendorId && c.productId === d.productId)
    if (isSupported || isCustom) names.push(d.productName)
  }
  return names
}

export async function requestDevice(): Promise<AnalogDevice | undefined> {
  if (!navigator.hid) return undefined
  return analogsense.requestDevice()
}
