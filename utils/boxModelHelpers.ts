import { FormulaComponent } from '@/types/boxModel'

export const getCategoryBadgeClass = (category: string): string => {
  const classes: Record<string, string> = {
    'Mailer Box': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Shoe Box': 'bg-green-100 text-green-800 border border-green-200',
    'Food Box': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Premium Box': 'bg-purple-100 text-purple-800 border border-purple-200'
  }
  return classes[category] || 'bg-gray-100 text-gray-800 border border-gray-200'
}

export const getStatusBadgeClass = (status: boolean): string => {
  return status
    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    : 'bg-rose-100 text-rose-800 border border-rose-200'
}

export const getFormulaBadgeClass = (hasFormula: boolean): string => {
  return hasFormula
    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
    : 'bg-amber-100 text-amber-800 border border-amber-200'
}

export const formatFormulaDisplay = (components: FormulaComponent[]): string => {
  if (!components || components.length === 0) return '-'

  const panjangComp = components.find(c => c.target === 'panjang')
  const lebarComp = components.find(c => c.target === 'lebar')

  const formatComp = (comp: FormulaComponent | undefined): string => {
    if (!comp) return '-'
    return `${comp.source} × ${comp.multiplier}${comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}`
  }

  return `P: ${formatComp(panjangComp)} | L: ${formatComp(lebarComp)}`
}

export const generateCode = (existingCodes: string[]): string => {
  const numericCodes = existingCodes
    .filter(code => /^\d+$/.test(code))
    .map(code => parseInt(code))

  if (numericCodes.length > 0) {
    const lastNum = Math.max(...numericCodes)
    return (lastNum + 1).toString().padStart(6, '0')
  }

  const timestamp = Date.now().toString().slice(-6)
  return timestamp.padStart(6, '0')
}