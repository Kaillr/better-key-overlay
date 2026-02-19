interface KeyPressureProps {
  label: string
  active: boolean
}

export function KeyPressure({ label, active }: KeyPressureProps) {
  return (
    <div
      className={`w-20 h-20 flex items-center justify-center text-2xl font-bold border-2 ${
        active ? 'border-white bg-neutral-700' : 'border-neutral-600 bg-neutral-900'
      }`}
    >
      {label}
    </div>
  )
}
