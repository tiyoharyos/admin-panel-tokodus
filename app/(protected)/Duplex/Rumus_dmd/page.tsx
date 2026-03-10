'use client'
// app/(protected)/duplex-dmd/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'

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
  gsm: string
  harga_per_lembar: string
}

interface GramasiItem {
  id: string
  material_type_id: string
  gsm: string
  name: string
  material_type: string
  is_premium: string
}

interface SheetSizeItem {
  id_sh: string
  panjang_sh: string
  lebar_sh: string
}

interface Stats {
  totalRecords: number
  averagePrice: number
  totalCombinations: number
  uniqueGsm: number
  uniqueSizes: number
  withPrice: number
}

// ===== API TYPES =====
interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
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

// ===== CONSTANTS =====
const BASE_FORM: FormData = { sheet_size_id: '', gsm: '', harga_per_lembar: '' }

const GSM_COLORS = [
  { bg: '#3b82f6', light: '#dbeafe' },
  { bg: '#10b981', light: '#d1fae5' },
  { bg: '#f59e0b', light: '#fed7aa' },
  { bg: '#8b5cf6', light: '#ede9fe' },
  { bg: '#ef4444', light: '#fee2e2' },
]

// ===== UTILITIES =====
const formatUkuranDisplay = (panjang: number, lebar: number): string => {
  if (!panjang || !lebar || isNaN(panjang) || isNaN(lebar) || panjang === 0 || lebar === 0) return '-'
  return `${panjang} × ${lebar} cm`
}

const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount)
}

const getGSMColor = (gsm: number): { bg: string; light: string } => {
  if (gsm <= 270) return GSM_COLORS[0]
  if (gsm <= 350) return GSM_COLORS[1]
  if (gsm <= 400) return GSM_COLORS[2]
  if (gsm <= 450) return GSM_COLORS[3]
  return GSM_COLORS[4]
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
        const filtered = response.data.data
          .filter(item => item.name === 'Duplex')
          .filter(item => {
            if (seen.has(item.gsm)) return false
            seen.add(item.gsm)
            return true
          })
          .sort((a, b) => parseInt(a.gsm) - parseInt(b.gsm))
        setGramasiList(filtered)
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
        return
      }
      const seenSizes = new Map<string, SheetSizeItem>()
      priceData.forEach(item => {
        if (item.id_sh && !seenSizes.has(item.id_sh)) {
          seenSizes.set(item.id_sh, { id_sh: item.id_sh, panjang_sh: item.panjang_mm, lebar_sh: item.lebar_mm })
        }
      })
      setSheetSizeList(Array.from(seenSizes.values()).sort((a, b) => parseInt(a.id_sh) - parseInt(b.id_sh)))
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
      setError('Gagal mengambil data DMD')
      setDuplexData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateStats = (data: DuplexDMDData[]): Stats => {
    const totalRecords = data.length
    const totalPrice = data.reduce((sum, item) => sum + (item.harga_per_lembar || 0), 0)
    const uniqueCombinations = new Set(data.map(item => `${item.panjang}x${item.lebar}x${item.gsm}`)).size
    const uniqueGsm = new Set(data.map(item => item.gsm)).size
    const uniqueSizes = new Set(data.map(item => `${item.panjang}x${item.lebar}`)).size
    const withPrice = data.filter(item => item.harga_per_lembar > 0).length
    return {
      totalRecords,
      averagePrice: totalRecords > 0 ? totalPrice / totalRecords : 0,
      totalCombinations: uniqueCombinations,
      uniqueGsm,
      uniqueSizes,
      withPrice
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
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DuplexDMDData | null>(null)
  const [selectedItem, setSelectedItem] = useState<DuplexDMDData | null>(null)

  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [selectedSize, setSelectedSize] = useState<SheetSizeItem | null>(null)
  const [selectedGramasi, setSelectedGramasi] = useState<GramasiItem | null>(null)
  const [editSelectedSize, setEditSelectedSize] = useState<SheetSizeItem | null>(null)
  const [editSelectedGramasi, setEditSelectedGramasi] = useState<GramasiItem | null>(null)

  const sortedDuplexData = useMemo(() =>
    [...duplexData].sort((a, b) => a.gsm !== b.gsm ? a.gsm - b.gsm : (a.panjang * a.lebar) - (b.panjang * b.lebar)),
    [duplexData])

  const sheetSizeOptions = useMemo(() =>
    sheetSizeList.map((item, idx) => ({
      value: item.id_sh, label: buildSheetLabel(item.panjang_sh, item.lebar_sh), key: `sh-${item.id_sh}-${idx}`
    })), [sheetSizeList])

  const gramasiOptions = useMemo(() =>
    gramasiList.map((item, idx) => ({
      value: item.gsm, label: `${item.gsm} GSM`, key: `gr-${item.gsm}-${idx}`
    })), [gramasiList])

  // ===== VALIDATION =====
  const validateForm = (formData: FormData, isEdit = false): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.sheet_size_id) errors.sheet_size_id = 'Ukuran tidak boleh kosong'
    if (!formData.gsm) errors.gsm = 'GSM tidak boleh kosong'
    if (formData.harga_per_lembar && formData.harga_per_lembar.trim() !== '') {
      const harga = parseFloat(formData.harga_per_lembar)
      if (isNaN(harga)) errors.harga_per_lembar = 'Harga harus berupa angka'
      else if (harga < 0) errors.harga_per_lembar = 'Harga tidak boleh negatif'
    }
    if (!isEdit && formData.sheet_size_id && formData.gsm) {
      const gNum = parseInt(formData.gsm)
      const isDuplicate = duplexData.some(item => item.sheet_size_id === formData.sheet_size_id && item.gsm === gNum)
      if (isDuplicate) {
        const size = sheetSizeList.find(s => s.id_sh === formData.sheet_size_id)
        if (size) errors.general = `Kombinasi ${buildSheetLabel(size.panjang_sh, size.lebar_sh)} dengan GSM ${formData.gsm} sudah ada`
      }
    }
    return errors
  }

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    const errors = validateForm(addFormData, false)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi', confirmButtonColor: '#3b82f6' })
      return
    }
    const payload = { gramasi: addFormData.gsm, pl: addFormData.sheet_size_id, harga_lembar: addFormData.harga_per_lembar || '0' }
    try {
      setIsPosting(true)
      const response = await axios.post<ApiResponse>('Admin/Duplek/duplekMduplekPricesAdd', payload)
      if (response.status === 200 || response.data?.status === 200) {
        await refetch()
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data Duplex DMD berhasil ditambahkan', timer: 1500, showConfirmButton: false })
        setShowAddModal(false); resetAddForm()
      } else throw new Error(response.data?.message || 'Gagal menambahkan data')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      Swal.fire({ icon: 'error', title: 'Error!', text: msg, confirmButtonColor: '#3b82f6' })
    } finally { setIsPosting(false) }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    const errors = validateForm(editFormData, true)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi', confirmButtonColor: '#3b82f6' })
      return
    }
    const payload = { gramasi: editFormData.gsm, pl: editFormData.sheet_size_id, harga_lembar: editFormData.harga_per_lembar || '0' }
    try {
      setIsPosting(true)
      const response = await axios.put<ApiResponse>(`Admin/Duplek/duplekMduplekPricesEdit/${editingItem.id}`, payload)
      if (response.status === 200 || response.data?.status === 200) {
        await refetch()
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data Duplex DMD berhasil diperbarui', timer: 1500, showConfirmButton: false })
        setShowEditModal(false); setEditingItem(null); resetEditForm()
      } else throw new Error(response.data?.message || 'Gagal mengupdate data')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      Swal.fire({ icon: 'error', title: 'Error!', text: msg, confirmButtonColor: '#3b82f6' })
    } finally { setIsPosting(false) }
  }

  const handleDelete = async (id: number, gsm: number, ukuran: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus data GSM ${gsm} - Ukuran ${ukuran}?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    try {
      setIsPosting(true)
      const response = await axios.delete<ApiResponse>(`Admin/Duplek/duplekMduplekPricesDel/${id}`)
      if (response.status === 200) {
        await refetch()
        Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Data Duplex DMD berhasil dihapus', timer: 1500, showConfirmButton: false })
      } else throw new Error(response.data?.message || 'Gagal menghapus data')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      Swal.fire({ icon: 'error', title: 'Error!', text: msg, confirmButtonColor: '#3b82f6' })
    } finally { setIsPosting(false) }
  }

  const handleViewClick = (item: DuplexDMDData) => { setSelectedItem(item); setShowViewModal(true) }
  const handleAddClick = () => { resetAddForm(); setShowAddModal(true) }

  const handleEditClick = (item: DuplexDMDData) => {
    setEditingItem(item)
    setEditFormData({ sheet_size_id: item.sheet_size_id || '', gsm: item.gramasi_id || item.gsm.toString(), harga_per_lembar: item.harga_per_lembar ? item.harga_per_lembar.toString() : '' })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '', general: '' }))
  }
  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const resetAddForm = () => { setAddFormData({ ...BASE_FORM }); setSelectedSize(null); setSelectedGramasi(null); setFormErrors({}) }
  const resetEditForm = () => { setEditFormData({ ...BASE_FORM }); setEditSelectedSize(null); setEditSelectedGramasi(null); setFormErrors({}) }

  const handleCloseAddModal = () => { if (!isPosting) { setShowAddModal(false); resetAddForm() } }
  const handleCloseEditModal = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null); resetEditForm() } }
  const handleCloseViewModal = () => { setShowViewModal(false); setSelectedItem(null) }

  useEffect(() => { setSelectedSize(sheetSizeList.find(i => i.id_sh === addFormData.sheet_size_id) || null) }, [addFormData.sheet_size_id, sheetSizeList])
  useEffect(() => { setSelectedGramasi(gramasiList.find(i => i.gsm === addFormData.gsm) || null) }, [addFormData.gsm, gramasiList])
  useEffect(() => { setEditSelectedSize(sheetSizeList.find(i => i.id_sh === editFormData.sheet_size_id) || null) }, [editFormData.sheet_size_id, sheetSizeList])
  useEffect(() => { setEditSelectedGramasi(gramasiList.find(i => i.gsm === editFormData.gsm) || null) }, [editFormData.gsm, gramasiList])

  if (loading && duplexData.length === 0 && !error) {
    return <LoadingState message="Memuat Data Duplex DMD..." submessage="Harap tunggu sebentar" icon="mdi:book-open-variant" />
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
            <p className="text-gray-600 mt-1 text-sm">Kelola ukuran dan harga Duplex DMD</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-gray-600"><span className="font-medium">Total:</span> {stats.totalRecords}</span>
              <span className="text-gray-600"><span className="font-medium">GSM:</span> {stats.uniqueGsm} variasi</span>
              <span className="text-gray-600"><span className="font-medium">Ukuran:</span> {stats.uniqueSizes} unik</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refetch} className="border-gray-300 hover:bg-gray-50" icon="mdi:refresh">
            Refresh
          </Button>
          <Button
            onClick={handleAddClick}
            variant="primary"
            size="md"
            icon="mdi:plus"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          >
            Tambah Ukuran DMD
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:database" className="w-4 h-4 text-blue-600" />Total Records
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRecords}</p>
            <p className="text-xs text-gray-500">{stats.uniqueGsm} variasi GSM · {stats.uniqueSizes} ukuran</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:ruler-square" className="w-4 h-4 text-green-600" />Kombinasi Ukuran
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCombinations}</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((stats.totalCombinations / (stats.uniqueGsm * stats.uniqueSizes || 1)) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-500">{stats.uniqueGsm} GSM × {stats.uniqueSizes} ukuran</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-purple-600" />Rata-rata Harga
            </p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.averagePrice)}</p>
            <p className="text-xs text-gray-500">per lembar</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4 text-amber-600" />Data dengan Harga
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.withPrice}</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((stats.withPrice / stats.totalRecords) * 100 || 0, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-500">{Math.round((stats.withPrice / stats.totalRecords) * 100) || 0}% dari total</p>
          </div>
        </Card>
      </div>

      {error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-blue-800 text-sm">{error}</p>
        </div>
      )}

      {/* ===== TABLE CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Ukuran Duplex DMD</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalRecords} data dengan {stats.totalCombinations} kombinasi ukuran
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {sortedDuplexData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:book-open-variant-off" className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data Duplex DMD</h3>
              <p className="text-gray-500 mb-6">Tambahkan ukuran baru untuk memulai</p>
              <Button onClick={handleAddClick} variant="primary" icon="mdi:plus" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Tambah Ukuran Baru
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'GSM', 'Ukuran (cm)', 'Harga per Lembar', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDuplexData.map((item, index) => {
                  const luasM2 = (item.panjang * item.lebar) / 10000
                  const hargaPerM2 = item.harga_per_lembar > 0 ? item.harga_per_lembar / luasM2 : 0
                  return (
                    <tr key={`dmd-${item.id}`} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-800">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: getGSMColor(item.gsm).light, color: getGSMColor(item.gsm).bg }}>
                          {item.gsm} GSM
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                            <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="font-medium text-slate-800">{formatUkuranDisplay(item.panjang, item.lebar)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.harga_per_lembar > 0 ? (
                          <div>
                            <div className="font-bold text-gray-900">{formatCurrency(item.harga_per_lembar)}</div>
                            <div className="text-xs text-gray-400 mt-1">{formatCurrency(hargaPerM2)}/m²</div>
                          </div>
                        ) : <span className="text-gray-300 italic text-sm">0</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewClick(item)} title="Lihat Detail" className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                            <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleEditClick(item)} title="Edit" className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                            <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.gsm, formatUkuranDisplay(item.panjang, item.lebar))} title="Hapus" className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
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

        {sortedDuplexData.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold text-slate-700">{sortedDuplexData.length}</span> dari{' '}
              <span className="font-semibold text-slate-700">{stats.totalRecords}</span> data
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal isOpen={showAddModal} onClose={handleCloseAddModal} title="➕ Tambah Ukuran Duplex DMD" size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">Simpan Data</Button>
          </>
        }>
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Informasi</h4>
                <p className="text-sm text-blue-700">Pilih GSM dan Ukuran yang tersedia. Harga boleh dikosongkan jika belum ada.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GSM <span className="text-red-500">*</span></label>
            {loadingGramasi ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">Memuat data gramasi...</span>
              </div>
            ) : (
              <Select value={addFormData.gsm} onChange={(e) => handleAddInputChange('gsm', e.target.value)}
                options={gramasiOptions} placeholder="-- Pilih GSM --"
                disabled={isPosting} className={formErrors.gsm ? 'border-red-500' : ''} />
            )}
            {formErrors.gsm && <p className="text-xs text-red-600 mt-2">{formErrors.gsm}</p>}
            {!loadingGramasi && gramasiList.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">⚠ Data GSM DMD tidak tersedia</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran <span className="text-red-500">*</span></label>
            <Select value={addFormData.sheet_size_id} onChange={(e) => handleAddInputChange('sheet_size_id', e.target.value)}
              options={sheetSizeOptions} placeholder="-- Pilih Ukuran --"
              disabled={isPosting} className={formErrors.sheet_size_id ? 'border-red-500' : ''} />
            {formErrors.sheet_size_id && <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga per Lembar <span className="text-xs text-gray-400 ml-1">(opsional)</span>
            </label>
            <Input type="number" value={addFormData.harga_per_lembar} onChange={(e) => handleAddInputChange('harga_per_lembar', e.target.value)}
              placeholder="0" leftIcon="mdi:cash" disabled={isPosting}
              className={formErrors.harga_per_lembar ? 'border-red-500' : ''} min="0" step="100" />
            {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
          </div>

          {selectedSize && selectedGramasi && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                </div>
                Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500 mb-1">GSM:</p><p className="font-medium text-gray-900">{selectedGramasi.gsm} GSM</p></div>
                <div><p className="text-gray-500 mb-1">Ukuran:</p><p className="font-medium text-gray-900">{buildSheetLabel(selectedSize.panjang_sh, selectedSize.lebar_sh)}</p></div>
                <div><p className="text-gray-500 mb-1">Luas:</p><p className="font-medium text-gray-900">{((parseInt(selectedSize.panjang_sh) / 10) * (parseInt(selectedSize.lebar_sh) / 10) / 10000).toFixed(2)} m²</p></div>
                <div>
                  <p className="text-gray-500 mb-1">Harga:</p>
                  <p className="font-medium text-gray-900">
                    {addFormData.harga_per_lembar && parseFloat(addFormData.harga_per_lembar) > 0
                      ? formatCurrency(parseFloat(addFormData.harga_per_lembar))
                      : <span className="text-gray-400 italic">(kosong / 0)</span>}
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
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title="✏️ Edit Ukuran Duplex DMD" size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">Update Data</Button>
          </>
        }>
        {editingItem && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Data Saat Ini</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                    <div><p className="text-blue-700 text-xs mb-1">Ukuran</p><p className="font-medium text-blue-900">{formatUkuranDisplay(editingItem.panjang, editingItem.lebar)}</p></div>
                    <div><p className="text-blue-700 text-xs mb-1">GSM</p><p className="font-medium text-blue-900">{editingItem.gsm} GSM</p></div>
                    <div><p className="text-blue-700 text-xs mb-1">Harga</p><p className="font-medium text-blue-900">{editingItem.harga_per_lembar > 0 ? formatCurrency(editingItem.harga_per_lembar) : '-'}</p></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GSM Baru <span className="text-red-500">*</span></label>
              {loadingGramasi ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-gray-600">Memuat data gramasi...</span>
                </div>
              ) : (
                <Select value={editFormData.gsm} onChange={(e) => handleEditInputChange('gsm', e.target.value)}
                  options={gramasiOptions} placeholder="-- Pilih GSM --"
                  disabled={isPosting} className={formErrors.gsm ? 'border-red-500' : ''} />
              )}
              {formErrors.gsm && <p className="text-xs text-red-600 mt-2">{formErrors.gsm}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran Baru <span className="text-red-500">*</span></label>
              <Select value={editFormData.sheet_size_id} onChange={(e) => handleEditInputChange('sheet_size_id', e.target.value)}
                options={sheetSizeOptions} placeholder="-- Pilih Ukuran --"
                disabled={isPosting} className={formErrors.sheet_size_id ? 'border-red-500' : ''} />
              {formErrors.sheet_size_id && <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Baru <span className="text-xs text-gray-400 ml-1">(opsional)</span>
              </label>
              <Input type="number" value={editFormData.harga_per_lembar} onChange={(e) => handleEditInputChange('harga_per_lembar', e.target.value)}
                placeholder="Kosongkan atau isi 0 jika belum ada harga" leftIcon="mdi:cash" disabled={isPosting}
                className={formErrors.harga_per_lembar ? 'border-red-500' : ''} min="0" step="100" />
              {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
            </div>

            {editSelectedSize && editSelectedGramasi && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                  </div>
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 mb-1">GSM Baru:</p><p className="font-medium text-gray-900">{editSelectedGramasi.gsm} GSM</p></div>
                  <div><p className="text-gray-500 mb-1">Ukuran Baru:</p><p className="font-medium text-gray-900">{buildSheetLabel(editSelectedSize.panjang_sh, editSelectedSize.lebar_sh)}</p></div>
                  <div><p className="text-gray-500 mb-1">Luas:</p><p className="font-medium text-gray-900">{((parseInt(editSelectedSize.panjang_sh) / 10) * (parseInt(editSelectedSize.lebar_sh) / 10) / 10000).toFixed(2)} m²</p></div>
                  <div>
                    <p className="text-gray-500 mb-1">Harga Baru:</p>
                    <p className="font-medium text-gray-900">
                      {editFormData.harga_per_lembar && parseFloat(editFormData.harga_per_lembar) > 0
                        ? formatCurrency(parseFloat(editFormData.harga_per_lembar))
                        : <span className="text-gray-400 italic">(kosong / 0)</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal isOpen={showViewModal} onClose={handleCloseViewModal} title="Detail Duplex DMD" size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseViewModal}>Tutup</Button>
            <Button variant="primary" size="md" icon="mdi:pencil-outline"
              onClick={() => { setShowViewModal(false); if (selectedItem) handleEditClick(selectedItem) }}>
              Edit Data
            </Button>
          </>
        }>
        {selectedItem && (() => {
          const luasM2 = (selectedItem.panjang * selectedItem.lebar) / 10000
          const hargaPerM2 = selectedItem.harga_per_lembar > 0 ? selectedItem.harga_per_lembar / luasM2 : 0
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:book-open-variant" className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Duplex DMD</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: getGSMColor(selectedItem.gsm).light, color: getGSMColor(selectedItem.gsm).bg }}>
                      {selectedItem.gsm} GSM
                    </div>
                  </div>
                </div>
              </div>

              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Informasi Ukuran</p>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Dimensi</span>
                    <span className="text-sm font-medium text-slate-800">{formatUkuranDisplay(selectedItem.panjang, selectedItem.lebar)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Luas</span>
                    <span className="text-sm font-medium text-slate-800">{luasM2.toFixed(2)} m²</span>
                  </div>
                </div>
              </Card>

              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Informasi Harga</p>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Harga per Lembar</span>
                    <span className="text-sm font-bold text-slate-800">{selectedItem.harga_per_lembar > 0 ? formatCurrency(selectedItem.harga_per_lembar) : '-'}</span>
                  </div>
                  {selectedItem.harga_per_lembar > 0 && (
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs font-medium text-gray-500">Harga per m²</span>
                      <span className="text-sm font-medium text-slate-800">{formatCurrency(hargaPerM2)}</span>
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">Type</p><p className="text-sm font-medium text-slate-700">DMD (Duplex Medium)</p></div>
                <div><p className="text-xs text-gray-400">Format PL</p><p className="text-sm font-mono text-slate-700">{selectedItem.pl || '-'}</p></div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}