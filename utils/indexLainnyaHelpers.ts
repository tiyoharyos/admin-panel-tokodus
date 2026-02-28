// utils/indexLainnyaHelpers.ts
import { IndexLainnya } from '@/types/indexLainnya'

/**
 * Memeriksa apakah string berisi angka yang valid (bukan null, undefined, "null", atau kosong).
 */
const isValidNumber = (value: string | null | undefined): boolean => {
  return value != null && value !== 'null' && value.trim() !== '' && !isNaN(Number(value))
}

/**
 * Memformat nilai string menjadi mata uang IDR.
 * Contoh: "1000000" → "Rp1.000.000"
 */
export const formatCurrency = (value: string | null | undefined): string => {
  if (!isValidNumber(value)) return '-'
  const num = parseFloat(value!)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Memformat nilai desimal dengan 4 angka di belakang koma.
 * Contoh: "123.45678" → "123.4568"
 */
export const formatDecimal = (value: string | null | undefined): string => {
  if (!isValidNumber(value)) return '-'
  const num = parseFloat(value!)
  return num.toFixed(4)
}

/**
 * Memformat rentang jumlah (min – max) dengan satuan "pcs".
 * Menangani kasus salah satu sisi tidak ada.
 * Contoh: ("10", null) → "≥ 10 pcs"
 *          (null, "20") → "≤ 20 pcs"
 *          ("5", "15")  → "5 - 15 pcs"
 */
export const formatQuantityRange = (min: string | null | undefined, max: string | null | undefined): string => {
  const minValid = isValidNumber(min) ? parseInt(min!) : null
  const maxValid = isValidNumber(max) ? parseInt(max!) : null

  if (minValid === null && maxValid === null) return '-'
  if (minValid !== null && maxValid === null) return `≥ ${minValid.toLocaleString()} pcs`
  if (minValid === null && maxValid !== null) return `≤ ${maxValid.toLocaleString()} pcs`
  return `${minValid!.toLocaleString()} - ${maxValid!.toLocaleString()} pcs`
}

/**
 * Mendapatkan kelas warna Tailwind berdasarkan ID kategori.
 */
export const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    '1': 'bg-blue-100 text-blue-800 border-blue-200',
    '2': 'bg-green-100 text-green-800 border-green-200',
    '3': 'bg-purple-100 text-purple-800 border-purple-200',
    '4': 'bg-amber-100 text-amber-800 border-amber-200',
    '5': 'bg-rose-100 text-rose-800 border-rose-200',
    '6': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  }
  return colors[categoryId] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Menentukan ikon yang sesuai berdasarkan tipe nilai yang tersedia.
 * Prioritas: decimal → integer → currency → default.
 */
export const getValueTypeIcon = (item: IndexLainnya): string => {
  if (item.value_decimal && item.value_decimal !== 'null') return 'mdi:percent'
  if (item.value_int && item.value_int !== 'null') return 'mdi:numeric'
  if ((item.modal && item.modal !== 'null') || (item.jual && item.jual !== 'null')) return 'mdi:currency-usd'
  return 'mdi:help-circle'
}