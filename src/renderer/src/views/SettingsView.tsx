import { useCallback, useEffect, useState } from 'react'
import { KeyList } from '../components/settings/KeyList'
import { ColorPicker } from '../components/settings/ColorPicker'
import { KeyStyleEditor } from '../components/settings/KeyStyleEditor'
import { Section, ItemGroup, ItemRow, ItemSeparator } from '../components/settings/SettingsLayout'
import type { AppSettings } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer

export function SettingsView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    ipcRenderer?.invoke('settings:get').then(setSettings)
  }, [])

  const set = useCallback(async (partial: Partial<AppSettings>) => {
    const updated = await ipcRenderer?.invoke('settings:set', partial)
    setSettings(updated)
  }, [])

  const addKey = useCallback(async () => {
    const updated = await ipcRenderer?.invoke('settings:add-key')
    setSettings(updated)
  }, [])

  const removeKey = useCallback(async (index: number) => {
    await ipcRenderer?.invoke('settings:remove-key', { index })
    const updated = await ipcRenderer?.invoke('settings:get')
    setSettings(updated)
  }, [])

  const recordKey = useCallback(
    async (index: number, code: string, key: string, uiohookKeycode: number) => {
      const updated = await ipcRenderer?.invoke('settings:record-key', {
        index,
        code,
        key,
        uiohookKeycode,
      })
      setSettings(updated)
    },
    []
  )

  if (!settings) return <div className="h-screen bg-neutral-900" />

  return (
    <div className="pt-6 pb-6 pl-6 pr-2 bg-neutral-900 text-white min-h-screen">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <Section title="Keys">
          <KeyList
            keys={settings.keys}
            onRemove={removeKey}
            onRecord={recordKey}
          />
          <button
            onClick={addKey}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm w-full"
          >
            Add Key
          </button>
        </Section>

        <Section title="Key Style">
          <KeyStyleEditor
            keyStyle={settings.keyStyle}
            onChange={(keyStyle) => set({ keyStyle })}
          />
        </Section>

        <Section title="Pressure Colors">
          <ColorPicker
            colors={settings.colors}
            onChange={(colors) => set({ colors })}
          />
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
              <span className="text-xs text-neutral-500 w-14 text-right">{settings.scrollRate} px/s</span>
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
                    onChange={(e) => set({ fade: { ...settings.fade, height: Number(e.target.value) } })}
                    className="w-24"
                  />
                  <span className="text-xs text-neutral-500 w-10 text-right">{settings.fade.height}%</span>
                </ItemRow>
              </>
            )}
          </ItemGroup>
        </Section>

        <Section title="Display">
          <ItemGroup>
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
              <span className="text-xs text-neutral-500 w-12 text-right">{settings.windowHeight}px</span>
            </ItemRow>
            <ItemSeparator />
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
