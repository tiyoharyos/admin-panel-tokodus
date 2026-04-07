'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
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

const normalizeHarga = (raw: string): string => (parseFloat(raw) || 0).toFixed(2)

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

// ============ ACTION BUTTON ============
function ActionButton({ onClick, icon, hoverColor, title }: {
  onClick: () => void; icon: string; hoverColor: string; title: string
}) {
  const cls: Record<string, string> = {
    blue:  'hover:text-blue-600 hover:bg-blue-50',
    amber: 'hover:text-amber-600 hover:bg-amber-50',
    red:   'hover:text-red-600 hover:bg-red-50',
  }
  return (
    <button onClick={onClick} title={title}
      className={`p-2 text-gray-400 rounded-lg transition-colors ${cls[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
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
    if (!form.kode.trim() || !form.nama.trim() || !form.deskripsi.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Semua field wajib diisi', confirmButtonColor: '#3b82f6' })
      return false
    }
    if (form.harga_per_pcs.trim() === '') {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Harga harus diisi (boleh 0)', confirmButtonColor: '#3b82f6' })
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
      const formData = new URLSearchParams()
      formData.append('kode', addForm.kode.trim())
      formData.append('nama', addForm.nama.trim())
      formData.append('deskripsi', addForm.deskripsi.trim())
      formData.append('harga_per_pcs', normalizeHarga(addForm.harga_per_pcs))
      formData.append('status', '1')

      const { data } = await axios.post<ApiResponse>(
        '/Admin/Paperbag/PaperbagTaliAdd',
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
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
      formData.append('harga_per_pcs', normalizeHarga(form.harga_per_pcs))
      formData.append('status', editingItem.status)

      const { data } = await axios.put<ApiResponse>(
        `/Admin/Paperbag/PaperbagTaliEdit/${editingItem.id}`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
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
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Dihapus!', text: data.message, timer: 1500, showConfirmButton: false })
        await refetch()
      } else {
        await refetch()
        const stillExists = items.some(i => i.id === item.id)
        if (!stillExists) {
          await Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Data berhasil dihapus', timer: 1500, showConfirmButton: false })
        } else {
          Swal.fire({ icon: 'error', title: 'Gagal', text: data?.message || 'Gagal menghapus data', confirmButtonColor: '#3b82f6' })
        }
      }
    } catch (err) {
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

  // ===== REFRESH =====
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

  // ===== LOADING & ERROR =====
  if (loading) return <LoadingState message="Memuat data Paperbag Tali..." submessage="Harap tunggu sebentar" icon="mdi:rope" />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  // ===== RENDER =====
  return (
    // HAPUS min-h-screen, ganti w-full
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 w-full">

      {/* ===== HEADER dengan badge emas ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="ion:bag-handle-outline" className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Paperbag Tali</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola jenis tali untuk paperbag</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">Refresh Data</Button>
          <Button
            onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true) }}
            variant="primary"
            size="md"
            icon="mdi:plus"
          >
            Tambah Tali Baru
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS dengan gradient line ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: 'ion:bag-handle-outline',
            label: 'Total Tali',
            value: stats.total,
            sub: `${stats.aktif} aktif · ${stats.nonaktif} nonaktif`,
            accent: '#f59e0b',
          },
          {
            icon: 'mdi:cash',
            label: 'Rata-rata Harga',
            value: formatRupiah(stats.avgHarga),
            sub: `Maks: ${formatRupiah(stats.maxHarga)}`,
            accent: '#10b981',
          },
          {
            icon: 'mdi:tag-off-outline',
            label: 'Tanpa Biaya',
            value: stats.gratis,
            sub: 'Tali dengan harga Rp 0',
            accent: '#ef4444',
          },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{s.label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.accent}15` }}>
                <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 truncate">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1.5">{s.sub}</p>
            <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${s.accent}60, transparent)` }} />
          </div>
        ))}
      </div>

      {/* ===== FILTER BAR (search) dengan gradient header ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Daftar Paperbag Tali</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Total {stats.total} tali · {stats.aktif} aktif
              </p>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Cari nama, kode, deskripsi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon="mdi:magnify"
              />
            </div>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="overflow-x-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Icon icon="mdi:rope" className="w-16 h-16 text-slate-300" />
              <p className="text-slate-500 font-medium text-lg">Belum ada data tali</p>
              <Button variant="primary" size="sm" onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true) }} icon="mdi:plus">
                Tambah Tali Baru
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Tali', 'Kode', 'Deskripsi', 'Harga / Pcs', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:rope" className="w-14 h-14 text-slate-300" />
                        <p className="text-slate-500 font-medium">Tidak ada hasil</p>
                        <p className="text-sm text-slate-400">
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
                    <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50">
                            <Icon icon="ion:bag-handle-outline" className="w-5 h-5 text-amber-500" />
                          </div>
                          <p className="text-sm font-medium text-slate-800">{item.nama}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color="#6b7280">{item.kode}</Badge>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-slate-500 truncate" title={item.deskripsi}>
                          {item.deskripsi}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {formatRupiah(item.harga_per_pcs)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <ActionButton onClick={() => handleViewClick(item)} icon="mdi:eye-outline" hoverColor="blue" title="Lihat Detail" />
                          <ActionButton onClick={() => handleEditClick(item)} icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                          <ActionButton onClick={() => handleDelete(item)} icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-400">
              Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> dari{' '}
              <span className="font-semibold text-slate-600">{items.length}</span> tali
            </p>
          </div>
        )}
      </div>

      {/* ===== ADD MODAL (gaya konsisten) ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="Tambah Paperbag Tali Baru"
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Tali'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Tambah Data Baru</p>
              <p className="text-xs text-blue-600 mt-0.5">Isi semua field yang diperlukan. Harga boleh diisi 0.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

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
              helperText="Boleh diisi 0 jika tidak ada biaya"
            />
          </div>
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
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Tutup</Button>
            <Button variant="primary" icon="mdi:pencil-outline" onClick={() => selectedItem && handleEditClick(selectedItem)}>
              Edit Tali
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/60">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100">
                <Icon icon="ion:bag-handle-outline" className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">{selectedItem.nama}</p>
                <p className="text-xs text-slate-400 mt-0.5">ID: {selectedItem.id}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:barcode" className="w-3.5 h-3.5" /> Kode
              </p>
              <Badge color="#6b7280">{selectedItem.kode}</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:format-text" className="w-3.5 h-3.5" /> Deskripsi
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedItem.deskripsi || '-'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:cash" className="w-3.5 h-3.5" /> Harga per Pcs
              </p>
              <p className="text-xl font-bold text-green-600">{formatRupiah(selectedItem.harga_per_pcs)}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`Edit Paperbag Tali — ${editingItem?.nama}`}
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={() => !isPosting && setShowEditModal(false)} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:pencil-outline" className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Mode Edit</p>
                <p className="text-xs text-amber-600 mt-0.5">ID: {editingItem.id}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Kode Tali"
                  value={editingItem.kode}
                  onChange={(e) => setEditingItem({ ...editingItem, kode: e.target.value })}
                  required
                  disabled={isPosting}
                  leftIcon="mdi:tag"
                />
                <Input
                  label="Nama Tali"
                  value={editingItem.nama}
                  onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                  required
                  disabled={isPosting}
                  leftIcon="mdi:format-title"
                />
              </div>

              <TextArea
                label="Deskripsi"
                value={editingItem.deskripsi}
                onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })}
                rows={3}
                required
                disabled={isPosting}
              />

              <Input
                label="Harga per Pcs (Rp)"
                type="number"
                value={editingItem.harga_per_pcs}
                onChange={(e) => setEditingItem({ ...editingItem, harga_per_pcs: e.target.value })}
                required
                disabled={isPosting}
                leftIcon="mdi:cash"
                min="0"
                helperText="Boleh diisi 0 jika tidak ada biaya"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}