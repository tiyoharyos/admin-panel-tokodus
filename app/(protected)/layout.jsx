// app/((protected))/layout.jsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import axios from '../../lib/axios' // Import default

export default function ProtectedLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Cek apakah user sudah login dengan melihat token di localStorage
        const token = localStorage.getItem('token')
        console.log('Token:', token)
        
        if (!token) {
          console.log('No token found, redirecting to login')
          router.push('/login')
          return
        }

        // Validasi token dengan API
        await validateToken(token)
        
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, pathname])

  // Fungsi untuk validasi token dengan API
  const validateToken = async (token) => {
    try {
      // Anda perlu menyesuaikan endpoint validasi token
      // Contoh: Cek endpoint yang membutuhkan authentication
      const response = await axios.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      console.log('Token validation response:', response)
      
      if (response.status === 200) {
        console.log('Token valid')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Token validation failed:', error)
      // Hapus token yang tidak valid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw error
    }
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
      <Sidebar />
      <div className="lg:pl-64">
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}