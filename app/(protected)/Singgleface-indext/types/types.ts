// types/types.ts

export interface Flute {
  id: string
  code: string
  name: string
}

export interface SinglefaceSubstance {
  id: string
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  substance_code: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface ApiRawItem {
  id: string
  substance_id: string
  flute_id: string
  price_per_m2: string
  layer_1_gsm: string
  layer_1_type: string
  layer_2_gsm: string
  layer_2_type: string
  id_f: string
  code: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

export interface FluteSelection {
  id: string
  code: string
  name: string
  selected: boolean
  price: string
}

export interface FormData {
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  flutes: FluteSelection[]
}

export interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

export interface Stats {
  totalSubstances: number
  activeSubstances: number
  withAllFlutes: number
  totalIndices: number
}