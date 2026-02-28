// utils/sheetHelpers.ts
import { Flute, FormData, SheetSubstance } from '@/types/sheet'

export const LAYER_TYPES = [
  { value: 'K', label: 'Kraft (Coklat Tua)', badgeVariant: 'warning', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' },
  { value: 'M', label: 'Medium (Coklat)', badgeVariant: 'default', badgeClass: 'bg-orange-100 text-orange-800 border border-orange-200' },
  { value: 'W', label: 'White (Putih)', badgeVariant: 'secondary', badgeClass: 'bg-gray-100 text-gray-800 border border-gray-200' }
]

export const FLUTE_COLORS = [
  'text-blue-600',
  'text-green-600',
  'text-purple-600',
  'text-orange-600',
  'text-red-600',
  'text-indigo-600',
  'text-pink-600',
  'text-teal-600',
  'text-cyan-600',
  'text-amber-600'
]

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatSubstanceDisplay = (item: SheetSubstance | FormData): string => {
  return `${item.layer_1}${item.layer_1_type}/${item.layer_2}${item.layer_2_type}/${item.layer_3}${item.layer_3_type}`
}

export const getLayerBadgeClass = (type: string): string => {
  switch (type) {
    case 'K': return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'M': return 'bg-orange-100 text-orange-800 border border-orange-200'
    case 'W': return 'bg-gray-100 text-gray-800 border border-gray-200'
    default: return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
}

export const getFluteBadgeVariant = (code: string): string => {
  switch (code.toUpperCase()) {
    case 'B': return 'primary'
    case 'C': return 'success'
    case 'CB': return 'warning'
    case 'BC': return 'warning'
    case 'EB': return 'info'
    case 'E': return 'info'
    default: return 'gray'
  }
}

export const getFluteColor = (index: number): string => {
  return FLUTE_COLORS[index % FLUTE_COLORS.length]
}