import { useEffect, useState, useRef } from 'react'
import { ItemSeparator, ItemGroup } from './SettingsLayout'
import type { KeyConfigEntry } from '../../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer

interface KeyListProps {
  keys: KeyConfigEntry[]
  onRemove: (index: number) => void
  onRecord: (index: number, code: string, key: string, uiohookKeycode: number) => void
}

export function KeyList({ keys, onRemove, onRecord }: KeyListProps) {
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null)
  const captureRef = useRef<Promise<number> | null>(null)
  const prevLengthRef = useRef(keys.length)

  // Auto-start recording when a new unassigned key is added
  useEffect(() => {
    if (keys.length > prevLengthRef.current) {
      const lastIndex = keys.length - 1
      if (!keys[lastIndex].code) {
        startRecording(lastIndex)
      }
    }
    prevLengthRef.current = keys.length
  }, [keys.length])

  const startRecording = (index: number) => {
    captureRef.current = ipcRenderer?.invoke('settings:capture-key') as Promise<number>
    setRecordingIndex(index)
  }

  const cancelRecording = () => {
    ipcRenderer?.invoke('settings:cancel-capture')
    captureRef.current = null
    setRecordingIndex(null)
  }

  useEffect(() => {
    if (recordingIndex === null) return

    const handler = async (e: KeyboardEvent) => {
      e.preventDefault()
      if (e.code === 'Escape') {
        cancelRecording()
        return
      }
      const uiohookKeycode = (await captureRef.current) ?? 0
      captureRef.current = null
      setRecordingIndex(null)
      onRecord(recordingIndex, e.code, e.key, uiohookKeycode)
    }

    window.addEventListener('keydown', handler, { once: true })
    return () => window.removeEventListener('keydown', handler)
  }, [recordingIndex, onRecord])

  if (keys.length === 0) return null

  return (
    <ItemGroup>
      {keys.map((key, i) => (
        <div key={i}>
          {i > 0 && <ItemSeparator />}
          <div className="flex items-center justify-between p-4 gap-3">
            <span className="text-sm font-mono text-neutral-300 flex-1">
              {recordingIndex === i ? (
                <span className="text-blue-300">Press any key...</span>
              ) : key.code ? (
                key.label
              ) : (
                <span className="text-neutral-500">No Keybind Set</span>
              )}
            </span>
            <button
              onClick={() =>
                recordingIndex === i ? cancelRecording() : startRecording(i)
              }
              className="px-3 py-1.5 text-xs rounded-lg border border-neutral-600 hover:border-neutral-500 bg-neutral-800"
            >
              {recordingIndex === i ? 'Cancel' : 'Record Keybind'}
            </button>
            <button
              onClick={() => onRemove(i)}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </ItemGroup>
  )
}
