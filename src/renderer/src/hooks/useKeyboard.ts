import { useEffect, useReducer } from 'react'
import { getKey } from '../lib/pressureStore'

const ipcRenderer = window.electron?.ipcRenderer

export function useKeyboard(recordPress: () => void): void {
  const [, forceRender] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    const handleKey = (code: string, pressed: boolean): void => {
      const key = getKey(code)
      if (!key) return
      if (pressed && key.active) return
      if (pressed) recordPress()
      key.active = pressed
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
