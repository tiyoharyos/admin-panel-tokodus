// app/(protected)/sheet-settings/sheet-index/constants.ts

import type { FormData } from '../types/types'

export const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_gsm: 'K',
  layer_2: '',
  layer_2_gsm: 'M',
  layer_3: '',
  layer_3_gsm: 'M',
  price_per_m2: {},
}

export const LAYER_TYPE_OPTIONS = [
  { value: 'K', label: 'Kraft (Coklat Tua)' },
  { value: 'M', label: 'Medium (Coklat)' },
  { value: 'W', label: 'White (Putih)' },
]

export interface LayerMeta { bg: string; light: string }

export const LAYER_META: Record<string, LayerMeta> = {
  K: { bg: '#b45309', light: '#fef3c7' },
  M: { bg: '#92400e', light: '#fed7aa' },
  W: { bg: '#6b7280', light: '#f3f4f6' },
}
export const DEFAULT_LAYER_META: LayerMeta = { bg: '#64748b', light: '#f1f5f9' }

export interface FluteColor { bg: string; light: string }

export const FLUTE_COLORS: FluteColor[] = [
  { bg: '#3b82f6', light: '#dbeafe' },
  { bg: '#10b981', light: '#d1fae5' },
  { bg: '#f59e0b', light: '#fed7aa' },
  { bg: '#8b5cf6', light: '#ede9fe' },
  { bg: '#ef4444', light: '#fee2e2' },
  { bg: '#06b6d4', light: '#cffafe' },
  { bg: '#f43f5e', light: '#ffe4e6' },
  { bg: '#84cc16', light: '#ecfccb' },
]

export const ITEMS_PER_PAGE_OPTIONS = [
  { value: '5',  label: '5'  },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
]