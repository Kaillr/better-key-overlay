import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import type { KeyConfigEntry, ColorConfig } from '../../../../shared/types'

interface KeyListProps {
  keys: KeyConfigEntry[]
  globalColors: ColorConfig
  onRemove: (code: string) => void
  onUpdateKeyColors: (code: string, colors: ColorConfig | undefined) => void
}

export function KeyList({ keys, globalColors, onRemove, onUpdateKeyColors }: KeyListProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  if (keys.length === 0) {
    return <p className="text-neutral-500 text-sm">No keys configured</p>
  }

  return (
    <ul className="space-y-2">
      {keys.map((key) => {
        const isExpanded = expandedKey === key.code
        const hasCustomColors = !!key.colors

        return (
          <li key={key.code} className="bg-neutral-800 rounded overflow-hidden">
            <div className="flex items-center justify-between p-2">
              <button
                onClick={() => setExpandedKey(isExpanded ? null : key.code)}
                className="font-mono text-left flex-1"
              >
                {key.label}{' '}
                <span className="text-neutral-500 text-sm">({key.code})</span>
                {hasCustomColors && (
                  <span className="text-blue-400 text-xs ml-2">custom colors</span>
                )}
              </button>
              <button
                onClick={() => onRemove(key.code)}
                className="text-red-400 hover:text-red-300 text-sm ml-2"
              >
                Remove
              </button>
            </div>
            {isExpanded && (
              <div className="px-2 pb-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCustomColors}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onUpdateKeyColors(key.code, { ...globalColors })
                      } else {
                        onUpdateKeyColors(key.code, undefined)
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Use custom colors</span>
                </label>
                {hasCustomColors && (
                  <ColorPicker
                    colors={key.colors!}
                    onChange={(colors) => onUpdateKeyColors(key.code, colors)}
                  />
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
