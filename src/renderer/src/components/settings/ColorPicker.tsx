import { HexColorInput } from './HexColorInput'
import { ItemRow, ItemSeparator, ItemGroup } from './SettingsLayout'
import type { ColorConfig } from '../../../../shared/types'

interface ColorPickerProps {
  colors: ColorConfig
  onChange: (colors: ColorConfig) => void
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const update = (partial: Partial<ColorConfig>): void => {
    onChange({ ...colors, ...partial })
  }

  return (
    <ItemGroup>
      {colors.gradient ? (
        <>
          <ItemRow label="Active">
            <HexColorInput
              value={colors.activeStartColor}
              onChange={(v) => update({ activeStartColor: v })}
            />
            <HexColorInput
              value={colors.activeEndColor}
              onChange={(v) => update({ activeEndColor: v })}
            />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label="Inactive">
            <HexColorInput
              value={colors.inactiveStartColor}
              onChange={(v) => update({ inactiveStartColor: v })}
            />
            <HexColorInput
              value={colors.inactiveEndColor}
              onChange={(v) => update({ inactiveEndColor: v })}
            />
          </ItemRow>
        </>
      ) : (
        <>
          <ItemRow label="Active">
            <HexColorInput
              value={colors.activeEndColor}
              onChange={(v) => update({ activeEndColor: v })}
            />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label="Inactive">
            <HexColorInput
              value={colors.inactiveStartColor}
              onChange={(v) => update({ inactiveStartColor: v })}
            />
          </ItemRow>
        </>
      )}
      <ItemSeparator />
      <ItemRow label="Pressure gradient">
        <input
          type="checkbox"
          checked={colors.gradient}
          onChange={(e) => update({ gradient: e.target.checked })}
          className="w-4 h-4"
        />
      </ItemRow>
    </ItemGroup>
  )
}
