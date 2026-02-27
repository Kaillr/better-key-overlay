import { useCallback, useEffect, useState } from 'react'
import { Sidebar, type SettingsPage } from '../components/settings/Sidebar'
import { KeysPage } from './settings/KeysPage'
import { KeyStylePage } from './settings/KeyStylePage'
import { VisualizerPage } from './settings/VisualizerPage'
import { DisplayPage } from './settings/DisplayPage'
import { DevicePage } from './settings/DevicePage'
import { defaultSettings } from '../../../shared/defaults'
import { deriveLabel, getAnalogKey } from '../../../shared/keyMappings'
import type { AppSettings } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer
const isElectron = !!ipcRenderer

function loadBrowserSettings(): AppSettings {
  try {
    const stored = localStorage.getItem('settings')
    if (stored) return JSON.parse(stored)
  } catch {}
  return { ...defaultSettings }
}

function saveBrowserSettings(settings: AppSettings): void {
  localStorage.setItem('settings', JSON.stringify(settings))
  window.dispatchEvent(new StorageEvent('storage', { key: 'settings' }))
}

export function SettingsView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [activePage, setActivePage] = useState<SettingsPage>('keys')
  const [updateStatus, setUpdateStatus] = useState<{ status: string; info?: string } | null>(null)

  useEffect(() => {
    if (!ipcRenderer) return
    const handler = (_e: unknown, data: { status: string; info?: string }): void => {
      setUpdateStatus(data)
    }
    ipcRenderer.on('update-status', handler)
    return () => {
      ipcRenderer.removeListener('update-status', handler)
    }
  }, [])

  useEffect(() => {
    if (isElectron) {
      ipcRenderer!.invoke('settings:get').then(setSettings)
    } else {
      setSettings(loadBrowserSettings())
    }
  }, [])

  const set = useCallback(async (partial: Partial<AppSettings>) => {
    if (isElectron) {
      const updated = await ipcRenderer!.invoke('settings:set', partial)
      setSettings(updated)
    } else {
      setSettings((prev) => {
        const updated = { ...prev!, ...partial }
        saveBrowserSettings(updated)
        return updated
      })
    }
  }, [])

  const addKey = useCallback(async () => {
    if (isElectron) {
      const updated = await ipcRenderer!.invoke('settings:add-key')
      setSettings(updated)
    } else {
      setSettings((prev) => {
        const updated = {
          ...prev!,
          keys: [...prev!.keys, { code: '', label: '', analogKey: 0, uiohookKeycode: 0 }],
        }
        saveBrowserSettings(updated)
        return updated
      })
    }
  }, [])

  const removeKey = useCallback(async (index: number) => {
    if (isElectron) {
      await ipcRenderer!.invoke('settings:remove-key', { index })
      const updated = await ipcRenderer!.invoke('settings:get')
      setSettings(updated)
    } else {
      setSettings((prev) => {
        const updated = { ...prev!, keys: prev!.keys.filter((_, i) => i !== index) }
        saveBrowserSettings(updated)
        return updated
      })
    }
  }, [])

  const recordKey = useCallback(
    async (index: number, code: string, key: string, uiohookKeycode: number) => {
      if (isElectron) {
        const updated = await ipcRenderer!.invoke('settings:record-key', {
          index,
          code,
          key,
          uiohookKeycode,
        })
        setSettings(updated)
      } else {
        setSettings((prev) => {
          const keys = [...prev!.keys]
          keys[index] = {
            ...keys[index],
            code,
            label: deriveLabel(code),
            analogKey: getAnalogKey(code),
            uiohookKeycode: 0,
          }
          const updated = { ...prev!, keys }
          saveBrowserSettings(updated)
          return updated
        })
      }
    },
    []
  )

  if (!settings) return <div className="h-screen bg-neutral-900" />

  const renderPage = () => {
    switch (activePage) {
      case 'keys':
        return (
          <KeysPage
            settings={settings}
            addKey={addKey}
            removeKey={removeKey}
            recordKey={recordKey}
          />
        )
      case 'style':
        return <KeyStylePage settings={settings} set={set} />
      case 'visualizer':
        return <VisualizerPage settings={settings} set={set} />
      case 'display':
        return <DisplayPage settings={settings} set={set} />
      case 'device':
        return <DevicePage />
    }
  }

  const sidebarBottom = (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => set({ ...defaultSettings })}
        className="w-full py-1.5 text-xs text-red-400 hover:text-red-300"
      >
        Reset to Defaults
      </button>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] text-neutral-600">v{__APP_VERSION__}</p>
        {isElectron && (
          <div className="text-[10px] text-neutral-500 text-center">
            {updateStatus?.status === 'checking' && 'Checking...'}
            {updateStatus?.status === 'available' && `Downloading v${updateStatus.info}...`}
            {updateStatus?.status === 'downloading' && `${updateStatus.info}`}
            {updateStatus?.status === 'up-to-date' && 'Up to date'}
            {updateStatus?.status === 'error' && 'Update failed'}
            {updateStatus?.status === 'ready' && (
              <button
                onClick={() => ipcRenderer!.invoke('install-update')}
                className="text-blue-400 hover:text-blue-300"
              >
                Install v{updateStatus.info}
              </button>
            )}
            {(!updateStatus ||
              updateStatus.status === 'up-to-date' ||
              updateStatus.status === 'error') && (
              <button
                onClick={() => ipcRenderer!.invoke('check-for-updates')}
                className="text-neutral-600 hover:text-neutral-400"
              >
                Check for updates
              </button>
            )}
          </div>
        )}
      </div>
      {!isElectron && (
        <a
          href="#/"
          className="w-full py-1.5 text-xs text-neutral-500 hover:text-neutral-300 text-center block"
        >
          Back to overlay
        </a>
      )}
    </div>
  )

  return (
    <div className="h-screen flex bg-neutral-900 text-white">
      <Sidebar activePage={activePage} onNavigate={setActivePage} bottom={sidebarBottom} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto">{renderPage()}</div>
      </div>
    </div>
  )
}
