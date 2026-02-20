import { useEffect, useRef } from 'react'
import { keys } from '../lib/pressureStore'
import { lerpColor } from '../lib/color'
import { KEY_WIDTH, KEY_GAP } from '../../../shared/config'
import type { ColorConfig } from '../../../shared/types'

interface PressureCanvasProps {
  scrollRate: number
  colors: ColorConfig
}

export function PressureCanvas({ scrollRate, colors }: PressureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRateRef = useRef(scrollRate)
  const colorsRef = useRef(colors)

  useEffect(() => {
    scrollRateRef.current = scrollRate
  }, [scrollRate])

  useEffect(() => {
    colorsRef.current = colors
  }, [colors])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    let rafId: number
    let lastTime = 0
    let accumulator = 0

    const resize = () => {
      const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)
      canvas.width = canvasWidth || 1
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement!)

    const draw = (time: number) => {
      const dt = lastTime === 0 ? 0 : (time - lastTime) / 1000
      lastTime = time
      accumulator += dt

      const step = 1 / scrollRateRef.current
      const h = canvas.height
      const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)
      const c = colorsRef.current

      while (accumulator >= step) {
        accumulator -= step

        ctx.globalCompositeOperation = 'copy'
        ctx.drawImage(canvas, 0, -1)
        ctx.globalCompositeOperation = 'source-over'

        ctx.clearRect(0, h - 1, canvasWidth, 1)

        keys.forEach((key, i) => {
          const xOffset = i * (KEY_WIDTH + KEY_GAP)
          if (key.pressure === 0) return
          const start = key.active ? c.activeStartColor : c.inactiveStartColor
          const end = key.active ? c.activeEndColor : c.inactiveEndColor
          ctx.fillStyle = lerpColor(start, end, key.pressure)
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
