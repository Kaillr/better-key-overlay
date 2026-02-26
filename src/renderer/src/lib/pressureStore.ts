import type { KeyConfigEntry } from '../../../shared/types'

export interface KeyState extends KeyConfigEntry {
  active: boolean
  analogPressure: number
}

export const keys: KeyState[] = []

export function rebuildKeys(configs: KeyConfigEntry[]): void {
  const prev = [...keys]
  keys.length = 0
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]
    if (!config.code) continue
    keys.push({
      ...config,
      active: prev[i]?.active ?? false,
      analogPressure: prev[i]?.analogPressure ?? 0
    })
  }
}

export function getKeys(code: string): KeyState[] {
  return keys.filter((k) => k.code === code)
}
