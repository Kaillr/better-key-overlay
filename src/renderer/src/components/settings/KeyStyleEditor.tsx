import { HexColorInput } from './HexColorInput'
import { ItemRow, ItemSeparator, ItemGroup } from './SettingsLayout'
import type { KeyStyle } from '../../../../shared/types'

interface KeyStyleEditorProps {
  keyStyle: KeyStyle
  onChange: (keyStyle: KeyStyle) => void
}

type StyleProp = 'borderColor' | 'backgroundColor' | 'textColor'
type GradientProp = 'borderColorGradient' | 'backgroundColorGradient' | 'textColorGradient'

function PropertyGroup({
  label,
  prop,
  gradientProp,
  keyStyle,
  onChange
}: {
  label: string
  prop: StyleProp
  gradientProp: GradientProp
  keyStyle: KeyStyle
  onChange: (keyStyle: KeyStyle) => void
}) {
  const { active, inactive } = keyStyle
  const gradient = active[gradientProp] || inactive[gradientProp]

  const toggleGradient = (enabled: boolean) => {
    onChange({
      ...keyStyle,
      active: { ...active, [gradientProp]: enabled },
      inactive: { ...inactive, [gradientProp]: enabled }
    })
  }

  const setActivePair = (index: 0 | 1, value: string) => {
    const pair = [...active[prop]] as [string, string]
    pair[index] = value
    onChange({ ...keyStyle, active: { ...active, [prop]: pair } })
  }

  const setInactivePair = (index: 0 | 1, value: string) => {
    const pair = [...inactive[prop]] as [string, string]
    pair[index] = value
    onChange({ ...keyStyle, inactive: { ...inactive, [prop]: pair } })
  }

  const setActiveBoth = (value: string) => {
    onChange({ ...keyStyle, active: { ...active, [prop]: [value, value] } })
  }

  const setInactiveBoth = (value: string) => {
    onChange({ ...keyStyle, inactive: { ...inactive, [prop]: [value, value] } })
  }

  const title = label.charAt(0).toUpperCase() + label.slice(1) + ' color'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-neutral-500 text-xs font-medium tracking-wide uppercase px-1">{title}</span>
      <ItemGroup>
      {gradient ? (
        <>
          <ItemRow label={`Active ${label}`}>
            <HexColorInput value={active[prop][0]} onChange={(v) => setActivePair(0, v)} />
            <HexColorInput value={active[prop][1]} onChange={(v) => setActivePair(1, v)} />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label={`Inactive ${label}`}>
            <HexColorInput value={inactive[prop][0]} onChange={(v) => setInactivePair(0, v)} />
            <HexColorInput value={inactive[prop][1]} onChange={(v) => setInactivePair(1, v)} />
          </ItemRow>
        </>
      ) : (
        <>
          <ItemRow label={`Active ${label}`}>
            <HexColorInput value={active[prop][1]} onChange={setActiveBoth} />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label={`Inactive ${label}`}>
            <HexColorInput value={inactive[prop][0]} onChange={setInactiveBoth} />
          </ItemRow>
        </>
      )}
      <ItemSeparator />
      <ItemRow label="Pressure gradient">
        <input
          type="checkbox"
          checked={gradient}
          onChange={(e) => toggleGradient(e.target.checked)}
          className="w-4 h-4"
        />
      </ItemRow>
    </ItemGroup>
    </div>
  )
}

export function KeyStyleEditor({ keyStyle, onChange }: KeyStyleEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <ItemGroup>
        <ItemRow label="Border width">
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={keyStyle.borderWidth}
            onChange={(e) => onChange({ ...keyStyle, borderWidth: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-xs text-neutral-500 w-8 text-right">{keyStyle.borderWidth}px</span>
        </ItemRow>
        <ItemSeparator />
        <ItemRow label="Corner radius">
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={keyStyle.borderRadius}
            onChange={(e) => onChange({ ...keyStyle, borderRadius: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-xs text-neutral-500 w-8 text-right">{keyStyle.borderRadius}px</span>
        </ItemRow>
      </ItemGroup>
      <PropertyGroup
        label="border"
        prop="borderColor"
        gradientProp="borderColorGradient"
        keyStyle={keyStyle}
        onChange={onChange}
      />
      <PropertyGroup
        label="background"
        prop="backgroundColor"
        gradientProp="backgroundColorGradient"
        keyStyle={keyStyle}
        onChange={onChange}
      />
      <PropertyGroup
        label="text"
        prop="textColor"
        gradientProp="textColorGradient"
        keyStyle={keyStyle}
        onChange={onChange}
      />
    </div>
  )
}
