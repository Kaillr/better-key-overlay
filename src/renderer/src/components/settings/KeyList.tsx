import type { KeyConfigEntry } from '../../../../shared/types'

interface KeyListProps {
  keys: KeyConfigEntry[]
  onRemove: (code: string) => void
}

export function KeyList({ keys, onRemove }: KeyListProps) {
  if (keys.length === 0) {
    return <p className="text-neutral-500 text-sm">No keys configured</p>
  }

  return (
    <ul className="space-y-2">
      {keys.map((key) => (
        <li
          key={key.code}
          className="flex items-center justify-between p-2 bg-neutral-800 rounded"
        >
          <span className="font-mono">
            {key.label}{' '}
            <span className="text-neutral-500 text-sm">({key.code})</span>
          </span>
          <button
            onClick={() => onRemove(key.code)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
