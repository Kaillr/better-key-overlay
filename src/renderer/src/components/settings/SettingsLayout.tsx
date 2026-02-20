interface SectionProps {
  title: string
  children: React.ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-neutral-500 text-xs font-medium tracking-wide uppercase px-1">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function ItemGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-neutral-700 rounded-xl bg-neutral-800/50 flex flex-col">
      {children}
    </div>
  )
}

export function ItemSeparator() {
  return <div className="border-t border-neutral-700 mx-4" />
}

interface ItemRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

export function ItemRow({ label, description, children }: ItemRowProps) {
  return (
    <div className="flex items-center justify-between p-4 gap-4">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-xs text-neutral-500">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  )
}
