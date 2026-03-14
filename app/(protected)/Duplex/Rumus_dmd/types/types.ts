// app/(protected)/duplex-dmd/types.ts

export interface DuplexDMDData {
  id: number
  panjang: number
  lebar: number
  harga_per_lembar: number
  gsm: number
  type: 'DMD'
  pl?: string
  sheet_size_id?: string
  gramasi_id?: string
}

export interface FormData {
  sheet_size_id: string
  gsm: string
  harga_per_lembar: string
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

export interface GramasiApiResponse {
  status: number
  data?: GramasiItem[]
}

export interface DuplexMduplekItem {
  id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
  id_sh: string
  panjang_mm: string
  lebar_mm: string
}