// components/UI/Toast.jsx
'use client'

import { useState, useEffect } from 'react'
import CustomIcon from './Icon'

const Toast = ({
  type = 'info',
  message,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true)

  const toastConfig = {
    info: {
      icon: 'mdi:information',
      bg: 'bg-blue-600',
      iconColor: 'text-white'
    },
    success: {
      icon: 'mdi:check-circle',
      bg: 'bg-green-600',
      iconColor: 'text-white'
    },
    warning: {
      icon: 'mdi:alert-circle',
      bg: 'bg-yellow-600',
      iconColor: 'text-white'
    },
    danger: {
      icon: 'mdi:alert-octagon',
      bg: 'bg-red-600',
      iconColor: 'text-white'
    }
  }

  const config = toastConfig[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div className={`${config.bg} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-72 animate-slideIn`}>
      <CustomIcon icon={config.icon} className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          if (onClose) onClose()
        }}
        className="ml-auto text-white/80 hover:text-white"
      >
        <CustomIcon icon="mdi:close" className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Toast