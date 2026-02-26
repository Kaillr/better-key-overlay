import { useCallback, useEffect, useRef, useState } from 'react'
import { getDevices, requestDevice, type AnalogDevice } from '../lib/devices'

export function useDevice(
  onAnalogData: (data: { scancode: number; value: number }[]) => void,
  onDisconnect: () => void
): { devices: AnalogDevice[]; requestNewDevice: (() => void) | null } {
  const [devices, setDevices] = useState<AnalogDevice[]>([])
  const initRef = useRef(false)

  const addDevice = useCallback(
    (dev: AnalogDevice) => {
      dev.startListening(onAnalogData)
      setDevices((prev) => {
        if (prev.some((d) => d.hidDevice === dev.hidDevice)) return prev
        return [...prev, dev]
      })
    },
    [onAnalogData]
  )

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    getDevices().then((devs) => {
      for (const dev of devs) {
        addDevice(dev)
      }
    })
  }, [addDevice])

  useEffect(() => {
    if (!navigator.hid) return
    const handler = (event: HIDConnectionEvent) => {
      const disconnected = devices.find((d) => d.hidDevice === event.device)
      if (disconnected) {
        disconnected.stopListening()
        setDevices((prev) => prev.filter((d) => d.hidDevice !== event.device))
        onDisconnect()
      }
    }
    navigator.hid.addEventListener('disconnect', handler)
    return () => navigator.hid.removeEventListener('disconnect', handler)
  }, [devices, onDisconnect])

  const requestDev = useCallback(async () => {
    const dev = await requestDevice()
    if (dev) addDevice(dev)
  }, [addDevice])

  const isElectron = !!window.electron?.ipcRenderer

  return {
    devices,
    requestNewDevice: !isElectron && navigator.hid ? requestDev : null
  }
}
