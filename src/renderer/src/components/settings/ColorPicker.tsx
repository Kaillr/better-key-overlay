import { HexColorInput } from './HexColorInput'
import type { ColorConfig } from '../../../../shared/types'

interface ColorPickerProps {
  colors: ColorConfig
  onChange: (colors: ColorConfig) => void
}

interface ColorRowProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-400">{label}</span>
      <HexColorInput value={value} onChange={onChange} />
    </div>
  )
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const update = (key: keyof ColorConfig, value: string): void => {
    onChange({ ...colors, [key]: value })
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-neutral-300">Active</h4>
        <div className="space-y-2 pl-2">
          <ColorRow
            label="Low pressure"
            value={colors.activeStartColor}
            onChange={(v) => update('activeStartColor', v)}
          />
          <ColorRow
            label="High pressure"
            value={colors.activeEndColor}
            onChange={(v) => update('activeEndColor', v)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-neutral-300">Inactive</h4>
        <div className="space-y-2 pl-2">
          <ColorRow
            label="Low pressure"
            value={colors.inactiveStartColor}
            onChange={(v) => update('inactiveStartColor', v)}
          />
          <ColorRow
            label="High pressure"
            value={colors.inactiveEndColor}
            onChange={(v) => update('inactiveEndColor', v)}
          />
        </div>
      </div>
    </div>
  )
}
