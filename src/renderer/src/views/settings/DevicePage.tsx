import { useCallback, useEffect, useState } from 'react'
import { ItemGroup, ItemRow, ItemSeparator } from '../../components/settings/SettingsLayout'
import { getDevices, requestDevice, type AnalogDevice } from '../../lib/devices'

const isElectron = !!window.electron?.ipcRenderer

export function DevicePage() {
  const [connectedDevices, setConnectedDevices] = useState<AnalogDevice[]>([])

  useEffect(() => {
    const refresh = () => {
      getDevices().then(setConnectedDevices)
    }
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [])

  const connectDevice = useCallback(async () => {
    const dev = await requestDevice()
    if (dev) {
      const devs = await getDevices()
      setConnectedDevices(devs)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Device</h2>

      <ItemGroup>
        {connectedDevices.length > 0 ? (
          connectedDevices.map((dev, i) => (
            <div key={i}>
              {i > 0 && <ItemSeparator />}
              <ItemRow label={dev.getProductName()} description="Connected" />
            </div>
          ))
        ) : (
          <ItemRow label="No devices connected" />
        )}
        {!isElectron && navigator.hid && (
          <>
            <ItemSeparator />
            <ItemRow label="Add device">
              <button
                onClick={connectDevice}
                className="px-3 py-1.5 text-xs rounded-lg border border-neutral-600 hover:border-neutral-500 bg-neutral-800"
              >
                Connect
              </button>
            </ItemRow>
          </>
        )}
      </ItemGroup>
    </div>
  )
}
