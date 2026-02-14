'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import CustomIcon from '../UI/Icon'

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  badge?: number;
  subItems?: { name: string; path: string; badge?: number }[];
};

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null)
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({})
  const pathname = usePathname()
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Navigation items asli Tokodus (tidak diubah)
  const navItems: NavItem[] = [
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
    // Menu-item yang dikeluarkan dari Settings
    { 
      icon: 'mdi:cube-outline',
      name: 'Box Models', 
      path: '/box-models'
    },
    // { 
    //   icon: 'mdi:cash-multiple',
    //   name: 'Price Settings', 
    //   path: '/price-settings'
    // },
    // { 
    //   icon: 'mdi:flask',
    //   name: 'Material Formulas', 
    //   path: '/material-formulas'
    // },
    { 
      icon: 'mdi:printer-settings',
      name: 'Print Settings', 
      path: '/print-settings'
    },
    // { 
    //   icon: 'mdi:file-table',
    //   name: 'Sheet Settings', 
    //   path: '/sheet-settings'
    // },
    // { 
    //   icon: 'mdi:wave',
    //   name: 'Flute Settings', 
    //   path: '/flute-settings'
    // },
    // { 
    //   icon: 'mdi:file-document-outline',
    //   name: 'Sheet K200', 
    //   path: '/sheet-k200'
    // },
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
    // Settings dengan Duplex di dalamnya
    { 
      icon: 'mdi:cog',
      name: 'Duplex Settings', 
      subItems: [
        { name: 'Rumus DK', path: '/Duplex/Rumus_dk' },
        { name: 'Rumus DMD', path: '/Duplex/Rumus_dmd' }
      ]
    }
  ]

  const isActive = useCallback((path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }, [pathname])

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            })
            submenuMatched = true
          }
        
        })
      }
    })
  }, [pathname, isActive])

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null && !isCollapsed) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }))
      }
    }
  }, [openSubmenu, isCollapsed])

  const handleSubmenuToggle = (index: number) => {
    if (isCollapsed) return
    
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === "main" &&
        prevOpenSubmenu.index === index
      ) {
        return null
      }
      return { type: "main", index }
    })
  }

  const renderMenuItems = () => (
    <ul className="space-y-1">
      {navItems.map((nav, index) => {
        const hasSubItems = nav.subItems && nav.subItems.length > 0
        const isItemActive = nav.path ? isActive(nav.path) : false
        const isSubmenuOpen = openSubmenu?.type === "main" && openSubmenu?.index === index

        return (
          <li key={nav.name}>
            {hasSubItems ? (
              <button
                onClick={() => handleSubmenuToggle(index)}
                className={`
                  w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isCollapsed ? 'justify-center px-2' : 'justify-between'}
                  ${isSubmenuOpen || isItemActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={isCollapsed ? nav.name : ''}
              >
                <div className="flex items-center gap-3">
                  <CustomIcon 
                    icon={nav.icon} 
                    className={`w-5 h-5 ${
                      isSubmenuOpen || isItemActive ? 'text-blue-600' : 'text-gray-500'
                    }`} 
                  />
                  {!isCollapsed && (
                    <span>{nav.name}</span>
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    {nav.badge && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                        {nav.badge}
                      </span>
                    )}
                    <CustomIcon 
                      icon={isSubmenuOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                      className="w-4 h-4 text-gray-400"
                    />
                  </div>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative
                    ${isCollapsed ? 'justify-center px-2' : ''}
                    ${isItemActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  title={isCollapsed ? nav.name : ''}
                >
                  {isItemActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r"></span>
                  )}
                  <div className="flex items-center gap-3">
                    <CustomIcon 
                      icon={nav.icon} 
                      className={`w-5 h-5 ${
                        isItemActive ? 'text-blue-600' : 'text-gray-500'
                      }`} 
                    />
                    {!isCollapsed && (
                      <span>{nav.name}</span>
                    )}
                  </div>
                  
                  {!isCollapsed && nav.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                      {nav.badge}
                    </span>
                  )}
                </Link>
              )
            )}
            
            {/* Submenu items */}
            {hasSubItems && !isCollapsed && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`main-${index}`] = el
                }}
                className="overflow-hidden transition-all duration-300 ml-11"
                style={{
                  height: isSubmenuOpen
                    ? `${subMenuHeight[`main-${index}`] || 0}px`
                    : '0px'
                }}
              >
               <ul className="space-y-1 py-2">
                  {nav.subItems?.map((subItem) => {
                    const isSubItemActive = isActive(subItem.path)
                    return (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.path}
                          className={`
                            flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors
                            ${isSubItemActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }
                          `}
                        >
                          <span>{subItem.name}</span>
                          {subItem.badge && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                              {subItem.badge}
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
        fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo dengan logo Tokodus */}
      <div className={`
        flex items-center h-16 border-b border-gray-200 transition-all duration-300 bg-white justify-center
        ${isCollapsed ? 'justify-center px-2' : 'px-4'}
      `}>
        {isCollapsed ? (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-1 shadow-lg border ">
            <Image 
              src="/material/Tokodus__1_-removebg-preview.webp" 
              alt="Tokodus"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="mb-6">
          {!isCollapsed && (
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main Menu
              </p>
            </div>
          )}
          {renderMenuItems()}
        </div>
      </nav>

      {/* Profile Section dengan email admin Tokodus */}
      <div className={`
        border-t border-gray-200 p-4 transition-all duration-300 bg-white
        ${isCollapsed ? 'px-2' : 'px-4'}
      `}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <CustomIcon icon="mdi:account" className="text-white w-5 h-5" />
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin Tokodus</p>
              <p className="text-xs text-gray-500 truncate">admin@tokodus.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}