import { useCallback, useEffect, useRef, useState } from 'react'
import { WOOT_VID, WOOT_ANALOG_USAGE, initDevice } from '../lib/wooting'

export function useDevice(
  onConnect: (device: HIDDevice) => void,
  onDisconnect: () => void
): { devices: HIDDevice[]; requestDevice: (() => void) | null } {
  const [devices, setDevices] = useState<HIDDevice[]>([])
  const initRef = useRef(false)

  const addDevice = useCallback(
    async (dev: HIDDevice) => {
      await initDevice(dev)
      setDevices((prev) => {
        if (prev.some((d) => d === dev)) return prev
        return [...prev, dev]
      })
      onConnect(dev)
    },
    [onConnect]
  )

  useEffect(() => {
    if (initRef.current || !navigator.hid) return
    initRef.current = true

    navigator.hid.getDevices().then(async (allDevices) => {
      const wootDevices = allDevices.filter(
        (d) => d.vendorId === WOOT_VID && d.collections[0]?.usagePage === WOOT_ANALOG_USAGE
      )
      for (const dev of wootDevices) {
        await addDevice(dev)
      }
    })
  }, [addDevice])

  useEffect(() => {
    if (!navigator.hid) return
    const handler = async (event: HIDConnectionEvent) => {
      const dev = event.device
      if (devices.includes(dev)) {
        await dev.close()
        setDevices((prev) => prev.filter((d) => d !== dev))
        onDisconnect()
      }
    }
    navigator.hid.addEventListener('disconnect', handler)
    return () => navigator.hid.removeEventListener('disconnect', handler)
  }, [devices, onDisconnect])

  const requestDev = useCallback(async () => {
    if (!navigator.hid) return
    const selected = await navigator.hid.requestDevice({
      filters: [{ vendorId: WOOT_VID, usagePage: WOOT_ANALOG_USAGE }],
    })
    for (const dev of selected) {
      await addDevice(dev)
    }
  }, [addDevice])

  const isElectron = !!window.electron?.ipcRenderer

  return {
    devices,
    requestDevice: !isElectron && navigator.hid ? requestDev : null,
  }
}
