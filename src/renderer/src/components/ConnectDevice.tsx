import { useCallback, useEffect, useState } from 'react'
import { WOOT_VID, WOOT_ANALOG_USAGE, initDevice } from '../lib/wooting'

interface ConnectDeviceProps {
  onConnect: (device: HIDDevice) => void
  onDisconnect: () => void
}

let hasDoneInit = false

export function ConnectDevice({ onConnect, onDisconnect }: ConnectDeviceProps) {
  const [device, setDevice] = useState<HIDDevice | null>(null)

  useEffect(() => {
    if (hasDoneInit) return
    hasDoneInit = true

    navigator.hid.getDevices().then(async (devices) => {
      const wootDevice = devices.find(
        (d) => d.vendorId === WOOT_VID && d.collections[0]?.usagePage === WOOT_ANALOG_USAGE
      )
      if (wootDevice) {
        await initDevice(wootDevice)
        setDevice(wootDevice)
        onConnect(wootDevice)
      }
    })
  }, [onConnect])

  const onClick = useCallback(async () => {
    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: WOOT_VID, usagePage: WOOT_ANALOG_USAGE }]
    })
    if (devices.length > 0) {
      const dev = devices[0]
      await initDevice(dev)
      setDevice((existing) => {
        existing?.close()
        return dev
      })
      onConnect(dev)
    }
  }, [onConnect])

  useEffect(() => {
    const handler = async (event: HIDConnectionEvent) => {
      if (device && device === event.device) {
        await device.close()
        setDevice(null)
        onDisconnect()
      }
    }
    navigator.hid.addEventListener('disconnect', handler)
    return () => navigator.hid.removeEventListener('disconnect', handler)
  }, [device, onDisconnect])

  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') e.preventDefault()
      }}
      tabIndex={-1}
    >
      {device ? `${device.productName} Connected` : 'Connect Device'}
    </button>
  )
}
