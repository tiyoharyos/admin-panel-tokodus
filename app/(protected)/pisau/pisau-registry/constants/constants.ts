// app/(protected)/pisau-registry/constants.ts

export const BASE_ADD_FORM = {
  box_model_id: '',
  panjang_cm: '',
  lebar_cm: '',
  tinggi_cm: '',
  kode_pisau: '',
  catatan: '',
  status: 'active',
}

export type AddForm = typeof BASE_ADD_FORM

export const DIMENSION_TYPES = [
  { id: 'panjang', label: 'Panjang', field: 'panjang_cm', icon: 'mdi:arrow-expand-horizontal', color: '#3b82f6' },
  { id: 'lebar',   label: 'Lebar',   field: 'lebar_cm',   icon: 'mdi:arrow-expand-vertical',   color: '#10b981' },
  { id: 'tinggi',  label: 'Tinggi',  field: 'tinggi_cm',  icon: 'mdi:arrow-expand-up',          color: '#8b5cf6' },
] as const