import type { AppSettings, StoreSchema } from './types'

export const defaultSettings: AppSettings = {
  keys: [],
  scrollRate: 400,
  colors: {
    activeColor: '#ffffffff',
    inactiveColor: '#ff0000ff',
    gradient: false
  },
  showKps: false,
  showBpm: false,
  counterPosition: 'bottom',
  showVisualizer: true,
  keyStyle: {
    active: {
      borderColor: ['#ffffffff', '#ffffffff'],
      borderColorGradient: false,
      backgroundColor: ['#171717ff', '#404040ff'],
      backgroundColorGradient: true,
      textColor: ['#ffffffff', '#ffffffff'],
      textColorGradient: false
    },
    inactive: {
      borderColor: ['#404040ff', '#404040ff'],
      borderColorGradient: false,
      backgroundColor: ['#171717ff', '#404040ff'],
      backgroundColorGradient: true,
      textColor: ['#ffffffff', '#ffffffff'],
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
  presets: [{ id: defaultPresetId, name: 'Unnamed preset', settings: defaultSettings }],
  serverEnabled: false,
  serverPort: 1727
}
