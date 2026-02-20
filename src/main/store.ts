import Store from 'electron-store'
import type { AppSettings } from '../shared/types'

const defaults: AppSettings = {
  keys: [],
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
    height: 200,
  },
  windowHeight: 720,
}

export const store = new Store<AppSettings>({ defaults })
