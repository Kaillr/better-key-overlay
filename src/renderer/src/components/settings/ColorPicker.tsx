import { parseHsla } from '../../lib/color'
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

function hslaToHex(hsla: string): string {
  const { h, s, l } = parseHsla(hsla)
  const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100)
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l / 100 - c / 2
  let r = 0,
    g = 0,
    b = 0
  if (h < 60) {
    r = c; g = x
  } else if (h < 120) {
    r = x; g = c
  } else if (h < 180) {
    g = c; b = x
  } else if (h < 240) {
    g = x; b = c
  } else if (h < 300) {
    r = x; b = c
  } else {
    r = c; b = x
  }
  const toHex = (v: number): string =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const parsed = parseHsla(value)
  const hex = hslaToHex(value)

  return (
    <div className="space-y-1">
      <label className="text-sm text-neutral-400">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            const { h, s, l } = hexToHsl(e.target.value)
            onChange(`hsla(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, ${parsed.a})`)
          }}
          className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(parsed.a * 100)}
          onChange={(e) => {
            const a = Number(e.target.value) / 100
            onChange(
              `hsla(${parsed.h.toFixed(0)}, ${parsed.s.toFixed(0)}%, ${parsed.l.toFixed(0)}%, ${a})`
            )
          }}
          className="flex-1"
        />
        <span className="text-xs text-neutral-500 w-10 text-right">
          {Math.round(parsed.a * 100)}%
        </span>
      </div>
    </div>
  )
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const update = (key: keyof ColorConfig, value: string): void => {
    onChange({ ...colors, [key]: value })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <ColorInput
        label="Active (low pressure)"
        value={colors.activeStartColor}
        onChange={(v) => update('activeStartColor', v)}
      />
      <ColorInput
        label="Active (high pressure)"
        value={colors.activeEndColor}
        onChange={(v) => update('activeEndColor', v)}
      />
      <ColorInput
        label="Inactive (low pressure)"
        value={colors.inactiveStartColor}
        onChange={(v) => update('inactiveStartColor', v)}
      />
      <ColorInput
        label="Inactive (high pressure)"
        value={colors.inactiveEndColor}
        onChange={(v) => update('inactiveEndColor', v)}
      />
    </div>
  )
}
