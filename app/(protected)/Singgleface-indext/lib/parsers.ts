// lib/parsers.ts
import type { ApiRawItem, Flute, SinglefaceSubstance, SinglefaceFormData, ParsedApiData } from '../types/types'

export const parseFlatApiResponse = (rawItems: ApiRawItem[]): ParsedApiData => {
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

export const buildPayload = (form: SinglefaceFormData) => {
  const selectedFlutes = form.flutes.filter(f => f.selected)
  return {
    layer_1: parseFloat(form.layer_1.trim()),
    layer_1_type: form.layer_1_type,
    layer_2: parseFloat(form.layer_2.trim()),
    layer_2_type: form.layer_2_type,
    flutes: selectedFlutes.map(f => parseInt(f.id)).filter(id => id > 0),
    price_per_m2: selectedFlutes.map(f => parseFloat(f.price || '0')),
  }
}