'use client'

import { useState } from 'react'
import Link from 'next/link'
import CustomIcon from '../UI/Icon'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

interface HeaderProps {
  onToggleSidebar: () => void
  isSidebarCollapsed: boolean
}

export default function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const [currentUser] = useState<any>(() => {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : {
        username: 'Admin',
        email: 'admin@tailpanel.com',
        role: 'Administrator'
      }
    } catch {
      return {
        username: 'Admin',
        email: 'admin@tailpanel.com',
        role: 'Administrator'
      }
    }
  })
  
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()

  // Notifications data
  const notifications = [
    { id: 1, title: 'New order received', time: '2 min ago', unread: true },
    { id: 2, title: 'Production completed', time: '1 hour ago', unread: true },
    { id: 3, title: 'Low stock alert', time: '3 hours ago', unread: false },
    { id: 4, title: 'Weekly report ready', time: '1 day ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true
    })

    if (result.isConfirmed) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      await Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been successfully logged out',
        timer: 1200,
        showConfirmButton: false
      })

      router.push('/login')
    }
  }

  return (
    <header 
      className={`
        fixed top-0 right-0 z-30 h-16 
        bg-white border-b border-gray-200
        transition-all duration-300
        ${isSidebarCollapsed ? 'left-20' : 'left-64'}
      `}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            <CustomIcon 
              icon={isSidebarCollapsed ? 'mdi:menu-open' : 'mdi:menu'} 
              className="w-5 h-5 text-gray-600" 
            />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CustomIcon icon="mdi:bell-outline" className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <span className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                        Mark all as read
                      </span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          notification.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <Link
                      href="/notifications"
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900">
                  {currentUser?.username}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser?.role}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <CustomIcon icon="mdi:account" className="text-white w-5 h-5" />
              </div>

              <CustomIcon 
                icon="mdi:chevron-down" 
                className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Profile Dropdown */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-medium text-gray-900">{currentUser?.username}</p>
                    <p className="text-sm text-gray-600 truncate">{currentUser?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <CustomIcon icon="mdi:account-cog" className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </div>
                  <div className="border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <CustomIcon icon="mdi:logout" className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}