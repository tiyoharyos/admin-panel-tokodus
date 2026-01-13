import { Icon } from '@iconify/react'
// components/UI/Icon.tsx
interface IconProps {
  icon: string
  className?: string
  width?: string | number
  height?: string | number
}

export default function CustomIcon({ icon, className = '', width = 20, height = 20 }: IconProps) {
  return (
    <Icon 
      icon={icon} 
      className={className} 
      width={width} 
      height={height} 
    />
  )
}