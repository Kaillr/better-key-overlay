import { app, shell, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { uIOhook } from 'uiohook-napi'
import { contentWidth } from '../shared/config'
import { store } from './store'
import { registerIpcHandlers } from './ipc'
import { createTray } from './tray'
import { openSettingsWindow } from './settingsWindow'
import type { AppSettings } from '../shared/types'

let mainWindow: BrowserWindow | null = null

// Dynamic uiohook tracking: uiohook keycode → DOM code
const uiohookMap = new Map<number, string>()

// Whether we're capturing the next keypress for key detection
let captureNextKey: ((keycode: number) => void) | null = null

function rebuildTracking(settings: AppSettings): void {
  uiohookMap.clear()
  for (const key of settings.keys) {
    if (key.uiohookKeycode > 0) {
      uiohookMap.set(key.uiohookKeycode, key.code)
    }
  }
}

function onConfigChanged(settings: AppSettings): void {
  rebuildTracking(settings)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setContentSize(contentWidth(settings.keys.length), 720)
  }
}

function createWindow(): void {
  const keys = store.get('keys')
  mainWindow = new BrowserWindow({
    width: contentWidth(keys.length),
    height: 720,
    resizable: false,
    useContentSize: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.session.on('select-hid-device', (event, details, callback) => {
    event.preventDefault()
    const device = details.deviceList.find((d) => d.vendorId === 0x31e3)
    callback(device?.deviceId ?? '')
  })

  mainWindow.webContents.session.setPermissionCheckHandler((_wc, permission) => {
    if (permission === 'hid') return true
    return false
  })

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'hid' && details.device && 'vendorId' in details.device) {
      return (details.device as { vendorId: number }).vendorId === 0x31e3
    }
    return false
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('context-menu', () => {
    Menu.buildFromTemplate([
      { label: 'Settings', click: () => openSettingsWindow() },
    ]).popup({ window: mainWindow! })
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  rebuildTracking(store.store)
  registerIpcHandlers(() => mainWindow, onConfigChanged)
  createTray(() => openSettingsWindow(), () => app.quit())

  // Key capture IPC: settings window requests capture, main waits for next uiohook keydown
  ipcMain.handle('settings:capture-key', () => {
    return new Promise<number>((resolve) => {
      captureNextKey = (keycode: number) => {
        captureNextKey = null
        resolve(keycode)
      }
    })
  })

  ipcMain.handle('settings:cancel-capture', () => {
    captureNextKey = null
  })

  createWindow()

  uIOhook.on('keydown', (e) => {
    // If capturing for settings, resolve the capture promise
    if (captureNextKey) {
      captureNextKey(e.keycode)
      return
    }

    const code = uiohookMap.get(e.keycode)
    if (code && mainWindow) {
      mainWindow.webContents.send('global-keydown', code)
    }
  })

  uIOhook.on('keyup', (e) => {
    const code = uiohookMap.get(e.keycode)
    if (code && mainWindow) {
      mainWindow.webContents.send('global-keyup', code)
    }
  })

  uIOhook.start()
})

app.on('window-all-closed', () => {
  // Don't quit when all windows close — tray keeps app running
})

app.on('before-quit', () => {
  uIOhook.stop()
})
