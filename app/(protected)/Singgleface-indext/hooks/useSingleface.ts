// hooks/useSingleface.ts

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import { API_BASE } from '@/app/(protected)/Singgleface-indext/constants/constants'
import { parseFlatApiResponse, getErrMsg } from '@/app/(protected)/Singgleface-indext/lib/utils'
import type { ApiResponse, ApiRawItem, Flute, SinglefaceSubstance, PaginationConfig, Stats } from '@/app/(protected)/Singgleface-indext/types/types'

export const useSingleface = () => {
  const [substances, setSubstances] = useState<SinglefaceSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  })

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<ApiResponse<ApiRawItem[]>>(`${API_BASE}/singelfaceIndex`)
      const rawItems: ApiRawItem[] =
        response.data?.data || (Array.isArray(response.data) ? response.data : [])
      if (!Array.isArray(rawItems)) throw new Error('Format respons tidak valid')
      const { flutes: f, substances: s } = parseFlatApiResponse(rawItems)
      setFlutes(f)
      setSubstances(s)
    } catch (err) {
      setError(getErrMsg(err, 'Gagal memuat data'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const stats = useMemo<Stats>(() => {
    const withAll = substances.filter(
      s =>
        flutes.length 
    ).length
    return {
      totalSubstances: substances.length,
      activeSubstances: substances.filter(s => s.layer_1 && s.layer_2).length,
      withAllFlutes: withAll,
      totalIndices: substances.length * flutes.length,
    }
  }, [substances, flutes])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: number, filteredCount: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: value,
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(filteredCount / value)),
    }))
  }

  const addItem = async (data: unknown): Promise<ApiResponse> => {
    const res = await axios.post<ApiResponse>(`${API_BASE}/singelfaceIndexAdd`, data, {
      headers: { 'Content-Type': 'application/json' },
    })
    return res.data
  }

  const updateItem = async (data: unknown): Promise<ApiResponse> => {
    const res = await axios.put<ApiResponse>(`${API_BASE}/singelfaceIndexUpdate`, data, {
      headers: { 'Content-Type': 'application/json' },
    })
    return res.data
  }

  const deleteItem = async (id: string): Promise<ApiResponse> => {
    const res = await axios.delete<ApiResponse>(`${API_BASE}/singelfaceIndexDelete/${id}`)
    if (res.data?.status === 200) {
      setSubstances(prev => prev.filter(s => s.id !== id))
    }
    return res.data
  }

  return {
    substances,
    flutes,
    loading,
    error,
    stats,
    pagination,
    setPagination,
    fetchAll,
    handlePageChange,
    handleItemsPerPageChange,
    addItem,
    updateItem,
    deleteItem,
  }
}