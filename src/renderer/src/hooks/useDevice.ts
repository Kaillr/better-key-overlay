import { useCallback, useEffect, useRef, useState } from 'react'
import { getDevices, requestDevice, type AnalogDevice } from '../lib/devices'

export function useDevice(
  onAnalogData: (data: { scancode: number; value: number }[]) => void,
  onDisconnect: () => void,
  enabled = true
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
    if (!enabled || initRef.current) return
    initRef.current = true
    getDevices().then((devs) => {
      for (const dev of devs) {
        addDevice(dev)
      }
    })
  }, [addDevice, enabled])

  useEffect(() => {
    if (!enabled || !navigator.hid) return
    const onConnect = () => {
      getDevices().then((devs) => {
        for (const dev of devs) addDevice(dev)
      })
    }
    const onDisconnectEvent = (event: HIDConnectionEvent) => {
      const disconnected = devices.find((d) => d.hidDevice === event.device)
      if (disconnected) {
        disconnected.stopListening()
        setDevices((prev) => prev.filter((d) => d.hidDevice !== event.device))
        onDisconnect()
      }
    }
    navigator.hid.addEventListener('connect', onConnect)
    navigator.hid.addEventListener('disconnect', onDisconnectEvent)
    return () => {
      navigator.hid.removeEventListener('connect', onConnect)
      navigator.hid.removeEventListener('disconnect', onDisconnectEvent)
    }
  }, [devices, addDevice, onDisconnect, enabled])

  const requestDev = useCallback(async () => {
    const dev = await requestDevice()
    if (dev) addDevice(dev)
  }, [addDevice])

  const isElectron = !!window.electron?.ipcRenderer

  return {
    devices,
    requestNewDevice: !isElectron && navigator.hid && enabled ? requestDev : null
  }
}
