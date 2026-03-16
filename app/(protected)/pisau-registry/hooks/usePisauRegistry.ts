// app/(protected)/pisau-registry/hooks/usePisauRegistry.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import type { ApiResponse, BoxModel, PisauRegistry, PisauStats } from '../types/types'
import { calculateStats, extractErrorMessage } from '../lib/utils'

// ===== REGISTRY HOOK =====
interface UsePisauRegistryReturn {
  registries: PisauRegistry[]
  stats: PisauStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const usePisauRegistry = (): UsePisauRegistryReturn => {
  const [registries, setRegistries] = useState<PisauRegistry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRegistries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse<PisauRegistry[]>>('/Admin/Pisau/PisauRegistry')
      if (Array.isArray(data?.data)) {
        setRegistries(data.data)
      } else if (data?.status === 200) {
        setRegistries([])
      } else {
        setRegistries([])
        setError(data?.message || 'Format response tidak sesuai')
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Tidak bisa connect ke server'))
      setRegistries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRegistries() }, [fetchRegistries])

  const stats = useMemo(() => calculateStats(registries), [registries])

  return { registries, stats, loading, error, refetch: fetchRegistries }
}

// ===== BOX MODELS HOOK =====
interface UseBoxModelsReturn {
  boxModels: BoxModel[]
  loadingBoxModels: boolean
}

export const useBoxModels = (): UseBoxModelsReturn => {
  const [boxModels, setBoxModels] = useState<BoxModel[]>([])
  const [loadingBoxModels, setLoadingBoxModels] = useState(false)

  const fetchBoxModels = useCallback(async () => {
    try {
      setLoadingBoxModels(true)
      const { data } = await axios.get<ApiResponse<BoxModel[]>>('/Admin/Box/boxModels')
      setBoxModels(Array.isArray(data?.data) ? data.data : [])
    } catch {
      setBoxModels([])
    } finally {
      setLoadingBoxModels(false)
    }
  }, [])

  useEffect(() => { fetchBoxModels() }, [fetchBoxModels])

  return { boxModels, loadingBoxModels }
}