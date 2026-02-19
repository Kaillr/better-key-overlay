import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { uIOhook, UiohookKey } from 'uiohook-napi'

// Map uiohook keycodes to DOM key codes
const UIOHOOK_TO_DOM: Record<number, string> = {
  [UiohookKey.Z]: 'KeyZ',
  [UiohookKey.X]: 'KeyX',
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 220,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
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

  createWindow()

  uIOhook.on('keydown', (e) => {
    const code = UIOHOOK_TO_DOM[e.keycode]
    if (code && mainWindow) {
      mainWindow.webContents.send('global-keydown', code)
    }
  })

  uIOhook.on('keyup', (e) => {
    const code = UIOHOOK_TO_DOM[e.keycode]
    if (code && mainWindow) {
      mainWindow.webContents.send('global-keyup', code)
    }
  })

  uIOhook.start()
})

app.on('window-all-closed', () => {
  uIOhook.stop()
  app.quit()
})
