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
  id: string    // from id_f
  code: string  // e.g. "B", "E"
  name: string  // e.g. "B-Flute"
}

interface SinglefaceSubstance {
  id: string              // substance_id
  layer_1: string         // layer_1_gsm
  layer_1_type: string
  layer_2: string         // layer_2_gsm
  layer_2_type: string
  substance_code: string  // computed: "125M/125M"
  [key: string]: any      // dynamic flute price fields: b_flute_price, e_flute_price, etc.
}

/** Raw item from API flat list */
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

const FLUTE_BADGE_COLORS: Record<string, string> = {
  A: 'bg-red-100 text-red-700 border border-red-200',
  B: 'bg-blue-100 text-blue-700 border border-blue-200',
  C: 'bg-green-100 text-green-700 border border-green-200',
  E: 'bg-purple-100 text-purple-700 border border-purple-200',
  F: 'bg-orange-100 text-orange-700 border border-orange-200',
}

const FLUTE_TEXT_COLORS = [
  'text-blue-600',
  'text-purple-600',
  'text-green-600',
  'text-orange-600',
  'text-red-600',
]

const LAYER_BADGE_COLORS: Record<string, string> = {
  K: 'bg-amber-100 text-amber-800 border border-amber-200',
  M: 'bg-sky-100 text-sky-800 border border-sky-200',
  W: 'bg-gray-100 text-gray-800 border border-gray-200',
  B: 'bg-slate-100 text-slate-800 border border-slate-200',
  T: 'bg-teal-100 text-teal-800 border border-teal-200',
}

const formatCurrency = (val: number | string) => {
  const num = parseFloat(val as string) || 0
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

const getLayerBadgeClass = (type: string) =>
  LAYER_BADGE_COLORS[type] || 'bg-gray-100 text-gray-800'

const getFluteBadgeClass = (code: string) =>
  FLUTE_BADGE_COLORS[code] || 'bg-indigo-100 text-indigo-700 border border-indigo-200'

const getFluteTextColor = (idx: number) =>
  FLUTE_TEXT_COLORS[idx % FLUTE_TEXT_COLORS.length]

const formatSubstanceDisplay = (substance: Pick<FormData, 'layer_1' | 'layer_1_type' | 'layer_2' | 'layer_2_type'> | SinglefaceSubstance) =>
  `${substance.layer_1}${substance.layer_1_type} / ${substance.layer_2}${substance.layer_2_type}`

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return 'Koneksi timeout. Silakan coba lagi.'
    }
    if (!error.response) {
      return 'Tidak bisa connect ke server. Periksa koneksi internet.'
    }
    if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      return (error.response.data as { message: string }).message
    }
    return 'Terjadi kesalahan saat memuat data'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Terjadi kesalahan yang tidak diketahui'
}

// ============================================================
// SERVICE
// ============================================================

/** Parse flat API list → deduplicated substances + flute list */
const parseFlatApiResponse = (rawItems: ApiRawItem[]) => {
  // Collect unique flutes
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

  // Group by substance_id
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
    // Set dynamic flute price field: e.g. b_flute_price
    const priceField = `${item.code.toLowerCase()}_flute_price`
    const substance = substanceMap.get(item.substance_id)!
    substance[priceField] = parseFloat(item.price_per_m2) || 0
  })

  const substances = Array.from(substanceMap.values())
  return { flutes, substances }
}

const fetchAllData = async (): Promise<{ flutes: Flute[]; substances: SinglefaceSubstance[] }> => {
  const response = await axios.get<ApiResponse<ApiRawItem[]>>(`${API_BASE}/singelfaceIndex`, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  })
  const rawItems: ApiRawItem[] = response.data?.data || (Array.isArray(response.data) ? response.data : [])
  if (!Array.isArray(rawItems)) throw new Error('Invalid response format')
  return parseFlatApiResponse(rawItems)
}

const fetchFlutesOnly = async (): Promise<Flute[]> => {
  try {
    const response = await axios.get<ApiResponse>(`${API_BASE}/singelfaceFlutes`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
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
      // Fallback: try fetching flutes separately
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

  // Sync pagination when substances change
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
// PAGE COMPONENT
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SinglefaceSubstance | null>(null)
  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ---- Validation ----
  const validateForm = (form: FormData): boolean => {
    // Check layer_1
    if (!form.layer_1?.toString().trim()) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 1 tidak boleh kosong')
      return false
    }
    if (isNaN(parseFloat(form.layer_1)) || parseFloat(form.layer_1) <= 0) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 1 harus angka lebih dari 0')
      return false
    }

    // Check layer_2
    if (!form.layer_2?.toString().trim()) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 2 tidak boleh kosong')
      return false
    }
    if (isNaN(parseFloat(form.layer_2)) || parseFloat(form.layer_2) <= 0) {
      SweetAlert.error('Validasi Error', 'Gramasi layer 2 harus angka lebih dari 0')
      return false
    }

    // Check flutes selection
    if (form.flutes.length === 0) {
      SweetAlert.error('Validasi Error', 'Pilih minimal satu flute type')
      return false
    }

    // Check prices
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

  // ---- Add handlers ----
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

    // Check for duplicate substance combination
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

  // ---- Edit handlers ----
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

    // Check for duplicate substance combination (excluding current)
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

  // ---- Pagination pages renderer ----
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

  // ---- Shared form section for layer config ----
  const renderLayerConfig = (
    formData: FormData,
    onInputChange: (field: string, value: any) => void
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {([1, 2] as const).map(num => (
        <div key={num} className="bg-gray-50 p-4 rounded-xl space-y-3">
          <h4 className="font-medium text-gray-900">Layer {num}</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gramasi (gsm) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData[`layer_${num}` as 'layer_1' | 'layer_2']}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(`layer_${num}`, e.target.value)}
              placeholder="125"
              min="1"
              step="1"
              disabled={isPosting}
              className={formErrors[`layer_${num}`] ? 'border-red-500' : ''}
            />
            {formErrors[`layer_${num}`] && <p className="text-xs text-red-600 mt-1">{formErrors[`layer_${num}`]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Kertas <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData[`layer_${num}_type` as 'layer_1_type' | 'layer_2_type']}
              onChange={(e: any) => onInputChange(`layer_${num}_type`, e.target.value)}
              options={LAYER_TYPES.map(t => ({ value: t.value, label: t.label }))}
              disabled={isPosting}
            />
          </div>
        </div>
      ))}
    </div>
  )

  // ---- Shared flute selector ----
  const renderFluteSelector = (
    formData: FormData,
    onFluteToggle: (code: string) => void,
    onPriceChange: (code: string, val: string) => void
  ) => (
    <div className="space-y-4">
      {flutes.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 text-sm">Tidak ada flute tersedia. Tambahkan flute terlebih dahulu.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {flutes.map(flute => {
              const isSelected = formData.flutes.includes(flute.code)
              return (
                <button
                  key={flute.code}
                  type="button"
                  onClick={() => onFluteToggle(flute.code)}
                  disabled={isPosting}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${isSelected ? 'bg-white/20 text-white' : getFluteBadgeClass(flute.code)}`}>
                    {flute.code}
                  </span>
                  {flute.name}
                  {isSelected && <Icon icon="mdi:check" className="w-4 h-4" />}
                </button>
              )
            })}
          </div>

          {formErrors.flutes && <p className="text-sm text-red-600">{formErrors.flutes}</p>}

          {formData.flutes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.flutes.map(code => {
                const flute = flutes.find(f => f.code === code)
                if (!flute) return null
                return (
                  <div key={code} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getFluteBadgeClass(code)}`}>{code}</span>
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
                          value={formData.price_per_m2[code] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPriceChange(code, e.target.value)}
                          placeholder="0"
                          min="1"
                          disabled={isPosting}
                          className={`pl-9 ${formErrors[`price_${code}`] ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {formErrors[`price_${code}`] && <p className="text-xs text-red-600 mt-1">{formErrors[`price_${code}`]}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )

  // ---- Preview card ----
  const renderPreview = (form: FormData, isEdit = false) => {
    if (!form.layer_1 || !form.layer_2) return null
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
          <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-600" />
          Preview {isEdit ? 'Update' : 'Data'}
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Substance:</p>
            <p className="font-medium text-gray-900">{formatSubstanceDisplay(form)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Kode:</p>
            <p className="font-mono text-gray-900">{form.layer_1}{form.layer_1_type}/{form.layer_2}{form.layer_2_type}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Flute Dipilih:</p>
            <p className="font-medium text-gray-900">{form.flutes.length} dari {flutes.length}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Flutes:</p>
            <div className="flex flex-wrap gap-1">
              {form.flutes.map(code => (
                <span key={code} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getFluteBadgeClass(code)}`}>{code}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  if (loading && substances.length === 0 && !error) {
    return <LoadingState message="Memuat Data Singleface..." />
  }

  if (error && substances.length === 0) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

      {/* ---- Header ---- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:layers" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Singleface Settings
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">Kelola harga bahan singleface berdasarkan flute type</p>
            <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
              <span><span className="font-semibold text-gray-700">Substances:</span> {stats.totalSubstances}</span>
              <span><span className="font-semibold text-gray-700">Flute Types:</span> {flutes.length}</span>
              <span><span className="font-semibold text-gray-700">Total Index:</span> {stats.totalIndices}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            icon="mdi:plus"
            disabled={flutes.length === 0 || loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          >
            Tambah Singleface
          </Button>
        </div>
      </div>

      {/* Error banner (soft, data still shown) */}
      {error && substances.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-blue-800 text-sm">{error}</p>
        </div>
      )}

      {/* ---- Stats Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Substances', value: stats.totalSubstances, sub: 'kombinasi bahan', icon: 'mdi:layers', color: 'blue' },
          { label: 'Active', value: stats.activeSubstances, sub: 'dengan layer valid', icon: 'mdi:check-circle', color: 'green' },
          { label: 'Total Indices', value: stats.totalIndices, sub: 'record di database', icon: 'mdi:database', color: 'amber' },
        ].map(({ label, value, sub, icon, color }) => (
          <Card key={label} className="relative overflow-hidden group hover:shadow-xl transition-all">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-50 rounded-bl-full group-hover:bg-${color}-100 transition-all`}></div>
            <div className="space-y-1 relative">
              <p className={`text-sm text-gray-500 flex items-center gap-1.5`}>
                <Icon icon={icon} className={`w-4 h-4 text-${color}-600`} />
                {label}
              </p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ---- Main Table Card ---- */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {/* Table header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:clipboard-list-outline" className="w-5 h-5 text-blue-600" />
              Daftar Singleface Substances
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {stats.totalSubstances} kombinasi × {flutes.length} flute types
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-1.5 text-blue-500 text-sm">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                Memuat...
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="border-gray-300 hover:bg-gray-50"
              icon="mdi:refresh"
            >
              Refresh
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Per halaman:</span>
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
        </div>

        {substances.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:layers-off" className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Belum ada data</h3>
            <p className="text-sm text-gray-400 mb-5">Belum ada singleface substance yang tersedia</p>
            <Button onClick={() => setShowAddModal(true)} variant="primary" icon="mdi:plus"
              className="bg-gradient-to-r from-blue-600 to-indigo-600" disabled={flutes.length === 0}>
              {flutes.length === 0 ? 'Tambah Flute Terlebih Dahulu' : 'Tambah Singleface Pertama'}
            </Button>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">No</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Substance</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Layer 1</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Layer 2</th>
                    {flutes.map((flute, idx) => (
                      <th key={flute.id} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${getFluteBadgeClass(flute.code)}`}>
                            {flute.code}
                          </span>
                          <span className="text-gray-400">Flute</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((substance, idx) => {
                    const rowNum = (pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1
                    return (
                      <tr key={substance.id} className="hover:bg-blue-50/40 transition-colors duration-100">
                        <td className="px-5 py-4 text-sm font-medium text-gray-500">{rowNum}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon icon="mdi:layers" className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{formatSubstanceDisplay(substance)}</p>
                              <p className="text-xs text-gray-400 font-mono">{substance.substance_code}</p>
                            </div>
                          </div>
                        </td>
                        {(['layer_1', 'layer_2'] as const).map(layerKey => {
                          const typeKey = `${layerKey}_type` as 'layer_1_type' | 'layer_2_type'
                          return (
                            <td key={layerKey} className="px-5 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getLayerBadgeClass(substance[typeKey])}`}>
                                {substance[layerKey]}{substance[typeKey]}
                              </span>
                            </td>
                          )
                        })}
                        {flutes.map((flute, fIdx) => {
                          const priceField = `${flute.code.toLowerCase()}_flute_price`
                          const price = substance[priceField]
                          const hasPrice = price !== undefined && price !== null && parseFloat(price) > 0
                          return (
                            <td key={flute.id} className="px-5 py-4">
                              {hasPrice ? (
                                <div>
                                  <p className={`text-sm font-semibold ${getFluteTextColor(fIdx)}`}>{formatCurrency(price)}</p>
                                  <p className="text-xs text-gray-400">/m²</p>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditClick(substance)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit">
                              <Icon icon="mdi:pencil" className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(substance.id, substance.substance_code)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus">
                              <Icon icon="mdi:delete" className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Menampilkan {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}–
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari{' '}
                <span className="font-semibold text-gray-700">{pagination.totalItems}</span>
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
          </>
        )}
      </Card>

      {/* ============================================================
          ADD MODAL
      ============================================================ */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Singleface Substance"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAddSave} loading={isPosting} disabled={isPosting || flutes.length === 0}>
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
            <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">Isi semua field yang bertanda <span className="text-red-500">*</span> untuk menambah data baru.</p>
          </div>

          {/* Layer config */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:layers" className="w-5 h-5 text-blue-600" /> Konfigurasi Layer
            </h3>
            {renderLayerConfig(addFormData, handleAddInputChange)}
          </div>

          {/* Flute types */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:waveform" className="w-5 h-5 text-blue-600" /> Pilih Flute Types & Harga
            </h3>
            {renderFluteSelector(
              addFormData,
              handleAddFluteToggle,
              (code, val) => {
                setAddFormData(prev => ({ ...prev, price_per_m2: { ...prev.price_per_m2, [code]: val } }))
                setFormErrors(prev => ({ ...prev, [`price_${code}`]: '' }))
              }
            )}
          </div>

          {/* Preview */}
          {renderPreview(addFormData)}
        </div>
      </Modal>

      {/* ============================================================
          EDIT MODAL
      ============================================================ */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Singleface Substance"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEditSave} loading={isPosting} disabled={isPosting || flutes.length === 0}>
              {isPosting ? 'Menyimpan...' : 'Update'}
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            {/* Current data info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-2">Data Saat Ini</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-600 text-xs mb-0.5">Substance</p>
                  <p className="font-semibold text-blue-900">{formatSubstanceDisplay(editingItem)}</p>
                </div>
                <div>
                  <p className="text-blue-600 text-xs mb-0.5">Kode</p>
                  <p className="font-mono text-blue-900">{editingItem.substance_code}</p>
                </div>
                <div>
                  <p className="text-blue-600 text-xs mb-0.5">ID</p>
                  <p className="font-mono text-blue-900 text-xs">#{editingItem.id}</p>
                </div>
              </div>
            </div>

            {/* Layer config */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:layers" className="w-5 h-5 text-blue-600" /> Konfigurasi Layer
              </h3>
              {renderLayerConfig(editFormData, handleEditInputChange)}
            </div>

            {/* Flute types */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:waveform" className="w-5 h-5 text-blue-600" /> Pilih Flute Types & Harga
              </h3>
              {renderFluteSelector(
                editFormData,
                handleEditFluteToggle,
                (code, val) => {
                  setEditFormData(prev => ({ ...prev, price_per_m2: { ...prev.price_per_m2, [code]: val } }))
                  setFormErrors(prev => ({ ...prev, [`price_${code}`]: '' }))
                }
              )}
            </div>

            {/* Preview */}
            {renderPreview(editFormData, true)}
          </div>
        )}
      </Modal>
    </div>
  )
}