import { useCallback, useEffect, useState } from 'react'
import { KeyList } from '../components/settings/KeyList'
import { KeyCapture } from '../components/settings/KeyCapture'
import { ScrollSpeedSlider } from '../components/settings/ScrollSpeedSlider'
import { ColorPicker } from '../components/settings/ColorPicker'
import type { AppSettings, ColorConfig } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer

export function SettingsView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [capturePromise, setCapturePromise] = useState<Promise<number> | null>(null)

  useEffect(() => {
    ipcRenderer?.invoke('settings:get').then(setSettings)
  }, [])

  const startCapture = useCallback(() => {
    // Start listening for uiohook keycode in main process
    const promise = ipcRenderer?.invoke('settings:capture-key') as Promise<number>
    setCapturePromise(promise)
    setCapturing(true)
  }, [])

  const onCapture = useCallback(
    async (code: string, key: string) => {
      // Wait for the uiohook keycode from the same keypress
      const uiohookKeycode = (await capturePromise) ?? 0
      await ipcRenderer?.invoke('settings:add-key', { code, key, uiohookKeycode })
      const updated = await ipcRenderer?.invoke('settings:get')
      setSettings(updated)
      setCapturing(false)
      setCapturePromise(null)
    },
    [capturePromise]
  )

  const onCancelCapture = useCallback(() => {
    ipcRenderer?.invoke('settings:cancel-capture')
    setCapturing(false)
    setCapturePromise(null)
  }, [])

  const removeKey = useCallback(async (code: string) => {
    await ipcRenderer?.invoke('settings:remove-key', { code })
    const updated = await ipcRenderer?.invoke('settings:get')
    setSettings(updated)
  }, [])

  const updateScrollRate = useCallback(async (rate: number) => {
    const updated = await ipcRenderer?.invoke('settings:set', { scrollRate: rate })
    setSettings(updated)
  }, [])

  const updateColors = useCallback(async (colors: ColorConfig) => {
    const updated = await ipcRenderer?.invoke('settings:set', { colors })
    setSettings(updated)
  }, [])

  if (!settings) return <div className="h-screen bg-neutral-900" />

  return (
    <div className="p-6 bg-neutral-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Keys</h2>
        <KeyList keys={settings.keys} onRemove={removeKey} />
        {capturing ? (
          <KeyCapture onCapture={onCapture} onCancel={onCancelCapture} />
        ) : (
          <button
            onClick={startCapture}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          >
            Add Key
          </button>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Scroll Speed</h2>
        <ScrollSpeedSlider value={settings.scrollRate} onChange={updateScrollRate} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Colors</h2>
        <ColorPicker colors={settings.colors} onChange={updateColors} />
      </section>
    </div>
  )
}
