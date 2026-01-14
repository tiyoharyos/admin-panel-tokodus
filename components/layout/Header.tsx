'use client'

import { useState } from 'react'
import Image from 'next/image'
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
        email: 'admin@tokodus.com',
        role: 'Administrator'
      }
    } catch {
      return {
        username: 'ss',
        email: 'ss',
        role: 'Administrator'
      }
    }
  })
  
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  // ✅ LOGOUT WITH POPUP
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Anda akan keluar dari akun ini.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      focusCancel: true
    })

    if (result.isConfirmed) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('rememberedEmail')
      localStorage.removeItem('rememberedPassword')
      localStorage.removeItem('rememberMe')

      await Swal.fire({
        icon: 'success',
        title: 'Berhasil Logout',
        text: 'Sampai jumpa lagi 👋',
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
        transition-all duration-300 shadow-sm
        ${isSidebarCollapsed ? 'left-16' : 'left-64'}
      `}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
          >
            <CustomIcon 
              icon={isSidebarCollapsed ? 'mdi:menu-open' : 'mdi:menu'} 
              className="w-5 h-5 text-gray-600 group-hover:text-gray-900" 
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

        {/* Right side */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-all duration-200"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {currentUser?.username}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser?.role}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <CustomIcon icon="mdi:account" className="text-white w-6 h-6" />
            </div>

            <CustomIcon 
              icon="mdi:chevron-down" 
              className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <p className="text-sm font-semibold">{currentUser?.username}</p>
                  <p className="text-xs text-gray-600">{currentUser?.email}</p>
                </div>

                <div className="border-t p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <CustomIcon icon="mdi:logout" className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
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
