// app/(protected)/layout.tsx
'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function ProtectedLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  // Hapus semua kode terkait auth dan token

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
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
      
      {/* Content area - disesuaikan dengan ukuran sidebar baru */}
      <main 
        className={`
          pt-16 min-h-screen transition-all duration-300
          ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}
        `}
      >
          {children}
      </main>
    </div>
  )
}