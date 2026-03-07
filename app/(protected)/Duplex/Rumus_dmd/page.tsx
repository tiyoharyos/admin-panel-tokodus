'use client'
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
  gramasi_id?: string // menyimpan nilai GSM string, misal "250"
}

interface FormData {
  sheet_size_id: string
  gsm: string          // ← sama seperti DK: value = string GSM ("250", "270", dst)
  harga_per_lembar: string
}

// ← Disamakan dengan DK: field lengkap dari gramasiIndex
interface GramasiItem {
  id: string
  material_type_id: string
  gsm: string          // "250"|"270"|"310"|"350"|"400"|"450"
  name: string         // "Duplex" / "DMD" / dll
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
// ← gsm sekarang string (nilai GSM), bukan gramasi_id
const BASE_FORM: FormData = {
  sheet_size_id: '',
  gsm: '',
  harga_per_lembar: ''
}

// ===== META CONSTANTS =====
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
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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

  // ← Disamakan dengan DK:
  //   - filter by name (sesuaikan dengan nama material DMD di API)
  //   - dedup by gsm (bukan by id)
  //   - sort GSM ascending
  const fetchGramasi = useCallback(async () => {
    try {
      setLoadingGramasi(true)
      const response = await axios.get<GramasiApiResponse>('Admin/Duplek/gramasiIndex')
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        const seen = new Set<string>()
        const filtered = response.data.data
          // Sesuaikan filter name dengan nilai yang dikembalikan API untuk DMD
          // Contoh: .filter(item => item.name === 'Duplex MD')
          // Jika tidak ada filter name spesifik, hapus baris filter di bawah
          .filter(item => item.name === 'Duplex')
          .filter(item => {
            if (seen.has(item.gsm)) return false   // ← dedup by gsm, bukan by id
            seen.add(item.gsm)
            return true
          })
          .sort((a, b) => parseInt(a.gsm) - parseInt(b.gsm))  // ← sort GSM asc
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
          gramasi_id: item.gsm   // ← menyimpan string GSM ("250", "270", dst)
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
    const uniqueCombinations = new Set(
      data.map(item => `${item.panjang}x${item.lebar}x${item.gsm}`)
    ).size
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

  return {
    duplexData,
    gramasiList,
    sheetSizeList,
    loading,
    error,
    loadingGramasi,
    stats,
    refetch: fetchDuplexData
  }
}

// ===== MAIN COMPONENT =====
export default function DuplexDMDPage() {
  const {
    duplexData,
    gramasiList,
    sheetSizeList,
    loading,
    error,
    loadingGramasi,
    stats,
    refetch
  } = useDuplexDMD()

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

  // ===== SORTED DATA =====
  const sortedDuplexData = useMemo(() => {
    return [...duplexData].sort((a, b) => {
      if (a.gsm !== b.gsm) return a.gsm - b.gsm
      return (a.panjang * a.lebar) - (b.panjang * b.lebar)
    })
  }, [duplexData])

  // ===== OPTIONS =====
  const sheetSizeOptions = useMemo(() =>
    sheetSizeList.map((item, idx) => ({
      value: item.id_sh,
      label: buildSheetLabel(item.panjang_sh, item.lebar_sh),
      key: `sh-${item.id_sh}-${idx}`
    })), [sheetSizeList])

  // ← Disamakan dengan DK: value = item.gsm (string GSM), bukan item.id
  const gramasiOptions = useMemo(() =>
    gramasiList.map((item, idx) => ({
      value: item.gsm,            // ← "250", "270", dst
      label: `${item.gsm} GSM`,
      key: `gr-${item.gsm}-${idx}`
    })), [gramasiList])

  // ===== VALIDATION =====
  const validateForm = (formData: FormData, isEdit = false): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!formData.sheet_size_id) errors.sheet_size_id = 'Ukuran tidak boleh kosong'
    if (!formData.gsm) errors.gsm = 'GSM tidak boleh kosong'  // ← field gsm

    if (formData.harga_per_lembar && formData.harga_per_lembar.trim() !== '') {
      const harga = parseFloat(formData.harga_per_lembar)
      if (isNaN(harga)) errors.harga_per_lembar = 'Harga harus berupa angka'
      else if (harga < 0) errors.harga_per_lembar = 'Harga tidak boleh negatif'
    }

    if (!isEdit && formData.sheet_size_id && formData.gsm) {
      // ← cek duplikat by gsm string (sama seperti DK)
      const gNum = parseInt(formData.gsm)
      const isDuplicate = duplexData.some(item =>
        item.sheet_size_id === formData.sheet_size_id && item.gsm === gNum
      )
      if (isDuplicate) {
        const size = sheetSizeList.find(s => s.id_sh === formData.sheet_size_id)
        if (size) {
          errors.general = `Kombinasi ${buildSheetLabel(size.panjang_sh, size.lebar_sh)} dengan GSM ${formData.gsm} sudah ada`
        }
      }
    }

    return errors
  }

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    const errors = validateForm(addFormData, false)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: 'Periksa kembali data yang diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    // ← payload gramasi = nilai GSM (sama seperti DK)
    // key harga_lembar sesuai nama kolom di DB/backend
    const payload = {
      gramasi: addFormData.gsm,
      pl: addFormData.sheet_size_id,
      harga_lembar: addFormData.harga_per_lembar || '0'
    }

    try {
      setIsPosting(true)
      const response = await axios.post<ApiResponse>('Admin/Duplek/duplekMduplekPricesAdd', payload)

      if (response.status === 200 || response.data?.status === 200) {
        await refetch()
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data Duplex DMD berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false
        })
        setShowAddModal(false)
        resetAddForm()
      } else {
        throw new Error(response.data?.message || 'Gagal menambahkan data')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })
        ?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: msg,
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return

    const errors = validateForm(editFormData, true)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: 'Periksa kembali data yang diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    const payload = {
      gramasi: editFormData.gsm,
      pl: editFormData.sheet_size_id,
      harga_lembar: editFormData.harga_per_lembar || '0'
    }

    try {
      setIsPosting(true)
      const response = await axios.put<ApiResponse>(
        `Admin/Duplek/duplekMduplekPricesEdit/${editingItem.id}`,
        payload
      )

      if (response.status === 200 || response.data?.status === 200) {
        await refetch()
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data Duplex DMD berhasil diperbarui',
          timer: 1500,
          showConfirmButton: false
        })
        setShowEditModal(false)
        setEditingItem(null)
        resetEditForm()
      } else {
        throw new Error(response.data?.message || 'Gagal mengupdate data')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })
        ?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: msg,
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: number, gsm: number, ukuran: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus data GSM ${gsm} - Ukuran ${ukuran}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return

    try {
      setIsPosting(true)
      const response = await axios.delete<ApiResponse>(`Admin/Duplek/duplekMduplekPricesDel/${id}`)

      if (response.status === 200) {
        await refetch()
        Swal.fire({
          icon: 'success',
          title: 'Dihapus!',
          text: 'Data Duplex DMD berhasil dihapus',
          timer: 1500,
          showConfirmButton: false
        })
      } else {
        throw new Error(response.data?.message || 'Gagal menghapus data')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }, message?: string })
        ?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: msg,
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== VIEW HANDLER =====
  const handleViewClick = (item: DuplexDMDData) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // ===== UI HANDLERS =====
  const handleAddClick = () => {
    resetAddForm()
    setShowAddModal(true)
  }

  const handleEditClick = (item: DuplexDMDData) => {
    setEditingItem(item)
    setEditFormData({
      sheet_size_id: item.sheet_size_id || '',
      gsm: item.gramasi_id || item.gsm.toString(), // ← gramasi_id sudah menyimpan string GSM
      harga_per_lembar: item.harga_per_lembar ? item.harga_per_lembar.toString() : ''
    })
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

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedItem(null)
  }

  // ===== SYNC SELECTED ITEMS =====
  useEffect(() => {
    setSelectedSize(sheetSizeList.find(i => i.id_sh === addFormData.sheet_size_id) || null)
  }, [addFormData.sheet_size_id, sheetSizeList])

  // ← cari by gsm string, bukan by id
  useEffect(() => {
    setSelectedGramasi(gramasiList.find(i => i.gsm === addFormData.gsm) || null)
  }, [addFormData.gsm, gramasiList])

  useEffect(() => {
    setEditSelectedSize(sheetSizeList.find(i => i.id_sh === editFormData.sheet_size_id) || null)
  }, [editFormData.sheet_size_id, sheetSizeList])

  // ← cari by gsm string, bukan by id
  useEffect(() => {
    setEditSelectedGramasi(gramasiList.find(i => i.gsm === editFormData.gsm) || null)
  }, [editFormData.gsm, gramasiList])

  // ===== LOADING STATE =====
  if (loading && duplexData.length === 0 && !error) {
    return <LoadingState
      message="Memuat Data Duplex DMD..."
      submessage="Harap tunggu sebentar"
      icon="mdi:book-open-variant"
    />
  }

  // ===== RENDER =====
  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:book-open-variant" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Duplex DMD</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola ukuran dan harga Duplex DMD</p>
          </div>
        </div>
        <Button
          onClick={handleAddClick}
          variant="primary"
          size="md"
          icon="mdi:plus"
        >
          Tambah Ukuran DMD
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: 'mdi:database',
            label: 'Total Records',
            value: stats.totalRecords,
            sub: `${stats.uniqueGsm} variasi GSM · ${stats.uniqueSizes} ukuran`,
          },
          {
            icon: 'mdi:ruler-square',
            label: 'Kombinasi Ukuran',
            value: stats.totalCombinations,
            sub: `${stats.uniqueGsm} GSM × ${stats.uniqueSizes} ukuran`,
            bar: (stats.totalCombinations / (stats.uniqueGsm * stats.uniqueSizes || 1)) * 100,
          },
          {
            icon: 'mdi:cash-multiple',
            label: 'Rata-rata Harga',
            value: formatCurrency(stats.averagePrice),
            sub: 'per lembar',
          },
          {
            icon: 'mdi:check-circle',
            label: 'Data dengan Harga',
            value: stats.withPrice,
            sub: `${Math.round((stats.withPrice / stats.totalRecords) * 100) || 0}% dari total`,
            bar: (stats.withPrice / stats.totalRecords) * 100 || 0,
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
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(s.bar, 100)}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== INFO MESSAGE ===== */}
      {error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800">{error}</p>
        </div>
      )}

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Ukuran Duplex DMD</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalRecords} data dengan {stats.totalCombinations} kombinasi ukuran
            </p>
          </div>
          <button
            onClick={refetch}
            title="Refresh"
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Icon icon="mdi:refresh" className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {sortedDuplexData.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:book-open-variant-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data Duplex DMD</p>
              <p className="text-sm text-gray-400">Tambahkan ukuran baru untuk memulai</p>
              <Button onClick={handleAddClick} variant="primary" icon="mdi:plus">
                Tambah Ukuran Baru
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">GSM</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ukuran (cm)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga per Lembar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedDuplexData.map((item, index) => {
                  const luasM2 = (item.panjang * item.lebar) / 10000
                  const hargaPerM2 = item.harga_per_lembar > 0 ? item.harga_per_lembar / luasM2 : 0

                  return (
                    <tr key={`dmd-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-800">{index + 1}</span>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: getGSMColor(item.gsm).light,
                              color: getGSMColor(item.gsm).bg
                            }}
                          >
                            {item.gsm} GSM
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                            <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="font-medium text-slate-800">
                            {formatUkuranDisplay(item.panjang, item.lebar)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.harga_per_lembar > 0 ? (
                          <div>
                            <div className="font-bold text-slate-800">{formatCurrency(item.harga_per_lembar)}</div>
                            <div className="text-xs text-gray-400 mt-1">{formatCurrency(hargaPerM2)}/m²</div>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">Belum ada harga</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewClick(item)}
                            title="Lihat Detail"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            title="Edit"
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.gsm, formatUkuranDisplay(item.panjang, item.lebar))}
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
        {sortedDuplexData.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{sortedDuplexData.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{stats.totalRecords}</span> data
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Ukuran Duplex DMD"
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseAddModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" size="md" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              Simpan Data
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Info */}
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Pilih GSM dan Ukuran yang tersedia. Harga boleh dikosongkan jika belum ada.
            </p>
          </div>

          {/* GSM ← disamakan dengan DK: dari gramasiOptions yg value=gsm string */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSM <span className="text-red-500">*</span>
            </label>
            {loadingGramasi ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">Memuat data gramasi...</span>
              </div>
            ) : (
              <Select
                value={addFormData.gsm}
                onChange={(e) => handleAddInputChange('gsm', e.target.value)}
                options={gramasiOptions}
                placeholder="-- Pilih GSM --"
                disabled={isPosting}
                className={formErrors.gsm ? 'border-red-500' : ''}
              />
            )}
            {formErrors.gsm && <p className="text-xs text-red-600 mt-2">{formErrors.gsm}</p>}
            {!loadingGramasi && gramasiList.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">⚠ Data GSM DMD tidak tersedia</p>
            )}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga per Lembar <span className="text-xs text-gray-400 ml-1">(opsional)</span>
            </label>
            <Input
              type="number"
              value={addFormData.harga_per_lembar}
              onChange={(e) => handleAddInputChange('harga_per_lembar', e.target.value)}
              placeholder="0"
              leftIcon="mdi:cash"
              disabled={isPosting}
              className={formErrors.harga_per_lembar ? 'border-red-500' : ''}
              min="0"
              step="100"
            />
            {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
          </div>

          {/* Preview */}
          {selectedSize && selectedGramasi && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600" />
                Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">GSM:</p>
                  <p className="font-medium text-gray-900">{selectedGramasi.gsm} GSM</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Ukuran:</p>
                  <p className="font-medium text-gray-900">{buildSheetLabel(selectedSize.panjang_sh, selectedSize.lebar_sh)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Luas:</p>
                  <p className="font-medium text-gray-900">
                    {((parseInt(selectedSize.panjang_sh) / 10) * (parseInt(selectedSize.lebar_sh) / 10) / 10000).toFixed(2)} m²
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Harga:</p>
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
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
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
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseEditModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" size="md" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">
              Update Data
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Current Data */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-1">Data Saat Ini</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 text-xs">Ukuran:</p>
                    <p className="font-medium text-blue-900">{formatUkuranDisplay(editingItem.panjang, editingItem.lebar)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs">GSM:</p>
                    <p className="font-medium text-blue-900">{editingItem.gsm} GSM</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs">Harga:</p>
                    <p className="font-medium text-blue-900">
                      {editingItem.harga_per_lembar > 0 ? formatCurrency(editingItem.harga_per_lembar) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* GSM Baru ← value dari gramasiOptions yg value=gsm string */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSM Baru <span className="text-red-500">*</span>
              </label>
              {loadingGramasi ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-gray-600">Memuat data gramasi...</span>
                </div>
              ) : (
                <Select
                  value={editFormData.gsm}
                  onChange={(e) => handleEditInputChange('gsm', e.target.value)}
                  options={gramasiOptions}
                  placeholder="-- Pilih GSM --"
                  disabled={isPosting}
                  className={formErrors.gsm ? 'border-red-500' : ''}
                />
              )}
              {formErrors.gsm && <p className="text-xs text-red-600 mt-2">{formErrors.gsm}</p>}
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

            {/* Harga Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Baru <span className="text-xs text-gray-400 ml-1">(opsional)</span>
              </label>
              <Input
                type="number"
                value={editFormData.harga_per_lembar}
                onChange={(e) => handleEditInputChange('harga_per_lembar', e.target.value)}
                placeholder="Kosongkan atau isi 0 jika belum ada harga"
                leftIcon="mdi:cash"
                disabled={isPosting}
                className={formErrors.harga_per_lembar ? 'border-red-500' : ''}
                min="0"
                step="100"
              />
              {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
            </div>

            {/* Preview Update */}
            {editSelectedSize && editSelectedGramasi && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600" />
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">GSM Baru:</p>
                    <p className="font-medium text-gray-900">{editSelectedGramasi.gsm} GSM</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Ukuran Baru:</p>
                    <p className="font-medium text-gray-900">{buildSheetLabel(editSelectedSize.panjang_sh, editSelectedSize.lebar_sh)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Luas:</p>
                    <p className="font-medium text-gray-900">
                      {((parseInt(editSelectedSize.panjang_sh) / 10) * (parseInt(editSelectedSize.lebar_sh) / 10) / 10000).toFixed(2)} m²
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Harga Baru:</p>
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

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        title="Detail Duplex DMD"
        size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseViewModal}>
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
              Edit Data
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const luasM2 = (selectedItem.panjang * selectedItem.lebar) / 10000
          const hargaPerM2 = selectedItem.harga_per_lembar > 0 ? selectedItem.harga_per_lembar / luasM2 : 0
          const gsmColor = getGSMColor(selectedItem.gsm)

          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
                  <Icon icon="mdi:book-open-variant" className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Duplex DMD</p>
                  <div className="flex items-center gap-2 mt-1">
                      {selectedItem.gsm} GSM
                    <span className="text-xs text-gray-400">ID: {selectedItem.id}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Informasi Ukuran</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Dimensi:</span>
                    <span className="text-sm font-medium text-slate-800">
                      {formatUkuranDisplay(selectedItem.panjang, selectedItem.lebar)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Luas:</span>
                    <span className="text-sm font-medium text-slate-800">{luasM2.toFixed(2)} m²</span>
                  </div>
                </div>
              </Card>

              {/* Harga */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Informasi Harga</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Harga per Lembar:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {selectedItem.harga_per_lembar > 0 ? formatCurrency(selectedItem.harga_per_lembar) : '-'}
                    </span>
                  </div>
                  {selectedItem.harga_per_lembar > 0 && (
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs font-medium text-gray-500">Harga per m²:</span>
                      <span className="text-sm font-medium text-slate-800">{formatCurrency(hargaPerM2)}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm font-medium text-slate-700">DMD (Duplex Medium)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Format PL</p>
                  <p className="text-sm font-mono text-slate-700">{selectedItem.pl || '-'}</p>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}