// constants/menu.ts
export type NavItem = {
  name: string
  icon: string
  path?: string
  badge?: number
  subItems?: { name: string; path: string; badge?: number }[]
}

export const navItems: NavItem[] = [
  { 
    icon: 'mdi:view-dashboard',
    name: 'Dashboard', 
    path: '/dashboard'
  },
  { 
    icon: 'mdi:file-document-multiple',
    name: 'Orders', 
    path: '/orders',
  },
  { 
    icon: 'mdi:cube-outline',
    name: 'Box Models', 
    path: '/box-models'
  },
  { 
    icon: 'mdi:printer-settings',
    name: 'Print Settings', 
    path: '/print-settings'
  },
  { 
    icon: 'mdi:google-circles-group',
    name: 'Singgleface', 
    path: '/Singgleface-indext'
  },
  { 
    icon: 'mdi:alpha-d-box-outline',
    name: 'Inner Box', 
    path: '/inner-box'
  },
  { 
    icon: 'mdi:cog-outline',
    name: 'Pengaturan Costing', 
    path: '/index_lain'
  },
  { 
    icon: 'mdi:file-table',
    name: 'Shet Settings', 
    subItems: [
      { name: 'Sheet', path: '/sheet-settings/sheet-index' },
      { name: 'Sheet Flute', path: '/sheet-settings/flute-settings' },
      { name: 'Sheet k200', path: '/sheet-settings/sheet-k200' }
    ]
  },
  { 
    icon: 'mdi:cog',
    name: 'Duplex Settings', 
    subItems: [
      { name: 'Rumus DK', path: '/Duplex/Rumus_dk' },
      { name: 'Rumus DMD', path: '/Duplex/Rumus_dmd' }
    ]
  }
]