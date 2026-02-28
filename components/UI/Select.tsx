// components/UI/Select.tsx
'use client'
import { Icon } from '@iconify/react'
import { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  leftIcon?: string | ReactNode
  helperText?: string
  options: Array<{ value: string; label: string }>
  containerClass?: string
  placeholder?: string  // ✅ Tambah explicit prop agar tidak terserap ...props
}

export default function Select({
  label,
  error,
  leftIcon,
  helperText,
  options,
  containerClass = '',
  className = '',
  disabled,
  value,
  onChange,
  placeholder,  // ✅ Destructure sendiri, bukan lewat ...props
  ...props
}: SelectProps) {
  const renderIcon = (icon: string | ReactNode) => {
    if (!icon) return null
    if (typeof icon === 'string') {
      return <Icon icon={icon} className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
    }
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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            {renderIcon(leftIcon)}
          </div>
        )}
        <select
          className={`
            w-full px-4 py-2.5 border rounded-xl appearance-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 text-gray-700
            ${leftIcon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'bg-gray-50' : 'bg-white'}
            ${className}
          `}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        >
          {/* ✅ FIX: render placeholder sebagai option pertama yang disabled */}
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option, idx) => (
            <option key={`${option.value}-${idx}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Icon icon="mdi:chevron-down" className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        </div>
      </div>
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : disabled ? 'text-gray-400' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}