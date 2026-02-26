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

export async function requestDevice(): Promise<AnalogDevice | undefined> {
  if (!navigator.hid) return undefined
  return analogsense.requestDevice()
}
