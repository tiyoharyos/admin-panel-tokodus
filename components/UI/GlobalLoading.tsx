// components/UI/GlobalLoading.tsx
import { Icon } from '@iconify/react'

interface GlobalLoadingProps {
  message?: string
}

export default function GlobalLoading({ message = 'Memuat data...' }: GlobalLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <Icon icon="mdi:package-variant" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="mt-6 text-lg font-medium text-gray-700">{message}</p>
        <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
      </div>
    </div>
  )
}