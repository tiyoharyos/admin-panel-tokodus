'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
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

interface Stats {
  totalItems: number
  minPrice: number
  maxPrice: number
  avgPrice: number
  minGsm: number
  maxGsm: number
  uniqueMaterials: number
  uniqueSizes: number
}

interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}

// ============ CONSTANTS ============
const EMPTY_FORM = {
  material_type_id: '',
  gsm: '',
  sheet_size_id: '',
  harga_lembar: '',
}

// ============ MATERIAL STYLE CONFIG ============
const ACCENT_COLORS = [
  { bg: '#3b82f6', text: '#1d4ed8' }, // Blue - Art Paper
  { bg: '#f59e0b', text: '#92400e' }, // Amber - Ivory
  { bg: '#f97316', text: '#9a3412' }, // Orange - Kraft
  { bg: '#8b5cf6', text: '#5b21b6' }, // Purple - Duplex
  { bg: '#ca8a04', text: '#854d0e' }, // Yellow - Brown Kraft
  { bg: '#6b7280', text: '#374151' }, // Gray - White Kraft
]

const MATERIAL_STYLE_MAP: Record<string, number> = {
  'AP': 0,  // Art Paper
  'IV': 1,  // Ivory
  'KP': 2,  // Kraft
  'D': 3,   // Duplex
  'K': 4,   // Brown Kraft
  'W': 5,   // White Kraft
}

const getMaterialAccent = (materialType: string) => {
  const index = MATERIAL_STYLE_MAP[materialType] ?? 0
  return ACCENT_COLORS[index % ACCENT_COLORS.length]
}

// ============ BADGE ============
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: `${color}18`, color }}
    >
      {children}
    </span>
  )
}

// ============ UTILS ============
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(num)
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString))
  } catch { return dateString }
}

const formatCm = (mm: string) => {
  const val = parseFloat(mm)
  return isNaN(val) ? mm : `${(val / 10).toFixed(0)} cm`
}

const calcAreaM2 = (panjang: string, lebar: string): number => {
  const p = parseFloat(panjang), l = parseFloat(lebar)
  if (isNaN(p) || isNaN(l)) return 0
  return (p * l) / 1_000_000
}

const formatAreaM2 = (panjang: string, lebar: string): string => {
  const area = calcAreaM2(panjang, lebar)
  return area === 0 ? '—' : `${area.toFixed(4)} m²`
}

const formatMaterialLabel = (type: string): string => {
  const map: Record<string, string> = {
    'AP': 'Art Paper',
    'IV': 'Ivory',
    'KP': 'Kraft',
    'D': 'Duplex',
    'K': 'Brown Kraft',
    'W': 'White Kraft'
  }
  return map[type] || type
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
}

// ============ CUSTOM HOOK ============
const usePaperbagPrices = () => {
  const [priceList, setPriceList] = useState<PaperbagPrice[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [sheetSizes, setSheetSizes] = useState<SheetSize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const { data } = await axios.get<ApiResponse<PaperbagPrice[]>>('/Admin/Paperbag/PaperbagSheetPrices')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setPriceList(data.data)
      } else {
        setPriceList([]); setError('Format response tidak sesuai')
      }
    } catch (err) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server')); setPriceList([])
    } finally { setLoading(false) }
  }, [])

  const fetchMasterData = useCallback(async () => {
    try {
      const [matRes, sizeRes] = await Promise.all([
        axios.get<ApiResponse<MaterialType[]>>('/Admin/Material/MaterialType'),
        axios.get<ApiResponse<SheetSize[]>>('/Admin/Paperbag/PaperbagSheetSizes'),
      ])
      if (matRes.data?.status === 200) setMaterialTypes(matRes.data.data || [])
      if (sizeRes.data?.status === 200) setSheetSizes(sizeRes.data.data || [])
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => { fetchPrices(); fetchMasterData() }, [fetchPrices, fetchMasterData])

  return { priceList, materialTypes, sheetSizes, loading, error, refetch: fetchPrices }
}

// ============ STATS HOOK ============
const usePriceStats = (priceList: PaperbagPrice[]): Stats => {
  return useMemo(() => {
    if (!priceList.length) return { 
      totalItems: 0, minPrice: 0, maxPrice: 0, avgPrice: 0, 
      minGsm: 0, maxGsm: 0, uniqueMaterials: 0, uniqueSizes: 0 
    }
    
    const prices = priceList.map(p => parseFloat(p.harga_lembar)).filter(n => !isNaN(n))
    const gsms = priceList.map(p => parseInt(p.gsm)).filter(g => !isNaN(g))
    
    return {
      totalItems: priceList.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minGsm: Math.min(...gsms),
      maxGsm: Math.max(...gsms),
      uniqueMaterials: new Set(priceList.map(p => p.material_type)).size,
      uniqueSizes: new Set(priceList.map(p => p.sheet_size_id)).size,
    }
  }, [priceList])
}

// ============ MAIN COMPONENT ============
export default function PaperbagSheetPricesPage() {
  const { priceList, materialTypes, sheetSizes, loading, error, refetch } = usePaperbagPrices()
  const stats = usePriceStats(priceList)

  const [isPosting, setIsPosting] = useState(false)
  const [filterMat, setFilterMat] = useState<string>('all')
  const [filterSize, setFilterSize] = useState<string>('all')

  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PaperbagPrice | null>(null)
  const [editingItem, setEditingItem] = useState<PaperbagPrice | null>(null)

  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  // ===== DERIVED DATA =====
  const uniqueMaterials = useMemo(() => 
    Array.from(new Set(priceList.map(p => p.material_type))).sort(), 
  [priceList])
  
  const materialGroups = useMemo(() => {
    const groups: Record<string, PaperbagPrice[]> = {}
    priceList.forEach(item => {
      if (!groups[item.material_type]) groups[item.material_type] = []
      groups[item.material_type].push(item)
    })
    return Object.entries(groups)
      .map(([type, items]) => ({ material_type: type, items }))
      .sort((a, b) => a.material_type.localeCompare(b.material_type))
  }, [priceList])

  const filteredData = useMemo(() => 
    priceList.filter(p =>
      (filterMat === 'all' || p.material_type === filterMat) &&
      (filterSize === 'all' || p.sheet_size_id === filterSize)
    ), [priceList, filterMat, filterSize]
  )

  const selectedAddSize = useMemo(() => 
    sheetSizes.find(s => s.id === addForm.sheet_size_id), 
  [sheetSizes, addForm.sheet_size_id])
  
  const selectedEditSize = useMemo(() => 
    sheetSizes.find(s => s.id === editForm.sheet_size_id), 
  [sheetSizes, editForm.sheet_size_id])
  
  const selectedAddMaterial = useMemo(() => 
    materialTypes.find(m => m.id === addForm.material_type_id), 
  [materialTypes, addForm.material_type_id])
  
  const selectedEditMaterial = useMemo(() => 
    materialTypes.find(m => m.id === editForm.material_type_id), 
  [materialTypes, editForm.material_type_id])

  // Reset filters when data changes
  useEffect(() => {
    if (filterMat !== 'all' && !priceList.some(p => p.material_type === filterMat)) setFilterMat('all')
    if (filterSize !== 'all' && !priceList.some(p => p.sheet_size_id === filterSize)) setFilterSize('all')
  }, [priceList, filterMat, filterSize])

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async () => {
    const result = await Swal.fire({
      icon: 'question', title: 'Refresh Data?',
      text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6', cancelButtonColor: '#6B7280'
    })
    if (result.isConfirmed) {
      await refetch()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil di-refresh!', timer: 1500, showConfirmButton: false })
    }
  }, [refetch])

  const validateForm = (data: typeof EMPTY_FORM): string | null => {
    if (!data.material_type_id) return 'Pilih material terlebih dahulu.'
    if (!data.sheet_size_id) return 'Pilih ukuran sheet terlebih dahulu.'
    if (isNaN(Number(data.gsm)) || Number(data.gsm) <= 0) return 'GSM tidak valid.'
    if (isNaN(Number(data.harga_lembar)) || Number(data.harga_lembar) <= 0) return 'Harga lembar tidak valid.'
    return null
  }

  const handleViewClick = (item: PaperbagPrice) => { setSelectedItem(item); setShowViewModal(true) }

  const handleEditClick = (item: PaperbagPrice) => {
    setEditingItem(item)
    setEditForm({
      material_type_id: item.material_type_id,
      gsm: item.gsm,
      sheet_size_id: item.sheet_size_id,
      harga_lembar: item.harga_lembar
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    const err = validateForm(editForm)
    if (err) { 
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' }); 
      return 
    }
    
    try {
      setIsPosting(true)
      const fd = new URLSearchParams()
      fd.append('material_type_id', editForm.material_type_id)
      fd.append('panjang_mm', editForm.gsm)
      fd.append('sheet_size_id', editForm.sheet_size_id)
      fd.append('harga_lembar', editForm.harga_lembar)
      
      const { data } = await axios.put<ApiResponse>(
        `/Admin/Paperbag/PaperbagSheetPricesEdit/${editingItem.id}`,
        fd.toString(), 
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data harga sheet berhasil diperbarui!', timer: 1500, showConfirmButton: false })
        setShowEditModal(false)
        setEditingItem(null)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menyimpan data' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data') })
    } finally {
      setIsPosting(false)
    }
  }

  const handleAdd = async () => {
    const err = validateForm(addForm)
    if (err) { 
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' }); 
      return 
    }
    
    try {
      setIsPosting(true)
      const fd = new URLSearchParams()
      fd.append('material_type_id', addForm.material_type_id)
      fd.append('panjang_mm', addForm.gsm)
      fd.append('sheet_size_id', addForm.sheet_size_id)
      fd.append('harga_lembar', addForm.harga_lembar)
      
      const { data } = await axios.post<ApiResponse>(
        '/Admin/Paperbag/PaperbagSheetPricesAdd',
        fd.toString(), 
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Harga sheet baru berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
        setShowAddModal(false)
        setAddForm(EMPTY_FORM)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menambahkan data' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menambahkan data') })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (item: PaperbagPrice) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Konfirmasi Hapus',
      html: `Hapus data <strong>${item.name} (${item.material_type}) - ${item.gsm} gsm - ${item.keterangan}</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6B7280',
    })
    
    if (!result.isConfirmed) return

    try {
      const body = new URLSearchParams()
      body.append('id_paperbag', item.id)

      const { data } = await axios.delete<ApiResponse>(
        `/Admin/Paperbag/PaperbagSheetPricesDelete/${item.id}`,
        {
          data: body.toString(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      )

      if (data?.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Dihapus!',
          text: `Data berhasil dihapus.`,
          timer: 1500,
          showConfirmButton: false,
        })
        await refetch()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: data?.message || 'Gagal menghapus data',
          confirmButtonColor: '#ef4444',
        })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: getErrMsg(err, 'Gagal menghapus data') })
    }
  }

  const handleCloseAddModal = () => { if (!isPosting) { setShowAddModal(false); setAddForm(EMPTY_FORM) } }
  const handleCloseEditModal = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null) } }
  const handleCloseDetailModal = () => { setShowViewModal(false); setSelectedItem(null) }

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat Data Harga Sheet Paperbag..." icon="mdi:tag-multiple-outline" />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const TABLE_HEADERS = ['GSM', 'Harga / Lembar', 'Harga / m²', 'Ukuran', 'Aksi']

  const renderRows = (items: PaperbagPrice[]) => 
    items.map((item) => {
      const accent = getMaterialAccent(item.material_type)
      const areaVal = calcAreaM2(item.panjang_mm, item.lebar_mm)
      const pricePerM2 = areaVal > 0 ? parseFloat(item.harga_lembar) / areaVal : 0
      
      return (
        <tr key={`${item.material_type_id}-${item.sheet_size_id}-${item.gsm}`} className="hover:bg-slate-50/80 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge color="#6b7280">
              {item.gsm} gsm
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm font-bold text-slate-800">{formatCurrency(item.harga_lembar)}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm" style={{ color: accent.text }}>
              {formatCurrency(pricePerM2.toFixed(0))}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-xs text-gray-500">
              {item.code} • {formatCm(item.panjang_mm)}×{formatCm(item.lebar_mm)}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-1">
              <button onClick={() => handleViewClick(item)} title="Detail"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Icon icon="mdi:eye-outline" className="w-5 h-5" />
              </button>
              <button onClick={() => handleEditClick(item)} title="Edit"
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(item)} title="Hapus"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Icon icon="mdi:delete-outline" className="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
      )
    })

  const TableHead = () => (
    <thead className="bg-gray-50">
      <tr>
        {TABLE_HEADERS.map(h => (
          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:tag-multiple-outline" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Harga Sheet Paperbag</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola harga berdasarkan material, ukuran, dan GSM</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">
            Refresh Data
          </Button>
          <Button onClick={() => setShowAddModal(true)} variant="primary" size="md" icon="mdi:plus">
            Tambah Data Baru
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'mdi:format-list-bulleted', label: 'Total Variasi', value: String(stats.totalItems), 
            sub: `${stats.uniqueMaterials} material · ${stats.uniqueSizes} ukuran` },
          { icon: 'mdi:currency-idr', label: 'Rentang Harga', 
            value: `${formatCurrency(stats.minPrice)} – ${formatCurrency(stats.maxPrice)}`, 
            sub: `Rata-rata ${formatCurrency(stats.avgPrice)}` },
          { icon: 'mdi:weight', label: 'Rentang GSM', 
            value: `${stats.minGsm} – ${stats.maxGsm} gsm`, 
            sub: `${stats.totalItems} entri harga tersedia` },
          { icon: 'mdi:view-grid-outline', label: 'Jenis Material', 
            value: String(stats.uniqueMaterials), 
            sub: `${stats.uniqueSizes} ukuran sheet aktif` },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== FILTER TABS ===== */}
      <Card shadow="sm" padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Icon icon="mdi:filter-outline" className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filter Material:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMat === 'all' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({priceList.length})
            </button>
            {materialGroups.map(group => {
              const accent = getMaterialAccent(group.material_type)
              const isActive = filterMat === group.material_type
              return (
                <button key={group.material_type}
                  onClick={() => setFilterMat(group.material_type)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={isActive 
                    ? { background: accent.bg, color: '#fff' } 
                    : { background: `${accent.bg}12`, color: accent.text }}>
                  {formatMaterialLabel(group.material_type)} ({group.items.length})
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ===== MAIN CONTENT ===== */}
      {priceList.length === 0 ? (
        <Card shadow="md" padding="none">
          <div className="flex flex-col items-center gap-3 py-16">
            <Icon icon="mdi:database-off" className="w-16 h-16 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg">Belum ada data harga sheet</p>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} icon="mdi:plus">
              Tambah Data Baru
            </Button>
          </div>
        </Card>
      ) : filterMat === 'all' ? (
        // Grouped by material type
        <div className="space-y-4">
          {materialGroups.map(group => {
            const accent = getMaterialAccent(group.material_type)
            return (
              <Card key={group.material_type} shadow="md" padding="none">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                  style={{ background: `${accent.bg}08` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accent.bg}18` }}>
                      <Icon icon="mdi:file-document-outline" className="w-5 h-5" style={{ color: accent.bg }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{formatMaterialLabel(group.material_type)}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: accent.text }}>
                        {group.material_type} · {group.items.length} item
                      </p>
                    </div>
                  </div>
                  <Badge color={accent.bg}>{group.items.length} item</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <TableHead />
                    <tbody className="bg-white divide-y divide-gray-100">
                      {renderRows(group.items)}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        // Single filtered view
        <Card shadow="md" padding="none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">{formatMaterialLabel(filterMat)}</h3>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{filterMat} · {filteredData.length} item</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFilterMat('all')} icon="mdi:arrow-left">
              Lihat Semua Material
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <TableHead />
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Icon icon="mdi:database-off" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Tidak ada data untuk filter ini</p>
                    </td>
                  </tr>
                ) : renderRows(filteredData)}
              </tbody>
            </table>
          </div>
          {filteredData.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                Menampilkan <span className="font-medium text-slate-700">{filteredData.length}</span> item
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ===== ADD MODAL ===== */}
      <Modal isOpen={showAddModal} onClose={handleCloseAddModal} title="Tambah Harga Sheet Baru" size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </>
        }
      >
        <PriceForm
          form={addForm}
          onFormChange={setAddForm}
          materialTypes={materialTypes}
          sheetSizes={sheetSizes}
          selectedSize={selectedAddSize}
          selectedMaterial={selectedAddMaterial}
          disabled={isPosting}
          mode="add"
        />
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} 
        title={`Edit — ${editingItem?.name} ${editingItem?.gsm} gsm`} size="lg" 
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleUpdate} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {editingItem && (
          <PriceForm
            form={editForm}
            onFormChange={setEditForm}
            materialTypes={materialTypes}
            sheetSizes={sheetSizes}
            selectedSize={selectedEditSize}
            selectedMaterial={selectedEditMaterial}
            disabled={isPosting}
            mode="edit"
          />
        )}
      </Modal>

      {/* ===== DETAIL MODAL ===== */}
      <Modal isOpen={showViewModal} onClose={handleCloseDetailModal} title="Detail Harga Sheet" size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseDetailModal}>Tutup</Button>
            <Button variant="primary" icon="mdi:pencil-outline"
              onClick={() => { 
                if (selectedItem) { 
                  handleCloseDetailModal(); 
                  handleEditClick(selectedItem) 
                } 
              }}>
              Edit Data
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const accent = getMaterialAccent(selectedItem.material_type)
          const areaVal = calcAreaM2(selectedItem.panjang_mm, selectedItem.lebar_mm)
          const pricePerM2 = areaVal > 0 ? parseFloat(selectedItem.harga_lembar) / areaVal : 0
          
          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${accent.bg}0d` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent.bg}20` }}>
                  <Icon icon="mdi:file-document-outline" className="w-7 h-7" style={{ color: accent.bg }} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{selectedItem.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={accent.bg}>{selectedItem.material_type}</Badge>
                    <span className="text-xs text-gray-500">{selectedItem.gsm} gsm</span>
                    {selectedItem.is_premium === '1' && (
                      <Badge color="#f59e0b">Premium</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Info */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:cash-multiple" className="w-3.5 h-3.5" /> Informasi Harga
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Harga / Lembar</p>
                    <p className="font-bold text-slate-700 text-sm">{formatCurrency(selectedItem.harga_lembar)}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: `${accent.bg}10` }}>
                    <p className="text-xs mb-1" style={{ color: accent.text }}>Harga / m²</p>
                    <p className="font-bold text-lg" style={{ color: accent.bg }}>{formatCurrency(pricePerM2.toFixed(0))}</p>
                  </div>
                </div>
              </Card>

              {/* Dimension Info */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5" /> Informasi Ukuran
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <p className="text-xs text-blue-600">Kode</p>
                    <p className="font-semibold text-blue-800 text-sm">{selectedItem.code}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg">
                    <p className="text-xs text-green-600">Ukuran</p>
                    <p className="font-semibold text-green-800 text-sm">
                      {formatCm(selectedItem.panjang_mm)}×{formatCm(selectedItem.lebar_mm)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <p className="text-xs text-purple-600">Luas</p>
                    <p className="font-semibold text-purple-800 text-sm">
                      {formatAreaM2(selectedItem.panjang_mm, selectedItem.lebar_mm)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Metadata */}
              <Card shadow="none" padding="sm" bordered>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Keterangan</span>
                    <span className="text-slate-700 font-medium">{selectedItem.keterangan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">ID Record</span>
                    <span className="font-mono text-slate-600 text-xs">{selectedItem.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Terakhir Update</span>
                    <span className="text-slate-600">{formatDate(selectedItem.updated_at)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

// ============ PRICE FORM COMPONENT ============
interface PriceFormProps {
  form: typeof EMPTY_FORM
  onFormChange: (f: typeof EMPTY_FORM) => void
  materialTypes: MaterialType[]
  sheetSizes: SheetSize[]
  selectedSize?: SheetSize
  selectedMaterial?: MaterialType
  disabled: boolean
  mode: 'add' | 'edit'
}

function PriceForm({ 
  form, onFormChange, materialTypes, sheetSizes, selectedSize, 
  selectedMaterial, disabled, mode 
}: PriceFormProps) {
  const accent = selectedMaterial 
    ? getMaterialAccent(selectedMaterial.material_type) 
    : ACCENT_COLORS[0]

  const previewPricePerM2 = useMemo(() => {
    if (!selectedSize || !form.harga_lembar) return null
    const area = calcAreaM2(selectedSize.panjang_mm, selectedSize.lebar_mm)
    return area > 0 ? parseFloat(form.harga_lembar) / area : null
  }, [selectedSize, form.harga_lembar])

  const isPreviewReady = form.gsm && form.harga_lembar && form.material_type_id && form.sheet_size_id

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-center gap-3 p-4 rounded-lg border"
        style={{ background: `${accent.bg}08`, borderColor: `${accent.bg}30` }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent.bg}18` }}>
          <Icon icon={mode === 'add' ? 'mdi:information-outline' : 'mdi:pencil-outline'} 
            className="w-5 h-5" style={{ color: accent.bg }} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">
            {mode === 'add' ? 'Tambah Data Baru' : 'Mode Edit'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === 'add' 
              ? 'Pilih material, ukuran sheet, dan isi GSM serta harga'
              : 'Perbarui data harga sesuai kebutuhan'}
          </p>
        </div>
      </div>

      {/* Material & Size Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Icon icon="mdi:material-ui" className="w-4 h-4 text-gray-400" />
            Material <span className="text-red-500">*</span>
          </label>
          <select
            value={form.material_type_id}
            onChange={e => onFormChange({ ...form, material_type_id: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">— Pilih Material —</option>
            {materialTypes.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.material_type}){m.is_premium === '1' ? ' ⭐ Premium' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Icon icon="mdi:ruler" className="w-4 h-4 text-gray-400" />
            Ukuran Sheet <span className="text-red-500">*</span>
          </label>
          <select
            value={form.sheet_size_id}
            onChange={e => onFormChange({ ...form, sheet_size_id: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">— Pilih Ukuran —</option>
            {sheetSizes.map(s => (
              <option key={s.id} value={s.id}>
                {s.keterangan} ({s.code}) — {formatAreaM2(s.panjang_mm, s.lebar_mm)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GSM & Price */}
      <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon icon="mdi:tag" className="w-3.5 h-3.5 text-blue-600" />
          </div>
          Spesifikasi & Harga
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="GSM *" type="number" min={1} step={1}
            placeholder="Contoh: 250"
            value={form.gsm}
            onChange={e => onFormChange({ ...form, gsm: e.target.value })}
            disabled={disabled}
            leftIcon="mdi:weight"
          />
          <Input
            label="Harga Lembar (Rp) *" type="number" min={1} step={100}
            placeholder="Contoh: 2500"
            value={form.harga_lembar}
            onChange={e => onFormChange({ ...form, harga_lembar: e.target.value })}
            disabled={disabled}
            leftIcon="mdi:currency-idr"
          />
        </div>
      </div>

      {/* Live preview */}
      {isPreviewReady && (
        <div className="rounded-xl px-4 py-3.5 border" style={{ background: `${accent.bg}08`, borderColor: `${accent.bg}30` }}>
          <p className="text-xs font-semibold flex items-center gap-1.5 mb-3" style={{ color: accent.text }}>
            <Icon icon="mdi:eye-check-outline" className="w-4 h-4" />
            Preview Data
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              { label: 'Material', value: selectedMaterial ? `${selectedMaterial.name} (${selectedMaterial.material_type})` : '—' },
              { label: 'Ukuran', value: selectedSize?.keterangan || '—' },
              { label: 'GSM', value: `${form.gsm} gsm` },
              { label: 'Harga Lembar', value: formatCurrency(form.harga_lembar) },
              ...(previewPricePerM2 !== null ? [{ label: 'Harga / m²', value: formatCurrency(previewPricePerM2.toFixed(0)) }] : []),
              ...(selectedSize ? [{ label: 'Luas Sheet', value: formatAreaM2(selectedSize.panjang_mm, selectedSize.lebar_mm) }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-gray-500">{label}:</span>
                <span className="font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}