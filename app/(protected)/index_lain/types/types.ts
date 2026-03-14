// app/(protected)/index-lainnya/types.ts

export interface IndexLainnya {
  id: string
  config_key: string
  qty_min: string | null
  qty_max: string | null
  value: string | null
  keterangan: string | null
}

export interface ConfigKeyGroup {
  config_key: string
  items: IndexLainnya[]
}

export interface IndexStats {
  totalItems: number
  totalConfigKeys: number
  withQuantityRange: number
  withValue: number
}

export interface AddFormData {
  config_key: string
  qty_min: string
  qty_max: string
  value: string
  keterangan: string
}

export interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}