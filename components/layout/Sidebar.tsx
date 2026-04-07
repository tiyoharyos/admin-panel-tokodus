'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Icon } from '@iconify/react'

interface UserData {
  id: string
  email: string
  role: string
}

type NavItem = {
  name: string
  icon: string
  path?: string
  badge?: number
  subItems?: { name: string; path: string; badge?: number }[]
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const getRoleLabel = (role: string): string => {
  const map: Record<string, string> = {
    '1': 'Administrator',
    '2': 'Manager',
    '3': 'Staff',
  }
  return map[role] ?? 'User'
}

const getDisplayName = (email: string): string => {
  const name = email.split('@')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<{ type: 'main'; index: number } | null>(null)
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({})
  const pathname = usePathname()
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [currentUser] = useState<UserData>(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const parsed: UserData = JSON.parse(raw)
        if (parsed?.email && parsed?.role) return parsed
      }
    } catch {
      // ignore
    }
    return { id: '0', email: 'admin@tokodus.com', role: '1' }
  })

  const displayName = getDisplayName(currentUser.email)
  const displayRole = getRoleLabel(currentUser.role)
  const avatarInitial = displayName.charAt(0).toUpperCase()

  const navItems: NavItem[] = [
    { icon: 'mdi:view-dashboard', name: 'Dashboard', path: '/dashboard' },
    { icon: 'mdi:file-document-multiple', name: 'Orders', path: '/orders' },
    { icon: 'mdi:cube-outline', name: 'Box Models', path: '/box-models' },
    {
      icon: 'mdi:printer-settings',
      name: 'Print Settings',
      subItems: [
        { name: 'Print Settings', path: '/print/print-settings' },
        { name: 'Minimal Order Settings', path: '/print/other-minorder' },
      ],
    },
    { icon: 'mdi:google-circles-group', name: 'Singgleface', path: '/Singgleface-indext' },
    { icon: 'mdi:package-variant', name: 'Material', path: '/material' },
    { icon: 'mdi:cog-outline', name: 'Pengaturan Lainnya', path: '/index_lain' },
    { icon: 'mdi:wave', name: 'Flute Settings', path: '/flute-settings' },
    {
      icon: 'mdi:bell',
      name: 'Liminating Settings',
      subItems: [
        { name: 'Liminating', path: '/lamitasi/lamitasi' },
        { name: 'Sablon', path: '/lamitasi/sablon' },
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
      subItems: [{ name: 'Sheet', path: '/sheet-settings/sheet-index' }],
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

  const isActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(path + '/'),
    [pathname]
  )

  useEffect(() => {
    navItems.forEach((nav, index) => {
      nav.subItems?.forEach((sub) => {
        if (isActive(sub.path)) setOpenSubmenu({ type: 'main', index })
      })
    })
  }, [pathname, isActive])

  useEffect(() => {
    if (openSubmenu && !isCollapsed) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }))
      }
    }
  }, [openSubmenu, isCollapsed])

  const handleSubmenuToggle = (index: number) => {
    if (isCollapsed) return
    setOpenSubmenu((prev) =>
      prev?.type === 'main' && prev.index === index ? null : { type: 'main', index }
    )
  }

  const renderMenuItems = () => (
    <ul className="space-y-0.5">
      {navItems.map((nav, index) => {
        const hasSubItems = !!nav.subItems?.length
        const isItemActive = nav.path ? isActive(nav.path) : false
        const isSubmenuOpen = openSubmenu?.type === 'main' && openSubmenu.index === index

        // Amber accent untuk active, putih redup untuk default
        const iconWrap =
          isItemActive || isSubmenuOpen
            ? 'flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 transition-all'
            : 'flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 text-slate-500 transition-all group-hover:bg-white/10 group-hover:text-slate-300'

        const rowBase = `group w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isCollapsed ? 'justify-center' : ''
        }`
        // Amber highlight untuk active row
        const rowActive = 'bg-amber-500/10 text-amber-300'
        const rowDefault = 'text-slate-400 hover:bg-white/5 hover:text-slate-200'

        return (
          <li key={nav.name}>
            {hasSubItems ? (
              <button
                onClick={() => handleSubmenuToggle(index)}
                title={isCollapsed ? nav.name : ''}
                className={`${rowBase} ${
                  isSubmenuOpen || isItemActive ? rowActive : rowDefault
                } ${isCollapsed ? '' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={iconWrap}>
                    <Icon icon={nav.icon} className="w-4 h-4" />
                  </div>
                  {!isCollapsed && <span className="truncate">{nav.name}</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {nav.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-400">
                        {nav.badge}
                      </span>
                    )}
                    <Icon
                      icon={isSubmenuOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                      className="w-3.5 h-3.5 text-slate-500"
                    />
                  </div>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  title={isCollapsed ? nav.name : ''}
                  className={`${rowBase} relative ${isItemActive ? rowActive : rowDefault}`}
                >
                  {/* Amber left bar indicator */}
                  {isItemActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-amber-400 to-amber-600" />
                  )}
                  <div className="flex items-center gap-3">
                    <div className={iconWrap}>
                      <Icon icon={nav.icon} className="w-4 h-4" />
                    </div>
                    {!isCollapsed && <span className="truncate">{nav.name}</span>}
                  </div>
                  {!isCollapsed && nav.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-400">
                      {nav.badge}
                    </span>
                  )}
                </Link>
              )
            )}

            {hasSubItems && !isCollapsed && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`main-${index}`] = el
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isSubmenuOpen ? `${subMenuHeight[`main-${index}`] || 0}px` : '0px',
                }}
              >
                <ul className="pt-1 pb-1 pl-[46px] pr-1 space-y-0.5">
                  {nav.subItems?.map((sub) => {
                    const isSubActive = isActive(sub.path)
                    return (
                      <li key={sub.name}>
                        <Link
                          href={sub.path}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                            isSubActive
                              ? 'bg-amber-500/[0.12] text-amber-300 font-medium'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`block w-1.5 h-1.5 rounded-full ${
                                isSubActive ? 'bg-amber-400' : 'bg-slate-600'
                              }`}
                            />
                            <span>{sub.name}</span>
                          </div>
                          {sub.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-400">
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        border-r border-white/[0.06]
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-64'}
      `}
      style={{ background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)' }}
    >
      {/* Header */}
      <div
        className={`
          flex items-center justify-center h-16 flex-shrink-0
          border-b border-white/[0.06] transition-all
          ${isCollapsed ? 'px-2' : 'px-4'}
        `}
      >
        {/* Amber decorative top line */}
        <div className="absolute left-0 right-0 top-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}
        />
        {isCollapsed ? (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <Image
              src="/material/logo.png"
              alt="Tokodus"
              width={130}
              height={30}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        ) : (
          <Image
            src="/material/Tokodus__1_-removebg-preview.webp"
            alt="Tokodus"
            width={130}
            height={30}
            className="h-10 w-auto object-contain"
            priority
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {!isCollapsed && (
          <div className="px-2 mb-3">
            <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-600">
              Main Menu
            </p>
          </div>
        )}
        {renderMenuItems()}
      </nav>

      {/* Footer */}
      <div
        className={`border-t border-white/[0.06] flex-shrink-0 p-3 ${
          isCollapsed ? 'px-2' : 'px-3'
        }`}
        style={{ background: 'rgba(0,0,0,0.25)' }}
        title={isCollapsed ? `${displayName} · ${displayRole}` : ''}
      >
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          {/* Amber gradient avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            {avatarInitial}
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-200 truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 truncate leading-tight">
                  {currentUser.email}
                </p>
              </div>
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-400">
                {displayRole}
              </span>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}