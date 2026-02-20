import type { KeyStyle, KeyStyleState } from '../../../../shared/types'

interface KeyStyleEditorProps {
  keyStyle: KeyStyle
  onChange: (keyStyle: KeyStyle) => void
}

interface ColorPairProps {
  label: string
  value: [string, string]
  onChange: (value: [string, string]) => void
}

function ColorPair({ label, value, onChange }: ColorPairProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <input
            type="color"
            value={value[0]}
            onChange={(e) => onChange([e.target.value, value[1]])}
            className="w-7 h-5 cursor-pointer border-0 bg-transparent"
          />
          <span className="text-[10px] text-neutral-600">low</span>
        </div>
        <div className="flex flex-col items-center">
          <input
            type="color"
            value={value[1]}
            onChange={(e) => onChange([value[0], e.target.value])}
            className="w-7 h-5 cursor-pointer border-0 bg-transparent"
          />
          <span className="text-[10px] text-neutral-600">high</span>
        </div>
      </div>
    </div>
  )
}

function StateEditor({
  label,
  state,
  onChange,
}: {
  label: string
  state: KeyStyleState
  onChange: (state: KeyStyleState) => void
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-neutral-300">{label}</h4>
      <div className="space-y-2 pl-2">
        <ColorPair
          label="Border"
          value={state.borderColor}
          onChange={(v) => onChange({ ...state, borderColor: v })}
        />
        <ColorPair
          label="Background"
          value={state.backgroundColor}
          onChange={(v) => onChange({ ...state, backgroundColor: v })}
        />
        <ColorPair
          label="Text"
          value={state.textColor}
          onChange={(v) => onChange({ ...state, textColor: v })}
        />
      </div>
    </div>
  )
}

export function KeyStyleEditor({ keyStyle, onChange }: KeyStyleEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <StateEditor
          label="Active"
          state={keyStyle.active}
          onChange={(active) => onChange({ ...keyStyle, active })}
        />
        <StateEditor
          label="Inactive"
          state={keyStyle.inactive}
          onChange={(inactive) => onChange({ ...keyStyle, inactive })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="text-sm text-neutral-400 w-28">Border width</label>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={keyStyle.borderWidth}
            onChange={(e) => onChange({ ...keyStyle, borderWidth: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-neutral-500 w-10 text-right">{keyStyle.borderWidth}px</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-neutral-400 w-28">Corner radius</label>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={keyStyle.borderRadius}
            onChange={(e) => onChange({ ...keyStyle, borderRadius: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-neutral-500 w-10 text-right">{keyStyle.borderRadius}px</span>
        </div>
      </div>
    </div>
  )
}
