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
  colors?: ColorConfig // per-key color override, falls back to global
}

export interface KeyStyleState {
  borderColor: [string, string] // [low pressure, high pressure]
  backgroundColor: [string, string]
  textColor: [string, string]
}

export interface KeyStyle {
  active: KeyStyleState
  inactive: KeyStyleState
  borderWidth: number
  borderRadius: number
}

export interface FadeConfig {
  enabled: boolean
  height: number // pixels from top
}

export interface AppSettings {
  keys: KeyConfigEntry[]
  scrollRate: number
  colors: ColorConfig
  showCps: boolean
  showBpm: boolean
  keyStyle: KeyStyle
  fade: FadeConfig
}
