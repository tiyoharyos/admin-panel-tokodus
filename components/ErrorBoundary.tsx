// components/ErrorBoundary.tsx
// Menangkap error runtime supaya 1 halaman crash tidak merusak seluruh app
// Usage:
//   <ErrorBoundary>
//     <KomponenYangMungkinError />
//   </ErrorBoundary>

'use client'

import React from 'react'
import { Icon } from '@iconify/react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode   // opsional: custom UI saat error
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Bisa dikirim ke logging service (Sentry, dll) di sini
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:alert-circle-outline" className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Terjadi Kesalahan
            </h3>
            <p className="text-sm text-slate-500 mb-1">
              Halaman ini mengalami error dan tidak bisa ditampilkan.
            </p>
            {this.state.message && (
              <p className="text-xs text-slate-400 font-mono bg-slate-50 rounded-lg px-3 py-2 mt-3 mb-5 text-left break-words">
                {this.state.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Icon icon="mdi:refresh" className="w-4 h-4" />
                Coba Lagi
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Icon icon="mdi:home-outline" className="w-4 h-4" />
                Ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
