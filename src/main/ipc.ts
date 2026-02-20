import { ipcMain, type BrowserWindow } from 'electron'
import { store } from './store'
import { getAnalogKey, deriveLabel } from '../shared/keyMappings'
import type { AppSettings, KeyConfigEntry } from '../shared/types'

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
    onConfigChanged(merged)
    getOverlayWindow()?.webContents.send('config-updated', merged)
    return merged
  })

  ipcMain.handle(
    'settings:add-key',
    (_event, data: { code: string; key: string; uiohookKeycode: number }) => {
      const existing = store.get('keys')
      if (existing.some((k) => k.code === data.code)) {
        return null // duplicate
      }
      const entry: KeyConfigEntry = {
        code: data.code,
        label: deriveLabel(data.code, data.key),
        analogKey: getAnalogKey(data.code),
        uiohookKeycode: data.uiohookKeycode,
      }
      const keys = [...existing, entry]
      store.set('keys', keys)
      const settings = store.store
      onConfigChanged(settings)
      getOverlayWindow()?.webContents.send('config-updated', settings)
      return entry
    }
  )

  ipcMain.handle('settings:remove-key', (_event, data: { code: string }) => {
    const keys = store.get('keys').filter((k) => k.code !== data.code)
    store.set('keys', keys)
    const settings = store.store
    onConfigChanged(settings)
    getOverlayWindow()?.webContents.send('config-updated', settings)
  })
}
