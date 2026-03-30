// constants/constants.ts

export const API_BASE = '/Admin/Singelface'

export const LAYER_TYPE_OPTIONS = [
  { value: 'K', label: 'K - Kraft' },
  { value: 'M', label: 'M - Medium' },
  { value: 'W', label: 'W - White' },
  { value: 'B', label: 'B - Bogus' },
  { value: 'T', label: 'T - Test' },
]

export const LAYER_META: Record<string, { bg: string; light: string }> = {
  K: { bg: '#b45309', light: '#fef3c7' },
  M: { bg: '#0284c7', light: '#e0f2fe' },
  W: { bg: '#6b7280', light: '#f3f4f6' },
  B: { bg: '#475569', light: '#f1f5f9' },
  T: { bg: '#115e59', light: '#ccfbf1' },
}

export const DEFAULT_LAYER_META = { bg: '#64748b', light: '#f1f5f9' }

export const FLUTE_COLORS = [
  { bg: '#3b82f6', light: '#dbeafe' },
  { bg: '#10b981', light: '#d1fae5' },
  { bg: '#f59e0b', light: '#fed7aa' },
  { bg: '#8b5cf6', light: '#ede9fe' },
  { bg: '#ef4444', light: '#fee2e2' },
  { bg: '#06b6d4', light: '#cffafe' },
  { bg: '#f43f5e', light: '#ffe4e6' },
  { bg: '#84cc16', light: '#ecfccb' },
]

export const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_type: 'K',
  layer_2: '',
  layer_2_type: 'M',
  flutes: [],
}