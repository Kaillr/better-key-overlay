import { KeyStyleEditor } from '../../components/settings/KeyStyleEditor'
import type { AppSettings } from '../../../../shared/types'

interface KeyStylePageProps {
  settings: AppSettings
  set: (partial: Partial<AppSettings>) => void
}

export function KeyStylePage({ settings, set }: KeyStylePageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Key Style</h2>
      <KeyStyleEditor keyStyle={settings.keyStyle} onChange={(keyStyle) => set({ keyStyle })} />
    </div>
  )
}
