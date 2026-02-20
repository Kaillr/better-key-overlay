export interface ColorConfig {
  activeStartColor: string
  activeEndColor: string
  inactiveStartColor: string
  inactiveEndColor: string
}

export interface KeyConfigEntry {
  code: string // DOM KeyboardEvent.code, e.g. 'KeyZ'
  label: string // Display label, e.g. 'Z'
  analogKey: number // HID usage code for Wooting analog (0 if unknown)
  uiohookKeycode: number // uiohook keycode captured during key detection
}

export interface AppSettings {
  keys: KeyConfigEntry[]
  scrollRate: number
  colors: ColorConfig
  showCps: boolean
  showBpm: boolean
}
