// components/UI/PageHeader.tsx
// Komponen global untuk header setiap halaman
// Usage:
//   <PageHeader title="Orders" subtitle="Kelola semua pesanan" />
//   <PageHeader title="Material" subtitle="Stok material" action={<Button>Tambah</Button>} />

import { cn } from '@/lib/utils'
import { Icon } from '@iconify/react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  action?: React.ReactNode        // tombol / element di kanan
  className?: string
}

export default function PageHeader({ title, subtitle, icon, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Icon icon={icon} className="w-5 h-5 text-indigo-600" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
