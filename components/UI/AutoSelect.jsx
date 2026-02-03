// components/UI/AutoSelect.jsx
'use client'

import { useState, useRef, useEffect } from 'react'
import CustomIcon from './Icon'

const AutoSelect = ({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  loading = false,
  disabled = false,
  className = "",
  renderOption,
  searchable = false,
  error = false,
  errorMessage = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label?.toLowerCase().includes(search.toLowerCase()) ||
        option.value?.toString().toLowerCase().includes(search.toLowerCase()) ||
        option.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`w-full px-3 py-2.5 text-left border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white flex items-center justify-between ${className} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
        } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''} transition-all duration-200`}
      >
        <div className="flex items-center overflow-hidden">
          {loading ? (
            <>
              <CustomIcon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin text-blue-600" />
              <span className="text-gray-500 truncate">Memuat...</span>
            </>
          ) : selectedOption ? (
            <>
              {selectedOption.icon && (
                <CustomIcon 
                  icon={selectedOption.icon} 
                  className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0"
                />
              )}
              <span className="text-gray-800 truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        <CustomIcon 
          icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
          className={`w-5 h-5 ${error ? 'text-red-500' : 'text-gray-400'} flex-shrink-0`}
        />
      </button>

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {searchable && (
            <div className="sticky top-0 p-2 bg-white border-b border-gray-200">
              <div className="relative">
                <CustomIcon 
                  icon="mdi:magnify" 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Cari..."
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <CustomIcon icon="mdi:close" className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {search ? "Tidak ditemukan" : "Tidak ada data"}
            </div>
          ) : (
            <ul className="py-1">
              {filteredOptions.map((option) => (
                <li key={option.value} className="px-1">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                      setSearch("")
                    }}
                    className={`w-full px-3 py-2.5 text-left flex items-center hover:bg-blue-50 transition-colors rounded mx-1 ${
                      value === option.value 
                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
                        : 'text-gray-700'
                    }`}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <>
                        {option.icon && (
                          <CustomIcon 
                            icon={option.icon} 
                            className={`w-4 h-4 mr-3 ${value === option.value ? 'text-blue-600' : 'text-gray-500'}`}
                          />
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                          )}
                        </div>
                        {value === option.value && (
                          <CustomIcon 
                            icon="mdi:check" 
                            className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0"
                          />
                        )}
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default AutoSelect