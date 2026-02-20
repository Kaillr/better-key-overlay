import { useEffect, useRef } from 'react'
import { keys } from '../lib/pressureStore'
import { KEY_WIDTH, KEY_GAP } from '../../../shared/config'

function pressureToColor(pressure: number, active: boolean): string {
  if (pressure === 0) return 'transparent'
  const hue = pressure * 120
  const alpha = active ? 0.5 + pressure * 0.5 : pressure
  return `hsla(${hue}, 100%, 50%, ${alpha})`
}

export function PressureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let lastTime = 0
    let accumulator = 0
    const SCROLL_RATE = 400 // pixels per second
    const STEP = 1 / SCROLL_RATE

    const resize = () => {
      canvas.width = canvasWidth
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement!)

    const draw = (time: number) => {
      const dt = lastTime === 0 ? 0 : (time - lastTime) / 1000
      lastTime = time
      accumulator += dt

      const h = canvas.height

      while (accumulator >= STEP) {
        accumulator -= STEP

        ctx.globalCompositeOperation = 'copy'
        ctx.drawImage(canvas, 0, -1)
        ctx.globalCompositeOperation = 'source-over'

        ctx.clearRect(0, h - 1, canvasWidth, 1)

        keys.forEach((key, i) => {
          const xOffset = i * (KEY_WIDTH + KEY_GAP)
          ctx.fillStyle = pressureToColor(key.pressure, key.active)
          ctx.fillRect(xOffset, h - 1, KEY_WIDTH, 1)
        })
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
