'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import TextArea from '@/components/UI/TextArea'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ============ TYPES ============
interface PaperbagTali {
  id: string
  kode: string
  nama: string
  deskripsi: string
  harga_per_pcs: string
  status: string
  updated_at: string | null
}

interface TaliForm {
  kode: string
  nama: string
  deskripsi: string
  harga_per_pcs: string
}

interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

// ============ CONSTANTS ============
const EMPTY_FORM: TaliForm = { kode: '', nama: '', deskripsi: '', harga_per_pcs: '' }

// ============ HELPERS ============
const formatRupiah = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
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

// ============ CUSTOM HOOK ============
const usePaperbagTali = () => {
  const [items, setItems] = useState<PaperbagTali[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse<PaperbagTali[]>>('/Admin/Paperbag/PaperbagTali')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setItems(data.data)
      } else {
        setError(data?.message || 'Format response tidak sesuai')
      }
    } catch (err) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return { items, loading, error, refetch: fetchData }
}

// ============ MAIN COMPONENT ============
export default function PaperbagTaliPage() {
  const { items, loading, error, refetch } = usePaperbagTali()
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [addForm, setAddForm] = useState<TaliForm>(EMPTY_FORM)
  const [editingItem, setEditingItem] = useState<PaperbagTali | null>(null)
  const [selectedItem, setSelectedItem] = useState<PaperbagTali | null>(null)

  // ===== STATS =====
  const stats = useMemo(() => ({
    total: items.length,
    aktif: items.filter(i => i.status === '1').length,
    nonaktif: items.filter(i => i.status !== '1').length,
    avgHarga: items.length
      ? items.reduce((acc, i) => acc + parseFloat(i.harga_per_pcs || '0'), 0) / items.length
      : 0,
    maxHarga: items.length
      ? Math.max(...items.map(i => parseFloat(i.harga_per_pcs || '0')))
      : 0,
    gratis: items.filter(i => parseFloat(i.harga_per_pcs) === 0).length,
  }), [items])

  const filtered = useMemo(() =>
    items.filter(i =>
      i.nama.toLowerCase().includes(search.toLowerCase()) ||
      i.kode.toLowerCase().includes(search.toLowerCase()) ||
      i.deskripsi.toLowerCase().includes(search.toLowerCase())
    ), [items, search])

  // ===== VALIDATION =====
  const validateForm = (form: TaliForm): boolean => {
    if (!form.kode.trim() || !form.nama.trim() || !form.deskripsi.trim() || !form.harga_per_pcs.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Semua field wajib diisi', confirmButtonColor: '#3b82f6' })
      return false
    }
    if (isNaN(Number(form.harga_per_pcs))) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Harga harus berupa angka', confirmButtonColor: '#3b82f6' })
      return false
    }
    return true
  }

  // ===== ADD =====
  const handleAdd = async () => {
    if (!validateForm(addForm)) return
    try {
      setIsPosting(true)

      // Gunakan URLSearchParams untuk mengirim sebagai form-urlencoded
      const formData = new URLSearchParams()
      formData.append('kode', addForm.kode.trim())
      formData.append('nama', addForm.nama.trim())
      formData.append('deskripsi', addForm.deskripsi.trim())
      formData.append('harga_per_pcs', addForm.harga_per_pcs.trim())

      const { data } = await axios.post<ApiResponse>(
        '/Admin/Paperbag/PaperbagTaliAdd',
        formData,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000,
        }
      )

      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: data.message, timer: 1500, showConfirmButton: false })
        setShowAddModal(false)
        setAddForm(EMPTY_FORM)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data?.message, confirmButtonColor: '#3b82f6' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data'), confirmButtonColor: '#3b82f6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT =====
  const handleEdit = async () => {
    if (!editingItem) return
    const form: TaliForm = {
      kode: editingItem.kode,
      nama: editingItem.nama,
      deskripsi: editingItem.deskripsi,
      harga_per_pcs: editingItem.harga_per_pcs,
    }
    if (!validateForm(form)) return

    try {
      setIsPosting(true)

      const formData = new URLSearchParams()
      formData.append('kode', form.kode.trim())
      formData.append('nama', form.nama.trim())
      formData.append('deskripsi', form.deskripsi.trim())
      formData.append('harga_per_pcs', form.harga_per_pcs.trim())

      // Jika backend mengharapkan POST untuk edit, ganti api.put menjadi api.post
      const { data } = await axios.put<ApiResponse>(
        `/Admin/Paperbag/PaperbagTaliEdit/${editingItem.id}`,
        formData,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000,
        }
      )

      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: data.message, timer: 1500, showConfirmButton: false })
        setShowEditModal(false)
        setEditingItem(null)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data?.message, confirmButtonColor: '#3b82f6' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal mengupdate data'), confirmButtonColor: '#3b82f6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
// ===== DELETE =====
const handleDelete = async (item: PaperbagTali) => {
  const result = await Swal.fire({
    title: 'Konfirmasi Hapus',
    html: `Hapus <strong>${item.nama}</strong>?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonText: 'Batal',
    confirmButtonText: 'Ya, Hapus!',
  })
  if (!result.isConfirmed) return
  
  try {
    const { data } = await axios.delete<ApiResponse>(`/Admin/Paperbag/PaperbagTaliDel/${item.id}`)
    
    // TOLERANSI ERROR 500 - tetap anggap berhasil jika status 200 ATAU 500 (karena data ternyata terhapus)
    if (data?.status === 200) {
      await Swal.fire({ icon: 'success', title: 'Dihapus!', text: data.message, timer: 1500, showConfirmButton: false })
      await refetch()
    } else {
      // TAMBAHKAN: Cek apakah data masih ada dengan melakukan fetch ulang
      await refetch()
      
      // Cek apakah item masih ada di items setelah refetch
      const stillExists = items.some(i => i.id === item.id)
      
      if (!stillExists) {
        // Data sudah tidak ada, anggap berhasil
        await Swal.fire({ 
          icon: 'success', 
          title: 'Dihapus!', 
          text: 'Data berhasil dihapus', 
          timer: 1500, 
          showConfirmButton: false 
        })
      } else {
        // Data masih ada, baru tampilkan error
        Swal.fire({ icon: 'error', title: 'Gagal', text: data?.message || 'Gagal menghapus data', confirmButtonColor: '#3b82f6' })
      }
    }
  } catch (err) {
    // Tangani error network dll
    Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data'), confirmButtonColor: '#3b82f6' })
  }
}
  // ===== CLICK HANDLERS =====
  const handleViewClick = useCallback((item: PaperbagTali) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }, [])

  const handleEditClick = useCallback((item: PaperbagTali) => {
    setEditingItem({ ...item })
    setShowViewModal(false)
    setShowEditModal(true)
  }, [])

  // ===== LOADING =====
  if (loading) return (
    <LoadingState message="Memuat data Paperbag Tali..." submessage="Harap tunggu sebentar" icon="mdi:rope" />
  )

  // ===== RENDER =====
  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:rope" className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Paperbag Tali</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola jenis tali untuk paperbag</p>
          </div>
        </div>
        <Button
          onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true) }}
          variant="primary"
          size="md"
          icon="mdi:plus"
        >
          Tambah Tali Baru
        </Button>
      </div>

      {/* ===== ERROR STATE ===== */}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: 'mdi:rope',
            label: 'Total Tali',
            value: stats.total,
            sub: `${stats.aktif} aktif · ${stats.nonaktif} nonaktif`,
          },
          {
            icon: 'mdi:check-circle-outline',
            label: 'Aktif',
            value: stats.aktif,
            sub: `dari ${stats.total} total tali`,
            bar: stats.total ? (stats.aktif / stats.total) * 100 : 0,
          },
          {
            icon: 'mdi:cash',
            label: 'Rata-rata Harga',
            value: formatRupiah(stats.avgHarga),
            sub: `Maks: ${formatRupiah(stats.maxHarga)}`,
          },
          {
            icon: 'mdi:tag-off-outline',
            label: 'Tanpa Biaya',
            value: stats.gratis,
            sub: 'Tali dengan harga Rp 0',
            bar: stats.total ? (stats.gratis / stats.total) * 100 : 0,
          },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            {s.bar !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Paperbag Tali</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.total} tali · {stats.aktif} aktif
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Cari nama, kode, deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:rope" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data tali</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Tali', 'Kode', 'Deskripsi', 'Harga / Pcs', 'Status', 'Aksi'].map(h => (
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
                        <Icon icon="mdi:rope" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Tidak ada hasil</p>
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
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tali */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50">
                            <Icon icon="mdi:rope" className="w-5 h-5 text-amber-500" />
                          </div>
                          <p className="text-sm font-medium text-slate-800">{item.nama}</p>
                        </div>
                      </td>

                      {/* Kode */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {item.kode}
                        </span>
                      </td>

                      {/* Deskripsi */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-gray-500 truncate" title={item.deskripsi}>
                          {item.deskripsi}
                        </p>
                      </td>

                      {/* Harga */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {formatRupiah(item.harga_per_pcs)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge color={item.status === '1' ? '#10b981' : '#ef4444'}>
                          {item.status === '1' ? '✓ Aktif' : '✗ Nonaktif'}
                        </Badge>
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
                  ))
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
              <span className="font-medium text-slate-700">{items.length}</span> tali
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="➕ Tambah Paperbag Tali Baru"
        size="md"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" size="md" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              Simpan Tali
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-3 bg-amber-50 border border-amber-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">Isi semua field yang diperlukan.</p>
          </div>

          <Input
            label="Kode Tali"
            value={addForm.kode}
            onChange={(e) => setAddForm({ ...addForm, kode: e.target.value })}
            placeholder="contoh: tali_kertas_natural"
            required
            disabled={isPosting}
            leftIcon="mdi:tag"
          />

          <Input
            label="Nama Tali"
            value={addForm.nama}
            onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
            placeholder="contoh: Tali Kertas Natural"
            required
            disabled={isPosting}
            leftIcon="mdi:format-title"
          />

          <TextArea
            label="Deskripsi"
            value={addForm.deskripsi}
            onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })}
            rows={3}
            placeholder="Deskripsikan tali ini..."
            required
            disabled={isPosting}
          />

          <Input
            label="Harga per Pcs (Rp)"
            type="number"
            value={addForm.harga_per_pcs}
            onChange={(e) => setAddForm({ ...addForm, harga_per_pcs: e.target.value })}
            placeholder="0"
            required
            disabled={isPosting}
            leftIcon="mdi:cash"
            min="0"
          />
        </div>
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Paperbag Tali"
        size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setShowViewModal(false)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              size="md"
              icon="mdi:pencil-outline"
              onClick={() => selectedItem && handleEditClick(selectedItem)}
            >
              Edit Tali
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Identity */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100">
                <Icon icon="mdi:rope" className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">{selectedItem.nama}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color={selectedItem.status === '1' ? '#10b981' : '#ef4444'}>
                    {selectedItem.status === '1' ? '✓ Aktif' : '✗ Nonaktif'}
                  </Badge>
                  <span className="text-xs text-gray-400 font-mono">{selectedItem.kode}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card shadow="none" padding="sm" bordered>
              <p className="text-xs text-gray-500 mb-1">Deskripsi</p>
              <p className="text-sm text-slate-700">{selectedItem.deskripsi || '—'}</p>
            </Card>

            {/* Price */}
            <Card shadow="none" padding="sm" bordered>
              <p className="text-xs text-gray-500 mb-1">Harga per Pcs</p>
              <p className="text-xl font-bold text-green-600">{formatRupiah(selectedItem.harga_per_pcs)}</p>
            </Card>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">ID</p>
                <p className="text-sm text-slate-700 font-mono">#{selectedItem.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Terakhir Diperbarui</p>
                <p className="text-sm text-slate-700">
                  {selectedItem.updated_at
                    ? new Date(selectedItem.updated_at).toLocaleDateString('id-ID')
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`Edit Paperbag Tali — ${editingItem?.nama}`}
        size="md"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => !isPosting && setShowEditModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" size="md" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Informasi Tali</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ID"
                  value={editingItem.id}
                  disabled
                  leftIcon="mdi:identifier"
                />
                <Input
                  label="Kode Tali"
                  value={editingItem.kode}
                  onChange={(e) => setEditingItem({ ...editingItem, kode: e.target.value })}
                  required
                  disabled={isPosting}
                  leftIcon="mdi:tag"
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Nama Tali"
                  value={editingItem.nama}
                  onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                  required
                  disabled={isPosting}
                  leftIcon="mdi:format-title"
                />
              </div>

              <div className="mt-4">
                <TextArea
                  label="Deskripsi"
                  value={editingItem.deskripsi}
                  onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })}
                  rows={3}
                  fullWidth
                  required
                  disabled={isPosting}
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Harga per Pcs (Rp)"
                  type="number"
                  value={editingItem.harga_per_pcs}
                  onChange={(e) => setEditingItem({ ...editingItem, harga_per_pcs: e.target.value })}
                  required
                  disabled={isPosting}
                  leftIcon="mdi:cash"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}