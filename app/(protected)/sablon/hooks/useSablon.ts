// app/(protected)/sablon/hooks/useSablon.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import type { ApiResponse, Sablon, SablonStats } from '../types/types'
import { calculateStats, extractErrorMessage } from '../lib/utils'

interface UseSablonReturn {
  sablon: Sablon[]
  stats: SablonStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useSablon = (): UseSablonReturn => {
  const [sablon, setSablon] = useState<Sablon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSablon = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse<Sablon[]>>('/Admin/Sablon/Sablon')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setSablon(data.data)
      } else {
        setSablon([])
        setError('Format response tidak sesuai')
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Tidak bisa connect ke server'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSablon() }, [fetchSablon])

  const stats = useMemo(() => calculateStats(sablon), [sablon])

  return { sablon, stats, loading, error, refetch: fetchSablon }
}