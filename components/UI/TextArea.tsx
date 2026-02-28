// components/UI/TextArea.tsx
'use client'

import React, { TextareaHTMLAttributes } from 'react'
import { Icon } from '@iconify/react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  containerClassName?: string
  labelClassName?: string
  textareaClassName?: string
  errorClassName?: string
  helperClassName?: string
  showCount?: boolean
  maxLength?: number
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  containerClassName = '',
  labelClassName = '',
  textareaClassName = '',
  errorClassName = '',
  helperClassName = '',
  showCount = false,
  maxLength,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  required = false,
  rows = 4,
  ...props
}) => {
  const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const currentLength = typeof value === 'string' ? value.length : 0
  
  const baseTextareaClasses = 'w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-700 placeholder-gray-400'
  
  const stateClasses = error
    ? 'border-red-300 focus:ring-red-200 focus:border-red-500 bg-red-50/30'
    : disabled || readOnly
    ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-500'
    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 hover:border-gray-400'
  
  const textareaClasses = [
    baseTextareaClasses,
    stateClasses,
    fullWidth ? 'w-full' : 'w-full md:w-96',
    textareaClassName
  ].join(' ')

  const labelClasses = [
    'block text-sm font-medium mb-2',
    error ? 'text-red-600' : 'text-gray-700',
    disabled ? 'opacity-50' : '',
    labelClassName
  ].join(' ')

  const errorClasses = [
    'text-sm text-red-600 mt-1 flex items-center gap-1',
    errorClassName
  ].join(' ')

  const helperClasses = [
    'text-sm text-gray-500 mt-1',
    helperClassName
  ].join(' ')

  const countClasses = [
    'text-xs',
    maxLength && currentLength >= maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'
  ].join(' ')

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (maxLength && e.target.value.length > maxLength) {
      return
    }
    onChange?.(e)
  }

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label htmlFor={textareaId} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          id={textareaId}
          className={textareaClasses}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-3 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs border border-gray-200">
            <span className={countClasses}>
              {currentLength} / {maxLength}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <div id={`${textareaId}-error`} className={errorClasses} role="alert">
          <Icon icon="mdi:alert-circle" className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {!error && helperText && (
        <div id={`${textareaId}-helper`} className={helperClasses}>
          {helperText}
        </div>
      )}
    </div>
  )
}

export default TextArea