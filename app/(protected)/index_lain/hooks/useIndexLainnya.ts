// app/(protected)/index-lainnya/hooks/useIndexLainnya.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import type { ApiResponse, ConfigKeyGroup, IndexLainnya, IndexStats } from '../types/types'
import { calculateStats, extractErrorMessage, groupByConfigKey } from '../lib/utils'

interface UseIndexLainnyaReturn {
  indexData: IndexLainnya[]
  configKeyGroups: ConfigKeyGroup[]
  allConfigKeys: string[]
  stats: IndexStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useIndexLainnya = (): UseIndexLainnyaReturn => {
  const [indexData, setIndexData] = useState<IndexLainnya[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get<ApiResponse<IndexLainnya[]>>('/Admin/Other/indexLainnya')
      if (res.data?.status === 200 && Array.isArray(res.data.data)) {
        setIndexData(res.data.data)
      } else {
        setIndexData([])
        setError('Format response tidak sesuai')
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Tidak bisa connect ke server'))
      setIndexData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const allConfigKeys = useMemo(
    () => Array.from(new Set(indexData.map(i => i.config_key))).sort(),
    [indexData]
  )

  const configKeyGroups = useMemo(() => groupByConfigKey(indexData), [indexData])
  const stats = useMemo(() => calculateStats(indexData), [indexData])

  return { indexData, configKeyGroups, allConfigKeys, stats, loading, error, refetch: fetchData }
}