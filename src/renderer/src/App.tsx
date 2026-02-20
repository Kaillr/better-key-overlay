import {useCallback, useEffect, useReducer} from 'react'
import {ConnectDevice} from './components/ConnectDevice'
import {PressureCanvas} from './components/PressureCanvas'
import {KeyPressure} from './components/KeyPressure'
import {type AnalogReport} from './lib/wooting'
import {getKey, keys} from './lib/pressureStore'
import {useCps} from './hooks/useCps'

const ipcRenderer = window.electron?.ipcRenderer

function App(): React.JSX.Element {
  const [, forceRender] = useReducer((x: number) => x + 1, 0)
  const {cps, recordPress} = useCps()

  useEffect(() => {
    const handleKey = (code: string, pressed: boolean) => {
      const key = getKey(code)
      if (!key) return
      if (pressed && key.active) return // ignore repeat
      if (pressed) recordPress()
      key.active = pressed
      forceRender()
    }

    if (ipcRenderer) {
      // Electron: global keyboard hooks (work without focus)
      ipcRenderer.on('global-keydown', (_e, code: string) => handleKey(code, true))
      ipcRenderer.on('global-keyup', (_e, code: string) => handleKey(code, false))
    } else {
      // Browser fallback
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return
        handleKey(e.code, true)
      }
      const onKeyUp = (e: KeyboardEvent) => handleKey(e.code, false)
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      return () => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
      }
    }
  }, [recordPress])

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

  const bpm = (cps * 60 / 4).toFixed(0)

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center px-4">
      <div className="p-4">
        <ConnectDevice onConnect={onConnect} onDisconnect={onDisconnect}/>
      </div>

      <div className="flex-1 flex flex-col items-center w-full min-h-0">
        <div className="text-white font-mono text-sm py-2">
          {cps.toFixed(1)} CPS / {bpm} BPM
        </div>
        <div className="flex-1 min-h-0" style={{width: 80 * keys.length + 8 * (keys.length - 1)}}>
          <PressureCanvas/>
        </div>
        <div className="flex gap-2 pb-4">
          {keys.map((key) => (
            <KeyPressure key={key.code} label={key.label} active={key.active}/>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
