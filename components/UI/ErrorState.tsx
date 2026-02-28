import { Icon } from '@iconify/react'
import Button from './Button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  icon?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ErrorState({ 
  title = 'Error Loading Data',
  message,
  onRetry,
  retryLabel = 'Coba Lagi',
  icon = 'mdi:alert-circle',
  variant = 'danger'
}: ErrorStateProps) {
  const variantClasses = {
    danger: {
      container: 'border-red-200 bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700'
    },
    warning: {
      container: 'border-amber-200 bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'text-amber-800',
      message: 'text-amber-700'
    },
    info: {
      container: 'border-blue-200 bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700'
    }
  }

  const classes = variantClasses[variant]

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={`max-w-lg w-full border ${classes.container} rounded-xl shadow-lg p-8`}>
        <div className="text-center">
          <div className={`w-20 h-20 ${classes.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon icon={icon} className={`w-10 h-10 ${classes.iconColor}`} />
          </div>
          <h3 className={`text-xl font-bold ${classes.title} mb-2`}>{title}</h3>
          <p className={`${classes.message} mb-6`}>{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant={variant} className="mx-auto">
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}