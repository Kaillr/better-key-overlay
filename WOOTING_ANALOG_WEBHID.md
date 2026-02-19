# Reading Wooting Analog Input via WebHID

This document explains how to read real-time analog (pressure) values from a Wooting keyboard in a browser-based project using the **WebHID API**. No native SDK or Electron required.

---

## How It Works

Wooting keyboards expose a custom HID interface that continuously reports which keys are pressed and how hard. The browser's WebHID API lets you connect to this interface directly.

### Device Identifiers

```ts
const WOOT_VID         = 0x31e3; // Wooting vendor ID
const WOOT_ANALOG_USAGE = 0xff54; // Custom usage page for analog reports
```

Use these to filter for the correct HID interface on the device — Wooting keyboards expose multiple HID interfaces, and you want the analog one specifically.

---

## Report Format

Each `inputreport` event from the Wooting analog interface contains a `DataView` payload structured as repeating **3-byte chunks**:

```
[key_lo] [key_hi] [pressure]
 byte 0   byte 1   byte 2
```

| Field      | Size    | Description                                  |
|------------|---------|----------------------------------------------|
| `key`      | 2 bytes | HID usage code (little-endian uint16)        |
| `pressure` | 1 byte  | Key pressure, 0–255 (0 = not pressed)        |

The report ends when a chunk's pressure byte is `0`. Normalize pressure to 0.0–1.0 by dividing by 255.

---

## Minimal Implementation

### 1. Request & open the device

The user must grant permission via a gesture (button click). After that, previously-permitted devices can be re-accessed automatically on page load.

```ts
// On button click — prompts the user to select the device
async function connectDevice(): Promise<HIDDevice | null> {
  const devices = await navigator.hid.requestDevice({
    filters: [{ vendorId: 0x31e3, usagePage: 0xff54 }],
  });
  return devices[0] ?? null;
}

// On page load — re-use a previously permitted device
async function getExistingDevice(): Promise<HIDDevice | null> {
  const devices = await navigator.hid.getDevices();
  return devices.find(
    (d) => d.vendorId === 0x31e3 && d.collections[0]?.usagePage === 0xff54
  ) ?? null;
}
```

### 2. Listen for analog reports

```ts
interface AnalogKey {
  key: number;   // HID usage code
  value: number; // 0.0 – 1.0
}

async function initDevice(device: HIDDevice, onReport: (keys: AnalogKey[]) => void) {
  await device.open();

  device.addEventListener("inputreport", (event) => {
    const data = event.data;
    const keys: AnalogKey[] = [];

    for (let i = 0; i < data.byteLength; i += 3) {
      const key   = data.getUint16(i);        // 2-byte little-endian key code
      const value = data.getUint8(i + 2) / 255; // normalize to 0.0–1.0

      if (value === 0) break; // remaining chunks are empty
      keys.push({ key, value });
    }

    onReport(keys);
  });
}
```

### 3. Handle disconnection

```ts
navigator.hid.addEventListener("disconnect", async (event) => {
  if (event.device === myDevice) {
    await myDevice.close();
    // update your app state
  }
});
```

---

## HID Key Codes

Key codes match the [USB HID Usage Tables](https://usb.org/sites/default/files/hut1_5.pdf) (page 53, "Keyboard/Keypad" usage page). Common ones:

| Key   | Code   | Key     | Code   |
|-------|--------|---------|--------|
| A     | `0x04` | Space   | `0x2c` |
| B     | `0x05` | Enter   | `0x28` |
| W     | `0x1a` | Escape  | `0x29` |
| S     | `0x16` | Up      | `0x52` |
| D     | `0x07` | Down    | `0x51` |
| 1     | `0x1e` | Left    | `0x50` |
| 2     | `0x1f` | Right   | `0x4f` |

To check a specific key from a report:

```ts
const W_KEY = 0x1a;
const wPressure = keys.find((k) => k.key === W_KEY)?.value ?? 0;
```

---

## Browser Support & Requirements

- **Supported:** Chrome / Edge (Chromium-based) — desktop only
- **Not supported:** Firefox, Safari, mobile browsers
- **Requires HTTPS** (or `localhost` for development)
- The user must click a button to trigger `requestDevice()` — it cannot be called automatically on page load

To check availability:

```ts
if (!navigator.hid) {
  console.error("WebHID not supported in this browser");
}
```

---

## Full Example (Vanilla JS)

```html
<button id="connect">Connect Wooting</button>
<pre id="output"></pre>

<script>
  const WOOT_VID = 0x31e3;
  const WOOT_ANALOG_USAGE = 0xff54;

  document.getElementById("connect").addEventListener("click", async () => {
    const [device] = await navigator.hid.requestDevice({
      filters: [{ vendorId: WOOT_VID, usagePage: WOOT_ANALOG_USAGE }],
    });
    if (!device) return;

    await device.open();

    device.addEventListener("inputreport", (event) => {
      const data = event.data;
      const keys = [];

      for (let i = 0; i < data.byteLength; i += 3) {
        const key   = data.getUint16(i);
        const value = data.getUint8(i + 2) / 255;
        if (value === 0) break;
        keys.push({ key: `0x${key.toString(16)}`, value: value.toFixed(3) });
      }

      document.getElementById("output").textContent = JSON.stringify(keys, null, 2);
    });
  });
</script>
```

---

## Notes

- Reports are **event-driven**, not polled. The firmware sends a report whenever the analog state changes.
- If no keys are held, no reports are sent (or reports arrive with all-zero pressure bytes).
- The `usagePage` filter (`0xff54`) is important — it selects the analog HID interface, not the standard keyboard interface.
- `device.forget()` can be called to revoke permission and force the user to re-authorize next time.
