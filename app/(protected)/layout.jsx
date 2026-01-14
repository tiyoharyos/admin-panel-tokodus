'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import axios from '../../lib/axios'

export default function ProtectedLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          router.push('/login')
          return
        }

        // await validateToken(token)
        setIsLoading(false)
        
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, pathname])

  const validateToken = async (token) => {
    try {
      const response = await axios.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.status === 200) {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Token validation failed:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw error
    }
  }

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={handleToggleSidebar}
      />
      
      <Header 
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      {/* Content area */}
      <main 
        className={`
          pt-16 min-h-screen transition-all duration-300
          ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}