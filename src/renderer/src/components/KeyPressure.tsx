import { useEffect, useRef } from 'react'
import { KEY_WIDTH } from '../../../shared/config'
import type { KeyStyle } from '../../../shared/types'
import type { KeyState } from '../lib/pressureStore'

function lerpHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bl})`
}

interface KeyPressureProps {
  keyState: KeyState
  keyStyle: KeyStyle
}

export function KeyPressure({ keyState, keyStyle }: KeyPressureProps) {
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number
    const resolve = (pair: [string, string], gradient: boolean, p: number): string => {
      if (!gradient) return pair[0]
      return lerpHex(pair[0], pair[1], p)
    }
    const update = () => {
      const el = elRef.current
      if (el) {
        const state = keyState.active ? keyStyle.active : keyStyle.inactive
        const p = keyState.analogPressure > 0 ? keyState.analogPressure : keyState.active ? 1 : 0
        el.style.borderColor = resolve(state.borderColor, state.borderColorGradient, p)
        el.style.backgroundColor = resolve(state.backgroundColor, state.backgroundColorGradient, p)
        el.style.color = resolve(state.textColor, state.textColorGradient, p)
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [keyState, keyStyle])

  return (
    <div
      ref={elRef}
      className="h-20 flex items-center justify-center text-2xl font-bold"
      style={{
        width: KEY_WIDTH,
        borderRadius: keyStyle.borderRadius,
        borderStyle: 'solid',
        borderWidth: keyStyle.borderWidth,
      }}
    >
      {keyState.label}
    </div>
  )
}
