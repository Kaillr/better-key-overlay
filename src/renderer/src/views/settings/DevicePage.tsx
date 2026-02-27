import { useCallback, useEffect, useState } from 'react'
import { ItemGroup, ItemRow, ItemSeparator } from '../../components/settings/SettingsLayout'
import { DeviceDiagnostics } from '../../components/settings/DeviceDiagnostics'
import {
  listConnectedDeviceNames,
  getCustomDevices,
  addCustomDevice,
  removeCustomDevice,
  type CustomDeviceConfig
} from '../../lib/devices'

const isElectron = !!window.electron?.ipcRenderer

export function DevicePage() {
  const [connectedNames, setConnectedNames] = useState<string[]>([])
  const [customDevices, setCustomDevices] = useState<CustomDeviceConfig[]>([])
  const [availableHidDevices, setAvailableHidDevices] = useState<HIDDevice[]>([])
  const [selectValue, setSelectValue] = useState('')

  useEffect(() => {
    setCustomDevices(getCustomDevices())
  }, [])

  useEffect(() => {
    const refresh = () => {
      listConnectedDeviceNames().then(setConnectedNames)
    }
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [customDevices])

  const refreshAvailableDevices = useCallback(async () => {
    if (!navigator.hid) return
    const devices = await navigator.hid.getDevices()
    const seen = new Set<string>()
    const filtered: HIDDevice[] = []
    for (const d of devices) {
      if (!d.productName) continue
      const key = `${d.vendorId}:${d.productId}`
      if (seen.has(key)) continue
      seen.add(key)
      // Skip devices already in custom list
      if (customDevices.some((c) => c.vendorId === d.vendorId && c.productId === d.productId)) continue
      filtered.push(d)
    }
    setAvailableHidDevices(filtered)
  }, [customDevices])

  const handleAddCustom = useCallback(async (dev: HIDDevice) => {
    const config: CustomDeviceConfig = {
      vendorId: dev.vendorId,
      productId: dev.productId,
      name: dev.productName || 'Unknown device'
    }
    addCustomDevice(config)
    setCustomDevices(getCustomDevices())
    setAvailableHidDevices((prev) => prev.filter((d) => d.vendorId !== dev.vendorId || d.productId !== dev.productId))
  }, [])

  const handleRemoveCustom = useCallback((vendorId: number, productId: number) => {
    removeCustomDevice(vendorId, productId)
    setCustomDevices(getCustomDevices())
  }, [])

  const requestNewDevice = useCallback(async () => {
    if (!navigator.hid) return
    await navigator.hid.requestDevice({ filters: [] })
    await refreshAvailableDevices()
  }, [refreshAvailableDevices])

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

      {navigator.hid && (
        <div className="flex flex-col gap-2">
          <span className="text-neutral-500 text-xs font-medium tracking-wide uppercase px-1">Unsupported devices</span>
          <ItemGroup>
            {customDevices.map((dev, i) => (
              <div key={`${dev.vendorId}:${dev.productId}`}>
                {i > 0 && <ItemSeparator />}
                <ItemRow label={dev.name}>
                  <button
                    onClick={() => handleRemoveCustom(dev.vendorId, dev.productId)}
                    className="text-xs text-red-400/70 hover:text-red-400 px-1.5 py-1"
                  >
                    Remove
                  </button>
                </ItemRow>
              </div>
            ))}
            {customDevices.length > 0 && <ItemSeparator />}
            <ItemRow label="Add unsupported device">
              <select
                value={selectValue}
                onFocus={refreshAvailableDevices}
                onChange={(e) => {
                  const dev = availableHidDevices[Number(e.target.value)]
                  if (dev) handleAddCustom(dev)
                  setSelectValue('')
                }}
                className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 max-w-[200px]"
              >
                <option value="" disabled>Select device</option>
                {availableHidDevices.map((d, i) => (
                  <option key={i} value={i}>{d.productName} (0x{d.vendorId.toString(16)})</option>
                ))}
              </select>
              {!isElectron && (
                <button
                  onClick={requestNewDevice}
                  className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 hover:bg-neutral-700"
                >
                  +
                </button>
              )}
            </ItemRow>
          </ItemGroup>
          <p className="text-xs text-neutral-600 px-1">
            If your analog keyboard isn't automatically detected, add it here to try generic analog input. If it doesn't work, use Device Diagnostics below to export your device info and open an issue on GitHub.
          </p>
        </div>
      )}

      <DeviceDiagnostics />
    </div>
  )
}
