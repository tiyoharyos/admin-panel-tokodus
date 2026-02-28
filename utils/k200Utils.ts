import { K200Data, Stats } from '@/types/k200'

export const VALIDATION_RULES = {
  PANJANG: { min: 1, max: 1000 },
  LEBAR: { min: 1, max: 1000 },
  HARGA: { min: 1, max: 100000000 }
} as const

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat('id-ID').format(num)

export const calculateStats = (data: K200Data[]): Stats => {
  const totalRecords = data.length
  const uniqueCombinations = new Set(
    data.map(item => `${item.panjang}x${item.lebar}`)
  ).size
  const totalPrice = data.reduce((sum, item) => sum + item.harga_per_lembar, 0)
  const averagePrice = totalRecords > 0 ? totalPrice / totalRecords : 0

  const prices = data.map(item => item.harga_per_lembar)
  const minPrice = totalRecords > 0 ? Math.min(...prices) : 0
  const maxPrice = totalRecords > 0 ? Math.max(...prices) : 0

  let minSize: { panjang: number; lebar: number } | null = null
  let maxSize: { panjang: number; lebar: number } | null = null

  if (totalRecords > 0) {
    const area = data.map(item => ({ ...item, area: item.panjang * item.lebar }))
    const minAreaItem = area.reduce((min, item) => item.area < min.area ? item : min, area[0])
    const maxAreaItem = area.reduce((max, item) => item.area > max.area ? item : max, area[0])
    minSize = { panjang: minAreaItem.panjang, lebar: minAreaItem.lebar }
    maxSize = { panjang: maxAreaItem.panjang, lebar: maxAreaItem.lebar }
  }

  return { totalRecords, totalCombinations: uniqueCombinations, averagePrice, minPrice, maxPrice, minSize, maxSize }
}