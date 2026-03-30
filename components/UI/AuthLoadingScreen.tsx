// components/UI/AuthLoadingScreen.tsx
// Full-screen loading yang muncul saat auth sedang dicek
// Mencegah flash konten sebelum redirect terjadi

import { Icon } from '@iconify/react'

export default function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner + logo */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon="mdi:package-variant" className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Tokodus Admin</p>
          <p className="text-xs text-slate-400 mt-1">Memeriksa sesi login...</p>
        </div>

        {/* Dot loader */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
