// app/(protected)/paperbag-sheet-sizes/types.ts

export interface SheetSize {
  id: string
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
}

export interface SheetStats {
  totalSizes: number
  avgArea: number
  maxArea: number
  minArea: number
  totalArea: number
  smallestSize: { code: string; area: number } | null
  largestSize:  { code: string; area: number } | null
}

export interface SheetForm {
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
}

export interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}