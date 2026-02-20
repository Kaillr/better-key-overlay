import { useCallback, useEffect, useState } from 'react'
import { PressureCanvas } from '../components/PressureCanvas'
import { KeyPressure } from '../components/KeyPressure'
import { type AnalogReport } from '../lib/wooting'
import { keys, rebuildKeys } from '../lib/pressureStore'
import { useCps } from '../hooks/useCps'
import { useKeyboard } from '../hooks/useKeyboard'
import { useDevice } from '../hooks/useDevice'
import { KEY_WIDTH, KEY_GAP } from '../../../shared/config'
import type { AppSettings } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer

export function OverlayView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const { cps, recordPress } = useCps()
  useKeyboard(recordPress)

  useEffect(() => {
    ipcRenderer?.invoke('settings:get').then((s: AppSettings) => {
      rebuildKeys(s.keys)
      setSettings(s)
    })
  }, [])

  useEffect(() => {
    if (!ipcRenderer) return
    const handler = (_e: unknown, s: AppSettings): void => {
      rebuildKeys(s.keys)
      setSettings(s)
    }
    ipcRenderer.on('config-updated', handler)
    return () => {
      ipcRenderer.removeListener('config-updated', handler)
    }
  }, [])

  const onConnect = useCallback((dev: HIDDevice) => {
    dev.onanalogreport = (report: AnalogReport) => {
      for (const key of keys) {
        const val = report.data.find((k) => k.key === key.analogKey)?.value
        key.pressure = val ?? 0
      }
    }
  }, [])

  const onDisconnect = useCallback(() => {
    for (const key of keys) {
      key.pressure = 0
    }
  }, [])

  useDevice(onConnect, onDisconnect)

  if (!settings) return <div className="h-screen w-screen bg-black" />

  if (keys.length === 0) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center px-4">
        <p className="text-neutral-500 text-sm text-center">
          No keys configured.
          <br />
          Right-click to open settings.
        </p>
      </div>
    )
  }

  const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)
  const bpm = ((cps * 60) / 4).toFixed(0)

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center px-4 pb-4">
      <div className="flex-1 flex flex-col items-center w-full min-h-0">
        <div className="flex-1 min-h-0" style={{ width: canvasWidth }}>
          <PressureCanvas scrollRate={settings.scrollRate} colors={settings.colors} />
        </div>
        <div className="flex" style={{ gap: KEY_GAP }}>
          {keys.map((key) => (
            <KeyPressure key={key.code} label={key.label} active={key.active} />
          ))}
        </div>
        {(settings.showCps || settings.showBpm) && (
          <div className="font-mono text-sm py-2">
            {[
              settings.showCps && `${cps.toFixed(1)} CPS`,
              settings.showBpm && `${bpm} BPM`,
            ]
              .filter(Boolean)
              .join(' / ')}
          </div>
        )}
      </div>
    </div>
  )
}
