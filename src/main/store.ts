import Store from 'electron-store'
import { defaultSettings } from '../shared/defaults'
import { deduplicatePresetNames } from '../shared/presets'
import type { AppSettings, ColorConfig, StoreSchema, Preset } from '../shared/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

function migrateColors(colors: any): ColorConfig {
  return {
    activeColor: colors.activeColor ?? colors.activeEndColor ?? defaultSettings.colors.activeColor,
    inactiveColor:
      colors.inactiveColor ?? colors.inactiveStartColor ?? defaultSettings.colors.inactiveColor,
    gradient: colors.gradient ?? false,
    ...(colors.gradient
      ? {
          activeStartColor: colors.activeStartColor,
          activeEndColor: colors.activeEndColor,
          inactiveStartColor: colors.inactiveStartColor,
          inactiveEndColor: colors.inactiveEndColor
        }
      : {})
  }
}

function migrateSettings(raw: any): AppSettings {
  return {
    ...defaultSettings,
    ...raw,
    colors: raw.colors ? migrateColors(raw.colors) : defaultSettings.colors
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export const store = new Store<StoreSchema>({
  defaults: {
    activePresetId: 'default',
    presets: [{ id: 'default', name: 'Unnamed preset', settings: defaultSettings }]
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
