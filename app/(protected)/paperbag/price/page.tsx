'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import EmptyState from '@/components/UI/EmptyState'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ============ TYPES ============
interface PaperbagPrice {
  id: string
  material_type_id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
  updated_at: string | null
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
  name: string
  material_type: string
  is_premium: string
}

interface MaterialType {
  id: string
  name: string
  material_type: string
  is_premium: string
}

interface SheetSize {
  id: string
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
}

interface ApiResponse {
  status: number
  message: string
  data: PaperbagPrice[]
}

interface MaterialApiResponse {
  status: number
  message: string
  data: MaterialType[]
}

interface SheetSizeApiResponse {
  status: number
  message: string
  data: SheetSize[]
}

interface AddFormData {
  material_type_id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
}

interface EditFormData {
  material_type_id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
}

// ============ HELPERS ============
const formatCurrency = (value: string) => {
  const num = parseFloat(value)
  return isNaN(num) ? 'Rp 0' : `Rp ${num.toLocaleString('id-ID')}`
}

const formatCm = (mm: string) => {
  const val = parseFloat(mm)
  return isNaN(val) ? mm : `${(val / 10).toFixed(0)} cm`
}

const calcAreaM2 = (panjang: string, lebar: string): number => {
  const p = parseFloat(panjang)
  const l = parseFloat(lebar)
  if (isNaN(p) || isNaN(l)) return 0
  return (p * l) / 1_000_000
}

const formatAreaM2 = (panjang: string, lebar: string): string => {
  const area = calcAreaM2(panjang, lebar)
  return area === 0 ? '—' : `${area.toFixed(4)} m²`
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
}

// ============ MATERIAL CONFIG ============
const materialConfig: Record<string, { color: string; icon: string; label: string }> = {
  'IV': { color: 'amber', icon: 'mdi:file-document-outline', label: 'Ivory' },
  'AP': { color: 'blue', icon: 'mdi:file-image-outline', label: 'Art Paper' },
  'KP': { color: 'brown', icon: 'mdi:package-variant', label: 'Kraft' },
  'D':  { color: 'purple', icon: 'mdi:layers-triple-outline', label: 'Duplex' },
  'K':  { color: 'yellow', icon: 'mdi:package-variant-closed', label: 'Brown Kraft' },
  'W':  { color: 'gray', icon: 'mdi:file-outline', label: 'White Kraft' },
}

const getMaterialConfig = (type: string) =>
  materialConfig[type] || { color: 'gray', icon: 'mdi:file-outline', label: type || 'Unknown' }

const EMPTY_ADD_FORM: AddFormData = {
  material_type_id: '',
  gsm: '',
  sheet_size_id: '',
  harga_lembar: '',
}

// ============ MAIN COMPONENT ============
export default function PaperbagSheetPricesPage() {
  const [priceList, setPriceList]         = useState<PaperbagPrice[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [sheetSizes, setSheetSizes]       = useState<SheetSize[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [isPosting, setIsPosting]         = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all')

  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [selectedItem, setSelectedItem]   = useState<PaperbagPrice | null>(null)

  const [editForm, setEditForm] = useState<EditFormData>({
    material_type_id: '',
    gsm: '',
    sheet_size_id: '',
    harga_lembar: '',
  })
  const [addForm, setAddForm] = useState<AddFormData>(EMPTY_ADD_FORM)

  // ===== STATS =====
  const stats = useMemo(() => {
    const total     = priceList.length
    const allPrices = priceList.map(p => parseFloat(p.harga_lembar)).filter(n => !isNaN(n))
    const allGsm    = priceList.map(p => parseInt(p.gsm)).filter(g => !isNaN(g))
    const uniqueMat = new Set(priceList.map(p => p.material_type)).size
    return {
      total,
      minPrice: allPrices.length ? Math.min(...allPrices) : 0,
      maxPrice: allPrices.length ? Math.max(...allPrices) : 0,
      minGsm:   allGsm.length ? Math.min(...allGsm) : 0,
      maxGsm:   allGsm.length ? Math.max(...allGsm) : 0,
      uniqueMat,
    }
  }, [priceList])

  // ===== UNIQUE MATERIAL TYPES IN LIST =====
  const uniqueMaterialTypes = useMemo(() => {
    const types = new Set(priceList.map(p => p.material_type))
    return Array.from(types).sort()
  }, [priceList])

  // ===== FILTERED BY MATERIAL =====
  const filtered = useMemo(() => {
    if (selectedMaterial === 'all') return priceList
    return priceList.filter(p => p.material_type === selectedMaterial)
  }, [priceList, selectedMaterial])

  // ===== GROUP BY MATERIAL + SIZE =====
  const groupedByMaterial = useMemo(() => {
    const grouped: Record<string, PaperbagPrice[]> = {}
    filtered.forEach(item => {
      const key = `${item.material_type}-${item.sheet_size_id}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(item)
    })
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => parseInt(a.gsm) - parseInt(b.gsm))
    })
    return grouped
  }, [filtered])

  // ===== SELECTED SHEET SIZE FOR PREVIEW =====
  const selectedAddSize = useMemo(
    () => sheetSizes.find(s => s.id === addForm.sheet_size_id),
    [sheetSizes, addForm.sheet_size_id]
  )
  const selectedEditSize = useMemo(
    () => sheetSizes.find(s => s.id === editForm.sheet_size_id),
    [sheetSizes, editForm.sheet_size_id]
  )
  const selectedAddMaterial = useMemo(
    () => materialTypes.find(m => m.id === addForm.material_type_id),
    [materialTypes, addForm.material_type_id]
  )
  const selectedEditMaterial = useMemo(
    () => materialTypes.find(m => m.id === editForm.material_type_id),
    [materialTypes, editForm.material_type_id]
  )

  // ===== AUTO SWITCH TAB WHEN FILTERED MATERIAL HAS NO ITEMS =====
  useEffect(() => {
    // Check if current selected material has no items after data changes
    if (selectedMaterial !== 'all') {
      const hasItemsInSelectedMaterial = priceList.some(
        p => p.material_type === selectedMaterial
      );
      
      if (!hasItemsInSelectedMaterial && priceList.length > 0) {
        // If selected material has no items but other materials exist, switch to 'all'
        setSelectedMaterial('all');
      }
    }
  }, [priceList, selectedMaterial]);

  // ===== API: FETCH ALL DATA =====
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse>('/Admin/Paperbag/PaperbagSheetPrices')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setPriceList(data.data)
      } else {
        setPriceList([])
        setError('Format response tidak sesuai')
      }
    } catch (err) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
      setPriceList([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMasterData = useCallback(async () => {
    try {
      const [matRes, sizeRes] = await Promise.all([
        axios.get<MaterialApiResponse>('/Admin/Material/MaterialType'),
        axios.get<SheetSizeApiResponse>('/Admin/Paperbag/PaperbagSheetSizes'),
      ])
      if (matRes.data?.status === 200)  setMaterialTypes(matRes.data.data)
      if (sizeRes.data?.status === 200) setSheetSizes(sizeRes.data.data)
    } catch {
      // non-fatal: form select will be empty but page still works
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    fetchMasterData()
  }, [fetchPrices, fetchMasterData])

  // ===== HANDLERS: VIEW =====
  const handleViewClick = (item: PaperbagPrice) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // ===== HANDLERS: EDIT =====
  const handleEditClick = (item: PaperbagPrice) => {
    setSelectedItem(item)
    setEditForm({
      material_type_id: item.material_type_id,
      gsm:              item.gsm,
      sheet_size_id:    item.sheet_size_id,
      harga_lembar:     item.harga_lembar,
    })
    setShowViewModal(false)
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!selectedItem) return

    const gsm   = Number(editForm.gsm)
    const harga = Number(editForm.harga_lembar)

    if (!editForm.material_type_id) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Pilih material terlebih dahulu.', confirmButtonColor: '#10B981' })
      return
    }
    if (!editForm.sheet_size_id) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Pilih ukuran sheet terlebih dahulu.', confirmButtonColor: '#10B981' })
      return
    }
    if (isNaN(gsm) || gsm <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'GSM tidak valid.', confirmButtonColor: '#10B981' })
      return
    }
    if (isNaN(harga) || harga <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Harga lembar tidak valid.', confirmButtonColor: '#10B981' })
      return
    }

    try {
      setIsPosting(true)
      // Note: backend membaca GSM dari field 'panjang_mm' (bug typo di backend PHP)
      // Edit menggunakan PUT dengan id sebagai path param: /PaperbagSheetPricesEdit/{id}
      await axios.put(`/Admin/Paperbag/PaperbagSheetPricesEdit/${selectedItem.id}`, {
        material_type_id: editForm.material_type_id,
        panjang_mm:       editForm.gsm,     // ← workaround bug backend
        sheet_size_id:    editForm.sheet_size_id,
        harga_lembar:     editForm.harga_lembar,
      })
      await fetchPrices()
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data harga sheet berhasil diperbarui!',
        timer: 1500,
        showConfirmButton: false,
      })
      setShowEditModal(false)
      setSelectedItem(null)
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Gagal menyimpan data'),
        confirmButtonColor: '#10B981',
      })
    } finally {
      setIsPosting(false)
    }
  }


  // ===== HANDLERS: DELETE =====
  const handleDelete = async (item: PaperbagPrice) => {
    // Check if this is the last item in its material category
    const itemsInSameMaterial = priceList.filter(
      p => p.material_type === item.material_type
    );
    const isLastInMaterial = itemsInSameMaterial.length === 1;
    
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Data?',
      html: `Yakin ingin menghapus harga <strong>${item.name} ${item.gsm}gsm</strong> ukuran <strong>${item.keterangan}</strong>?<br/>
             ${isLastInMaterial ? '<br/><span style="color:#F59E0B;">⚠️ Ini adalah data terakhir untuk material ini. Setelah dihapus, material ini akan hilang dari filter.</span>' : ''}
             <br/><span style="font-size:12px;color:#6B7280">Tindakan ini tidak bisa dibatalkan.</span>`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
    })
    if (!result.isConfirmed) return

    try {
      // Backend: DELETE /{id} sebagai path param, fallback id_paperbag di body
      await axios.delete(`/Admin/Paperbag/PaperbagSheetPricesDelete/${item.id}`, {
        data: { id_paperbag: item.id },
      })
      await fetchPrices()
      
      // Show success message with context
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Dihapus!',
        text: isLastInMaterial 
          ? `Data terakhir untuk material ${item.name} telah dihapus.` 
          : `Data ${item.name} ${item.gsm}gsm berhasil dihapus.`,
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: getErrMsg(err, 'Gagal menghapus data'),
        confirmButtonColor: '#10B981',
      })
    }
  }

  // ===== HANDLERS: ADD =====
  const handleOpenAdd = () => {
    setAddForm(EMPTY_ADD_FORM)
    setShowAddModal(true)
  }

  const handleAdd = async () => {
    const gsm   = Number(addForm.gsm)
    const harga = Number(addForm.harga_lembar)

    if (!addForm.material_type_id) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Pilih material terlebih dahulu.', confirmButtonColor: '#10B981' })
      return
    }
    if (!addForm.sheet_size_id) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Pilih ukuran sheet terlebih dahulu.', confirmButtonColor: '#10B981' })
      return
    }
    if (isNaN(gsm) || gsm <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'GSM tidak valid.', confirmButtonColor: '#10B981' })
      return
    }
    if (isNaN(harga) || harga <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Harga lembar tidak valid.', confirmButtonColor: '#10B981' })
      return
    }

    try {
      setIsPosting(true)
      // Note: backend membaca GSM dari field 'panjang_mm' (bug typo di backend PHP)
      // $this->post('panjang_mm', true) diassign ke key 'gsm' di controller
      await axios.post('/Admin/Paperbag/PaperbagSheetPricesAdd', {
        material_type_id: addForm.material_type_id,
        panjang_mm:       addForm.gsm,      // ← workaround bug backend
        sheet_size_id:    addForm.sheet_size_id,
        harga_lembar:     addForm.harga_lembar,
      })
      await fetchPrices()
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data harga sheet baru berhasil ditambahkan!',
        timer: 1500,
        showConfirmButton: false,
      })
      setShowAddModal(false)
      setAddForm(EMPTY_ADD_FORM)
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Gagal menambahkan data'),
        confirmButtonColor: '#10B981',
      })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== SHARED SELECT CLASSES =====
  const selectClass = (disabled?: boolean) =>
    `w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat data Harga Sheet Paperbag..." />
  if (error)   return <ErrorState message={error} onRetry={fetchPrices} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Icon icon="mdi:currency-idr" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Harga Sheet Paperbag
            </h1>
            <p className="text-gray-600 mt-1">Kelola harga sheet berdasarkan material, ukuran, dan GSM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPrices} className="border-gray-300" icon="mdi:refresh">
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd} icon="mdi:plus">
            Tambah Harga
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full group-hover:bg-emerald-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-4 h-4 text-emerald-600" />
              Total Variasi
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">kombinasi material & GSM</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:currency-usd" className="w-4 h-4 text-blue-600" />
              Range Harga
            </p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.minPrice.toString())}</p>
            <p className="text-xs text-gray-500">s/d {formatCurrency(stats.maxPrice.toString())}</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:weight" className="w-4 h-4 text-amber-600" />
              Range GSM
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.minGsm}</p>
            <p className="text-xs text-gray-500">s/d {stats.maxGsm} gsm</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:material-ui" className="w-4 h-4 text-purple-600" />
              Jenis Material
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.uniqueMat}</p>
            <p className="text-xs text-gray-500">tipe material tersedia</p>
          </div>
        </Card>
      </div>

      {/* ===== FILTER BUTTONS ===== */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Icon icon="mdi:filter-outline" className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter Material:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedMaterial('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedMaterial === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Semua Material
            </button>
            {uniqueMaterialTypes.map(type => {
              const config = getMaterialConfig(type)
              const hasItems = priceList.some(p => p.material_type === type)
              
              return (
                <button
                  key={type}
                  onClick={() => hasItems && setSelectedMaterial(type)}
                  disabled={!hasItems}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedMaterial === type
                      ? `bg-${config.color}-500 text-white shadow-md`
                      : hasItems
                        ? `bg-white border border-gray-200 text-gray-700 hover:bg-${config.color}-50`
                        : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Icon icon={config.icon} className="w-4 h-4" />
                  {config.label}
                  {!hasItems && <Icon icon="mdi:close-circle" className="w-3 h-3 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ===== SUMMARY ===== */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold text-emerald-600">{filtered.length}</span> dari{' '}
          <span className="font-semibold">{stats.total}</span> variasi harga
          {selectedMaterial !== 'all' && ` untuk material ${getMaterialConfig(selectedMaterial).label}`}
        </p>
      </div>

      {/* ===== PRICE LIST ===== */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          selectedMaterial === 'all' ? (
            // No data at all
            <EmptyState
              icon="mdi:currency-usd-off"
              title="Tidak ada data harga"
              message="Belum ada data harga sheet yang tersedia. Klik tombol 'Tambah Harga' untuk menambahkan data pertama."
              actionLabel="Tambah Harga"
              onAction={handleOpenAdd}
            />
          ) : (
            // No data for selected material
            <EmptyState
              icon="mdi:filter-off"
              title={`Tidak ada data untuk material ${getMaterialConfig(selectedMaterial).label}`}
              message={`Material ini belum memiliki data harga. Silahkan tambah data baru atau pilih material lain.`}
              actionLabel="Tambah Harga"
              onAction={handleOpenAdd}
            />
          )
        ) : (
          Object.entries(groupedByMaterial).map(([key, items]) => {
            const firstItem    = items[0]
            const matConfig    = getMaterialConfig(firstItem.material_type)
            const area         = formatAreaM2(firstItem.panjang_mm, firstItem.lebar_mm)

            return (
              <Card key={key} className="border-0 shadow-lg overflow-hidden">
                {/* Header Group */}
                <div className={`bg-gradient-to-r from-${matConfig.color}-50 to-${matConfig.color}-100/50 px-6 py-4 border-b border-${matConfig.color}-200`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-${matConfig.color}-100 rounded-xl flex items-center justify-center`}>
                        <Icon icon={matConfig.icon} className={`w-6 h-6 text-${matConfig.color}-600`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {firstItem.name}
                          <span className={`text-xs px-2 py-1 bg-${matConfig.color}-200 text-${matConfig.color}-700 rounded-full`}>
                            {firstItem.material_type}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {firstItem.code} • {firstItem.keterangan} • {area}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-gray-600">Ukuran: </span>
                      <span className="font-semibold">
                        {formatCm(firstItem.panjang_mm)} x {formatCm(firstItem.lebar_mm)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">GSM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Harga Lembar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Harga/m²</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map(item => {
                        const areaVal    = calcAreaM2(item.panjang_mm, item.lebar_mm)
                        const pricePerM2 = areaVal > 0 ? parseFloat(item.harga_lembar) / areaVal : 0

                        return (
                          <tr key={`${item.id}-${item.gsm}-${item.sheet_size_id}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.gsm} gsm
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(item.harga_lembar)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{formatCurrency(pricePerM2.toFixed(0))}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleViewClick(item)}
                                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Lihat Detail"
                                >
                                  <Icon icon="mdi:eye" className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Icon icon="mdi:pencil" className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus"
                                >
                                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="🔍 Detail Harga Sheet"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Tutup</Button>
            <Button variant="primary" onClick={() => selectedItem && handleEditClick(selectedItem)} icon="mdi:pencil">
              Edit Harga
            </Button>
          </div>
        }
      >
        {selectedItem && (() => {
          const config     = getMaterialConfig(selectedItem.material_type)
          const area       = calcAreaM2(selectedItem.panjang_mm, selectedItem.lebar_mm)
          const pricePerM2 = area > 0 ? parseFloat(selectedItem.harga_lembar) / area : 0

          return (
            <div className="space-y-5">
              <div className={`bg-gradient-to-r from-${config.color}-50 to-${config.color}-100/50 p-5 rounded-xl border border-${config.color}-200`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-${config.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon icon={config.icon} className={`w-7 h-7 text-${config.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
                        {selectedItem.material_type}
                      </span>
                      <span className="text-sm text-gray-600">{selectedItem.gsm} gsm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-emerald-50/50 border-emerald-200">
                  <p className="text-xs text-emerald-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:currency-idr" className="w-3.5 h-3.5" />
                    Harga Lembar
                  </p>
                  <p className="text-xl font-bold text-emerald-800">{formatCurrency(selectedItem.harga_lembar)}</p>
                </Card>
                <Card className="p-4 bg-blue-50/50 border-blue-200">
                  <p className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:select-all" className="w-3.5 h-3.5" />
                    Harga/m²
                  </p>
                  <p className="text-xl font-bold text-blue-800">{formatCurrency(pricePerM2.toFixed(0))}</p>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-amber-50/50 border-amber-200">
                  <p className="text-xs text-amber-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:ruler" className="w-3.5 h-3.5" />
                    Ukuran
                  </p>
                  <p className="text-sm font-semibold text-amber-800">{selectedItem.code}</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {formatCm(selectedItem.panjang_mm)} x {formatCm(selectedItem.lebar_mm)}
                  </p>
                </Card>
                <Card className="p-4 bg-purple-50/50 border-purple-200">
                  <p className="text-xs text-purple-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:select-all" className="w-3.5 h-3.5" />
                    Luas
                  </p>
                  <p className="text-sm font-semibold text-purple-800">
                    {formatAreaM2(selectedItem.panjang_mm, selectedItem.lebar_mm)}
                  </p>
                </Card>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Keterangan Ukuran</span>
                  <span className="text-sm font-medium text-gray-900">{selectedItem.keterangan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Premium</span>
                  <span className="text-sm font-medium text-gray-900">{selectedItem.is_premium === '1' ? 'Ya' : 'Tidak'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Terakhir Update</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedItem.updated_at
                      ? new Date(selectedItem.updated_at).toLocaleString('id-ID')
                      : 'Belum pernah diupdate'}
                  </span>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`✏️ Edit Harga — ${selectedItem?.name} ${selectedItem?.gsm}gsm`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => !isPosting && setShowEditModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleUpdate} loading={isPosting} disabled={isPosting}>
              Simpan Perubahan
            </Button>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Info banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Edit Data Harga Sheet</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Ubah material, ukuran, GSM, atau harga lembar sesuai kebutuhan.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:pencil" className="w-3 h-3 text-emerald-600" />
                </div>
                Form Edit
              </h3>

              {/* Material Select */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Icon icon="mdi:material-ui" className="w-4 h-4" />
                  Material
                </label>
                <select
                  value={editForm.material_type_id}
                  onChange={e => setEditForm(p => ({ ...p, material_type_id: e.target.value }))}
                  disabled={isPosting}
                  className={selectClass(isPosting)}
                >
                  <option value="">-- Pilih Material --</option>
                  {materialTypes.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.material_type}){m.is_premium === '1' ? ' ⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sheet Size Select */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Icon icon="mdi:ruler" className="w-4 h-4" />
                  Ukuran Sheet
                </label>
                <select
                  value={editForm.sheet_size_id}
                  onChange={e => setEditForm(p => ({ ...p, sheet_size_id: e.target.value }))}
                  disabled={isPosting}
                  className={selectClass(isPosting)}
                >
                  <option value="">-- Pilih Ukuran --</option>
                  {sheetSizes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.keterangan} ({s.code})
                    </option>
                  ))}
                </select>
                {selectedEditSize && (
                  <p className="text-xs text-gray-500 mt-1">
                    Luas: {formatAreaM2(selectedEditSize.panjang_mm, selectedEditSize.lebar_mm)}
                  </p>
                )}
              </div>

              {/* GSM */}
              <Input
                label="GSM"
                type="number"
                min={1}
                step={1}
                value={editForm.gsm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, gsm: e.target.value }))}
                disabled={isPosting}
                leftIcon="mdi:weight"
              />

              {/* Harga */}
              <Input
                label="Harga Lembar (Rp)"
                type="number"
                min={1}
                step={100}
                value={editForm.harga_lembar}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, harga_lembar: e.target.value }))}
                disabled={isPosting}
                leftIcon="mdi:currency-idr"
              />

              {/* Live preview */}
              {editForm.gsm && editForm.harga_lembar && editForm.material_type_id && (
                <div className="bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
                  <span className="text-xs text-emerald-600 flex items-center gap-1.5 mb-2">
                    <Icon icon="mdi:calculator" className="w-4 h-4" />
                    Preview
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-emerald-700">Material:</span>
                      <span className="ml-2 font-medium text-emerald-900">
                        {selectedEditMaterial?.name || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700">Ukuran:</span>
                      <span className="ml-2 font-medium text-emerald-900">
                        {selectedEditSize?.keterangan || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700">GSM:</span>
                      <span className="ml-2 font-medium text-emerald-900">{editForm.gsm} gsm</span>
                    </div>
                    <div>
                      <span className="text-emerald-700">Harga:</span>
                      <span className="ml-2 font-medium text-emerald-900">{formatCurrency(editForm.harga_lembar)}</span>
                    </div>
                    {selectedEditSize && editForm.harga_lembar && (
                      <div className="col-span-2">
                        <span className="text-emerald-700">Harga/m²:</span>
                        <span className="ml-2 font-medium text-emerald-900">
                          {formatCurrency(
                            (parseFloat(editForm.harga_lembar) / calcAreaM2(selectedEditSize.panjang_mm, selectedEditSize.lebar_mm)).toFixed(0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="➕ Tambah Harga Sheet Baru"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              Simpan Data
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Info banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Tambah Variasi Harga Baru</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Isi semua field untuk menambahkan kombinasi material, ukuran, dan GSM baru.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:plus" className="w-3 h-3 text-blue-600" />
              </div>
              Form Tambah Data
            </h3>

            {/* Material Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Icon icon="mdi:material-ui" className="w-4 h-4" />
                Material <span className="text-red-500">*</span>
              </label>
              <select
                value={addForm.material_type_id}
                onChange={e => setAddForm(p => ({ ...p, material_type_id: e.target.value }))}
                disabled={isPosting}
                className={selectClass(isPosting)}
              >
                <option value="">-- Pilih Material --</option>
                {materialTypes.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.material_type}){m.is_premium === '1' ? ' ⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Sheet Size Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Icon icon="mdi:ruler" className="w-4 h-4" />
                Ukuran Sheet <span className="text-red-500">*</span>
              </label>
              <select
                value={addForm.sheet_size_id}
                onChange={e => setAddForm(p => ({ ...p, sheet_size_id: e.target.value }))}
                disabled={isPosting}
                className={selectClass(isPosting)}
              >
                <option value="">-- Pilih Ukuran --</option>
                {sheetSizes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.keterangan} ({s.code})
                  </option>
                ))}
              </select>
              {selectedAddSize && (
                <p className="text-xs text-gray-500 mt-1">
                  Luas: {formatAreaM2(selectedAddSize.panjang_mm, selectedAddSize.lebar_mm)}
                </p>
              )}
            </div>

            {/* GSM */}
            <Input
              label="GSM *"
              type="number"
              min={1}
              step={1}
              placeholder="Contoh: 250"
              value={addForm.gsm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddForm(p => ({ ...p, gsm: e.target.value }))}
              disabled={isPosting}
              leftIcon="mdi:weight"
            />

            {/* Harga */}
            <Input
              label="Harga Lembar (Rp) *"
              type="number"
              min={1}
              step={100}
              placeholder="Contoh: 2500"
              value={addForm.harga_lembar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddForm(p => ({ ...p, harga_lembar: e.target.value }))}
              disabled={isPosting}
              leftIcon="mdi:currency-idr"
            />

            {/* Live preview */}
            {addForm.gsm && addForm.harga_lembar && addForm.material_type_id && addForm.sheet_size_id && (
              <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                <span className="text-xs text-blue-600 flex items-center gap-1.5 mb-2">
                  <Icon icon="mdi:calculator" className="w-4 h-4" />
                  Preview Data Baru
                </span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700">Material:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {selectedAddMaterial?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Ukuran:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {selectedAddSize?.keterangan || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">GSM:</span>
                    <span className="ml-2 font-medium text-blue-900">{addForm.gsm} gsm</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Harga:</span>
                    <span className="ml-2 font-medium text-blue-900">{formatCurrency(addForm.harga_lembar)}</span>
                  </div>
                  {selectedAddSize && addForm.harga_lembar && (
                    <div className="col-span-2">
                      <span className="text-blue-700">Harga/m²:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        {formatCurrency(
                          (parseFloat(addForm.harga_lembar) / calcAreaM2(selectedAddSize.panjang_mm, selectedAddSize.lebar_mm)).toFixed(0)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}