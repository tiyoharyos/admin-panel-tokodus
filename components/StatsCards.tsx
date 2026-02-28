// app/(protected)/box-models/components/StatsCards.tsx
import { Icon } from '@iconify/react'
import Card from '@/components/UI/Card'

interface StatsCardsProps {
  stats: {
    totalModels: number
    activeModels: number
    withFormulas: number
    withoutFormulas: number
    mailerBoxCount: number
    shoeBoxCount: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Models',
      value: stats.totalModels,
      icon: 'mdi:package-variant',
      color: 'blue',
      subValue: `${stats.activeModels} Aktif`,
      subValue2: `${stats.totalModels - stats.activeModels} Nonaktif`
    },
    {
      title: 'Dengan Formula',
      value: stats.withFormulas,
      icon: 'mdi:calculator',
      color: 'green',
      percentage: stats.totalModels ? Math.round((stats.withFormulas / stats.totalModels) * 100) : 0
    },
    {
      title: 'Tanpa Formula',
      value: stats.withoutFormulas,
      icon: 'mdi:alert-circle',
      color: 'amber'
    },
    {
      title: 'Kategori',
      value: `Mailer: ${stats.mailerBoxCount}`,
      icon: 'mdi:chart-pie',
      color: 'purple',
      subValue: `Shoe: ${stats.shoeBoxCount}`
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  )
}

function StatCard({ title, value, icon, color, subValue, subValue2, percentage }: any) {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 text-blue-600 bg-blue-100',
    green: 'from-green-50 to-emerald-50 text-green-600 bg-green-100',
    amber: 'from-amber-50 to-yellow-50 text-amber-600 bg-amber-100',
    purple: 'from-purple-50 to-pink-50 text-purple-600 bg-purple-100'
  }[color]

  return (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
      <div className={`absolute top-0 right-0 w-20 h-20 ${colorClasses.split(' ')[2]} rounded-bl-full opacity-50 group-hover:opacity-100 transition-all`}></div>
      <div className="space-y-2 relative">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <Icon icon={icon} className={`w-4 h-4 ${colorClasses.split(' ')[1]}`} />
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {percentage !== undefined && (
            <span className="text-sm text-gray-500">({percentage}%)</span>
          )}
        </div>
        {subValue && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 font-medium flex items-center gap-1">
              <Icon icon="mdi:check-circle" className="w-3 h-3" />
              {subValue}
            </span>
            {subValue2 && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <Icon icon="mdi:minus-circle" className="w-3 h-3" />
                  {subValue2}
                </span>
              </>
            )}
          </div>
        )}
        {percentage !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`bg-${color}-500 h-1.5 rounded-full transition-all`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}
      </div>
    </Card>
  )
}