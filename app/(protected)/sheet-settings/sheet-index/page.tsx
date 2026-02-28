'use client'
// app/(protected)/sheet-settings/sheet-index/page.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
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
  [key: string]: string | number  // FIX: replaces `any` for dynamic flute price fields
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

// ===== MAIN COMPONENT =====
export default function SheetSettingsPage() {
  const router = useRouter()

  const [sheetSubstances, setSheetSubstances] = useState<SheetSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SheetSubstance | null>(null)

  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [stats, setStats] = useState<Stats>({
    totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0, totalIndices: 0
  })

  // ===== DERIVED DATA =====
  const filteredSubstances = useMemo(() => sheetSubstances, [sheetSubstances])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return filteredSubstances.slice(start, start + pagination.itemsPerPage)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  // ===== AUTO SELECT ALL FLUTES FOR ADD MODAL =====
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
    window.scrollTo({ top: 600, behavior: 'smooth' })
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
      const response = await axios.get('/Admin/Flutes/Flutes', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
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

      const response = await axios.get<ApiResponse | SheetIndexApiItem[]>('/Admin/Sheet/sheetIndex', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      const responseData: SheetIndexApiItem[] = Array.isArray(response.data)
        ? response.data
        : (response.data as ApiResponse)?.data || []

      if (!Array.isArray(responseData)) throw new Error('Invalid response format')

      // Group by substance_id
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
      setStats({ totalSubstances: processed.length, activeSubstances: processed.length, withAllFlutes: processed.length, totalIndices: responseData.length })
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
  }, [])

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
      await Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi' })
      return
    }

    try {
      setIsPosting(true)
      const response = await axios.post('/Admin/Sheet/sheetIndexAdd', buildPayload(addFormData), {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      if (response.data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil ditambahkan', timer: 2000, showConfirmButton: true })
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
        await fetchSheetIndex()
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal!', text: response.data?.message || 'Gagal menambahkan data' })
      }
    } catch (err: unknown) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Terjadi kesalahan') })
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
      await Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi' })
      return
    }

    try {
      setIsPosting(true)
      const response = await axios.put('/Admin/Sheet/sheetIndexUpdate', {
        substance_id: parseInt(editingItem.id),
        ...buildPayload(editFormData)
      }, { headers: { 'ngrok-skip-browser-warning': 'true' } })

      if (response.data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui', timer: 2000, showConfirmButton: true })
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
        await fetchSheetIndex()
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal!', text: response.data?.message || 'Gagal memperbarui data' })
      }
    } catch (err: unknown) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Terjadi kesalahan server') })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE HANDLER =====
  const handleDelete = async (id: string, substanceCode: string) => {
    const result = await Swal.fire({
      icon: 'question',
      title: `Hapus kombinasi ${substanceCode}?`,
      text: 'Data yang dihapus tidak dapat dikembalikan',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280'
    })
    if (!result.isConfirmed) return

    try {
      const response = await axios.delete(`/Admin/Sheet/sheetIndexDelete/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      if (response.data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil dihapus', timer: 2000, showConfirmButton: true })
        await fetchSheetIndex()
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal!', text: response.data?.message || 'Gagal menghapus data' })
      }
    } catch (err: unknown) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Terjadi kesalahan') })
    }
  }

  // ===== REFRESH HANDLER =====
  const handleRefreshAll = async () => {
    const result = await Swal.fire({
      icon: 'question', title: 'Refresh Data?', text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return

    setLoading(true)
    try {
      await fetchFlutes()
      await fetchSheetIndex()
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui', timer: 2000, showConfirmButton: true })
    } catch (err: unknown) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal memperbarui data') })
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

  // ===== LAYER FORM (reusable for Add & Edit) =====
  const LayerFields = ({ formData, onChange }: { formData: FormData; onChange: (field: string, value: string) => void }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {([1, 2, 3] as const).map((num) => (
        <div key={num} className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Layer {num}</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gramasi *</label>
              <Input
                type="number"
                value={formData[`layer_${num}` as keyof FormData] as string}
                onChange={(e) => onChange(`layer_${num}`, e.target.value)}
                placeholder="125"
                min="1"
                step="1"
                disabled={isPosting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              />
              {formErrors[`layer_${num}`] && (
                <p className="text-xs text-red-600 mt-1">{formErrors[`layer_${num}`]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kertas *</label>
              <Select
                value={formData[`layer_${num}_gsm` as keyof FormData] as string}
                onChange={(e) => onChange(`layer_${num}_gsm`, e.target.value)}
                options={LAYER_TYPE_OPTIONS}
                disabled={isPosting}
              />
            </div>
            
          </div>
        </div>
      ))}
    </div>
  )

  // ===== FLUTE PRICING FORM (reusable for Add & Edit) =====
  const FlutePricingFields = ({ formData, setFormData }: {
    formData: FormData
    setFormData: React.Dispatch<React.SetStateAction<FormData>>
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {formData.flutes.map((fluteCode) => {
        const flute = flutes.find(f => f.code === fluteCode)
        if (!flute) return null
        return (
          <div key={fluteCode} className="bg-white p-4 rounded-lg border border-gray-200 text-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">{flute.name}</span>
              </div>
              <Badge variant="success" className="text-xs">Wajib Diisi</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga per m² *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">Rp</span>
                </div>
                <Input
                  type="number"
                  value={formData.price_per_m2[fluteCode] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    price_per_m2: { ...prev.price_per_m2, [fluteCode]: e.target.value }
                  }))}
                  placeholder="0"
                  min="1"
                  disabled={isPosting}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {formErrors[`price_${fluteCode}`] && (
                <p className="text-xs text-red-600 mt-1">{formErrors[`price_${fluteCode}`]}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  // ===== RENDER =====
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sheet Settings</h1>
          <p className="text-gray-600 mt-1">Kelola harga bahan sheet berdasarkan flute type</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Substances', value: stats.totalSubstances, icon: 'mdi:layers-triple', color: 'blue' },
          { title: 'Complete Pricing', value: stats.withAllFlutes, icon: 'mdi:currency-usd-circle', color: 'green' },
          { title: 'Flute Types', value: flutes.length, icon: 'mdi:waveform', color: 'purple' },
          { title: 'Showing', value: `${paginatedData.length} / ${filteredSubstances.length}`, icon: 'mdi:table-of-contents', color: 'teal' }
        ].map((stat, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <Icon icon={stat.icon} className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="border border-gray-200 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:clipboard-list-outline" className="text-blue-600" />
              All Sheet Substances
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalSubstances} kombinasi bahan sheet ({flutes.length} flute types)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRefreshAll} className="flex items-center gap-2">
              <Icon icon="mdi:refresh" className="w-4 h-4" /> Refresh
            </Button>
            <Button variant="outline" onClick={() => router.push('/flute-settings')} className="flex items-center gap-2">
              <Icon icon="mdi:open-in-new" className="w-4 h-4" /> Kelola Flutes
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={flutes.length === 0}
            >
              <Icon icon="mdi:plus" className="w-4 h-4" /> Tambah Sheet
            </Button>
          </div>
        </div>

        {/* Pagination Top */}
        {filteredSubstances.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{paginatedData.length}</span> dari{' '}
              <span className="font-semibold">{filteredSubstances.length}</span> substances
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per halaman:</span>
                <Select
                  value={pagination.itemsPerPage.toString()}
                  onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                  options={[{ value: '5', label: '5' }, { value: '10', label: '10' }, { value: '20', label: '20' }, { value: '50', label: '50' }]}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-3 py-1">
                  <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: React.ReactNode[] = []
                    const max = 5
                    let start = Math.max(1, pagination.currentPage - Math.floor(max / 2))
                    let end = Math.min(pagination.totalPages, start + max - 1)
                    if (end - start + 1 < max) start = Math.max(1, end - max + 1)

                    if (start > 1) {
                      pages.push(<button key={1} onClick={() => handlePageChange(1)} className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600">1</button>)
                      if (start > 2) pages.push(<span key="dots1" className="px-2">...</span>)
                    }
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button key={i} onClick={() => handlePageChange(i)} className={`px-3 py-1 text-sm rounded ${pagination.currentPage === i ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>
                          {i}
                        </button>
                      )
                    }
                    if (end < pagination.totalPages) {
                      if (end < pagination.totalPages - 1) pages.push(<span key="dots2" className="px-2">...</span>)
                      pages.push(<button key={pagination.totalPages} onClick={() => handlePageChange(pagination.totalPages)} className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600">{pagination.totalPages}</button>)
                    }
                    return pages
                  })()}
                </div>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-3 py-1">
                  <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {sheetSubstances.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg mx-6 mb-6 bg-gray-50">
            <Icon icon="mdi:database-off" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
            <p className="text-gray-500 mb-6">Belum ada sheet substance yang ditambahkan</p>
            <Button onClick={() => setShowAddModal(true)} variant="primary" icon="mdi:plus" className="bg-gradient-to-r from-blue-600 to-blue-700" disabled={flutes.length === 0}>
              {flutes.length === 0 ? 'Tambah Flute Terlebih Dahulu' : 'Tambah Sheet Substance Pertama'}
            </Button>
            {flutes.length === 0 && (
              <p className="text-xs text-red-600 mt-3">
                <Icon icon="mdi:alert-circle" className="w-4 h-4 inline mr-1" />
                Harap tambahkan flute terlebih dahulu
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'Substance', 'Layer 1', 'Layer 2', 'Layer 3', ...flutes.map(f => `${f.code}-Flute`), 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((substance, index) => {
                  const actualIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  const FLUTE_COLORS = ['text-green-600', 'text-blue-600', 'text-purple-600', 'text-orange-600', 'text-red-600', 'text-indigo-600', 'text-pink-600', 'text-teal-600']
                  return (
                    <tr key={substance.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{actualIndex}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{formatSubstanceDisplay(substance)}</div>
                        <div className="text-xs text-gray-500 mt-1">{substance.substance_code}</div>
                      </td>
                      {(['layer_1', 'layer_2', 'layer_3'] as const).map(layer => (
                        <td key={layer} className="px-6 py-4 text-gray-700">
                            {substance[layer]}{substance[`${layer}_gsm`]}
                        </td>
                      ))}
                      {flutes.map((flute, idx) => (
                        <td key={flute.code} className="px-6 py-4">
                          <div className={`font-medium ${FLUTE_COLORS[idx % FLUTE_COLORS.length]}`}>
                            {formatCurrency(substance[`${flute.code.toLowerCase()}_flute_price`] as number || 0)}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(substance)} className="text-blue-700 border-blue-200 hover:bg-blue-50" disabled={flutes.length === 0}>
                            <Icon icon="mdi:pencil" className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(substance.id, substance.substance_code)} className="text-red-700 border-red-200 hover:bg-red-50">
                            <Icon icon="mdi:delete" className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bottom */}
        {filteredSubstances.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200 px-6 pb-6">
            <div className="text-sm text-gray-500">
              Menampilkan <span className="font-semibold">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> -{' '}
              <span className="font-semibold">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> dari{' '}
              <span className="font-semibold">{pagination.totalItems}</span> substances
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Halaman {pagination.currentPage} dari {pagination.totalPages}</span>
              <div className="flex gap-1">
                {[
                  { icon: 'mdi:skip-backward', page: 1, title: 'Halaman pertama', disabled: pagination.currentPage === 1 },
                  { icon: 'mdi:chevron-left', page: pagination.currentPage - 1, title: 'Halaman sebelumnya', disabled: pagination.currentPage === 1 },
                  { icon: 'mdi:chevron-right', page: pagination.currentPage + 1, title: 'Halaman berikutnya', disabled: pagination.currentPage === pagination.totalPages },
                  { icon: 'mdi:skip-forward', page: pagination.totalPages, title: 'Halaman terakhir', disabled: pagination.currentPage === pagination.totalPages }
                ].map(({ icon, page, title, disabled }) => (
                  <Button key={icon} variant="outline" size="sm" onClick={() => handlePageChange(page)} disabled={disabled} className="px-2 py-1" title={title}>
                    <Icon icon={icon} className="w-4 h-4" />
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Ke halaman:</span>
                <Input
                  type="number"
                  min="1"
                  max={pagination.totalPages}
                  value={pagination.currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= pagination.totalPages) handlePageChange(page)
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={handleCloseAddModal} title="Tambah Sheet Substance" size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAddSave} loading={isPosting} disabled={isPosting || flutes.length === 0}>
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">Konfigurasi Layer</h3>
            <LayerFields formData={addFormData} onChange={handleAddInputChange} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">Harga per Flute</h3>
            {flutes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
                <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">Tidak ada flute yang tersedia. Harap tambahkan flute terlebih dahulu di halaman Kelola Flutes.</p>
              </div>
            ) : (
              addFormData.flutes.length > 0 && <FlutePricingFields formData={addFormData} setFormData={setAddFormData} />
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title="Edit Sheet Substance" size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEditSave} loading={isPosting} disabled={isPosting || flutes.length === 0}>
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Konfigurasi Layer</h3>
              <LayerFields formData={editFormData} onChange={handleEditInputChange} />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Harga per Flute</h3>
              {flutes.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
                  <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800">Tidak ada flute yang tersedia. Harap tambahkan flute terlebih dahulu di halaman Kelola Flutes.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                    <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">Semua flute types harus diisi. Harap periksa harga untuk semua flute.</p>
                  </div>
                  {editFormData.flutes.length > 0 && <FlutePricingFields formData={editFormData} setFormData={setEditFormData} />}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}