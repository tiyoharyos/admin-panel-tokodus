// app/(protected)/pisau-registry/lib/utils.ts

import type { PisauRegistry, PisauStats } from '../types/types'
import { DIMENSION_TYPES } from '../constants/constants'

// ===== FORMAT =====
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

export const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0,00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(num)
}

export const formatSize = (p: string, l: string, t: string): string =>
  `${parseFloat(p).toFixed(1)} × ${parseFloat(l).toFixed(1)} × ${parseFloat(t).toFixed(1)} cm`

// ===== KODE AUTO-GENERATE =====
export const generateKodePisau = (existingCodes: string[]): string => {
  let max = 0
  existingCodes.forEach(code => {
    const match = code.match(/^PISAU-(\d+)$/i)
    if (match) {
      const n = parseInt(match[1], 10)
      if (n > max) max = n
    }
  })
  return `PISAU-${max + 1}`
}

// ===== STATS =====
export const calculateStats = (registries: PisauRegistry[]): PisauStats => {
  if (registries.length === 0) return {
    totalRegistry: 0, avgPanjang: 0, avgLebar: 0, avgTinggi: 0,
    minPanjang: 0, maxPanjang: 0, minLebar: 0, maxLebar: 0,
    minTinggi: 0, maxTinggi: 0, shippingBoxCount: 0,
  }
  const p = registries.map(r => parseFloat(r.panjang_cm))
  const l = registries.map(r => parseFloat(r.lebar_cm))
  const t = registries.map(r => parseFloat(r.tinggi_cm))
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  return {
    totalRegistry: registries.length,
    avgPanjang: avg(p), avgLebar: avg(l), avgTinggi: avg(t),
    minPanjang: Math.min(...p), maxPanjang: Math.max(...p),
    minLebar:   Math.min(...l), maxLebar:   Math.max(...l),
    minTinggi:  Math.min(...t), maxTinggi:  Math.max(...t),
    shippingBoxCount: registries.filter(r => r.is_shipping_box === '1').length,
  }
}

// ===== VALIDATION =====
type DimValidatable = { box_model_id: string; panjang_cm: string; lebar_cm: string; tinggi_cm: string; kode_pisau: string }

export const validatePisauForm = (data: DimValidatable): string | null => {
  if (!data.box_model_id)        return 'Box model harus dipilih'
  if (!data.kode_pisau.trim())   return 'Kode pisau harus diisi'
  for (const dim of DIMENSION_TYPES) {
    const val = data[dim.field as keyof DimValidatable]
    if (!val || !String(val).trim()) return `${dim.label} harus diisi`
    if (parseFloat(String(val)) <= 0) return `${dim.label} harus lebih dari 0`
  }
  return null
}

// ===== BUILD PAYLOAD =====
export const buildPayload = (data: {
  box_model_id: string; kode_pisau: string; panjang_cm: string
  lebar_cm: string; tinggi_cm: string; catatan: string; status: string
}): URLSearchParams => {
  const fd = new URLSearchParams()
  fd.append('box_model_id', String(data.box_model_id).trim())
  fd.append('kode_pisau',   data.kode_pisau.trim())
  fd.append('panjang_cm',   data.panjang_cm.trim())
  fd.append('lebar_cm',     data.lebar_cm.trim())
  fd.append('tinggi_cm',    data.tinggi_cm.trim())
  fd.append('catatan',      data.catatan?.trim() || '')
  fd.append('status',       data.status)
  return fd
}

// ===== ERROR =====
export const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { message?: string } } }
    return e.response?.data?.message || fallback
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const e = err as { code?: string }
    if (e.code === 'ECONNABORTED') return 'Koneksi timeout. Silakan coba lagi.'
  }
  return fallback
}