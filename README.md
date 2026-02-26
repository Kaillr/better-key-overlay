# Better Key Overlay

[![GitHub release](https://img.shields.io/github/v/release/Kaillr/better-key-overlay?style=flat-square)](https://github.com/Kaillr/better-key-overlay/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/Kaillr/better-key-overlay/total?style=flat-square)](https://github.com/Kaillr/better-key-overlay/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)]()

A customizable key overlay with analog pressure visualization.

![Preview](docs/images/preview.png)

![Analog Pressure](docs/images/analog.png)

## Features

- Scrolling pressure visualization with customizable colors and speed
- Pressure-reactive key buttons
- KPS & BPM counter
- Works with any keyboard — full analog support for many analog devices
- Fully customizable through the settings window

## Download

Grab the latest version from the [releases page](https://github.com/Kaillr/better-key-overlay/releases/latest).

| Platform | What to download |
|----------|-----------------|
| Windows | `...-setup.exe` to install, or the other `.exe` to run without installing |
| macOS | `.dmg` |
| Linux | `.AppImage` or `.deb` |

### macOS Note

The macOS build is not code-signed. After installing, run:

```
xattr -cr /Applications/Better\ Key\ Overlay.app
```

## Usage

1. **Add keys** — Right-click the overlay to open settings, click "Add Key" and press the key you want to track
2. **Customize** — Adjust colors, key styles, scroll speed, fade effect, and more in settings
3. **Stream** — Use OBS window capture to add the overlay. Set the blend mode to **Add** to remove the black background

## Supported Analog Devices

Analog pressure visualization is powered by [AnalogSense.js](https://analogsense.org/).

- **Wooting** — All models
- **DrunkDeer** — All models
- **Razer** — Huntsman V2 Analog, Huntsman Mini Analog, Huntsman V3 Pro series
- **NuPhy** — All analog models
- **Keychron** — Q1 HE, Q3 HE, Q5 HE, K2 HE
- **Lemokey** — P1 HE
- **Madlions** — MAD60HE, MAD68HE, MAD68R

Also works with any standard keyboard (without pressure visualization).
