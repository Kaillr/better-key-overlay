import { useCallback, useEffect, useReducer, useState } from 'react'
import { PressureCanvas } from '../components/PressureCanvas'
import { KeyPressure } from '../components/KeyPressure'
import { keys, getKeys, rebuildKeys } from '../lib/pressureStore'
import { useKps } from '../hooks/useKps'
import { useKeyboard } from '../hooks/useKeyboard'
import { useDevice } from '../hooks/useDevice'
import { KEY_WIDTH, KEY_GAP, COUNTER_WIDTH } from '../../../shared/config'
import { defaultSettings } from '../../../shared/defaults'
import type { AppSettings } from '../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isBrowserSource = !!(window as any).__BROWSER_SOURCE__

export function OverlayView(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [, forceRender] = useReducer((x: number) => x + 1, 0)
  const { kps, recordPress } = useKps()
  useKeyboard(recordPress, !isBrowserSource)

  const applySettings = (s: AppSettings): void => {
    rebuildKeys(s.keys)
    setSettings(s)
  }

  // Electron: fetch settings via IPC
  useEffect(() => {
    if (!ipcRenderer) return
    ipcRenderer.invoke('settings:get').then(applySettings)
    const handler = (_e: unknown, s: AppSettings): void => applySettings(s)
    ipcRenderer.on('config-updated', handler)
    return () => {
      ipcRenderer.removeListener('config-updated', handler)
    }
  }, [])

  // Browser source: connect via WebSocket
  useEffect(() => {
    if (ipcRenderer || !isBrowserSource) return

    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = (): void => {
      ws = new WebSocket(`ws://${window.location.host}`)
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'settings') applySettings(msg.data)
          if (msg.type === 'keydown') {
            for (const key of getKeys(msg.code)) {
              key.active = true
              recordPress()
            }
            forceRender()
          }
          if (msg.type === 'keyup') {
            for (const key of getKeys(msg.code)) {
              key.active = false
            }
            forceRender()
          }
          if (msg.type === 'analog') {
            for (const key of keys) {
              const match = msg.data.find((k: { scancode: number }) => k.scancode === key.analogKey)
              key.analogPressure = match?.value ?? 0
            }
          }
        } catch {}
      }
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 2000)
      }
    }
    connect()

    return () => {
      clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [recordPress])

  // Standalone browser: use localStorage
  useEffect(() => {
    if (ipcRenderer || isBrowserSource) return
    try {
      const stored = localStorage.getItem('settings')
      applySettings(stored ? JSON.parse(stored) : defaultSettings)
    } catch {
      applySettings(defaultSettings)
    }
    const handler = (e: StorageEvent): void => {
      if (e.key === 'settings') {
        try {
          applySettings(JSON.parse(localStorage.getItem('settings') ?? ''))
        } catch {}
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const onAnalogData = useCallback((activeKeys: { scancode: number; value: number }[]) => {
    for (const key of keys) {
      const match = activeKeys.find((k) => k.scancode === key.analogKey)
      key.analogPressure = match?.value ?? 0
    }
    ipcRenderer?.invoke('analog:forward', activeKeys)
  }, [])

  const onDisconnect = useCallback(() => {
    for (const key of keys) {
      key.analogPressure = 0
    }
  }, [])

  useDevice(onAnalogData, onDisconnect, !isBrowserSource)

  if (!settings) return <div className="h-screen w-screen bg-black" />

  if (!settings.keys.some((k) => k.code)) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center px-4 select-none">
        <p className="text-neutral-500 text-sm text-center">
          No keys configured.
          {!isBrowserSource && (
            <>
              <br />
              {ipcRenderer ? (
                'Right-click to open settings.'
              ) : (
                <a href="#/settings" className="text-blue-400 hover:text-blue-300 underline">
                  Open settings
                </a>
              )}
            </>
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
      <div
        className={`flex flex-col font-mono text-sm whitespace-nowrap tabular-nums ${pos === 'right' ? 'text-left' : 'text-right'}`}
      >
        {settings.showKps && <span>{kps.toFixed(1)} KPS</span>}
        {settings.showBpm && <span>{bpm} BPM</span>}
      </div>
    ) : (
      <span className="font-mono text-sm whitespace-nowrap tabular-nums">
        {[settings.showKps && `${kps.toFixed(1)} KPS`, settings.showBpm && `${bpm} BPM`]
          .filter(Boolean)
          .join(' / ')}
      </span>
    )
  ) : null

  return (
    <div
      className={`h-screen w-screen text-white flex items-end justify-center overflow-hidden relative select-none pb-4 px-4 ${isBrowserSource ? 'bg-transparent' : 'bg-black'}`}
    >
      {!ipcRenderer && !isBrowserSource && (
        <a
          href="#/settings"
          className="absolute top-2 right-2 z-20 text-neutral-600 hover:text-neutral-400 text-xs"
        >
          Settings
        </a>
      )}
      {isSide && pos === 'left' && hasCounters && (
        <div
          className="shrink-0 relative self-end"
          style={{ width: COUNTER_WIDTH, marginRight: KEY_GAP }}
        >
          {counterContent && <div className="absolute right-0 bottom-0">{counterContent}</div>}
        </div>
      )}
      <div className="flex flex-col items-center min-h-0 h-full">
        {settings.showVisualizer ? (
          <div className="flex-1 min-h-0" style={{ width: canvasWidth }}>
            <PressureCanvas
              scrollRate={settings.scrollRate}
              colors={settings.colors}
              fade={settings.fade}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div
          className="flex relative z-10"
          style={{
            gap: KEY_GAP,
            marginTop: settings.showVisualizer ? -settings.keyStyle.borderRadius : 0
          }}
        >
          {keys.map((key) => (
            <KeyPressure key={key.code} keyState={key} keyStyle={settings.keyStyle} />
          ))}
        </div>
        {!isSide && counterContent && <div className="pt-2">{counterContent}</div>}
      </div>
      {isSide && pos === 'right' && hasCounters && (
        <div
          className="shrink-0 relative self-end"
          style={{ width: COUNTER_WIDTH, marginLeft: KEY_GAP }}
        >
          {counterContent && <div className="absolute left-0 bottom-0">{counterContent}</div>}
        </div>
      )}
    </div>
  )
}
