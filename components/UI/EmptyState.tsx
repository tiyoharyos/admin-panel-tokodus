import { Icon } from '@iconify/react'
import Button from './Button'

interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({
  icon = 'mdi:package-variant',
  title,
  message,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Icon icon={icon} className="w-16 h-16 text-gray-300 mb-4" />
      <p className="text-gray-500 font-medium text-lg">{title}</p>
      {message && (
        <p className="text-sm text-gray-400 mt-2">{message}</p>
      )}
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          onClick={onAction}
          className="mt-6"
          icon="mdi:plus"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}