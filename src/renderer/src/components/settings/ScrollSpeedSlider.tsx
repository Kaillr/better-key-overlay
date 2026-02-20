interface ScrollSpeedSliderProps {
  value: number
  onChange: (value: number) => void
}

export function ScrollSpeedSlider({ value, onChange }: ScrollSpeedSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={50}
        max={1000}
        step={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="font-mono w-24 text-right text-sm">{value} px/s</span>
    </div>
  )
}
