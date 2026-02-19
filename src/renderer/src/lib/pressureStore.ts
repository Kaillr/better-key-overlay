export interface KeyEntry {
  code: string     // DOM keyboard code (e.g. 'KeyZ')
  analogKey: number // HID usage code from AnalogKey enum
  label: string
  pressure: number
  active: boolean
}

function createKey(code: string, analogKey: number, label: string): KeyEntry {
  return { code, analogKey, label, pressure: 0, active: false }
}

export const keys: KeyEntry[] = [
  createKey('KeyZ', 0x1d, 'Z'),
  createKey('KeyX', 0x1b, 'X'),
]

export function getKey(code: string): KeyEntry | undefined {
  return keys.find((k) => k.code === code)
}
