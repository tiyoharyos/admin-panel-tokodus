// app/(protected)/paperbag-sheet-sizes/hooks/useSheetSizes.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import type { ApiResponse, SheetSize, SheetStats } from '../types/types'
import { calculateStats, extractErrorMessage } from '../lib/utils'

interface UseSheetSizesReturn {
  sizeList: SheetSize[]
  stats: SheetStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useSheetSizes = (): UseSheetSizesReturn => {
  const [sizeList, setSizeList] = useState<SheetSize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse<SheetSize[]>>('/Admin/Paperbag/PaperbagSheetSizes')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setSizeList(data.data)
      } else {
        setSizeList([])
        setError('Format response tidak sesuai')
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Tidak bisa connect ke server'))
      setSizeList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = useMemo(() => calculateStats(sizeList), [sizeList])

  return { sizeList, stats, loading, error, refetch: fetchData }
}