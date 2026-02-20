import type { ColorConfig } from '../../../../shared/types'

interface ColorPickerProps {
  colors: ColorConfig
  onChange: (colors: ColorConfig) => void
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
      />
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
          <ColorInput
            label="Low pressure"
            value={colors.activeStartColor}
            onChange={(v) => update('activeStartColor', v)}
          />
          <ColorInput
            label="High pressure"
            value={colors.activeEndColor}
            onChange={(v) => update('activeEndColor', v)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-neutral-300">Inactive</h4>
        <div className="space-y-2 pl-2">
          <ColorInput
            label="Low pressure"
            value={colors.inactiveStartColor}
            onChange={(v) => update('inactiveStartColor', v)}
          />
          <ColorInput
            label="High pressure"
            value={colors.inactiveEndColor}
            onChange={(v) => update('inactiveEndColor', v)}
          />
        </div>
      </div>
    </div>
  )
}
