'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'

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

interface EditFormData {
  nama: string
  deskripsi: string
  harga_per_pcs: string
  status: string
}

// ============ CONSTANTS ============
const TALI_META: Record<string, { icon: string; color: string; bgColor: string }> = {
  tali_kertas_natural: { icon: 'mdi:rope', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  tali_kertas_putih:   { icon: 'mdi:rope', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  tali_kertas_warna:   { icon: 'mdi:palette', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  tali_satin_tipis:    { icon: 'mdi:ribbon', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  tali_satin_lebar:    { icon: 'mdi:ribbon', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  tali_nilon:          { icon: 'mdi:link-variant', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  tali_cotton:         { icon: 'mdi:leaf', color: 'text-green-600', bgColor: 'bg-green-100' },
  tali_rami:           { icon: 'mdi:sprout', color: 'text-lime-600', bgColor: 'bg-lime-100' },
  tali_pu:             { icon: 'mdi:star-circle', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  tanpa_tali:          { icon: 'mdi:minus-circle-outline', color: 'text-gray-400', bgColor: 'bg-gray-100' },
}

const DEFAULT_META = { icon: 'mdi:rope', color: 'text-gray-600', bgColor: 'bg-gray-100' }

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// ============ SWEETALERT2 HELPERS ============
const showSuccess = (title: string, message: string) =>
  Swal.fire({ icon: 'success', title, text: message, timer: 2000, showConfirmButton: true, confirmButtonColor: '#3B82F6', background: '#ffffff', backdrop: 'rgba(0,0,0,0.4)' })

const showError = (title: string, message: string) =>
  Swal.fire({ icon: 'error', title, text: message, confirmButtonColor: '#3B82F6', background: '#ffffff', backdrop: 'rgba(0,0,0,0.4)' })

const showConfirmDialog = (title: string, message: string) =>
  Swal.fire({ icon: 'question', title, text: message, showCancelButton: true, confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal', confirmButtonColor: '#3B82F6', cancelButtonColor: '#6B7280', background: '#ffffff', backdrop: 'rgba(0,0,0,0.4)' })

const showLoading = (message: string) =>
  Swal.fire({ title: 'Loading...', text: message, allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading(), background: '#ffffff', backdrop: 'rgba(0,0,0,0.4)' })

// ============ MAIN COMPONENT ============
export default function PaperbagTaliPage() {
  const [taliList, setTaliList] = useState<PaperbagTali[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTali, setSelectedTali] = useState<PaperbagTali | null>(null)

  const [editForm, setEditForm] = useState<EditFormData>({
    nama: '', deskripsi: '', harga_per_pcs: '', status: '1',
  })

  // ===== STATS =====
  const stats = useMemo(() => {
    const total = taliList.length
    const aktif = taliList.filter(t => t.status === '1').length
    const nonAktif = total - aktif
    const prices = taliList.map(t => parseFloat(t.harga_per_pcs)).filter(p => p > 0)
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    return { total, aktif, nonAktif, avgPrice }
  }, [taliList])

  // ===== FILTERED =====
  const filtered = useMemo(() =>
    taliList.filter(t =>
      t.nama.toLowerCase().includes(search.toLowerCase()) ||
      t.kode.toLowerCase().includes(search.toLowerCase()) ||
      t.deskripsi.toLowerCase().includes(search.toLowerCase())
    ), [taliList, search])

  // ===== API =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<ApiResponse>('/Admin/Paperbag/PaperbagTali')
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setTaliList(response.data.data)
      } else {
        setTaliList([])
      }
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat memuat data'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        errorMessage = e.response?.data?.message || errorMessage
      } else if (err && typeof err === 'object' && 'code' in err) {
        const e = err as { code?: string }
        errorMessage = e.code === 'ECONNABORTED' ? 'Koneksi timeout. Silakan coba lagi.' : 'Tidak bisa connect ke server.'
      }
      setError(errorMessage)
      setTaliList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async () => {
    const result = await showConfirmDialog('Refresh Data?', 'Data akan dimuat ulang dari server.')
    if (result.isConfirmed) {
      await fetchData()
      await showSuccess('Berhasil!', 'Data berhasil di-refresh!')
    }
  }, [fetchData])

  const handleViewDetails = useCallback((tali: PaperbagTali) => {
    setSelectedTali(tali)
    setIsViewModalOpen(true)
  }, [])

  const handleEdit = useCallback((tali: PaperbagTali) => {
    setSelectedTali(tali)
    setEditForm({
      nama: tali.nama,
      deskripsi: tali.deskripsi,
      harga_per_pcs: tali.harga_per_pcs,
      status: tali.status,
    })
    setIsViewModalOpen(false)
    setIsEditModalOpen(true)
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!selectedTali) return
    if (!editForm.nama.trim()) {
      await showError('Input Tidak Valid', 'Nama tali tidak boleh kosong.')
      return
    }
    if (isNaN(Number(editForm.harga_per_pcs)) || Number(editForm.harga_per_pcs) < 0) {
      await showError('Input Tidak Valid', 'Harga per pcs tidak valid.')
      return
    }

    try {
      setPosting(true)
      await showLoading('Menyimpan perubahan...')

      await axios.put(`/Admin/Paperbag/PaperbagTali/${selectedTali.id}`, editForm)

      setTaliList(prev =>
        prev.map(t => t.id === selectedTali.id ? { ...t, ...editForm } : t)
      )

      Swal.close()
      await showSuccess('Berhasil!', 'Data tali paperbag berhasil diperbarui!')
      setIsEditModalOpen(false)
      setSelectedTali(null)
    } catch (err: unknown) {
      Swal.close()
      let errorMessage = 'Gagal menyimpan data'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        errorMessage = e.response?.data?.message || errorMessage
      }
      await showError('Error!', errorMessage)
    } finally {
      setPosting(false)
    }
  }, [selectedTali, editForm])

  const handleCloseModal = useCallback(() => {
    if (!posting) {
      setIsViewModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedTali(null)
    }
  }, [posting])

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat data Tali Paperbag..." />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
            <Icon icon="mdi:rope" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              Tali Paperbag
            </h1>
            <p className="text-gray-600 mt-1">Kelola jenis dan harga tali paperbag</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} icon="mdi:refresh">
          Refresh
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:rope" className="w-4 h-4 text-amber-600" />
              Total Jenis Tali
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <span className="text-green-600 font-medium text-xs flex items-center gap-1">
              <Icon icon="mdi:check-circle" className="w-3 h-3" />
              {stats.aktif} Aktif
              {stats.nonAktif > 0 && (
                <span className="text-gray-400 ml-1">· {stats.nonAktif} Non-aktif</span>
              )}
            </span>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:currency-usd" className="w-4 h-4 text-green-600" />
              Rata-rata Harga
            </p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.avgPrice)}</p>
            <p className="text-xs text-gray-500">per pcs</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:magnify" className="w-4 h-4 text-blue-600" />
              Hasil Pencarian
            </p>
            <p className="text-3xl font-bold text-gray-900">{filtered.length}</p>
            <p className="text-xs text-gray-500">dari {stats.total} total</p>
          </div>
        </Card>
      </div>

      {/* ===== MAIN CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-amber-600" />
              Daftar Tali Paperbag
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.total} jenis tali tersedia
            </p>
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tali</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Harga / pcs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Icon icon="mdi:rope" className="w-12 h-12 opacity-30" />
                      <p className="font-medium">Tidak ada data ditemukan</p>
                      {search && (
                        <button onClick={() => setSearch('')} className="text-sm text-amber-600 hover:underline">
                          Clear pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tali) => {
                  const meta = TALI_META[tali.kode] || DEFAULT_META
                  return (
                    <tr key={tali.id} className="hover:bg-amber-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bgColor}`}>
                            <Icon icon={meta.icon} className={`w-5 h-5 ${meta.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tali.nama}</p>
                            <p className="text-xs text-gray-400">{tali.kode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-gray-600 leading-relaxed">{tali.deskripsi}</p>
                      </td>
                      <td className="px-6 py-4">
                        {parseFloat(tali.harga_per_pcs) === 0 ? (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-sm font-semibold px-3 py-1.5 rounded-lg">
                            <Icon icon="mdi:minus" className="w-4 h-4" />
                            Gratis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg">
                            <Icon icon="mdi:cash" className="w-4 h-4" />
                            {formatCurrency(tali.harga_per_pcs)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tali.status === '1' ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <Icon icon="mdi:check-circle" className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <Icon icon="mdi:close-circle" className="w-3.5 h-3.5" />
                            Non-aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(tali)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Icon icon="mdi:eye" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(tali)}
                            className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil" className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-600">
              Menampilkan {filtered.length} dari {taliList.length} jenis tali
            </p>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        title="🔍 Detail Tali Paperbag"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
            <Button variant="primary" onClick={() => selectedTali && handleEdit(selectedTali)} icon="mdi:pencil">
              Edit Tali
            </Button>
          </div>
        }
      >
        {selectedTali && (() => {
          const meta = TALI_META[selectedTali.kode] || DEFAULT_META
          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${meta.bgColor}`}>
                    <Icon icon={meta.icon} className={`w-7 h-7 ${meta.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTali.nama}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedTali.kode}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-green-50/50 border-green-200">
                  <p className="text-xs text-green-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:cash" className="w-3.5 h-3.5" /> Harga per pcs
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {parseFloat(selectedTali.harga_per_pcs) === 0 ? 'Gratis' : formatCurrency(selectedTali.harga_per_pcs)}
                  </p>
                </Card>
                <Card className="p-4 bg-blue-50/50 border-blue-200">
                  <p className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                    <Icon icon="mdi:information" className="w-3.5 h-3.5" /> Status
                  </p>
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${selectedTali.status === '1' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    <Icon icon={selectedTali.status === '1' ? 'mdi:check-circle' : 'mdi:close-circle'} className="w-4 h-4" />
                    {selectedTali.status === '1' ? 'Aktif' : 'Non-aktif'}
                  </span>
                </Card>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Deskripsi</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedTali.deskripsi}</p>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title={`Edit Tali — ${selectedTali?.nama}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal} disabled={posting}>Batal</Button>
            <Button variant="primary" onClick={handleUpdate} loading={posting} disabled={posting}>
              {posting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        {selectedTali && (
          <div className="space-y-5">
            {/* Info Box */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${TALI_META[selectedTali.kode]?.bgColor || 'bg-gray-100'}`}>
                  <Icon icon={TALI_META[selectedTali.kode]?.icon || 'mdi:rope'} className={`w-5 h-5 ${TALI_META[selectedTali.kode]?.color || 'text-gray-600'}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900">{selectedTali.nama}</h4>
                  <p className="text-xs text-amber-500 mt-0.5">{selectedTali.kode}</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:pencil" className="w-3 h-3 text-amber-600" />
                </div>
                Informasi Tali
              </h3>

              <Input
                label="Nama Tali"
                type="text"
                value={editForm.nama}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm(prev => ({ ...prev, nama: e.target.value }))
                }
                disabled={posting}
                leftIcon="mdi:rope"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={editForm.deskripsi}
                  onChange={e => setEditForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                  disabled={posting}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60 resize-none"
                />
              </div>

              <Input
                label="Harga per pcs (IDR)"
                type="number"
                min={0}
                step={50}
                value={editForm.harga_per_pcs}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm(prev => ({ ...prev, harga_per_pcs: e.target.value }))
                }
                disabled={posting}
                leftIcon="mdi:cash"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  disabled={posting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60 bg-white"
                >
                  <option value="1">Aktif</option>
                  <option value="0">Non-aktif</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}