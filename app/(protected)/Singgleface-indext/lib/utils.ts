// lib/utils.ts

import { isAxiosError } from 'axios'
import { LAYER_META, DEFAULT_LAYER_META } from '@/app/(protected)/Singgleface-indext/constants/constants'
import type { ApiRawItem, Flute, SinglefaceSubstance } from '@/app/(protected)/Singgleface-indext/types/types'

export const formatCurrency = (val: number | string) => {
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

export const parseFlatApiResponse = (rawItems: ApiRawItem[]) => {
  const fluteMap = new Map<string, Flute>()
  rawItems.forEach(item => {
    if (!fluteMap.has(item.id_f)) {
      fluteMap.set(item.id_f, { id: item.id_f, code: item.code, name: item.name })
    }
  })

  const substanceMap = new Map<string, SinglefaceSubstance>()
  rawItems.forEach(item => {
    if (!substanceMap.has(item.substance_id)) {
      substanceMap.set(item.substance_id, {
        id: item.substance_id,
        layer_1: item.layer_1_gsm || '',
        layer_1_type: item.layer_1_type || 'K',
        layer_2: item.layer_2_gsm || '',
        layer_2_type: item.layer_2_type || 'M',
        substance_code: `${item.layer_1_gsm}${item.layer_1_type}/${item.layer_2_gsm}${item.layer_2_type}`,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })
    }
    const substance = substanceMap.get(item.substance_id)!
    substance[`${item.code.toLowerCase()}_flute_price`] = parseFloat(item.price_per_m2) || 0
  })

  return {
    flutes: Array.from(fluteMap.values()),
    substances: Array.from(substanceMap.values()),
  }
}