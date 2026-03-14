// app/(protected)/paperbag-sheet-sizes/constants.ts

import type { SheetForm } from '../types/types'

export const EMPTY_FORM: SheetForm = {
  code: '',
  panjang_mm: '',
  lebar_mm: '',
  keterangan: '',
}

export const DIMENSION_TYPES = [
  { id: 'panjang', label: 'Panjang', field: 'panjang_mm', icon: 'mdi:arrow-left-right', color: '#3b82f6' },
  { id: 'lebar',   label: 'Lebar',   field: 'lebar_mm',   icon: 'mdi:arrow-up-down',    color: '#06b6d4' },
] as const

// Maps size category name → hex color for Badge component
export const CAT_COLOR_MAP: Record<string, string> = {
  sky:    '#0ea5e9',
  amber:  '#f59e0b',
  violet: '#8b5cf6',
  rose:   '#f43f5e',
}