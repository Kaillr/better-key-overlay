import { useEffect, useState } from 'react'
import { ItemGroup, ItemRow, ItemSeparator } from '../../components/settings/SettingsLayout'
import { DeviceDiagnostics } from '../../components/settings/DeviceDiagnostics'
import { listConnectedDeviceNames } from '../../lib/devices'

export function DevicePage() {
  const [connectedNames, setConnectedNames] = useState<string[]>([])

  useEffect(() => {
    const refresh = () => listConnectedDeviceNames().then(setConnectedNames)
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Device</h2>

      <ItemGroup>
        {connectedNames.length > 0 ? (
          connectedNames.map((name, i) => (
            <div key={i}>
              {i > 0 && <ItemSeparator />}
              <ItemRow label={name} description="Connected" />
            </div>
          ))
        ) : (
          <ItemRow label="No devices connected" />
        )}
      </ItemGroup>

      <DeviceDiagnostics />
    </div>
  )
}
