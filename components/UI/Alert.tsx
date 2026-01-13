// components/UI/Alert.jsx
'use client'

import { useState, useEffect } from 'react'
import CustomIcon from './Icon'

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  duration = 5000,
  showIcon = true,
  showClose = true,
  className = '',
  children
}) => {
  const [isVisible, setIsVisible] = useState(true)

  const alertConfig = {
    info: {
      icon: 'mdi:information',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    success: {
      icon: 'mdi:check-circle',
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-600'
    },
    warning: {
      icon: 'mdi:alert-circle',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    danger: {
      icon: 'mdi:alert-octagon',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-600'
    }
  }

  const config = alertConfig[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4 mb-4 animate-slideIn ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <CustomIcon icon={config.icon} className={`w-5 h-5 ${config.iconColor} mt-0.5`} />
          </div>
        )}
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.text}`}>
              {title}
            </h3>
          )}
          {message && (
            <div className={`mt-1 text-sm ${config.text}`}>
              {message}
            </div>
          )}
          {children}
        </div>
        
        {showClose && (
          <button
            type="button"
            onClick={() => {
              setIsVisible(false)
              if (onClose) onClose()
            }}
            className={`ml-auto pl-3 -my-1.5 -mr-1.5 flex-shrink-0 p-1.5 rounded-md ${config.text} hover:opacity-80`}
          >
            <CustomIcon icon="mdi:close" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert