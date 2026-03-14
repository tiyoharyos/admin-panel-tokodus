// app/(protected)/duplex-dmd/lib/utils.ts

import type { DuplexDMDData, DuplexMduplekItem, DuplexStats, SheetSizeItem } from '../types/types'
import { GSM_COLORS } from '../constants/constants'

// ===== FORMAT =====
export const formatUkuran = (panjang: number, lebar: number): string => {
  if (!panjang || !lebar || isNaN(panjang) || isNaN(lebar) || panjang === 0 || lebar === 0) return '-'
  return `${panjang} × ${lebar} cm`
}

export const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatLuas = (panjang_sh: string, lebar_sh: string): string =>
  ((parseInt(panjang_sh) / 10) * (parseInt(lebar_sh) / 10) / 10000).toFixed(2)

// ===== LABEL =====
export const buildSheetLabel = (panjang_mm: string, lebar_mm: string): string => {
  const p = parseInt(panjang_mm) / 10
  const l = parseInt(lebar_mm) / 10
  return !isNaN(p) && !isNaN(l) && p > 0 && l > 0
    ? `${p} × ${l} cm`
    : `${panjang_mm} × ${lebar_mm} mm`
}

// ===== COLOR =====
export const getGSMColor = (gsm: number): { bg: string; light: string } => {
  if (gsm <= 270) return GSM_COLORS[0]
  if (gsm <= 350) return GSM_COLORS[1]
  if (gsm <= 400) return GSM_COLORS[2]
  if (gsm <= 450) return GSM_COLORS[3]
  return GSM_COLORS[4]
}

// ===== MAPPER =====
export const mapDuplexItem = (item: DuplexMduplekItem): DuplexDMDData => ({
  id: parseInt(item.id),
  panjang: parseInt(item.panjang_mm) / 10,
  lebar: parseInt(item.lebar_mm) / 10,
  harga_per_lembar: parseFloat(item.harga_lembar) || 0,
  gsm: parseInt(item.gsm),
  type: 'DMD',
  pl: `${item.panjang_mm}x${item.lebar_mm}`,
  sheet_size_id: item.id_sh,
  gramasi_id: item.gsm,
})

export const extractSheetSizes = (raw: DuplexMduplekItem[]): SheetSizeItem[] => {
  const seen = new Map<string, SheetSizeItem>()
  raw.forEach(item => {
    if (item.id_sh && !seen.has(item.id_sh)) {
      seen.set(item.id_sh, { id_sh: item.id_sh, panjang_sh: item.panjang_mm, lebar_sh: item.lebar_mm })
    }
  })
  return Array.from(seen.values()).sort((a, b) => parseInt(a.id_sh) - parseInt(b.id_sh))
}

// ===== STATS =====
export const calculateStats = (data: DuplexDMDData[]): DuplexStats => {
  const totalPrice = data.reduce((sum, item) => sum + (item.harga_per_lembar || 0), 0)
  return {
    totalRecords: data.length,
    averagePrice: data.length > 0 ? totalPrice / data.length : 0,
    totalCombinations: new Set(data.map(item => `${item.panjang}x${item.lebar}x${item.gsm}`)).size,
    uniqueGsm: new Set(data.map(item => item.gsm)).size,
    uniqueSizes: new Set(data.map(item => `${item.panjang}x${item.lebar}`)).size,
    withPrice: data.filter(item => item.harga_per_lembar > 0).length,
  }
}

// ===== ERROR =====
export const extractErrorMessage = (err: unknown): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  (err as { message?: string })?.message ||
  'Terjadi kesalahan'