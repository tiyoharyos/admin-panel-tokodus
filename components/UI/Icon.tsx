'use client'

import dynamic from 'next/dynamic'

// Dynamically import Iconify to avoid SSR issues
const IconifyIcon = dynamic(() => import('@iconify/react').then(mod => mod.Icon), {
  ssr: false,
  loading: () => <div className="w-5 h-5"></div>
})

export default function Icon({ icon, className }: { icon: string; className?: string }) {
  return <IconifyIcon icon={icon} className={className} />
}