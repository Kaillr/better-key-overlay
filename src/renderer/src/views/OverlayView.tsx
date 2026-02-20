import { useCallback, useEffect, useState } from 'react'
import { PressureCanvas } from '../components/PressureCanvas'
import { KeyPressure } from '../components/KeyPressure'
import { type AnalogReport } from '../lib/wooting'
import { keys, rebuildKeys } from '../lib/pressureStore'
import { useCps } from '../hooks/useCps'
import { useKeyboard } from '../hooks/useKeyboard'
import { useDevice } from '../hooks/useDevice'
import { KEY_WIDTH, KEY_GAP } from '../../../shared/config'
import { defaultSettings } from '../../../shared/defaults'
import type { AppSettings } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer

export function OverlayView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const { cps, recordPress } = useCps()
  useKeyboard(recordPress)

  const applySettings = (s: AppSettings): void => {
    rebuildKeys(s.keys)
    setSettings(s)
  }

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.invoke('settings:get').then(applySettings)
    } else {
      try {
        const stored = localStorage.getItem('settings')
        applySettings(stored ? JSON.parse(stored) : defaultSettings)
      } catch {
        applySettings(defaultSettings)
      }
    }
  }, [])

  useEffect(() => {
    if (ipcRenderer) {
      const handler = (_e: unknown, s: AppSettings): void => applySettings(s)
      ipcRenderer.on('config-updated', handler)
      return () => {
        ipcRenderer.removeListener('config-updated', handler)
      }
    } else {
      const handler = (e: StorageEvent): void => {
        if (e.key === 'settings') {
          try {
            const s = JSON.parse(localStorage.getItem('settings') ?? '')
            applySettings(s)
          } catch {}
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }
  }, [])

  const onConnect = useCallback((dev: HIDDevice) => {
    dev.onanalogreport = (report: AnalogReport) => {
      for (const key of keys) {
        const val = report.data.find((k) => k.key === key.analogKey)?.value ?? 0
        key.analogPressure = val
      }
    }
  }, [])

  const onDisconnect = useCallback(() => {
    for (const key of keys) {
      key.analogPressure = 0
    }
  }, [])

  useDevice(onConnect, onDisconnect)

  if (!settings) return <div className="h-screen w-screen bg-black" />

  if (!settings.keys.some((k) => k.code)) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center px-4 select-none">
        <p className="text-neutral-500 text-sm text-center">
          No keys configured.
          <br />
          {ipcRenderer ? (
            'Right-click to open settings.'
          ) : (
            <a href="#/settings" className="text-blue-400 hover:text-blue-300 underline">
              Open settings
            </a>
          )}
        </p>
      </div>
    )
  }

  const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)
  const bpm = ((cps * 60) / 4).toFixed(0)

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center px-4 overflow-hidden relative select-none">
      {!ipcRenderer && (
        <a
          href="#/settings"
          className="absolute top-2 right-2 z-20 text-neutral-600 hover:text-neutral-400 text-xs"
        >
          Settings
        </a>
      )}
      <div className="flex-1 flex flex-col items-center w-full min-h-0">
        <div className="flex-1 min-h-0" style={{ width: canvasWidth }}>
          <PressureCanvas scrollRate={settings.scrollRate} colors={settings.colors} fade={settings.fade} />
        </div>
        <div className="flex relative z-10" style={{ gap: KEY_GAP, marginTop: -settings.keyStyle.borderRadius }}>
          {keys.map((key) => (
            <KeyPressure key={key.code} keyState={key} keyStyle={settings.keyStyle} />
          ))}
        </div>
        <div className="py-2">
          {(settings.showCps || settings.showBpm) ? (
            <span className="font-mono text-sm">
              {[
                settings.showCps && `${cps.toFixed(1)} CPS`,
                settings.showBpm && `${bpm} BPM`,
              ]
                .filter(Boolean)
                .join(' / ')}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
