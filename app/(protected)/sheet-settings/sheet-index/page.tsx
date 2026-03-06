'use client'
// app/(protected)/sheet-settings/sheet-index/page.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  flutes: string[]
  price_per_m2: Record<string, string>
  minimal_qty: Record<string, string>
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

// ===== CONSTANTS =====
const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_gsm: 'K',
  layer_2: '',
  layer_2_gsm: 'M',
  layer_3: '',
  layer_3_gsm: 'M',
  flutes: [],
  price_per_m2: {},
  minimal_qty: {}
}

const LAYER_TYPE_OPTIONS = [
  { value: 'K', label: 'Kraft (Coklat Tua)' },
  { value: 'M', label: 'Medium (Coklat)' },
  { value: 'W', label: 'White (Putih)' }
]

// ===== META CONSTANTS =====
const LAYER_META: Record<string, { icon: string; color: string; bg: string }> = {
  'K': { icon: 'mdi:palette', color: '#8B4513', bg: '#8B4513' },
  'M': { icon: 'mdi:palette', color: '#A0522D', bg: '#A0522D' },
  'W': { icon: 'mdi:palette', color: '#F5F5F5', bg: '#696969' }
}

const FLUTE_COLORS = [
  { bg: '#3b82f6', light: '#dbeafe' },  // Blue
  { bg: '#10b981', light: '#d1fae5' },  // Green
  { bg: '#f59e0b', light: '#fed7aa' },  // Orange
  { bg: '#8b5cf6', light: '#ede9fe' },  // Purple
  { bg: '#ef4444', light: '#fee2e2' },  // Red
  { bg: '#06b6d4', light: '#cffafe' },  // Cyan
  { bg: '#f43f5e', light: '#ffe4e6' },  // Rose
  { bg: '#84cc16', light: '#ecfccb' }   // Lime
]

// ===== UTILITIES =====
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const formatSubstanceDisplay = (item: SheetSubstance | FormData): string =>
  `${item.layer_1}${item.layer_1_gsm}/${item.layer_2}${item.layer_2_gsm}/${item.layer_3}${item.layer_3_gsm}`

const getErrMsg = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) return err.response?.data?.message || err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

const processFluteList = (items: FluteApiItem[]): Flute[] =>
  items.map(f => ({ id: f.id_f?.toString() || '', code: f.code || '', name: f.name || '' }))

// ===== BADGE =====
function Badge({ color, children, light }: { color: string; children: React.ReactNode; light?: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: light || `${color}18`, color }}
    >
      {children}
    </span>
  )
}

// ===== MAIN COMPONENT =====
export default function SheetSettingsPage() {
  const router = useRouter()

  const [sheetSubstances, setSheetSubstances] = useState<SheetSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SheetSubstance | null>(null)
  const [selectedItem, setSelectedItem] = useState<SheetSubstance | null>(null)

  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [stats, setStats] = useState<Stats>({
    totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0, totalIndices: 0
  })

  // ===== DERIVED DATA =====
  const filteredSubstances = useMemo(() => {
    if (!search.trim()) return sheetSubstances
    
    return sheetSubstances.filter(item => 
      item.substance_code.toLowerCase().includes(search.toLowerCase()) ||
      `${item.layer_1}${item.layer_1_gsm}`.toLowerCase().includes(search.toLowerCase()) ||
      `${item.layer_2}${item.layer_2_gsm}`.toLowerCase().includes(search.toLowerCase()) ||
      `${item.layer_3}${item.layer_3_gsm}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [sheetSubstances, search])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return filteredSubstances.slice(start, start + pagination.itemsPerPage)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  // ===== AUTO SELECT ALL FLUTES =====
  useEffect(() => {
    if (flutes.length === 0 || !showAddModal) return
    const allCodes = flutes.map(f => f.code)
    const priceData: Record<string, string> = {}
    allCodes.forEach(code => { priceData[code] = '' })
    setAddFormData(prev => ({ ...prev, flutes: allCodes, price_per_m2: priceData }))
  }, [flutes, showAddModal])

  useEffect(() => {
    if (flutes.length === 0 || !showEditModal || !editingItem) return
    const allCodes = flutes.map(f => f.code)
    const priceData: Record<string, string> = {}
    const qtyData: Record<string, string> = {}
    allCodes.forEach(code => {
      priceData[code] = editingItem[`${code.toLowerCase()}_flute_price`]?.toString() || ''
      qtyData[code] = editingItem[`${code.toLowerCase()}_minimal_qty`]?.toString() || ''
    })
    setEditFormData(prev => ({ ...prev, flutes: allCodes, price_per_m2: priceData, minimal_qty: qtyData }))
  }, [flutes, showEditModal, editingItem])

  // ===== PAGINATION HANDLERS =====
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination(prev => ({
      ...prev, itemsPerPage: value, currentPage: 1,
      totalPages: Math.ceil(filteredSubstances.length / value)
    }))
  }

  useEffect(() => {
    const totalItems = filteredSubstances.length
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    setPagination(prev => ({
      ...prev, totalItems, totalPages,
      currentPage: prev.currentPage > totalPages && totalPages > 0 ? 1 : prev.currentPage
    }))
  }, [filteredSubstances, pagination.itemsPerPage])

  // ===== FETCH FLUTES =====
  const fetchFlutes = useCallback(async (): Promise<Flute[]> => {
    try {
      const response = await axios.get('/Admin/Flutes/Flutes')
      let processed: Flute[] = []
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        processed = processFluteList(response.data.data)
      } else if (Array.isArray(response.data)) {
        processed = processFluteList(response.data)
      }
      setFlutes(processed)
      return processed
    } catch (err) {
      console.error('Error fetching flutes:', err)
      setFlutes([])
      return []
    }
  }, [])

  // ===== FETCH SHEET INDEX =====
  const fetchSheetIndex = useCallback(async (): Promise<SheetSubstance[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get<ApiResponse | SheetIndexApiItem[]>('/Admin/Sheet/sheetIndex')

      const responseData: SheetIndexApiItem[] = Array.isArray(response.data)
        ? response.data
        : (response.data as ApiResponse)?.data || []

      if (!Array.isArray(responseData)) throw new Error('Invalid response format')

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
            updated_at: item.updated_at || ''
          }
        }
        if (item.code) {
          grouped[substanceId][`${item.code.toLowerCase()}_flute_price`] = parseFloat(item.price_per_m2?.toString() || '0') || 0
        }
      })

      const processed = Object.values(grouped).map((item, index) => ({ ...item, no: (index + 1).toString() }))
      setSheetSubstances(processed)
      setStats({ 
        totalSubstances: processed.length, 
        activeSubstances: processed.length, 
        withAllFlutes: processed.filter(s => 
          flutes.every(f => (s[`${f.code.toLowerCase()}_flute_price`] as number || 0) > 0)
        ).length, 
        totalIndices: responseData.length 
      })
      return processed
    } catch (err: unknown) {
      console.error('Error fetching sheet index:', err)
      setError(getErrMsg(err, 'Failed to fetch data'))
      setSheetSubstances([])
      setStats({ totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0, totalIndices: 0 })
      return []
    } finally {
      setLoading(false)
    }
  }, [flutes])

  useEffect(() => {
    const init = async () => {
      try {
        await fetchFlutes()
        await fetchSheetIndex()
      } catch (err: unknown) {
        setError(getErrMsg(err, 'Failed to load data'))
      }
    }
    init()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ===== FORM HANDLERS =====
  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  // ===== VALIDATION =====
  const validateForm = (formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {}

    ;['layer_1', 'layer_2', 'layer_3'].forEach(field => {
      const val = formData[field as keyof FormData] as string
      if (!val || val.trim() === '') errors[field] = 'Gramasi tidak boleh kosong'
      else if (isNaN(parseFloat(val)) || parseFloat(val) <= 0) errors[field] = 'Gramasi harus angka lebih dari 0'
    })

    flutes.forEach(flute => {
      const price = formData.price_per_m2?.[flute.code]
      if (!price || price.trim() === '') errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute tidak boleh kosong`
      else if (isNaN(parseFloat(price))) errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus berupa angka`
      else if (parseFloat(price) <= 0) errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus lebih dari 0`
    })

    return errors
  }

  // ===== BUILD POST PAYLOAD =====
  const buildPayload = (formData: FormData) => ({
    layer_1: formData.layer_1.trim(),
    layer_1_gsm: formData.layer_1_gsm.trim(),
    layer_2: formData.layer_2.trim(),
    layer_2_gsm: formData.layer_2_gsm.trim(),
    layer_3: formData.layer_3.trim(),
    layer_3_gsm: formData.layer_3_gsm.trim(),
    flutes: formData.flutes.map(code => {
      const flute = flutes.find(f => f.code === code)
      return flute ? parseInt(flute.id) : 0
    }).filter(id => id > 0),
    price_per_m2: formData.flutes.map(code => parseFloat(formData.price_per_m2[code] || '0'))
  })

  // ===== ADD HANDLER =====
  const handleAddSave = async () => {
    const errors = validateForm(addFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await Swal.fire({ 
        icon: 'error', 
        title: 'Validasi Error', 
        text: 'Periksa kembali data yang diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    try {
      setIsPosting(true)
      const response = await axios.post('/Admin/Sheet/sheetIndexAdd', buildPayload(addFormData), {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      if (response.data?.status === 200) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: 'Data berhasil ditambahkan', 
          timer: 1500, 
          showConfirmButton: false 
        })
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
        await fetchSheetIndex()
      } else {
        await Swal.fire({ 
          icon: 'error', 
          title: 'Gagal!', 
          text: response.data?.message || 'Gagal menambahkan data',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (err: unknown) {
      await Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Terjadi kesalahan'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLERS =====
  const handleEditClick = (item: SheetSubstance) => {
    const editData: FormData = {
      layer_1: item.layer_1.toString(),
      layer_1_gsm: item.layer_1_gsm,
      layer_2: item.layer_2.toString(),
      layer_2_gsm: item.layer_2_gsm,
      layer_3: item.layer_3.toString(),
      layer_3_gsm: item.layer_3_gsm,
      flutes: [],
      price_per_m2: {},
      minimal_qty: {}
    }

    flutes.forEach(flute => {
      const priceField = `${flute.code.toLowerCase()}_flute_price`
      if ((item[priceField] as number) > 0) {
        editData.flutes.push(flute.code)
        editData.price_per_m2[flute.code] = item[priceField].toString()
      }
    })

    setEditingItem(item)
    setEditFormData(editData)
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    const errors = validateForm(editFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await Swal.fire({ 
        icon: 'error', 
        title: 'Validasi Error', 
        text: 'Periksa kembali data yang diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    try {
      setIsPosting(true)
      const response = await axios.put('/Admin/Sheet/sheetIndexUpdate', {
        substance_id: parseInt(editingItem.id),
        ...buildPayload(editFormData)
      }, { headers: { 'ngrok-skip-browser-warning': 'true' } })

      if (response.data?.status === 200) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: 'Data berhasil diperbarui', 
          timer: 1500, 
          showConfirmButton: false 
        })
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
        await fetchSheetIndex()
      } else {
        await Swal.fire({ 
          icon: 'error', 
          title: 'Gagal!', 
          text: response.data?.message || 'Gagal memperbarui data',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (err: unknown) {
      await Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Terjadi kesalahan server'),
        confirmButtonColor: '#3b82f6'
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
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return

    try {
      const response = await axios.delete(`/Admin/Sheet/sheetIndexDelete/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      if (response.data?.status === 200) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Dihapus!', 
          text: 'Data berhasil dihapus', 
          timer: 1500, 
          showConfirmButton: false 
        })
        await fetchSheetIndex()
      } else {
        await Swal.fire({ 
          icon: 'error', 
          title: 'Gagal!', 
          text: response.data?.message || 'Gagal menghapus data',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (err: unknown) {
      await Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Terjadi kesalahan'),
        confirmButtonColor: '#3b82f6'
      })
    }
  }

  // ===== VIEW HANDLER =====
  const handleViewClick = (item: SheetSubstance) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setLoading(true)
    try {
      await fetchFlutes()
      await fetchSheetIndex()
      await Swal.fire({ 
        icon: 'success', 
        title: 'Berhasil!', 
        text: 'Data berhasil diperbarui', 
        timer: 1500, 
        showConfirmButton: false 
      })
    } catch (err: unknown) {
      await Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Gagal memperbarui data'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setLoading(false)
    }
  }

  // ===== MODAL CLOSE HANDLERS =====
  const handleCloseAddModal = () => {
    if (!isPosting) { setShowAddModal(false); setAddFormData({ ...BASE_FORM }); setFormErrors({}) }
  }

  const handleCloseEditModal = () => {
    if (!isPosting) { setShowEditModal(false); setEditingItem(null); setEditFormData({ ...BASE_FORM }); setFormErrors({}) }
  }

  // ===== LAYOUT CONSTANTS =====
  const maxLayerCount = 3
  const fluteCount = flutes.length

  // ===== LOADING STATE =====
  if (loading) {
    return <LoadingState 
      message="Memuat data Sheet Settings..." 
      submessage="Harap tunggu sebentar" 
      icon="mdi:layers-triple" 
    />
  }

  // ===== RENDER =====
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
            <p className="text-slate-500 mt-1 text-sm">Kelola harga bahan sheet berdasarkan flute type</p>
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

      {/* ===== STATS CARDS ===== */}
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
            bar: (stats.withAllFlutes / stats.totalSubstances) * 100 || 0,
          },
          {
            icon: 'mdi:waveform',
            label: 'Flute Types',
            value: flutes.length,
            sub: `${flutes.map(f => f.code).join(' · ') || '-'}`,
          },
          {
            icon: 'mdi:chart-arc',
            label: 'Rata-rata Flute/Sheet',
            value: (stats.totalIndices / stats.totalSubstances || 0).toFixed(1),
            sub: `Total ${stats.totalIndices} indeks`,
            bar: fluteCount > 0 ? (stats.totalIndices / stats.totalSubstances / fluteCount) * 100 : 0,
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

      {/* ===== TABLE ===== */}
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
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                  options={[
                    { value: '5', label: '5' }, 
                    { value: '10', label: '10' }, 
                    { value: '20', label: '20' }, 
                    { value: '50', label: '50' }
                  ]}
                  className="w-20"
                />
              </div>
              <p className="text-sm text-gray-500">
                Menampilkan <span className="font-medium text-slate-700">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> -{' '}
                <span className="font-medium text-slate-700">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> dari{' '}
                <span className="font-medium text-slate-700">{pagination.totalItems}</span>
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
          {sheetSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data sheet substance</p>
              <p className="text-sm text-gray-400">Tambahkan sheet substance baru untuk memulai</p>
              <Button 
                onClick={() => setShowAddModal(true)} 
                variant="primary" 
                icon="mdi:plus"
                disabled={flutes.length === 0}
              >
                {flutes.length === 0 ? 'Tambah Flute Terlebih Dahulu' : 'Tambah Sheet Baru'}
              </Button>
            </div>
          ) : filteredSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
              <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
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
                  {flutes.map((flute, idx) => (
                    <th key={flute.code} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {flute.code}-Flute
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((substance, index) => {
                  const actualIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  const layerCodes = [substance.layer_1_gsm, substance.layer_2_gsm, substance.layer_3_gsm]
                  
                  return (
                    <tr key={substance.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{actualIndex}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {layerCodes.map((code, idx) => {
                                const meta = LAYER_META[code] || LAYER_META['K']
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={LAYER_META[substance.layer_1_gsm]?.bg || '#8B4513'} light={LAYER_META[substance.layer_1_gsm]?.light}>
                          {substance.layer_1}{substance.layer_1_gsm}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={LAYER_META[substance.layer_2_gsm]?.bg || '#8B4513'} light={LAYER_META[substance.layer_2_gsm]?.light}>
                          {substance.layer_2}{substance.layer_2_gsm}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={LAYER_META[substance.layer_3_gsm]?.bg || '#8B4513'} light={LAYER_META[substance.layer_3_gsm]?.light}>
                          {substance.layer_3}{substance.layer_3_gsm}
                        </Badge>
                      </td>
                      {flutes.map((flute, idx) => {
                        const price = substance[`${flute.code.toLowerCase()}_flute_price`] as number || 0
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
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            disabled={flutes.length === 0}
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
              Menampilkan <span className="font-medium text-slate-700">{paginatedData.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{filteredSubstances.length}</span> substance
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
            <Button
              variant="outline"
              size="md"
              onClick={handleCloseAddModal}
              disabled={isPosting}
            >
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
              <Icon icon="mdi:layers-triple" className="w-4 h-4 text-blue-500" />
              Konfigurasi Layer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([1, 2, 3] as const).map((num) => (
                <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
                  <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
                  <div className="space-y-3">
                    <Input
                      label="Gramasi *"
                      type="number"
                      value={addFormData[`layer_${num}` as keyof FormData] as string}
                      onChange={(e) => handleAddInputChange(`layer_${num}`, e.target.value)}
                      placeholder="125"
                      min="1"
                      step="1"
                      disabled={isPosting}
                      error={formErrors[`layer_${num}`]}
                      leftIcon="mdi:weight"
                    />
                    <Select
                      label="Jenis Kertas *"
                      value={addFormData[`layer_${num}_gsm` as keyof FormData] as string}
                      onChange={(e) => handleAddInputChange(`layer_${num}_gsm`, e.target.value)}
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
                <p className="text-yellow-800">Tidak ada flute yang tersedia. Harap tambahkan flute terlebih dahulu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addFormData.flutes.map((fluteCode) => {
                  const flute = flutes.find(f => f.code === fluteCode)
                  if (!flute) return null
                  const colorIdx = flutes.findIndex(f => f.code === fluteCode) % FLUTE_COLORS.length
                  const color = FLUTE_COLORS[colorIdx]
                  
                  return (
                    <Card key={fluteCode} shadow="sm" padding="md" className="border-l-4" style={{ borderLeftColor: color.bg }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{flute.name}</span>
                          <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                        </div>
                      </div>
                      <div>
                        <Input
                          label="Harga per m² *"
                          type="number"
                          value={addFormData.price_per_m2[fluteCode] || ''}
                          onChange={(e) => setAddFormData(prev => ({
                            ...prev,
                            price_per_m2: { ...prev.price_per_m2, [fluteCode]: e.target.value }
                          }))}
                          placeholder="0"
                          min="1"
                          disabled={isPosting}
                          error={formErrors[`price_${fluteCode}`]}
                          leftIcon="mdi:currency-usd"
                        />
                      </div>
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
        title={`Edit Sheet Substance`}
        size="xl"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={handleCloseEditModal}
              disabled={isPosting}
            >
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
                <p className="text-sm font-medium text-blue-800">Mengedit Sheet Substance</p>
                <p className="text-xs text-blue-600 mt-1">
                  Substance: <span className="font-semibold">{formatSubstanceDisplay(editingItem)}</span>
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
                {([1, 2, 3] as const).map((num) => (
                  <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
                    <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
                    <div className="space-y-3">
                      <Input
                        label="Gramasi *"
                        type="number"
                        value={editFormData[`layer_${num}` as keyof FormData] as string}
                        onChange={(e) => handleEditInputChange(`layer_${num}`, e.target.value)}
                        placeholder="125"
                        min="1"
                        step="1"
                        disabled={isPosting}
                        error={formErrors[`layer_${num}`]}
                        leftIcon="mdi:weight"
                      />
                      <Select
                        label="Jenis Kertas *"
                        value={editFormData[`layer_${num}_gsm` as keyof FormData] as string}
                        onChange={(e) => handleEditInputChange(`layer_${num}_gsm`, e.target.value)}
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
                  <p className="text-yellow-800">Tidak ada flute yang tersedia.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                    <Icon icon="mdi:alert-circle" className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-700">Semua flute types harus diisi dengan harga yang valid.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editFormData.flutes.map((fluteCode) => {
                      const flute = flutes.find(f => f.code === fluteCode)
                      if (!flute) return null
                      const colorIdx = flutes.findIndex(f => f.code === fluteCode) % FLUTE_COLORS.length
                      const color = FLUTE_COLORS[colorIdx]
                      
                      return (
                        <Card key={fluteCode} shadow="sm" padding="md" className="border-l-4" style={{ borderLeftColor: color.bg }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{flute.name}</span>
                              <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                            </div>
                          </div>
                          <div>
                            <Input
                              label="Harga per m² *"
                              type="number"
                              value={editFormData.price_per_m2[fluteCode] || ''}
                              onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                price_per_m2: { ...prev.price_per_m2, [fluteCode]: e.target.value }
                              }))}
                              placeholder="0"
                              min="1"
                              disabled={isPosting}
                              error={formErrors[`price_${fluteCode}`]}
                              leftIcon="mdi:currency-usd"
                            />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}
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
        {selectedItem && (() => {
          const layerCodes = [selectedItem.layer_1_gsm, selectedItem.layer_2_gsm, selectedItem.layer_3_gsm]
          const layerGrams = [selectedItem.layer_1, selectedItem.layer_2, selectedItem.layer_3]
          
          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
                  <Icon icon="mdi:layers-triple" className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{formatSubstanceDisplay(selectedItem)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {layerCodes.map((code, idx) => (
                        <span
                          key={idx}
                          className="w-5 h-5 rounded text-xs font-bold text-white flex items-center justify-center"
                          style={{ background: LAYER_META[code]?.bg || '#8B4513' }}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{selectedItem.substance_code}</span>
                  </div>
                </div>
              </div>

              {/* Layer Details */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Komposisi Layer</p>
                <div className="space-y-2">
                  {[1, 2, 3].map((num) => {
                    const code = selectedItem[`layer_${num}_gsm`] as string
                    const gram = selectedItem[`layer_${num}`] as string
                    const meta = LAYER_META[code] || LAYER_META['K']
                    
                    return (
                      <div key={num} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500 w-16">Layer {num}:</span>
                          <Badge color={meta.bg} light={`${meta.bg}20`}>
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
                    const price = selectedItem[`${flute.code.toLowerCase()}_flute_price`] as number || 0
                    const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                    
                    return (
                      <div key={flute.code} className="flex items-center justify-between p-2 bg-slate-50 rounded">
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
                    {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Diperbarui</p>
                  <p className="text-sm text-slate-700">
                    {selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
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