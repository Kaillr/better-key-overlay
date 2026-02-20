import type { AppSettings } from './types'

export const defaultSettings: AppSettings = {
  keys: [
    { code: 'KeyZ', label: 'Z', analogKey: 0x1d, uiohookKeycode: 0 },
    { code: 'KeyX', label: 'X', analogKey: 0x1b, uiohookKeycode: 0 },
  ],
  scrollRate: 500,
  colors: {
    activeStartColor: '#ff0000',
    activeEndColor: '#ffffff',
    inactiveStartColor: '#ff0000',
    inactiveEndColor: '#00ff00',
    gradient: false,
  },
  showCps: false,
  showBpm: false,
  keyStyle: {
    active: {
      borderColor: ['#ffffff', '#ffffff'],
      borderColorGradient: false,
      backgroundColor: ['#171717', '#404040'],
      backgroundColorGradient: true,
      textColor: ['#ffffff', '#ffffff'],
      textColorGradient: false,
    },
    inactive: {
      borderColor: ['#404040', '#404040'],
      borderColorGradient: false,
      backgroundColor: ['#171717', '#404040'],
      backgroundColorGradient: true,
      textColor: ['#ffffff', '#ffffff'],
      textColorGradient: false,
    },
    borderWidth: 6,
    borderRadius: 22,
  },
  fade: {
    enabled: true,
    height: 50,
  },
  windowHeight: 720,
}
