'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import CustomIcon from '../UI/Icon'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [expandedSettings, setExpandedSettings] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Navigation items dengan icon Iconify
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: 'mdi:view-dashboard' 
    },
    { 
      name: 'Orders', 
      href: '/orders', 
      icon: 'mdi:file-document-multiple' 
    },
    { 
      name: 'Designs', 
      href: '/designs', 
      icon: 'mdi:draw' 
    },
    { 
      name: 'Materials', 
      href: '/materials', 
      icon: 'mdi:package-variant' 
    },
    { 
      name: 'Production', 
      href: '/production', 
      icon: 'mdi:factory' 
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: 'mdi:chart-bar' 
    },
    { 
      name: 'Settings', 
      href: '#', 
      icon: 'mdi:cog',
      onClick: () => setExpandedSettings(!expandedSettings),
      children: [
        { name: 'Box Models', href: '/box-models', icon: 'mdi:cube-outline' },
        { name: 'Price Settings', href: '/price-settings', icon: 'mdi:currency-usd' },
        { name: 'Material Indices', href: '/material-indices', icon: 'mdi:database' },
        { name: 'Printing Machines', href: '/printing-machines', icon: 'mdi:printer' },
      ]
    },
  ]

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
    
    // Auto expand settings jika di halaman pengaturan
    if (pathname.startsWith('/pengaturan')) {
      setExpandedSettings(true)
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
    setIsOpen(false)
  }

  // Cek jika pathname aktif di dalam settings
  const isSettingsActive = pathname.startsWith('/pengaturan')

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-lg"
        >
          {isOpen ? (
            <CustomIcon icon="mdi:close" />
          ) : (
            <CustomIcon icon="mdi:menu" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-900 to-indigo-900 
        transform lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
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
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.name === 'Settings' && pathname.startsWith('/pengaturan'))
              
              const hasChildren = item.children && item.children.length > 0
              
              return (
                <div key={item.name}>
                  {item.name === 'Settings' ? (
                    <button
                      onClick={item.onClick}
                      className={`
                        w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                        ${isActive
                          ? 'bg-blue-800 text-white'
                          : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                        }
                      `}
                    >
                      <CustomIcon icon={item.icon} className="flex-shrink-0" />
                      <span className="ml-3 text-left flex-1">{item.name}</span>
                      {hasChildren && (
                        <CustomIcon 
                          icon={expandedSettings ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
                          className="ml-auto"
                        />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                        ${isActive
                          ? 'bg-blue-800 text-white'
                          : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                        }
                      `}
                    >
                      <CustomIcon icon={item.icon} className="flex-shrink-0" />
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  )}
                  
                  {/* Dropdown children untuk Settings */}
                  {hasChildren && expandedSettings && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={`
                              flex items-center px-3 py-2 text-sm rounded transition-colors
                              ${isChildActive
                                ? 'bg-blue-700 text-white'
                                : 'text-blue-200 hover:bg-blue-800'
                              }
                            `}
                          >
                            <CustomIcon icon={child.icon} className="w-4 h-4 mr-2" />
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
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
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
            >
              <CustomIcon icon="mdi:logout" />
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}