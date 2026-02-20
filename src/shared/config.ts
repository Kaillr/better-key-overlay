export const KEY_WIDTH = 80
export const KEY_GAP = 8
export const PADDING = 32

export interface KeyConfig {
  code: string // DOM keyboard code (e.g. 'KeyZ')
  analogKey: number // HID usage code for Wooting analog
  label: string
}

export const KEY_CONFIGS: KeyConfig[] = [
  { code: 'KeyZ', analogKey: 0x1d, label: 'Z' },
  { code: 'KeyX', analogKey: 0x1b, label: 'X' },
]

export function contentWidth(): number {
  return KEY_WIDTH * KEY_CONFIGS.length + KEY_GAP * (KEY_CONFIGS.length - 1) + PADDING
}
