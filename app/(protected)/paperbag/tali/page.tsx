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
interface PaperbagTali {
  id: string
  kode: string
  nama: string
  deskripsi: string
  harga_per_pcs: string
  status: string
  updated_at: string | null
}

interface ApiResponse {
  status: number
  message: string
  data: PaperbagTali[]
}

interface FormData {
  kode: string
  nama: string
  deskripsi: string
  harga_per_pcs: string
  status: string
}

// ============ CONSTANTS ============
const TALI_META: Record<string, { icon: string; color: string }> = {
  tali_kertas_natural: { icon: 'mdi:rope',                color: 'amber'  },
  tali_kertas_putih:   { icon: 'mdi:rope',                color: 'gray'   },
  tali_kertas_warna:   { icon: 'mdi:palette',             color: 'pink'   },
  tali_satin_tipis:    { icon: 'mdi:ribbon',              color: 'purple' },
  tali_satin_lebar:    { icon: 'mdi:ribbon',              color: 'indigo' },
  tali_nilon:          { icon: 'mdi:link-variant',        color: 'blue'   },
  tali_cotton:         { icon: 'mdi:leaf',                color: 'green'  },
  tali_rami:           { icon: 'mdi:sprout',              color: 'lime'   },
  tali_pu:             { icon: 'mdi:star-circle',         color: 'rose'   },
  tanpa_tali:          { icon: 'mdi:minus-circle-outline',color: 'gray'   },
}

const DEFAULT_TALI_META = { icon: 'mdi:rope', color: 'gray' }

const EMPTY_FORM: FormData = {
  kode: '',
  nama: '',
  deskripsi: '',
  harga_per_pcs: '',
  status: '1',
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
}

const validateForm = (form: FormData, isEdit = false): string | null => {
  if (!isEdit && !form.kode.trim()) return 'Kode tali tidak boleh kosong.'
  if (!form.nama.trim()) return 'Nama tali tidak boleh kosong.'
  if (!form.deskripsi.trim()) return 'Deskripsi tidak boleh kosong.'
  if (form.harga_per_pcs === '' || isNaN(Number(form.harga_per_pcs)) || Number(form.harga_per_pcs) < 0)
    return 'Harga per pcs tidak valid.'
  return null
}

// ============ MAIN COMPONENT ============
export default function PaperbagTaliPage() {
  const [taliList, setTaliList] = useState<PaperbagTali[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  // Modal state
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PaperbagTali | null>(null)

  // Form state (shared for add & edit)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  // ===== STATS =====
  const stats = useMemo(() => {
    const total = taliList.length
    const aktif = taliList.filter(t => t.status === '1').length
    const nonAktif = total - aktif
    const prices = taliList.map(t => parseFloat(t.harga_per_pcs)).filter(p => p > 0)
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0
    return { total, aktif, nonAktif, avgPrice, maxPrice }
  }, [taliList])

  // ===== FILTERED =====
  const filtered = useMemo(() =>
    taliList.filter(t =>
      t.nama.toLowerCase().includes(search.toLowerCase()) ||
      t.kode.toLowerCase().includes(search.toLowerCase())
    ), [taliList, search])

  // ===== API =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse>('/Admin/Paperbag/PaperbagTali')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setTaliList(data.data)
      } else {
        setTaliList([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
      setTaliList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ===== HANDLERS: VIEW =====
  const handleViewClick = (item: PaperbagTali) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  // ===== HANDLERS: ADD =====
  const handleAddClick = () => {
    setForm(EMPTY_FORM)
    setShowAddModal(true)
  }

  const handleAdd = async () => {
    const err = validateForm(form)
    if (err) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3B82F6' })
      return
    }

    try {
      setIsPosting(true)
      await axios.post('/Admin/Paperbag/PaperbagTaliAdd', {
        kode: form.kode.trim(),
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim(),
        harga_per_pcs: form.harga_per_pcs,
      })
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Tali baru berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
      setShowAddModal(false)
      fetchData() // refresh list from server
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menambahkan data'), confirmButtonColor: '#3B82F6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS: EDIT =====
  const handleEditClick = (item: PaperbagTali) => {
    setSelectedItem(item)
    setForm({
      kode: item.kode,
      nama: item.nama,
      deskripsi: item.deskripsi,
      harga_per_pcs: item.harga_per_pcs,
      status: item.status,
    })
    setShowViewModal(false)
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!selectedItem) return
    const errMsg = validateForm(form, true)
    if (errMsg) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: errMsg, confirmButtonColor: '#3B82F6' })
      return
    }

    try {
      setIsPosting(true)
      await axios.put(`/Admin/Paperbag/PaperbagTaliEdit/${selectedItem.id}`, {
        kode: selectedItem.kode, // kode tidak bisa diubah, kirim yang lama
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim(),
        harga_per_pcs: form.harga_per_pcs,
      })
      setTaliList(prev => prev.map(t =>
        t.id === selectedItem.id
          ? { ...t, nama: form.nama, deskripsi: form.deskripsi, harga_per_pcs: form.harga_per_pcs }
          : t
      ))
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data tali berhasil diperbarui!', timer: 1500, showConfirmButton: false })
      setShowEditModal(false)
      setSelectedItem(null)
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data'), confirmButtonColor: '#3B82F6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS: DELETE =====
  const handleDeleteClick = async (item: PaperbagTali) => {
    const result = await Swal.fire({
      title: 'Hapus Tali?',
      html: `Apakah kamu yakin ingin menghapus <b>"${item.nama}"</b>?<br/><small class="text-gray-500">Tindakan ini tidak dapat dibatalkan.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
    })

    if (result.isConfirmed) {
      try {
        await axios.delete(`/Admin/Paperbag/PaperbagTali/${item.id}`)
        setTaliList(prev => prev.filter(t => t.id !== item.id))
        await Swal.fire({ icon: 'success', title: 'Dihapus!', text: `"${item.nama}" berhasil dihapus.`, timer: 1500, showConfirmButton: false })
      } catch (err: unknown) {
        Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data'), confirmButtonColor: '#3B82F6' })
      }
    }
  }

  // ===== HANDLERS: TOGGLE STATUS =====
  const toggleStatus = async (item: PaperbagTali) => {
    const newStatus = item.status === '1' ? '0' : '1'
    const result = await Swal.fire({
      title: 'Ubah Status?',
      text: `${item.status === '1' ? 'Nonaktifkan' : 'Aktifkan'} "${item.nama}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: item.status === '1' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
    })

    if (result.isConfirmed) {
      try {
        await axios.put(`/Admin/Paperbag/PaperbagTaliEdit/${item.id}`, {
          kode: item.kode,
          nama: item.nama,
          deskripsi: item.deskripsi,
          harga_per_pcs: item.harga_per_pcs,
          status: newStatus,
        })
        setTaliList(prev => prev.map(t => t.id === item.id ? { ...t, status: newStatus } : t))
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: `"${item.nama}" berhasil diperbarui!`, timer: 1500, showConfirmButton: false })
      } catch (err: unknown) {
        Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal mengubah status'), confirmButtonColor: '#3B82F6' })
      }
    }
  }

  // ===== SHARED FORM FIELDS =====
  const renderFormFields = (isEdit = false) => (
    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
          <Icon icon="mdi:pencil" className="w-3 h-3 text-amber-600" />
        </div>
        Informasi Tali
      </h3>

      {/* Kode — hanya muncul saat Add */}
      {!isEdit && (
        <Input
          label="Kode Tali"
          type="text"
          value={form.kode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, kode: e.target.value }))}
          disabled={isPosting}
          leftIcon="mdi:identifier"
          placeholder="contoh: tali_kertas_natural"
        />
      )}

      <Input
        label="Nama Tali"
        type="text"
        value={form.nama}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, nama: e.target.value }))}
        disabled={isPosting}
        leftIcon="mdi:rope"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
        <textarea
          value={form.deskripsi}
          onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))}
          disabled={isPosting}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60 resize-none"
        />
      </div>

      <Input
        label="Harga per pcs (IDR)"
        type="number"
        min={0}
        step={50}
        value={form.harga_per_pcs}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, harga_per_pcs: e.target.value }))}
        disabled={isPosting}
        leftIcon="mdi:cash"
      />
    </div>
  )

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat data Tali Paperbag..." />


  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
            <Icon icon="mdi:shopping" className="w-6 h-6  text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl text-gray-900 font-bold">
              Tali Paperbag
            </h1>
            <p className="text-gray-600 mt-1">Kelola jenis dan harga tali paperbag</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="border-gray-300" icon="mdi:refresh">
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddClick} icon="mdi:plus">
            Tambah Tali
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: 'mdi:rope', color: 'amber', label: 'Total Jenis Tali', value: stats.total,
            children: (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600 flex items-center gap-1"><Icon icon="mdi:check-circle" className="w-3 h-3" />{stats.aktif} Aktif</span>
                <span className="text-gray-300">•</span>
                <span className="text-red-500 flex items-center gap-1"><Icon icon="mdi:minus-circle" className="w-3 h-3" />{stats.nonAktif} Non-aktif</span>
              </div>
            )
          },
          {
            icon: 'mdi:currency-usd', color: 'green', label: 'Rata-rata Harga', value: formatCurrency(stats.avgPrice),
            children: <p className="text-xs text-gray-500">per pcs (tali berbayar)</p>
          },
          {
            icon: 'mdi:trending-up', color: 'purple', label: 'Harga Tertinggi', value: formatCurrency(stats.maxPrice),
            children: (
              <>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">batas atas harga tali</p>
              </>
            )
          },
          {
            icon: 'mdi:magnify', color: 'blue', label: 'Hasil Pencarian', value: filtered.length,
            children: <p className="text-xs text-gray-500">dari {stats.total} total jenis tali</p>
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
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-amber-600" />
              Daftar Tali Paperbag
            </h3>
            <p className="text-sm text-gray-600 mt-1">Total {stats.total} jenis tali tersedia</p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {taliList.length === 0 ? (
            <EmptyState icon="mdi:rope" title="Belum ada data tali" message="Tidak ada jenis tali yang tersedia" />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Tali', 'Kode', 'Harga / pcs', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <EmptyState
                        icon="mdi:rope"
                        title="Tidak ada hasil pencarian"
                        message={`Tidak ditemukan tali dengan kata kunci "${search}"`}
                        actionLabel="Clear Pencarian"
                        onAction={() => setSearch('')}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const meta = TALI_META[item.kode] || DEFAULT_TALI_META
                    const harga = parseFloat(item.harga_per_pcs)
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-${meta.color}-100 rounded-lg flex items-center justify-center`}>
                              <Icon icon={meta.icon} className={`w-5 h-5 text-${meta.color}-600`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.nama}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${meta.color}-100 text-${meta.color}-800 border border-${meta.color}-200`}>
                            {item.kode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {harga === 0 ? (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-200">
                              <Icon icon="mdi:minus" className="w-4 h-4" />
                              Gratis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-green-200">
                              <Icon icon="mdi:cash" className="w-4 h-4" />
                              {formatCurrency(item.harga_per_pcs)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.status === '1' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                              {item.status === '1' ? 'Aktif' : 'Non-aktif'}
                            </span>
                            <button onClick={() => toggleStatus(item)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100" title="Toggle Status">
                              <Icon icon="mdi:swap-vertical" className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleViewClick(item)} className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                              <Icon icon="mdi:eye" className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleEditClick(item)} className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                              <Icon icon="mdi:pencil" className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteClick(item)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                              <Icon icon="mdi:trash-can" className="w-5 h-5" />
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
            <p className="text-sm text-gray-600">Menampilkan {filtered.length} dari {taliList.length} jenis tali</p>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="🔍 Detail Tali Paperbag"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Tutup</Button>
            <Button variant="primary" onClick={() => selectedItem && handleEditClick(selectedItem)} icon="mdi:pencil">Edit Tali</Button>
          </div>
        }
      >
        {selectedItem && (() => {
          const meta = TALI_META[selectedItem.kode] || DEFAULT_TALI_META
          return (
            <div className="space-y-5">
              <div className={`bg-gradient-to-r from-${meta.color}-50 to-${meta.color}-100/50 p-5 rounded-xl border border-${meta.color}-200`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-${meta.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon icon={meta.icon} className={`w-7 h-7 text-${meta.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedItem.nama}</h2>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${meta.color}-100 text-${meta.color}-800 mt-1`}>
                      {selectedItem.kode}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-green-50/50 border-green-200">
                  <p className="text-xs text-green-700 mb-1 flex items-center gap-1"><Icon icon="mdi:cash" className="w-3.5 h-3.5" />Harga per pcs</p>
                  <p className="text-xl font-bold text-green-800">
                    {parseFloat(selectedItem.harga_per_pcs) === 0 ? 'Gratis' : formatCurrency(selectedItem.harga_per_pcs)}
                  </p>
                </Card>
                <Card className="p-4 bg-blue-50/50 border-blue-200">
                  <p className="text-xs text-blue-700 mb-1 flex items-center gap-1"><Icon icon="mdi:information" className="w-3.5 h-3.5" />Status</p>
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${selectedItem.status === '1' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    <Icon icon={selectedItem.status === '1' ? 'mdi:check-circle' : 'mdi:close-circle'} className="w-4 h-4" />
                    {selectedItem.status === '1' ? 'Aktif' : 'Non-aktif'}
                  </span>
                </Card>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Deskripsi</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.deskripsi}</p>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="➕ Tambah Tali Baru"
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:plus-circle" className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900">Tambah Jenis Tali Baru</p>
                <p className="text-xs text-green-600 mt-0.5">Isi semua field yang diperlukan. Kode tali bersifat unik.</p>
              </div>
            </div>
          </div>
          {renderFormFields(false)}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`✏️ Edit Tali — ${selectedItem?.nama}`}
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
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">{selectedItem.nama}</p>
                  <p className="text-xs text-amber-600 mt-0.5">Kode: {selectedItem.kode} (tidak dapat diubah)</p>
                </div>
              </div>
            </div>
            {renderFormFields(true)}
          </div>
        )}
      </Modal>
    </div>
  )
}