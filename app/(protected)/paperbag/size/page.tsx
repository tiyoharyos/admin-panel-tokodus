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
interface SheetSize {
  id: string
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
}

interface Stats {
  totalSizes: number
  avgArea: number
  maxArea: number
  minArea: number
  totalArea: number
  smallestSize: { code: string; area: number } | null
  largestSize: { code: string; area: number } | null
}

interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}

// ============ CONSTANTS ============
const DIMENSION_TYPES = [
  { id: 'panjang', label: 'Panjang', field: 'panjang_mm', icon: 'mdi:arrow-left-right', color: '#3b82f6' },
  { id: 'lebar',   label: 'Lebar',   field: 'lebar_mm',   icon: 'mdi:arrow-up-down',    color: '#06b6d4' }
] as const

const EMPTY_ADD_FORM = {
  code: '',
  panjang_mm: '',
  lebar_mm: '',
  keterangan: ''
}

// ============ UTILS ============
const formatMm = (mm: string) => {
  const val = parseFloat(mm)
  return isNaN(val) ? mm : `${val.toFixed(0)} mm`
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
  return area === 0 ? '0 m²' : `${area.toFixed(4)} m²`
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
}

/**
 * Auto-generate keterangan dari panjang & lebar (mm).
 * Contoh: panjang=650, lebar=1000 → "65x100 cm"
 */
const autoKeterangan = (panjang_mm: string, lebar_mm: string): string => {
  const p = parseFloat(panjang_mm)
  const l = parseFloat(lebar_mm)
  if (isNaN(p) || isNaN(l) || p <= 0 || l <= 0) return ''
  return `${(p / 10).toFixed(0)}x${(l / 10).toFixed(0)} cm`
}

/**
 * Auto-generate code dari panjang & lebar (mm).
 * Contoh: panjang=650, lebar=1000 → "65x100"
 */
const autoCode = (panjang_mm: string, lebar_mm: string): string => {
  const p = parseFloat(panjang_mm)
  const l = parseFloat(lebar_mm)
  if (isNaN(p) || isNaN(l) || p <= 0 || l <= 0) return ''
  return `${(p / 10).toFixed(0)}x${(l / 10).toFixed(0)}`
}

// ===== BADGE COMPONENT =====
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

// ===== SIZE CATEGORY =====
const getSizeCategory = (panjang: string, lebar: string): { label: string; color: string; icon: string } => {
  const area = calcAreaM2(panjang, lebar)
  if (area < 0.65)  return { label: 'Kecil',  color: 'sky',    icon: 'mdi:crop-square'    }
  if (area < 0.85)  return { label: 'Sedang', color: 'amber',  icon: 'mdi:crop-5-4'       }
  if (area < 1.05)  return { label: 'Besar',  color: 'violet', icon: 'mdi:crop-landscape' }
  return                   { label: 'Extra',  color: 'rose',   icon: 'mdi:crop-free'      }
}

// ===== CUSTOM HOOK =====
const useSheetSizes = () => {
  const [sizeList, setSizeList] = useState<SheetSize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse<SheetSize[]>>('/Admin/Paperbag/PaperbagSheetSizes')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setSizeList(data.data)
      } else {
        setSizeList([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
      setSizeList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return { sizeList, loading, error, refetch: fetchData, setSizeList }
}

const useSheetStats = (sizeList: SheetSize[]) => {
  return useMemo((): Stats => {
    if (sizeList.length === 0) return {
      totalSizes: 0, avgArea: 0, maxArea: 0, minArea: 0, totalArea: 0,
      smallestSize: null, largestSize: null
    }
    
    const areas = sizeList.map(s => ({
      ...s,
      area: calcAreaM2(s.panjang_mm, s.lebar_mm)
    })).filter(a => a.area > 0)
    
    const totalArea = areas.reduce((sum, a) => sum + a.area, 0)
    const avgArea = areas.length ? totalArea / areas.length : 0
    const maxArea = areas.length ? Math.max(...areas.map(a => a.area)) : 0
    const minArea = areas.length ? Math.min(...areas.map(a => a.area)) : 0
    
    const largestSize = areas.length ? areas.find(a => a.area === maxArea) || null : null
    const smallestSize = areas.length ? areas.find(a => a.area === minArea) || null : null

    return {
      totalSizes: sizeList.length,
      avgArea,
      maxArea,
      minArea,
      totalArea,
      smallestSize: smallestSize ? { code: smallestSize.code, area: smallestSize.area } : null,
      largestSize: largestSize ? { code: largestSize.code, area: largestSize.area } : null
    }
  }, [sizeList])
}

// ============ MAIN COMPONENT ============
export default function PaperbagSheetSizesPage() {
  const { sizeList, loading, error, refetch, setSizeList } = useSheetSizes()
  const stats = useSheetStats(sizeList)

  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [selectedItem, setSelectedItem] = useState<SheetSize | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_ADD_FORM)
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM)

  // ===== FILTERED =====
  const filtered = useMemo(() =>
    sizeList.filter(s =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.keterangan.toLowerCase().includes(search.toLowerCase())
    ), [sizeList, search])

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

  const validateForm = (data: typeof EMPTY_ADD_FORM): string | null => {
    const p = Number(data.panjang_mm)
    const l = Number(data.lebar_mm)

    if (!data.code.trim()) return 'Code tidak boleh kosong.'
    if (isNaN(p) || p <= 0) return 'Panjang (mm) tidak valid.'
    if (isNaN(l) || l <= 0) return 'Lebar (mm) tidak valid.'
    if (!data.keterangan.trim()) return 'Keterangan tidak boleh kosong.'
    
    return null
  }

  // VIEW
  const handleViewClick = (item: SheetSize) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // EDIT
  const handleEditClick = (item: SheetSize) => {
    setSelectedItem(item)
    setEditForm({
      code: item.code,
      panjang_mm: item.panjang_mm,
      lebar_mm: item.lebar_mm,
      keterangan: item.keterangan
    })
    setShowViewModal(false)
    setShowEditModal(true)
  }

  // ADD
  const handleAddClick = () => {
    setAddForm(EMPTY_ADD_FORM)
    setShowAddModal(true)
  }

  // ADD FORM: auto-fill code & keterangan saat panjang/lebar berubah
  const handleAddDimensionChange = (field: 'panjang_mm' | 'lebar_mm', value: string) => {
    setAddForm(prev => {
      const p = field === 'panjang_mm' ? value : prev.panjang_mm
      const l = field === 'lebar_mm'   ? value : prev.lebar_mm
      return {
        ...prev,
        [field]: value,
        code: autoCode(p, l),
        keterangan: autoKeterangan(p, l),
      }
    })
  }

  // EDIT FORM: auto-fill saat panjang/lebar berubah
  const handleEditDimensionChange = (field: 'panjang_mm' | 'lebar_mm', value: string) => {
    setEditForm(prev => {
      const p = field === 'panjang_mm' ? value : prev.panjang_mm
      const l = field === 'lebar_mm'   ? value : prev.lebar_mm
      return {
        ...prev,
        [field]: value,
        code: autoCode(p, l),
        keterangan: autoKeterangan(p, l),
      }
    })
  }

  // SUBMIT ADD
  const handleAdd = async () => {
    const err = validateForm(addForm)
    if (err) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' })
      return
    }

    try {
      setIsPosting(true)
      
      // Backend mapping: lebar_mm → layer_2, keterangan → layer_2_type
      const formData = new URLSearchParams()
      formData.append('code', addForm.code.trim())
      formData.append('panjang_mm', addForm.panjang_mm)
      formData.append('layer_2', addForm.lebar_mm)
      formData.append('layer_2_type', addForm.keterangan.trim())

      const { data } = await axios.post<ApiResponse<SheetSize>>(
        '/Admin/Paperbag/PaperbagSheetSizesAdd',
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )

      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Ukuran sheet baru berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
        setShowAddModal(false)
        setAddForm(EMPTY_ADD_FORM)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menyimpan data' })
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data') })
    } finally {
      setIsPosting(false)
    }
  }

  // SUBMIT EDIT
  const handleUpdate = async () => {
    if (!selectedItem) return

    const err = validateForm(editForm)
    if (err) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' })
      return
    }

    try {
      setIsPosting(true)

      const formData = new URLSearchParams()
      formData.append('code', editForm.code.trim())
      formData.append('panjang_mm', editForm.panjang_mm)
      formData.append('layer_2', editForm.lebar_mm)
      formData.append('layer_2_type', editForm.keterangan.trim())

      const { data } = await axios.put<ApiResponse>(
        `/Admin/Paperbag/PaperbagSheetSizesEdit/${selectedItem.id}`,
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )

      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data ukuran sheet berhasil diperbarui!', timer: 1500, showConfirmButton: false })
        setShowEditModal(false)
        setSelectedItem(null)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menyimpan data' })
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data') })
    } finally {
      setIsPosting(false)
    }
  }

  // DELETE
  const handleDelete = async (item: SheetSize) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Ukuran Sheet?',
      html: `Ukuran <strong>${item.keterangan}</strong> (${item.code}) akan dihapus permanen.<br/>Tindakan ini tidak dapat dibatalkan.`,
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })

    if (!result.isConfirmed) return

    try {
      const { data } = await axios.delete<ApiResponse>(`/Admin/Paperbag/PaperbagSheetSizesDel/${item.id}`)
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: `Ukuran sheet "${item.keterangan}" berhasil dihapus.`, timer: 1500, showConfirmButton: false })
        await refetch()
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data') })
    }
  }

  const handleCloseModal = () => {
    if (!isPosting) {
      setShowViewModal(false)
      setShowEditModal(false)
      setSelectedItem(null)
    }
  }

  // ===== RENDER =====
  if (loading) return <LoadingState icon="mdi:ruler-square" message="Memuat data Ukuran Sheet Paperbag..." />
  // if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:ruler-square" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Ukuran Sheet Paperbag</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola dimensi dan ukuran sheet paperbag</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">
            Refresh Data
          </Button>
          <Button
            onClick={handleAddClick}
            variant="primary"
            size="md"
            icon="mdi:plus"
          >
            Tambah Ukuran
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { 
            icon: 'mdi:ruler-square', 
            label: 'Total Ukuran', 
            value: String(stats.totalSizes), 
            sub: `${stats.totalSizes} variasi ukuran`,
            color: 'blue'
          },
          { 
            icon: 'mdi:select-all', 
            label: 'Rata-rata Luas', 
            value: `${stats.avgArea.toFixed(4)} m²`, 
            sub: `Total: ${stats.totalArea.toFixed(4)} m²`,
            color: 'cyan'
          },
          { 
            icon: 'mdi:arrow-expand', 
            label: 'Luas Terbesar', 
            value: `${stats.maxArea.toFixed(4)} m²`, 
            sub: stats.largestSize ? `${stats.largestSize.code}` : '-',
            color: 'violet'
          },
          { 
            icon: 'mdi:magnify', 
            label: 'Hasil Pencarian', 
            value: String(filtered.length), 
            sub: `${stats.totalSizes - filtered.length} tersembunyi`,
            color: 'sky'
          }
        ].map((stat, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className={`w-8 h-8 bg-${stat.color}-50 rounded-lg flex items-center justify-center`}>
                <Icon icon={stat.icon} className={`w-4 h-4 text-${stat.color}-500`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 truncate">{stat.value}</p>
            <div className="text-xs text-gray-400 mt-1.5">{stat.sub}</div>
          </Card>
        ))}
      </div>

      {/* ===== MAIN TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Ukuran Bahan Paperbag</h3>
            <p className="text-sm text-gray-400 mt-0.5">Total {stats.totalSizes} ukuran tersedia</p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode atau keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {sizeList.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:ruler-square" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data ukuran</p>
              <Button variant="primary" size="sm" onClick={handleAddClick} icon="mdi:plus">
                Tambah Ukuran
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Ukuran', 'Code', 'Dimensi', 'Luas', 'Kategori', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:ruler-square" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                        <p className="text-sm text-gray-400">
                          Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                          Hapus Pencarian
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const cat = getSizeCategory(item.panjang_mm, item.lebar_mm)
                    const area = calcAreaM2(item.panjang_mm, item.lebar_mm)
                    const maxArea = stats.maxArea || 1
                    const areaPercent = Math.round((area / maxArea) * 100)

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                        {/* Ukuran */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-${cat.color}-50`}>
                              <Icon icon={cat.icon} className={`w-5 h-5 text-${cat.color}-500`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{item.keterangan}</p>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-6 py-4">
                          <Badge color={cat.color === 'sky' ? '#0ea5e9' : cat.color === 'amber' ? '#f59e0b' : cat.color === 'violet' ? '#8b5cf6' : '#f43f5e'}>
                            {item.code}
                          </Badge>
                        </td>

                        {/* Dimensi */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {DIMENSION_TYPES.map((dim) => (
                              <div key={dim.id} className="flex items-center gap-2">
                                <Icon icon={dim.icon} className="w-3.5 h-3.5" style={{ color: dim.color }} />
                                <span className="text-xs text-gray-500 w-16">{dim.label}:</span>
                                <div>
                                  <span className="text-xs font-semibold" style={{ color: dim.color }}>
                                    {formatCm(item[dim.field as keyof SheetSize] as string)}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({formatMm(item[dim.field as keyof SheetSize] as string)})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Luas */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-lg">
                              <Icon icon="mdi:select-all" className="w-4 h-4" />
                              {formatAreaM2(item.panjang_mm, item.lebar_mm)}
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-1">
                              <div
                                className={`bg-${cat.color}-400 h-1 rounded-full`}
                                style={{ width: `${areaPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-${cat.color}-100 text-${cat.color}-800`}>
                            <Icon icon={cat.icon} className="w-3.5 h-3.5" />
                            {cat.label}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4">
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
                              onClick={() => handleDelete(item)}
                              title="Hapus"
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:delete-outline" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filtered.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{sizeList.length}</span> ukuran sheet
            </p>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseModal}
        title="Detail Ukuran Sheet"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
            <Button
              variant="primary"
              onClick={() => selectedItem && handleEditClick(selectedItem)}
              icon="mdi:pencil-outline"
            >
              Edit Ukuran
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const cat = getSizeCategory(selectedItem.panjang_mm, selectedItem.lebar_mm)
          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/60">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-${cat.color}-100`}>
                  <Icon icon={cat.icon} className={`w-7 h-7 text-${cat.color}-500`} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{selectedItem.keterangan}</p>
                  <p className="text-xs text-gray-400 mt-1">ID: {selectedItem.id}</p>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-3">
                {DIMENSION_TYPES.map((dim) => (
                  <Card key={dim.id} shadow="none" padding="sm" bordered>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Icon icon={dim.icon} className="w-3.5 h-3.5" style={{ color: dim.color }} />
                      {dim.label}
                    </p>
                    <p className="text-lg font-bold" style={{ color: dim.color }}>
                      {formatCm(selectedItem[dim.field as keyof SheetSize] as string)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatMm(selectedItem[dim.field as keyof SheetSize] as string)}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Area & Category */}
              <div className="grid grid-cols-2 gap-3">
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:select-all" className="w-3.5 h-3.5" />
                    Total Luas
                  </p>
                  <p className="text-lg font-bold text-violet-600">
                    {formatAreaM2(selectedItem.panjang_mm, selectedItem.lebar_mm)}
                  </p>
                </Card>
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:tag" className="w-3.5 h-3.5" />
                    Kategori
                  </p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-${cat.color}-100 text-${cat.color}-800`}>
                    <Icon icon={cat.icon} className="w-4 h-4" />
                    {cat.label}
                  </span>
                </Card>
              </div>

              {/* Code */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Icon icon="mdi:barcode" className="w-3.5 h-3.5" />
                  Code
                </p>
                <Badge color={cat.color === 'sky' ? '#0ea5e9' : cat.color === 'amber' ? '#f59e0b' : cat.color === 'violet' ? '#8b5cf6' : '#f43f5e'}>
                  {selectedItem.code}
                </Badge>
              </Card>
            </div>
          )
        })()}
      </Modal>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="Tambah Ukuran Sheet Baru"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Ukuran'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Info box */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Tambah Ukuran Baru</p>
              <p className="text-xs text-blue-600 mt-1">
                Masukkan dimensi dalam mm. Code dan Keterangan akan terisi otomatis.
              </p>
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:ruler" className="w-3.5 h-3.5 text-blue-600" />
              </div>
              Dimensi Sheet (mm)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Panjang (mm)"
                type="number"
                min={1}
                step={1}
                value={addForm.panjang_mm}
                onChange={(e) => handleAddDimensionChange('panjang_mm', e.target.value)}
                disabled={isPosting}
                leftIcon="mdi:arrow-left-right"
                placeholder="Contoh: 650"
                required
              />
              <Input
                label="Lebar (mm)"
                type="number"
                min={1}
                step={1}
                value={addForm.lebar_mm}
                onChange={(e) => handleAddDimensionChange('lebar_mm', e.target.value)}
                disabled={isPosting}
                leftIcon="mdi:arrow-up-down"
                placeholder="Contoh: 1000"
                required
              />
            </div>

            {/* Live preview luas */}
            {addForm.panjang_mm && addForm.lebar_mm && (
              <div className="mt-3 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200 flex items-center justify-between">
                <span className="text-xs text-blue-600 flex items-center gap-1.5">
                  <Icon icon="mdi:select-all" className="w-4 h-4" />
                  Preview Luas
                </span>
                <span className="text-sm font-bold text-blue-800">
                  {formatAreaM2(addForm.panjang_mm, addForm.lebar_mm)}
                </span>
              </div>
            )}
          </div>

          {/* Code & Keterangan */}
          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:text" className="w-3.5 h-3.5 text-amber-600" />
              </div>
              Identifikasi
            </h4>

            <Input
              label="Code"
              value={addForm.code}
              onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
              placeholder="Otomatis terisi dari dimensi"
              disabled={isPosting}
              leftIcon="mdi:barcode"
              helperText="Bisa diubah manual jika diperlukan"
              required
            />

            <Input
              label="Keterangan"
              value={addForm.keterangan}
              onChange={(e) => setAddForm({ ...addForm, keterangan: e.target.value })}
              placeholder="Otomatis terisi dari dimensi"
              disabled={isPosting}
              leftIcon="mdi:text"
              helperText="Bisa diubah manual jika diperlukan"
              required
            />
          </div>
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        title={`Edit Ukuran — ${selectedItem?.code}`}
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleUpdate} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Info box */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:pencil-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Mode Edit</p>
                <p className="text-xs text-blue-600 mt-1">
                  ID: <span className="font-mono font-semibold">{selectedItem.id}</span>
                </p>
              </div>
            </div>

            {/* Dimensions */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:ruler" className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Dimensi Sheet (mm)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Panjang (mm)"
                  type="number"
                  min={1}
                  step={1}
                  value={editForm.panjang_mm}
                  onChange={(e) => handleEditDimensionChange('panjang_mm', e.target.value)}
                  disabled={isPosting}
                  leftIcon="mdi:arrow-left-right"
                  required
                />
                <Input
                  label="Lebar (mm)"
                  type="number"
                  min={1}
                  step={1}
                  value={editForm.lebar_mm}
                  onChange={(e) => handleEditDimensionChange('lebar_mm', e.target.value)}
                  disabled={isPosting}
                  leftIcon="mdi:arrow-up-down"
                  required
                />
              </div>

              {/* Live preview luas */}
              {editForm.panjang_mm && editForm.lebar_mm && (
                <div className="mt-3 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200 flex items-center justify-between">
                  <span className="text-xs text-blue-600 flex items-center gap-1.5">
                    <Icon icon="mdi:select-all" className="w-4 h-4" />
                    Preview Luas
                  </span>
                  <span className="text-sm font-bold text-blue-800">
                    {formatAreaM2(editForm.panjang_mm, editForm.lebar_mm)}
                  </span>
                </div>
              )}
            </div>

            {/* Code & Keterangan */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:text" className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Identifikasi
              </h4>

              <Input
                label="Code"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                disabled={isPosting}
                leftIcon="mdi:barcode"
                required
              />

              <Input
                label="Keterangan"
                value={editForm.keterangan}
                onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                disabled={isPosting}
                leftIcon="mdi:text"
                required
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}