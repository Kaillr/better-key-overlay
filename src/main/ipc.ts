import { ipcMain, dialog, type BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { store, getActiveSettings, setActiveSettings } from './store'
import { defaultSettings } from '../shared/defaults'
import { uniquePresetName } from '../shared/presets'
import { getAnalogKey, deriveLabel } from '../shared/keyMappings'
import type { AppSettings, KeyConfigEntry } from '../shared/types'

function notify(
  getOverlayWindow: () => BrowserWindow | null,
  onConfigChanged: (settings: AppSettings) => void
): AppSettings {
  const settings = getActiveSettings()
  onConfigChanged(settings)
  getOverlayWindow()?.webContents.send('config-updated', settings)
  return settings
}

export function registerIpcHandlers(
  getOverlayWindow: () => BrowserWindow | null,
  onConfigChanged: (settings: AppSettings) => void
): void {
  ipcMain.handle('settings:get', () => {
    return getActiveSettings()
  })

  ipcMain.handle('settings:set', (_event, partial: Partial<AppSettings>) => {
    setActiveSettings(partial)
    return notify(getOverlayWindow, onConfigChanged)
  })

  ipcMain.handle('settings:add-key', () => {
    const entry: KeyConfigEntry = {
      code: '',
      label: '',
      analogKey: 0,
      uiohookKeycode: 0
    }
    const settings = getActiveSettings()
    setActiveSettings({ keys: [...settings.keys, entry] })
    return notify(getOverlayWindow, onConfigChanged)
  })

  ipcMain.handle(
    'settings:record-key',
    (_event, data: { index: number; code: string; key: string; uiohookKeycode: number }) => {
      const keys = [...getActiveSettings().keys]
      if (data.index < 0 || data.index >= keys.length) return getActiveSettings()
      keys[data.index] = {
        ...keys[data.index],
        code: data.code,
        label: deriveLabel(data.code),
        analogKey: getAnalogKey(data.code),
        uiohookKeycode: data.uiohookKeycode
      }
      setActiveSettings({ keys })
      return notify(getOverlayWindow, onConfigChanged)
    }
  )

  ipcMain.handle('settings:remove-key', (_event, data: { index: number }) => {
    const keys = getActiveSettings().keys.filter((_, i) => i !== data.index)
    setActiveSettings({ keys })
    return notify(getOverlayWindow, onConfigChanged)
  })

  // Preset handlers

  ipcMain.handle('presets:list', () => {
    return { presets: store.get('presets'), activePresetId: store.get('activePresetId') }
  })

  ipcMain.handle('presets:create', (_event, data: { name: string; fromDefaults: boolean }) => {
    const id = randomUUID()
    const settings = data.fromDefaults ? { ...defaultSettings } : getActiveSettings()
    const presets = [...store.get('presets'), { id, name: data.name, settings }]
    store.set('presets', presets)
    store.set('activePresetId', id)
    notify(getOverlayWindow, onConfigChanged)
    return { presets, activePresetId: id }
  })

  ipcMain.handle('presets:select', (_event, id: string) => {
    const presets = store.get('presets')
    if (!presets.find((p) => p.id === id)) return null
    store.set('activePresetId', id)
    return { settings: notify(getOverlayWindow, onConfigChanged), presets, activePresetId: id }
  })

  ipcMain.handle('presets:rename', (_event, data: { id: string; name: string }) => {
    const presets = store
      .get('presets')
      .map((p) => (p.id === data.id ? { ...p, name: data.name } : p))
    store.set('presets', presets)
    return { presets, activePresetId: store.get('activePresetId') }
  })

  ipcMain.handle('presets:delete', (_event, id: string) => {
    const presets = store.get('presets')
    if (presets.length <= 1) return null
    const filtered = presets.filter((p) => p.id !== id)
    store.set('presets', filtered)
    let activePresetId = store.get('activePresetId')
    if (activePresetId === id) {
      activePresetId = filtered[0].id
      store.set('activePresetId', activePresetId)
      notify(getOverlayWindow, onConfigChanged)
    }
    return { presets: filtered, activePresetId }
  })

  ipcMain.handle('presets:reset', () => {
    setActiveSettings(defaultSettings)
    return notify(getOverlayWindow, onConfigChanged)
  })

  ipcMain.handle('presets:export', async (_event, id: string) => {
    const preset = store.get('presets').find((p) => p.id === id)
    if (!preset) return false
    const result = await dialog.showSaveDialog({
      defaultPath: `${preset.name}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return false
    writeFileSync(
      result.filePath,
      JSON.stringify({ name: preset.name, settings: preset.settings }, null, 2)
    )
    return true
  })

  ipcMain.handle('presets:import', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    try {
      const data = JSON.parse(readFileSync(result.filePaths[0], 'utf-8'))
      if (!data || typeof data !== 'object' || !Array.isArray(data.settings?.keys)) return null
      const id = randomUUID()
      const existing = store.get('presets').map((p) => p.name)
      const preset = {
        id,
        name: uniquePresetName(data.name || 'Imported preset', existing),
        settings: { ...defaultSettings, ...data.settings }
      }
      const presets = [...store.get('presets'), preset]
      store.set('presets', presets)
      store.set('activePresetId', id)
      notify(getOverlayWindow, onConfigChanged)
      return { presets, activePresetId: id }
    } catch {
      return null
    }
  })
}
