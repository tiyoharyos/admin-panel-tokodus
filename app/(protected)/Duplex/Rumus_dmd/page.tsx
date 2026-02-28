// app/(protected)/duplex-dmd/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import EmptyState from '@/components/UI/EmptyState'

// ===== TYPE DEFINITIONS =====
interface DuplexDMDData {
  id: number
  panjang: number
  lebar: number
  harga_per_lembar: number
  gsm: number
  type: 'DMD'
  pl?: string
  sheet_size_id?: string
  gramasi_id?: string
}

interface FormData {
  sheet_size_id: string
  gramasi_id: string
  harga_per_lembar: string
}

interface Stats {
  totalRecords: number
  averagePrice: number
  totalCombinations: number
}

// ===== API TYPES =====
interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

interface GramasiItem {
  id: string
  material_id: string
  gsm: string
}

interface SheetSizeItem {
  id_sh: string
  panjang_sh: string
  lebar_sh: string
}

interface GramasiApiResponse {
  status: number
  data?: GramasiItem[]
}

interface DuplexMduplekItem {
  id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
  id_sh: string
  panjang_mm: string
  lebar_mm: string
}

interface CreateDuplexDMDRequest {
  gramasi: string
  pl: string
  harga_per_lembar: string
}

interface UpdateDuplexDMDRequest {
  gramasi: string
  pl: string
  harga_per_lembar: string
}

// ===== CONSTANTS =====
const BASE_FORM: FormData = {
  sheet_size_id: '',
  gramasi_id: '',
  harga_per_lembar: ''
}

// ===== SWAL UTILITIES =====
const showSuccess = (title: string, message: string) =>
  Swal.fire({ icon: 'success', title, text: message, timer: 2000, showConfirmButton: false, position: 'top-end', toast: true })

const showError = (title: string, message: string) =>
  Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#EF4444' })

const showWarning = (title: string, message: string) =>
  Swal.fire({ icon: 'warning', title, text: message, confirmButtonColor: '#F59E0B' })

const showInfo = (title: string, message: string) =>
  Swal.fire({ icon: 'info', title, text: message, confirmButtonColor: '#3B82F6' })

const showConfirmDelete = (message: string) =>
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  })

const showConfirmAction = (title: string, message: string) =>
  Swal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal'
  })

// ===== UTILITIES =====
const formatUkuranDisplay = (panjang: number, lebar: number): string => {
  if (!panjang || !lebar || isNaN(panjang) || isNaN(lebar) || panjang === 0 || lebar === 0) return '-'
  return `${panjang} × ${lebar} cm`
}

const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getGSMBadgeClass = (gsm: number): string => {
  if (gsm <= 270) return 'bg-blue-100 text-blue-800 border border-blue-200'
  if (gsm <= 350) return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  return 'bg-red-100 text-red-800 border border-red-200'
}

const buildSheetLabel = (panjang_mm: string, lebar_mm: string): string => {
  const panjangCm = parseInt(panjang_mm) / 10
  const lebarCm = parseInt(lebar_mm) / 10
  if (!isNaN(panjangCm) && !isNaN(lebarCm) && panjangCm > 0 && lebarCm > 0) {
    return `${panjangCm} × ${lebarCm} cm`
  }
  return `${panjang_mm} × ${lebar_mm} mm`
}

// ===== CUSTOM HOOK =====
const useDuplexDMD = () => {
  const [duplexData, setDuplexData] = useState<DuplexDMDData[]>([])
  const [gramasiList, setGramasiList] = useState<GramasiItem[]>([])
  const [sheetSizeList, setSheetSizeList] = useState<SheetSizeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingGramasi, setLoadingGramasi] = useState(false)

  const fetchGramasi = useCallback(async () => {
    try {
      setLoadingGramasi(true)
      const response = await axios.get<GramasiApiResponse>('Admin/Duplek/gramasiIndex')
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        const seen = new Set<string>()
        const unique = response.data.data.filter(item => {
          if (!item.id || seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
        setGramasiList(unique)
      } else {
        setGramasiList([])
      }
    } catch (err) {
      console.error('Error fetching gramasi:', err)
      setGramasiList([])
    } finally {
      setLoadingGramasi(false)
    }
  }, [])

  const fetchDuplexData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get<ApiResponse<DuplexMduplekItem[]>>('Admin/Duplek/duplekMduplekPrices')

      let priceData: DuplexMduplekItem[] = []
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        priceData = response.data.data
      }

      if (priceData.length === 0) {
        setDuplexData([])
        setSheetSizeList([])
        setError('Belum ada data DMD. Silakan tambah data baru.')
        return
      }

      // ===== BUILD SHEET SIZE LIST =====
      const seenSizes = new Map<string, SheetSizeItem>()
      priceData.forEach(item => {
        if (item.id_sh && !seenSizes.has(item.id_sh)) {
          seenSizes.set(item.id_sh, {
            id_sh: item.id_sh,
            panjang_sh: item.panjang_mm,
            lebar_sh: item.lebar_mm
          })
        }
      })
      setSheetSizeList(
        Array.from(seenSizes.values()).sort((a, b) => parseInt(a.id_sh) - parseInt(b.id_sh))
      )

      // ===== PROCESS PRICES DATA (simplified) =====
      const processedData: DuplexDMDData[] = priceData
        .filter(item => item.panjang_mm && item.lebar_mm && item.gsm)
        .map(item => ({
          id: parseInt(item.id),
          panjang: parseInt(item.panjang_mm) / 10,
          lebar: parseInt(item.lebar_mm) / 10,
          harga_per_lembar: parseFloat(item.harga_lembar) || 0,
          gsm: parseInt(item.gsm),
          type: 'DMD' as const,
          pl: `${item.panjang_mm}x${item.lebar_mm}`,
          sheet_size_id: item.id_sh,
          gramasi_id: item.gsm
        }))
        .filter(item => item.panjang > 0 && item.lebar > 0 && item.gsm > 0)

      setDuplexData(processedData)
      setError(null)

    } catch (err: unknown) {
      console.error('Error fetching Duplex DMD data:', err)
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string }, status?: number } }
        setError(e.response?.status === 404
          ? 'Endpoint tidak ditemukan.'
          : e.response?.data?.message || 'Gagal mengambil data DMD'
        )
      } else {
        setError('Gagal mengambil data DMD')
      }
      setDuplexData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateStats = (data: DuplexDMDData[]): Stats => {
    const totalRecords = data.length
    const totalPrice = data.reduce((sum, item) => sum + (item.harga_per_lembar || 0), 0)
    const uniqueCombinations = new Set(
      data.map(item => `${item.panjang}x${item.lebar}x${item.gsm}`)
    ).size
    return {
      totalRecords,
      averagePrice: totalRecords > 0 ? totalPrice / totalRecords : 0,
      totalCombinations: uniqueCombinations
    }
  }

  useEffect(() => {
    fetchGramasi()
    fetchDuplexData()
  }, [fetchGramasi, fetchDuplexData])

  const stats = useMemo(() => calculateStats(duplexData), [duplexData])

  return { duplexData, gramasiList, sheetSizeList, loading, error, loadingGramasi, stats, refetch: fetchDuplexData }
}

// ===== MAIN COMPONENT =====
export default function DuplexDMDPage() {
  const { duplexData, gramasiList, sheetSizeList, loading, error, loadingGramasi, stats, refetch } = useDuplexDMD()

  const [isPosting, setIsPosting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DuplexDMDData | null>(null)

  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [selectedSize, setSelectedSize] = useState<SheetSizeItem | null>(null)
  const [selectedGramasi, setSelectedGramasi] = useState<GramasiItem | null>(null)
  const [editSelectedSize, setEditSelectedSize] = useState<SheetSizeItem | null>(null)
  const [editSelectedGramasi, setEditSelectedGramasi] = useState<GramasiItem | null>(null)

  const sortedDuplexData = useMemo(() => {
    return [...duplexData].sort((a, b) => {
      if (a.gsm !== b.gsm) return a.gsm - b.gsm
      return (a.panjang * a.lebar) - (b.panjang * b.lebar)
    })
  }, [duplexData])

  const sheetSizeOptions = useMemo(() =>
    sheetSizeList.map((item, idx) => ({
      value: item.id_sh,
      label: buildSheetLabel(item.panjang_sh, item.lebar_sh),
      key: `sh-${item.id_sh}-${idx}`
    })), [sheetSizeList])

  const gramasiOptions = useMemo(() =>
    gramasiList.map((item, idx) => ({
      value: item.id,
      label: `${item.gsm} GSM`,
      key: `gr-${item.id}-${idx}`
    })), [gramasiList])

  // ===== VALIDATION =====
  const validateForm = (formData: FormData, isEdit = false): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.sheet_size_id) errors.sheet_size_id = 'Ukuran tidak boleh kosong'
    if (!formData.gramasi_id) errors.gramasi_id = 'GSM tidak boleh kosong'
    if (formData.harga_per_lembar && isNaN(parseFloat(formData.harga_per_lembar))) {
      errors.harga_per_lembar = 'Harga harus berupa angka'
    }
    if (!isEdit && formData.sheet_size_id && formData.gramasi_id) {
      const isDuplicate = duplexData.some(item =>
        item.sheet_size_id === formData.sheet_size_id && item.gramasi_id === formData.gramasi_id
      )
      if (isDuplicate) {
        const size = sheetSizeList.find(s => s.id_sh === formData.sheet_size_id)
        if (size) errors.general = `Kombinasi ${buildSheetLabel(size.panjang_sh, size.lebar_sh)} (${formData.gramasi_id} GSM) sudah ada`
      }
    }
    return errors
  }

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    const errors = validateForm(addFormData, false)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showError('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    const payload: CreateDuplexDMDRequest = {
      gramasi: addFormData.gramasi_id,
      pl: addFormData.sheet_size_id,
      harga_per_lembar: addFormData.harga_per_lembar || '0'
    }

    try {
      setIsPosting(true)
      const response = await axios.post<ApiResponse>('Admin/Duplek/duplekMduplekPricesAdd', payload)
      if (response.status === 200 && response.data?.status === 200) {
        await refetch()
        showSuccess('Berhasil!', response.data?.message || 'Data berhasil ditambahkan')
        setShowAddModal(false)
        resetAddForm()
      } else {
        throw new Error(response.data?.message || 'Gagal menambahkan data')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })
        ?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      showError('Error!', msg)
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    const errors = validateForm(editFormData, true)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showError('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    const payload: UpdateDuplexDMDRequest = {
      gramasi: editFormData.gramasi_id,
      pl: editFormData.sheet_size_id,
      harga_per_lembar: editFormData.harga_per_lembar || '0'
    }

    try {
      setIsPosting(true)
      const response = await axios.put<ApiResponse>(
        `Admin/Duplek/duplekMduplekPricesEdit/${editingItem.id}`,
        payload
      )
      if (response.status === 200 && response.data?.status === 200) {
        await refetch()
        showSuccess('Berhasil!', response.data?.message || 'Data berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        resetEditForm()
      } else {
        throw new Error(response.data?.message || 'Gagal mengupdate data')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })
        ?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      showError('Error!', msg)
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const result = await showConfirmDelete('Data yang dihapus tidak dapat dikembalikan')
    if (!result.isConfirmed) return

    try {
      setIsPosting(true)
      const response = await axios.delete<ApiResponse>(`Admin/Duplek/duplekMduplekPricesDel/${id}`)
      if (response.status === 200) {
        await refetch()
        showSuccess('Berhasil!', response.data?.message || 'Data berhasil dihapus')
      } else {
        throw new Error(response.data?.message || 'Gagal menghapus data')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })
        ?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      showError('Error!', msg)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== UI HANDLERS =====
  const handleAddClick = () => {
    resetAddForm()
    if (gramasiList.length === 0) {
      showWarning('Peringatan', 'Data belum tersedia, coba refresh halaman')
      return
    }
    setShowAddModal(true)
  }

  const handleEditClick = (item: DuplexDMDData) => {
    setEditingItem(item)
    setEditFormData({
      sheet_size_id: item.sheet_size_id || '',
      gramasi_id: item.gramasi_id || '',
      harga_per_lembar: item.harga_per_lembar ? item.harga_per_lembar.toString() : ''
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleRefresh = async () => {
    const result = await showConfirmAction('Refresh Data?', 'Data akan dimuat ulang dari server.')
    if (result.isConfirmed) {
      try {
        await refetch()
        showSuccess('Berhasil!', 'Data berhasil diperbarui')
      } catch {
        showError('Error!', 'Gagal memperbarui data')
      }
    }
  }

  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '', general: '' }))
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const resetAddForm = () => {
    setAddFormData({ ...BASE_FORM })
    setSelectedSize(null)
    setSelectedGramasi(null)
    setFormErrors({})
  }

  const resetEditForm = () => {
    setEditFormData({ ...BASE_FORM })
    setEditSelectedSize(null)
    setEditSelectedGramasi(null)
    setFormErrors({})
  }

  const handleCloseAddModal = () => {
    if (!isPosting) { setShowAddModal(false); resetAddForm() }
  }

  const handleCloseEditModal = () => {
    if (!isPosting) { setShowEditModal(false); setEditingItem(null); resetEditForm() }
  }

  // ===== SYNC SELECTED ITEMS =====
  useEffect(() => {
    setSelectedSize(sheetSizeList.find(i => i.id_sh === addFormData.sheet_size_id) || null)
  }, [addFormData.sheet_size_id, sheetSizeList])

  useEffect(() => {
    setSelectedGramasi(gramasiList.find(i => i.id === addFormData.gramasi_id) || null)
  }, [addFormData.gramasi_id, gramasiList])

  useEffect(() => {
    setEditSelectedSize(sheetSizeList.find(i => i.id_sh === editFormData.sheet_size_id) || null)
  }, [editFormData.sheet_size_id, sheetSizeList])

  useEffect(() => {
    setEditSelectedGramasi(gramasiList.find(i => i.id === editFormData.gramasi_id) || null)
  }, [editFormData.gramasi_id, gramasiList])

  // ===== RENDER STATES =====
  if (loading && duplexData.length === 0 && !error) {
    return <LoadingState message="Memuat Data Duplex DMD..." />
  }

  if (error && duplexData.length === 0) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:book-open-variant" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Duplex DMD
            </h1>
            <p className="text-gray-600 mt-1">Kelola ukuran dan harga Duplex DMD</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-gray-600"><span className="font-medium">Total Records:</span> {stats.totalRecords}</span>
              <span className="text-gray-600"><span className="font-medium">Gramasi:</span> {gramasiList.length} data</span>
              <span className="text-gray-600"><span className="font-medium">Ukuran:</span> {sheetSizeList.length} data</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} icon="mdi:refresh" disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleAddClick}
            icon="mdi:plus"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          >
            Tambah Ukuran DMD
          </Button>
        </div>
      </div>

      {/* ===== INFO MESSAGE ===== */}
      {error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-2">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800">{error}</p>
        </div>
      )}

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:database" className="w-4 h-4 text-blue-600" /> Total Records
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRecords.toLocaleString()}</p>
            <p className="text-xs text-gray-500">data tersimpan</p>
          </div>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:ruler-square" className="w-4 h-4 text-green-600" /> Kombinasi Ukuran
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCombinations}</p>
            <p className="text-xs text-gray-500">unik kombinasi</p>
          </div>
        </Card>
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-purple-600" /> Rata-rata Harga
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.averagePrice > 0 ? formatCurrency(stats.averagePrice) : '-'}
            </p>
            <p className="text-xs text-gray-500">per lembar</p>
          </div>
        </Card>
      </div>

      {/* ===== TABLE CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-blue-600" />
              Daftar Ukuran Duplex DMD
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.totalRecords} data dengan {stats.totalCombinations} kombinasi ukuran
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              <Icon icon="mdi:sort-numeric-ascending" className="w-3 h-3 mr-1" />
              Urut berdasarkan GSM
            </Badge>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memuat ulang...</span>
              </div>
            )}
          </div>
        </div>

        {sortedDuplexData.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon="mdi:package-variant"
              title="Belum ada data Duplex DMD"
              message="Silakan tambah data baru"
              actionLabel="Tambah Data"
              onAction={handleAddClick}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">GSM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ukuran (cm)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Harga per Lembar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDuplexData.map((item, index) => {
                  const luasM2 = (item.panjang * item.lebar) / 10000
                  const hargaPerM2 = item.harga_per_lembar > 0 ? item.harga_per_lembar / luasM2 : 0

                  return (
                    <tr key={`dmd-${item.id}`} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getGSMBadgeClass(item.gsm)}>{item.gsm} GSM</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {formatUkuranDisplay(item.panjang, item.lebar)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.harga_per_lembar > 0 ? (
                          <>
                            <div className="font-bold text-gray-900">{formatCurrency(item.harga_per_lembar)}</div>
                            <div className="text-xs text-gray-500 mt-1">{formatCurrency(hargaPerM2)}/m²</div>
                          </>
                        ) : (
                          <div className="font-medium text-gray-400 italic">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
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
        )}

        {sortedDuplexData.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Menampilkan {sortedDuplexData.length} dari {stats.totalRecords} data
            </div>
            <button
              onClick={() => showInfo('Export', 'Exporting duplex DMD data...')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Icon icon="mdi:export" className="w-4 h-4" />
              <span className="text-sm font-medium">Export Data</span>
            </button>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Ukuran Duplex DMD"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Informasi</p>
              <p className="text-xs text-blue-600 mt-1">
                Pilih GSM dan Ukuran yang tersedia. Harga boleh dikosongkan atau diisi 0 jika belum ada.
              </p>
            </div>
          </div>

          {/* GSM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSM <span className="text-red-500">*</span>
            </label>
            {loadingGramasi ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">Memuat data gramasi...</span>
              </div>
            ) : (
              <Select
                value={addFormData.gramasi_id}
                onChange={(e) => handleAddInputChange('gramasi_id', e.target.value)}
                options={gramasiOptions}
                placeholder="-- Pilih GSM --"
                disabled={isPosting}
                className={formErrors.gramasi_id ? 'border-red-500' : ''}
              />
            )}
            {formErrors.gramasi_id && <p className="text-xs text-red-600 mt-2">{formErrors.gramasi_id}</p>}
          </div>

          {/* Ukuran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ukuran <span className="text-red-500">*</span>
            </label>
            <Select
              value={addFormData.sheet_size_id}
              onChange={(e) => handleAddInputChange('sheet_size_id', e.target.value)}
              options={sheetSizeOptions}
              placeholder="-- Pilih Ukuran --"
              disabled={isPosting}
              className={formErrors.sheet_size_id ? 'border-red-500' : ''}
            />
            {formErrors.sheet_size_id && <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>}
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Harga per Lembar</label>
            <Input
              type="number"
              value={addFormData.harga_per_lembar}
              onChange={(e) => handleAddInputChange('harga_per_lembar', e.target.value)}
              placeholder="0"
              leftIcon="mdi:cash"
              disabled={isPosting}
              min="0"
            />
            {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
          </div>

          {/* Preview */}
          {selectedSize && selectedGramasi && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600" />
                Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Ukuran:</p>
                  <p className="font-medium text-gray-900">{buildSheetLabel(selectedSize.panjang_sh, selectedSize.lebar_sh)}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">GSM:</p>
                  <p className="font-medium text-gray-900">{selectedGramasi.gsm} GSM</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">PL Format:</p>
                  <p className="font-mono text-gray-900">{selectedSize.panjang_sh}x{selectedSize.lebar_sh}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Harga:</p>
                  <p className="font-medium text-gray-900">
                    {addFormData.harga_per_lembar && parseFloat(addFormData.harga_per_lembar) > 0
                      ? formatCurrency(parseFloat(addFormData.harga_per_lembar))
                      : <span className="text-gray-400 italic">(kosong / 0)</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {formErrors.general && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3">
              <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{formErrors.general}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Ukuran Duplex DMD"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEdit} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Menyimpan...' : 'Update'}
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Current Data */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">Data Saat Ini</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 mb-1">Ukuran:</p>
                      <p className="font-medium text-blue-900">{formatUkuranDisplay(editingItem.panjang, editingItem.lebar)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">GSM:</p>
                      <p className="font-medium text-blue-900">{editingItem.gsm} GSM</p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Harga:</p>
                      <p className="font-medium text-blue-900">
                        {editingItem.harga_per_lembar > 0
                          ? formatCurrency(editingItem.harga_per_lembar)
                          : <span className="text-gray-400 italic">-</span>
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ukuran Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukuran Baru <span className="text-red-500">*</span>
              </label>
              <Select
                value={editFormData.sheet_size_id}
                onChange={(e) => handleEditInputChange('sheet_size_id', e.target.value)}
                options={sheetSizeOptions}
                placeholder="-- Pilih Ukuran --"
                disabled={isPosting}
                className={formErrors.sheet_size_id ? 'border-red-500' : ''}
              />
              {formErrors.sheet_size_id && <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>}
            </div>

            {/* GSM Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSM Baru <span className="text-red-500">*</span>
              </label>
              <Select
                value={editFormData.gramasi_id}
                onChange={(e) => handleEditInputChange('gramasi_id', e.target.value)}
                options={gramasiOptions}
                placeholder="-- Pilih GSM --"
                disabled={isPosting}
                className={formErrors.gramasi_id ? 'border-red-500' : ''}
              />
              {formErrors.gramasi_id && <p className="text-xs text-red-600 mt-2">{formErrors.gramasi_id}</p>}
            </div>

            {/* Harga Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Harga Baru</label>
              <Input
                type="number"
                value={editFormData.harga_per_lembar}
                onChange={(e) => handleEditInputChange('harga_per_lembar', e.target.value)}
                placeholder="Kosongkan atau isi 0 jika belum ada harga"
                leftIcon="mdi:cash"
                disabled={isPosting}
                min="0"
              />
              {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
            </div>

            {/* Preview Update */}
            {editSelectedSize && editSelectedGramasi && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600" />
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Ukuran Baru:</p>
                    <p className="font-medium text-gray-900">{buildSheetLabel(editSelectedSize.panjang_sh, editSelectedSize.lebar_sh)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">GSM Baru:</p>
                    <p className="font-medium text-gray-900">{editSelectedGramasi.gsm} GSM</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">PL Format:</p>
                    <p className="font-mono text-gray-900">{editSelectedSize.panjang_sh}x{editSelectedSize.lebar_sh}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Harga Baru:</p>
                    <p className="font-medium text-gray-900">
                      {editFormData.harga_per_lembar && parseFloat(editFormData.harga_per_lembar) > 0
                        ? formatCurrency(parseFloat(editFormData.harga_per_lembar))
                        : <span className="text-gray-400 italic">(kosong / 0)</span>
                      }
                    </p>
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