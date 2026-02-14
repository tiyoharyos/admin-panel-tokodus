'use client'
import { Icon } from '@iconify/react'
import { ReactNode } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: string | ReactNode
  rightIcon?: string | ReactNode
  helperText?: string
  containerClass?: string
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  helperText,
  containerClass = '',
  className = '',
  disabled,
  ...props
}: InputProps) {
  // Helper function untuk render icon
  const renderIcon = (icon: string | ReactNode, position: 'left' | 'right') => {
    if (!icon) return null
    
    if (typeof icon === 'string') {
      // Jika icon adalah string (nama icon)
      return <Icon icon={icon} className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
    }
    
    // Jika icon adalah ReactNode (komponen seperti <span>Rp</span>)
    return icon
  }

  return (
    <div className={containerClass}>
      {label && (
        <label className={`block text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {renderIcon(leftIcon, 'left')}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 border rounded-xl
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            placeholder:text-gray-400
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'bg-gray-50' : 'bg-white'}
            ${className}
          `}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {renderIcon(rightIcon, 'right')}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : disabled ? 'text-gray-400' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}