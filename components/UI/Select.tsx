// components/UI/Select.tsx
interface SelectProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  error,
  className = ''
}: SelectProps) {
  // Filter untuk menghilangkan duplikat value kosong
  const uniqueOptions = options.reduce((acc, option) => {
    // Skip jika value sudah ada atau value kosong duplikat
    if (acc.some(item => item.value === option.value && option.value === '')) {
      return acc
    }
    return [...acc, option]
  }, [] as Array<{ value: string; label: string }>)

  return (
    <div className="w-full">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm 
          focus:ring-blue-500 focus:border-blue-500 
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          text-gray-600
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {uniqueOptions.map((option) => (
          <option 
            key={`${option.value}-${option.label}`} // Key yang unik
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}