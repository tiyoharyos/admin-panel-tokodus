// app/(protected)/duplex-dmd/hooks/useDuplexDMD.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import type {
  ApiResponse, DuplexDMDData, DuplexMduplekItem, DuplexStats,
  GramasiApiResponse, GramasiItem, SheetSizeItem,
} from '../types/types'
import { calculateStats, extractSheetSizes, mapDuplexItem } from '../lib/utils'

interface UseDuplexDMDReturn {
  duplexData: DuplexDMDData[]
  gramasiList: GramasiItem[]
  sheetSizeList: SheetSizeItem[]
  loading: boolean
  loadingGramasi: boolean
  error: string | null
  stats: DuplexStats
  refetch: () => Promise<void>
}

export const useDuplexDMD = (): UseDuplexDMDReturn => {
  const [duplexData, setDuplexData] = useState<DuplexDMDData[]>([])
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
    } catch (err) {
      console.error('Error fetching gramasi:', err)
      setGramasiList([])
    } finally {
      setLoadingGramasi(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await axios.get<ApiResponse<DuplexMduplekItem[]>>('Admin/Duplek/duplekMduplekPrices')
      const raw: DuplexMduplekItem[] =
        res.data?.status === 200 && Array.isArray(res.data.data) ? res.data.data : []

      if (raw.length === 0) {
        setDuplexData([])
        setSheetSizeList([])
        return
      }

      setSheetSizeList(extractSheetSizes(raw))
      setDuplexData(
        raw
          .filter(item => item.panjang_mm && item.lebar_mm && item.gsm)
          .map(mapDuplexItem)
          .filter(item => item.panjang > 0 && item.lebar > 0 && item.gsm > 0)
      )
    } catch (err) {
      console.error('Error fetching Duplex DMD data:', err)
      setError('Gagal mengambil data DMD')
      setDuplexData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGramasi()
    fetchData()
  }, [fetchGramasi, fetchData])

  const stats = useMemo(() => calculateStats(duplexData), [duplexData])

  return { duplexData, gramasiList, sheetSizeList, loading, loadingGramasi, error, stats, refetch: fetchData }
}