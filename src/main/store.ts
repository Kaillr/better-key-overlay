import Store from 'electron-store'
import type { AppSettings } from '../shared/types'

const defaults: AppSettings = {
  keys: [],
  scrollRate: 400,
  colors: {
    activeStartColor: '#ff0000',
    activeEndColor: '#00ff00',
    inactiveStartColor: '#ff0000',
    inactiveEndColor: '#00ff00',
  },
  showCps: true,
  showBpm: true,
  keyStyle: {
    active: {
      borderColor: ['#ffffff', '#ffffff'],
      backgroundColor: ['#404040', '#404040'],
      textColor: ['#ffffff', '#ffffff'],
    },
    inactive: {
      borderColor: ['#525252', '#525252'],
      backgroundColor: ['#171717', '#171717'],
      textColor: ['#ffffff', '#ffffff'],
    },
    borderWidth: 2,
    borderRadius: 0,
  },
  fade: {
    enabled: true,
    height: 200,
  },
}

export const store = new Store<AppSettings>({ defaults })
