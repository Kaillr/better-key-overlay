import type { ComponentType, SVGProps } from 'react'
import {
  KeyboardLine,
  KeyboardFill,
  PaletteLine,
  PaletteFill,
  ChartVertical2Line,
  ChartVertical2Fill,
  DisplayLine,
  DisplayFill,
  PluginLine,
  PluginFill,
  BookmarkLine,
  BookmarkFill,
} from '@mingcute/react'

export type SettingsPage = 'keys' | 'style' | 'visualizer' | 'display' | 'device' | 'presets'

interface MenuItem {
  id: SettingsPage
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconFill: ComponentType<SVGProps<SVGSVGElement>>
}

const menuItems: MenuItem[] = [
  { id: 'keys', label: 'Keys', icon: KeyboardLine, iconFill: KeyboardFill },
  { id: 'style', label: 'Key Style', icon: PaletteLine, iconFill: PaletteFill },
  { id: 'visualizer', label: 'Visualizer', icon: ChartVertical2Line, iconFill: ChartVertical2Fill },
  { id: 'display', label: 'Display', icon: DisplayLine, iconFill: DisplayFill },
  { id: 'device', label: 'Device', icon: PluginLine, iconFill: PluginFill },
  { id: 'presets', label: 'Presets', icon: BookmarkLine, iconFill: BookmarkFill },
]

interface SidebarProps {
  activePage: SettingsPage
  onNavigate: (page: SettingsPage) => void
  bottom?: React.ReactNode
}

export function Sidebar({ activePage, onNavigate, bottom }: SidebarProps) {
  return (
    <div className="flex flex-col h-full w-[200px] shrink-0 bg-[#1a1a1a] border-r border-neutral-800">
      <div className="p-4">
        <h1 className="text-base font-semibold text-white">Settings</h1>
      </div>
      <nav className="flex-1 px-2 space-y-0.5">
        {menuItems.map((item) => {
          const active = activePage === item.id
          const Icon = active ? item.iconFill : item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-neutral-700/50 text-white'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      {bottom && <div className="p-4">{bottom}</div>}
    </div>
  )
}
