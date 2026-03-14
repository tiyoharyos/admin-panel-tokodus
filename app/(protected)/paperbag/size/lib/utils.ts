// app/(protected)/paperbag-sheet-sizes/lib/utils.ts

import type { SheetForm, SheetSize, SheetStats } from '../types/types'

// ===== FORMAT =====
export const formatMm = (mm: string): string => {
  const v = parseFloat(mm)
  return isNaN(v) ? mm : `${v.toFixed(0)} mm`
}

export const formatCm = (mm: string): string => {
  const v = parseFloat(mm)
  return isNaN(v) ? mm : `${(v / 10).toFixed(0)} cm`
}

export const calcAreaM2 = (panjang: string, lebar: string): number => {
  const p = parseFloat(panjang)
  const l = parseFloat(lebar)
  return isNaN(p) || isNaN(l) ? 0 : (p * l) / 1_000_000
}

export const formatAreaM2 = (panjang: string, lebar: string): string => {
  const area = calcAreaM2(panjang, lebar)
  return area === 0 ? '0 m²' : `${area.toFixed(4)} m²`
}

// ===== AUTO-FILL =====
export const autoCode = (panjang_mm: string, lebar_mm: string): string => {
  const p = parseFloat(panjang_mm)
  const l = parseFloat(lebar_mm)
  return isNaN(p) || isNaN(l) || p <= 0 || l <= 0
    ? ''
    : `${(p / 10).toFixed(0)}x${(l / 10).toFixed(0)}`
}

export const autoKeterangan = (panjang_mm: string, lebar_mm: string): string => {
  const p = parseFloat(panjang_mm)
  const l = parseFloat(lebar_mm)
  return isNaN(p) || isNaN(l) || p <= 0 || l <= 0
    ? ''
    : `${(p / 10).toFixed(0)}x${(l / 10).toFixed(0)} cm`
}

// Recalculate code & keterangan when a dimension field changes
export const applyDimensionChange = (
  prev: SheetForm,
  field: 'panjang_mm' | 'lebar_mm',
  value: string
): SheetForm => {
  const p = field === 'panjang_mm' ? value : prev.panjang_mm
  const l = field === 'lebar_mm'   ? value : prev.lebar_mm
  return { ...prev, [field]: value, code: autoCode(p, l), keterangan: autoKeterangan(p, l) }
}

// ===== CATEGORY =====
export const getSizeCategory = (
  panjang: string,
  lebar: string
): { label: string; color: string; icon: string } => {
  const area = calcAreaM2(panjang, lebar)
  if (area < 0.65) return { label: 'Kecil',  color: 'sky',    icon: 'mdi:crop-square'    }
  if (area < 0.85) return { label: 'Sedang', color: 'amber',  icon: 'mdi:crop-5-4'       }
  if (area < 1.05) return { label: 'Besar',  color: 'violet', icon: 'mdi:crop-landscape' }
  return               { label: 'Extra',  color: 'rose',   icon: 'mdi:crop-free'      }
}

// ===== STATS =====
export const calculateStats = (sizeList: SheetSize[]): SheetStats => {
  if (sizeList.length === 0) return {
    totalSizes: 0, avgArea: 0, maxArea: 0, minArea: 0, totalArea: 0,
    smallestSize: null, largestSize: null,
  }

  const areas = sizeList
    .map(s => ({ code: s.code, area: calcAreaM2(s.panjang_mm, s.lebar_mm) }))
    .filter(a => a.area > 0)

  const totalArea = areas.reduce((sum, a) => sum + a.area, 0)
  const maxArea   = Math.max(...areas.map(a => a.area))
  const minArea   = Math.min(...areas.map(a => a.area))

  return {
    totalSizes:   sizeList.length,
    avgArea:      areas.length ? totalArea / areas.length : 0,
    maxArea,
    minArea,
    totalArea,
    largestSize:  areas.find(a => a.area === maxArea)  ?? null,
    smallestSize: areas.find(a => a.area === minArea) ?? null,
  }
}

// ===== VALIDATION =====
export const validateForm = (form: SheetForm): string | null => {
  const p = Number(form.panjang_mm)
  const l = Number(form.lebar_mm)
  if (!form.code.trim())        return 'Code tidak boleh kosong.'
  if (isNaN(p) || p <= 0)       return 'Panjang (mm) tidak valid.'
  if (isNaN(l) || l <= 0)       return 'Lebar (mm) tidak valid.'
  if (!form.keterangan.trim())  return 'Keterangan tidak boleh kosong.'
  return null
}

// ===== BUILD PAYLOAD =====
// Backend field mapping: lebar_mm → layer_2, keterangan → layer_2_type
export const buildPayload = (form: SheetForm): string => {
  const fd = new URLSearchParams()
  fd.append('code',        form.code.trim())
  fd.append('panjang_mm',  form.panjang_mm)
  fd.append('layer_2',     form.lebar_mm)
  fd.append('layer_2_type', form.keterangan.trim())
  return fd.toString()
}

// ===== ERROR =====
export const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
    if (msg) return msg
  }
  return fallback
}