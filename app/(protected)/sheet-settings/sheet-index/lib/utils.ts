// app/(protected)/sheet-settings/lib/utils.ts

import { isAxiosError } from 'axios'
import type {
  Flute, FluteApiItem, FormData, SheetIndexApiItem,
  SheetStats, SheetSubstance,
} from '../types/types'
import { DEFAULT_LAYER_META, LAYER_META, type LayerMeta } from '../constants/constants'

// ===== FORMAT =====
export const formatCurrency = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n)
}

export const formatDate = (dateStr?: string): string =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-'

export const formatSubstanceDisplay = (item: SheetSubstance | FormData): string =>
  `${item.layer_1}${item.layer_1_gsm}/${item.layer_2}${item.layer_2_gsm}/${item.layer_3}${item.layer_3_gsm}`

// ===== LAYER =====
export const getLayerMeta = (code: string): LayerMeta =>
  LAYER_META[code] || DEFAULT_LAYER_META

// ===== FLUTE =====
export const processFluteList = (items: FluteApiItem[]): Flute[] =>
  items.map(f => ({
    id: f.id_f?.toString() || '',
    code: f.code || '',
    name: f.name || '',
  }))

export const getFlutePrice = (substance: SheetSubstance, fluteCode: string): number =>
  (substance[`${fluteCode.toLowerCase()}_flute_price`] as number) || 0

// ===== MAP API → SheetSubstance =====
export const groupApiItems = (items: SheetIndexApiItem[]): SheetSubstance[] => {
  const grouped: Record<string, SheetSubstance> = {}

  items.forEach(item => {
    const substanceId = (item.s_substance_id || item.id)?.toString() || ''
    if (!grouped[substanceId]) {
      grouped[substanceId] = {
        id: substanceId,
        no: '',
        layer_1:     item.layer_1_gsm || '',
        layer_2:     item.layer_2_gsm || '',
        layer_3:     item.layer_3_gsm || '',
        layer_1_gsm: item.layer_1_type || 'K',
        layer_2_gsm: item.layer_2_type || 'M',
        layer_3_gsm: item.layer_3_type || 'M',
        substance_code: `${item.layer_1_gsm}${item.layer_1_type}/${item.layer_2_gsm}${item.layer_2_type}/${item.layer_3_gsm}${item.layer_3_type}`,
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
      }
    }
    if (item.code) {
      grouped[substanceId][`${item.code.toLowerCase()}_flute_price`] =
        parseFloat(item.price_per_m2?.toString() || '0') || 0
    }
  })

  return Object.values(grouped).map((item, index) => ({
    ...item,
    no: (index + 1).toString(),
  }))
}

// ===== STATS =====
export const calculateStats = (substances: SheetSubstance[], flutes: Flute[]): SheetStats => ({
  totalSubstances:  substances.length,
  activeSubstances: substances.filter(s => s.layer_1 && s.layer_2 && s.layer_3).length,
  withAllFlutes:    substances.filter(s =>
    flutes.length > 0 && flutes.every(f => getFlutePrice(s, f.code) > 0)
  ).length,
  totalIndices: substances.length * flutes.length,
})

// ===== VALIDATION =====
export const validateForm = (form: FormData, flutes: Flute[]): Record<string, string> => {
  const errors: Record<string, string> = {}

  ;(['layer_1', 'layer_2', 'layer_3'] as const).forEach(field => {
    const val = form[field] as string
    if (!val || val.trim() === '')                          errors[field] = 'Gramasi tidak boleh kosong'
    else if (isNaN(parseFloat(val)) || parseFloat(val) <= 0) errors[field] = 'Gramasi harus angka lebih dari 0'
  })

  flutes.forEach(flute => {
    const price = form.price_per_m2?.[flute.code]
    if (!price || price.trim() === '')    errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute wajib diisi`
    else if (isNaN(parseFloat(price)))    errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus berupa angka`
    else if (parseFloat(price) <= 0)      errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus lebih dari 0`
  })

  return errors
}

// ===== BUILD PAYLOAD =====
export const buildPayload = (form: FormData, flutes: Flute[]) => ({
  layer_1:     form.layer_1.trim(),
  layer_1_gsm: form.layer_1_gsm.trim(),
  layer_2:     form.layer_2.trim(),
  layer_2_gsm: form.layer_2_gsm.trim(),
  layer_3:     form.layer_3.trim(),
  layer_3_gsm: form.layer_3_gsm.trim(),
  flutes:      flutes.map(f => parseInt(f.id)).filter(id => !isNaN(id) && id > 0),
  price_per_m2: flutes.map(f => parseFloat(form.price_per_m2[f.code] || '0')),
})

// ===== INIT PRICES =====
export const initEmptyPrices = (flutes: Flute[]): Record<string, string> => {
  const p: Record<string, string> = {}
  flutes.forEach(f => { p[f.code] = '' })
  return p
}

export const initEditPrices = (substance: SheetSubstance, flutes: Flute[]): Record<string, string> => {
  const p: Record<string, string> = {}
  flutes.forEach(f => { p[f.code] = getFlutePrice(substance, f.code).toString() || '' })
  return p
}

// ===== ERROR =====
export const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) return err.response?.data?.message || err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}