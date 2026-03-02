import { useEffect, useState } from 'react'
import {
  ItemGroup,
  ItemRow,
  ItemSeparator,
  Section
} from '../../components/settings/SettingsLayout'
import type { AppSettings } from '../../../../shared/types'

const ipcRenderer = window.electron?.ipcRenderer
const isElectron = !!ipcRenderer

interface DisplayPageProps {
  settings: AppSettings
  set: (partial: Partial<AppSettings>) => void
}

export function DisplayPage({ settings, set }: DisplayPageProps) {
  const [serverEnabled, setServerEnabled] = useState(false)
  const [serverPort, setServerPort] = useState(1727)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!ipcRenderer) return
    ipcRenderer.invoke('server:get').then((data: { enabled: boolean; port: number }) => {
      setServerEnabled(data.enabled)
      setServerPort(data.port)
    })
  }, [])

  const updateServer = (enabled: boolean, port: number): void => {
    setServerEnabled(enabled)
    setServerPort(port)
    ipcRenderer?.invoke('server:set', { enabled, port })
  }

  const copyUrl = (): void => {
    navigator.clipboard.writeText(`http://localhost:${serverPort}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Display</h2>

      {isElectron && settings.showVisualizer && (
        <ItemGroup>
          <ItemRow label="Window height">
            <input
              type="range"
              min={200}
              max={1200}
              step={10}
              value={settings.windowHeight}
              onChange={(e) => set({ windowHeight: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-xs text-neutral-500 w-12 text-right">
              {settings.windowHeight}px
            </span>
          </ItemRow>
        </ItemGroup>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-neutral-500 text-xs font-medium tracking-wide uppercase px-1">
          Counters
        </span>
        <ItemGroup>
          <ItemRow label="Show KPS">
            <input
              type="checkbox"
              checked={settings.showKps}
              onChange={(e) => set({ showKps: e.target.checked })}
              className="w-4 h-4"
            />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label="Show BPM">
            <input
              type="checkbox"
              checked={settings.showBpm}
              onChange={(e) => set({ showBpm: e.target.checked })}
              className="w-4 h-4"
            />
          </ItemRow>
          <ItemSeparator />
          <ItemRow label="Counter position">
            <select
              value={settings.counterPosition}
              onChange={(e) =>
                set({ counterPosition: e.target.value as 'bottom' | 'left' | 'right' })
              }
              className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5"
            >
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </ItemRow>
        </ItemGroup>
      </div>
      {isElectron && (
        <Section title="OBS Browser Source">
          <ItemGroup>
            <ItemRow
              label="Enable server"
              description="Serve the overlay on a local URL for OBS browser source"
            >
              <input
                type="checkbox"
                checked={serverEnabled}
                onChange={(e) => updateServer(e.target.checked, serverPort)}
                className="w-4 h-4"
              />
            </ItemRow>
            {serverEnabled && (
              <>
                <ItemSeparator />
                <ItemRow label="Port">
                  <input
                    type="number"
                    min={1024}
                    max={65535}
                    value={serverPort}
                    onChange={(e) => {
                      const port = Number(e.target.value)
                      if (port >= 1024 && port <= 65535) updateServer(true, port)
                    }}
                    className="w-20 text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 text-right"
                  />
                </ItemRow>
                <ItemSeparator />
                <ItemRow label="URL">
                  <button
                    onClick={copyUrl}
                    className="text-xs text-neutral-400 hover:text-neutral-300 font-mono"
                  >
                    {copied ? 'Copied!' : `http://localhost:${serverPort}`}
                  </button>
                </ItemRow>
              </>
            )}
          </ItemGroup>
        </Section>
      )}
    </div>
  )
}
