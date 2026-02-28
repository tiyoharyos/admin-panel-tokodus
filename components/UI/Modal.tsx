'use client'
// components/UI/Modal.tsx
import { useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  footer?: React.ReactNode
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
  className = ''
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm:   'max-w-md',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* ── Modal Container ── */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`relative w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-200 ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Modal Card ── */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {/* Accent dot */}
                <span className="block w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-600" />
                <h3 className="text-[15px] font-semibold text-slate-800 tracking-tight">
                  {title}
                </h3>
              </div>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400
                             hover:text-slate-600 hover:bg-slate-100
                             transition-all duration-150 active:scale-95"
                  aria-label="Tutup"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto
                            scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200
                            hover:scrollbar-thumb-slate-300 text-sm text-slate-600 leading-relaxed">
              {children}
            </div>

            {/* ── Footer ── */}
            {footer && (
              <div className="flex items-center justify-end gap-2.5 px-6 py-4
                              bg-slate-50 border-t border-slate-100">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}