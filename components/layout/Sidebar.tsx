'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import CustomIcon from '../UI/Icon'

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  subItems?: { name: string; path: string }[];
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null)
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({})
  const pathname = usePathname()
  const router = useRouter()
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Navigation items dengan struktur seperti kode kedua
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
      ]
    },
  ]

  const isActive = useCallback((path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }, [pathname])

  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          setCurrentUser(JSON.parse(userData))
        } else {
          setCurrentUser({
            username: 'Admin',
            email: 'admin@tokodus.com',
            role: 'Administrator'
          })
        }
      } catch (error) {
        console.error('Error getting user data:', error)
        setCurrentUser({
          username: 'Admin',
          email: 'admin@tokodus.com',
          role: 'Administrator'
        })
      }
    }

    getUserData()
    
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

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null)
    }
  }, [pathname, isActive])

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }))
      }
    }
  }, [openSubmenu])

  const handleSubmenuToggle = (index: number) => {
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
    setIsOpen(false)
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
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group
                  ${isSubmenuOpen
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }
                `}
              >
                <span className={`flex-shrink-0 ${isSubmenuOpen ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                  <CustomIcon icon={nav.icon} className="w-5 h-5" />
                </span>
                <span className="ml-3 flex-1 text-left">{nav.name}</span>
                <CustomIcon 
                  icon={isSubmenuOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    isSubmenuOpen 
                      ? 'rotate-180 text-white' 
                      : 'text-blue-200 group-hover:text-white'
                  }`}
                />
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group
                    ${isItemActive
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }
                  `}
                >
                  <span className={`flex-shrink-0 ${isItemActive ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
                    <CustomIcon icon={nav.icon} className="w-5 h-5" />
                  </span>
                  <span className="ml-3">{nav.name}</span>
                </Link>
              )
            )}
            
            {/* Submenu items */}
            {hasSubItems && (
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
                          onClick={() => setIsOpen(false)}
                          className={`
                            flex items-center px-3 py-2 text-sm rounded transition-colors
                            ${isSubItemActive
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                            }
                          `}
                        >
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
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-lg hover:bg-gray-50 transition-colors"
        >
          {isOpen ? (
            <CustomIcon icon="mdi:close" className="w-5 h-5" />
          ) : (
            <CustomIcon icon="mdi:menu" className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-900 to-indigo-900 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-blue-800">
            <Image 
              src="/material/Tokodus__1_-removebg-preview.webp" 
              alt="Tokodus"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <div className="mb-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="mb-4 text-xs uppercase leading-[20px] text-blue-300">
                    Main Menu
                  </h2>
                  {renderMenuItems()}
                </div>
              </div>
            </div>
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
                <CustomIcon icon="mdi:account" className="text-white w-6 h-6" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {currentUser?.username || 'Admin'}
                </p>
                <p className="text-xs text-blue-200">
                  {currentUser?.role || 'Administrator'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors text-blue-100 hover:text-white hover:bg-blue-800"
            >
              <CustomIcon icon="mdi:logout" className="w-5 h-5" />
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}