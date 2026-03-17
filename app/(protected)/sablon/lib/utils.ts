// app/(protected)/sablon/lib/utils.ts

import type { Sablon, SablonStats } from '../types/types'
import type { SablonForm } from '../constants/constants'

// ===== FORMAT =====
export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num)
}

// Strips thousand separators, keeps digits/dot/minus
export const sanitizeNumber = (val: string): string => {
  const cleaned = val.replace(/[^\d.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? '0' : String(num)
}

// ===== CODE AUTO-GENERATE =====
export const generateCode = (existingCodes: string[]): string => {
  let counter = 1
  let code = `sbl${counter.toString().padStart(2, '0')}`
  while (existingCodes.includes(code)) {
    counter++
    code = `sbl${counter.toString().padStart(2, '0')}`
  }
  return code
}

// ===== STATS =====
export const calculateStats = (sablon: Sablon[]): SablonStats => {
  if (sablon.length === 0) return {
    totalSablon: 0, withMinimumQty: 0,
    avgHargaGT500: 0, avgHargaGT100: 0, totalMinQty: 0,
  }
  const gt500  = sablon.map(s => parseFloat(s.harga_jual_gt500))
  const gt100  = sablon.map(s => parseFloat(s.harga_jual_gt100))
  const minQty = sablon.map(s => parseInt(s.qty_minimum))
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  return {
    totalSablon:    sablon.length,
    withMinimumQty: sablon.filter(s => parseInt(s.qty_minimum) > 0).length,
    avgHargaGT500:  avg(gt500),
    avgHargaGT100:  avg(gt100),
    totalMinQty:    minQty.reduce((a, b) => a + b, 0),
  }
}

// ===== VALIDATION =====
export const validateSablonForm = (data: SablonForm): string | null => {
  if (!data.code.trim())  return 'Kode sablon harus diisi'
  if (!data.label.trim()) return 'Label sablon harus diisi'
  if (!data.harga_jual_gt500 || parseFloat(sanitizeNumber(data.harga_jual_gt500)) < 0)
    return 'Harga jual >500 harus diisi dengan nilai valid'
  if (!data.harga_jual_gt100 || parseFloat(sanitizeNumber(data.harga_jual_gt100)) < 0)
    return 'Harga jual >100 harus diisi dengan nilai valid'
  if (!data.qty_minimum || parseInt(sanitizeNumber(data.qty_minimum)) < 0)
    return 'Minimum quantity harus diisi dengan nilai valid'
  return null
}

// ===== BUILD PAYLOAD =====
export const buildPayload = (data: SablonForm): URLSearchParams => {
  const p = new URLSearchParams()
  p.append('code',              data.code.trim())
  p.append('label',             data.label.trim())
  p.append('harga_jual_gt500',  sanitizeNumber(data.harga_jual_gt500))
  p.append('harga_jual_gt100',  sanitizeNumber(data.harga_jual_gt100))
  p.append('qty_minimum',       sanitizeNumber(data.qty_minimum))
  return p
}

// ===== ERROR =====
export const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { message?: string } } }
    return e.response?.data?.message || fallback
  }
  return fallback
}