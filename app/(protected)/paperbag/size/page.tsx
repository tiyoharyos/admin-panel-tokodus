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
  data: SheetSize[]
}

interface EditFormData {
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
}

interface AddFormData {
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
}

// ============ HELPERS ============
const formatMm = (mm: string) => {
  const val = parseFloat(mm)
  return isNaN(val) ? mm : `${val} mm`
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

// ============ SIZE CATEGORY ============
const getSizeCategory = (panjang: string, lebar: string): { label: string; color: string; icon: string } => {
  const area = calcAreaM2(panjang, lebar)
  if (area < 0.65)  return { label: 'Kecil',  color: 'sky',    icon: 'mdi:crop-square'    }
  if (area < 0.85)  return { label: 'Sedang', color: 'amber',  icon: 'mdi:crop-5-4'       }
  if (area < 1.05)  return { label: 'Besar',  color: 'violet', icon: 'mdi:crop-landscape' }
  return                   { label: 'Extra',  color: 'rose',   icon: 'mdi:crop-free'      }
}

const EMPTY_ADD_FORM: AddFormData = { code: '', panjang_mm: '', lebar_mm: '', keterangan: '' }

// ============ MAIN COMPONENT ============
export default function PaperbagSheetSizesPage() {
  const [sizeList, setSizeList]   = useState<SheetSize[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch]       = useState('')

  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal]   = useState(false)

  const [selectedItem, setSelectedItem] = useState<SheetSize | null>(null)
  const [editForm, setEditForm]         = useState<EditFormData>({ code: '', panjang_mm: '', lebar_mm: '', keterangan: '' })
  const [addForm, setAddForm]           = useState<AddFormData>(EMPTY_ADD_FORM)

  // ===== STATS =====
  const stats = useMemo(() => {
    const total   = sizeList.length
    const areas   = sizeList.map(s => calcAreaM2(s.panjang_mm, s.lebar_mm)).filter(a => a > 0)
    const avgArea = areas.length ? areas.reduce((a, b) => a + b, 0) / areas.length : 0
    const maxArea = areas.length ? Math.max(...areas) : 0
    return { total, avgArea, maxArea }
  }, [sizeList])

  // ===== FILTERED =====
  const filtered = useMemo(() =>
    sizeList.filter(s =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.keterangan.toLowerCase().includes(search.toLowerCase())
    ), [sizeList, search])

  // ===== API =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse>('/Admin/Paperbag/PaperbagSheetSizes')
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

  // ===== ADD FORM: auto-fill code & keterangan saat panjang/lebar berubah =====
  const handleAddDimensionChange = (field: 'panjang_mm' | 'lebar_mm', value: string) => {
    setAddForm(prev => {
      const p = field === 'panjang_mm' ? value : prev.panjang_mm
      const l = field === 'lebar_mm'   ? value : prev.lebar_mm
      return {
        ...prev,
        [field]:     value,
        code:        autoCode(p, l),
        keterangan:  autoKeterangan(p, l),
      }
    })
  }

  // ===== HANDLERS =====
  const handleViewClick = (item: SheetSize) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = (item: SheetSize) => {
    setSelectedItem(item)
    setEditForm({ code: item.code, panjang_mm: item.panjang_mm, lebar_mm: item.lebar_mm, keterangan: item.keterangan })
    setShowViewModal(false)
    setShowEditModal(true)
  }

  const handleOpenAdd = () => {
    setAddForm(EMPTY_ADD_FORM)
    setShowAddModal(true)
  }

  // ===== HANDLER DELETE =====
  const handleDelete = async (item: SheetSize) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Ukuran?',
      html: `Yakin ingin menghapus ukuran <strong>${item.keterangan}</strong> (${item.code})?<br/><span class="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</span>`,
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })

    if (!confirm.isConfirmed) return

    try {
      await axios.delete(`/Admin/Paperbag/PaperbagSheetSizesDel/${item.id}`)
      setSizeList(prev => prev.filter(s => s.id !== item.id))
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: `Ukuran ${item.code} berhasil dihapus.`, timer: 1500, showConfirmButton: false })
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data'), confirmButtonColor: '#3B82F6' })
    }
  }

  const handleDeleteClick = async (item: SheetSize) => {
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
      await axios.delete(`/Admin/Paperbag/PaperbagSheetSizesDel/${item.id}`)
      setSizeList(prev => prev.filter(s => s.id !== item.id))
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Ukuran sheet "${item.keterangan}" berhasil dihapus.`,
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data'), confirmButtonColor: '#3B82F6' })
    }
  }

  // ===== SUBMIT ADD =====
  const handleAdd = async () => {
    const p = Number(addForm.panjang_mm)
    const l = Number(addForm.lebar_mm)

    if (!addForm.code.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Code tidak boleh kosong.', confirmButtonColor: '#3B82F6' })
      return
    }
    if (isNaN(p) || p <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Panjang (mm) tidak valid.', confirmButtonColor: '#3B82F6' })
      return
    }
    if (isNaN(l) || l <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Lebar (mm) tidak valid.', confirmButtonColor: '#3B82F6' })
      return
    }
    if (!addForm.keterangan.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Keterangan tidak boleh kosong.', confirmButtonColor: '#3B82F6' })
      return
    }

    try {
      setIsPosting(true)

      // Catatan: backend memetakan field dengan nama berbeda:
      //   lebar_mm   → key: layer_2
      //   keterangan → key: layer_2_type
      const payload = {
        code:         addForm.code.trim(),
        panjang_mm:   addForm.panjang_mm,
        layer_2:      addForm.lebar_mm,            // ← sesuai $this->post('layer_2') di backend
        layer_2_type: addForm.keterangan.trim(),   // ← sesuai $this->post('layer_2_type') di backend
      }

      await axios.post('/Admin/Paperbag/PaperbagSheetSizesAdd', payload)

      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Ukuran sheet baru berhasil ditambahkan!',
        timer: 1500,
        showConfirmButton: false,
      })

      setShowAddModal(false)
      setAddForm(EMPTY_ADD_FORM)
      await fetchData() // refresh list dari server
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data'), confirmButtonColor: '#3B82F6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== SUBMIT EDIT =====
  const handleUpdate = async () => {
    if (!selectedItem) return

    const p = Number(editForm.panjang_mm)
    const l = Number(editForm.lebar_mm)

    if (!editForm.code?.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Code tidak boleh kosong.', confirmButtonColor: '#3B82F6' })
      return
    }
    if (isNaN(p) || p <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Panjang (mm) tidak valid.', confirmButtonColor: '#3B82F6' })
      return
    }
    if (isNaN(l) || l <= 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Lebar (mm) tidak valid.', confirmButtonColor: '#3B82F6' })
      return
    }
    if (!editForm.keterangan.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Keterangan tidak boleh kosong.', confirmButtonColor: '#3B82F6' })
      return
    }

    try {
      setIsPosting(true)

      // Catatan: backend memetakan field dengan nama berbeda:
      //   lebar_mm   → key: layer_2
      //   keterangan → key: layer_2_type
      const payload = {
        code:         editForm.code.trim(),
        panjang_mm:   editForm.panjang_mm,
        layer_2:      editForm.lebar_mm,            // ← sesuai $this->put('layer_2') di backend
        layer_2_type: editForm.keterangan.trim(),   // ← sesuai $this->put('layer_2_type') di backend
      }

      await axios.put(`/Admin/Paperbag/PaperbagSheetSizesEdit/${selectedItem.id}`, payload)

      // Update local state dengan nilai terbaru
      setSizeList(prev => prev.map(s =>
        s.id === selectedItem.id
          ? { ...s, code: editForm.code, panjang_mm: editForm.panjang_mm, lebar_mm: editForm.lebar_mm, keterangan: editForm.keterangan }
          : s
      ))

      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data ukuran sheet berhasil diperbarui!', timer: 1500, showConfirmButton: false })
      setShowEditModal(false)
      setSelectedItem(null)
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data'), confirmButtonColor: '#3B82F6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat data Ukuran Sheet Paperbag..." />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:ruler-square" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Ukuran Sheet Paperbag
            </h1>
            <p className="text-gray-600 mt-1">Kelola dimensi dan ukuran sheet paperbag</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="border-gray-300" icon="mdi:refresh">
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd} icon="mdi:plus">
            Tambah Ukuran
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: 'mdi:ruler-square', color: 'blue', label: 'Total Ukuran Sheet', value: stats.total,
            children: <p className="text-xs text-gray-500">variasi ukuran tersedia</p>
          },
          {
            icon: 'mdi:select-all', color: 'cyan', label: 'Rata-rata Luas', value: `${stats.avgArea.toFixed(4)} m²`,
            children: <p className="text-xs text-gray-500">rata-rata luas sheet</p>
          },
          {
            icon: 'mdi:arrow-expand', color: 'violet', label: 'Luas Terbesar', value: `${stats.maxArea.toFixed(4)} m²`,
            children: (
              <>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">batas atas ukuran sheet</p>
              </>
            )
          },
          {
            icon: 'mdi:magnify', color: 'sky', label: 'Hasil Pencarian', value: filtered.length,
            children: <p className="text-xs text-gray-500">dari {stats.total} total ukuran sheet</p>
          }
        ].map((stat, i) => (
          <Card key={i} className="relative overflow-hidden group hover:shadow-xl transition-all">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color}-50 rounded-bl-full group-hover:bg-${stat.color}-100 transition-all`} />
            <div className="space-y-2 relative">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Icon icon={stat.icon} className={`w-4 h-4 text-${stat.color}-600`} />
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              {stat.children}
            </div>
          </Card>
        ))}
      </div>

      {/* ===== MAIN TABLE ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-blue-600" />
              Daftar Ukuran Sheet Paperbag
            </h3>
            <p className="text-sm text-gray-600 mt-1">Total {stats.total} ukuran tersedia</p>
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

        <div className="overflow-x-auto">
          {sizeList.length === 0 ? (
            <EmptyState icon="mdi:ruler-square" title="Belum ada data ukuran" message="Tidak ada ukuran sheet yang tersedia" />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Ukuran', 'Code', 'Panjang', 'Lebar', 'Luas', 'Kategori', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <EmptyState
                        icon="mdi:ruler-square"
                        title="Tidak ada hasil pencarian"
                        message={`Tidak ditemukan ukuran dengan kata kunci "${search}"`}
                        actionLabel="Clear Pencarian"
                        onAction={() => setSearch('')}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const cat         = getSizeCategory(item.panjang_mm, item.lebar_mm)
                    const area        = calcAreaM2(item.panjang_mm, item.lebar_mm)
                    const maxArea     = stats.maxArea || 1
                    const areaPercent = Math.round((area / maxArea) * 100)

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">

                        {/* Ukuran */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-${cat.color}-100 rounded-lg flex items-center justify-center`}>
                              <Icon icon={cat.icon} className={`w-5 h-5 text-${cat.color}-600`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.keterangan}</p>
                              <p className="text-xs text-gray-400">ID: {item.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${cat.color}-100 text-${cat.color}-800 border border-${cat.color}-200`}>
                            {item.code}
                          </span>
                        </td>

                        {/* Panjang */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-gray-800">{formatCm(item.panjang_mm)}</p>
                            <p className="text-xs text-gray-400">{formatMm(item.panjang_mm)}</p>
                          </div>
                        </td>

                        {/* Lebar */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-gray-800">{formatCm(item.lebar_mm)}</p>
                            <p className="text-xs text-gray-400">{formatMm(item.lebar_mm)}</p>
                          </div>
                        </td>

                        {/* Luas */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-blue-200">
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-${cat.color}-100 text-${cat.color}-800 border border-${cat.color}-200`}>
                            <Icon icon={cat.icon} className="w-3.5 h-3.5" />
                            {cat.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewClick(item)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Icon icon="mdi:eye" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
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

        {filtered.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-600">Menampilkan {filtered.length} dari {sizeList.length} ukuran sheet</p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="➕ Tambah Ukuran Sheet Baru"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:content-save">
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Info banner */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                Masukkan dimensi panjang dan lebar dalam satuan <strong>mm</strong>.
                Field <strong>Code</strong> dan <strong>Keterangan</strong> akan terisi otomatis, namun tetap bisa diubah manual jika diperlukan.
              </p>
            </div>
          </div>

          {/* Form fields */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:ruler" className="w-3 h-3 text-blue-600" />
              </div>
              Dimensi Sheet
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Panjang (mm)"
                type="number"
                min={1}
                step={1}
                value={addForm.panjang_mm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddDimensionChange('panjang_mm', e.target.value)}
                disabled={isPosting}
                leftIcon="mdi:arrow-left-right"
                placeholder="Contoh: 650"
              />
              <Input
                label="Lebar (mm)"
                type="number"
                min={1}
                step={1}
                value={addForm.lebar_mm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddDimensionChange('lebar_mm', e.target.value)}
                disabled={isPosting}
                leftIcon="mdi:arrow-up-down"
                placeholder="Contoh: 1000"
              />
            </div>

            {/* Live preview luas */}
            {addForm.panjang_mm && addForm.lebar_mm && (
              <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200 flex items-center justify-between">
                <span className="text-xs text-blue-600 flex items-center gap-1.5">
                  <Icon icon="mdi:select-all" className="w-4 h-4" />
                  Preview Luas
                </span>
                <span className="text-sm font-bold text-blue-800">
                  {formatAreaM2(addForm.panjang_mm, addForm.lebar_mm)}
                </span>
              </div>
            )}

            {/* Code — auto-filled tapi bisa diubah manual */}
            <Input
              label="Code"
              type="text"
              value={addForm.code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddForm(p => ({ ...p, code: e.target.value }))}
              disabled={isPosting}
              leftIcon="mdi:barcode"
              placeholder="Otomatis terisi dari dimensi"
            />

            {/* Keterangan — auto-filled tapi bisa diubah manual */}
            <Input
              label="Keterangan"
              type="text"
              value={addForm.keterangan}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddForm(p => ({ ...p, keterangan: e.target.value }))}
              disabled={isPosting}
              leftIcon="mdi:text"
              placeholder="Otomatis terisi dari dimensi"
            />
          </div>
        </div>
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="🔍 Detail Ukuran Sheet"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Tutup</Button>
            <Button variant="primary" onClick={() => selectedItem && handleEditClick(selectedItem)} icon="mdi:pencil">
              Edit Ukuran
            </Button>
          </div>
        }
      >
        {selectedItem && (() => {
          const cat = getSizeCategory(selectedItem.panjang_mm, selectedItem.lebar_mm)
          return (
            <div className="space-y-5">
              {/* Header card */}
              <div className={`bg-gradient-to-r from-${cat.color}-50 to-${cat.color}-100/50 p-5 rounded-xl border border-${cat.color}-200`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-${cat.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon icon={cat.icon} className={`w-7 h-7 text-${cat.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedItem.keterangan}</h2>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${cat.color}-100 text-${cat.color}-800 mt-1`}>
                      {selectedItem.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-blue-50/50 border-blue-200">
                  <p className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:arrow-left-right" className="w-3.5 h-3.5" />Panjang
                  </p>
                  <p className="text-xl font-bold text-blue-800">{formatCm(selectedItem.panjang_mm)}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{formatMm(selectedItem.panjang_mm)}</p>
                </Card>
                <Card className="p-4 bg-cyan-50/50 border-cyan-200">
                  <p className="text-xs text-cyan-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:arrow-up-down" className="w-3.5 h-3.5" />Lebar
                  </p>
                  <p className="text-xl font-bold text-cyan-800">{formatCm(selectedItem.lebar_mm)}</p>
                  <p className="text-xs text-cyan-500 mt-0.5">{formatMm(selectedItem.lebar_mm)}</p>
                </Card>
              </div>

              {/* Area & category */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-violet-50/50 border-violet-200">
                  <p className="text-xs text-violet-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:select-all" className="w-3.5 h-3.5" />Total Luas
                  </p>
                  <p className="text-xl font-bold text-violet-800">{formatAreaM2(selectedItem.panjang_mm, selectedItem.lebar_mm)}</p>
                </Card>
                <Card className={`p-4 bg-${cat.color}-50/50 border-${cat.color}-200`}>
                  <p className={`text-xs text-${cat.color}-700 mb-1 flex items-center gap-1`}>
                    <Icon icon="mdi:tag" className="w-3.5 h-3.5" />Kategori
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full bg-${cat.color}-100 text-${cat.color}-700`}>
                    <Icon icon={cat.icon} className="w-4 h-4" />
                    {cat.label}
                  </span>
                </Card>
              </div>

              {/* Keterangan */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.keterangan}</p>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`✏️ Edit Ukuran — ${selectedItem?.code}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => !isPosting && setShowEditModal(false)} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleUpdate} loading={isPosting} disabled={isPosting}>Simpan Perubahan</Button>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Info banner */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">{selectedItem.keterangan}</p>
                  <p className="text-xs text-blue-600 mt-0.5">ID: {selectedItem.id} · Semua field dapat diubah</p>
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:ruler" className="w-3 h-3 text-blue-600" />
                </div>
                Dimensi Sheet
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Panjang (mm)"
                  type="number"
                  min={1}
                  step={1}
                  value={editForm.panjang_mm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value
                    setEditForm(p => ({
                      ...p,
                      panjang_mm:  val,
                      code:        autoCode(val, p.lebar_mm),
                      keterangan:  autoKeterangan(val, p.lebar_mm),
                    }))
                  }}
                  disabled={isPosting}
                  leftIcon="mdi:arrow-left-right"
                />
                <Input
                  label="Lebar (mm)"
                  type="number"
                  min={1}
                  step={1}
                  value={editForm.lebar_mm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value
                    setEditForm(p => ({
                      ...p,
                      lebar_mm:   val,
                      code:       autoCode(p.panjang_mm, val),
                      keterangan: autoKeterangan(p.panjang_mm, val),
                    }))
                  }}
                  disabled={isPosting}
                  leftIcon="mdi:arrow-up-down"
                />
              </div>

              {/* Live preview luas */}
              {editForm.panjang_mm && editForm.lebar_mm && (
                <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200 flex items-center justify-between">
                  <span className="text-xs text-blue-600 flex items-center gap-1.5">
                    <Icon icon="mdi:select-all" className="w-4 h-4" />
                    Preview Luas
                  </span>
                  <span className="text-sm font-bold text-blue-800">
                    {formatAreaM2(editForm.panjang_mm, editForm.lebar_mm)}
                  </span>
                </div>
              )}

              <Input
                label="Code"
                type="text"
                value={editForm.code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, code: e.target.value }))}
                disabled={isPosting}
                leftIcon="mdi:barcode"
              />

              <Input
                label="Keterangan"
                type="text"
                value={editForm.keterangan}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, keterangan: e.target.value }))}
                disabled={isPosting}
                leftIcon="mdi:text"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}