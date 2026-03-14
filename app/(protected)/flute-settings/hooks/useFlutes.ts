// app/(protected)/flutes/hooks/useFlutes.ts

import { useState, useEffect, useCallback } from 'react'
import { AxiosError } from 'axios'
import axios from '@/lib/axios'
import type { Flute, FluteListResponse, FluteStats } from '../types/types'
import { calculateStats, extractErrorMessage, mapFluteItem } from '../lib/utils'
import { EMPTY_STATS } from '../constants/constants'

interface UseFlutesReturn {
  flutes: Flute[]
  stats: FluteStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useFlutes = (): UseFlutesReturn => {
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [stats, setStats] = useState<FluteStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFlutes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await axios.get('/Admin/Flutes/Flutes')
      const rd = res.data

      let processed: Flute[] = []

      if (rd && typeof rd === 'object') {
        if ('status' in rd && rd.status === 200 && Array.isArray((rd as FluteListResponse).data)) {
          processed = (rd as FluteListResponse).data.map(mapFluteItem)
        } else if (Array.isArray(rd)) {
          processed = rd.map(mapFluteItem)
        }
      }

      setFlutes(processed)
      setStats(calculateStats(processed))
    } catch (err) {
      if (err instanceof AxiosError &&
        (err.response?.status === 404 || err.response?.status === 204)) {
        setFlutes([])
        setStats(EMPTY_STATS)
        setError(null)
      } else {
        setError(extractErrorMessage(err, 'Terjadi kesalahan saat memuat data'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFlutes() }, [fetchFlutes])

  return { flutes, stats, loading, error, refetch: fetchFlutes }
}