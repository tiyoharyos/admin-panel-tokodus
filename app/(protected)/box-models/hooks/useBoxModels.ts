// ============================================================
// hooks/useBoxModels.ts — Data fetching & state management
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import axios from '@/lib/axios'
import type { BoxModel, BoxModelApiItem, FormulaApiResponse } from '../types/types'
import { mapBoxModelApiItem, parseFormulaResponse, extractErrorMessage } from '../lib/utils'

interface UseBoxModelsReturn {
  boxModels: BoxModel[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const fetchFormulaComponents = async (id: string | number) => {
  try {
    const { data } = await axios.get<FormulaApiResponse>(
      `/Admin/Box/boxFormulaComponentsJoinBox/${id}`,
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    )
    return parseFormulaResponse(data)
  } catch {
    return []
  }
}

export const useBoxModels = (): UseBoxModelsReturn => {
  const [boxModels, setBoxModels] = useState<BoxModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoxModels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await axios.get('/Admin/Box/boxModels')

      if (data?.status !== 200 || !Array.isArray(data.data)) {
        setBoxModels([])
        setError('Format response tidak sesuai')
        return
      }

      const processed = await Promise.all(
        data.data.map(async (item: BoxModelApiItem) => {
          const components = await fetchFormulaComponents(item.id_bm!)
          return mapBoxModelApiItem(item, components)
        })
      )

      setBoxModels(processed)
    } catch (err) {
      console.error('Error fetching box models:', err)
      setError(extractErrorMessage(err, 'Tidak bisa connect ke server'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoxModels()
  }, [fetchBoxModels])

  return { boxModels, loading, error, refetch: fetchBoxModels }
}