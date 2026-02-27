import { useCallback, useEffect, useRef, useState } from 'react'
import { getDevices, requestDevice, type AnalogDevice } from '../lib/devices'

function deviceId(dev: AnalogDevice): string {
  return `${dev.hidDevice.vendorId}:${dev.hidDevice.productId}`
}

export function useDevice(
  onAnalogData: (data: { scancode: number; value: number }[]) => void,
  onDisconnect: () => void
): { devices: AnalogDevice[]; requestNewDevice: (() => void) | null } {
  const [devices, setDevices] = useState<AnalogDevice[]>([])
  const initRef = useRef(false)

  const syncDevices = useCallback(() => {
    getDevices().then((found) => {
      setDevices((prev) => {
        const foundIds = new Set(found.map(deviceId))
        const prevIds = new Set(prev.map(deviceId))

        // Stop removed devices
        for (const dev of prev) {
          if (!foundIds.has(deviceId(dev))) dev.stopListening()
        }

        // Start new devices
        for (const dev of found) {
          if (!prevIds.has(deviceId(dev))) dev.startListening(onAnalogData)
        }

        // Only update state if something changed
        if (foundIds.size === prevIds.size && [...foundIds].every((id) => prevIds.has(id)))
          return prev
        return found.map((dev) => {
          const existing = prev.find((d) => deviceId(d) === deviceId(dev))
          return existing ?? dev
        })
      })
    })
  }, [onAnalogData])

  // Initial scan
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    syncDevices()
  }, [syncDevices])

  // Re-scan when main process notifies of custom device changes
  useEffect(() => {
    const ipc = window.electron?.ipcRenderer
    if (!ipc) return
    const handler = () => syncDevices()
    ipc.on('custom-devices-changed', handler)
    return () => {
      ipc.removeListener('custom-devices-changed', handler)
    }
  }, [syncDevices])

  // Handle physical disconnects
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
    if (dev) {
      dev.startListening(onAnalogData)
      setDevices((prev) => {
        if (prev.some((d) => d.hidDevice === dev.hidDevice)) return prev
        return [...prev, dev]
      })
    }
  }, [onAnalogData])

  const isElectron = !!window.electron?.ipcRenderer

  return {
    devices,
    requestNewDevice: !isElectron && navigator.hid ? requestDev : null
  }
}
