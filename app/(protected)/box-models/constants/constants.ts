// ============================================================
// constants.ts — Semua konstanta untuk Box Models feature
// ============================================================

export const SOURCE_OPTIONS = [
  { value: 'P', label: 'P (Panjang Produk - cm)' },
  { value: 'L', label: 'L (Lebar Produk - cm)' },
  { value: 'T', label: 'T (Tinggi Produk - cm)' },
  { value: 'A', label: 'A (Panjang ×10 - mm)' },
  { value: 'B', label: 'B (Lebar ×10 - mm)' },
  { value: 'C', label: 'C (Tinggi ×10 - mm)' },
]

export const TARGET_OPTIONS = [
  { value: 'panjang', label: 'Panjang' },
  { value: 'lebar', label: 'Lebar' },
]

export const CATEGORY_OPTIONS = [
  { value: 'Mailer Box', label: 'Mailer Box' },
  { value: 'Shoe Box', label: 'Shoe Box' },
  { value: 'Food Box', label: 'Food Box' },
  { value: 'Premium Box', label: 'Premium Box' },
]

export const FORMULA_LEGEND_ITEMS = [
  ['P', 'Panjang (cm)'],
  ['L', 'Lebar (cm)'],
  ['T', 'Tinggi (cm)'],
  ['A', 'P ×10 (mm)'],
  ['B', 'L ×10 (mm)'],
  ['C', 'T ×10 (mm)'],
] as const

export const BOX_META: Record<string, { icon: string; accent: string }> = {
  'Mailer Box': { icon: 'mdi:package-variant-closed', accent: '#3b82f6' },
  'Shoe Box':   { icon: 'mdi:shoe-sneaker',           accent: '#10b981' },
  'Food Box':   { icon: 'mdi:food',                   accent: '#f59e0b' },
  'Premium Box':{ icon: 'mdi:crown',                  accent: '#8b5cf6' },
}

export const DEFAULT_BOX_META = { icon: 'mdi:package-variant', accent: '#64748b' }

export const DEFAULT_ADD_FORM = {
  code: '',
  name: '',
  description: '',
  category: 'Mailer Box',
  status_bm: '1',
}

export const VALID_SOURCES = ['P', 'L', 'T', 'A', 'B', 'C']
export const VALID_TARGETS = ['panjang', 'lebar']