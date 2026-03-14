// ============================================================
// types.ts
// ============================================================

export interface DuplexDataDK {
  id: number
  gsm: number
  sheet_size_id: string
  panjang: number
  lebar: number
  harga_per_lembar: number
  type: 'DK'
}

export interface GramasiItem {
  id: string
  material_type_id: string
  gsm: string
  name: string
  material_type: string
  is_premium: string
}

export interface SheetSizeItem {
  id_sh: string
  panjang_sh: string
  lebar_sh: string
}

export interface FormData {
  sheet_size_id: string
  gsm: string
  harga_per_lembar: string
}

export interface DuplexStats {
  totalRecords: number
  averagePrice: number
  totalCombinations: number
  uniqueGsm: number
  uniqueSizes: number
  withPrice: number
}

// ===== API =====
export interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

export interface DuplexApiItem {
  id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
  updated_at: string | null
  id_sh: string
  panjang_mm: string
  lebar_mm: string
}

export interface GramasiApiResponse {
  status: number
  message?: string
  data?: GramasiItem[]
}