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

export async function getDevices(): Promise<AnalogDevice[]> {
  if (!navigator.hid) return []
  return analogsense.getDevices()
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
