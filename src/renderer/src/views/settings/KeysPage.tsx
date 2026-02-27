import { KeyList } from '../../components/settings/KeyList'
import type { AppSettings } from '../../../../shared/types'

interface KeysPageProps {
  settings: AppSettings
  addKey: () => void
  removeKey: (index: number) => void
  recordKey: (index: number, code: string, key: string, uiohookKeycode: number) => void
}

export function KeysPage({ settings, addKey, removeKey, recordKey }: KeysPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Keys</h2>
      <KeyList keys={settings.keys} onRemove={removeKey} onRecord={recordKey} />
      <button
        onClick={addKey}
        disabled={settings.keys.some((k) => !k.code)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm w-full"
      >
        Add Key
      </button>
    </div>
  )
}
