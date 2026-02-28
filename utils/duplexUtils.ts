import { GramasiItem, SheetSizeItem } from '@/types/duplex'

// Parse "panjangxlebar" string (in mm) to cm values
export const parsePL = (pl: string): { panjang: number; lebar: number } => {
  try {
    const [panjang, lebar] = pl.split('x').map(Number)
    return {
      panjang: panjang / 10,
      lebar: lebar / 10
    }
  } catch {
    return { panjang: 0, lebar: 0 }
  }
}

// Format cm display
export const formatUkuranDisplay = (panjang: number, lebar: number): string => {
  return `${panjang} × ${lebar} cm`
}

// Build "panjangxlebar" from sheet size mm values
export const formatPLFromSheet = (panjang_mm: string, lebar_mm: string): string => {
  return `${panjang_mm}x${lebar_mm}`
}

// Format currency in IDR
export const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Special display for DK (show dash when zero)
export const formatHargaDisplay = (amount: number): string => {
  if (amount === 0) return '-'
  return formatCurrency(amount)
}

// Badge color based on GSM value
export const getGSMBadgeClass = (gsm: number): string => {
  if (gsm <= 270) return 'bg-blue-100 text-blue-800 border border-blue-200'
  if (gsm <= 350) return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  return 'bg-red-100 text-red-800 border border-red-200'
}

// Helper to find sheet size and gramasi by ID (used in previews)
export const findSheetSize = (list: SheetSizeItem[], id: string): SheetSizeItem | null =>
  list.find(item => item.id_sh === id) || null

export const findGramasi = (list: GramasiItem[], id: string): GramasiItem | null =>
  list.find(item => item.id === id) || null