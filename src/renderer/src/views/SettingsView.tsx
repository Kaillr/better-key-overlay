import { useCallback, useEffect, useState } from 'react'
import { KeyList } from '../components/settings/KeyList'
import { ColorPicker } from '../components/settings/ColorPicker'
import { KeyStyleEditor } from '../components/settings/KeyStyleEditor'
import { Section, ItemGroup, ItemRow, ItemSeparator } from '../components/settings/SettingsLayout'
import { defaultSettings } from '../../../shared/defaults'
import { deriveLabel, getAnalogKey } from '../../../shared/keyMappings'
import { useDevice } from '../hooks/useDevice'
import type { AppSettings } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer
const isElectron = !!ipcRenderer

// Browser-only: persist settings in localStorage
function loadBrowserSettings(): AppSettings {
  try {
    const stored = localStorage.getItem('settings')
    if (stored) return JSON.parse(stored)
  } catch {}
  return { ...defaultSettings }
}

function saveBrowserSettings(settings: AppSettings): void {
  localStorage.setItem('settings', JSON.stringify(settings))
  // Notify other windows (overlay) via storage event
  window.dispatchEvent(new StorageEvent('storage', { key: 'settings' }))
}

export function SettingsView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const { devices: connectedDevices, requestDevice } = useDevice(() => {}, () => {})

  useEffect(() => {
    if (isElectron) {
      ipcRenderer!.invoke('settings:get').then(setSettings)
    } else {
      setSettings(loadBrowserSettings())
    }
  }, [])

  const set = useCallback(
    async (partial: Partial<AppSettings>) => {
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
    },
    []
  )

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

  return (
    <div className="pt-6 pb-6 pl-6 pr-2 bg-neutral-900 text-white min-h-screen">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Settings</h1>
          {!isElectron && (
            <a href="#/" className="text-sm text-neutral-500 hover:text-neutral-300">
              Back
            </a>
          )}
        </div>

        <Section title="Keys">
          <KeyList keys={settings.keys} onRemove={removeKey} onRecord={recordKey} />
          <button
            onClick={addKey}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm w-full"
          >
            Add Key
          </button>
        </Section>

        {requestDevice && (
          <Section title="Device">
            <ItemGroup>
              <ItemRow
                label="Wooting analog"
                description={
                  connectedDevices.length > 0
                    ? `${connectedDevices.length} device${connectedDevices.length > 1 ? 's' : ''} connected`
                    : 'Not connected'
                }
              >
                <button
                  onClick={requestDevice}
                  className="px-3 py-1.5 text-xs rounded-lg border border-neutral-600 hover:border-neutral-500 bg-neutral-800"
                >
                  {connectedDevices.length > 0 ? 'Add Device' : 'Connect'}
                </button>
              </ItemRow>
            </ItemGroup>
          </Section>
        )}

        <Section title="Key Style">
          <KeyStyleEditor keyStyle={settings.keyStyle} onChange={(keyStyle) => set({ keyStyle })} />
        </Section>

        <Section title="Pressure Colors">
          <ColorPicker colors={settings.colors} onChange={(colors) => set({ colors })} />
        </Section>

        <Section title="Scroll">
          <ItemGroup>
            <ItemRow label="Speed">
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={settings.scrollRate}
                onChange={(e) => set({ scrollRate: Number(e.target.value) })}
                className="w-24"
              />
              <span className="text-xs text-neutral-500 w-14 text-right">
                {settings.scrollRate} px/s
              </span>
            </ItemRow>
            <ItemSeparator />
            <ItemRow label="Fade out at top">
              <input
                type="checkbox"
                checked={settings.fade.enabled}
                onChange={(e) => set({ fade: { ...settings.fade, enabled: e.target.checked } })}
                className="w-4 h-4"
              />
            </ItemRow>
            {settings.fade.enabled && (
              <>
                <ItemSeparator />
                <ItemRow label="Fade height">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={settings.fade.height}
                    onChange={(e) =>
                      set({ fade: { ...settings.fade, height: Number(e.target.value) } })
                    }
                    className="w-24"
                  />
                  <span className="text-xs text-neutral-500 w-10 text-right">
                    {settings.fade.height}%
                  </span>
                </ItemRow>
              </>
            )}
          </ItemGroup>
        </Section>

        <Section title="Display">
          <ItemGroup>
            {isElectron && (
              <>
                <ItemRow label="Window height">
                  <input
                    type="range"
                    min={200}
                    max={1200}
                    step={10}
                    value={settings.windowHeight}
                    onChange={(e) => set({ windowHeight: Number(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-xs text-neutral-500 w-12 text-right">
                    {settings.windowHeight}px
                  </span>
                </ItemRow>
                <ItemSeparator />
              </>
            )}
            <ItemRow label="Show CPS">
              <input
                type="checkbox"
                checked={settings.showCps}
                onChange={(e) => set({ showCps: e.target.checked })}
                className="w-4 h-4"
              />
            </ItemRow>
            <ItemSeparator />
            <ItemRow label="Show BPM">
              <input
                type="checkbox"
                checked={settings.showBpm}
                onChange={(e) => set({ showBpm: e.target.checked })}
                className="w-4 h-4"
              />
            </ItemRow>
          </ItemGroup>
        </Section>
      </div>
    </div>
  )
}
