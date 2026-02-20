import Store from 'electron-store'
import type { AppSettings } from '../shared/types'
import { defaultSettings } from '../shared/defaults'

export const store = new Store<AppSettings>({ defaults: defaultSettings })
