// app/(protected)/pisau-registry/types.ts

export interface PisauRegistry {
  id: string
  box_model_id: string
  panjang_cm: string
  lebar_cm: string
  tinggi_cm: string
  kode_pisau: string
  catatan: string
  status: string
  created_at: string
  updated_at: string | null
  id_bm: string
  code: string
  name: string
  description: string
  status_bm: string
  is_shipping_box: string
  input_mode: string
  is_paperbag: string
}

export interface BoxModel {
  id_bm: string
  code: string
  name: string
  description?: string
  status_bm?: string
  is_shipping_box?: string
  input_mode?: string
  is_paperbag?: string
}

export interface PisauStats {
  totalRegistry: number
  avgPanjang: number
  avgLebar: number
  avgTinggi: number
  minPanjang: number
  maxPanjang: number
  minLebar: number
  maxLebar: number
  minTinggi: number
  maxTinggi: number
  shippingBoxCount: number
}

export interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}