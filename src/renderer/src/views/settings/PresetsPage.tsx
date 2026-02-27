import { useState } from 'react'
import { ItemGroup, ItemRow, ItemSeparator } from '../../components/settings/SettingsLayout'
import { uniquePresetName } from '../../../../shared/presets'
import type { Preset } from '../../../../shared/types'

interface PresetsPageProps {
  presets: Preset[]
  activePresetId: string
  onSelect: (id: string) => void
  onCreate: (name: string, fromDefaults: boolean) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onReset: () => void
  onExport: (id: string) => void
  onImport: () => void
}

export function PresetsPage({
  presets,
  activePresetId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onReset,
  onExport,
  onImport
}: PresetsPageProps) {
  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [creating, setCreating] = useState<{ name: string; fromDefaults: boolean } | null>(null)

  const activePreset = presets.find((p) => p.id === activePresetId) ?? presets[0]

  const existingNames = presets.filter((p) => p.id !== activePresetId).map((p) => p.name)

  const commitRename = () => {
    if (renameName.trim()) {
      onRename(activePresetId, uniquePresetName(renameName.trim(), existingNames))
    }
    setRenaming(false)
  }

  const allNames = presets.map((p) => p.name)

  const commitCreate = () => {
    if (creating && creating.name.trim()) {
      onCreate(uniquePresetName(creating.name.trim(), allNames), creating.fromDefaults)
    }
    setCreating(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Presets</h2>

      <ItemGroup>
        {renaming ? (
          <div className="flex items-center gap-2 p-4">
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              autoFocus
              className="flex-1 text-sm bg-neutral-700 border border-neutral-600 rounded px-2 py-0.5 outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => setRenaming(false)}
              className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <ItemRow label="Active preset">
            <button
              onClick={() => {
                setRenameName(activePreset.name)
                setRenaming(true)
              }}
              className="text-xs text-neutral-500 hover:text-neutral-300 px-1.5 py-1"
            >
              Rename
            </button>
            <button
              onClick={() => onExport(activePresetId)}
              className="text-xs text-neutral-500 hover:text-neutral-300 px-1.5 py-1"
            >
              Export
            </button>
            {presets.length > 1 && (
              <button
                onClick={() => onDelete(activePresetId)}
                className="text-xs text-red-400/70 hover:text-red-400 px-1.5 py-1"
              >
                Delete
              </button>
            )}
            <select
              value={activePresetId}
              onChange={(e) => onSelect(e.target.value)}
              className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </ItemRow>
        )}
        <ItemSeparator />
        {creating !== null ? (
          <div className="flex items-center gap-2 p-4">
            <input
              type="text"
              value={creating.name}
              onChange={(e) => setCreating({ ...creating, name: e.target.value })}
              onBlur={commitCreate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCreate()
                if (e.key === 'Escape') setCreating(null)
              }}
              placeholder="Preset name"
              autoFocus
              className="flex-1 text-sm bg-neutral-700 border border-neutral-600 rounded px-2 py-0.5 outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => setCreating(null)}
              className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <ItemRow label="New preset">
            <button
              onClick={() => setCreating({ name: '', fromDefaults: false })}
              className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 hover:bg-neutral-700"
            >
              From current
            </button>
            <button
              onClick={() => setCreating({ name: '', fromDefaults: true })}
              className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 hover:bg-neutral-700"
            >
              From defaults
            </button>
          </ItemRow>
        )}
      </ItemGroup>

      <button
        onClick={onImport}
        className="text-sm text-neutral-400 hover:text-neutral-300 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700"
      >
        Import preset
      </button>

      <button
        onClick={onReset}
        className="text-xs text-red-400 hover:text-red-300 py-1.5 self-center"
      >
        Reset current preset to defaults
      </button>
    </div>
  )
}
