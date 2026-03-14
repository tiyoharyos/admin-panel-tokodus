// ============================================================
// lib/utils.ts — Helper functions untuk Box Models feature
// ============================================================

import type { BoxModel, BoxModelApiItem, BoxModelStats, FormulaApiItem, FormulaApiResponse, FormulaComponent } from '../types'
import { VALID_SOURCES, VALID_TARGETS } from '../constants/constants'

// ===== CODE GENERATOR =====
export const generateCode = (existingCodes: string[]): string => {
  const numericCodes = existingCodes
    .filter(code => /^\d+$/.test(code))
    .map(Number)

  if (numericCodes.length) {
    return (Math.max(...numericCodes) + 1).toString().padStart(6, '0')
  }
  return Date.now().toString().slice(-6).padStart(6, '0')
}

// ===== FORMULA DISPLAY =====
export const formatFormulaComponent = (comp: FormulaComponent | undefined): string => {
  if (!comp) return '-'
  return `${comp.source} × ${comp.multiplier}${comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}`
}

export const formatFormula = (components: FormulaComponent[]): string => {
  if (!components?.length) return '-'

  const panjang = components.find(c => c.target === 'panjang')
  const lebar = components.find(c => c.target === 'lebar')

  return `P: ${formatFormulaComponent(panjang)} | L: ${formatFormulaComponent(lebar)}`
}

// ===== FORMULA PARSER =====
export const parseFormulaComponent = (comp: FormulaApiItem): FormulaComponent => ({
  id: comp.id_bfc?.toString(),
  target: comp.target || 'panjang',
  source: comp.source || 'P',
  multiplier: parseFloat(comp.multiplier?.toString() || '0') || 0,
  allowance_mm: parseFloat(comp.allowance_mm?.toString() || '0') || 0,
  sort_order: parseInt(comp.sort_order?.toString() || '1') || 1,
})

export const parseFormulaResponse = (data: FormulaApiResponse): FormulaComponent[] => {
  if (data?.status !== 200 || !data.data?.formula) return []

  const { formula } = data.data
  return Array.isArray(formula)
    ? formula.map(parseFormulaComponent)
    : [parseFormulaComponent(formula)]
}

// ===== BOX MODEL MAPPER =====
export const mapBoxModelApiItem = (item: BoxModelApiItem, components: FormulaComponent[]): BoxModel => ({
  id: item.id_bm?.toString() || '',
  kode: item.code || '',
  namaModel: item.name || '',
  deskripsi: item.description || '',
  status: item.status_bm === '1' || item.status_bm === 1,
  status_bm: item.status_bm?.toString() || '1',
  createdAt: item.created_at || new Date().toISOString(),
  updatedAt: item.updated_at || new Date().toISOString(),
  formulaComponents: components,
  hasFormula: components.length > 0,
  category: item.category || 'Mailer Box',
})

// ===== STATS CALCULATOR =====
export const calculateStats = (boxModels: BoxModel[]): BoxModelStats => {
  const withFormulas = boxModels.filter(m => m.hasFormula)
  const totalComponents = boxModels.reduce((acc, m) => acc + m.formulaComponents.length, 0)
  const maxComponents = Math.max(...boxModels.map(m => m.formulaComponents.length), 0)

  return {
    totalModels: boxModels.length,
    activeModels: boxModels.filter(m => m.status).length,
    withFormulas: withFormulas.length,
    withoutFormulas: boxModels.filter(m => !m.hasFormula).length,
    mailerBoxCount: boxModels.filter(m => m.category === 'Mailer Box').length,
    shoeBoxCount: boxModels.filter(m => m.category === 'Shoe Box').length,
    avgComponents: withFormulas.length
      ? (totalComponents / withFormulas.length).toFixed(1)
      : '0',
    maxComponents,
  }
}

// ===== VALIDATION =====
export const isInvalidComponent = (c: FormulaComponent): boolean =>
  !c.target ||
  !VALID_TARGETS.includes(c.target) ||
  !c.source ||
  !VALID_SOURCES.includes(c.source) ||
  c.multiplier === undefined ||
  isNaN(c.multiplier)

// ===== COMPONENT FIELD PARSER =====
export const parseComponentField = (
  field: keyof FormulaComponent,
  value: string | number
): string | number => {
  if (field === 'multiplier' || field === 'allowance_mm') return parseFloat(value as string) || 0
  if (field === 'sort_order') return parseInt(value as string) || 1
  return value
}

// ===== FORMULA PAYLOAD =====
export const buildFormulaPayload = (components: FormulaComponent[]) =>
  components.map(c => ({
    target: c.target,
    source: c.source,
    multiplier: c.multiplier.toString(),
    allowance_mm: c.allowance_mm?.toString() || '0',
    sort_order: c.sort_order?.toString() || '1',
  }))

// ===== ERROR EXTRACTOR =====
export const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (
      (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    )
  }
  return fallback
}

// ===== TEMP ID GENERATOR =====
export const generateTempId = (): string =>
  `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

// ===== NEW FORMULA COMPONENT FACTORY =====
export const createFormulaComponent = (
  boxModelId: string,
  sortOrder: number
): FormulaComponent => ({
  id: generateTempId(),
  box_model_id: boxModelId,
  target: 'panjang',
  source: 'P',
  multiplier: 0,
  allowance_mm: 0,
  sort_order: sortOrder,
})