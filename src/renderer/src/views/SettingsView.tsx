import { useCallback, useEffect, useState } from 'react'
import { Sidebar, type SettingsPage } from '../components/settings/Sidebar'
import { KeysPage } from './settings/KeysPage'
import { KeyStylePage } from './settings/KeyStylePage'
import { VisualizerPage } from './settings/VisualizerPage'
import { DisplayPage } from './settings/DisplayPage'
import { DevicePage } from './settings/DevicePage'
import { PresetsPage } from './settings/PresetsPage'
import { defaultSettings, defaultStoreSchema } from '../../../shared/defaults'
import { uniquePresetName, deduplicatePresetNames } from '../../../shared/presets'
import { deriveLabel, getAnalogKey } from '../../../shared/keyMappings'
import type { AppSettings, Preset } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer
const isElectron = !!ipcRenderer

function migrateColors(colors: Record<string, unknown>): AppSettings['colors'] {
  const c = colors as AppSettings['colors'] & { activeEndColor?: string; inactiveStartColor?: string }
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
    colors: s.colors ? migrateColors(s.colors as unknown as Record<string, unknown>) : defaultSettings.colors
  }
}

function loadBrowserPresets(): { presets: Preset[]; activePresetId: string } {
  try {
    const stored = localStorage.getItem('presets')
    if (stored) {
      const data = JSON.parse(stored)
      data.presets = deduplicatePresetNames(
        data.presets.map((p: Preset) => ({ ...p, settings: migrateSettings(p.settings as unknown as Record<string, unknown>) }))
      )
      return data
    }
    // Migrate old browser settings format
    const oldSettings = localStorage.getItem('settings')
    if (oldSettings) {
      const settings = migrateSettings(JSON.parse(oldSettings))
      const result = {
        presets: [{ id: 'default', name: 'Unnamed preset', settings }],
        activePresetId: 'default'
      }
      localStorage.setItem('presets', JSON.stringify(result))
      return result
    }
  } catch {}
  return { presets: defaultStoreSchema.presets, activePresetId: defaultStoreSchema.activePresetId }
}

function saveBrowserPresets(presets: Preset[], activePresetId: string): void {
  localStorage.setItem('presets', JSON.stringify({ presets, activePresetId }))
}

function getActiveFromPresets(presets: Preset[], activePresetId: string): AppSettings {
  return (presets.find((p) => p.id === activePresetId) ?? presets[0]).settings
}

function saveBrowserSettings(presets: Preset[], activePresetId: string): void {
  saveBrowserPresets(presets, activePresetId)
  const settings = getActiveFromPresets(presets, activePresetId)
  localStorage.setItem('settings', JSON.stringify(settings))
  window.dispatchEvent(new StorageEvent('storage', { key: 'settings' }))
}

export function SettingsView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [presets, setPresets] = useState<Preset[]>([])
  const [activePresetId, setActivePresetId] = useState('')
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
      ipcRenderer!.invoke('presets:list').then((data: { presets: Preset[]; activePresetId: string }) => {
        setPresets(data.presets)
        setActivePresetId(data.activePresetId)
      })
    } else {
      const data = loadBrowserPresets()
      setPresets(data.presets)
      setActivePresetId(data.activePresetId)
      setSettings(getActiveFromPresets(data.presets, data.activePresetId))
    }
  }, [])

  const set = useCallback(async (partial: Partial<AppSettings>) => {
    if (isElectron) {
      const updated = await ipcRenderer!.invoke('settings:set', partial)
      setSettings(updated)
    } else {
      setPresets((prev) => {
        setActivePresetId((activeId) => {
          const updated = prev.map((p) =>
            p.id === activeId ? { ...p, settings: { ...p.settings, ...partial } } : p
          )
          setPresets(updated)
          const newSettings = getActiveFromPresets(updated, activeId)
          setSettings(newSettings)
          saveBrowserSettings(updated, activeId)
          return activeId
        })
        return prev
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
        return updated
      })
      set({ keys: [...settings!.keys, { code: '', label: '', analogKey: 0, uiohookKeycode: 0 }] })
    }
  }, [settings, set])

  const removeKey = useCallback(async (index: number) => {
    if (isElectron) {
      await ipcRenderer!.invoke('settings:remove-key', { index })
      const updated = await ipcRenderer!.invoke('settings:get')
      setSettings(updated)
    } else {
      set({ keys: settings!.keys.filter((_, i) => i !== index) })
    }
  }, [settings, set])

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
        const keys = [...settings!.keys]
        keys[index] = {
          ...keys[index],
          code,
          label: deriveLabel(code),
          analogKey: getAnalogKey(code),
          uiohookKeycode: 0,
        }
        set({ keys })
      }
    },
    [settings, set]
  )

  // Preset callbacks
  const presetSelect = useCallback(async (id: string) => {
    if (isElectron) {
      const result = await ipcRenderer!.invoke('presets:select', id)
      if (result) {
        setSettings(result.settings)
        setPresets(result.presets)
        setActivePresetId(result.activePresetId)
      }
    } else {
      setActivePresetId(id)
      setPresets((prev) => {
        setSettings(getActiveFromPresets(prev, id))
        saveBrowserSettings(prev, id)
        return prev
      })
    }
  }, [])

  const presetCreate = useCallback(async (name: string, fromDefaults: boolean) => {
    if (isElectron) {
      const result = await ipcRenderer!.invoke('presets:create', { name, fromDefaults })
      setPresets(result.presets)
      setActivePresetId(result.activePresetId)
      setSettings(getActiveFromPresets(result.presets, result.activePresetId))
    } else {
      const id = crypto.randomUUID()
      setPresets((prev) => {
        setActivePresetId((activeId) => {
          const settings = fromDefaults ? { ...defaultSettings } : getActiveFromPresets(prev, activeId)
          const newPreset: Preset = { id, name, settings }
          const updated = [...prev, newPreset]
          setPresets(updated)
          setSettings(settings)
          saveBrowserSettings(updated, id)
          return id
        })
        return prev
      })
    }
  }, [])

  const presetRename = useCallback(async (id: string, name: string) => {
    if (isElectron) {
      const result = await ipcRenderer!.invoke('presets:rename', { id, name })
      setPresets(result.presets)
    } else {
      setPresets((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, name } : p))
        setActivePresetId((activeId) => {
          saveBrowserPresets(updated, activeId)
          return activeId
        })
        return updated
      })
    }
  }, [])

  const presetDelete = useCallback(async (id: string) => {
    if (isElectron) {
      const result = await ipcRenderer!.invoke('presets:delete', id)
      if (result) {
        setPresets(result.presets)
        setActivePresetId(result.activePresetId)
        setSettings(getActiveFromPresets(result.presets, result.activePresetId))
      }
    } else {
      setPresets((prev) => {
        if (prev.length <= 1) return prev
        const filtered = prev.filter((p) => p.id !== id)
        setActivePresetId((activeId) => {
          const newActiveId = activeId === id ? filtered[0].id : activeId
          setSettings(getActiveFromPresets(filtered, newActiveId))
          saveBrowserSettings(filtered, newActiveId)
          return newActiveId
        })
        return filtered
      })
    }
  }, [])

  const presetReset = useCallback(async () => {
    if (isElectron) {
      const updated = await ipcRenderer!.invoke('presets:reset')
      setSettings(updated)
    } else {
      set({ ...defaultSettings })
    }
  }, [set])

  const presetExport = useCallback(async (id: string) => {
    if (isElectron) {
      await ipcRenderer!.invoke('presets:export', id)
    } else {
      const preset = presets.find((p) => p.id === id)
      if (!preset) return
      const blob = new Blob(
        [JSON.stringify({ name: preset.name, settings: preset.settings }, null, 2)],
        { type: 'application/json' }
      )
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${preset.name}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    }
  }, [presets])

  const presetImport = useCallback(async () => {
    if (isElectron) {
      const result = await ipcRenderer!.invoke('presets:import')
      if (result) {
        setPresets(result.presets)
        setActivePresetId(result.activePresetId)
        setSettings(getActiveFromPresets(result.presets, result.activePresetId))
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result as string)
            if (data && typeof data === 'object' && Array.isArray(data.settings?.keys)) {
              const id = crypto.randomUUID()
              setPresets((prev) => {
                const existing = prev.map((p) => p.name)
                const newPreset: Preset = {
                  id,
                  name: uniquePresetName(data.name || 'Imported preset', existing),
                  settings: { ...defaultSettings, ...data.settings }
                }
                const updated = [...prev, newPreset]
                setSettings(newPreset.settings)
                setActivePresetId(() => {
                  saveBrowserSettings(updated, id)
                  return id
                })
                return updated
              })
            }
          } catch {}
        }
        reader.readAsText(file)
      }
      input.click()
    }
  }, [])

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
      case 'presets':
        return (
          <PresetsPage
            presets={presets}
            activePresetId={activePresetId}
            onSelect={presetSelect}
            onCreate={presetCreate}
            onRename={presetRename}
            onDelete={presetDelete}
            onReset={presetReset}
            onExport={presetExport}
            onImport={presetImport}
          />
        )
    }
  }

  const sidebarBottom = (
    <div className="flex flex-col gap-2">
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
      <a
        href="https://github.com/Kaillr/better-key-overlay"
        target="_blank"
        rel="noreferrer"
        className="text-[10px] text-neutral-600 hover:text-neutral-400 text-center"
      >
        View on GitHub
      </a>
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
