'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useRouter, usePathname } from 'next/navigation'
import Swal from 'sweetalert2'
import { navItems, NavItem } from '@/constants/menu' // pastikan path ini benar

interface UserData {
  id: string
  email: string
  role: string
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

interface HeaderProps {
  onToggleSidebar: () => void
  isSidebarCollapsed: boolean
}

export default function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState('Tokodus')
  const [activeItemIcon, setActiveItemIcon] = useState<string | null>(null)

  // Cari judul dan ikon halaman berdasarkan pathname
  useEffect(() => {
    const findActiveItem = (path: string): { name: string; icon?: string } => {
      for (const item of navItems) {
        if (item.path === path) {
          return { name: item.name, icon: item.icon }
        }
        if (item.subItems) {
          for (const sub of item.subItems) {
            if (sub.path === path) {
              return { name: sub.name, icon: item.icon } // gunakan ikon parent
            }
          }
        }
      }
      return { name: 'Tokodus' }
    }
    const active = findActiveItem(pathname)
    setPageTitle(active.name)
    setActiveItemIcon(active.icon || null)
  }, [pathname])

  const [currentUser] = useState<UserData>(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const parsed: UserData = JSON.parse(raw)
        if (parsed?.email && parsed?.role) return parsed
      }
    } catch {
      /* ignore */
    }
    return { id: '0', email: 'admin@tokodus.com', role: '1' }
  })

  const displayName = getDisplayName(currentUser.email)
  const displayRole = getRoleLabel(currentUser.role)
  const avatarInitial = displayName.charAt(0).toUpperCase()

  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()

  const notifications = [
    { id: 1, title: 'New order received', time: '2 min ago', unread: true },
    { id: 2, title: 'Production completed', time: '1 hour ago', unread: true },
    { id: 3, title: 'Low stock alert', time: '3 hours ago', unread: false },
    { id: 4, title: 'Weekly report ready', time: '1 day ago', unread: false },
  ]
  const unreadCount = notifications.filter((n) => n.unread).length

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
    })
    if (result.isConfirmed) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      await Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been successfully logged out',
        timer: 1200,
        showConfirmButton: false,
      })
      router.push('/login')
    }
  }

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16
        bg-white/95 backdrop-blur-md
        border-b border-slate-100 shadow-sm
        transition-all duration-300
        ${isSidebarCollapsed ? 'left-[72px]' : 'left-64'}
      `}
    >
      <div className="flex items-center justify-between w-full h-full px-5">
        {/* ── Left: toggle, divider, title dengan icon ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400
                       hover:bg-white/10 active:scale-95 transition-all duration-150"
          >
            <Icon
              icon={isSidebarCollapsed ? 'mdi:menu-open' : 'mdi:menu'}
              className="w-5 h-5"
            />
          </button>

          <div className="hidden sm:block w-px h-5 bg-white/10" />

          {/* Judul dengan ikon (jika ada) */}
          <div className="hidden sm:flex items-center gap-2">
            {activeItemIcon && (
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Icon icon={activeItemIcon} className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            )}
            <span className="text-sm font-semibold text-slate-700 tracking-tight">
              {pageTitle}
            </span>
          </div>
        </div>

        {/* ── Right: notifications, user ── */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications((v) => !v)
                setShowDropdown(false)
              }}
              aria-label="Notifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:bg-white/10 active:scale-95 transition-all duration-150"
            >
              <Icon icon="mdi:bell-outline" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-[9px] right-[9px] w-2 h-2 rounded-full bg-red-500 border-2 border-slate-900 animate-pulse"
                />
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div
                  className="absolute right-0 mt-2.5 w-80 z-50 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* header notifikasi putih */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                      Tandai dibaca
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-5 py-3.5 cursor-pointer
                                   hover:bg-slate-50 transition-colors duration-150"
                      >
                        <span
                          className={`block mt-[7px] w-2 h-2 rounded-full flex-shrink-0
                            ${n.unread ? 'bg-indigo-500' : 'bg-slate-300'}`}
                        />
                        <div>
                          <p
                            className={`text-[13px] leading-snug ${
                              n.unread
                                ? 'font-medium text-slate-800'
                                : 'font-normal text-slate-500'
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-[11.5px] text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100">
                    <Link
                      href="/notifications"
                      className="block text-center text-[13px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      onClick={() => setShowNotifications(false)}
                    >
                      Lihat semua notifikasi →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 mx-1 bg-white/10" />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDropdown((v) => !v)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-all duration-150 group"
            >
              {/* Name & Role */}
              <div className="hidden md:block text-right">
                <p className="text-[13px] font-semibold text-slate-700 tracking-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">{displayRole}</p>
              </div>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-indigo-700 group-hover:ring-2 group-hover:ring-indigo-400 transition-all duration-200"
              >
                {avatarInitial}
              </div>

              <Icon
                icon="mdi:chevron-down"
                className={`w-4 h-4 text-slate-500 transition-transform duration-200
                  ${showDropdown ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div
                  className="absolute right-0 mt-2.5 w-56 z-50 overflow-hidden
                             rounded-2xl bg-white border border-slate-200 shadow-xl
                             animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* User card */}
                  <div className="px-4 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                   text-sm font-bold text-white
                                   bg-gradient-to-br from-indigo-500 to-indigo-700"
                      >
                        {avatarInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900">{displayName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                        <span
                          className="inline-block mt-1 px-1.5 py-0.5 rounded-md
                                     text-[10px] font-semibold bg-indigo-50 text-indigo-600"
                        >
                          {displayRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Settings */}
                  <div className="p-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full
                                 text-[13px] font-medium text-slate-700
                                 hover:bg-slate-50 transition-colors duration-150"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-indigo-50">
                        <Icon icon="mdi:account-cog" className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      Profile Settings
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full
                                 text-[13px] font-medium text-red-500
                                 hover:bg-red-50 transition-colors duration-150"
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-50">
                        <Icon icon="mdi:logout" className="w-3.5 h-3.5 text-red-500" />
                      </div>
                      Logout
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