import { KEY_CONFIGS, type KeyConfig } from '../../../shared/config'

export interface KeyState extends KeyConfig {
  pressure: number
  active: boolean
}

export const keys: KeyState[] = KEY_CONFIGS.map((config) => ({
  ...config,
  pressure: 0,
  active: false
}))

export function getKey(code: string): KeyState | undefined {
  return keys.find((k) => k.code === code)
}
