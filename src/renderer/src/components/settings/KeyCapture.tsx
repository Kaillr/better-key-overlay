import { useEffect } from 'react'

interface KeyCaptureProps {
  onCapture: (code: string, key: string) => void
  onCancel: () => void
}

export function KeyCapture({ onCapture, onCancel }: KeyCaptureProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      e.preventDefault()
      if (e.code === 'Escape') {
        onCancel()
        return
      }
      onCapture(e.code, e.key)
    }

    window.addEventListener('keydown', handler, { once: true })
    return () => window.removeEventListener('keydown', handler)
  }, [onCapture, onCancel])

  return (
    <div className="mt-3 p-4 border-2 border-dashed border-blue-400 rounded text-center text-blue-300">
      Press any key... <span className="text-neutral-500">(Escape to cancel)</span>
    </div>
  )
}
