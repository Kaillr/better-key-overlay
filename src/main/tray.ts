import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'

export function createTray(onOpenSettings: () => void, onQuit: () => void): Tray {
  const icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'))
  const tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Settings', click: onOpenSettings },
    { type: 'separator' },
    { label: 'Quit', click: onQuit }
  ])

  tray.setToolTip('Better Key Overlay')
  tray.setContextMenu(contextMenu)
  return tray
}
