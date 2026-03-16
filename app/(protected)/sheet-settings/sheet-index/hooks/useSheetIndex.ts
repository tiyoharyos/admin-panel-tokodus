// app/(protected)/sheet-settings/sheet-index/hooks/useSheetIndex.ts

import { useState, useEffect, useCallback, useRef } from 'react'
import axios from '@/lib/axios'
import type { ApiResponse, Flute, SheetIndexApiItem, SheetSubstance } from '../types/types'
import { extractErrorMessage, groupApiItems, processFluteList } from '../lib/utils'

interface FluteResponse {
  status?: number
  data?: { id_f?: string | number; code?: string; name?: string }[]
}

interface UseSheetIndexReturn {
  sheetSubstances: SheetSubstance[]
  flutes: Flute[]
  flutesRef: React.MutableRefObject<Flute[]>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useSheetIndex = (): UseSheetIndexReturn => {
  const [sheetSubstances, setSheetSubstances] = useState<SheetSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ref so action handlers never have stale flute list
  const flutesRef = useRef<Flute[]>([])

  const fetchFlutes = useCallback(async (): Promise<Flute[]> => {
    try {
      const res = await axios.get('/Admin/Flutes/Flutes')
      const rd = res.data as FluteResponse | typeof res.data[]

      let processed: Flute[] = []
      if (Array.isArray(rd)) {
        processed = processFluteList(rd)
      } else if ((rd as FluteResponse)?.status === 200 && Array.isArray((rd as FluteResponse).data)) {
        processed = processFluteList((rd as FluteResponse).data!)
      }

      setFlutes(processed)
      flutesRef.current = processed
      return processed
    } catch (err) {
      console.error('Error fetching flutes:', err)
      setFlutes([])
      flutesRef.current = []
      return []
    }
  }, [])

  const fetchSheetData = useCallback(async (currentFlutes: Flute[]): Promise<void> => {
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
      console.error('Error fetching sheet index:', err)
      setError(extractErrorMessage(err, 'Gagal memuat data'))
      setSheetSubstances([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    const fetchedFlutes = await fetchFlutes()
    await fetchSheetData(fetchedFlutes)
  }, [fetchFlutes, fetchSheetData])

  useEffect(() => { refetch() }, [refetch])

  // Keep ref in sync when flutes state changes
  useEffect(() => { flutesRef.current = flutes }, [flutes])

  return { sheetSubstances, flutes, flutesRef, loading, error, refetch }
}