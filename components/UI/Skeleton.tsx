// components/UI/Skeleton.tsx
import { ReactNode } from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  count?: number
  children?: ReactNode
}

export default function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  count = 1,
  children
}: SkeletonProps) {
  
  const baseClass = 'animate-pulse bg-gray-200 rounded'
  
  const variantClass = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }[variant]

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  }

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className={`${baseClass} ${variantClass} ${className}`} 
            style={style}
          />
        ))}
      </>
    )
  }

  if (children) {
    return (
      <div className={`${baseClass} ${className}`} style={style}>
        {children}
      </div>
    )
  }

  return (
    <div className={`${baseClass} ${variantClass} ${className}`} style={style} />
  )
}