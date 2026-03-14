// app/(protected)/Duplex/Rumus_dk/lib/utils.ts

import type { DuplexApiItem, DuplexDataDK, DuplexStats, SheetSizeItem } from '../types/types'
import { GSM_COLORS } from '../constants/constants'

// ===== FORMAT =====
export const formatUkuran = (p: number, l: number) =>
  !p || !l ? '-' : `${p} × ${l} cm`

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

export const formatHarga = (n: number) => (n === 0 ? '-' : formatCurrency(n))

export const formatLuas = (panjang_sh: string, lebar_sh: string) =>
  ((parseInt(panjang_sh) / 10) * (parseInt(lebar_sh) / 10) / 10000).toFixed(2)

// ===== LABEL =====
export const buildSheetLabel = (p_mm: string, l_mm: string) => {
  const p = parseInt(p_mm) / 10
  const l = parseInt(l_mm) / 10
  return !isNaN(p) && p > 0 ? `${p} × ${l} cm` : `${p_mm} × ${l_mm} mm`
}

// ===== COLOR =====
export const getGSMColor = (gsm: number) => {
  if (gsm <= 200) return GSM_COLORS[0]
  if (gsm <= 300) return GSM_COLORS[1]
  if (gsm <= 400) return GSM_COLORS[2]
  if (gsm <= 450) return GSM_COLORS[3]
  return GSM_COLORS[4]
}

// ===== MAPPER =====
export const mapPriceItem = (item: DuplexApiItem): DuplexDataDK => ({
  id: parseInt(item.id),
  gsm: parseInt(item.gsm),
  sheet_size_id: item.id_sh,
  panjang: parseInt(item.panjang_mm) / 10,
  lebar: parseInt(item.lebar_mm) / 10,
  harga_per_lembar: parseFloat(item.harga_lembar) || 0,
  type: 'DK',
})

export const extractSheetSizes = (raw: DuplexApiItem[]): SheetSizeItem[] => {
  const seen = new Set<string>()
  return raw
    .filter(i => {
      if (!i.id_sh || seen.has(i.id_sh)) return false
      seen.add(i.id_sh)
      return true
    })
    .map(i => ({ id_sh: i.id_sh, panjang_sh: i.panjang_mm, lebar_sh: i.lebar_mm }))
    .sort((a, b) => parseInt(a.id_sh) - parseInt(b.id_sh))
}

// ===== STATS =====
export const calculateStats = (data: DuplexDataDK[]): DuplexStats => {
  const withPrice = data.filter(d => d.harga_per_lembar > 0)
  return {
    totalRecords: data.length,
    averagePrice: withPrice.length > 0
      ? withPrice.reduce((s, d) => s + d.harga_per_lembar, 0) / withPrice.length
      : 0,
    totalCombinations: new Set(data.map(d => `${d.gsm}-${d.sheet_size_id}`)).size,
    uniqueGsm: new Set(data.map(d => d.gsm)).size,
    uniqueSizes: new Set(data.map(d => d.sheet_size_id)).size,
    withPrice: withPrice.length,
  }
}

// ===== ERROR =====
export const isDuplicateError = (err: unknown) => {
  const s = JSON.stringify((err as { response?: { data?: unknown } })?.response?.data ?? '')
  return s.includes('Duplicate entry') || s.includes('1062') || s.includes('uq_gsm_sheet')
}

export const extractErrorMessage = (err: unknown): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  (err as { message?: string })?.message ||
  'Terjadi kesalahan'