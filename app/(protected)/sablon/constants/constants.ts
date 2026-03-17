// app/(protected)/sablon/constants.ts

export const BASE_FORM = {
  code: '',
  label: '',
  harga_jual_gt500: '0',
  harga_jual_gt100: '0',
  qty_minimum: '0',
}

export type SablonForm = typeof BASE_FORM

export const SABLON_META: Record<string, { icon: string; accent: string }> = {
  none:    { icon: 'mdi:close-circle-outline', accent: '#64748b' },
  biasa:   { icon: 'mdi:palette',              accent: '#3b82f6' },
  special: { icon: 'mdi:star',                 accent: '#f59e0b' },
}

export const DEFAULT_META = { icon: 'mdi:sticker', accent: '#64748b' }