import Store from 'electron-store'
import type { AppSettings } from '../shared/types'

const defaults: AppSettings = {
  keys: [],
  scrollRate: 400,
  colors: {
    activeStartColor: 'hsla(0, 100%, 50%, 0.5)',
    activeEndColor: 'hsla(120, 100%, 50%, 1)',
    inactiveStartColor: 'hsla(0, 100%, 50%, 0)',
    inactiveEndColor: 'hsla(120, 100%, 50%, 1)',
  },
}

export const store = new Store<AppSettings>({ defaults })
