// lib/utils.ts
import { isAxiosError } from 'axios'
import { LAYER_META, DEFAULT_LAYER_META } from '../constants/constants'
import type { SinglefaceFormData } from '../types/types'

export const formatCurrency = (val: number | string): string => {
  const num = parseFloat(val as string) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export const getLayerMeta = (type: string) => LAYER_META[type] || DEFAULT_LAYER_META

export const formatSubstanceDisplay = (s: {
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
}) => `${s.layer_1}${s.layer_1_type} / ${s.layer_2}${s.layer_2_type}`

export const getErrMsg = (err: unknown, fallback = 'Terjadi kesalahan'): string => {
  if (isAxiosError(err)) return err.response?.data?.message || err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

export const validateSinglefaceForm = (form: SinglefaceFormData): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!form.layer_1?.toString().trim()) {
    errors.layer_1 = 'Gramasi layer 1 tidak boleh kosong'
  } else if (parseFloat(form.layer_1) <= 0) {
    errors.layer_1 = 'Gramasi harus lebih dari 0'
  }

  if (!form.layer_2?.toString().trim()) {
    errors.layer_2 = 'Gramasi layer 2 tidak boleh kosong'
  } else if (parseFloat(form.layer_2) <= 0) {
    errors.layer_2 = 'Gramasi harus lebih dari 0'
  }

  const selectedFlutes = form.flutes.filter(f => f.selected)
  if (selectedFlutes.length === 0) {
    errors.flutes = 'Minimal satu flute harus dipilih'
  }

  selectedFlutes.forEach(flute => {
    if (!flute.price?.toString().trim()) {
      errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute wajib diisi`
    } else if (isNaN(parseFloat(flute.price)) || parseFloat(flute.price) <= 0) {
      errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus lebih dari 0`
    }
  })

  return errors
}