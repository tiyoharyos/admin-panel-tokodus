// app/(protected)/sheet-k200/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import { AxiosError } from 'axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ===== TYPE DEFINITIONS =====
interface K200Data {
  id_s_k: number
  panjang: number
  lebar: number
  harga_per_lembar: number
  created_at?: string
  updated_at?: string
}

interface FormData {
  panjang: string
  lebar: string
  harga_per_lembar: string
}

interface Stats {
  totalRecords: number
  totalCombinations: number
  averagePrice: number
  minPrice: number
  maxPrice: number
  minSize: { panjang: number; lebar: number } | null
  maxSize: { panjang: number; lebar: number } | null
}

interface FormErrors {
  panjang?: string
  lebar?: string
  harga_per_lembar?: string
  general?: string
}

// API Response Types
interface ApiResponse<T> {
  status?: number
  success?: boolean
  message?: string
  data?: T
}

interface K200ApiItem {
  id_s_k?: number | string
  id?: number | string
  panjang?: number | string
  lebar?: number | string
  harga_per_lembar?: number | string
  created_at?: string
  updated_at?: string
}

// SweetAlert Result Type
interface SweetAlertResult {
  isConfirmed: boolean
  isDenied: boolean
  isDismissed: boolean
}

// ===== CONSTANTS =====
const API_ENDPOINTS = {
  BASE: '/Admin/Sheet/K200',
  ADD: '/Admin/Sheet/K200Add',
  EDIT: '/Admin/Sheet/K200Edit',
  DELETE: (id: number) => `/Admin/Sheet/K200Del/${id}`,
  BY_ID: (id: number) => `/Admin/Sheet/K200Byid/${id}`
} as const

const BASE_FORM: FormData = {
  panjang: '',
  lebar: '',
  harga_per_lembar: ''
}

const VALIDATION_RULES = {
  PANJANG: { min: 1, max: 1000 },
  LEBAR: { min: 1, max: 1000 },
  HARGA: { min: 1, max: 100000000 }
} as const

// ===== UTILITIES =====
const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)

const formatNumber = (num: number): string =>
  new Intl.NumberFormat('id-ID').format(num)

const calculateStats = (data: K200Data[]): Stats => {
  const totalRecords = data.length
  const uniqueCombinations = new Set(
    data.map(item => `${item.panjang}x${item.lebar}`)
  ).size
  const totalPrice = data.reduce((sum, item) => sum + item.harga_per_lembar, 0)
  const averagePrice = totalRecords > 0 ? totalPrice / totalRecords : 0
  
  const prices = data.map(item => item.harga_per_lembar)
  const minPrice = totalRecords > 0 ? Math.min(...prices) : 0
  const maxPrice = totalRecords > 0 ? Math.max(...prices) : 0

  let minSize: { panjang: number; lebar: number } | null = null
  let maxSize: { panjang: number; lebar: number } | null = null
  
  if (totalRecords > 0) {
    const area = data.map(item => ({ 
      ...item, 
      area: item.panjang * item.lebar 
    }))
    
    const minAreaItem = area.reduce((min, item) => item.area < min.area ? item : min, area[0])
    const maxAreaItem = area.reduce((max, item) => item.area > max.area ? item : max, area[0])
    
    minSize = { panjang: minAreaItem.panjang, lebar: minAreaItem.lebar }
    maxSize = { panjang: maxAreaItem.panjang, lebar: maxAreaItem.lebar }
  }

  return { 
    totalRecords, 
    totalCombinations: uniqueCombinations, 
    averagePrice,
    minPrice,
    maxPrice,
    minSize,
    maxSize
  }
}

const validateForm = (
  formData: FormData, 
  existingData: K200Data[], 
  editingItem: K200Data | null = null
): FormErrors => {
  const errors: FormErrors = {}
  const { panjang, lebar, harga_per_lembar } = formData

  const p = parseFloat(panjang)
  if (!panjang?.trim()) errors.panjang = 'Panjang tidak boleh kosong'
  else if (isNaN(p) || p <= 0) errors.panjang = 'Panjang harus angka > 0'
  else if (p > VALIDATION_RULES.PANJANG.max) errors.panjang = `Panjang maksimal ${VALIDATION_RULES.PANJANG.max} cm`

  const l = parseFloat(lebar)
  if (!lebar?.trim()) errors.lebar = 'Lebar tidak boleh kosong'
  else if (isNaN(l) || l <= 0) errors.lebar = 'Lebar harus angka > 0'
  else if (l > VALIDATION_RULES.LEBAR.max) errors.lebar = `Lebar maksimal ${VALIDATION_RULES.LEBAR.max} cm`

  const h = parseFloat(harga_per_lembar)
  if (!harga_per_lembar?.trim()) errors.harga_per_lembar = 'Harga tidak boleh kosong'
  else if (isNaN(h) || h <= 0) errors.harga_per_lembar = 'Harga harus angka > 0'
  else if (h > VALIDATION_RULES.HARGA.max) errors.harga_per_lembar = 'Harga maksimal 100 juta'

  if (!errors.panjang && !errors.lebar && p > 0 && l > 0) {
    const isDuplicate = existingData.some(item => {
      const isSameSize = Math.abs(item.panjang - p) < 0.001 && Math.abs(item.lebar - l) < 0.001
      return editingItem ? isSameSize && item.id_s_k !== editingItem.id_s_k : isSameSize
    })
    
    if (isDuplicate) {
      errors.general = `Kombinasi ${p} × ${l} cm sudah ada dalam database`
    }
  }

  return errors
}

const showSuccess = (message: string): Promise<SweetAlertResult> => 
  Swal.fire({ 
    icon: 'success', 
    title: 'Berhasil!', 
    text: message, 
    showConfirmButton: false, 
    timer: 1500,
    background: '#ffffff',
    customClass: {
      popup: 'rounded-xl shadow-xl'
    }
  })

const showError = (message: string): Promise<SweetAlertResult> => 
  Swal.fire({ 
    icon: 'error', 
    title: 'Error!', 
    text: message, 
    confirmButtonColor: '#2563eb',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-xl shadow-xl',
      confirmButton: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg'
    }
  })

const showConfirm = async (message: string): Promise<SweetAlertResult> => 
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#2563eb',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    background: '#ffffff',
    customClass: {
      popup: 'rounded-xl shadow-xl',
      confirmButton: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg',
      cancelButton: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg'
    }
  })

// ===== MAIN COMPONENT =====
export default function K200SettingsPage() {
  // ===== STATE =====
  const [data, setData] = useState<K200Data[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  
  // Modal state
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | null>(null)
  
  // Form state
  const [addForm, setAddForm] = useState<FormData>(BASE_FORM)
  const [editForm, setEditForm] = useState<FormData>(BASE_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingItem, setEditingItem] = useState<K200Data | null>(null)

  // ===== DERIVED STATE =====
  const stats = useMemo(() => calculateStats(data), [data])

  // ===== API CALLS =====
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get<ApiResponse<K200ApiItem[]> | K200ApiItem[]>(API_ENDPOINTS.BASE, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000
      })

      let responseData: K200ApiItem[] = []

      if (response.data) {
        if (Array.isArray(response.data)) {
          responseData = response.data
        } else if (typeof response.data === 'object' && response.data !== null && 'data' in response.data) {
          responseData = response.data.data || []
        }
      }

      const processedData: K200Data[] = responseData.map((item: K200ApiItem) => ({
        id_s_k: parseInt(item.id_s_k?.toString() || item.id?.toString() || '0'),
        panjang: typeof item.panjang === 'string' ? parseFloat(item.panjang) : (item.panjang as number) || 0,
        lebar: typeof item.lebar === 'string' ? parseFloat(item.lebar) : (item.lebar as number) || 0,
        harga_per_lembar: typeof item.harga_per_lembar === 'string' 
          ? parseFloat(item.harga_per_lembar) 
          : (item.harga_per_lembar as number) || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))

      setData(processedData)
    } catch (err: unknown) {
      console.error('❌ Fetch error:', err)
      
      let errorMessage = 'Terjadi kesalahan saat memuat data'
      
      if (err instanceof AxiosError) {
        if (err.response?.status === 404 || err.response?.status === 204) {
          errorMessage = 'Data K200 tidak ditemukan'
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Koneksi timeout. Silakan coba lagi.'
        } else if (!err.response) {
          errorMessage = 'Tidak bisa connect ke server. Periksa koneksi internet.'
        } else {
          errorMessage = err.response?.data?.message || errorMessage
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchById = useCallback(async (id: number): Promise<K200Data | null> => {
    try {
      const response = await axios.get<ApiResponse<K200ApiItem>>(API_ENDPOINTS.BY_ID(id), {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000
      })

      const data = response.data?.data || response.data
      
      return data ? {
        id_s_k: parseInt(data.id_s_k?.toString() || data.id?.toString() || '0'),
        panjang: typeof data.panjang === 'string' ? parseFloat(data.panjang) : (data.panjang as number) || 0,
        lebar: typeof data.lebar === 'string' ? parseFloat(data.lebar) : (data.lebar as number) || 0,
        harga_per_lembar: typeof data.harga_per_lembar === 'string' 
          ? parseFloat(data.harga_per_lembar) 
          : (data.harga_per_lembar as number) || 0
      } : null
    } catch (err: unknown) {
      console.error('❌ Fetch by ID error:', err)
      return null
    }
  }, [])

  const addK200 = useCallback(async (formData: Omit<K200Data, 'id_s_k'>): Promise<ApiResponse<null>> => {
    const response = await axios.post<ApiResponse<null>>(API_ENDPOINTS.ADD, formData, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 15000
    })
    return response.data
  }, [])

  const updateK200 = useCallback(async (id: number, data: Partial<K200Data>): Promise<ApiResponse<null>> => {
    try {
      const response = await axios.put<ApiResponse<null>>(`${API_ENDPOINTS.EDIT}/${id}`, data, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 15000
      })
      return response.data
    } catch {
      const response = await axios.put<ApiResponse<null>>(API_ENDPOINTS.EDIT, { id_s_k: id, ...data }, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 15000
      })
      return response.data
    }
  }, [])

  const removeK200 = useCallback(async (id: number): Promise<ApiResponse<null>> => {
    const response = await axios.delete<ApiResponse<null>>(API_ENDPOINTS.DELETE(id), {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
    return response.data
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsPosting(true)
    try {
      await fetchData()
      await showSuccess('Data K200 berhasil diperbarui')
    } catch (err: unknown) {
      await showError('Gagal memperbarui data')
    } finally {
      setIsPosting(false)
    }
  }, [fetchData])

  const handleAdd = useCallback(async (): Promise<void> => {
    const validationErrors = validateForm(addForm, data)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsPosting(true)
    try {
      const payload = {
        panjang: parseFloat(addForm.panjang),
        lebar: parseFloat(addForm.lebar),
        harga_per_lembar: parseFloat(addForm.harga_per_lembar)
      }

      const response = await addK200(payload)
      
      if (response?.status === 200 || response?.success) {
        await showSuccess('Data K200 berhasil ditambahkan')
        setActiveModal(null)
        setAddForm(BASE_FORM)
        setErrors({})
        await fetchData()
      } else {
        throw new Error(response?.message || 'Gagal menambahkan data')
      }
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat menyimpan data'
      
      if (err instanceof AxiosError) {
        if (err.response?.status === 500 && 
            typeof err.response?.data === 'string' && 
            err.response.data.includes('Duplicate entry')) {
          errorMessage = 'Data dengan ukuran tersebut sudah ada'
        } else {
          errorMessage = err.response?.data?.message || err.message || errorMessage
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      await showError(errorMessage)
    } finally {
      setIsPosting(false)
    }
  }, [addForm, data, addK200, fetchData])

  const handleEditClick = useCallback(async (item: K200Data): Promise<void> => {
    setIsPosting(true)
    try {
      const freshData = await fetchById(item.id_s_k)
      const itemToEdit = freshData || item
      
      setEditingItem(itemToEdit)
      setEditForm({
        panjang: itemToEdit.panjang.toString(),
        lebar: itemToEdit.lebar.toString(),
        harga_per_lembar: itemToEdit.harga_per_lembar.toString()
      })
      setErrors({})
      setActiveModal('edit')
    } catch (err: unknown) {
      setEditingItem(item)
      setEditForm({
        panjang: item.panjang.toString(),
        lebar: item.lebar.toString(),
        harga_per_lembar: item.harga_per_lembar.toString()
      })
      setErrors({})
      setActiveModal('edit')
    } finally {
      setIsPosting(false)
    }
  }, [fetchById])

  const handleEditSave = useCallback(async (): Promise<void> => {
    if (!editingItem) return

    const validationErrors = validateForm(editForm, data, editingItem)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsPosting(true)
    try {
      const payload = {
        panjang: parseFloat(editForm.panjang),
        lebar: parseFloat(editForm.lebar),
        harga_per_lembar: parseFloat(editForm.harga_per_lembar)
      }

      const response = await updateK200(editingItem.id_s_k, payload)
      
      if (response?.status === 200 || response?.success) {
        await showSuccess('Data K200 berhasil diperbarui')
        setActiveModal(null)
        setEditingItem(null)
        setEditForm(BASE_FORM)
        setErrors({})
        await fetchData()
      } else {
        throw new Error(response?.message || 'Gagal memperbarui data')
      }
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat mengupdate data'
      
      if (err instanceof AxiosError) {
        if (err.response?.status === 500 && 
            typeof err.response?.data === 'string' && 
            err.response.data.includes('Duplicate entry')) {
          errorMessage = 'Data dengan ukuran tersebut sudah ada'
        } else {
          errorMessage = err.response?.data?.message || err.message || errorMessage
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      await showError(errorMessage)
    } finally {
      setIsPosting(false)
    }
  }, [editingItem, editForm, data, updateK200, fetchData])

  const handleDelete = useCallback(async (id: number, displayName: string): Promise<void> => {
    const result = await showConfirm(`Ukuran ${displayName} akan dihapus permanen!`)
    
    if (result.isConfirmed) {
      try {
        const response = await removeK200(id)
        
        const isSuccess = response?.status === 200 || response?.success === true
        
        if (isSuccess) {
          await showSuccess('Data berhasil dihapus')
          await fetchData()
        } else {
          throw new Error(response?.message || 'Gagal menghapus data')
        }
      } catch (err: unknown) {
        let errorMessage = 'Terjadi kesalahan saat menghapus data'
        
        if (err instanceof AxiosError) {
          errorMessage = err.response?.data?.message || err.message || errorMessage
        } else if (err instanceof Error) {
          errorMessage = err.message
        }
        
        await showError(errorMessage)
      }
    }
  }, [removeK200, fetchData])

  const handleCloseModal = useCallback((): void => {
    if (!isPosting) {
      setActiveModal(null)
      setAddForm(BASE_FORM)
      setEditForm(BASE_FORM)
      setEditingItem(null)
      setErrors({})
    }
  }, [isPosting])

  // ===== RENDER UTILS =====
  const getPreviewData = (form: FormData): { 
    panjang: number; 
    lebar: number; 
    harga: number; 
    luasM2: number; 
    hargaPerM2: number 
  } => {
    const panjang = parseFloat(form.panjang) || 0
    const lebar = parseFloat(form.lebar) || 0
    const harga = parseFloat(form.harga_per_lembar) || 0
    const luasM2 = (panjang * lebar) / 10000
    const hargaPerM2 = luasM2 > 0 ? harga / luasM2 : 0
    return { panjang, lebar, harga, luasM2, hargaPerM2 }
  }

  // ===== RENDER =====
  if (loading && data.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:ruler-square" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Data K200...</p>
          <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
        </div>
      </div>
    )
  }

  if (error && data.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-red-200 bg-red-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:alert-circle" className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <Button onClick={fetchData} variant="danger" className="mx-auto">
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:ruler-square" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              K200 Settings
            </h1>
            <p className="text-gray-600 mt-1">Kelola ukuran dan harga sheet K200 (panjang × lebar)</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-gray-600">
                <span className="font-medium">Total Records:</span> {stats.totalRecords}
              </span>
              <span className="text-gray-600">
                <span className="font-medium">Kombinasi:</span> {stats.totalCombinations}
              </span>
              <span className="text-gray-600">
                <span className="font-medium">Rata-rata:</span> {formatCurrency(stats.averagePrice)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="border-gray-300 hover:bg-gray-50"
            icon="mdi:refresh"
            disabled={loading || isPosting}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setActiveModal('add')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
            icon="mdi:plus"
            disabled={isPosting}
          >
            Tambah Ukuran
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:database" className="w-4 h-4 text-blue-600" />
              Total Records
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRecords}</p>
            <p className="text-xs text-gray-500">data tersimpan</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:ruler-square" className="w-4 h-4 text-green-600" />
              Kombinasi Ukuran
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCombinations}</p>
            <p className="text-xs text-gray-500">ukuran unik</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-purple-600" />
              Rata-rata Harga
            </p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.averagePrice)}</p>
            <p className="text-xs text-gray-500">per lembar</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:trending-up" className="w-4 h-4 text-amber-600" />
              Rentang Harga
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.minPrice)} - {formatCurrency(stats.maxPrice)}
            </p>
            <p className="text-xs text-gray-500">min - max</p>
          </div>
        </Card>
      </div>

      {/* ===== MAIN CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-blue-600" />
              Daftar Ukuran K200
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.totalRecords} records dengan {stats.totalCombinations} kombinasi ukuran unik
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              <Icon icon="mdi:sort-numeric-ascending" className="w-3 h-3 mr-1" />
              Urut berdasarkan ukuran
            </Badge>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memuat ulang data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Table / Empty State */}
        {data.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:ruler-square" className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data K200</h3>
            <p className="text-gray-500 mb-6">Silakan tambah data baru</p>
            <Button
              onClick={() => setActiveModal('add')}
              variant="primary"
              icon="mdi:plus"
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Tambah Ukuran Pertama
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ukuran (cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Panjang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Lebar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Harga per Lembar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => {
                    const luasM2 = (item.panjang * item.lebar) / 10000
                    const hargaPerM2 = luasM2 > 0 ? item.harga_per_lembar / luasM2 : 0
                    
                    return (
                      <tr key={item.id_s_k} className="hover:bg-blue-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">
                                {formatNumber(item.panjang)} × {formatNumber(item.lebar)} cm
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                Luas: {luasM2.toFixed(4)} m²
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                            {formatNumber(item.panjang)} cm
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-green-100 text-green-800 border border-green-200">
                            {formatNumber(item.lebar)} cm
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(item.harga_per_lembar)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(hargaPerM2)}/m²
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                              disabled={loading || isPosting}
                            >
                              <Icon icon="mdi:pencil" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_s_k, `${item.panjang}×${item.lebar} cm`)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                              disabled={loading || isPosting}
                            >
                              <Icon icon="mdi:delete" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="text-sm text-gray-600">
                Menampilkan {data.length} dari {stats.totalRecords} data
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Min:</span> {stats.minSize ? `${stats.minSize.panjang}×${stats.minSize.lebar} cm` : '-'}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Max:</span> {stats.maxSize ? `${stats.maxSize.panjang}×${stats.maxSize.lebar} cm` : '-'}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={activeModal === 'add'}
        onClose={handleCloseModal}
        title="➕ Tambah Ukuran K200"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal} disabled={isPosting}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAdd} 
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Informasi</h4>
                <p className="text-sm text-blue-700">
                  Isi semua field yang bertanda * untuk menambah data baru
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Panjang (cm) *"
              type="number"
              value={addForm.panjang}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAddForm({ ...addForm, panjang: e.target.value })
                setErrors({ ...errors, panjang: '', general: '' })
              }}
              placeholder="100"
              min={VALIDATION_RULES.PANJANG.min}
              max={VALIDATION_RULES.PANJANG.max}
              step="1"
              error={errors.panjang}
              disabled={isPosting}
              rightIcon={<span className="text-gray-500 text-sm">cm</span>}
              className={errors.panjang ? 'border-red-500' : ''}
            />
            <Input
              label="Lebar (cm) *"
              type="number"
              value={addForm.lebar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAddForm({ ...addForm, lebar: e.target.value })
                setErrors({ ...errors, lebar: '', general: '' })
              }}
              placeholder="80"
              min={VALIDATION_RULES.LEBAR.min}
              max={VALIDATION_RULES.LEBAR.max}
              step="1"
              error={errors.lebar}
              disabled={isPosting}
              rightIcon={<span className="text-gray-500 text-sm">cm</span>}
              className={errors.lebar ? 'border-red-500' : ''}
            />
          </div>

          <Input
            label="Harga per Lembar *"
            type="number"
            value={addForm.harga_per_lembar}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setAddForm({ ...addForm, harga_per_lembar: e.target.value })
              setErrors({ ...errors, harga_per_lembar: '', general: '' })
            }}
            placeholder="10000"
            min={VALIDATION_RULES.HARGA.min}
            max={VALIDATION_RULES.HARGA.max}
            step="100"
            error={errors.harga_per_lembar}
            disabled={isPosting}
            leftIcon={<span className="text-gray-500 text-sm">Rp</span>}
            helperText="Masukkan harga dalam rupiah"
            className={errors.harga_per_lembar ? 'border-red-500' : ''}
          />

          {addForm.panjang && addForm.lebar && addForm.harga_per_lembar && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                </div>
                Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Ukuran:</p>
                  <p className="font-medium text-gray-900">
                    {addForm.panjang} × {addForm.lebar} cm
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Luas:</p>
                  <p className="font-medium text-gray-900">
                    {getPreviewData(addForm).luasM2.toFixed(4)} m²
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Harga:</p>
                  <p className="font-medium text-gray-900">
                    {addForm.harga_per_lembar ? formatCurrency(parseFloat(addForm.harga_per_lembar)) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Harga/m²:</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(getPreviewData(addForm).hargaPerM2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={activeModal === 'edit'}
        onClose={handleCloseModal}
        title="✏️ Edit Ukuran K200"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal} disabled={isPosting}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSave} 
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Current Data Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Data Saat Ini</h4>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-blue-700 mb-1">Ukuran:</p>
                      <p className="font-medium text-blue-900">
                        {editingItem.panjang} × {editingItem.lebar} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Harga:</p>
                      <p className="font-medium text-blue-900">
                        {formatCurrency(editingItem.harga_per_lembar)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">ID:</p>
                      <p className="font-mono text-blue-900 text-xs">
                        #{editingItem.id_s_k}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Panjang (cm) *"
                type="number"
                value={editForm.panjang}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEditForm({ ...editForm, panjang: e.target.value })
                  setErrors({ ...errors, panjang: '', general: '' })
                }}
                placeholder="100"
                min={VALIDATION_RULES.PANJANG.min}
                max={VALIDATION_RULES.PANJANG.max}
                step="1"
                error={errors.panjang}
                disabled={isPosting}
                rightIcon={<span className="text-gray-500 text-sm">cm</span>}
                className={errors.panjang ? 'border-red-500' : ''}
              />
              <Input
                label="Lebar (cm) *"
                type="number"
                value={editForm.lebar}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEditForm({ ...editForm, lebar: e.target.value })
                  setErrors({ ...errors, lebar: '', general: '' })
                }}
                placeholder="80"
                min={VALIDATION_RULES.LEBAR.min}
                max={VALIDATION_RULES.LEBAR.max}
                step="1"
                error={errors.lebar}
                disabled={isPosting}
                rightIcon={<span className="text-gray-500 text-sm">cm</span>}
                className={errors.lebar ? 'border-red-500' : ''}
              />
            </div>

            <Input
              label="Harga per Lembar *"
              type="number"
              value={editForm.harga_per_lembar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEditForm({ ...editForm, harga_per_lembar: e.target.value })
                setErrors({ ...errors, harga_per_lembar: '', general: '' })
              }}
              placeholder="10000"
              min={VALIDATION_RULES.HARGA.min}
              max={VALIDATION_RULES.HARGA.max}
              step="100"
              error={errors.harga_per_lembar}
              disabled={isPosting}
              leftIcon={<span className="text-gray-500 text-sm">Rp</span>}
              helperText="Masukkan harga dalam rupiah"
              className={errors.harga_per_lembar ? 'border-red-500' : ''}
            />

            {editForm.panjang && editForm.lebar && editForm.harga_per_lembar && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                  </div>
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Ukuran Baru:</p>
                    <p className="font-medium text-gray-900">
                      {editForm.panjang} × {editForm.lebar} cm
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Luas:</p>
                    <p className="font-medium text-gray-900">
                      {getPreviewData(editForm).luasM2.toFixed(4)} m²
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Harga Baru:</p>
                    <p className="font-medium text-gray-900">
                      {editForm.harga_per_lembar ? formatCurrency(parseFloat(editForm.harga_per_lembar)) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Harga/m²:</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(getPreviewData(editForm).hargaPerM2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}