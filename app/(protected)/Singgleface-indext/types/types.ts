// app/(protected)/sheet-settings/sheet-index/types.ts

export interface Flute {
  id: string
  code: string
  name: string
}

export interface SheetSubstance {
  id: string
  no: string
  layer_1: string
  layer_1_gsm: string
  layer_2: string
  layer_2_gsm: string
  layer_3: string
  layer_3_gsm: string
  substance_code: string
  created_at: string
  updated_at: string
  [key: string]: string | number // dynamic flute price keys
}

export interface FormData {
  layer_1: string
  layer_1_gsm: string
  layer_2: string
  layer_2_gsm: string
  layer_3: string
  layer_3_gsm: string
  price_per_m2: Record<string, string>
}

export interface SheetStats {
  totalSubstances: number
  activeSubstances: number
  withAllFlutes: number
  totalIndices: number
}

export interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

// ===== API =====
export interface FluteApiItem {
  id_f?: string | number
  code?: string
  name?: string
}

export interface SheetIndexApiItem {
  s_substance_id?: string | number
  id?: string | number
  layer_1_gsm?: string
  layer_2_gsm?: string
  layer_3_gsm?: string
  layer_1_type?: string
  layer_2_type?: string
  layer_3_type?: string
  code?: string
  price_per_m2?: string | number
  created_at?: string
  updated_at?: string
}

export interface ApiResponse {
  status?: number
  message?: string
  data?: SheetIndexApiItem[]
}

export interface ApiSuccessResponse {
  status: number
  message?: string
}