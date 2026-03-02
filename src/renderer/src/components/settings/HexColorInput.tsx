import { useState, useEffect } from 'react'

interface HexColorInputProps {
  value: string
  onChange: (value: string) => void
}

export function HexColorInput({ value, onChange }: HexColorInputProps) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  const commit = (v: string) => {
    let hex = v.trim()
    if (!hex.startsWith('#')) hex = '#' + hex
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange((hex + 'ff').toLowerCase())
    } else if (/^#[0-9a-fA-F]{8}$/.test(hex)) {
      onChange(hex.toLowerCase())
    } else {
      setText(value)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        value={value.slice(0, 7)}
        onChange={(e) => onChange(e.target.value + (value.length >= 9 ? value.slice(7, 9) : 'ff'))}
        className="w-7 h-5 cursor-pointer border-0 bg-transparent"
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(text)
        }}
        className="w-[4.5rem] text-xs font-mono bg-neutral-700 text-neutral-300 px-1 py-0.5 rounded border border-neutral-600"
      />
    </div>
  )
}
