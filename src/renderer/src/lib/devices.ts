export interface AnalogReport {
  data: { key: number; value: number }[]
}

declare global {
  interface HIDDevice {
    onanalogreport: ((this: HIDDevice, ev: AnalogReport) => void) | undefined
  }
}

// Wooting
const WOOT_VID = 0x31e3
const WOOT_ANALOG_USAGE = 0xff54

// DrunkDeer
const DD_VIDS = [6645, 13613, 1452, 6785]
const DD_USAGE_PAGE = 0xff00

// DrunkDeer key index → HID usage code
const DD_INDEX_TO_HID: Record<number, number> = {
  0: 0x29,   // Esc
  2: 0x3a,   // F1
  3: 0x3b,   // F2
  4: 0x3c,   // F3
  5: 0x3d,   // F4
  6: 0x3e,   // F5
  7: 0x3f,   // F6
  8: 0x40,   // F7
  9: 0x41,   // F8
  10: 0x42,  // F9
  11: 0x43,  // F10
  12: 0x44,  // F11
  13: 0x45,  // F12
  14: 0x4c,  // Delete
  21: 0x35,  // Backquote
  22: 0x1e,  // 1
  23: 0x1f,  // 2
  24: 0x20,  // 3
  25: 0x21,  // 4
  26: 0x22,  // 5
  27: 0x23,  // 6
  28: 0x24,  // 7
  29: 0x25,  // 8
  30: 0x26,  // 9
  31: 0x27,  // 0
  32: 0x2d,  // Minus
  33: 0x2e,  // Equal
  34: 0x2a,  // Backspace
  36: 0x4a,  // Home
  42: 0x2b,  // Tab
  43: 0x14,  // Q
  44: 0x1a,  // W
  45: 0x08,  // E
  46: 0x15,  // R
  47: 0x17,  // T
  48: 0x1c,  // Y
  49: 0x18,  // U
  50: 0x0c,  // I
  51: 0x12,  // O
  52: 0x13,  // P
  53: 0x2f,  // [
  54: 0x30,  // ]
  55: 0x31,  // Backslash
  57: 0x4b,  // PageUp
  63: 0x39,  // CapsLock
  64: 0x04,  // A
  65: 0x16,  // S
  66: 0x07,  // D
  67: 0x09,  // F
  68: 0x0a,  // G
  69: 0x0b,  // H
  70: 0x0d,  // J
  71: 0x0e,  // K
  72: 0x0f,  // L
  73: 0x33,  // Semicolon
  74: 0x34,  // Quote
  76: 0x28,  // Enter
  78: 0x4e,  // PageDown
  84: 0xe1,  // ShiftLeft
  86: 0x1d,  // Z
  87: 0x1b,  // X
  88: 0x06,  // C
  89: 0x19,  // V
  90: 0x05,  // B
  91: 0x11,  // N
  92: 0x10,  // M
  93: 0x36,  // Comma
  94: 0x37,  // Period
  95: 0x38,  // Slash
  97: 0xe5,  // ShiftRight
  98: 0x52,  // ArrowUp
  99: 0x4d,  // End
  105: 0xe0, // ControlLeft
  106: 0xe3, // MetaLeft
  107: 0xe2, // AltLeft
  111: 0x2c, // Space
  115: 0xe6, // AltRight
  117: 0x65, // ContextMenu
  119: 0x50, // ArrowLeft
  120: 0x51, // ArrowDown
  121: 0x4f, // ArrowRight
}

export const DEVICE_FILTERS: HIDDeviceFilter[] = [
  { vendorId: WOOT_VID, usagePage: WOOT_ANALOG_USAGE },
  ...DD_VIDS.map((vid) => ({ vendorId: vid, usagePage: DD_USAGE_PAGE })),
]

function isWooting(device: HIDDevice): boolean {
  return device.vendorId === WOOT_VID
}

function isDrunkDeer(device: HIDDevice): boolean {
  return DD_VIDS.includes(device.vendorId)
}

function initWooting(device: HIDDevice): void {
  device.addEventListener('inputreport', (event) => {
    const data = event.data
    const analogData: { key: number; value: number }[] = []

    for (let i = 0; i < data.byteLength; i += 3) {
      const key = data.getUint16(i)
      const value = data.getUint8(i + 2) / 255
      if (value === 0) break
      analogData.push({ key, value })
    }

    device.onanalogreport?.({ data: analogData })
  })
}

function initDrunkDeer(device: HIDDevice): void {
  // DrunkDeer sends pressure in report type 183 (0xB7) in 3 banks
  const pressures = new Map<number, number>()

  device.addEventListener('inputreport', (event) => {
    const data = event.data
    const reportType = data.getUint8(0)

    if (reportType !== 183) return

    const bank = data.getUint8(3)
    let start: number, count: number

    if (bank === 0) {
      start = 0; count = 59
    } else if (bank === 1) {
      start = 59; count = 59
    } else {
      start = 118; count = 8
    }

    for (let r = 0; r < count; r++) {
      const raw = data.getUint8(r + 4)
      const ddIndex = start + r
      const hidKey = DD_INDEX_TO_HID[ddIndex]
      if (hidKey === undefined) continue

      const value = raw < 2 ? 0 : Math.min(raw / 33, 1)
      pressures.set(hidKey, value)
    }

    // Emit after processing the last bank
    if (bank !== 0 && bank !== 1) {
      const analogData: { key: number; value: number }[] = []
      pressures.forEach((value, key) => {
        analogData.push({ key, value })
      })
      device.onanalogreport?.({ data: analogData })
    }
  })
}

export async function initDevice(device: HIDDevice): Promise<void> {
  await device.open()

  if (isWooting(device)) {
    initWooting(device)
  } else if (isDrunkDeer(device)) {
    initDrunkDeer(device)
    // DrunkDeer requires a command to start streaming pressure data
    const cmd = new Uint8Array(63)
    cmd[0] = 253; cmd[1] = 7; cmd[2] = 1
    await device.sendReport(4, cmd)
  }
}

export function isAnalogDevice(device: HIDDevice): boolean {
  return isWooting(device) || isDrunkDeer(device)
}
