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
  subItems?: { name: string; path: string }[];
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

  // Navigation items
  const navItems: NavItem[] = [
    { 
      icon: 'mdi:view-dashboard',
      name: 'Dashboard', 
      path: '/dashboard'
    },
    { 
      icon: 'mdi:file-document-multiple',
      name: 'Orders', 
      path: '/orders'
    },
    { 
      icon: 'mdi:draw',
      name: 'Designs', 
      path: '/designs'
    },
    { 
      icon: 'mdi:package-variant',
      name: 'Materials', 
      path: '/materials'
    },
    { 
      icon: 'mdi:factory',
      name: 'Production', 
      path: '/production'
    },
    { 
      icon: 'mdi:chart-bar',
      name: 'Reports', 
      path: '/reports'
    },
    { 
      icon: 'mdi:cog',
      name: 'Settings', 
      subItems: [
        { name: 'Box Models', path: '/box-models' },
        { name: 'Price Settings', path: '/price-settings' },
        { name: 'Material Formulas', path: '/material-formulas' },
        { name: 'Print Settings', path: '/print-settings' },
        { name: 'Sheet Settings', path: '/sheet-settings' },
      ]
    },
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
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => {
        const hasSubItems = nav.subItems && nav.subItems.length > 0
        const isItemActive = nav.path ? isActive(nav.path) : false
        const isSubmenuOpen = openSubmenu?.type === "main" && openSubmenu?.index === index

        return (
          <li key={nav.name}>
            {hasSubItems ? (
              <button
                onClick={() => handleSubmenuToggle(index)}
                className={`w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${isCollapsed ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
                  ${isSubmenuOpen
                    ? 'bg-blue-800 text-white shadow-lg shadow-blue-900/50'
                    : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                  }
                `}
                title={isCollapsed ? nav.name : ''}
              >
                {isSubmenuOpen && !isCollapsed && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></span>
                )}
                <span className={`flex-shrink-0 ${isSubmenuOpen ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                  <CustomIcon icon={nav.icon} className="w-5 h-5" />
                </span>
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left text-sm font-medium whitespace-nowrap">{nav.name}</span>
                    <CustomIcon 
                      icon={isSubmenuOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        isSubmenuOpen 
                          ? 'rotate-180 text-white' 
                          : 'text-blue-200 group-hover:text-white'
                      }`}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${isCollapsed ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
                    ${isItemActive
                      ? 'bg-blue-800 text-white shadow-lg shadow-blue-900/50'
                      : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                    }
                  `}
                  title={isCollapsed ? nav.name : ''}
                >
                  {isItemActive && !isCollapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></span>
                  )}
                  <span className={`flex-shrink-0 ${isItemActive ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                    <CustomIcon icon={nav.icon} className="w-5 h-5" />
                  </span>
                  {!isCollapsed && (
                    <span className="ml-3 text-sm font-medium whitespace-nowrap">{nav.name}</span>
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
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isSubmenuOpen
                    ? `${subMenuHeight[`main-${index}`] || 0}px`
                    : '0px'
                }}
              >
                <ul className="mt-1 space-y-1 ml-9">
                  {nav.subItems?.map((subItem) => {
                    const isSubItemActive = isActive(subItem.path)
                    return (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.path}
                          className={`
                            flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 whitespace-nowrap group relative
                            ${isSubItemActive
                              ? 'bg-blue-700/80 text-white font-medium shadow-md'
                              : 'text-blue-200 hover:bg-blue-800/60 hover:text-white'
                            }
                          `}
                        >
                          {isSubItemActive && (
                            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400 rounded-r"></span>
                          )}
                          <span className="ml-1">{subItem.name}</span>
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
        fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-900 to-indigo-900 
        transition-all duration-300 ease-in-out shadow-xl
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-blue-800/50 transition-all duration-300 bg-blue-900/30
          ${isCollapsed ? 'justify-center px-2' : 'px-4'}
        `}>
          {isCollapsed ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/30">
              <span className="text-white font-bold text-xl">T</span>
            </div>
          ) : (
            <Image 
              src="/material/Tokodus__1_-removebg-preview.webp" 
              alt="Tokodus"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="mb-6">
            {!isCollapsed && (
              <h2 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-blue-300/80">
                Main Menu
              </h2>
            )}
            {renderMenuItems()}
          </div>
        </nav>
      </div>
    </aside>
  )
}