import Store from 'electron-store'
import { defaultSettings } from '../shared/defaults'
import { deduplicatePresetNames } from '../shared/presets'
import type { AppSettings, ColorConfig, StoreSchema, Preset } from '../shared/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

function hex8(v: any): string {
  if (typeof v !== 'string') return '#000000ff'
  if (v.length === 7) return v + 'ff'
  return v
}

function migrateColors(colors: any): ColorConfig {
  return {
    activeColor: hex8(
      colors.activeColor ?? colors.activeEndColor ?? defaultSettings.colors.activeColor
    ),
    inactiveColor: hex8(
      colors.inactiveColor ?? colors.inactiveStartColor ?? defaultSettings.colors.inactiveColor
    ),
    gradient: colors.gradient ?? false,
    ...(colors.gradient
      ? {
          activeStartColor: hex8(colors.activeStartColor),
          activeEndColor: hex8(colors.activeEndColor),
          inactiveStartColor: hex8(colors.inactiveStartColor),
          inactiveEndColor: hex8(colors.inactiveEndColor)
        }
      : {})
  }
}

function migrateKeyStyle(style: any): any {
  if (!style) return defaultSettings.keyStyle
  const migratePair = (pair: any): [string, string] => {
    if (!Array.isArray(pair)) return ['#000000ff', '#000000ff']
    return [hex8(pair[0]), hex8(pair[1])]
  }
  const migrateState = (s: any): any => ({
    ...s,
    borderColor: migratePair(s.borderColor),
    backgroundColor: migratePair(s.backgroundColor),
    textColor: migratePair(s.textColor)
  })
  return {
    ...style,
    active: style.active ? migrateState(style.active) : defaultSettings.keyStyle.active,
    inactive: style.inactive ? migrateState(style.inactive) : defaultSettings.keyStyle.inactive
  }
}

function migrateSettings(raw: any): AppSettings {
  return {
    ...defaultSettings,
    ...raw,
    colors: raw.colors ? migrateColors(raw.colors) : defaultSettings.colors,
    keyStyle: migrateKeyStyle(raw.keyStyle)
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export const store = new Store<StoreSchema>({
  defaults: {
    activePresetId: 'default',
    presets: [{ id: 'default', name: 'Unnamed preset', settings: defaultSettings }],
    serverEnabled: false,
    serverPort: 1727
  }
})

// Migrate from old Store<AppSettings> format to Store<StoreSchema>
const raw = store.store as unknown as Record<string, unknown>
if ('keys' in raw && !('presets' in raw)) {
  const settings = migrateSettings(raw)
  store.clear()
  store.set('activePresetId', 'default')
  store.set('presets', [{ id: 'default', name: 'Unnamed preset', settings }])
} else {
  const presets = store.get('presets').map((p) => ({
    ...p,
    settings: migrateSettings(p.settings)
  }))
  store.set('presets', deduplicatePresetNames(presets))
}

export function getActivePreset(): Preset {
  const presets = store.get('presets')
  const activeId = store.get('activePresetId')
  return presets.find((p) => p.id === activeId) ?? presets[0]
}

export function getActiveSettings(): AppSettings {
  return getActivePreset().settings
}

export function setActiveSettings(partial: Partial<AppSettings>): void {
  const presets = store.get('presets')
  const activeId = store.get('activePresetId')
  store.set(
    'presets',
    presets.map((p) => (p.id === activeId ? { ...p, settings: { ...p.settings, ...partial } } : p))
  )
}
