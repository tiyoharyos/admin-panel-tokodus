'use client'

import { useState } from 'react'
import Image from 'next/image'
import CustomIcon from '../UI/Icon'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onToggleSidebar: () => void
  isSidebarCollapsed: boolean
}

export default function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const [currentUser] = useState<any>(() => {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : {
        username: 'Admissn',
        email: 'ss',
        role: 'ssr'
      }
    } catch {
      return {
        username: 'ss',
        email: 'ss',
        role: 'ss'
      }
    }
  })
  
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <header 
      className={`
        fixed top-0 right-0 z-30 h-16 
        bg-white border-b border-gray-200
        transition-all duration-300 shadow-sm
        ${isSidebarCollapsed ? 'left-16' : 'left-64'}
      `}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Toggle button & Greeting */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <CustomIcon 
              icon={isSidebarCollapsed ? 'mdi:menu-open' : 'mdi:menu'} 
              className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" 
            />
          </button>
          
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-gray-900">
              Welcome back, <span className="text-blue-600">{currentUser?.username}</span>
            </h1>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2  hover:bg-gray-50 transition-all duration-200"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {currentUser?.username || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser?.role || 'Administrator'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <CustomIcon icon="mdi:account" className="text-white w-6 h-6" />
            </div>
            <CustomIcon 
              icon="mdi:chevron-down" 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slide-in">
                {/* User Info Card */}
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <CustomIcon icon="mdi:account" className="text-white w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {currentUser?.username || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {currentUser?.role || 'Administrator'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {currentUser?.email || 'admin@tokodus.com'}
                  </p>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                  >
                    <CustomIcon icon="mdi:account-cog" className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <span className="group-hover:text-gray-900 transition-colors">Profile Settings</span>
                  </button>
                  
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                  >
                    <CustomIcon icon="mdi:bell" className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <span className="group-hover:text-gray-900 transition-colors">Notifications</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">3</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                  >
                    <CustomIcon icon="mdi:logout" className="w-5 h-5 group-hover:text-red-700 transition-colors" />
                    <span className="font-medium group-hover:text-red-700 transition-colors">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}