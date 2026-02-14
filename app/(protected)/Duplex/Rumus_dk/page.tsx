// app/(protected)/duplex-dk/page.tsx

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

// ===== TYPE DEFINITIONS =====
interface DuplexDataDK {
  id: number
  panjang: number
  lebar: number
  harga_per_lembar: number
  gsm: number
  type: 'DK'
  pl?: string
  sheet_size_id?: string
  gramasi_id?: string
  created_at?: string
}

interface FormData {
  sheet_size_id: string
  gramasi_id: string
  harga_per_lembar: string
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

interface Stats {
  totalRecords: number
  averagePrice: number
  totalCombinations: number
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
    return { panjang: 0, lebar: 0 }
  }
}

const formatUkuranDisplay = (panjang: number, lebar: number): string => {
  return `${panjang} × ${lebar} cm`
}

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

// Helper untuk format harga dengan pengecekan 0
const formatHargaDisplay = (amount: number): string => {
  if (amount === 0) return '-'
  return formatCurrency(amount)
}

const getGSMBadgeClass = (gsm: number): string => {
  if (gsm <= 270) return 'bg-blue-100 text-blue-800 border border-blue-200'
  if (gsm <= 350) return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  return 'bg-red-100 text-red-800 border border-red-200'
}

// ===== MAIN COMPONENT =====
export default function DuplexDKPage() {
  // ===== STATE =====
  const [dataDK, setDataDK] = useState<DuplexDataDK[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  // Data master
  const [gramasiList, setGramasiList] = useState<GramasiItem[]>([])
  const [sheetSizeList, setSheetSizeList] = useState<SheetSizeItem[]>([])
  const [loadingGramasi, setLoadingGramasi] = useState(false)
  const [loadingSheetSize, setLoadingSheetSize] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DuplexDataDK | null>(null)

  // Form states
  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    averagePrice: 0,
    totalCombinations: 0
  })

  // ===== SORTED DATA BY GSM =====
  // Mengurutkan data berdasarkan GSM (dari terkecil ke terbesar)
  const sortedDataDK = useMemo(() => {
    return [...dataDK].sort((a, b) => {
      // Urutkan berdasarkan GSM (ascending)
      if (a.gsm !== b.gsm) {
        return a.gsm - b.gsm
      }
      // Jika GSM sama, urutkan berdasarkan ukuran (panjang * lebar)
      const luasA = a.panjang * a.lebar
      const luasB = b.panjang * b.lebar
      return luasA - luasB
    })
  }, [dataDK])

  // ===== FETCH GRAMASI =====
  const fetchGramasi = useCallback(async () => {
    try {
      setLoadingGramasi(true)
      const response = await axiosInstance.get('Admin/Duplek/gramasiIndex')
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setGramasiList(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching gramasi:', err)
    } finally {
      setLoadingGramasi(false)
    }
  }, [])

  // ===== FETCH SHEET SIZES =====
  const fetchSheetSizes = useCallback(async () => {
    try {
      setLoadingSheetSize(true)
      const response = await axiosInstance.get('Admin/Duplek/shetSizeIndex')
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setSheetSizeList(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching sheet sizes:', err)
    } finally {
      setLoadingSheetSize(false)
    }
  }, [])

  // ===== FETCH DUPLEX DK =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get('Admin/Duplek/duplekKraftPrices')
      
      console.log('Fetch Response:', response.data) // Debug log
      
      let priceData: any[] = []
      if (Array.isArray(response.data?.data)) {
        priceData = response.data.data
      } else if (Array.isArray(response.data)) {
        priceData = response.data
      }

      console.log('Price Data:', priceData) // Debug log

      if (priceData.length === 0) {
        setDataDK([])
        setError('Belum ada data DK. Silakan tambah data baru.')
        return
      }

      const processed: DuplexDataDK[] = priceData
        .map((item: any, index: number) => {
          try {
            if (!item.panjang_sh || !item.lebar_sh || !item.gsm) return null

            const plValue = formatPLFromSheet(item.panjang_sh, item.lebar_sh)
            const { panjang, lebar } = parsePL(plValue)

            return {
              id: parseInt(item.id_mp) || index + 1,
              panjang,
              lebar,
              harga_per_lembar: parseFloat(item.harga_per_lembar) || 0,
              gsm: parseInt(item.gsm) || 0,
              type: 'DK',
              pl: plValue,
              sheet_size_id: item.sheet_size_id,
              gramasi_id: item.gramasi_id,
              created_at: item.created_at
            }
          } catch {
            return null
          }
        })
        .filter((item): item is DuplexDataDK => item !== null)

      console.log('Processed Data:', processed) // Debug log

      setDataDK(processed)
      calculateStats(processed)
      
    } catch (err: any) {
      console.error('Fetch Error:', err) // Debug log
      setError(err.response?.data?.message || 'Gagal mengambil data DK')
    } finally {
      setLoading(false)
    }
  }, [])

  // ===== CALCULATE STATS =====
  const calculateStats = (data: DuplexDataDK[]) => {
    const totalRecords = data.length
    const dataWithPrice = data.filter(item => item.harga_per_lembar > 0)
    const totalPrice = dataWithPrice.reduce((sum, item) => sum + item.harga_per_lembar, 0)
    const uniqueCombinations = new Set(
      data.map(item => `${item.panjang}x${item.lebar}x${item.gsm}`)
    ).size

    setStats({
      totalRecords,
      averagePrice: dataWithPrice.length > 0 ? totalPrice / dataWithPrice.length : 0,
      totalCombinations: uniqueCombinations
    })
  }

  // ===== VALIDATION =====
  const validateForm = (formData: FormData, isEdit: boolean = false): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!formData.sheet_size_id) errors.sheet_size_id = 'Ukuran tidak boleh kosong'
    if (!formData.gramasi_id) errors.gramasi_id = 'GSM tidak boleh kosong'
    
    // Harga boleh kosong atau 0, validasi hanya jika diisi
    if (formData.harga_per_lembar && formData.harga_per_lembar.trim() !== '') {
      const harga = parseFloat(formData.harga_per_lembar)
      if (isNaN(harga)) errors.harga_per_lembar = 'Harga harus berupa angka'
      else if (harga < 0) errors.harga_per_lembar = 'Harga tidak boleh negatif'
    }

    // Cek duplicate untuk add (tidak untuk edit)
    if (!isEdit && formData.sheet_size_id && formData.gramasi_id) {
      const isDuplicate = dataDK.some(item =>
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

  // ===== ADD HANDLER =====
  const handleAdd = async () => {
    const errors = validateForm(addFormData, false)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    // Proses harga seperti di kode singleface
    let hargaValue = 0
    if (addFormData.harga_per_lembar && addFormData.harga_per_lembar.trim() !== '') {
      hargaValue = parseFloat(addFormData.harga_per_lembar)
    }

    // Kirim sebagai number 0 jika kosong
    const payload = {
      gramasi: addFormData.gramasi_id,
      pl: addFormData.sheet_size_id,
       harga_per_lembar: hargaValue.toString()
    }

    console.log('Add Payload:', payload) // Debug log

    try {
      setIsPosting(true)
      
      const response = await axiosInstance.post('Admin/Duplek/duplekKraftPricesAdd', payload)
      
      console.log('Add Response:', response) // Debug log
      
      const isSuccess = response.status === 200 || response.data?.status === 200
      
      if (isSuccess) {
        await fetchData()
        SweetAlert.success('Berhasil!', 'Data Duplex DK berhasil ditambahkan')
        setShowAddModal(false)
        resetAddForm()
      } else {
        throw new Error(response.data?.message || 'Gagal menambahkan data')
      }
    } catch (err: any) {
      console.error('Add Error:', err) // Debug log
      SweetAlert.error('Error!', err.response?.data?.message || err.message)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLER =====
  const handleEdit = async () => {
    if (!editingItem) return

    const errors = validateForm(editFormData, true)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    // Proses harga seperti di kode singleface
    let hargaValue = 0
    if (editFormData.harga_per_lembar && editFormData.harga_per_lembar.trim() !== '') {
      hargaValue = parseFloat(editFormData.harga_per_lembar)
    }

    const payload = {
      gramasi: editFormData.gramasi_id,
      pl: editFormData.sheet_size_id,
      harga_per_lembar: hargaValue  // Kirim sebagai number, bukan string
    }

    console.log('Edit Payload:', payload, 'ID:', editingItem.id) // Debug log

    try {
      setIsPosting(true)
      
      const response = await axiosInstance.put(
        `Admin/Duplek/duplekKraftPricesEdit/${editingItem.id}`,
        payload
      )
      
      console.log('Edit Response:', response) // Debug log
      
      const isSuccess = response.status === 200 || response.data?.status === 200
      
      if (isSuccess) {
        await fetchData()
        SweetAlert.success('Berhasil!', 'Data Duplex DK berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        resetEditForm()
      } else {
        throw new Error(response.data?.message || 'Gagal mengupdate data')
      }
    } catch (err: any) {
      console.error('Edit Error:', err) // Debug log
      SweetAlert.error('Error!', err.response?.data?.message || err.message)
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
        `Admin/Duplek/duplekKraftPricesDel/${id}`
      )
      
      if (response.status === 200) {
        await fetchData()
        SweetAlert.success('Berhasil!', 'Data Duplex DK berhasil dihapus')
      }
    } catch (err: any) {
      SweetAlert.error('Error!', err.response?.data?.message || 'Gagal menghapus data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== FORM RESET =====
  const resetAddForm = () => {
    setAddFormData({ ...BASE_FORM })
    setFormErrors({})
  }

  const resetEditForm = () => {
    setEditFormData({ ...BASE_FORM })
    setFormErrors({})
  }

  // ===== HANDLE EDIT CLICK =====
  const handleEditClick = (item: DuplexDataDK) => {
    setEditingItem(item)
    setEditFormData({
      sheet_size_id: item.sheet_size_id || '',
      gramasi_id: item.gramasi_id || '',
      harga_per_lembar: item.harga_per_lembar > 0 ? item.harga_per_lembar.toString() : ''
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  // ===== FORM HANDLERS =====
  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }))
    if (field === 'sheet_size_id' || field === 'gramasi_id') {
      if (formErrors.general) setFormErrors(prev => ({ ...prev, general: '' }))
    }
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  // ===== INITIAL LOAD =====
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchGramasi(), fetchSheetSizes()])
    }
    loadInitialData()
  }, [fetchGramasi, fetchSheetSizes])

  useEffect(() => {
    if (sheetSizeList.length > 0 && gramasiList.length > 0) {
      fetchData()
    }
  }, [sheetSizeList, gramasiList, fetchData])

  // ===== RENDER =====
  if (loading && dataDK.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:package-variant" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Data Duplex DK...</p>
          <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
        </div>
      </div>
    )
  }

  if (error && dataDK.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-red-200 bg-red-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:alert-circle" className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <Button onClick={fetchData} variant="danger" className="mx-auto">
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:package-variant-closed" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Duplex DK
            </h1>
            <p className="text-gray-600 mt-1">Kelola ukuran dan harga Duplex Rumus DK</p>
          </div>
        </div>
        
        <Button
          variant="primary"
          onClick={() => {
            resetAddForm()
            setShowAddModal(true)
          }}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          icon="mdi:plus"
        >
          Tambah Ukuran DK
        </Button>
      </div>

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
            <p className="text-3xl font-bold text-gray-900">{formatHargaDisplay(stats.averagePrice)}</p>
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
              Daftar Ukuran Duplex DK
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
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-gray-300 hover:bg-gray-50"
              icon="mdi:refresh"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Table - Gunakan sortedDataDK, bukan dataDK */}
        {sortedDataDK.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:package-variant" className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data Duplex DK</h3>
            <p className="text-gray-500 mb-6">Silakan tambah data baru</p>
            <Button
              onClick={() => {
                resetAddForm()
                setShowAddModal(true)
              }}
              variant="primary"
              icon="mdi:plus"
            >
              Tambah Data
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
                {sortedDataDK.map((item, index) => {
                  const luasM2 = (item.panjang * item.lebar) / 10000
                  const hargaPerM2 = item.harga_per_lembar > 0 ? item.harga_per_lembar / luasM2 : 0

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors duration-150">
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
                        <div className="font-bold text-gray-900">{formatHargaDisplay(item.harga_per_lembar)}</div>
                        {item.harga_per_lembar > 0 && (
                          <div className="text-xs text-gray-500 mt-1">{formatCurrency(hargaPerM2)}/m²</div>
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
        {sortedDataDK.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Menampilkan {sortedDataDK.length} dari {stats.totalRecords} data
            </div>
            <button
              onClick={() => SweetAlert.info('Export', 'Exporting duplex DK data...')}
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
        onClose={() => {
          setShowAddModal(false)
          resetAddForm()
        }}
        title="➕ Tambah Ukuran Duplex DK"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddModal(false)
                resetAddForm()
              }}
              disabled={isPosting}
            >
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
                  GSM dan Ukuran wajib diisi. Harga per lembar boleh dikosongkan atau diisi 0 jika belum ada harga (akan ditampilkan sebagai "-").
                </p>
              </div>
            </div>
          </div>

          {/* GSM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSM <span className="text-red-500">*</span>
            </label>
            <Select
              value={addFormData.gramasi_id}
              onChange={(e) => handleAddInputChange('gramasi_id', e.target.value)}
              options={gramasiList.map(item => ({
                value: item.id,
                label: `${item.gsm} GSM`
              }))}
              placeholder="Pilih GSM"
              disabled={isPosting}
              className={formErrors.gramasi_id ? 'border-red-500' : ''}
            />
            {formErrors.gramasi_id && (
              <p className="text-xs text-red-600 mt-2">{formErrors.gramasi_id}</p>
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
              options={sheetSizeList.map(item => {
                const { panjang, lebar } = parsePL(formatPLFromSheet(item.panjang_sh, item.lebar_sh))
                return {
                  value: item.id_sh,
                  label: formatUkuranDisplay(panjang, lebar)
                }
              })}
              placeholder="Pilih Ukuran"
              disabled={isPosting}
              className={formErrors.sheet_size_id ? 'border-red-500' : ''}
            />
            {formErrors.sheet_size_id && (
              <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>
            )}
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga per Lembar
              <span className="text-gray-500 text-xs ml-2">(opsional - kosongkan atau isi 0 jika belum ada harga)</span>
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
            {formErrors.harga_per_lembar && (
              <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>
            )}
          </div>

          {/* Preview */}
          {addFormData.sheet_size_id && addFormData.gramasi_id && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                </div>
                Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(() => {
                  const sheetSize = sheetSizeList.find(s => s.id_sh === addFormData.sheet_size_id)
                  const gramasi = gramasiList.find(g => g.id === addFormData.gramasi_id)
                  if (!sheetSize || !gramasi) return null
                  
                  const { panjang, lebar } = parsePL(formatPLFromSheet(sheetSize.panjang_sh, sheetSize.lebar_sh))
                  const hargaValue = parseFloat(addFormData.harga_per_lembar || '0')
                  
                  return (
                    <>
                      <div>
                        <p className="text-gray-600 mb-1">Ukuran:</p>
                        <p className="font-medium text-gray-900">{formatUkuranDisplay(panjang, lebar)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">GSM:</p>
                        <p className="font-medium text-gray-900">{gramasi.gsm} GSM</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 mb-1">Harga:</p>
                        <p className="font-medium text-green-600">
                          {hargaValue === 0 ? '-' : formatCurrency(hargaValue)}
                        </p>
                      </div>
                    </>
                  )
                })()}
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
        onClose={() => {
          setShowEditModal(false)
          setEditingItem(null)
          resetEditForm()
        }}
        title="✏️ Edit Ukuran Duplex DK"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditModal(false)
                setEditingItem(null)
                resetEditForm()
              }}
              disabled={isPosting}
            >
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
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Data Saat Ini</h4>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
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
                      <p className="font-medium text-blue-900">{formatHargaDisplay(editingItem.harga_per_lembar)}</p>
                    </div>
                  </div>
                </div>
              </div>
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
                  const { panjang, lebar } = parsePL(formatPLFromSheet(item.panjang_sh, item.lebar_sh))
                  return {
                    value: item.id_sh,
                    label: formatUkuranDisplay(panjang, lebar)
                  }
                })}
                placeholder="Pilih Ukuran"
                disabled={isPosting}
              />
            </div>

            {/* Harga Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Baru
                <span className="text-gray-500 text-xs ml-2">(opsional - kosongkan atau isi 0 jika belum ada harga)</span>
              </label>
              <Input
                type="number"
                value={editFormData.harga_per_lembar}
                onChange={(e) => handleEditInputChange('harga_per_lembar', e.target.value)}
                placeholder="0"
                leftIcon="mdi:cash"
                disabled={isPosting}
                min="0"
                step="100"
              />
            </div>

            {/* Preview Update */}
            {editFormData.sheet_size_id && editFormData.gramasi_id && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                  </div>
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(() => {
                    const sheetSize = sheetSizeList.find(s => s.id_sh === editFormData.sheet_size_id)
                    const gramasi = gramasiList.find(g => g.id === editFormData.gramasi_id)
                    if (!sheetSize || !gramasi) return null
                    
                    const { panjang, lebar } = parsePL(formatPLFromSheet(sheetSize.panjang_sh, sheetSize.lebar_sh))
                    const hargaValue = parseFloat(editFormData.harga_per_lembar || '0')
                    
                    return (
                      <>
                        <div>
                          <p className="text-gray-600 mb-1">Ukuran Baru:</p>
                          <p className="font-medium text-gray-900">{formatUkuranDisplay(panjang, lebar)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">GSM Baru:</p>
                          <p className="font-medium text-gray-900">{gramasi.gsm} GSM</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600 mb-1">Harga Baru:</p>
                          <p className="font-medium text-green-600">
                            {hargaValue === 0 ? '-' : formatCurrency(hargaValue)}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}