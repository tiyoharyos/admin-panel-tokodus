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
    path: '/dashboard',
  },
  {
    icon: 'mdi:file-document-multiple',
    name: 'Orders',
    path: '/orders',
  },
  {
    icon: 'mdi:cube-outline',
    name: 'Box Models',
    path: '/box-models',
  },
  {
    icon: 'mdi:printer-settings',
    name: 'Print Settings',
    subItems: [
      { name: 'Print Settings', path: '/print/print-settings' },
      { name: 'Minimal Order Settings', path: '/print/other-minorder' },
    ],
  },
  {
    icon: 'mdi:google-circles-group',
    name: 'Singgleface',
    path: '/Singgleface-indext',
  },
  {
    icon: 'mdi:package-variant',
    name: 'Material',
    path: '/material',
  },
  {
    icon: 'mdi:cog-outline',
    name: 'Pengaturan Lainnya',
    path: '/index_lain',
  },
  {
    icon: 'mdi:wave',
    name: 'Flute Settings',
    path: '/flute-settings',
  },
  {
    icon: 'mdi:bell',
    name: 'Liminating Settings',
    subItems: [
      { name: 'Liminating', path: '/lamitasi' },
      { name: 'Sablon', path: '/sablon' },
    ],
  },
  {
    icon: 'mdi:knife',
    name: 'Pisau Setting',
    subItems: [
      { name: 'Pisau Config', path: '/pisau/pisau-config' },
      { name: 'Pisau Registri', path: '/pisau/pisau-registry' },
    ],
  },
  {
    icon: 'mdi:shopping',
    name: 'Paperbag',
    subItems: [
      { name: 'Tali Paperbag', path: '/paperbag/tali' },
      { name: 'Size Paperbag', path: '/paperbag/size' },
      { name: 'Price Paperbag', path: '/paperbag/price' },
    ],
  },
  {
    icon: 'mdi:file-table',
    name: 'Shet Settings',
    subItems: [
      { name: 'Sheet', path: '/sheet-settings/sheet-index' },
    ],
  },
  {
    icon: 'mdi:cog',
    name: 'Duplex Settings',
    subItems: [
      { name: 'Rumus DK', path: '/Duplex/Rumus_dk' },
      { name: 'Rumus DMD', path: '/Duplex/Rumus_dmd' },
    ],
  },
]