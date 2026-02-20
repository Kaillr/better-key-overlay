import type { KeyConfigEntry } from '../../../shared/types'

export interface KeyState extends KeyConfigEntry {
  pressure: number
  active: boolean
}

export const keys: KeyState[] = []

export function rebuildKeys(configs: KeyConfigEntry[]): void {
  const oldMap = new Map(keys.map((k) => [k.code, k]))
  keys.length = 0
  for (const config of configs) {
    const old = oldMap.get(config.code)
    keys.push({
      ...config,
      pressure: old?.pressure ?? 0,
      active: old?.active ?? false,
    })
  }
}

export function getKey(code: string): KeyState | undefined {
  return keys.find((k) => k.code === code)
}
