export interface Flute {
  id: string
  code: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface FluteStats {
  totalFlutes: number
  latestAdded: { code: string; name: string; createdAt: string } | null
  lastUpdated: { code: string; name: string; updatedAt: string } | null
}

export interface FormData {
  code: string
  name: string
}

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