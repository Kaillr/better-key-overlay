import { useEffect, useRef } from 'react'
import { keys } from '../lib/pressureStore'
import { lerpColor } from '../lib/color'
import { KEY_WIDTH, KEY_GAP } from '../../../shared/config'
import type { ColorConfig, FadeConfig } from '../../../shared/types'

interface PressureCanvasProps {
  scrollRate: number
  colors: ColorConfig
  fade: FadeConfig
}

export function PressureCanvas({ scrollRate, colors, fade }: PressureCanvasProps) {
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
    let scrollOffset = 0

    const resize = () => {
      const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)
      canvas.width = canvasWidth || 1
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement!)

    const drawRow = (y: number) => {
      const canvasWidth = KEY_WIDTH * keys.length + KEY_GAP * (keys.length - 1)
      const c = colorsRef.current
      ctx.clearRect(0, y, canvasWidth, 1)
      keys.forEach((key, i) => {
        const xOffset = i * (KEY_WIDTH + KEY_GAP)
        if (key.pressure === 0) return
        const kc = key.colors ?? c
        if (kc.gradient) {
          const start = key.active ? kc.activeStartColor : kc.inactiveStartColor
          const end = key.active ? kc.activeEndColor : kc.inactiveEndColor
          ctx.fillStyle = lerpColor(start, end, key.pressure)
        } else {
          ctx.fillStyle = key.active ? kc.activeEndColor : kc.inactiveStartColor
        }
        ctx.fillRect(xOffset, y, KEY_WIDTH, 1)
      })
    }

    const draw = (time: number) => {
      const dt = lastTime === 0 ? 0 : (time - lastTime) / 1000
      lastTime = time

      const h = canvas.height
      scrollOffset += dt * scrollRateRef.current

      const pixelsToScroll = Math.floor(scrollOffset)
      scrollOffset -= pixelsToScroll

      if (pixelsToScroll > 0) {
        ctx.globalCompositeOperation = 'copy'
        ctx.drawImage(canvas, 0, -pixelsToScroll)
        ctx.globalCompositeOperation = 'source-over'

        // Draw new rows at the bottom
        for (let row = 0; row < pixelsToScroll; row++) {
          drawRow(h - pixelsToScroll + row)
        }
      }

      // Always redraw the last row with current pressure
      drawRow(h - 1)

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      {fade.enabled && fade.height > 0 && (
        <div
          className="absolute top-0 left-0 w-full pointer-events-none"
          style={{
            height: `${fade.height}%`,
            background: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
      )}
    </div>
  )
}
