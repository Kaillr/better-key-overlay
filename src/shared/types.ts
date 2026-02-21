export interface ColorConfig {
  activeStartColor: string
  activeEndColor: string
  inactiveStartColor: string
  inactiveEndColor: string
  gradient: boolean
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
  borderColorGradient: boolean
  backgroundColor: [string, string]
  backgroundColorGradient: boolean
  textColor: [string, string]
  textColorGradient: boolean
}

export interface KeyStyle {
  active: KeyStyleState
  inactive: KeyStyleState
  borderWidth: number
  borderRadius: number
}

export interface FadeConfig {
  enabled: boolean
  height: number // percentage of canvas height (0-100)
}

export type CounterPosition = 'bottom' | 'left' | 'right'

export interface AppSettings {
  keys: KeyConfigEntry[]
  scrollRate: number
  colors: ColorConfig
  showKps: boolean
  showBpm: boolean
  counterPosition: CounterPosition
  keyStyle: KeyStyle
  fade: FadeConfig
  windowHeight: number
}
