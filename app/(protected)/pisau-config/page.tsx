'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ===== TYPE DEFINITIONS =====
interface PisauConfig {
  id: string
  config_key: string
  min_panjang_cm: string
  min_lebar_cm: string
  min_tinggi_cm: string
  nilai: string | null
  keterangan: string
  updated_at: string | null
}

interface Stats {
  totalConfig: number
  avgPanjang: number
  avgLebar: number
  avgTinggi: number
  minPanjang: number
  maxPanjang: number
  minLebar: number
  maxLebar: number
  minTinggi: number
  maxTinggi: number
}

interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}

// ===== CONSTANTS =====
const BASE_ADD_FORM = {
  config_key: '',
  min_panjang_cm: '',
  min_lebar_cm: '',
  min_tinggi_cm: '',
  keterangan: ''
}

const DIMENSION_TYPES = [
  { id: 'panjang', label: 'Panjang Minimal', field: 'min_panjang_cm', icon: 'mdi:arrow-expand-horizontal', color: '#3b82f6' },
  { id: 'lebar',   label: 'Lebar Minimal',   field: 'min_lebar_cm',   icon: 'mdi:arrow-expand-vertical',   color: '#10b981' },
  { id: 'tinggi',  label: 'Tinggi Minimal',  field: 'min_tinggi_cm',  icon: 'mdi:arrow-expand-up',          color: '#8b5cf6' }
] as const

// ===== UTILS =====
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

const formatSize = (p: string, l: string, t: string) =>
  `${parseFloat(p).toFixed(1)} × ${parseFloat(l).toFixed(1)} × ${parseFloat(t).toFixed(1)} cm`

// ===== BADGE (same as print-settings) =====
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

// ===== CUSTOM HOOK =====
const usePisauConfig = () => {
  const [configs, setConfigs] = useState<PisauConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse<PisauConfig[]>>('/Admin/Pisau/PisauConfig')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setConfigs(data.data)
      } else {
        setConfigs([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      let errorMessage = 'Tidak bisa connect ke server'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        errorMessage = e.response?.data?.message || errorMessage
      } else if (err && typeof err === 'object' && 'code' in err) {
        const e = err as { code?: string }
        if (e.code === 'ECONNABORTED') errorMessage = 'Koneksi timeout. Silakan coba lagi.'
      }
      setError(errorMessage)
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  return { configs, loading, error, refetch: fetchConfigs }
}

const usePisauStats = (configs: PisauConfig[]) => {
  return useMemo((): Stats => {
    if (configs.length === 0) return {
      totalConfig: 0, avgPanjang: 0, avgLebar: 0, avgTinggi: 0,
      minPanjang: 0, maxPanjang: 0, minLebar: 0, maxLebar: 0, minTinggi: 0, maxTinggi: 0
    }
    const p = configs.map(c => parseFloat(c.min_panjang_cm))
    const l = configs.map(c => parseFloat(c.min_lebar_cm))
    const t = configs.map(c => parseFloat(c.min_tinggi_cm))
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    return {
      totalConfig: configs.length,
      avgPanjang: avg(p), avgLebar: avg(l), avgTinggi: avg(t),
      minPanjang: Math.min(...p), maxPanjang: Math.max(...p),
      minLebar: Math.min(...l), maxLebar: Math.max(...l),
      minTinggi: Math.min(...t), maxTinggi: Math.max(...t)
    }
  }, [configs])
}

// ===== MAIN COMPONENT =====
export default function PisauConfigPage() {
  const { configs, loading, error, refetch } = usePisauConfig()
  const stats = usePisauStats(configs)

  const [isPosting, setIsPosting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [addFormData, setAddFormData] = useState(BASE_ADD_FORM)
  const [selectedItem, setSelectedItem] = useState<PisauConfig | null>(null)
  const [search, setSearch] = useState('')

  const filteredConfigs = useMemo(() =>
    configs.filter(item =>
      item.config_key.toLowerCase().includes(search.toLowerCase()) ||
      item.keterangan.toLowerCase().includes(search.toLowerCase())
    ), [configs, search])

  // ===== HELPERS =====
  const getErrMsg = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    }
    return fallback
  }

  const handleRefresh = useCallback(async () => {
    const result = await Swal.fire({
      icon: 'question', title: 'Refresh Data?',
      text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal',
      confirmButtonColor: '#6366f1', cancelButtonColor: '#6B7280'
    })
    if (result.isConfirmed) {
      await refetch()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil di-refresh!', timer: 1500, showConfirmButton: false })
    }
  }, [refetch])

  // ===== API HANDLERS =====
  const validateDimensions = (data: { min_panjang_cm: string; min_lebar_cm: string; min_tinggi_cm: string; config_key: string; keterangan: string }) => {
    if (!data.config_key.trim()) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Config key harus diisi' }); return false }
    if (!data.keterangan.trim()) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Keterangan harus diisi' }); return false }
    for (const dim of DIMENSION_TYPES) {
      const val = data[dim.field as keyof typeof data]
      if (!val || !String(val).trim()) {
        Swal.fire({ icon: 'error', title: 'Validasi Error', text: `${dim.label} harus diisi` }); return false
      }
      if (parseFloat(String(val)) <= 0) {
        Swal.fire({ icon: 'error', title: 'Validasi Error', text: `${dim.label} harus lebih dari 0` }); return false
      }
    }
    return true
  }

  const handleAdd = async () => {
    if (!validateDimensions(addFormData)) return
    try {
      setIsPosting(true)
      const formData = new URLSearchParams()
      Object.entries(addFormData).forEach(([k, v]) => formData.append(k, String(v).trim()))
      const { data } = await axios.post<ApiResponse>('/Admin/Pisau/PisauConfigAdd', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Konfigurasi berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
        setShowAddModal(false)
        setAddFormData(BASE_ADD_FORM)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menyimpan data' })
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { status?: number; data?: { message?: string } } }
        Swal.fire({ icon: 'error', title: `Error ${e.response?.status || ''}`, text: e.response?.data?.message || 'Gagal menyimpan data' })
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: 'Terjadi kesalahan koneksi' })
      }
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedItem) return
    if (!validateDimensions(selectedItem)) return
    try {
      setIsPosting(true)
      const formData = new URLSearchParams()
      formData.append('config_key', selectedItem.config_key.trim())
      formData.append('min_panjang_cm', selectedItem.min_panjang_cm.trim())
      formData.append('min_lebar_cm', selectedItem.min_lebar_cm.trim())
      formData.append('min_tinggi_cm', selectedItem.min_tinggi_cm.trim())
      formData.append('keterangan', selectedItem.keterangan?.trim() || '')

      const { data } = await axios.put<ApiResponse>(
        `/Admin/Pisau/PisauConfigEdit/${selectedItem.id}`,
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )

      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui!', timer: 1500, showConfirmButton: false })
        await refetch()
        setShowEditModal(false)
        setSelectedItem(null)
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal mengupdate data' })
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal mengupdate data') })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string, configKey: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus konfigurasi "${configKey}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
    })
    if (result.isConfirmed) {
      try {
        const { data } = await axios.delete<ApiResponse>(`/Admin/Pisau/PisauConfigDel/${id}`)
        if (data?.status === 200) {
          await Swal.fire({ icon: 'success', title: 'Dihapus!', text: `"${configKey}" berhasil dihapus!`, timer: 1500, showConfirmButton: false })
          await refetch()
        }
      } catch (err: unknown) {
        Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data') })
      }
    }
  }

  const handleViewClick = (item: PisauConfig) => { setSelectedItem(item); setShowViewModal(true) }
  const handleEditClick = (item: PisauConfig) => { setSelectedItem(item); setShowViewModal(false); setShowEditModal(true) }
  const handleCloseModal = () => {
    if (!isPosting) { setShowViewModal(false); setShowEditModal(false); setSelectedItem(null) }
  }

  // ===== RENDER =====
  if (loading) return <LoadingState icon="mdi:knife" message="Memuat data konfigurasi pisau..." />


  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:knife" className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Konfigurasi Pisau Pond</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola ukuran minimal pisau pond untuk shipping box</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">
            Refresh Data
          </Button>
          <Button
            onClick={() => { setAddFormData(BASE_ADD_FORM); setShowAddModal(true) }}
            variant="primary"
            size="md"
            icon="mdi:plus"
          >
            Tambah Konfigurasi
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'mdi:cog', label: 'Total Konfigurasi', value: String(stats.totalConfig), sub: `${stats.totalConfig} aktif` },
          { icon: 'mdi:arrow-expand-horizontal', label: 'Rata-rata Panjang', value: `${formatNumber(stats.avgPanjang)} cm`, sub: `Min ${formatNumber(stats.minPanjang)} · Max ${formatNumber(stats.maxPanjang)} cm` },
          { icon: 'mdi:arrow-expand-vertical', label: 'Rata-rata Lebar', value: `${formatNumber(stats.avgLebar)} cm`, sub: `Min ${formatNumber(stats.minLebar)} · Max ${formatNumber(stats.maxLebar)} cm` },
          { icon: 'mdi:arrow-expand-up', label: 'Rata-rata Tinggi', value: `${formatNumber(stats.avgTinggi)} cm`, sub: `Min ${formatNumber(stats.minTinggi)} · Max ${formatNumber(stats.maxTinggi)} cm` },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 truncate">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== MAIN TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Konfigurasi Pisau</h3>
            <p className="text-sm text-gray-400 mt-0.5">Total {stats.totalConfig} konfigurasi pisau pond</p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari config key atau keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {configs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:knife-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data konfigurasi</p>
              <Button variant="primary" size="sm" onClick={() => { setAddFormData(BASE_ADD_FORM); setShowAddModal(true) }} icon="mdi:plus">
                Tambah Konfigurasi
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Config Key', 'Ukuran Minimal', 'Keterangan', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:knife-off" className="w-16 h-16 text-gray-300" />
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
                  filteredConfigs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Config Key */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50">
                            <Icon icon="mdi:cog" className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium font-mono text-slate-800">{item.config_key}</p>
                          </div>
                        </div>
                      </td>

                      {/* Ukuran Minimal */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {DIMENSION_TYPES.map((dim) => (
                            <div key={dim.id} className="flex items-center gap-2">
                              <Icon icon={dim.icon} className="w-3.5 h-3.5" style={{ color: dim.color }} />
                              <span className="text-xs text-gray-500 w-24">{dim.label}:</span>
                              <span className="text-xs font-semibold" style={{ color: dim.color }}>
                                {formatNumber(item[dim.field as keyof PisauConfig] as string)} cm
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={item.keterangan}>
                          {item.keterangan || '-'}
                        </p>

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
                            onClick={() => handleDelete(item.id, item.config_key)}
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
        {filteredConfigs.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filteredConfigs.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{configs.length}</span> konfigurasi
            </p>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseModal}
        title="Detail Konfigurasi Pisau"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
            <Button
              variant="primary"
              onClick={() => selectedItem && handleEditClick(selectedItem)}
              icon="mdi:pencil-outline"
            >
              Edit Konfigurasi
            </Button>
          </>
        }
      >
        {selectedItem && (() => (
          <div className="space-y-4">
            {/* Identity */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50/60">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100">
                <Icon icon="mdi:cog" className="w-7 h-7 text-indigo-500" />
              </div>
              <div>
                <p className="text-base font-semibold font-mono text-slate-800">{selectedItem.config_key}</p>
              </div>
            </div>

            {/* Dimensions */}
            <Card shadow="none" padding="sm" bordered>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5" />
                Ukuran Minimal
              </p>
              <div className="grid grid-cols-3 gap-3">
                {DIMENSION_TYPES.map((dim) => (
                  <div key={dim.id} className="text-center p-2 rounded-lg" style={{ background: `${dim.color}10` }}>
                    <p className="text-xs text-gray-500 mb-1">{dim.label.replace(' Minimal', '')}</p>
                    <p className="text-sm font-bold" style={{ color: dim.color }}>
                      {formatNumber(selectedItem[dim.field as keyof PisauConfig] as string)} cm
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" />
                {formatSize(selectedItem.min_panjang_cm, selectedItem.min_lebar_cm, selectedItem.min_tinggi_cm)}
              </p>
            </Card>

            {/* Keterangan */}
            <Card shadow="none" padding="sm" bordered>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:format-text" className="w-3.5 h-3.5" />
                Keterangan
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedItem.keterangan || '-'}
              </p>
            </Card>

            
          </div>
        ))()}
      </Modal>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="Tambah Konfigurasi Pisau Baru"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Info box */}
          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information-outline" className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-800">Konfigurasi Baru</p>
              <p className="text-xs text-indigo-600 mt-1">Config key harus unik. Gunakan format snake_case.</p>
            </div>
          </div>

          <Input
            label="Config Key"
            value={addFormData.config_key}
            onChange={(e) => setAddFormData({ ...addFormData, config_key: e.target.value })}
            placeholder="Contoh: shipping_box_min_size"
            helperText="Gunakan format snake_case (contoh: shipping_box_min_size)"
            required
          />

          {/* Dimensions */}
          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              Ukuran Minimal (cm)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIMENSION_TYPES.map((dim) => (
                <Input
                  key={dim.id}
                  label={dim.label}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={addFormData[dim.field as keyof typeof addFormData]}
                  onChange={(e) => setAddFormData({ ...addFormData, [dim.field]: e.target.value })}
                  placeholder="0.00"
                  required
                  leftIcon={dim.icon}
                />
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:text" className="w-3.5 h-3.5 text-amber-600" />
              </div>
              Keterangan
            </h4>
            <textarea
              value={addFormData.keterangan}
              onChange={(e) => setAddFormData({ ...addFormData, keterangan: e.target.value })}
              rows={3}
              placeholder="Masukkan keterangan atau aturan penggunaan konfigurasi ini..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none"
              required
            />
          </div>
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        title={`Edit Konfigurasi — ${selectedItem?.config_key}`}
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            <Input
              label="Config Key"
              value={selectedItem.config_key}
              onChange={(e) => setSelectedItem({ ...selectedItem, config_key: e.target.value })}
              helperText="Gunakan format snake_case"
              required
              disabled={isPosting}
            />

            {/* Dimensions */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                Ukuran Minimal (cm)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DIMENSION_TYPES.map((dim) => (
                  <Input
                    key={dim.id}
                    label={dim.label}
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={selectedItem[dim.field as keyof PisauConfig] as string}
                    onChange={(e) => setSelectedItem({ ...selectedItem, [dim.field]: e.target.value })}
                    required
                    disabled={isPosting}
                    leftIcon={dim.icon}
                  />
                ))}
              </div>
            </div>

            {/* Keterangan */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:text" className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Keterangan
              </h4>
              <textarea
                value={selectedItem.keterangan || ''}
                onChange={(e) => setSelectedItem({ ...selectedItem, keterangan: e.target.value })}
                rows={3}
                placeholder="Masukkan keterangan atau aturan penggunaan..."
                disabled={isPosting}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none disabled:opacity-60"
                required
              />
            </div>

            
          </div>
        )}
      </Modal>
    </div>
  )
}