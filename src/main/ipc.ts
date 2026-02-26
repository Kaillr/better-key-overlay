import { ipcMain, type BrowserWindow } from 'electron'
import { store } from './store'
import { getAnalogKey, deriveLabel } from '../shared/keyMappings'
import type { AppSettings, KeyConfigEntry } from '../shared/types'

function notify(
  getOverlayWindow: () => BrowserWindow | null,
  onConfigChanged: (settings: AppSettings) => void
): AppSettings {
  const settings = store.store
  onConfigChanged(settings)
  getOverlayWindow()?.webContents.send('config-updated', settings)
  return settings
}

export function registerIpcHandlers(
  getOverlayWindow: () => BrowserWindow | null,
  onConfigChanged: (settings: AppSettings) => void
): void {
  ipcMain.handle('settings:get', () => {
    return store.store
  })

  ipcMain.handle('settings:set', (_event, partial: Partial<AppSettings>) => {
    const merged = { ...store.store, ...partial }
    store.store = merged
    return notify(getOverlayWindow, onConfigChanged)
  })

  ipcMain.handle('settings:add-key', () => {
    const entry: KeyConfigEntry = {
      code: '',
      label: '',
      analogKey: 0,
      uiohookKeycode: 0
    }
    store.set('keys', [...store.get('keys'), entry])
    return notify(getOverlayWindow, onConfigChanged)
  })

  ipcMain.handle(
    'settings:record-key',
    (_event, data: { index: number; code: string; key: string; uiohookKeycode: number }) => {
      const keys = [...store.get('keys')]
      if (data.index < 0 || data.index >= keys.length) return store.store
      keys[data.index] = {
        ...keys[data.index],
        code: data.code,
        label: deriveLabel(data.code),
        analogKey: getAnalogKey(data.code),
        uiohookKeycode: data.uiohookKeycode
      }
      store.set('keys', keys)
      return notify(getOverlayWindow, onConfigChanged)
    }
  )

  ipcMain.handle('settings:remove-key', (_event, data: { index: number }) => {
    const keys = store.get('keys').filter((_, i) => i !== data.index)
    store.set('keys', keys)
    return notify(getOverlayWindow, onConfigChanged)
  })
}
