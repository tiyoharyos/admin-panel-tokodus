// constants/box-model.constants.ts
export const CATEGORY_OPTIONS = [
  { value: 'Mailer Box', label: '📦 Mailer Box' },
  { value: 'Shoe Box', label: '👟 Shoe Box' },
  { value: 'Food Box', label: '🍱 Food Box' },
  { value: 'Premium Box', label: '✨ Premium Box' }
]

export const SOURCE_OPTIONS = [
  { value: 'P', label: 'P (Panjang Produk - cm)' },
  { value: 'L', label: 'L (Lebar Produk - cm)' },
  { value: 'T', label: 'T (Tinggi Produk - cm)' },
  { value: 'A', label: 'A (Panjang Produk ×10 - mm)' },
  { value: 'B', label: 'B (Lebar Produk ×10 - mm)' },
  { value: 'C', label: 'C (Tinggi Produk ×10 - mm)' }
]

export const TARGET_OPTIONS = [
  { value: 'panjang', label: '📐 Panjang' },
  { value: 'lebar', label: '📏 Lebar' }
]

export const STATUS_OPTIONS = [
  { value: '1', label: '✅ Aktif' },
  { value: '0', label: '❌ Nonaktif' }
]

export const BASE_ADD_FORM = {
  code: '',
  name: '',
  description: '',
  category: 'Mailer Box',
  status_bm: '1'
}