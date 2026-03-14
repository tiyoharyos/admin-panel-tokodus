// ============================================================
// types.ts — Semua interface & type untuk Box Models feature
// ============================================================

export interface FormulaComponent {
  id?: string
  box_model_id?: string
  target: 'panjang' | 'lebar' | string
  source: 'P' | 'L' | 'T' | 'A' | 'B' | 'C' | string
  multiplier: number
  allowance_mm?: number
  sort_order?: number
}

export interface BoxModel {
  id: string
  kode: string
  namaModel: string
  deskripsi: string
  status: boolean
  status_bm: string
  createdAt: string
  updatedAt: string
  formulaComponents: FormulaComponent[]
  hasFormula: boolean
  category: string
}

export interface BoxModelStats {
  totalModels: number
  activeModels: number
  withFormulas: number
  withoutFormulas: number
  mailerBoxCount: number
  shoeBoxCount: number
  avgComponents: string
  maxComponents: number
}

export interface AddFormData {
  code: string
  name: string
  description: string
  category: string
  status_bm: string
}

// ===== API =====
export interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

export interface BoxModelApiItem {
  id_bm?: string | number
  code?: string
  name?: string
  description?: string
  category?: string
  status_bm?: string | number
  created_at?: string
  updated_at?: string
}

export interface FormulaApiItem {
  id_bfc?: string | number
  target?: string
  source?: string
  multiplier?: string | number
  allowance_mm?: string | number
  sort_order?: string | number
}

export interface FormulaApiResponse {
  status: number
  data?: {
    formula?: FormulaApiItem | FormulaApiItem[]
  }
}