'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { isAxiosError } from 'axios'
import Swal from 'sweetalert2'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import Input from '@/components/UI/Input'
import axios from '@/lib/axios'

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
  created_at?: string
  updated_at?: string
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
  created_at?: string
  updated_at?: string
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
  price_per_m2: Record<string, string>
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
  withAllFlutes: number
  totalIndices: number
}

// ============================================================
// CONSTANTS
// ============================================================

const API_BASE = '/Admin/Singelface'

const LAYER_TYPE_OPTIONS = [
  { value: 'K', label: 'K - Kraft' },
  { value: 'M', label: 'M - Medium' },
  { value: 'W', label: 'W - White' },
  { value: 'B', label: 'B - Bogus' },
  { value: 'T', label: 'T - Test' },
]

const LAYER_META: Record<string, { bg: string; light: string }> = {
  K: { bg: '#b45309', light: '#fef3c7' },
  M: { bg: '#0284c7', light: '#e0f2fe' },
  W: { bg: '#6b7280', light: '#f3f4f6' },
  B: { bg: '#475569', light: '#f1f5f9' },
  T: { bg: '#115e59', light: '#ccfbf1' },
}
const DEFAULT_LAYER_META = { bg: '#64748b', light: '#f1f5f9' }

const FLUTE_COLORS = [
  { bg: '#3b82f6', light: '#dbeafe' },
  { bg: '#10b981', light: '#d1fae5' },
  { bg: '#f59e0b', light: '#fed7aa' },
  { bg: '#8b5cf6', light: '#ede9fe' },
  { bg: '#ef4444', light: '#fee2e2' },
  { bg: '#06b6d4', light: '#cffafe' },
  { bg: '#f43f5e', light: '#ffe4e6' },
  { bg: '#84cc16', light: '#ecfccb' },
]

const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_type: 'K',
  layer_2: '',
  layer_2_type: 'M',
  price_per_m2: {},
}

// ============================================================
// UTILS
// ============================================================

const formatCurrency = (val: number | string) => {
  const num = parseFloat(val as string) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

const getLayerMeta = (type: string) => LAYER_META[type] || DEFAULT_LAYER_META

const formatSubstanceDisplay = (s: { layer_1: string; layer_1_type: string; layer_2: string; layer_2_type: string }) =>
  `${s.layer_1}${s.layer_1_type} / ${s.layer_2}${s.layer_2_type}`

const getErrMsg = (err: unknown, fallback = 'Terjadi kesalahan'): string => {
  if (isAxiosError(err)) return err.response?.data?.message || err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

// ============================================================
// API HELPERS
// ============================================================

const parseFlatApiResponse = (rawItems: ApiRawItem[]) => {
  const fluteMap = new Map<string, Flute>()
  rawItems.forEach(item => {
    if (!fluteMap.has(item.id_f)) {
      fluteMap.set(item.id_f, { id: item.id_f, code: item.code, name: item.name })
    }
  })

  const substanceMap = new Map<string, SinglefaceSubstance>()
  rawItems.forEach(item => {
    if (!substanceMap.has(item.substance_id)) {
      substanceMap.set(item.substance_id, {
        id: item.substance_id,
        layer_1: item.layer_1_gsm || '',
        layer_1_type: item.layer_1_type || 'K',
        layer_2: item.layer_2_gsm || '',
        layer_2_type: item.layer_2_type || 'M',
        substance_code: `${item.layer_1_gsm}${item.layer_1_type}/${item.layer_2_gsm}${item.layer_2_type}`,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })
    }
    const substance = substanceMap.get(item.substance_id)!
    substance[`${item.code.toLowerCase()}_flute_price`] = parseFloat(item.price_per_m2) || 0
  })

  return {
    flutes: Array.from(fluteMap.values()),
    substances: Array.from(substanceMap.values()),
  }
}

// ============================================================
// BADGE COMPONENT
// ============================================================

function Badge({ color, light, children }: { color: string; light?: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: light || `${color}18`, color }}
    >
      {children}
    </span>
  )
}

// ============================================================
// HOOK
// ============================================================

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
    const withAll = substances.filter(s =>
      flutes.length > 0 && flutes.every(f => (s[`${f.code.toLowerCase()}_flute_price`] || 0) > 0)
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

  const handleItemsPerPageChange = (value: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: value,
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(substances.length / value)),
    }))
  }

  const addItem = async (data: any): Promise<ApiResponse> => {
    const res = await axios.post<ApiResponse>(`${API_BASE}/singelfaceIndexAdd`, data, {
      headers: { 'Content-Type': 'application/json' },
    })
    return res.data
  }

  const updateItem = async (data: any): Promise<ApiResponse> => {
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

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SinglefaceSettingsPage() {
  const router = useRouter()
  const {
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
  } = useSingleface()

  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SinglefaceSubstance | null>(null)
  const [selectedItem, setSelectedItem] = useState<SinglefaceSubstance | null>(null)
  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ===== FILTERED + PAGINATED DATA =====
  const filteredSubstances = useMemo(() => {
    if (!search.trim()) return substances
    const q = search.toLowerCase()
    return substances.filter(
      s =>
        s.substance_code.toLowerCase().includes(q) ||
        `${s.layer_1}${s.layer_1_type}`.toLowerCase().includes(q) ||
        `${s.layer_2}${s.layer_2_type}`.toLowerCase().includes(q)
    )
  }, [substances, search])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return filteredSubstances.slice(start, start + pagination.itemsPerPage)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  // Sync pagination totals when filtered data changes
  useEffect(() => {
    const totalItems = filteredSubstances.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage))
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }))
  }, [filteredSubstances.length, pagination.itemsPerPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-populate all flute price fields when modal opens
  useEffect(() => {
    if (!showAddModal || flutes.length === 0) return
    const prices: Record<string, string> = {}
    flutes.forEach(f => { prices[f.code] = '' })
    setAddFormData(prev => ({ ...prev, price_per_m2: prices }))
  }, [showAddModal, flutes])

  useEffect(() => {
    if (!showEditModal || !editingItem || flutes.length === 0) return
    const prices: Record<string, string> = {}
    flutes.forEach(f => {
      prices[f.code] = editingItem[`${f.code.toLowerCase()}_flute_price`]?.toString() || ''
    })
    setEditFormData(prev => ({ ...prev, price_per_m2: prices }))
  }, [showEditModal, editingItem, flutes])

  // ===== VALIDATION =====
  const validateForm = (form: FormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!form.layer_1?.toString().trim()) errors.layer_1 = 'Gramasi layer 1 tidak boleh kosong'
    else if (parseFloat(form.layer_1) <= 0) errors.layer_1 = 'Gramasi harus lebih dari 0'

    if (!form.layer_2?.toString().trim()) errors.layer_2 = 'Gramasi layer 2 tidak boleh kosong'
    else if (parseFloat(form.layer_2) <= 0) errors.layer_2 = 'Gramasi harus lebih dari 0'

    flutes.forEach(f => {
      const price = form.price_per_m2?.[f.code]
      if (!price?.toString().trim()) errors[`price_${f.code}`] = `Harga ${f.code}-Flute wajib diisi`
      else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0)
        errors[`price_${f.code}`] = `Harga ${f.code}-Flute harus lebih dari 0`
    })
    return errors
  }

  const showValidationError = async () => {
    await Swal.fire({
      icon: 'error',
      title: 'Validasi Error',
      text: 'Periksa kembali data yang diisi',
      confirmButtonColor: '#3b82f6',
    })
  }

  const buildPayload = (form: FormData) => ({
    layer_1: parseFloat(form.layer_1.trim()),
    layer_1_type: form.layer_1_type,
    layer_2: parseFloat(form.layer_2.trim()),
    layer_2_type: form.layer_2_type,
    flutes: flutes.map(f => parseInt(f.id)).filter(id => id > 0),
    price_per_m2: flutes.map(f => parseFloat(form.price_per_m2[f.code] || '0')),
  })

  // ===== ADD HANDLERS =====
  const handleAddSave = async () => {
    const errors = validateForm(addFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await showValidationError()
      return
    }
    const newCode = `${addFormData.layer_1}${addFormData.layer_1_type}/${addFormData.layer_2}${addFormData.layer_2_type}`
    if (substances.some(s => s.substance_code === newCode)) {
      await Swal.fire({ icon: 'error', title: 'Duplikat!', text: `Kombinasi "${newCode}" sudah ada.`, confirmButtonColor: '#3b82f6' })
      return
    }
    setIsPosting(true)
    try {
      const res = await addItem(buildPayload(addFormData))
      if (res?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil ditambahkan', timer: 1500, showConfirmButton: false })
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
        setFormErrors({})
        await fetchAll()
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal!', text: res?.message || 'Gagal menambahkan data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLERS =====
  const handleEditClick = (item: SinglefaceSubstance) => {
    setEditingItem(item)
    setEditFormData({
      layer_1: item.layer_1 || '',
      layer_1_type: item.layer_1_type || 'K',
      layer_2: item.layer_2 || '',
      layer_2_type: item.layer_2_type || 'M',
      price_per_m2: {},
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    const errors = validateForm(editFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await showValidationError()
      return
    }
    const newCode = `${editFormData.layer_1}${editFormData.layer_1_type}/${editFormData.layer_2}${editFormData.layer_2_type}`
    if (substances.some(s => s.id !== editingItem.id && s.substance_code === newCode)) {
      await Swal.fire({ icon: 'error', title: 'Duplikat!', text: `Kombinasi "${newCode}" sudah digunakan.`, confirmButtonColor: '#3b82f6' })
      return
    }
    setIsPosting(true)
    try {
      const res = await updateItem({ substance_id: parseInt(editingItem.id), ...buildPayload(editFormData) })
      if (res?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui', timer: 1500, showConfirmButton: false })
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
        setFormErrors({})
        await fetchAll()
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal!', text: res?.message || 'Gagal memperbarui data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE HANDLER =====
  const handleDelete = async (id: string, code: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus kombinasi "${code}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })
    if (!result.isConfirmed) return
    try {
      const res = await deleteItem(id)
      if (res?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Data berhasil dihapus', timer: 1500, showConfirmButton: false })
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal!', text: res?.message || 'Gagal menghapus data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    }
  }

  // ===== VIEW HANDLER =====
  const handleViewClick = (item: SinglefaceSubstance) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // ===== REFRESH =====
  const handleRefresh = async () => {
    try {
      await fetchAll()
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui', timer: 1500, showConfirmButton: false })
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    }
  }

  // ===== MODAL CLOSE =====
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

  // ===== FLUTE PRICE INPUT HELPER =====
  const FlutePricingGrid = ({
    formData,
    setFormData,
    errors,
    setErrors,
    disabled,
  }: {
    formData: FormData
    setFormData: React.Dispatch<React.SetStateAction<FormData>>
    errors: Record<string, string>
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
    disabled: boolean
  }) => (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Icon icon="mdi:currency-usd" className="w-4 h-4 text-green-500" />
        Harga per Flute
      </h3>
      {flutes.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
          <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800 text-sm">Tidak ada flute tersedia. Tambahkan flute terlebih dahulu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flutes.map((flute, idx) => {
            const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
            return (
              <Card
                key={flute.code}
                shadow="sm"
                padding="md"
                className="border-l-4"
                style={{ borderLeftColor: color.bg }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{flute.name}</span>
                    <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                  </div>
                </div>
                <Input
                  label="Harga per m² *"
                  type="number"
                  value={formData.price_per_m2[flute.code] || ''}
                  onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      price_per_m2: { ...prev.price_per_m2, [flute.code]: e.target.value },
                    }))
                    setErrors(prev => ({ ...prev, [`price_${flute.code}`]: '' }))
                  }}
                  placeholder="0"
                  min="1"
                  disabled={disabled}
                  error={errors[`price_${flute.code}`]}
                  leftIcon="mdi:currency-usd"
                />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  // ===== LOADING / ERROR STATE =====
  if (loading && substances.length === 0 && !error) {
    return <LoadingState message="Memuat Data Singleface..." submessage="Harap tunggu sebentar" icon="mdi:layers" />
  }
  if (error && substances.length === 0) {
    return <ErrorState message={error} onRetry={fetchAll} />
  }

  // ============================================================
  // RENDER
  // ============================================================
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: 'mdi:layers',
            label: 'Total Substances',
            value: stats.totalSubstances,
            sub: `${stats.activeSubstances} aktif`,
          },
          {
            icon: 'mdi:currency-usd-circle',
            label: 'Complete Pricing',
            value: stats.withAllFlutes,
            sub: `${stats.totalSubstances - stats.withAllFlutes} belum lengkap`,
            bar: (stats.withAllFlutes / (stats.totalSubstances || 1)) * 100,
          },
          {
            icon: 'mdi:waveform',
            label: 'Flute Types',
            value: flutes.length,
            sub: flutes.map(f => f.code).join(' · ') || '-',
          },
          {
            icon: 'mdi:database',
            label: 'Total Indices',
            value: stats.totalIndices,
            sub: `${substances.length} substance × ${flutes.length} flute`,
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
          <Button variant="ghost" size="sm" onClick={fetchAll} icon="mdi:refresh" className="ml-auto">
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
              Total {stats.totalSubstances} kombinasi ({stats.withAllFlutes} dengan harga lengkap)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari substance..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <button
              onClick={handleRefresh}
              title="Refresh"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Icon icon="mdi:refresh" className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/flute-settings')}
              title="Kelola Flutes"
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Icon icon="mdi:cog" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pagination Top */}
        {filteredSubstances.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Per halaman:</span>
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
              <p className="text-sm text-gray-500">
                Menampilkan{' '}
                <span className="font-medium text-slate-700">
                  {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                </span>{' '}
                -{' '}
                <span className="font-medium text-slate-700">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span>{' '}
                dari <span className="font-medium text-slate-700">{pagination.totalItems}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-left" className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500">
                Halaman {pagination.currentPage} dari {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-right" className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {substances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data singleface</p>
              <p className="text-sm text-gray-400">Tambahkan singleface substance baru untuk memulai</p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="primary"
                icon="mdi:plus"
                disabled={flutes.length === 0}
              >
                {flutes.length === 0 ? 'Tambah Flute Dulu' : 'Tambah Data Pertama'}
              </Button>
            </div>
          ) : filteredSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
              <p className="text-sm text-gray-400">
                Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                Hapus Pencarian
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Substance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Layer 1</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Layer 2</th>
                  {flutes.map((flute, idx) => (
                    <th key={flute.id} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {flute.code}-Flute
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((substance, index) => {
                  const rowNum = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  const l1Meta = getLayerMeta(substance.layer_1_type)
                  const l2Meta = getLayerMeta(substance.layer_2_type)
                  return (
                    <tr key={substance.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{rowNum}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {[substance.layer_1_type, substance.layer_2_type].map((code, idx) => {
                                const meta = getLayerMeta(code)
                                return (
                                  <span
                                    key={idx}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
                                    style={{ background: meta.bg }}
                                  >
                                    {code}
                                  </span>
                                )
                              })}
                            </div>
                            <p className="text-xs font-mono text-gray-400">{substance.substance_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={l1Meta.bg} light={l1Meta.light}>
                          {substance.layer_1}{substance.layer_1_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={l2Meta.bg} light={l2Meta.light}>
                          {substance.layer_2}{substance.layer_2_type}
                        </Badge>
                      </td>
                      {flutes.map((flute, idx) => {
                        const price = substance[`${flute.code.toLowerCase()}_flute_price`]
                        const hasPrice = price !== undefined && price !== null && parseFloat(price) > 0
                        const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                        return (
                          <td key={flute.id} className="px-6 py-4">
                            {hasPrice ? (
                              <span className="text-sm font-medium" style={{ color: color.bg }}>
                                {formatCurrency(price)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewClick(substance)}
                            title="Lihat Detail"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                          </button>
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
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {filteredSubstances.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan{' '}
              <span className="font-medium text-slate-700">{paginatedData.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{filteredSubstances.length}</span> substance
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Singleface Substance"
        size="xl"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseAddModal} disabled={isPosting}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAddSave}
              loading={isPosting}
              disabled={isPosting || flutes.length === 0}
              icon="mdi:check"
            >
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Info */}
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Isi gramasi dan jenis kertas untuk setiap layer. Harga per flute wajib diisi semua.
            </p>
          </div>

          {/* Layer Configuration */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:layers" className="w-4 h-4 text-blue-500" />
              Konfigurasi Layer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([1, 2] as const).map(num => (
                <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
                  <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
                  <div className="space-y-3">
                    <Input
                      label="Gramasi (gsm) *"
                      type="number"
                      value={addFormData[`layer_${num}` as 'layer_1' | 'layer_2']}
                      onChange={e => {
                        setAddFormData(prev => ({ ...prev, [`layer_${num}`]: e.target.value }))
                        setFormErrors(prev => ({ ...prev, [`layer_${num}`]: '' }))
                      }}
                      placeholder="125"
                      min="1"
                      step="1"
                      disabled={isPosting}
                      error={formErrors[`layer_${num}`]}
                      leftIcon="mdi:weight"
                    />
                    <Select
                      label="Jenis Kertas *"
                      value={addFormData[`layer_${num}_type` as 'layer_1_type' | 'layer_2_type']}
                      onChange={(e: any) => {
                        setAddFormData(prev => ({ ...prev, [`layer_${num}_type`]: e.target.value }))
                      }}
                      options={LAYER_TYPE_OPTIONS}
                      disabled={isPosting}
                      leftIcon="mdi:palette"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Flute Pricing */}
          <FlutePricingGrid
            formData={addFormData}
            setFormData={setAddFormData}
            errors={formErrors}
            setErrors={setFormErrors}
            disabled={isPosting}
          />
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Singleface Substance"
        size="xl"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseEditModal} disabled={isPosting}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleEditSave}
              loading={isPosting}
              disabled={isPosting || flutes.length === 0}
              icon="mdi:check"
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            {/* Info */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Mengedit Singleface Substance</p>
                <p className="text-xs text-blue-600 mt-1">
                  ID: <span className="font-mono">#{editingItem.id}</span> · Kode:{' '}
                  <span className="font-semibold">{editingItem.substance_code}</span>
                </p>
              </div>
            </div>

            {/* Layer Configuration */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:layers" className="w-4 h-4 text-blue-500" />
                Konfigurasi Layer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([1, 2] as const).map(num => (
                  <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
                    <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
                    <div className="space-y-3">
                      <Input
                        label="Gramasi (gsm) *"
                        type="number"
                        value={editFormData[`layer_${num}` as 'layer_1' | 'layer_2']}
                        onChange={e => {
                          setEditFormData(prev => ({ ...prev, [`layer_${num}`]: e.target.value }))
                          setFormErrors(prev => ({ ...prev, [`layer_${num}`]: '' }))
                        }}
                        placeholder="125"
                        min="1"
                        step="1"
                        disabled={isPosting}
                        error={formErrors[`layer_${num}`]}
                        leftIcon="mdi:weight"
                      />
                      <Select
                        label="Jenis Kertas *"
                        value={editFormData[`layer_${num}_type` as 'layer_1_type' | 'layer_2_type']}
                        onChange={(e: any) => {
                          setEditFormData(prev => ({ ...prev, [`layer_${num}_type`]: e.target.value }))
                        }}
                        options={LAYER_TYPE_OPTIONS}
                        disabled={isPosting}
                        leftIcon="mdi:palette"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Flute Pricing */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:currency-usd" className="w-4 h-4 text-green-500" />
                Harga per Flute
              </h3>
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                <Icon icon="mdi:alert-circle" className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700">Semua flute types harus diisi dengan harga yang valid.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flutes.map((flute, idx) => {
                  const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                  return (
                    <Card key={flute.code} shadow="sm" padding="md" className="border-l-4" style={{ borderLeftColor: color.bg }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-slate-800">{flute.name}</span>
                        <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                      </div>
                      <Input
                        label="Harga per m² *"
                        type="number"
                        value={editFormData.price_per_m2[flute.code] || ''}
                        onChange={e => {
                          setEditFormData(prev => ({
                            ...prev,
                            price_per_m2: { ...prev.price_per_m2, [flute.code]: e.target.value },
                          }))
                          setFormErrors(prev => ({ ...prev, [`price_${flute.code}`]: '' }))
                        }}
                        placeholder="0"
                        min="1"
                        disabled={isPosting}
                        error={formErrors[`price_${flute.code}`]}
                        leftIcon="mdi:currency-usd"
                      />
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Singleface Substance"
        size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setShowViewModal(false)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              size="md"
              icon="mdi:pencil-outline"
              onClick={() => {
                setShowViewModal(false)
                if (selectedItem) handleEditClick(selectedItem)
              }}
            >
              Edit
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const l1Meta = getLayerMeta(selectedItem.layer_1_type)
          const l2Meta = getLayerMeta(selectedItem.layer_2_type)
          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100">
                  <Icon icon="mdi:layers" className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {formatSubstanceDisplay(selectedItem)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {[selectedItem.layer_1_type, selectedItem.layer_2_type].map((code, idx) => {
                        const meta = getLayerMeta(code)
                        return (
                          <span
                            key={idx}
                            className="w-5 h-5 rounded text-xs font-bold text-white flex items-center justify-center"
                            style={{ background: meta.bg }}
                          >
                            {code}
                          </span>
                        )
                      })}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{selectedItem.substance_code}</span>
                  </div>
                </div>
              </div>

              {/* Layer Details */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Komposisi Layer</p>
                <div className="space-y-2">
                  {[
                    { num: 1, gsm: selectedItem.layer_1, type: selectedItem.layer_1_type, meta: l1Meta },
                    { num: 2, gsm: selectedItem.layer_2, type: selectedItem.layer_2_type, meta: l2Meta },
                  ].map(({ num, gsm, type, meta }) => (
                    <div key={num} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 w-16">Layer {num}:</span>
                        <Badge color={meta.bg} light={meta.light}>{gsm}{type}</Badge>
                      </div>
                      <span className="text-xs text-gray-400">
                        {LAYER_TYPE_OPTIONS.find(o => o.value === type)?.label?.split(' - ')[1] || type}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Flute Prices */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Harga per Flute</p>
                <div className="grid grid-cols-2 gap-2">
                  {flutes.map((flute, idx) => {
                    const price = selectedItem[`${flute.code.toLowerCase()}_flute_price`] || 0
                    const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                    return (
                      <div key={flute.code} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                          <span className="text-xs text-gray-600">{flute.name}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: color.bg }}>
                          {parseFloat(price) > 0 ? formatCurrency(price) : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Metadata */}
              {(selectedItem.created_at || selectedItem.updated_at) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Dibuat</p>
                    <p className="text-sm text-slate-700">
                      {selectedItem.created_at
                        ? new Date(selectedItem.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Diperbarui</p>
                    <p className="text-sm text-slate-700">
                      {selectedItem.updated_at
                        ? new Date(selectedItem.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}