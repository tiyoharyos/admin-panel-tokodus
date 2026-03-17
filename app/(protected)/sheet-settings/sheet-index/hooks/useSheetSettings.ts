// app/(protected)/sheet-settings/hooks/useSheetSettings.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import type {
  ApiResponse, Flute, FluteApiItem, PaginationConfig,
  SheetIndexApiItem, SheetStats, SheetSubstance,
} from '../types/types'
import { calculateStats, extractErrorMessage, groupApiItems, processFluteList } from '../lib/utils'

interface UseSheetSettingsReturn {
  sheetSubstances: SheetSubstance[]
  flutes: Flute[]
  stats: SheetStats
  loading: boolean
  error: string | null
  pagination: PaginationConfig
  setPagination: React.Dispatch<React.SetStateAction<PaginationConfig>>
  refetch: () => Promise<void>
}

interface FluteResponse {
  status?: number
  data?: FluteApiItem[]
}

export const useSheetSettings = (): UseSheetSettingsReturn => {
  const [sheetSubstances, setSheetSubstances] = useState<SheetSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0,
  })

  const fetchFlutes = useCallback(async (): Promise<Flute[]> => {
    try {
      const res = await axios.get('/Admin/Flutes/Flutes')
      const rd = res.data as FluteResponse | FluteApiItem[]

      let processed: Flute[] = []
      if (Array.isArray(rd)) {
        processed = processFluteList(rd)
      } else if ((rd as FluteResponse)?.status === 200 && Array.isArray((rd as FluteResponse).data)) {
        processed = processFluteList((rd as FluteResponse).data!)
      }

      setFlutes(processed)
      return processed
    } catch (err) {
      console.error('Error fetching flutes:', err)
      setFlutes([])
      return []
    }
  }, [])

  const fetchSheetData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const res = await axios.get<ApiResponse | SheetIndexApiItem[]>('/Admin/Sheet/sheetIndex')
      const raw: SheetIndexApiItem[] = Array.isArray(res.data)
        ? res.data
        : (res.data as ApiResponse)?.data || []

      if (!Array.isArray(raw)) throw new Error('Format respons tidak valid')

      setSheetSubstances(groupApiItems(raw))
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat data'))
      setSheetSubstances([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    await fetchFlutes()
    await fetchSheetData()
  }, [fetchFlutes, fetchSheetData])

  useEffect(() => { refetch() }, [refetch])

  // stats as derived state — no separate setState needed
  const stats = useMemo(() => calculateStats(sheetSubstances, flutes), [sheetSubstances, flutes])

  return { sheetSubstances, flutes, stats, loading, error, pagination, setPagination, refetch }
}