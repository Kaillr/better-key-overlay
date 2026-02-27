import type { AppSettings, StoreSchema } from './types'

export const defaultSettings: AppSettings = {
  keys: [],
  scrollRate: 400,
  colors: {
    activeColor: '#ffffff',
    inactiveColor: '#ff0000',
    gradient: false
  },
  showKps: false,
  showBpm: false,
  counterPosition: 'bottom',
  showVisualizer: true,
  keyStyle: {
    active: {
      borderColor: ['#ffffff', '#ffffff'],
      borderColorGradient: false,
      backgroundColor: ['#171717', '#404040'],
      backgroundColorGradient: true,
      textColor: ['#ffffff', '#ffffff'],
      textColorGradient: false
    },
    inactive: {
      borderColor: ['#404040', '#404040'],
      borderColorGradient: false,
      backgroundColor: ['#171717', '#404040'],
      backgroundColorGradient: true,
      textColor: ['#ffffff', '#ffffff'],
      textColorGradient: false
    },
    borderWidth: 6,
    borderRadius: 22
  },
  fade: {
    enabled: true,
    height: 50
  },
  windowHeight: 720
}

const defaultPresetId = 'default'

export const defaultStoreSchema: StoreSchema = {
  activePresetId: defaultPresetId,
  presets: [{ id: defaultPresetId, name: 'Unnamed preset', settings: defaultSettings }]
}
