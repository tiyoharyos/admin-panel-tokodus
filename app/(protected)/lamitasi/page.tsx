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
interface Laminasi {
  id_lt: string
  code: string
  label: string
  index_harga: string
}

interface ApiResponse {
  status: number
  message: string
  data: Laminasi[]
}

interface EditFormData {
  code: string
  label: string
  index_harga: string
}

interface AddFormData {
  code: string
  label: string
  index_harga: string
}

// ============ CONSTANTS ============
const LAMINASI_META: Record<string, { icon: string; accent: string }> = {
  none:      { icon: 'mdi:close-circle-outline', accent: '#64748b' },
  doff:      { icon: 'mdi:blur',                 accent: '#6366f1' },
  glossy:    { icon: 'mdi:shimmer',              accent: '#f59e0b' },
  uv:        { icon: 'mdi:white-balance-sunny',  accent: '#8b5cf6' },
  wb_glossy: { icon: 'mdi:water-circle',         accent: '#06b6d4' },
  wb_doff:   { icon: 'mdi:water-outline',        accent: '#14b8a6' },
}
const DEFAULT_META = { icon: 'mdi:layers', accent: '#64748b' }

const formatIndex = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val
  return `${(num * 100).toFixed(0)}%`
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
}

const EMPTY_ADD_FORM: AddFormData = { code: '', label: '', index_harga: '' }

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

// ============ MAIN COMPONENT ============
export default function LaminasiPage() {
  const [laminasiList, setLaminasiList] = useState<Laminasi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Laminasi | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>({ code: '', label: '', index_harga: '' })
  const [addForm, setAddForm] = useState<AddFormData>(EMPTY_ADD_FORM)

  // ===== STATS =====
  const stats = useMemo(() => {
    const total = laminasiList.length
    const withLaminasi = laminasiList.filter(l => l.code !== 'none').length
    const indexes = laminasiList.map(l => parseFloat(l.index_harga)).filter(v => v > 0)
    const maxIndex = indexes.length ? Math.max(...indexes) : 0
    const avgIndex = indexes.length ? indexes.reduce((a, b) => a + b, 0) / indexes.length : 0
    return { total, withLaminasi, maxIndex, avgIndex }
  }, [laminasiList])

  const filtered = useMemo(() =>
    laminasiList.filter(l =>
      l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
    ), [laminasiList, search])

  // ===== API =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse>('/Admin/Laminasi/Laminasi')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setLaminasiList(data.data)
      } else {
        setLaminasiList([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
      setLaminasiList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ===== HANDLERS =====
  const handleViewClick = (item: Laminasi) => { setSelectedItem(item); setShowViewModal(true) }

  const handleEditClick = (item: Laminasi) => {
    setSelectedItem(item)
    setEditForm({ code: item.code, label: item.label, index_harga: item.index_harga })
    setShowViewModal(false)
    setShowEditModal(true)
  }

  const handleAddClick = () => {
    setAddForm(EMPTY_ADD_FORM)
    setShowAddModal(true)
  }

  // ===== ADD HANDLER =====
  const handleAdd = async () => {
    if (!addForm.code.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Kode tidak boleh kosong.', confirmButtonColor: '#6366f1' })
      return
    }
    if (!addForm.label.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Label tidak boleh kosong.', confirmButtonColor: '#6366f1' })
      return
    }
    if (addForm.index_harga.trim() === '' || isNaN(Number(addForm.index_harga)) || Number(addForm.index_harga) < 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Index harga tidak valid.', confirmButtonColor: '#6366f1' })
      return
    }
    try {
      setIsPosting(true)
      await axios.post('/Admin/Laminasi/LaminasiAdd', addForm)
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data laminasi berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
      setShowAddModal(false)
      setAddForm(EMPTY_ADD_FORM)
      await fetchData()
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menambahkan data'), confirmButtonColor: '#6366f1' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLER =====
  const handleUpdate = async () => {
    if (!selectedItem) return
    if (!editForm.code.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Kode tidak boleh kosong.', confirmButtonColor: '#6366f1' })
      return
    }
    if (!editForm.label.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Label tidak boleh kosong.', confirmButtonColor: '#6366f1' })
      return
    }
    if (isNaN(Number(editForm.index_harga)) || Number(editForm.index_harga) < 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Index harga tidak valid.', confirmButtonColor: '#6366f1' })
      return
    }
    try {
      setIsPosting(true)
      await axios.put(`/Admin/Laminasi/LaminasiEdit/${selectedItem.id_lt}`, editForm)
      setLaminasiList(prev =>
        prev.map(l => l.id_lt === selectedItem.id_lt ? { ...l, ...editForm } : l)
      )
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data laminasi berhasil diperbarui!', timer: 1500, showConfirmButton: false })
      setShowEditModal(false)
      setSelectedItem(null)
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data'), confirmButtonColor: '#6366f1' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE HANDLER =====
  const handleDelete = async (item: Laminasi) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Laminasi?',
      html: `Apakah Anda yakin ingin menghapus <strong>${item.label}</strong>?<br/><span class="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</span>`,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })

    if (!result.isConfirmed) return

    try {
      await axios.delete(`/Admin/Laminasi/Laminasi/${item.id_lt}`)
      setLaminasiList(prev => prev.filter(l => l.id_lt !== item.id_lt))
      // Close view modal if open for this item
      if (showViewModal && selectedItem?.id_lt === item.id_lt) {
        setShowViewModal(false)
        setSelectedItem(null)
      }
      await Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Laminasi berhasil dihapus.', timer: 1500, showConfirmButton: false })
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data'), confirmButtonColor: '#6366f1' })
    }
  }

  // ===== LOADING / ERROR =====
  if (loading) return <LoadingState message="Memuat data Laminasi..." submessage="Harap tunggu sebentar" icon="mdi:layers-triple" />

  // ===== RENDER =====
  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:layers-triple" className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Laminasi</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola jenis dan index harga laminasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} icon="mdi:refresh">
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddClick} icon="mdi:plus">
            Tambah Laminasi
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            icon: 'mdi:layers-triple',
            label: 'Total Jenis',
            value: stats.total,
            sub: `${stats.withLaminasi} dengan laminasi · ${stats.total - stats.withLaminasi} tanpa`,
          },
          {
            icon: 'mdi:trending-up',
            label: 'Index Tertinggi',
            value: formatIndex(stats.maxIndex),
            sub: 'dari harga dasar produk',
          },
          {
            icon: 'mdi:chart-bell-curve',
            label: 'Rata-rata Index',
            value: formatIndex(stats.avgIndex),
            sub: 'dari semua jenis aktif',
            bar: stats.maxIndex > 0 ? (stats.avgIndex / stats.maxIndex) * 100 : 0,
          },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{s.value}</p>
            {s.bar !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== TABLE ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Laminasi</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.total} jenis ({stats.withLaminasi} dengan laminasi, {stats.total - stats.withLaminasi} tanpa)
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari label atau kode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 placeholder:text-gray-400 hover:border-gray-400 transition-all duration-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {laminasiList.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data laminasi</p>
              <Button variant="primary" size="sm" onClick={handleAddClick} icon="mdi:plus">
                Tambah Laminasi Pertama
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Laminasi', 'Kode', 'Index Harga', 'Proporsi', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                        <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                          Hapus Pencarian
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const meta = LAMINASI_META[item.code] || DEFAULT_META
                    const indexNum = parseFloat(item.index_harga)
                    const pct = stats.maxIndex > 0 ? (indexNum / stats.maxIndex) * 100 : 0
                    const isNone = item.code === 'none'

                    return (
                      <tr key={item.id_lt} className="hover:bg-slate-50/80 transition-colors">
                        {/* Laminasi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}15` }}>
                              <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{item.label}</p>
                            </div>
                          </div>
                        </td>

                        {/* Kode */}
                        <td className="px-6 py-4">
                          <Badge color={meta.accent}>{item.code}</Badge>
                        </td>

                        {/* Index Harga */}
                        <td className="px-6 py-4">
                          {isNone || indexNum === 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                              <Icon icon="mdi:minus" className="w-4 h-4" />
                              Tidak ada
                            </span>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{formatIndex(item.index_harga)}</p>
                              <p className="text-xs text-gray-400">{parseFloat(item.index_harga).toFixed(4)}</p>
                            </div>
                          )}
                        </td>

                        {/* Proporsi */}
                        <td className="px-6 py-4 w-40">
                          {!isNone && indexNum > 0 ? (
                            <div className="space-y-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: meta.accent }} />
                              </div>
                              <p className="text-xs text-gray-400">{pct.toFixed(0)}% dari maks</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewClick(item)}
                              title="Lihat Detail"
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filtered.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{laminasiList.length}</span> jenis laminasi
            </p>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Laminasi"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="md" icon="mdi:trash-can-outline"
              onClick={() => { if (selectedItem) { setShowViewModal(false); handleDelete(selectedItem) } }}
              className="text-red-500 hover:bg-red-50 hover:text-red-600 mr-auto"
            >
              Hapus
            </Button>
            <Button variant="outline" size="md" onClick={() => setShowViewModal(false)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              size="md"
              icon="mdi:pencil-outline"
              onClick={() => selectedItem && handleEditClick(selectedItem)}
            >
              Edit Laminasi
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const meta = LAMINASI_META[selectedItem.code] || DEFAULT_META
          const indexNum = parseFloat(selectedItem.index_harga)
          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${meta.accent}0d` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}20` }}>
                  <Icon icon={meta.icon} className="w-7 h-7" style={{ color: meta.accent }} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{selectedItem.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={meta.accent}>{selectedItem.code}</Badge>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1">Index Harga</p>
                  <p className="text-2xl font-bold text-slate-800">{indexNum === 0 ? '—' : formatIndex(selectedItem.index_harga)}</p>
                  <p className="text-xs text-gray-400 mt-1">{indexNum === 0 ? 'Tidak ada tambahan' : `Raw: ${parseFloat(selectedItem.index_harga).toFixed(4)}`}</p>
                </Card>
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1">Tipe</p>
                  <p className="text-sm font-semibold text-slate-800 mt-2">{selectedItem.code === 'none' ? 'Tanpa laminasi' : 'Dengan laminasi'}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedItem.code === 'none' ? 'Tidak mempengaruhi harga' : 'Menambah harga produk'}</p>
                </Card>
              </div>

              {/* Progress */}
              {indexNum > 0 && (
                <Card shadow="none" padding="sm" bordered>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">Proporsi dari index tertinggi</p>
                    <p className="text-xs font-semibold text-slate-700">
                      {stats.maxIndex > 0 ? ((indexNum / stats.maxIndex) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${stats.maxIndex > 0 ? (indexNum / stats.maxIndex) * 100 : 0}%`, background: meta.accent }}
                    />
                  </div>
                </Card>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="Tambah Laminasi Baru"
        size="md"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => !isPosting && setShowAddModal(false)}
              disabled={isPosting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAdd}
              loading={isPosting}
              disabled={isPosting}
              icon="mdi:plus"
            >
              Simpan Data
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Info */}
          <div className="flex items-center gap-2 px-3 py-3 bg-green-50 border border-green-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Isi semua field di bawah untuk menambahkan jenis laminasi baru.
            </p>
          </div>

          {/* Fields */}
          <Input
            label="Kode"
            type="text"
            value={addForm.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddForm(p => ({ ...p, code: e.target.value }))}
            disabled={isPosting}
            leftIcon="mdi:code-tags"
            placeholder="Contoh: doff, glossy, uv..."
            helperText="Kode unik untuk identifikasi laminasi (huruf kecil, tanpa spasi)"
          />

          <Input
            label="Label"
            type="text"
            value={addForm.label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddForm(p => ({ ...p, label: e.target.value }))}
            disabled={isPosting}
            leftIcon="mdi:layers-triple"
            placeholder="Nama tampilan laminasi..."
          />

          <Input
            label="Index Harga"
            type="number"
            min={0}
            step={0.01}
            value={addForm.index_harga}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddForm(p => ({ ...p, index_harga: e.target.value }))}
            disabled={isPosting}
            leftIcon="mdi:percent"
            placeholder="0.0000"
            helperText="Contoh: 0.15 berarti +15% dari harga dasar"
          />

          {/* Preview */}
          {addForm.index_harga !== '' && !isNaN(Number(addForm.index_harga)) && Number(addForm.index_harga) >= 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-500">Preview index harga</span>
              <span className="text-sm font-bold text-green-600">
                +{(parseFloat(addForm.index_harga || '0') * 100).toFixed(1)}% dari harga dasar
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`Edit Laminasi — ${selectedItem?.label}`}
        size="md"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => !isPosting && setShowEditModal(false)}
              disabled={isPosting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleUpdate}
              loading={isPosting}
              disabled={isPosting}
              icon="mdi:check"
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Info */}
            <div className="flex items-center gap-2 px-3 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <Icon icon="mdi:information-outline" className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <p className="text-sm text-indigo-700">
                ID: <span className="font-semibold">{selectedItem.id_lt}</span> — semua field dapat diubah.
              </p>
            </div>

            {/* Fields */}
            <Input
              label="Kode"
              type="text"
              value={editForm.code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, code: e.target.value }))}
              disabled={isPosting}
              leftIcon="mdi:code-tags"
              placeholder="Contoh: doff, glossy, uv..."
              helperText="Kode unik untuk identifikasi laminasi"
            />

            <Input
              label="Label"
              type="text"
              value={editForm.label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, label: e.target.value }))}
              disabled={isPosting}
              leftIcon="mdi:layers-triple"
              placeholder="Nama laminasi..."
            />

            <Input
              label="Index Harga"
              type="number"
              min={0}
              step={0.01}
              value={editForm.index_harga}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, index_harga: e.target.value }))}
              disabled={isPosting}
              leftIcon="mdi:percent"
              placeholder="0.0000"
              helperText={`Nilai saat ini: ${parseFloat(selectedItem.index_harga).toFixed(4)} (${formatIndex(selectedItem.index_harga)})`}
            />

            {/* Preview */}
            {editForm.index_harga !== '' && !isNaN(Number(editForm.index_harga)) && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-500">Preview index harga</span>
                <span className="text-sm font-bold text-indigo-600">
                  +{(parseFloat(editForm.index_harga || '0') * 100).toFixed(1)}% dari harga dasar
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}