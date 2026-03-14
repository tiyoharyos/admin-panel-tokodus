// app/(protected)/index-lainnya/lib/utils.ts

import type { ConfigKeyGroup, IndexLainnya, IndexStats } from '../types/types'
import { ACCENT_COLORS } from '../constants/constants'

// ===== VALUE DETECTION =====
// Values 0 < v < 1  → percentage  (e.g. 0.1000 = 10%)
// Values >= 1       → IDR currency (e.g. 500.0000)
export const isPercentage = (value: string | null): boolean => {
  if (!value || value === 'null') return false
  const n = parseFloat(value)
  return !isNaN(n) && n > 0 && n < 1
}

// ===== FORMAT =====
export const formatValue = (value: string | null): string => {
  if (!value || value === 'null') return '-'
  const n = parseFloat(value)
  if (isNaN(n)) return '-'
  if (isPercentage(value)) return `${(n * 100).toFixed(0)}%`
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export const formatRawValue = (value: string | null): string => {
  if (!value || value === 'null') return '-'
  const n = parseFloat(value)
  if (isNaN(n)) return '-'
  return n % 1 === 0 ? n.toLocaleString('id-ID') : n.toFixed(4)
}

// qty_max "0" in the API means "no upper bound" (same as null)
// This happens when backend stores 0 as sentinel for ∞
const isUnboundedMax = (v: string | null): boolean => v === null || v === '0'

export const formatQtyRange = (min: string | null, max: string | null): string => {
  const hasMin = min !== null && min !== ''
  const hasMax = !isUnboundedMax(max)

  if (!hasMin && !hasMax)  return 'Semua qty'
  if (hasMin && !hasMax)   return `≥ ${parseInt(min!).toLocaleString()} pcs`
  if (!hasMin && hasMax)   return `≤ ${parseInt(max!).toLocaleString()} pcs`
  return `${parseInt(min!).toLocaleString()} – ${parseInt(max!).toLocaleString()} pcs`
}

// Badge colour: open-ended = green, bounded = blue
export const qtyRangeBadgeColor = (max: string | null): string =>
  isUnboundedMax(max) ? '#10b981' : '#3b82f6'

export const formatConfigKeyLabel = (key: string): string =>
  key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// ===== ACCENT =====
export const getAccent = (key: string, allKeys: string[]) =>
  ACCENT_COLORS[allKeys.indexOf(key) % ACCENT_COLORS.length] || ACCENT_COLORS[0]

export const getValueIcon = (value: string | null): string =>
  isPercentage(value) ? 'mdi:percent' : 'mdi:currency-usd'

// ===== GROUPING =====
export const groupByConfigKey = (data: IndexLainnya[]): ConfigKeyGroup[] => {
  const groups: Record<string, ConfigKeyGroup> = {}
  data.forEach(item => {
    if (!groups[item.config_key])
      groups[item.config_key] = { config_key: item.config_key, items: [] }
    groups[item.config_key].items.push(item)
  })
  return Object.values(groups).sort((a, b) => a.config_key.localeCompare(b.config_key))
}

// ===== STATS =====
export const calculateStats = (data: IndexLainnya[]): IndexStats => {
  const allKeys = Array.from(new Set(data.map(i => i.config_key)))
  return {
    totalItems: data.length,
    totalConfigKeys: allKeys.length,
    withQuantityRange: data.filter(i => i.qty_min !== null || !isUnboundedMax(i.qty_max)).length,
    withValue: data.filter(i => i.value && i.value !== 'null').length,
  }
}

// ===== ERROR =====
export const extractErrorMessage = (err: unknown, fallback = 'Terjadi kesalahan'): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
    if (msg) return msg
  }
  if (err instanceof Error) return err.message
  return fallback
}