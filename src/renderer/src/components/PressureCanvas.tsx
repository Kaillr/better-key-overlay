import { useEffect, useRef } from 'react'
import { keys } from '../lib/pressureStore'

const COL_WIDTH = 80
const GAP = 8

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

    const canvasWidth = COL_WIDTH * keys.length + GAP * (keys.length - 1)
    const ctx = canvas.getContext('2d')!
    let rafId: number

    const resize = () => {
      canvas.width = canvasWidth
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement!)

    const draw = () => {
      const h = canvas.height

      ctx.globalCompositeOperation = 'copy'
      ctx.drawImage(canvas, 0, -1)
      ctx.globalCompositeOperation = 'source-over'

      ctx.clearRect(0, h - 1, canvasWidth, 1)

      keys.forEach((key, i) => {
        const xOffset = i * (COL_WIDTH + GAP)
        ctx.fillStyle = pressureToColor(key.pressure, key.active)
        ctx.fillRect(xOffset, h - 1, COL_WIDTH, 1)
      })

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
