import { useCallback } from 'react'
import { PressureCanvas } from './components/PressureCanvas'
import { KeyPressure } from './components/KeyPressure'
import { type AnalogReport } from './lib/wooting'
import { keys } from './lib/pressureStore'
import { useCps } from './hooks/useCps'
import { useKeyboard } from './hooks/useKeyboard'
import { useDevice } from './hooks/useDevice'
import { KEY_WIDTH, KEY_GAP } from '../../shared/config'

function App(): React.JSX.Element {
  const { cps, recordPress } = useCps()
  useKeyboard(recordPress)

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

  const bpm = (cps * 60 / 4).toFixed(0)
  const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center px-4">
      <div className="flex-1 flex flex-col items-center w-full min-h-0">
        <div className="flex-1 min-h-0" style={{ width: canvasWidth }}>
          <PressureCanvas />
        </div>
        <div className="flex pt-2" style={{ gap: KEY_GAP }}>
          {keys.map((key) => (
            <KeyPressure key={key.code} label={key.label} active={key.active} />
          ))}
        </div>
        <div className="font-mono text-sm py-2">
          {cps.toFixed(1)} CPS / {bpm} BPM
        </div>
      </div>
    </div>
  )
}

export default App
