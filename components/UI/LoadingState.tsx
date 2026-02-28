import { Icon } from '@iconify/react'

interface LoadingStateProps {
  message?: string
  submessage?: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingState({ 
  message = 'Memuat data...', 
  submessage = 'Harap tunggu sebentar',
  icon = 'mdi:package-variant',
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: { spinner: 'w-12 h-12', icon: 'w-5 h-5', title: 'text-base', subtitle: 'text-xs' },
    md: { spinner: 'w-20 h-20', icon: 'w-8 h-8', title: 'text-lg', subtitle: 'text-sm' },
    lg: { spinner: 'w-28 h-28', icon: 'w-10 h-10', title: 'text-xl', subtitle: 'text-base' }
  }

  const classes = sizeClasses[size]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="relative">
          <div className={`${classes.spinner} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto`}></div>
          <Icon 
            icon={icon} 
            className={`${classes.icon} text-blue-600 absolute inset-0 m-auto animate-pulse`} 
          />
        </div>
        <p className={`mt-6 ${classes.title} font-medium text-gray-700`}>{message}</p>
        <p className={`${classes.subtitle} text-gray-500 mt-2`}>{submessage}</p>
      </div>
    </div>
  )
}