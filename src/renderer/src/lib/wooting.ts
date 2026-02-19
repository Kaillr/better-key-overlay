export const WOOT_VID = 0x31e3
export const WOOT_ANALOG_USAGE = 0xff54

export interface AnalogReport {
  data: { key: number; value: number }[]
}

declare global {
  interface HIDDevice {
    onanalogreport: ((this: HIDDevice, ev: AnalogReport) => void) | undefined
  }
}

export enum AnalogKey {
  // Modifier Keys
  LeftControl = 0xe0,
  LeftShift = 0xe1,
  LeftAlt = 0xe2,
  LeftGUI = 0xe3,
  RightControl = 0xe4,
  RightShift = 0xe5,
  RightAlt = 0xe6,
  RightGUI = 0xe7,

  // Alphanumeric Keys
  A = 0x04,
  B = 0x05,
  C = 0x06,
  D = 0x07,
  E = 0x08,
  F = 0x09,
  G = 0x0a,
  H = 0x0b,
  I = 0x0c,
  J = 0x0d,
  K = 0x0e,
  L = 0x0f,
  M = 0x10,
  N = 0x11,
  O = 0x12,
  P = 0x13,
  Q = 0x14,
  R = 0x15,
  S = 0x16,
  T = 0x17,
  U = 0x18,
  V = 0x19,
  W = 0x1a,
  X = 0x1b,
  Y = 0x1c,
  Z = 0x1d,

  // Number Keys
  One = 0x1e,
  Two = 0x1f,
  Three = 0x20,
  Four = 0x21,
  Five = 0x22,
  Six = 0x23,
  Seven = 0x24,
  Eight = 0x25,
  Nine = 0x26,
  Zero = 0x27,

  // Function Keys
  F1 = 0x3a,
  F2 = 0x3b,
  F3 = 0x3c,
  F4 = 0x3d,
  F5 = 0x3e,
  F6 = 0x3f,
  F7 = 0x40,
  F8 = 0x41,
  F9 = 0x42,
  F10 = 0x43,
  F11 = 0x44,
  F12 = 0x45,

  // Special Keys
  Enter = 0x28,
  Escape = 0x29,
  Backspace = 0x2a,
  Tab = 0x2b,
  Space = 0x2c,
  Minus = 0x2d,
  Equal = 0x2e,
  LeftBracket = 0x2f,
  RightBracket = 0x30,
  Backslash = 0x31,
  Semicolon = 0x33,
  Quote = 0x34,
  Grave = 0x35,
  Comma = 0x36,
  Period = 0x37,
  Slash = 0x38,
  CapsLock = 0x39,

  // Arrow Keys
  UpArrow = 0x52,
  DownArrow = 0x51,
  LeftArrow = 0x50,
  RightArrow = 0x4f,

  // Numpad
  NumLock = 0x53,
  NumpadDivide = 0x54,
  NumpadMultiply = 0x55,
  NumpadSubtract = 0x56,
  NumpadAdd = 0x57,
  NumpadEnter = 0x58,
  Numpad1 = 0x59,
  Numpad2 = 0x5a,
  Numpad3 = 0x5b,
  Numpad4 = 0x5c,
  Numpad5 = 0x5d,
  Numpad6 = 0x5e,
  Numpad7 = 0x5f,
  Numpad8 = 0x60,
  Numpad9 = 0x61,
  Numpad0 = 0x62,
  NumpadDecimal = 0x63,
}

export async function initDevice(device: HIDDevice): Promise<void> {
  await device.open()
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
