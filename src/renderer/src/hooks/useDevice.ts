import { useEffect, useRef, useState } from 'react'
import { WOOT_VID, WOOT_ANALOG_USAGE, initDevice } from '../lib/wooting'

export function useDevice(
  onConnect: (device: HIDDevice) => void,
  onDisconnect: () => void
): void {
  const [device, setDevice] = useState<HIDDevice | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

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
}
