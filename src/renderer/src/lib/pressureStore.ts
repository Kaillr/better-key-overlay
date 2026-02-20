import type { KeyConfigEntry } from '../../../shared/types'

export interface KeyState extends KeyConfigEntry {
  active: boolean
  analogPressure: number
}

export const keys: KeyState[] = []

export function rebuildKeys(configs: KeyConfigEntry[]): void {
  const prevState = new Map(keys.map((k) => [k.code, k]))
  keys.length = 0
  for (const config of configs.filter((c) => c.code)) {
    const prev = prevState.get(config.code)
    keys.push({
      ...config,
      active: prev?.active ?? false,
      analogPressure: prev?.analogPressure ?? 0,
    })
  }
}

export function getKey(code: string): KeyState | undefined {
  return keys.find((k) => k.code === code)
}
