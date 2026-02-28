// utils/printSettingsHelpers.ts
import { Machine } from '@/types/printSettings'

export const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

export const formatSize = (panjang: string, lebar: string) => {
  return `${parseFloat(panjang).toFixed(1)} × ${parseFloat(lebar).toFixed(1)} cm`
}

export const MACHINE_FILTERS = {
  PM52: (name: string) => name?.toUpperCase() === 'PM52',
  SM74: (name: string) => name?.toUpperCase() === 'SM74',
  PLANO: (name: string) => name?.toUpperCase().includes('PLANO')
} as const

export const MACHINE_SPECS = {
  PM52: { label: 'PM52', maxSize: '37×52 cm' },
  SM74: { label: 'SM74', maxSize: '52.5×72 cm' },
  PLANO: { label: 'Plano Max', maxSize: '72×102 cm' }
} as const

export const getMachineType = (name: string): keyof typeof MACHINE_SPECS => {
  if (MACHINE_FILTERS.PM52(name)) return 'PM52'
  if (MACHINE_FILTERS.SM74(name)) return 'SM74'
  if (MACHINE_FILTERS.PLANO(name)) return 'PLANO'
  return 'PLANO'
}

export const getMachineBadgeClass = (name: string): string => {
  const type = getMachineType(name)
  const classes = {
    PM52: 'bg-blue-100 text-blue-800 border border-blue-200',
    SM74: 'bg-green-100 text-green-800 border border-green-200',
    PLANO: 'bg-purple-100 text-purple-800 border border-purple-200'
  }
  return classes[type]
}

export const PRINT_TYPES = [
  { id: 'blok', label: 'Cetak Blok', field: 'harga_blok', icon: 'mdi:layers', color: 'blue' },
  { id: 'tulisan', label: 'Cetak Tulisan', field: 'harga_tulisan', icon: 'mdi:format-text', color: 'green' },
  { id: 'separasi', label: 'Cetak Separasi', field: 'harga_separasi', icon: 'mdi:palette', color: 'purple' }
] as const