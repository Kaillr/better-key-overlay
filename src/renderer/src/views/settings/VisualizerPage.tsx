import { ColorPicker } from '../../components/settings/ColorPicker'
import { ItemGroup, ItemRow, ItemSeparator } from '../../components/settings/SettingsLayout'
import type { AppSettings } from '../../../../shared/types'

interface VisualizerPageProps {
  settings: AppSettings
  set: (partial: Partial<AppSettings>) => void
}

export function VisualizerPage({ settings, set }: VisualizerPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Visualizer</h2>

      <ItemGroup>
        <ItemRow label="Show visualizer">
          <input
            type="checkbox"
            checked={settings.showVisualizer}
            onChange={(e) => set({ showVisualizer: e.target.checked })}
            className="w-4 h-4"
          />
        </ItemRow>
        {settings.showVisualizer && (
          <>
            <ItemSeparator />
            <ItemRow label="Speed">
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={settings.scrollRate}
                onChange={(e) => set({ scrollRate: Number(e.target.value) })}
                className="w-24"
              />
              <span className="text-xs text-neutral-500 w-14 text-right">
                {settings.scrollRate} px/s
              </span>
            </ItemRow>
            <ItemSeparator />
            <ItemRow label="Fade out at top">
              <input
                type="checkbox"
                checked={settings.fade.enabled}
                onChange={(e) => set({ fade: { ...settings.fade, enabled: e.target.checked } })}
                className="w-4 h-4"
              />
            </ItemRow>
            {settings.fade.enabled && (
              <>
                <ItemSeparator />
                <ItemRow label="Fade height">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={settings.fade.height}
                    onChange={(e) =>
                      set({ fade: { ...settings.fade, height: Number(e.target.value) } })
                    }
                    className="w-24"
                  />
                  <span className="text-xs text-neutral-500 w-10 text-right">
                    {settings.fade.height}%
                  </span>
                </ItemRow>
              </>
            )}
          </>
        )}
      </ItemGroup>

      <div>
        <h3 className="text-neutral-500 text-xs font-medium tracking-wide uppercase px-1 mb-2">
          Pressure Colors
        </h3>
        <ColorPicker colors={settings.colors} onChange={(colors) => set({ colors })} />
      </div>
    </div>
  )
}
