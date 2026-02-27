import type { Preset } from './types'

export function uniquePresetName(name: string, existing: string[]): string {
  if (!existing.includes(name)) return name
  let i = 2
  while (existing.includes(`${name} (${i})`)) i++
  return `${name} (${i})`
}

function sanitizeName(name: unknown): string {
  if (typeof name === 'string') return name
  if (name && typeof name === 'object' && 'name' in name) return sanitizeName((name as { name: unknown }).name)
  return 'Unnamed preset'
}

export function deduplicatePresetNames(presets: Preset[]): Preset[] {
  const seen: string[] = []
  const result = presets.map((p) => {
    const safe = sanitizeName(p.name)
    const unique = uniquePresetName(safe, seen)
    seen.push(unique)
    if (unique !== p.name) return { ...p, name: unique }
    return p
  })
  return result
}
