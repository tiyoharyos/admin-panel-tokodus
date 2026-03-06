'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import Input from '@/components/UI/Input'
import axios from '@/lib/axios'
import { AxiosError } from 'axios'
import SweetAlert from '@/components/UI/SweetAlert'

// ============================================================
// TYPES
// ============================================================

interface Flute {
  id: string
  code: string
  name: string
}

interface SinglefaceSubstance {
  id: string
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  substance_code: string
  [key: string]: any
}

interface ApiRawItem {
  id: string
  substance_id: string
  flute_id: string
  price_per_m2: string
  layer_1_gsm: string
  layer_1_type: string
  layer_2_gsm: string
  layer_2_type: string
  id_f: string
  code: string
  name: string
}

interface ApiResponse<T = any> {
  status: number
  message?: string
  data?: T
}

interface FormData {
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  flutes: string[]
  price_per_m2: { [fluteCode: string]: string }
}

interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

interface Stats {
  totalSubstances: number
  activeSubstances: number
  totalIndices: number
}

// ============================================================
// CONSTANTS & UTILS
// ============================================================

const API_BASE = '/Admin/Singelface'

const LAYER_TYPES = [
  { value: 'K', label: 'K - Kraft' },
  { value: 'M', label: 'M - Medium' },
  { value: 'W', label: 'W - White' },
  { value: 'B', label: 'B - Bogus' },
  { value: 'T', label: 'T - Test' },
]

const FLUTE_META: Record<string, { icon: string; accent: string }> = {
  A: { icon: 'mdi:waveform', accent: '#ef4444' },
  B: { icon: 'mdi:waveform', accent: '#3b82f6' },
  C: { icon: 'mdi:waveform', accent: '#10b981' },
  E: { icon: 'mdi:waveform', accent: '#8b5cf6' },
  F: { icon: 'mdi:waveform', accent: '#f59e0b' },
}
const DEFAULT_FLUTE_META = { icon: 'mdi:waveform', accent: '#64748b' }

const LAYER_META: Record<string, { icon: string; accent: string }> = {
  K: { icon: 'mdi:paper', accent: '#b45309' },
  M: { icon: 'mdi:paper', accent: '#0284c7' },
  W: { icon: 'mdi:paper', accent: '#6b7280' },
  B: { icon: 'mdi:paper', accent: '#475569' },
  T: { icon: 'mdi:paper', accent: '#115e59' },
}
const DEFAULT_LAYER_META = { icon: 'mdi:paper', accent: '#64748b' }

const formatCurrency = (val: number | string) => {
  const num = parseFloat(val as string) || 0
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

const getLayerMeta = (type: string) => LAYER_META[type] || DEFAULT_LAYER_META
const getFluteMeta = (code: string) => FLUTE_META[code] || DEFAULT_FLUTE_META

const formatSubstanceDisplay = (substance: Pick<FormData, 'layer_1' | 'layer_1_type' | 'layer_2' | 'layer_2_type'> | SinglefaceSubstance) =>
  `${substance.layer_1}${substance.layer_1_type} / ${substance.layer_2}${substance.layer_2_type}`

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') return 'Koneksi timeout. Silakan coba lagi.'
    if (!error.response) return 'Tidak bisa connect ke server. Periksa koneksi internet.'
    if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      return (error.response.data as { message: string }).message
    }
    return 'Terjadi kesalahan saat memuat data'
  }
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan yang tidak diketahui'
}

// ============================================================
// SERVICE
// ============================================================

const parseFlatApiResponse = (rawItems: ApiRawItem[]) => {
  const fluteMap: Map<string, Flute> = new Map()
  rawItems.forEach(item => {
    if (!fluteMap.has(item.id_f)) {
      fluteMap.set(item.id_f, {
        id: item.id_f,
        code: item.code,
        name: item.name,
      })
    }
  })
  const flutes = Array.from(fluteMap.values())

  const substanceMap: Map<string, SinglefaceSubstance> = new Map()
  rawItems.forEach(item => {
    if (!substanceMap.has(item.substance_id)) {
      substanceMap.set(item.substance_id, {
        id: item.substance_id,
        layer_1: item.layer_1_gsm || '',
        layer_1_type: item.layer_1_type || 'K',
        layer_2: item.layer_2_gsm || '',
        layer_2_type: item.layer_2_type || 'M',
        substance_code: `${item.layer_1_gsm}${item.layer_1_type}/${item.layer_2_gsm}${item.layer_2_type}`,
      })
    }
    const priceField = `${item.code.toLowerCase()}_flute_price`
    const substance = substanceMap.get(item.substance_id)!
    substance[priceField] = parseFloat(item.price_per_m2) || 0
  })

  const substances = Array.from(substanceMap.values())
  return { flutes, substances }
}

const fetchAllData = async (): Promise<{ flutes: Flute[]; substances: SinglefaceSubstance[] }> => {
  const response = await axios.get<ApiResponse<ApiRawItem[]>>(`${API_BASE}/singelfaceIndex`)
  const rawItems: ApiRawItem[] = response.data?.data || (Array.isArray(response.data) ? response.data : [])
  if (!Array.isArray(rawItems)) throw new Error('Invalid response format')
  return parseFlatApiResponse(rawItems)
}

const fetchFlutesOnly = async (): Promise<Flute[]> => {
  try {
    const response = await axios.get<ApiResponse>(`${API_BASE}/singelfaceFlutes`)
    const data = response.data?.data || response.data || []
    return (Array.isArray(data) ? data : []).map((f: any) => ({
      id: f.id_f?.toString() || f.id?.toString() || '',
      code: f.code || '',
      name: f.name || '',
    }))
  } catch {
    return []
  }
}

const apiAdd = async (data: any): Promise<ApiResponse> => {
  const res = await axios.post<ApiResponse>(`${API_BASE}/singelfaceIndexAdd`, data, {
    headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }
  })
  return res.data
}

const apiUpdate = async (data: any): Promise<ApiResponse> => {
  const res = await axios.put<ApiResponse>(`${API_BASE}/singelfaceIndexUpdate`, data, {
    headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }
  })
  return res.data
}

const apiDelete = async (id: string): Promise<ApiResponse> => {
  const res = await axios.delete<ApiResponse>(`${API_BASE}/singelfaceIndexDelete/${id}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  })
  return res.data
}

// ============================================================
// BADGE COMPONENT
// ============================================================

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: `${color}18`, color }}
    >
      {children}
    </span>
  )
}

// ============================================================
// HOOK
// ============================================================

const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_type: 'K',
  layer_2: '',
  layer_2_type: 'M',
  flutes: [],
  price_per_m2: {},
}

const useSingleface = () => {
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

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { flutes: f, substances: s } = await fetchAllData()
      setFlutes(f)
      setSubstances(s)
    } catch (err: any) {
      try {
        const f = await fetchFlutesOnly()
        setFlutes(f)
      } catch {}
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  useEffect(() => {
    const total = substances.length
    const totalPages = Math.max(1, Math.ceil(total / pagination.itemsPerPage))
    setPagination(prev => ({
      ...prev,
      totalItems: total,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }))
  }, [substances.length, pagination.itemsPerPage])

  const stats = useMemo<Stats>(() => ({
    totalSubstances: substances.length,
    activeSubstances: substances.filter(s => s.layer_1 && s.layer_2).length,
    totalIndices: substances.length * flutes.length,
  }), [substances, flutes])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return substances.slice(start, start + pagination.itemsPerPage)
  }, [substances, pagination.currentPage, pagination.itemsPerPage])

  const addItem = async (data: any): Promise<ApiResponse> => {
    const res = await apiAdd(data)
    return res
  }

  const updateItem = async (data: any): Promise<ApiResponse> => {
    const res = await apiUpdate(data)
    return res
  }

  const deleteItem = async (id: string): Promise<ApiResponse> => {
    const res = await apiDelete(id)
    if (res?.status === 200) {
      setSubstances(prev => prev.filter(s => s.id !== id))
    }
    return res
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: value,
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(substances.length / value)),
    }))
  }

  return {
    substances,
    flutes,
    loading,
    error,
    stats,
    pagination,
    paginatedData,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    handlePageChange,
    handleItemsPerPageChange,
  }
}

// ============================================================
// FORMULA LEGEND COMPONENT
// ============================================================

function LayerLegend() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-50 rounded-lg border border-gray-200">
      {LAYER_TYPES.map(({ value, label }) => {
        const meta = getLayerMeta(value)
        return (
          <div key={value} className="flex items-center gap-1.5">
            <span 
              className="font-mono bg-white px-2 py-0.5 rounded text-xs font-bold border"
              style={{ color: meta.accent, borderColor: `${meta.accent}40` }}
            >
              {value}
            </span>
            <span className="text-xs text-gray-500 truncate">{label.split(' - ')[0]}</span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SinglefaceSettingsPage() {
  const {
    substances,
    flutes,
    loading,
    error,
    stats,
    pagination,
    paginatedData,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    handlePageChange,
    handleItemsPerPageChange,
  } = useSingleface()

  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SinglefaceSubstance | null>(null)
  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const maxFluteCount = flutes.length

  // Filter substances based on search
  const filteredSubstances = useMemo(() => {
    if (!search.trim()) return paginatedData
    return paginatedData.filter(s => 
      s.substance_code.toLowerCase().includes(search.toLowerCase()) ||
      `${s.layer_1}${s.layer_1_type}/${s.layer_2}${s.layer_2_type}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [paginatedData, search])

  // ===== VALIDATION =====
  const validateForm = (form: FormData): boolean => {
    if (!form.layer_1?.toString().trim()) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 1 tidak boleh kosong')
      return false
    }
    if (isNaN(parseFloat(form.layer_1)) || parseFloat(form.layer_1) <= 0) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 1 harus angka lebih dari 0')
      return false
    }

    if (!form.layer_2?.toString().trim()) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 2 tidak boleh kosong')
      return false
    }
    if (isNaN(parseFloat(form.layer_2)) || parseFloat(form.layer_2) <= 0) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 2 harus angka lebih dari 0')
      return false
    }

    if (form.flutes.length === 0) {
      SweetAlert.error('Validasi Error', 'Pilih minimal satu flute type')
      return false
    }

    for (const code of form.flutes) {
      const price = form.price_per_m2?.[code]
      if (!price?.toString().trim()) {
        SweetAlert.error('Validasi Error', `Harga ${code}-Flute wajib diisi`)
        return false
      }
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        SweetAlert.error('Validasi Error', `Harga ${code}-Flute harus angka lebih dari 0`)
        return false
      }
    }

    return true
  }

  // ===== ADD HANDLERS =====
  const handleAddInputChange = (field: string, value: any) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleAddFluteToggle = (code: string) => {
    setAddFormData(prev => {
      const selected = prev.flutes.includes(code)
      const newFlutes = selected ? prev.flutes.filter(c => c !== code) : [...prev.flutes, code]
      const newPrices = { ...prev.price_per_m2 }
      if (selected) delete newPrices[code]
      else newPrices[code] = ''
      return { ...prev, flutes: newFlutes, price_per_m2: newPrices }
    })
  }

  const handleAddSave = async () => {
    if (!validateForm(addFormData)) return

    const newSubstanceCode = `${addFormData.layer_1}${addFormData.layer_1_type}/${addFormData.layer_2}${addFormData.layer_2_type}`
    const isDuplicate = substances.some(s => s.substance_code === newSubstanceCode)
    
    if (isDuplicate) {
      SweetAlert.error('Duplikat!', `Kombinasi "${newSubstanceCode}" sudah ada. Gunakan kombinasi lain.`)
      return
    }

    setIsPosting(true)
    try {
      const fluteIds = addFormData.flutes.map(code => {
        const f = flutes.find(fl => fl.code === code)
        return f ? parseInt(f.id) : 0
      }).filter(id => id > 0)

      const priceArray = addFormData.flutes.map(code =>
        parseFloat(addFormData.price_per_m2[code] || '0')
      )

      const postData = {
        layer_1: parseFloat(addFormData.layer_1.trim()),
        layer_1_type: addFormData.layer_1_type,
        layer_2: parseFloat(addFormData.layer_2.trim()),
        layer_2_type: addFormData.layer_2_type,
        flutes: fluteIds,
        price_per_m2: priceArray,
      }

      const res = await addItem(postData)
      if (res?.status === 200) {
        SweetAlert.success('Berhasil!', 'Data berhasil ditambahkan')
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
        setFormErrors({})
        setTimeout(() => refetch(), 1000)
      } else {
        SweetAlert.error('Gagal!', res?.message || 'Gagal menambahkan data')
      }
    } catch (err: any) {
      SweetAlert.error('Error!', getErrorMessage(err))
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLERS =====
  const handleEditClick = (item: SinglefaceSubstance) => {
    const existingFlutes: string[] = []
    const existingPrices: Record<string, string> = {}
    flutes.forEach(f => {
      const priceField = `${f.code.toLowerCase()}_flute_price`
      const price = item[priceField]
      if (price !== undefined && price !== null && parseFloat(price) > 0) {
        existingFlutes.push(f.code)
        existingPrices[f.code] = price.toString()
      }
    })
    setEditingItem(item)
    setEditFormData({
      layer_1: item.layer_1 || '',
      layer_1_type: item.layer_1_type || 'K',
      layer_2: item.layer_2 || '',
      layer_2_type: item.layer_2_type || 'M',
      flutes: existingFlutes,
      price_per_m2: existingPrices,
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleEditFluteToggle = (code: string) => {
    setEditFormData(prev => {
      const selected = prev.flutes.includes(code)
      const newFlutes = selected ? prev.flutes.filter(c => c !== code) : [...prev.flutes, code]
      const newPrices = { ...prev.price_per_m2 }
      if (selected) delete newPrices[code]
      else if (!newPrices[code]) newPrices[code] = ''
      return { ...prev, flutes: newFlutes, price_per_m2: newPrices }
    })
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    if (!validateForm(editFormData)) return

    const newSubstanceCode = `${editFormData.layer_1}${editFormData.layer_1_type}/${editFormData.layer_2}${editFormData.layer_2_type}`
    const isDuplicate = substances.some(
      s => s.id !== editingItem.id && s.substance_code === newSubstanceCode
    )
    
    if (isDuplicate) {
      SweetAlert.error('Duplikat!', `Kombinasi "${newSubstanceCode}" sudah digunakan oleh data lain.`)
      return
    }

    setIsPosting(true)
    try {
      const fluteIds = editFormData.flutes.map(code => {
        const f = flutes.find(fl => fl.code === code)
        return f ? parseInt(f.id) : 0
      }).filter(id => id > 0)

      const priceArray = editFormData.flutes.map(code =>
        parseFloat(editFormData.price_per_m2[code] || '0')
      )

      const putData = {
        substance_id: parseInt(editingItem.id),
        layer_1: parseFloat(editFormData.layer_1.trim()),
        layer_1_type: editFormData.layer_1_type,
        layer_2: parseFloat(editFormData.layer_2.trim()),
        layer_2_type: editFormData.layer_2_type,
        flutes: fluteIds,
        price_per_m2: priceArray,
      }

      const res = await updateItem(putData)
      if (res?.status === 200) {
        SweetAlert.success('Berhasil!', 'Data berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
        setFormErrors({})
        setTimeout(() => refetch(), 1000)
      } else {
        SweetAlert.error('Gagal!', res?.message || 'Gagal memperbarui data')
      }
    } catch (err: any) {
      SweetAlert.error('Error!', getErrorMessage(err))
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    const result = await SweetAlert.confirmDelete(`Hapus kombinasi ${code}?`)
    if (!result.isConfirmed) return
    
    try {
      const res = await deleteItem(id)
      if (res?.status === 200) {
        SweetAlert.success('Berhasil!', 'Data berhasil dihapus')
      } else {
        SweetAlert.error('Gagal!', res?.message || 'Gagal menghapus data')
      }
    } catch (err: any) {
      SweetAlert.error('Error!', getErrorMessage(err))
    }
  }

  const handleCloseAddModal = () => {
    if (isPosting) return
    setShowAddModal(false)
    setAddFormData({ ...BASE_FORM })
    setFormErrors({})
  }

  const handleCloseEditModal = () => {
    if (isPosting) return
    setShowEditModal(false)
    setEditingItem(null)
    setEditFormData({ ...BASE_FORM })
    setFormErrors({})
  }

  // ===== PAGINATION =====
  const renderPaginationPages = () => {
    const { currentPage, totalPages } = pagination
    const pages: React.ReactNode[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)

    if (start > 1) {
      pages.push(<button key={1} onClick={() => handlePageChange(1)} className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600">1</button>)
      if (start > 2) pages.push(<span key="d1" className="px-2 text-gray-400">...</span>)
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <button key={i} onClick={() => handlePageChange(i)}
          className={`px-3 py-1 text-sm rounded transition-colors ${i === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>
          {i}
        </button>
      )
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="d2" className="px-2 text-gray-400">...</span>)
      pages.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600">{totalPages}</button>)
    }
    return pages
  }

  // ===== RENDER =====
  if (loading && substances.length === 0 && !error) {
    return <LoadingState message="Memuat Data Singleface..." submessage="Harap tunggu sebentar" icon="mdi:layers" />
  }

  if (error && substances.length === 0) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:layers" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Singleface Settings</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola harga bahan singleface berdasarkan flute type</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="md"
          icon="mdi:plus"
          disabled={flutes.length === 0}
        >
          Tambah Singleface
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: 'mdi:layers',
            label: 'Total Substances',
            value: stats.totalSubstances,
            sub: 'kombinasi bahan',
          },
          {
            icon: 'mdi:check-circle',
            label: 'Active',
            value: stats.activeSubstances,
            sub: 'dengan layer valid',
            bar: (stats.activeSubstances / stats.totalSubstances) * 100 || 0,
          },
          {
            icon: 'mdi:database',
            label: 'Total Indices',
            value: stats.totalIndices,
            sub: 'record di database',
            bar: stats.totalIndices > 0 ? (stats.activeSubstances / stats.totalSubstances) * 100 : 0,
          },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{s.value}</p>
            {s.bar !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== ERROR BANNER ===== */}
      {error && substances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Icon icon="mdi:alert" className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={refetch} icon="mdi:refresh" className="ml-auto">
            Refresh
          </Button>
        </div>
      )}

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Singleface Substances</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalSubstances} kombinasi · {flutes.length} flute types
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari substance..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Select
              value={pagination.itemsPerPage.toString()}
              onChange={(e: any) => handleItemsPerPageChange(parseInt(e.target.value))}
              options={[
                { value: '5', label: '5' },
                { value: '10', label: '10' },
                { value: '20', label: '20' },
                { value: '50', label: '50' },
              ]}
              className="w-20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {substances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data singleface</p>
              <Button 
                onClick={() => setShowAddModal(true)} 
                variant="primary" 
                icon="mdi:plus"
                disabled={flutes.length === 0}
              >
                {flutes.length === 0 ? 'Tambah Flute Dulu' : 'Tambah Data Pertama'}
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Substance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Layer 1</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Layer 2</th>
                  {flutes.map((flute) => {
                    const meta = getFluteMeta(flute.code)
                    return (
                      <th key={flute.id} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Icon icon={meta.icon} className="w-3 h-3" style={{ color: meta.accent }} />
                          <span>{flute.code}-Flute</span>
                        </div>
                      </th>
                    )
                  })}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredSubstances.length === 0 ? (
                  <tr>
                    <td colSpan={4 + flutes.length + 1} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                        <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                          Hapus Pencarian
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubstances.map((substance, idx) => {
                    const rowNum = (pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1
                    const layer1Meta = getLayerMeta(substance.layer_1_type)
                    const layer2Meta = getLayerMeta(substance.layer_2_type)
                    
                    return (
                      <tr key={substance.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-500">{rowNum}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon icon="mdi:layers" className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{formatSubstanceDisplay(substance)}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{substance.substance_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge color={layer1Meta.accent}>
                            {substance.layer_1}{substance.layer_1_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge color={layer2Meta.accent}>
                            {substance.layer_2}{substance.layer_2_type}
                          </Badge>
                        </td>
                        {flutes.map((flute, fIdx) => {
                          const priceField = `${flute.code.toLowerCase()}_flute_price`
                          const price = substance[priceField]
                          const hasPrice = price !== undefined && price !== null && parseFloat(price) > 0
                          const meta = getFluteMeta(flute.code)
                          
                          return (
                            <td key={flute.id} className="px-6 py-4">
                              {hasPrice ? (
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: meta.accent }}>
                                    {formatCurrency(price)}
                                  </p>
                                  <p className="text-xs text-gray-400">/m²</p>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditClick(substance)}
                              title="Edit"
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(substance.id, substance.substance_code)}
                              title="Hapus"
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:delete-outline" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {filteredSubstances.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}–
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari{' '}
              <span className="font-medium text-slate-700">{pagination.totalItems}</span> substance
            </p>
            <div className="flex items-center gap-1">
              <Button onClick={() => handlePageChange(1)} disabled={pagination.currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500">
                <Icon icon="mdi:skip-backward" className="w-4 h-4" />
              </Button>
              <Button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500">
                <Icon icon="mdi:chevron-left" className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-0.5">{renderPaginationPages()}</div>
              <Button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500">
                <Icon icon="mdi:chevron-right" className="w-4 h-4" />
              </Button>
              <Button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.currentPage === pagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500">
                <Icon icon="mdi:skip-forward" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Singleface Substance"
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseAddModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" size="md" onClick={handleAddSave} loading={isPosting} disabled={isPosting || flutes.length === 0} icon="mdi:check">
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Info banner */}
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Isi semua field yang bertanda <span className="text-red-500">*</span> untuk menambah data baru.
            </p>
          </div>

          {/* Layer Configuration */}
          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Konfigurasi Layer</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([1, 2] as const).map(num => {
                const meta = getLayerMeta(addFormData[`layer_${num}_type` as 'layer_1_type' | 'layer_2_type'])
                return (
                  <div key={num} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${meta.accent}20` }}>
                        <Icon icon={meta.icon} className="w-3 h-3" style={{ color: meta.accent }} />
                      </div>
                      <h5 className="font-medium text-gray-900">Layer {num}</h5>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Gramasi (gsm) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={addFormData[`layer_${num}`]}
                        onChange={(e) => handleAddInputChange(`layer_${num}`, e.target.value)}
                        placeholder="125"
                        min="1"
                        step="1"
                        disabled={isPosting}
                        className={formErrors[`layer_${num}`] ? 'border-red-500' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Jenis Kertas <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={addFormData[`layer_${num}_type`]}
                        onChange={(e) => handleAddInputChange(`layer_${num}_type`, e.target.value)}
                        options={LAYER_TYPES.map(t => ({ value: t.value, label: t.label }))}
                        disabled={isPosting}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Layer Legend */}
          <LayerLegend />

          {/* Flute Selection */}
          <div className="bg-white border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Pilih Flute Types & Harga</h4>
            
            {flutes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-yellow-800 text-sm">Tidak ada flute tersedia. Tambahkan flute terlebih dahulu.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {flutes.map(flute => {
                    const isSelected = addFormData.flutes.includes(flute.code)
                    const meta = getFluteMeta(flute.code)
                    return (
                      <button
                        key={flute.code}
                        type="button"
                        onClick={() => handleAddFluteToggle(flute.code)}
                        disabled={isPosting}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={isSelected ? {} : { borderColor: `${meta.accent}40` }}
                      >
                        <Icon icon={meta.icon} className="w-4 h-4" style={{ color: isSelected ? 'white' : meta.accent }} />
                        <span>{flute.code}</span>
                        {isSelected && <Icon icon="mdi:check" className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>

                {addFormData.flutes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addFormData.flutes.map(code => {
                      const flute = flutes.find(f => f.code === code)
                      if (!flute) return null
                      const meta = getFluteMeta(code)
                      return (
                        <div key={code} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${meta.accent}20` }}>
                                <Icon icon={meta.icon} className="w-3 h-3" style={{ color: meta.accent }} />
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{flute.name}</span>
                            </div>
                            <span className="text-xs text-red-500 font-medium">Wajib Diisi</span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Harga per m² <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 text-sm">Rp</span>
                              </div>
                              <Input
                                type="number"
                                value={addFormData.price_per_m2[code] || ''}
                                onChange={(e) => {
                                  setAddFormData(prev => ({ 
                                    ...prev, 
                                    price_per_m2: { ...prev.price_per_m2, [code]: e.target.value } 
                                  }))
                                  setFormErrors(prev => ({ ...prev, [`price_${code}`]: '' }))
                                }}
                                placeholder="0"
                                min="1"
                                disabled={isPosting}
                                className="pl-9"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Preview */}
          {addFormData.layer_1 && addFormData.layer_2 && addFormData.flutes.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-600" />
                Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Substance:</p>
                  <p className="font-medium text-gray-900">{formatSubstanceDisplay(addFormData)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Kode:</p>
                  <p className="font-mono text-gray-900">{addFormData.layer_1}{addFormData.layer_1_type}/{addFormData.layer_2}{addFormData.layer_2_type}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Flute Dipilih:</p>
                  <p className="font-medium text-gray-900">{addFormData.flutes.length} dari {flutes.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Flutes:</p>
                  <div className="flex flex-wrap gap-1">
                    {addFormData.flutes.map(code => {
                      const meta = getFluteMeta(code)
                      return (
                        <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${meta.accent}18`, color: meta.accent }}>
                          <Icon icon={meta.icon} className="w-3 h-3" />
                          {code}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={`Edit Singleface — ${editingItem ? formatSubstanceDisplay(editingItem) : ''}`}
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseEditModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" size="md" onClick={handleEditSave} loading={isPosting} disabled={isPosting || flutes.length === 0} icon="mdi:check">
              Update
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Current data info */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Mengedit Substance</p>
                <p className="text-xs text-blue-600 mt-1">
                  ID: <span className="font-mono">#{editingItem.id}</span> · Kode: {editingItem.substance_code}
                </p>
              </div>
            </div>

            {/* Layer Configuration */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Konfigurasi Layer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([1, 2] as const).map(num => {
                  const meta = getLayerMeta(editFormData[`layer_${num}_type` as 'layer_1_type' | 'layer_2_type'])
                  return (
                    <div key={num} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${meta.accent}20` }}>
                          <Icon icon={meta.icon} className="w-3 h-3" style={{ color: meta.accent }} />
                        </div>
                        <h5 className="font-medium text-gray-900">Layer {num}</h5>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Gramasi (gsm) <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          value={editFormData[`layer_${num}`]}
                          onChange={(e) => handleEditInputChange(`layer_${num}`, e.target.value)}
                          placeholder="125"
                          min="1"
                          step="1"
                          disabled={isPosting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Jenis Kertas <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={editFormData[`layer_${num}_type`]}
                          onChange={(e) => handleEditInputChange(`layer_${num}_type`, e.target.value)}
                          options={LAYER_TYPES.map(t => ({ value: t.value, label: t.label }))}
                          disabled={isPosting}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Layer Legend */}
            <LayerLegend />

            {/* Flute Selection */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Pilih Flute Types & Harga</h4>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {flutes.map(flute => {
                  const isSelected = editFormData.flutes.includes(flute.code)
                  const meta = getFluteMeta(flute.code)
                  return (
                    <button
                      key={flute.code}
                      type="button"
                      onClick={() => handleEditFluteToggle(flute.code)}
                      disabled={isPosting}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={isSelected ? {} : { borderColor: `${meta.accent}40` }}
                    >
                      <Icon icon={meta.icon} className="w-4 h-4" style={{ color: isSelected ? 'white' : meta.accent }} />
                      <span>{flute.code}</span>
                      {isSelected && <Icon icon="mdi:check" className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>

              {editFormData.flutes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {editFormData.flutes.map(code => {
                    const flute = flutes.find(f => f.code === code)
                    if (!flute) return null
                    const meta = getFluteMeta(code)
                    return (
                      <div key={code} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${meta.accent}20` }}>
                              <Icon icon={meta.icon} className="w-3 h-3" style={{ color: meta.accent }} />
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{flute.name}</span>
                          </div>
                          <span className="text-xs text-red-500 font-medium">Wajib Diisi</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Harga per m² <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-400 text-sm">Rp</span>
                            </div>
                            <Input
                              type="number"
                              value={editFormData.price_per_m2[code] || ''}
                              onChange={(e) => {
                                setEditFormData(prev => ({ 
                                  ...prev, 
                                  price_per_m2: { ...prev.price_per_m2, [code]: e.target.value } 
                                }))
                                setFormErrors(prev => ({ ...prev, [`price_${code}`]: '' }))
                              }}
                              placeholder="0"
                              min="1"
                              disabled={isPosting}
                              className="pl-9"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Preview */}
            {editFormData.layer_1 && editFormData.layer_2 && editFormData.flutes.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-600" />
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Substance:</p>
                    <p className="font-medium text-gray-900">{formatSubstanceDisplay(editFormData)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Kode:</p>
                    <p className="font-mono text-gray-900">{editFormData.layer_1}{editFormData.layer_1_type}/{editFormData.layer_2}{editFormData.layer_2_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Flute Dipilih:</p>
                    <p className="font-medium text-gray-900">{editFormData.flutes.length} dari {flutes.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Flutes:</p>
                    <div className="flex flex-wrap gap-1">
                      {editFormData.flutes.map(code => {
                        const meta = getFluteMeta(code)
                        return (
                          <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${meta.accent}18`, color: meta.accent }}>
                            <Icon icon={meta.icon} className="w-3 h-3" />
                            {code}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}