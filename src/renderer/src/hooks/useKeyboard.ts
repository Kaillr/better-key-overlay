import { useEffect, useReducer } from 'react'
import { getKeys } from '../lib/pressureStore'

const ipcRenderer = window.electron?.ipcRenderer

export function useKeyboard(recordPress: () => void): void {
  const [, forceRender] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    const handleKey = (code: string, pressed: boolean): void => {
      const matching = getKeys(code)
      if (matching.length === 0) return
      if (pressed && matching.every((k) => k.active)) return
      if (pressed) recordPress()
      for (const key of matching) {
        key.active = pressed
      }
      forceRender()
    }

    if (ipcRenderer) {
      ipcRenderer.on('global-keydown', (_e, code: string) => handleKey(code, true))
      ipcRenderer.on('global-keyup', (_e, code: string) => handleKey(code, false))
      return
    } else {
      const onKeyDown = (e: KeyboardEvent): void => {
        if (e.repeat) return
        handleKey(e.code, true)
      }
      const onKeyUp = (e: KeyboardEvent): void => handleKey(e.code, false)
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      return () => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
      }
    }
  }, [recordPress])
}
