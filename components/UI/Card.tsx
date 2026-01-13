'use client'
// components/UI/Card.tsx
interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  bordered?: boolean
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  className = '',
  hoverable = false,
  bordered = true,
  shadow = 'md',
  padding = 'md'
}: CardProps) {
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  }

  const borderClass = bordered ? 'border border-gray-200' : ''

  return (
    <div
      className={`
        bg-white rounded-xl
        ${borderClass}
        ${shadowClasses[shadow]}
        ${paddingClasses[padding]}
        ${hoverable ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}