'use client'

import { Icon } from '@iconify/react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{
    value: string
    label: string
  }>
  leftIcon?: string
  helperText?: string
  containerClass?: string
}

export default function Select({
  label,
  error,
  options,
  leftIcon,
  helperText,
  containerClass = '',
  className = '',
  ...props
}: SelectProps) {
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
        <select
          className={`
            w-full px-4 py-2.5 border rounded-xl
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            appearance-none bg-white
            ${leftIcon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Icon icon="mdi:chevron-down" className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}