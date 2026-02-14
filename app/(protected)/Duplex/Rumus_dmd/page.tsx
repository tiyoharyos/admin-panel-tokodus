// app/(protected)/duplex-dmd/page.tsx

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react' // Tambah useMemo
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import SweetAlert from '@/components/UI/SweetAlert'
import { Icon } from '@iconify/react'
import axiosInstance from '@/lib/axios'
import { useRouter } from 'next/navigation'

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
  created_at?: string
  updated_at?: string
}

interface FormData {
  sheet_size_id: string
  gramasi_id: string
  harga_per_lembar: string
}

interface Stats {
  totalRecords: number
  activeRecords: number
  averagePrice: number
  totalCombinations: number
}

// ===== API RESPONSE TYPES =====
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

// ===== CONSTANTS =====
const BASE_FORM: FormData = {
  sheet_size_id: '',
  gramasi_id: '',
  harga_per_lembar: ''
}

// Helper untuk parse string "650x1050" (mm) menjadi panjang dan lebar (cm)
const parsePL = (pl: string): { panjang: number; lebar: number } => {
  try {
    const [panjang, lebar] = pl.split('x').map(Number)
    return {
      panjang: panjang / 10,
      lebar: lebar / 10
    }
  } catch (error) {
    console.error('Error parsing PL:', error)
    return { panjang: 0, lebar: 0 }
  }
}

// Helper untuk format display ukuran (cm)
const formatUkuranDisplay = (panjang: number, lebar: number): string => {
  return `${panjang} × ${lebar} cm`
}

// Helper untuk format PL dari data sheet size
const formatPLFromSheet = (panjang_mm: string, lebar_mm: string): string => {
  return `${panjang_mm}x${lebar_mm}`
}

const formatCurrency = (amount: number): string => {
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

export default function DuplexDMDSettingsPage() {
  const router = useRouter()

  // ===== STATE =====
  const [duplexData, setDuplexData] = useState<DuplexDMDData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  // Data master dari API
  const [gramasiList, setGramasiList] = useState<GramasiItem[]>([])
  const [sheetSizeList, setSheetSizeList] = useState<SheetSizeItem[]>([])
  const [loadingGramasi, setLoadingGramasi] = useState(false)
  const [loadingSheetSize, setLoadingSheetSize] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DuplexDMDData | null>(null)

  // Form states
  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Selected item details for display
  const [selectedSize, setSelectedSize] = useState<SheetSizeItem | null>(null)
  const [selectedGramasi, setSelectedGramasi] = useState<GramasiItem | null>(null)
  const [editSelectedSize, setEditSelectedSize] = useState<SheetSizeItem | null>(null)
  const [editSelectedGramasi, setEditSelectedGramasi] = useState<GramasiItem | null>(null)

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    activeRecords: 0,
    averagePrice: 0,
    totalCombinations: 0
  })

  // ===== SORTED DATA BY GSM =====
  // Mengurutkan data berdasarkan GSM (dari terkecil ke terbesar)
  const sortedDuplexData = useMemo(() => {
    return [...duplexData].sort((a, b) => {
      // Urutkan berdasarkan GSM (ascending)
      if (a.gsm !== b.gsm) {
        return a.gsm - b.gsm
      }
      // Jika GSM sama, urutkan berdasarkan ukuran (panjang * lebar)
      const luasA = a.panjang * a.lebar
      const luasB = b.panjang * b.lebar
      return luasA - luasB
    })
  }, [duplexData])

  // ===== CALCULATE STATS =====
  const calculateStats = (data: DuplexDMDData[]): Stats => {
    const totalRecords = data.length
    const totalPrice = data.reduce((sum, item) => sum + item.harga_per_lembar, 0)
    const uniqueCombinations = new Set(
      data.map(item => `${item.panjang}x${item.lebar}x${item.gsm}`)
    ).size

    return {
      totalRecords,
      activeRecords: totalRecords,
      averagePrice: totalRecords > 0 ? totalPrice / totalRecords : 0,
      totalCombinations: uniqueCombinations
    }
  }

  // ===== FETCH GRAMASI =====
  const fetchGramasi = useCallback(async () => {
    try {
      setLoadingGramasi(true)
      const response = await axiosInstance.get('Admin/Duplek/gramasiIndex')
      console.log('Gramasi response:', response.data)
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setGramasiList(response.data.data)
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

  // ===== FETCH SHEET SIZES =====
  const fetchSheetSizes = useCallback(async () => {
    try {
      setLoadingSheetSize(true)
      const response = await axiosInstance.get('Admin/Duplek/shetSizeIndex')
      console.log('Sheet sizes response:', response.data)
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setSheetSizeList(response.data.data)
      } else {
        setSheetSizeList([])
      }
    } catch (err) {
      console.error('Error fetching sheet sizes:', err)
      setSheetSizeList([])
    } finally {
      setLoadingSheetSize(false)
    }
  }, [])

  // ===== FETCH DUPLEX DMD PRICES =====
  const fetchDuplexData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Fetching Duplex DMD prices from API...')

      const response = await axiosInstance.get('Admin/Duplek/duplekMduplekPrices')
      console.log('📥 Duplex DMD prices response:', response.data)

      let priceData: any[] = []
      if (Array.isArray(response.data?.data)) {
        priceData = response.data.data
      } else if (Array.isArray(response.data)) {
        priceData = response.data
      }

      if (priceData.length === 0) {
        setDuplexData([])
        setStats(calculateStats([]))
        setError('Belum ada data DMD. Silakan tambah data baru.')
        return
      }

      const processedData: DuplexDMDData[] = priceData
        .map((item: any, index: number) => {
          try {
            const panjangSh = item.panjang_sh
            const lebarSh = item.lebar_sh
            const gsm = item.gsm

            if (!panjangSh || !lebarSh || !gsm) {
              console.warn('⚠️ Field tidak lengkap pada item DMD:', item)
              return null
            }

            const plValue = formatPLFromSheet(panjangSh, lebarSh)
            const { panjang, lebar } = parsePL(plValue)

            return {
              id: parseInt(item.id_mp) || index + 1000,
              panjang,
              lebar,
              harga_per_lembar: parseFloat(item.harga_per_lembar) || 0,
              gsm: parseInt(gsm) || 0,
              type: 'DMD' as const,
              pl: plValue,
              sheet_size_id: item.sheet_size_id,
              gramasi_id: item.gramasi_id,
              created_at: item.created_at,
            }
          } catch (e) {
            console.error('❌ Error processing DMD item:', item, e)
            return null
          }
        })
        .filter((item): item is DuplexDMDData =>
          item !== null &&
          item.panjang > 0 &&
          item.lebar > 0 &&
          item.harga_per_lembar > 0 &&
          item.gsm > 0
        )

      console.log('✅ Processed', processedData.length, 'valid DMD records from API')
      setDuplexData(processedData)
      setStats(calculateStats(processedData))
      setError(null)

    } catch (err: any) {
      console.error('❌ Error fetching Duplex DMD data:', err)
      setError(err.response?.data?.message || err.message || 'Gagal mengambil data DMD')
      setDuplexData([])
      setStats(calculateStats([]))
    } finally {
      setLoading(false)
    }
  }, [])

  // ===== VALIDATION =====
  const validateForm = (formData: FormData, isEdit: boolean = false): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!formData.sheet_size_id || formData.sheet_size_id.trim() === '') {
      errors.sheet_size_id = 'Ukuran tidak boleh kosong'
    }

    if (!formData.gramasi_id || formData.gramasi_id.trim() === '') {
      errors.gramasi_id = 'GSM tidak boleh kosong'
    }

    if (formData.harga_per_lembar && formData.harga_per_lembar.trim() !== '') {
      const harga = parseFloat(formData.harga_per_lembar)
      if (isNaN(harga)) {
        errors.harga_per_lembar = 'Harga harus berupa angka'
      } else if (harga <= 0) {
        errors.harga_per_lembar = 'Harga harus lebih dari 0'
      }
    }

    // Cek duplicate untuk add
    if (!isEdit && formData.sheet_size_id && formData.gramasi_id) {
      const isDuplicate = duplexData.some(item =>
        item.sheet_size_id === formData.sheet_size_id &&
        item.gramasi_id === formData.gramasi_id
      )

      if (isDuplicate) {
        const sheetSize = sheetSizeList.find(s => s.id_sh === formData.sheet_size_id)
        const gramasi = gramasiList.find(g => g.id === formData.gramasi_id)
        
        if (sheetSize && gramasi) {
          const { panjang, lebar } = parsePL(formatPLFromSheet(sheetSize.panjang_sh, sheetSize.lebar_sh))
          errors.general = `Kombinasi ${formatUkuranDisplay(panjang, lebar)} (${gramasi.gsm} GSM) sudah ada`
        }
      }
    }

    return errors
  }

  // ===== ADD HANDLER (POST) =====
  const handleAdd = async () => {
    const errors = validateForm(addFormData, false)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    const payload = {
      gramasi: addFormData.gramasi_id,
      pl: addFormData.sheet_size_id,
      harga_per_lembar: addFormData.harga_per_lembar || '0'
    }

    try {
      setIsPosting(true)

      const response = await axiosInstance.post('Admin/Duplek/duplekMduplekPricesAdd', payload)

      const isSuccess =
        response.status === 200 &&
        (response.data?.status === 200 || response.data?.status === '200')

      if (isSuccess) {
        await fetchDuplexData()
        SweetAlert.success('Berhasil!', response.data.message || 'Data Duplex DMD berhasil ditambahkan')
        setShowAddModal(false)
        resetAddForm()
      } else {
        const errMsg = response.data?.message || 'Gagal menambahkan data'
        throw new Error(errMsg)
      }

    } catch (err: any) {
      console.error('❌ Add DMD error:', err)
      
      let errorMessage = 'Terjadi kesalahan saat menambahkan data DMD'
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error ${err.response.status}`
      } else if (err.message) {
        errorMessage = err.message
      }

      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLER (PUT) =====
  const handleEdit = async () => {
    if (!editingItem) return

    const errors = validateForm(editFormData, true)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    const payload = {
      gramasi: editFormData.gramasi_id,
      pl: editFormData.sheet_size_id,
      harga_per_lembar: editFormData.harga_per_lembar || '0'
    }

    try {
      setIsPosting(true)

      const response = await axiosInstance.put(
        `Admin/Duplek/duplekMduplekPricesEdit/${editingItem.id}`,
        payload
      )

      const isSuccess =
        response.status === 200 &&
        (response.data?.status === 200 || response.data?.status === '200')

      if (isSuccess) {
        await fetchDuplexData()
        SweetAlert.success('Berhasil!', response.data.message || 'Data Duplex DMD berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        resetEditForm()
      } else {
        throw new Error(response.data?.message || 'Gagal mengupdate data')
      }

    } catch (err: any) {
      console.error('❌ Edit DMD error:', err)
      
      let errorMessage = 'Terjadi kesalahan saat memperbarui data DMD'
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error ${err.response.status}`
      }

      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE HANDLER =====
  const handleDelete = async (id: number, displayName: string) => {
    const result = await SweetAlert.confirmDelete(
      `Hapus ukuran ${displayName}?`,
      'Data yang dihapus tidak dapat dikembalikan'
    )

    if (!result.isConfirmed) return

    try {
      setIsPosting(true)

      const response = await axiosInstance.delete(
        `Admin/Duplek/duplekMduplekPricesDel/${id}`
      )

      if (response.status === 200) {
        await fetchDuplexData()
        SweetAlert.success('Berhasil!', response.data?.message || 'Data Duplex DMD berhasil dihapus')
      } else {
        throw new Error(response.data?.message || 'Gagal menghapus data')
      }

    } catch (err: any) {
      console.error('❌ DELETE DMD ERROR:', err)
      
      let errorMessage = 'Terjadi kesalahan saat menghapus data DMD'
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error ${err.response.status}`
      }

      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== INITIAL LOAD =====
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchGramasi(), fetchSheetSizes()])
    }
    loadInitialData()
  }, [fetchGramasi, fetchSheetSizes])

  // Load duplex DMD prices after master data is loaded
  useEffect(() => {
    if (sheetSizeList.length > 0 && gramasiList.length > 0) {
      fetchDuplexData()
    }
  }, [sheetSizeList, gramasiList, fetchDuplexData])

  // ===== UPDATE SELECTED ITEMS WHEN FORM CHANGES =====
  useEffect(() => {
    if (addFormData.sheet_size_id) {
      const selected = sheetSizeList.find(item => item.id_sh === addFormData.sheet_size_id)
      setSelectedSize(selected || null)
    } else {
      setSelectedSize(null)
    }
  }, [addFormData.sheet_size_id, sheetSizeList])

  useEffect(() => {
    if (addFormData.gramasi_id) {
      const selected = gramasiList.find(item => item.id === addFormData.gramasi_id)
      setSelectedGramasi(selected || null)
    } else {
      setSelectedGramasi(null)
    }
  }, [addFormData.gramasi_id, gramasiList])

  useEffect(() => {
    if (editFormData.sheet_size_id) {
      const selected = sheetSizeList.find(item => item.id_sh === editFormData.sheet_size_id)
      setEditSelectedSize(selected || null)
    } else {
      setEditSelectedSize(null)
    }
  }, [editFormData.sheet_size_id, sheetSizeList])

  useEffect(() => {
    if (editFormData.gramasi_id) {
      const selected = gramasiList.find(item => item.id === editFormData.gramasi_id)
      setEditSelectedGramasi(selected || null)
    } else {
      setEditSelectedGramasi(null)
    }
  }, [editFormData.gramasi_id, gramasiList])

  // ===== RESET FORM =====
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

  // ===== EDIT CLICK HANDLER =====
  const handleEditClick = (item: DuplexDMDData) => {
    setEditingItem(item)
    setEditFormData({
      sheet_size_id: item.sheet_size_id || '',
      gramasi_id: item.gramasi_id || '',
      harga_per_lembar: item.harga_per_lembar.toString()
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    const result = await SweetAlert.confirmAction(
      'Refresh Data?',
      'Data akan dimuat ulang dari server.'
    )

    if (result.isConfirmed) {
      try {
        await Promise.all([fetchGramasi(), fetchSheetSizes()])
        await fetchDuplexData()
        SweetAlert.success('Berhasil!', 'Data Duplex DMD berhasil diperbarui')
      } catch (err) {
        SweetAlert.error('Error!', 'Gagal memperbarui data')
      }
    }
  }

  // ===== FORM HANDLERS =====
  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // ===== MODAL CLOSE HANDLERS =====
  const handleCloseAddModal = () => {
    if (!isPosting) {
      setShowAddModal(false)
      resetAddForm()
    }
  }

  const handleCloseEditModal = () => {
    if (!isPosting) {
      setShowEditModal(false)
      setEditingItem(null)
      resetEditForm()
    }
  }

  // ===== HANDLE ADD BUTTON CLICK =====
  const handleAddButtonClick = () => {
    resetAddForm()

    if (loadingGramasi) {
      SweetAlert.info('Memuat Data', 'Mohon tunggu, data gramasi sedang dimuat...')
      return
    }
    if (loadingSheetSize) {
      SweetAlert.info('Memuat Data', 'Mohon tunggu, data ukuran sedang dimuat...')
      return
    }
    if (gramasiList.length === 0) {
      SweetAlert.warning('Peringatan', 'Data gramasi belum tersedia')
      return
    }
    if (sheetSizeList.length === 0) {
      SweetAlert.warning('Peringatan', 'Data ukuran belum tersedia')
      return
    }

    setShowAddModal(true)
  }


  // ===== LOADING STATE =====
  if (loading && duplexData.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:package-variant" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Data Duplex DMD...</p>
          <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
        </div>
      </div>
    )
  }

  if (error && duplexData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-red-200 bg-red-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:alert-circle" className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <Button onClick={fetchDuplexData} variant="danger" className="mx-auto">
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ===== MAIN RENDER =====
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
              Duplex DMD Settings
            </h1>
            <p className="text-gray-600 mt-1">Kelola ukuran dan harga Duplex DMD</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-gray-600">
                <span className="font-medium">Total Records:</span> {stats.totalRecords}
              </span>
              <span className="text-gray-600">
                <span className="font-medium">Gramasi:</span> {gramasiList.length} data
              </span>
              <span className="text-gray-600">
                <span className="font-medium">Ukuran:</span> {sheetSizeList.length} data
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
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleAddButtonClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
            icon="mdi:plus"
            disabled={loading}
          >
            Tambah Ukuran DMD
          </Button>
        </div>
      </div>

      {/* Error/Info Message */}
      {error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800">{error}</p>
          </div>
        </div>
      )}

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:database" className="w-4 h-4 text-blue-600" />
              Total Records
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRecords.toLocaleString()}</p>
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
            <p className="text-xs text-gray-500">unik kombinasi</p>
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
      </div>

      {/* ===== MAIN CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {/* Card Header */}
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
            {/* Info sorting - berdasarkan GSM */}
            <Badge className="bg-blue-100 text-blue-800">
              <Icon icon="mdi:sort-numeric-ascending" className="w-3 h-3 mr-1" />
              Urut berdasarkan GSM
            </Badge>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memuat ulang data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Table - Gunakan sortedDuplexData, bukan duplexData */}
        {sortedDuplexData.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:package-variant" className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data Duplex DMD</h3>
            <p className="text-gray-500 mb-6">Silakan tambah data baru</p>
            <Button
              onClick={handleAddButtonClick}
              variant="primary"
              icon="mdi:plus"
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Tambah Ukuran Pertama
            </Button>
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
                  const hargaPerM2 = item.harga_per_lembar / luasM2

                  return (
                    <tr
                      key={`dmd-${item.id}`}
                      className="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getGSMBadgeClass(item.gsm)}>
                          {item.gsm} GSM
                        </Badge>
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
                        <div className="font-bold text-gray-900">{formatCurrency(item.harga_per_lembar)}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatCurrency(hargaPerM2)}/m²</div>
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
                            onClick={() => handleDelete(
                              item.id,
                              `${item.panjang}×${item.lebar} cm (${item.gsm} GSM)`
                            )}
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

        {/* Table Footer */}
        {sortedDuplexData.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Menampilkan {sortedDuplexData.length} dari {stats.totalRecords} data
            </div>
            <button
              onClick={() => SweetAlert.info('Export', 'Exporting duplex DMD data...')}
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
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>
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
                options={gramasiList.map(item => ({
                  value: item.id,
                  label: `${item.gsm} GSM`
                }))}
                placeholder="Pilih GSM"
                disabled={isPosting || gramasiList.length === 0}
                className={formErrors.gramasi_id ? 'border-red-500' : ''}
              />
            )}
            {formErrors.gramasi_id && (
              <p className="text-xs text-red-600 mt-2">{formErrors.gramasi_id}</p>
            )}
          </div>

          {/* Ukuran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ukuran <span className="text-red-500">*</span>
            </label>
            {loadingSheetSize ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">Memuat data ukuran...</span>
              </div>
            ) : (
              <Select
                value={addFormData.sheet_size_id}
                onChange={(e) => handleAddInputChange('sheet_size_id', e.target.value)}
                options={sheetSizeList.map(item => {
                  const plValue = formatPLFromSheet(item.panjang_sh, item.lebar_sh)
                  const { panjang, lebar } = parsePL(plValue)
                  return {
                    value: item.id_sh,
                    label: `${formatUkuranDisplay(panjang, lebar)} (${plValue} mm)`
                  }
                })}
                placeholder="Pilih Ukuran"
                disabled={isPosting || sheetSizeList.length === 0}
                className={formErrors.sheet_size_id ? 'border-red-500' : ''}
              />
            )}
            {formErrors.sheet_size_id && (
              <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>
            )}
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga per Lembar
            </label>
            <Input
              type="number"
              value={addFormData.harga_per_lembar}
              onChange={(e) => handleAddInputChange('harga_per_lembar', e.target.value)}
              placeholder="10000"
              leftIcon="mdi:cash"
              disabled={isPosting}
              className={formErrors.harga_per_lembar ? 'border-red-500' : ''}
            />
            {formErrors.harga_per_lembar && (
              <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>
            )}
          </div>

          {/* Preview */}
          {selectedSize && selectedGramasi && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                </div>
                Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Ukuran:</p>
                  <p className="font-medium text-gray-900">
                    {formatUkuranDisplay(
                      parsePL(formatPLFromSheet(selectedSize.panjang_sh, selectedSize.lebar_sh)).panjang,
                      parsePL(formatPLFromSheet(selectedSize.panjang_sh, selectedSize.lebar_sh)).lebar
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">GSM:</p>
                  <p className="font-medium text-gray-900">{selectedGramasi.gsm} GSM</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">PL Format:</p>
                  <p className="font-mono text-gray-900">{formatPLFromSheet(selectedSize.panjang_sh, selectedSize.lebar_sh)}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Harga:</p>
                  <p className="font-medium text-gray-900">
                    {addFormData.harga_per_lembar ? formatCurrency(parseFloat(addFormData.harga_per_lembar)) : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {formErrors.general && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{formErrors.general}</p>
              </div>
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
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleEdit}
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Menyimpan...' : 'Update'}
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
                        {editingItem.pl ? 
                          formatUkuranDisplay(editingItem.panjang, editingItem.lebar) : 
                          `${editingItem.panjang}×${editingItem.lebar} cm`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">GSM:</p>
                      <p className="font-medium text-blue-900">{editingItem.gsm} GSM</p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Harga:</p>
                      <p className="font-medium text-blue-900">{formatCurrency(editingItem.harga_per_lembar)}</p>
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
                options={sheetSizeList.map(item => {
                  const plValue = formatPLFromSheet(item.panjang_sh, item.lebar_sh)
                  const { panjang, lebar } = parsePL(plValue)
                  return {
                    value: item.id_sh,
                    label: `${formatUkuranDisplay(panjang, lebar)} (${plValue} mm)`
                  }
                })}
                placeholder="Pilih Ukuran"
                disabled={isPosting}
              />
              {formErrors.sheet_size_id && (
                <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>
              )}
            </div>

            {/* GSM Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSM Baru <span className="text-red-500">*</span>
              </label>
              <Select
                value={editFormData.gramasi_id}
                onChange={(e) => handleEditInputChange('gramasi_id', e.target.value)}
                options={gramasiList.map(item => ({
                  value: item.id,
                  label: `${item.gsm} GSM`
                }))}
                placeholder="Pilih GSM"
                disabled={isPosting}
              />
              {formErrors.gramasi_id && (
                <p className="text-xs text-red-600 mt-2">{formErrors.gramasi_id}</p>
              )}
            </div>

            {/* Harga Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Baru
              </label>
              <Input
                type="number"
                value={editFormData.harga_per_lembar}
                onChange={(e) => handleEditInputChange('harga_per_lembar', e.target.value)}
                placeholder="10000"
                leftIcon="mdi:cash"
                disabled={isPosting}
              />
              {formErrors.harga_per_lembar && (
                <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>
              )}
            </div>

            {/* Preview Update */}
            {editSelectedSize && editSelectedGramasi && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                  </div>
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Ukuran Baru:</p>
                    <p className="font-medium text-gray-900">
                      {formatUkuranDisplay(
                        parsePL(formatPLFromSheet(editSelectedSize.panjang_sh, editSelectedSize.lebar_sh)).panjang,
                        parsePL(formatPLFromSheet(editSelectedSize.panjang_sh, editSelectedSize.lebar_sh)).lebar
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">GSM Baru:</p>
                    <p className="font-medium text-gray-900">{editSelectedGramasi.gsm} GSM</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">PL Format:</p>
                    <p className="font-mono text-gray-900">{formatPLFromSheet(editSelectedSize.panjang_sh, editSelectedSize.lebar_sh)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Harga Baru:</p>
                    <p className="font-medium text-gray-900">
                      {editFormData.harga_per_lembar ? formatCurrency(parseFloat(editFormData.harga_per_lembar)) : '-'}
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