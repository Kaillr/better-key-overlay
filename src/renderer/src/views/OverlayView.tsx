import { useCallback, useEffect, useState } from 'react'
import { PressureCanvas } from '../components/PressureCanvas'
import { KeyPressure } from '../components/KeyPressure'
import { type AnalogReport } from '../lib/devices'
import { keys, rebuildKeys } from '../lib/pressureStore'
import { useKps } from '../hooks/useKps'
import { useKeyboard } from '../hooks/useKeyboard'
import { useDevice } from '../hooks/useDevice'
import { KEY_WIDTH, KEY_GAP, COUNTER_WIDTH } from '../../../shared/config'
import { defaultSettings } from '../../../shared/defaults'
import type { AppSettings } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer

export function OverlayView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const { kps, recordPress } = useKps()
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
  const bpm = ((kps * 60) / 4).toFixed(0)
  const pos = settings.counterPosition
  const hasCounters = settings.showKps || settings.showBpm
  const isSide = pos === 'left' || pos === 'right'

  const counterContent = hasCounters ? (
    isSide ? (
      <div className={`flex flex-col font-mono text-sm whitespace-nowrap tabular-nums ${pos === 'right' ? 'text-left' : 'text-right'}`}>
        {settings.showKps && <span>{kps.toFixed(1)} KPS</span>}
        {settings.showBpm && <span>{bpm} BPM</span>}
      </div>
    ) : (
      <span className="font-mono text-sm whitespace-nowrap tabular-nums">
        {[
          settings.showKps && `${kps.toFixed(1)} KPS`,
          settings.showBpm && `${bpm} BPM`,
        ]
          .filter(Boolean)
          .join(' / ')}
      </span>
    )
  ) : null

  return (
    <div className="h-screen w-screen bg-black text-white flex items-end justify-center overflow-hidden relative select-none pb-4 px-4">
      {!ipcRenderer && (
        <a
          href="#/settings"
          className="absolute top-2 right-2 z-20 text-neutral-600 hover:text-neutral-400 text-xs"
        >
          Settings
        </a>
      )}
      {isSide && pos === 'left' && hasCounters && (
        <div className="shrink-0 relative self-end" style={{ width: COUNTER_WIDTH, marginRight: KEY_GAP }}>
          {counterContent && (
            <div className="absolute right-0 bottom-0">{counterContent}</div>
          )}
        </div>
      )}
      <div className="flex flex-col items-center min-h-0 h-full">
        {settings.showVisualizer ? (
          <div className="flex-1 min-h-0" style={{ width: canvasWidth }}>
            <PressureCanvas scrollRate={settings.scrollRate} colors={settings.colors} fade={settings.fade} />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex relative z-10" style={{ gap: KEY_GAP, marginTop: settings.showVisualizer ? -settings.keyStyle.borderRadius : 0 }}>
          {keys.map((key) => (
            <KeyPressure key={key.code} keyState={key} keyStyle={settings.keyStyle} />
          ))}
        </div>
        {!isSide && counterContent && <div className="pt-2">{counterContent}</div>}
      </div>
      {isSide && pos === 'right' && hasCounters && (
        <div className="shrink-0 relative self-end" style={{ width: COUNTER_WIDTH, marginLeft: KEY_GAP }}>
          {counterContent && (
            <div className="absolute left-0 bottom-0">{counterContent}</div>
          )}
        </div>
      )}
    </div>
  )
}
