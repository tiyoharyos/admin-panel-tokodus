'use client'

import { Icon } from '@iconify/react'
import Card from './Card'

interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  trend?: number
  trendLabel?: string
  iconColor?: string
  bgColor?: string
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  iconColor = 'text-blue-600',
  bgColor = 'bg-blue-50'
}: StatsCardProps) {
  const trendColor = trend && trend > 0 ? 'text-green-600' : 'text-red-600'
  const trendIcon = trend && trend > 0 ? 'mdi:trending-up' : 'mdi:trending-down'

  return (
    <Card hoverable className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {(trend || trendLabel) && (
            <div className="flex items-center mt-2">
              {trend && (
                <span className={`text-sm font-medium ${trendColor} flex items-center`}>
                  <Icon icon={trendIcon} className="w-4 h-4 mr-1" />
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              {trendLabel && (
                <span className="text-sm text-gray-500 ml-2">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon icon={icon} className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      {/* Decorative element */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
    </Card>
  )
}