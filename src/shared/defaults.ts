import type { AppSettings } from './types'

export const defaultSettings: AppSettings = {
  keys: [],
  scrollRate: 400,
  colors: {
    activeStartColor: '#ff0000',
    activeEndColor: '#ffffff',
    inactiveStartColor: '#ff0000',
    inactiveEndColor: '#00ff00',
    gradient: false,
  },
  showKps: false,
  showBpm: false,
  counterPosition: 'bottom',
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
