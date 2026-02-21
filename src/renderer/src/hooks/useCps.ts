import { useCallback, useEffect, useRef, useState } from 'react'

const TIME_WINDOW = 1 // seconds
const UPDATE_INTERVAL = 100 // ms

function calculateCps(times: number[], now: number): number {
  // Prune timestamps older than the window
  while (times.length > 0 && now - times[0] >= TIME_WINDOW) {
    times.shift()
  }

  if (times.length <= 1) return 0

  const span = times[times.length - 1] - times[0]
  if (span <= 0) return 0

  return (times.length - 1) / span
}

export function useCps() {
  const timesRef = useRef<number[]>([])
  const [cps, setCps] = useState(0)

  const recordPress = useCallback(() => {
    timesRef.current.push(performance.now() / 1000)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now() / 1000
      setCps(calculateCps(timesRef.current, now))
    }, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  return { cps, recordPress }
}
