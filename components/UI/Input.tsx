'use client'

import { Icon } from '@iconify/react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: string
  rightIcon?: string
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
  ...props
}: InputProps) {
  return (
    <div className={containerClass}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon={leftIcon} className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 border rounded-xl
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            placeholder:text-gray-400
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon icon={rightIcon} className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}