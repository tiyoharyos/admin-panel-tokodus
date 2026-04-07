// app/(protected)/sablon/types.ts

export interface Sablon {
  id_st: string
  code: string
  label: string
  harga_jual_gt500: string
  harga_jual_gt100: string
  qty_minimum: string
}

export interface SablonStats {
  totalSablon: number
  withMinimumQty: number
  avgHargaGT500: number
  avgHargaGT100: number
  totalMinQty: number
}

export interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}