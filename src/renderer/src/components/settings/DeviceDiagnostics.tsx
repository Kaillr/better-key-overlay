import { useState, useRef, useCallback, useEffect } from 'react'
import { ItemGroup, ItemRow, ItemSeparator } from './SettingsLayout'

const isElectron = !!window.electron?.ipcRenderer

interface HIDCollectionInfo {
  usagePage: number
  usage: number
  type: number
  inputReports: { reportId: number }[]
  outputReports: { reportId: number }[]
  featureReports: { reportId: number }[]
}

interface DeviceOption {
  device: HIDDevice
  label: string
}

function formatHex(n: number, pad = 4): string {
  return '0x' + n.toString(16).padStart(pad, '0')
}

function deviceLabel(dev: HIDDevice): string {
  const name = dev.productName || 'Unknown'
  return `${name} (${formatHex(dev.vendorId)}:${formatHex(dev.productId)})`
}

export function DeviceDiagnostics() {
  const [expanded, setExpanded] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<DeviceOption[]>([])
  const [connectedDevices, setConnectedDevices] = useState<HIDDevice[]>([])
  const [deviceInfo, setDeviceInfo] = useState<{
    vendorId: number
    productId: number
    name: string
    collections: HIDCollectionInfo[]
  } | null>(null)
  const [liveBytes, setLiveBytes] = useState<number[]>([])
  const [liveReportId, setLiveReportId] = useState(0)
  const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set())
  const [reportCount, setReportCount] = useState(0)
  const latestReport = useRef<{ reportId: number; bytes: number[] } | null>(null)
  const allDevicesRef = useRef<HIDDevice[]>([])

  const handleReport = useCallback((e: HIDInputReportEvent) => {
    const bytes = Array.from(new Uint8Array(e.data.buffer))
    setLiveBytes(bytes)
    setLiveReportId(e.reportId)
    setReportCount((c) => c + 1)
    latestReport.current = { reportId: e.reportId, bytes }

    const active = new Set<number>()
    bytes.forEach((b, i) => {
      if (b !== 0) active.add(i)
    })
    setChangedIndices(active)
  }, [])

  const refreshDevices = useCallback(async () => {
    if (!navigator.hid) return
    const devices = await navigator.hid.getDevices()
    allDevicesRef.current = devices
    const seen = new Set<string>()
    const filtered: DeviceOption[] = []
    for (const d of devices) {
      if (!d.productName) continue
      const key = `${d.vendorId}:${d.productId}:${d.productName}`
      if (seen.has(key)) continue
      seen.add(key)
      filtered.push({ device: d, label: deviceLabel(d) })
    }
    setAvailableDevices(filtered)
  }, [])

  useEffect(() => {
    if (expanded) refreshDevices()
  }, [expanded, refreshDevices])

  const requestNewDevice = useCallback(async () => {
    if (!navigator.hid) return
    await navigator.hid.requestDevice({ filters: [] })
    await refreshDevices()
  }, [refreshDevices])

  const connectTo = useCallback(
    async (dev: HIDDevice) => {
      for (const d of connectedDevices) {
        d.removeEventListener('inputreport', handleReport)
        if (d.opened) await d.close()
      }

      const interfaces = allDevicesRef.current.filter(
        (d) =>
          d.vendorId === dev.vendorId &&
          d.productId === dev.productId &&
          d.productName === dev.productName
      )

      const allCollections: HIDCollectionInfo[] = []
      const opened: HIDDevice[] = []
      for (const d of interfaces) {
        try {
          if (!d.opened) await d.open()
          d.addEventListener('inputreport', handleReport)
          opened.push(d)
          allCollections.push(...(d.collections as unknown as HIDCollectionInfo[]))
        } catch {}
      }

      setConnectedDevices(opened)
      setDeviceInfo({
        vendorId: dev.vendorId,
        productId: dev.productId,
        name: dev.productName || 'Unknown device',
        collections: allCollections
      })
      setReportCount(0)
      setLiveBytes([])
      setChangedIndices(new Set())
      latestReport.current = null
    },
    [connectedDevices, handleReport]
  )

  const disconnect = useCallback(() => {
    for (const d of connectedDevices) {
      d.removeEventListener('inputreport', handleReport)
      d.close()
    }
    setConnectedDevices([])
    setDeviceInfo(null)
    setLiveBytes([])
    setLiveReportId(0)
    setChangedIndices(new Set())
    setReportCount(0)
    latestReport.current = null
  }, [connectedDevices, handleReport])

  useEffect(() => {
    return () => {
      for (const d of connectedDevices) {
        d.removeEventListener('inputreport', handleReport)
      }
    }
  }, [connectedDevices, handleReport])

  const exportData = useCallback(() => {
    const data = {
      device: {
        name: deviceInfo?.name,
        vendorId: formatHex(deviceInfo?.vendorId ?? 0),
        productId: formatHex(deviceInfo?.productId ?? 0),
        collections: deviceInfo?.collections.map((c) => ({
          usagePage: formatHex(c.usagePage),
          usage: formatHex(c.usage),
          inputReports: c.inputReports?.map((r) => r.reportId) ?? [],
          outputReports: c.outputReports?.map((r) => r.reportId) ?? [],
          featureReports: c.featureReports?.map((r) => r.reportId) ?? []
        }))
      },
      totalReports: reportCount
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${deviceInfo?.name ?? 'device'}-diagnostic.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [deviceInfo, reportCount])

  if (!navigator.hid) return null

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-neutral-500 text-xs font-medium tracking-wide uppercase px-1 text-left hover:text-neutral-400 flex items-center gap-1"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9654;</span>
        Device Diagnostics
      </button>

      {expanded && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-neutral-600 px-1">
            Connect your device to inspect its HID data and export device info for a GitHub issue.
          </p>

          <ItemGroup>
            {connectedDevices.length === 0 ? (
              <ItemRow label="Connect device">
                {availableDevices.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const dev = availableDevices[Number(e.target.value)]
                      if (dev) connectTo(dev.device)
                    }}
                    className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 max-w-[200px]"
                  >
                    <option value="" disabled>
                      Choose a device
                    </option>
                    {availableDevices.map((d, i) => (
                      <option key={i} value={i}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                )}
                {!isElectron && (
                  <button
                    onClick={requestNewDevice}
                    className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 hover:bg-neutral-700"
                  >
                    {availableDevices.length > 0 ? '+' : 'Connect'}
                  </button>
                )}
              </ItemRow>
            ) : (
              <>
                <ItemRow label={deviceInfo?.name ?? 'Device'}>
                  <button
                    onClick={disconnect}
                    className="text-xs text-red-400/70 hover:text-red-400 px-1.5 py-1"
                  >
                    Disconnect
                  </button>
                </ItemRow>
                <ItemSeparator />
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex gap-4 text-[11px]">
                    <span className="text-neutral-500">
                      Vendor{' '}
                      <span className="text-neutral-400 font-mono">
                        {formatHex(deviceInfo!.vendorId)}
                      </span>
                    </span>
                    <span className="text-neutral-500">
                      Product{' '}
                      <span className="text-neutral-400 font-mono">
                        {formatHex(deviceInfo!.productId)}
                      </span>
                    </span>
                    <span className="text-neutral-500">
                      Reports <span className="text-neutral-400 font-mono">{reportCount}</span>
                    </span>
                  </div>
                  {deviceInfo!.collections.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-neutral-500">Collections</span>
                      {deviceInfo!.collections.map((c, i) => (
                        <span key={i} className="text-[10px] text-neutral-600 font-mono">
                          Page: {formatHex(c.usagePage)} Usage: {formatHex(c.usage)}
                          {c.inputReports?.length > 0 &&
                            ` | Input: [${c.inputReports.map((r) => r.reportId).join(', ')}]`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ItemSeparator />
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Live report</span>
                    {liveBytes.length > 0 && (
                      <span className="text-[10px] text-neutral-600 font-mono">
                        ID: {liveReportId} ({liveBytes.length} bytes)
                      </span>
                    )}
                  </div>
                  {liveBytes.length > 0 ? (
                    <div className="font-mono text-[11px] leading-relaxed flex flex-wrap gap-x-1">
                      {liveBytes.map((b, i) => (
                        <span
                          key={i}
                          className={changedIndices.has(i) ? 'text-green-400' : 'text-neutral-600'}
                        >
                          {b.toString(16).padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-600">
                      No data received. Try pressing keys on the device.
                    </span>
                  )}
                </div>
                <ItemSeparator />
                <ItemRow label="Export device info">
                  <button
                    onClick={exportData}
                    className="text-xs bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1.5 hover:bg-neutral-700"
                  >
                    Export
                  </button>
                </ItemRow>
              </>
            )}
          </ItemGroup>
        </div>
      )}
    </div>
  )
}
