// app/(protected)/Duplex/Rumus_dk/hooks/useDuplexDK.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import type { ApiResponse, DuplexApiItem, DuplexDataDK, DuplexStats, GramasiApiResponse, GramasiItem, SheetSizeItem } from '../types/types'
import { calculateStats, extractSheetSizes, mapPriceItem } from '../lib/utils'

interface UseDuplexDKReturn {
  dataDK: DuplexDataDK[]
  gramasiList: GramasiItem[]
  sheetSizeList: SheetSizeItem[]
  loading: boolean
  loadingGramasi: boolean
  error: string | null
  stats: DuplexStats
  refetch: () => Promise<void>
}

export const useDuplexDK = (): UseDuplexDKReturn => {
  const [dataDK, setDataDK] = useState<DuplexDataDK[]>([])
  const [gramasiList, setGramasiList] = useState<GramasiItem[]>([])
  const [sheetSizeList, setSheetSizeList] = useState<SheetSizeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGramasi, setLoadingGramasi] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGramasi = useCallback(async () => {
    try {
      setLoadingGramasi(true)
      const res = await axios.get<GramasiApiResponse>('Admin/Duplek/gramasiIndex')

      if (res.data?.status === 200 && Array.isArray(res.data.data)) {
        const seen = new Set<string>()
        const filtered = res.data.data
          .filter(item => item.name === 'Duplex')
          .filter(item => {
            if (seen.has(item.gsm)) return false
            seen.add(item.gsm)
            return true
          })
          .sort((a, b) => parseInt(a.gsm) - parseInt(b.gsm))
        setGramasiList(filtered)
      } else {
        setGramasiList([])
      }
    } catch (e) {
      console.error('fetchGramasi error:', e)
      setGramasiList([])
    } finally {
      setLoadingGramasi(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await axios.get<ApiResponse<DuplexApiItem[]>>('Admin/Duplek/duplekKraftPrices')
      const raw: DuplexApiItem[] =
        res.data?.status === 200 && Array.isArray(res.data.data) ? res.data.data : []

      setDataDK(raw.map(mapPriceItem))

      if (raw.length > 0) {
        setSheetSizeList(extractSheetSizes(raw))
      } else {
        // Fallback: ambil ukuran dari endpoint lain
        try {
          const fallback = await axios.get<ApiResponse<DuplexApiItem[]>>('Admin/Duplek/duplekMduplekPrices')
          const fallbackRaw: DuplexApiItem[] =
            fallback.data?.status === 200 && Array.isArray(fallback.data.data)
              ? fallback.data.data
              : []
          setSheetSizeList(extractSheetSizes(fallbackRaw))
        } catch {
          setSheetSizeList([])
        }
      }
    } catch (e) {
      console.error('fetchData error:', e)
      setError('Gagal mengambil data')
      setDataDK([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGramasi()
    fetchData()
  }, [fetchGramasi, fetchData])

  const stats = useMemo(() => calculateStats(dataDK), [dataDK])

  return { dataDK, gramasiList, sheetSizeList, loading, loadingGramasi, error, stats, refetch: fetchData }
}