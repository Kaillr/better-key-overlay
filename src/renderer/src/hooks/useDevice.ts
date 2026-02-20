import { useCallback, useEffect, useRef, useState } from 'react'
import { WOOT_VID, WOOT_ANALOG_USAGE, initDevice } from '../lib/wooting'

export function useDevice(
  onConnect: (device: HIDDevice) => void,
  onDisconnect: () => void
): { connected: boolean; requestDevice: (() => void) | null } {
  const [device, setDevice] = useState<HIDDevice | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current || !navigator.hid) return
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
    if (!navigator.hid) return
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

  const requestDev = useCallback(async () => {
    if (!navigator.hid) return
    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: WOOT_VID, usagePage: WOOT_ANALOG_USAGE }],
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

  const isElectron = !!window.electron?.ipcRenderer

  return {
    connected: !!device,
    requestDevice: !isElectron && navigator.hid ? requestDev : null,
  }
}
