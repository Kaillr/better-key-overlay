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

  const toggleGradient = (enabled: boolean): void => {
    if (enabled) {
      onChange({
        ...colors,
        gradient: true,
        activeStartColor: colors.activeColor,
        activeEndColor: colors.activeColor,
        inactiveStartColor: colors.inactiveColor,
        inactiveEndColor: colors.inactiveColor
      })
    } else {
      onChange({
        activeColor: colors.activeColor,
        inactiveColor: colors.inactiveColor,
        gradient: false
      })
    }
  }

  return (
    <ItemGroup>
      {colors.gradient ? (
        <>
          <ItemRow label="Active">
            <HexColorInput
              value={colors.activeStartColor ?? colors.activeColor}
              onChange={(v) => update({ activeStartColor: v })}
            />
            <HexColorInput
              value={colors.activeEndColor ?? colors.activeColor}
              onChange={(v) => update({ activeEndColor: v })}
            />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label="Inactive">
            <HexColorInput
              value={colors.inactiveStartColor ?? colors.inactiveColor}
              onChange={(v) => update({ inactiveStartColor: v })}
            />
            <HexColorInput
              value={colors.inactiveEndColor ?? colors.inactiveColor}
              onChange={(v) => update({ inactiveEndColor: v })}
            />
          </ItemRow>
        </>
      ) : (
        <>
          <ItemRow label="Active">
            <HexColorInput
              value={colors.activeColor}
              onChange={(v) => update({ activeColor: v })}
            />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label="Inactive">
            <HexColorInput
              value={colors.inactiveColor}
              onChange={(v) => update({ inactiveColor: v })}
            />
          </ItemRow>
        </>
      )}
      <ItemSeparator />
      <ItemRow label="Pressure gradient">
        <input
          type="checkbox"
          checked={colors.gradient}
          onChange={(e) => toggleGradient(e.target.checked)}
          className="w-4 h-4"
        />
      </ItemRow>
    </ItemGroup>
  )
}
