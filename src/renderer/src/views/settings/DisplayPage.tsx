import { ItemGroup, ItemRow, ItemSeparator } from '../../components/settings/SettingsLayout'
import type { AppSettings } from '../../../../shared/types'

const isElectron = !!window.electron?.ipcRenderer

interface DisplayPageProps {
  settings: AppSettings
  set: (partial: Partial<AppSettings>) => void
}

export function DisplayPage({ settings, set }: DisplayPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Display</h2>

      {isElectron && settings.showVisualizer && (
        <ItemGroup>
          <ItemRow label="Window height">
            <input
              type="range"
              min={200}
              max={1200}
              step={10}
              value={settings.windowHeight}
              onChange={(e) => set({ windowHeight: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-xs text-neutral-500 w-12 text-right">
              {settings.windowHeight}px
            </span>
          </ItemRow>
        </ItemGroup>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-neutral-500 text-xs font-medium tracking-wide uppercase px-1">Counters</span>
        <ItemGroup>
          <ItemRow label="Show KPS">
          <input
            type="checkbox"
            checked={settings.showKps}
            onChange={(e) => set({ showKps: e.target.checked })}
            className="w-4 h-4"
          />
        </ItemRow>
        <ItemSeparator />
        <ItemRow label="Show BPM">
          <input
            type="checkbox"
            checked={settings.showBpm}
            onChange={(e) => set({ showBpm: e.target.checked })}
            className="w-4 h-4"
          />
        </ItemRow>
        <ItemSeparator />
        <ItemRow label="Counter position">
          <select
            value={settings.counterPosition}
            onChange={(e) =>
              set({ counterPosition: e.target.value as 'bottom' | 'left' | 'right' })
            }
            className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5"
          >
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
          </ItemRow>
        </ItemGroup>
      </div>
    </div>
  )
}
