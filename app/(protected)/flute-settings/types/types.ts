// app/(protected)/flutes/types.ts

export interface Flute {
  id: string
  code: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface FluteStats {
  totalFlutes: number
  bFlute: number
  cFlute: number
  cbFlute: number
  ebFlute: number
  others: number
}

export interface FormData {
  code: string
  name: string
}

// ===== API =====
export interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data: T
}

export interface FluteApiItem {
  id_f?: string | number
  code?: string
  name?: string
  created_at?: string
  updated_at?: string
}

export interface FluteListResponse {
  status: number
  message?: string
  data: FluteApiItem[]
}

export interface FluteSingleResponse {
  status: number
  message?: string
  data: FluteApiItem
}