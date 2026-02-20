interface HexColorInputProps {
  value: string
  onChange: (value: string) => void
}

export function HexColorInput({ value, onChange }: HexColorInputProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-5 cursor-pointer border-0 bg-transparent"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
        }}
        onBlur={(e) => {
          let v = e.target.value.trim()
          if (!v.startsWith('#')) v = '#' + v
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
        }}
        className="w-[4.5rem] text-xs font-mono bg-neutral-700 text-neutral-300 px-1 py-0.5 rounded border border-neutral-600"
      />
    </div>
  )
}
