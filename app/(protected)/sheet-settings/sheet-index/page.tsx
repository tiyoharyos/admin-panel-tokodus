'use client'
// app/(protected)/sheet-settings/sheet-index/page.tsx

import { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Icon } from '@iconify/react'

// ===== TYPE DEFINITIONS =====

interface Flute {
  id: string
  code: string
  name: string
}

interface SheetSubstance {
  id: string
  no: string
  layer_1: string
  layer_1_gsm: string
  layer_2: string
  layer_2_gsm: string
  layer_3: string
  layer_3_gsm: string
  substance_code: string
  created_at: string
  updated_at: string
  [key: string]: string | number
}

interface FormData {
  layer_1: string
  layer_1_gsm: string
  layer_2: string
  layer_2_gsm: string
  layer_3: string
  layer_3_gsm: string
  price_per_m2: Record<string, string>
}

interface Stats {
  totalSubstances: number
  activeSubstances: number
  withAllFlutes: number
  totalIndices: number
}

interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

// ===== API TYPES =====

interface FluteApiItem {
  id_f?: string | number
  code?: string
  name?: string
}

interface SheetIndexApiItem {
  s_substance_id?: string | number
  id?: string | number
  layer_1_gsm?: string
  layer_2_gsm?: string
  layer_3_gsm?: string
  layer_1_type?: string
  layer_2_type?: string
  layer_3_type?: string
  code?: string
  price_per_m2?: string | number
  created_at?: string
  updated_at?: string
}

interface ApiResponse {
  status?: number
  message?: string
  data?: SheetIndexApiItem[]
}

interface ApiSuccessResponse {
  status: number
  message?: string
}

// ===== CONSTANTS =====

const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_gsm: 'K',
  layer_2: '',
  layer_2_gsm: 'M',
  layer_3: '',
  layer_3_gsm: 'M',
  price_per_m2: {},
}

const LAYER_TYPE_OPTIONS = [
  { value: 'K', label: 'Kraft (Coklat Tua)' },
  { value: 'M', label: 'Medium (Coklat)' },
  { value: 'W', label: 'White (Putih)' },
]

interface LayerMeta {
  bg: string
  light: string
}

const LAYER_META: Record<string, LayerMeta> = {
  K: { bg: '#b45309', light: '#fef3c7' },
  M: { bg: '#92400e', light: '#fed7aa' },
  W: { bg: '#6b7280', light: '#f3f4f6' },
}
const DEFAULT_LAYER_META: LayerMeta = { bg: '#64748b', light: '#f1f5f9' }

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

// ===== UTILITIES =====

const formatCurrency = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n)
}

const formatSubstanceDisplay = (item: SheetSubstance | FormData): string =>
  `${item.layer_1}${item.layer_1_gsm}/${item.layer_2}${item.layer_2_gsm}/${item.layer_3}${item.layer_3_gsm}`

const getErrMsg = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) return err.response?.data?.message || err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

const getLayerMeta = (code: string): LayerMeta => LAYER_META[code] || DEFAULT_LAYER_META

const processFluteList = (items: FluteApiItem[]): Flute[] =>
  items.map(f => ({
    id: f.id_f?.toString() || '',
    code: f.code || '',
    name: f.name || '',
  }))

// ===== BADGE COMPONENT =====

function Badge({
  color,
  light,
  children,
}: {
  color: string
  light?: string
  children: React.ReactNode
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: light || `${color}18`, color }}
    >
      {children}
    </span>
  )
}

// ===== HOOK =====
// FIX: Ekstrak logic ke custom hook seperti pola Singleface,
// dan gunakan useMemo untuk stats (bukan useState yang tidak pernah di-update).

const useSheetIndex = () => {
  const [sheetSubstances, setSheetSubstances] = useState<SheetSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  })

  // FIX 1: stats pakai useMemo (derived), bukan useState yang tidak pernah di-update
  const stats = useMemo<Stats>(() => {
    const withAll = sheetSubstances.filter(
      s =>
        flutes.length > 0 &&
        flutes.every(f => ((s[`${f.code.toLowerCase()}_flute_price`] as number) || 0) > 0)
    ).length
    return {
      totalSubstances: sheetSubstances.length,
      activeSubstances: sheetSubstances.filter(
        s => s.layer_1 && s.layer_2 && s.layer_3
      ).length,
      withAllFlutes: withAll,
      totalIndices: sheetSubstances.length * flutes.length,
    }
  }, [sheetSubstances, flutes])

  // FIX 2: Sederhanakan fetchFlutes — tidak perlu ref pattern
  const fetchFlutes = useCallback(async (): Promise<Flute[]> => {
    try {
      interface FluteResponse {
        status?: number
        data?: FluteApiItem[]
      }
      const response = await axios.get('/Admin/Flutes/Flutes')
      const responseData = response.data as FluteResponse | FluteApiItem[]
      let processed: Flute[] = []
      if (Array.isArray(responseData)) {
        processed = processFluteList(responseData)
      } else if (responseData?.status === 200 && Array.isArray(responseData.data)) {
        processed = processFluteList(responseData.data)
      }
      setFlutes(processed)
      return processed
    } catch (err) {
      console.error('Error fetching flutes:', err)
      setFlutes([])
      return []
    }
  }, [])

  const fetchSheetIndex = useCallback(async (currentFlutes: Flute[]): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<ApiResponse | SheetIndexApiItem[]>(
        '/Admin/Sheet/sheetIndex'
      )
      const responseData: SheetIndexApiItem[] = Array.isArray(response.data)
        ? response.data
        : (response.data as ApiResponse)?.data || []

      if (!Array.isArray(responseData)) throw new Error('Format respons tidak valid')

      const grouped: Record<string, SheetSubstance> = {}
      responseData.forEach((item: SheetIndexApiItem) => {
        const substanceId = (item.s_substance_id || item.id)?.toString() || ''
        if (!grouped[substanceId]) {
          grouped[substanceId] = {
            id: substanceId,
            no: '',
            layer_1: item.layer_1_gsm || '',
            layer_2: item.layer_2_gsm || '',
            layer_3: item.layer_3_gsm || '',
            layer_1_gsm: item.layer_1_type || 'K',
            layer_2_gsm: item.layer_2_type || 'M',
            layer_3_gsm: item.layer_3_type || 'M',
            substance_code: `${item.layer_1_gsm}${item.layer_1_type}/${item.layer_2_gsm}${item.layer_2_type}/${item.layer_3_gsm}${item.layer_3_type}`,
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
          }
        }
        if (item.code) {
          grouped[substanceId][`${item.code.toLowerCase()}_flute_price`] =
            parseFloat(item.price_per_m2?.toString() || '0') || 0
        }
      })

      const processed = Object.values(grouped).map((item, index) => ({
        ...item,
        no: (index + 1).toString(),
      }))
      setSheetSubstances(processed)

      // Populate prices for any flutes not found in response
      void currentFlutes
    } catch (err) {
      setError(getErrMsg(err, 'Gagal memuat data'))
      setSheetSubstances([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    const fetchedFlutes = await fetchFlutes()
    await fetchSheetIndex(fetchedFlutes)
  }, [fetchFlutes, fetchSheetIndex])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  // FIX 3: Terima filteredCount sebagai parameter (pola Singleface)
  const handleItemsPerPageChange = (value: number, filteredCount: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: value,
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(filteredCount / value)),
    }))
  }

  return {
    sheetSubstances,
    flutes,
    loading,
    error,
    stats,
    pagination,
    setPagination,
    fetchAll,
    fetchFlutes,
    fetchSheetIndex,
    handlePageChange,
    handleItemsPerPageChange,
  }
}

// ===== MAIN COMPONENT =====

export default function SheetSettingsPage() {
  const router = useRouter()
  const {
    sheetSubstances,
    flutes,
    loading,
    error,
    stats,
    pagination,
    setPagination,
    fetchAll,
    fetchSheetIndex,
    handlePageChange,
    handleItemsPerPageChange,
  } = useSheetIndex()

  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SheetSubstance | null>(null)
  const [selectedItem, setSelectedItem] = useState<SheetSubstance | null>(null)

  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ===== FILTERED + PAGINATED DATA =====

  const filteredSubstances = useMemo(() => {
    if (!search.trim()) return sheetSubstances
    const q = search.toLowerCase()
    return sheetSubstances.filter(
      item =>
        item.substance_code.toLowerCase().includes(q) ||
        `${item.layer_1}${item.layer_1_gsm}`.toLowerCase().includes(q) ||
        `${item.layer_2}${item.layer_2_gsm}`.toLowerCase().includes(q) ||
        `${item.layer_3}${item.layer_3_gsm}`.toLowerCase().includes(q)
    )
  }, [sheetSubstances, search])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return filteredSubstances.slice(start, start + pagination.itemsPerPage)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  useEffect(() => {
    const totalItems = filteredSubstances.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage))
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }))
  }, [filteredSubstances.length, pagination.itemsPerPage, setPagination])

  // ===== AUTO-POPULATE PRICES =====

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
      prices[f.code] =
        (editingItem[`${f.code.toLowerCase()}_flute_price`] as number)?.toString() || ''
    })
    setEditFormData(prev => ({ ...prev, price_per_m2: prices }))
  }, [showEditModal, editingItem, flutes])

  // ===== SELECT CHANGE HANDLERS =====

  const handleAddSelectChange =
    (field: string) => (e: ChangeEvent<HTMLSelectElement>) => {
      setAddFormData(prev => ({ ...prev, [field]: e.target.value }))
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }

  const handleEditSelectChange =
    (field: string) => (e: ChangeEvent<HTMLSelectElement>) => {
      setEditFormData(prev => ({ ...prev, [field]: e.target.value }))
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }

  // ===== VALIDATION =====

  const validateForm = (formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    ;(['layer_1', 'layer_2', 'layer_3'] as const).forEach(field => {
      const val = formData[field] as string
      if (!val || val.trim() === '') errors[field] = 'Gramasi tidak boleh kosong'
      else if (isNaN(parseFloat(val)) || parseFloat(val) <= 0)
        errors[field] = 'Gramasi harus angka lebih dari 0'
    })
    flutes.forEach(flute => {
      const price = formData.price_per_m2?.[flute.code]
      if (!price || price.trim() === '')
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute wajib diisi`
      else if (isNaN(parseFloat(price)))
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus berupa angka`
      else if (parseFloat(price) <= 0)
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus lebih dari 0`
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

  // ===== BUILD PAYLOAD =====

  const buildPayload = (formData: FormData) => ({
    layer_1: formData.layer_1.trim(),
    layer_1_gsm: formData.layer_1_gsm.trim(),
    layer_2: formData.layer_2.trim(),
    layer_2_gsm: formData.layer_2_gsm.trim(),
    layer_3: formData.layer_3.trim(),
    layer_3_gsm: formData.layer_3_gsm.trim(),
    flutes: flutes.map(f => parseInt(f.id)).filter(id => !isNaN(id) && id > 0),
    price_per_m2: flutes.map(f =>
      parseFloat(formData.price_per_m2[f.code] || '0')
    ),
  })

  // ===== ADD HANDLER =====

  const handleAddSave = async () => {
    const errors = validateForm(addFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await showValidationError()
      return
    }
    setIsPosting(true)
    try {
      const response = await axios.post<ApiSuccessResponse>(
        '/Admin/Sheet/sheetIndexAdd',
        buildPayload(addFormData),
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      )
      if (response.data?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        })
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
        setFormErrors({})
        await fetchAll()
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: response.data?.message || 'Gagal menambahkan data',
          confirmButtonColor: '#3b82f6',
        })
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Terjadi kesalahan'),
        confirmButtonColor: '#3b82f6',
      })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLERS =====

  const handleEditClick = (item: SheetSubstance) => {
    setEditingItem(item)
    setEditFormData({
      layer_1: item.layer_1.toString(),
      layer_1_gsm: item.layer_1_gsm,
      layer_2: item.layer_2.toString(),
      layer_2_gsm: item.layer_2_gsm,
      layer_3: item.layer_3.toString(),
      layer_3_gsm: item.layer_3_gsm,
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
    setIsPosting(true)
    try {
      const response = await axios.put<ApiSuccessResponse>(
        '/Admin/Sheet/sheetIndexUpdate',
        { substance_id: parseInt(editingItem.id), ...buildPayload(editFormData) },
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      )
      if (response.data?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data berhasil diperbarui',
          timer: 1500,
          showConfirmButton: false,
        })
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
        setFormErrors({})
        await fetchAll()
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: response.data?.message || 'Gagal memperbarui data',
          confirmButtonColor: '#3b82f6',
        })
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Terjadi kesalahan server'),
        confirmButtonColor: '#3b82f6',
      })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE HANDLER =====

  const handleDelete = async (id: string, substanceCode: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus kombinasi "${substanceCode}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })
    if (!result.isConfirmed) return
    try {
      const response = await axios.delete<ApiSuccessResponse>(
        `/Admin/Sheet/sheetIndexDelete/${id}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      )
      if (response.data?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Dihapus!',
          text: 'Data berhasil dihapus',
          timer: 1500,
          showConfirmButton: false,
        })
        await fetchAll()
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: response.data?.message || 'Gagal menghapus data',
          confirmButtonColor: '#3b82f6',
        })
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Terjadi kesalahan'),
        confirmButtonColor: '#3b82f6',
      })
    }
  }

  // ===== VIEW HANDLER =====

  const handleViewClick = (item: SheetSubstance) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // ===== REFRESH =====

  const handleRefresh = async () => {
    try {
      await fetchAll()
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data berhasil diperbarui',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Gagal memperbarui data'),
        confirmButtonColor: '#3b82f6',
      })
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

  // ===== LOADING / ERROR =====

  if (loading && sheetSubstances.length === 0 && !error) {
    return (
      <LoadingState
        message="Memuat data Sheet Settings..."
        submessage="Harap tunggu sebentar"
        icon="mdi:layers-triple"
      />
    )
  }
  if (error && sheetSubstances.length === 0) {
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
            <Icon icon="mdi:layers-triple" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Sheet Settings</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Kelola harga bahan sheet berdasarkan flute type
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="md"
          icon="mdi:plus"
          disabled={flutes.length === 0}
        >
          Tambah Sheet Baru
        </Button>
      </div>

      {/* ===== STATS CARDS — 4 cards, sama persis dengan Singleface ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: 'mdi:layers-triple',
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
            sub: `${sheetSubstances.length} substance × ${flutes.length} flute`,
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
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(s.bar, 100)}%` }}
                />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== ERROR BANNER ===== */}
      {error && sheetSubstances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Icon icon="mdi:alert" className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={handleRefresh} icon="mdi:refresh" className="ml-auto">
            Refresh
          </Button>
        </div>
      )}

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Sheet Substances</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalSubstances} kombinasi ({stats.withAllFlutes} dengan harga lengkap)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <Input
                placeholder="Cari substance..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon="mdi:magnify"
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
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handleItemsPerPageChange(parseInt(e.target.value), filteredSubstances.length)
                  }
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
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  )}
                </span>{' '}
                dari{' '}
                <span className="font-medium text-slate-700">{pagination.totalItems}</span>
              </p>
            </div>
            {/* FIX 4: Pakai <button> biasa, bukan <Button> component — sama dengan Singleface */}
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
          {sheetSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data sheet substance</p>
              <p className="text-sm text-gray-400">
                Tambahkan sheet substance baru untuk memulai
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="primary"
                icon="mdi:plus"
                disabled={flutes.length === 0}
              >
                {flutes.length === 0 ? 'Tambah Flute Dulu' : 'Tambah Sheet Baru'}
              </Button>
            </div>
          ) : filteredSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-gray-300" />
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Layer 3</th>
                  {flutes.map(flute => (
                    <th
                      key={flute.code}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {flute.code}-Flute
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((substance, index) => {
                  const rowNum =
                    (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  const layerCodes = [
                    substance.layer_1_gsm,
                    substance.layer_2_gsm,
                    substance.layer_3_gsm,
                  ]
                  return (
                    <tr key={substance.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                        {rowNum}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {layerCodes.map((code, idx) => {
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
                          <p className="text-xs font-mono text-gray-400">
                            {substance.substance_code}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          color={getLayerMeta(substance.layer_1_gsm).bg}
                          light={getLayerMeta(substance.layer_1_gsm).light}
                        >
                          {substance.layer_1}{substance.layer_1_gsm}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          color={getLayerMeta(substance.layer_2_gsm).bg}
                          light={getLayerMeta(substance.layer_2_gsm).light}
                        >
                          {substance.layer_2}{substance.layer_2_gsm}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          color={getLayerMeta(substance.layer_3_gsm).bg}
                          light={getLayerMeta(substance.layer_3_gsm).light}
                        >
                          {substance.layer_3}{substance.layer_3_gsm}
                        </Badge>
                      </td>
                      {flutes.map((flute, idx) => {
                        const priceKey = `${flute.code.toLowerCase()}_flute_price`
                        const price = (substance[priceKey] as number) || 0
                        const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                        return (
                          <td key={flute.code} className="px-6 py-4 whitespace-nowrap">
                            {price > 0 ? (
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
                            disabled={flutes.length === 0}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              <span className="font-medium text-slate-700">{filteredSubstances.length}</span>{' '}
              substance
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Sheet Substance Baru"
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
              Simpan Sheet
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Isi gramasi dan jenis kertas untuk setiap layer. Harga per flute wajib diisi semua.
            </p>
          </div>

          {/* Layer Configuration */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:layers-triple" className="w-4 h-4 text-blue-500" />
              Konfigurasi Layer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([1, 2, 3] as const).map(num => (
                <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
                  <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
                  <div className="space-y-3">
                    <Input
                      label="Gramasi *"
                      type="number"
                      value={addFormData[`layer_${num}` as 'layer_1' | 'layer_2' | 'layer_3']}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
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
                      value={
                        addFormData[
                          `layer_${num}_gsm` as 'layer_1_gsm' | 'layer_2_gsm' | 'layer_3_gsm'
                        ]
                      }
                      onChange={handleAddSelectChange(`layer_${num}_gsm`)}
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
            {flutes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
                <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800 text-sm">
                  Tidak ada flute tersedia. Tambahkan flute terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flutes.map((flute, idx) => {
                  const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                  return (
                    <Card key={flute.code} shadow="sm" padding="md" className="border-l-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-slate-800">{flute.name}</span>
                        <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                      </div>
                      <Input
                        label="Harga per m² *"
                        type="number"
                        value={addFormData.price_per_m2[flute.code] || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setAddFormData(prev => ({
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
            )}
          </div>
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Sheet Substance"
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
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Mengedit Sheet Substance</p>
                <p className="text-xs text-blue-600 mt-1">
                  ID: <span className="font-mono">#{editingItem.id}</span> · Kode:{' '}
                  <span className="font-semibold">{formatSubstanceDisplay(editingItem)}</span>
                </p>
              </div>
            </div>

            {/* Layer Configuration */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Icon icon="mdi:layers-triple" className="w-4 h-4 text-blue-500" />
                Konfigurasi Layer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([1, 2, 3] as const).map(num => (
                  <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
                    <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
                    <div className="space-y-3">
                      <Input
                        label="Gramasi *"
                        type="number"
                        value={
                          editFormData[`layer_${num}` as 'layer_1' | 'layer_2' | 'layer_3']
                        }
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setEditFormData(prev => ({
                            ...prev,
                            [`layer_${num}`]: e.target.value,
                          }))
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
                        value={
                          editFormData[
                            `layer_${num}_gsm` as
                              | 'layer_1_gsm'
                              | 'layer_2_gsm'
                              | 'layer_3_gsm'
                          ]
                        }
                        onChange={handleEditSelectChange(`layer_${num}_gsm`)}
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
                <p className="text-sm text-amber-700">
                  Semua flute types harus diisi dengan harga yang valid.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flutes.map((flute, idx) => {
                  const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                  return (
                    <Card
                      key={flute.code}
                      shadow="sm"
                      padding="md"
                      className="border-l-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-slate-800">{flute.name}</span>
                        <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                      </div>
                      <Input
                        label="Harga per m² *"
                        type="number"
                        value={editFormData.price_per_m2[flute.code] || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setEditFormData(prev => ({
                            ...prev,
                            price_per_m2: {
                              ...prev.price_per_m2,
                              [flute.code]: e.target.value,
                            },
                          }))
                          setFormErrors(prev => ({
                            ...prev,
                            [`price_${flute.code}`]: '',
                          }))
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
        title="Detail Sheet Substance"
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
              Edit Sheet
            </Button>
          </>
        }
      >
        {selectedItem &&
          (() => {
            const layerCodes = [
              selectedItem.layer_1_gsm,
              selectedItem.layer_2_gsm,
              selectedItem.layer_3_gsm,
            ]
            return (
              <div className="space-y-4">
                {/* Identity */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100">
                    <Icon icon="mdi:layers-triple" className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-800">
                      {formatSubstanceDisplay(selectedItem)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {layerCodes.map((code, idx) => {
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
                      <span className="text-xs text-gray-400 font-mono">
                        {selectedItem.substance_code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Layer Details — FIX: hapus layerGrams yang tidak terpakai */}
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-2">Komposisi Layer</p>
                  <div className="space-y-2">
                    {[1, 2, 3].map(num => {
                      const code = selectedItem[`layer_${num}_gsm`] as string
                      const gram = selectedItem[`layer_${num}`] as string
                      const meta = getLayerMeta(code)
                      return (
                        <div
                          key={num}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 w-16">
                              Layer {num}:
                            </span>
                            <Badge color={meta.bg} light={meta.light}>
                              {gram}{code}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">
                            {LAYER_TYPE_OPTIONS.find(o => o.value === code)?.label || code}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Flute Prices */}
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-2">Harga per Flute</p>
                  <div className="grid grid-cols-2 gap-2">
                    {flutes.map((flute, idx) => {
                      const priceKey = `${flute.code.toLowerCase()}_flute_price`
                      const price = (selectedItem[priceKey] as number) || 0
                      const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                      return (
                        <div
                          key={flute.code}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                            <span className="text-xs text-gray-600">{flute.name}</span>
                          </div>
                          <span className="text-sm font-medium" style={{ color: color.bg }}>
                            {price > 0 ? formatCurrency(price) : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Metadata */}
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
              </div>
            )
          })()}
      </Modal>
    </div>
  )
}