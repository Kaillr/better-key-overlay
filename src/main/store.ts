import Store from 'electron-store'
import { defaultSettings } from '../shared/defaults'
import { deduplicatePresetNames } from '../shared/presets'
import type { AppSettings, ColorConfig, StoreSchema, Preset } from '../shared/types'

function migrateColors(colors: Record<string, unknown>): ColorConfig {
  const c = colors as ColorConfig & { activeEndColor?: string; inactiveStartColor?: string }
  return {
    activeColor: c.activeColor ?? c.activeEndColor ?? defaultSettings.colors.activeColor,
    inactiveColor: c.inactiveColor ?? c.inactiveStartColor ?? defaultSettings.colors.inactiveColor,
    gradient: c.gradient ?? false,
    ...(c.gradient ? {
      activeStartColor: c.activeStartColor,
      activeEndColor: c.activeEndColor,
      inactiveStartColor: c.inactiveStartColor,
      inactiveEndColor: c.inactiveEndColor
    } : {})
  }
}

function migrateSettings(raw: Record<string, unknown>): AppSettings {
  const s = raw as AppSettings
  return {
    ...defaultSettings,
    ...s,
    colors: s.colors ? migrateColors(s.colors as Record<string, unknown>) : defaultSettings.colors
  }
}

export const store = new Store<StoreSchema>({
  defaults: {
    activePresetId: 'default',
    presets: [{ id: 'default', name: 'Unnamed preset', settings: defaultSettings }]
  }
})

// Migrate from old Store<AppSettings> format to Store<StoreSchema>
const raw = store.store as Record<string, unknown>
if ('keys' in raw && !('presets' in raw)) {
  const settings = migrateSettings(raw)
  store.clear()
  store.set('activePresetId', 'default')
  store.set('presets', [{ id: 'default', name: 'Unnamed preset', settings }])
} else {
  // Migrate colors within existing presets
  const presets = store.get('presets').map((p) => ({
    ...p,
    settings: migrateSettings(p.settings as unknown as Record<string, unknown>)
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
