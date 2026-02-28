import { Flute, SinglefaceSubstance, FormData, CacheData } from '@/types/singleface'

export const LAYER_TYPES = [
  { value: 'K', label: 'Kraft (Coklat Tua)', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'M', label: 'Medium (Coklat)', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'W', label: 'White (Putih)', badgeClass: 'bg-gray-100 text-gray-800 border-gray-200' }
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

export const formatSubstanceDisplay = (item: SinglefaceSubstance | FormData): string => {
  return `${item.layer_1}${item.layer_1_type}/${item.layer_2}${item.layer_2_type}`
}

export const getLayerBadgeClass = (type: string): string => {
  const layerType = LAYER_TYPES.find(t => t.value === type)
  return layerType?.badgeClass || 'bg-gray-100 text-gray-800 border-gray-200'
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

export const loadLayerCache = (): Record<string, CacheData> => {
  const cache: Record<string, CacheData> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('layer_cache_')) {
        const id = key.replace('layer_cache_', '')
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.timestamp && Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
          cache[id] = data
        }
      }
    }
  } catch (err) {
    console.error('Error loading cache:', err)
  }
  return cache
}

export const saveToCache = (id: string, layer_1: string, layer_2: string): void => {
  const cacheData: CacheData = {
    layer_1,
    layer_2,
    timestamp: Date.now()
  }
  localStorage.setItem(`layer_cache_${id}`, JSON.stringify(cacheData))
}

export const removeFromCache = (id: string): void => {
  localStorage.removeItem(`layer_cache_${id}`)
}