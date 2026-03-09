// app/(protected)/pisau-registry/page.tsx
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
interface PisauRegistry {
  id: string
  box_model_id: string
  panjang_cm: string
  lebar_cm: string
  tinggi_cm: string
  kode_pisau: string
  catatan: string
  status: string
  created_at: string
  updated_at: string | null
  id_bm: string
  code: string
  name: string
  description: string
  status_bm: string
  is_shipping_box: string
  input_mode: string
  is_paperbag: string
}

interface BoxModel {
  id_bm: string
  code: string
  name: string
  description?: string
  status_bm?: string
  is_shipping_box?: string
  input_mode?: string
  is_paperbag?: string
}

interface Stats {
  totalRegistry: number
  avgPanjang: number
  avgLebar: number
  avgTinggi: number
  minPanjang: number
  maxPanjang: number
  minLebar: number
  maxLebar: number
  minTinggi: number
  maxTinggi: number
  shippingBoxCount: number
}

interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}

// ===== CONSTANTS =====
const BASE_ADD_FORM = {
  box_model_id: '',
  panjang_cm: '',
  lebar_cm: '',
  tinggi_cm: '',
  kode_pisau: '',
  catatan: '',
  status: 'active'
}

const DIMENSION_TYPES = [
  { id: 'panjang', label: 'Panjang', field: 'panjang_cm', icon: 'mdi:arrow-expand-horizontal', color: '#3b82f6' },
  { id: 'lebar',   label: 'Lebar',   field: 'lebar_cm',   icon: 'mdi:arrow-expand-vertical',   color: '#10b981' },
  { id: 'tinggi',  label: 'Tinggi',  field: 'tinggi_cm',  icon: 'mdi:arrow-expand-up',          color: '#8b5cf6' }
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
  if (isNaN(num)) return '0,00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

const formatSize = (p: string, l: string, t: string) =>
  `${parseFloat(p).toFixed(1)} × ${parseFloat(l).toFixed(1)} × ${parseFloat(t).toFixed(1)} cm`

const generateKodePisau = (existingCodes: string[]): string => {
  // Find highest PISAU-N number already used
  let max = 0
  existingCodes.forEach(code => {
    const match = code.match(/^PISAU-(\d+)$/i)
    if (match) {
      const n = parseInt(match[1], 10)
      if (n > max) max = n
    }
  })
  return `PISAU-${max + 1}`
}

// ===== BADGE COMPONENT =====
function Badge({ color, bgColor, children }: { color: string; bgColor: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: bgColor, color }}
    >
      {children}
    </span>
  )
}

// ===== CUSTOM HOOKS =====
const usePisauRegistry = () => {
  const [registries, setRegistries] = useState<PisauRegistry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRegistries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse<PisauRegistry[]>>('/Admin/Pisau/PisauRegistry')
      if (Array.isArray(data?.data)) {
        setRegistries(data.data)
      } else if (data?.status === 200) {
        setRegistries([])
      } else {
        setRegistries([])
        setError(data?.message || 'Format response tidak sesuai')
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
      setRegistries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRegistries() }, [fetchRegistries])

  return { registries, loading, error, refetch: fetchRegistries }
}

const useBoxModels = () => {
  const [boxModels, setBoxModels] = useState<BoxModel[]>([])
  const [loadingBoxModels, setLoadingBoxModels] = useState(false)

  const fetchBoxModels = useCallback(async () => {
    try {
      setLoadingBoxModels(true)
      const { data } = await axios.get<ApiResponse<BoxModel[]>>('/Admin/Box/boxModels')
      if (Array.isArray(data?.data)) {
        setBoxModels(data.data)
      } else {
        setBoxModels([])
      }
    } catch {
      setBoxModels([])
    } finally {
      setLoadingBoxModels(false)
    }
  }, [])

  useEffect(() => { fetchBoxModels() }, [fetchBoxModels])

  return { boxModels, loadingBoxModels }
}

const usePisauStats = (registries: PisauRegistry[]) => {
  return useMemo((): Stats => {
    if (registries.length === 0) return {
      totalRegistry: 0, avgPanjang: 0, avgLebar: 0, avgTinggi: 0,
      minPanjang: 0, maxPanjang: 0, minLebar: 0, maxLebar: 0,
      minTinggi: 0, maxTinggi: 0, activeCount: 0, shippingBoxCount: 0
    }
    const p = registries.map(r => parseFloat(r.panjang_cm))
    const l = registries.map(r => parseFloat(r.lebar_cm))
    const t = registries.map(r => parseFloat(r.tinggi_cm))
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    return {
      totalRegistry: registries.length,
      avgPanjang: avg(p), avgLebar: avg(l), avgTinggi: avg(t),
      minPanjang: Math.min(...p), maxPanjang: Math.max(...p),
      minLebar: Math.min(...l), maxLebar: Math.max(...l),
      minTinggi: Math.min(...t), maxTinggi: Math.max(...t),
      shippingBoxCount: registries.filter(r => r.is_shipping_box === '1').length
    }
  }, [registries])
}

// ===== BOX MODEL SELECT COMPONENT =====
function BoxModelSelect({
  value,
  onChange,
  onBoxSelected,
  boxModels,
  loadingBoxModels,
  disabled,
  required
}: {
  value: string
  onChange: (val: string) => void
  onBoxSelected?: (bm: BoxModel | null) => void
  boxModels: BoxModel[]
  loadingBoxModels: boolean
  disabled?: boolean
  required?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    onChange(val)
    if (onBoxSelected) {
      const found = boxModels.find(b => String(b.id_bm) === val) || null
      onBoxSelected(found)
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
        Box Model {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled || loadingBoxModels}
          required={required}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
        >
          <option value="">
            {loadingBoxModels ? 'Memuat...' : 'Pilih box model'}
          </option>
          {Array.isArray(boxModels) && boxModels.map((bm, idx) => (
            <option key={`bm-${String(bm.id_bm)}-${idx}`} value={String(bm.id_bm)}>
              {bm.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
          {loadingBoxModels
            ? <Icon icon="mdi:loading" className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            : <Icon icon="mdi:chevron-down" className="w-3.5 h-3.5 text-gray-400" />
          }
        </div>
      </div>
    </div>
  )
}

// ===== MAIN COMPONENT =====
export default function PisauRegistryPage() {
  const { registries, loading, error, refetch } = usePisauRegistry()
  const { boxModels, loadingBoxModels } = useBoxModels()
  const stats = usePisauStats(registries)

  const [isPosting, setIsPosting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [addFormData, setAddFormData] = useState(BASE_ADD_FORM)
  const [selectedItem, setSelectedItem] = useState<PisauRegistry | null>(null)
  const [search, setSearch] = useState('')

  const filteredRegistries = useMemo(() =>
    registries.filter(item => {
      const matchesSearch = 
        item.kode_pisau.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.catatan && item.catatan.toLowerCase().includes(search.toLowerCase()))
      
      return matchesSearch
    }), [registries, search])

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

  // ===== VALIDATION =====
  const validateDimensions = (data: { box_model_id: string; panjang_cm: string; lebar_cm: string; tinggi_cm: string; kode_pisau: string; catatan: string }) => {
    if (!data.box_model_id) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Box model harus dipilih' })
      return false
    }
    if (!data.kode_pisau.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Kode pisau harus diisi' })
      return false
    }
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

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    if (!validateDimensions(addFormData)) return
    try {
      setIsPosting(true)
      const formData = new URLSearchParams()
      formData.append('box_model_id', String(addFormData.box_model_id).trim())
      formData.append('kode_pisau',   String(addFormData.kode_pisau).trim())
      formData.append('panjang_cm',   String(addFormData.panjang_cm).trim())
      formData.append('lebar_cm',     String(addFormData.lebar_cm).trim())
      formData.append('tinggi_cm',    String(addFormData.tinggi_cm).trim())
      formData.append('catatan',      String(addFormData.catatan).trim())
      formData.append('status',       'active')
      console.debug('[PisauRegistry] POST payload:', Object.fromEntries(formData.entries()))
      const { data } = await axios.post<ApiResponse>('/Admin/Pisau/PisauRegistryAdd', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data pisau berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
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
      formData.append('box_model_id', selectedItem.box_model_id)
      formData.append('kode_pisau', selectedItem.kode_pisau.trim())
      formData.append('panjang_cm', selectedItem.panjang_cm.trim())
      formData.append('lebar_cm', selectedItem.lebar_cm.trim())
      formData.append('tinggi_cm', selectedItem.tinggi_cm.trim())
      formData.append('catatan', selectedItem.catatan?.trim() || '')
      formData.append('status', selectedItem.status)

      const { data } = await axios.put<ApiResponse>(
        `/Admin/Pisau/PisauRegistryEdit/${selectedItem.id}`,
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

  const handleDelete = async (id: string, kodePisau: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus data pisau "${kodePisau}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
    })
    if (result.isConfirmed) {
      try {
        const { data } = await axios.delete<ApiResponse>(`/Admin/Pisau/PisauRegistryDel/${id}`)
        if (data?.status === 200) {
          await Swal.fire({ icon: 'success', title: 'Dihapus!', text: `"${kodePisau}" berhasil dihapus!`, timer: 1500, showConfirmButton: false })
          await refetch()
        } else {
          Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menghapus data' })
        }
      } catch (err: unknown) {
        Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data') })
      }
    }
  }

  const handleViewClick = (item: PisauRegistry) => { setSelectedItem(item); setShowViewModal(true) }
  const handleEditClick = (item: PisauRegistry) => { setSelectedItem(item); setShowViewModal(false); setShowEditModal(true) }
  const handleCloseModal = () => {
    if (!isPosting) { setShowViewModal(false); setShowEditModal(false); setSelectedItem(null) }
  }

  // ===== RENDER =====
  if (loading) return <LoadingState icon="mdi:knife" message="Memuat data registry pisau..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:knife" className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Registry Pisau Pond</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola data pisau pond untuk box model</p>
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
            Tambah Pisau
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card shadow="sm" padding="md" hoverable>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Total Registry</p>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:knife" className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 truncate">{stats.totalRegistry}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {stats.shippingBoxCount > 0 && (
              <Badge color="#3b82f6" bgColor="#dbeafe">
                <Icon icon="mdi:package-variant" className="w-3 h-3 mr-1" />
                {stats.shippingBoxCount} Shipping Box
              </Badge>
            )}
          </div>
        </Card>

        {[
          { icon: 'mdi:arrow-expand-horizontal', label: 'Rata-rata Panjang', value: `${formatNumber(stats.avgPanjang)} cm`, sub: `Min ${formatNumber(stats.minPanjang)} · Max ${formatNumber(stats.maxPanjang)} cm`, color: '#3b82f6' },
          { icon: 'mdi:arrow-expand-vertical', label: 'Rata-rata Lebar', value: `${formatNumber(stats.avgLebar)} cm`, sub: `Min ${formatNumber(stats.minLebar)} · Max ${formatNumber(stats.maxLebar)} cm`, color: '#10b981' },
          { icon: 'mdi:arrow-expand-up', label: 'Rata-rata Tinggi', value: `${formatNumber(stats.avgTinggi)} cm`, sub: `Min ${formatNumber(stats.minTinggi)} · Max ${formatNumber(stats.maxTinggi)} cm`, color: '#8b5cf6' },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.color }} />
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
            <h3 className="text-base font-semibold text-slate-800">Daftar Pisau Pond</h3>
            <p className="text-sm text-gray-400 mt-0.5">Total {stats.totalRegistry} pisau terdaftar</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {registries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:knife-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data pisau</p>
              <Button variant="primary" size="sm" onClick={() => { setAddFormData(BASE_ADD_FORM); setShowAddModal(true) }} icon="mdi:plus">
                Tambah Pisau
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Kode Pisau', 'Box Model', 'Ukuran (P x L x T)', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRegistries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:knife-off" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                        <p className="text-sm text-gray-400">
                          Tidak ditemukan dengan filter yang dipilih
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                          Hapus Filter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRegistries.map((item) => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Kode Pisau */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50">
                              <Icon icon="mdi:knife" className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium font-mono text-slate-800">{item.kode_pisau}</p>
                              {item.is_shipping_box === '1' && (
                                <Badge color="#3b82f6" bgColor="#dbeafe">
                                  Shipping Box
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Box Model */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{item.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{item.code}</p>
                          </div>
                        </td>

                        {/* Ukuran */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            {DIMENSION_TYPES.map((dim) => (
                              <div key={dim.id} className="flex items-center gap-2">
                                <Icon icon={dim.icon} className="w-3.5 h-3.5" style={{ color: dim.color }} />
                                <span className="text-xs text-gray-500 w-16">{dim.label}:</span>
                                <span className="text-xs font-semibold" style={{ color: dim.color }}>
                                  {formatNumber(item[dim.field as keyof PisauRegistry] as string)} cm
                                </span>
                              </div>
                            ))}
                          </div>
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
                              onClick={() => handleDelete(item.id, item.kode_pisau)}
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
        {filteredRegistries.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filteredRegistries.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{registries.length}</span> data
            </p>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseModal}
        title="Detail Pisau Pond"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
            <Button
              variant="primary"
              onClick={() => selectedItem && handleEditClick(selectedItem)}
              icon="mdi:pencil-outline"
            >
              Edit Data
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          return (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50/60">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100">
                  <Icon icon="mdi:knife" className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <p className="text-base font-semibold font-mono text-slate-800">{selectedItem.kode_pisau}</p>
                </div>
              </div>

              {/* Box Model Info */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" />
                  Informasi Box Model
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Kode Box</p>
                    <p className="text-sm font-mono text-slate-700">{selectedItem.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Nama Box</p>
                    <p className="text-sm font-medium text-slate-700">{selectedItem.name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Deskripsi</p>
                    <p className="text-sm text-slate-600">{selectedItem.description || '-'}</p>
                  </div>
                </div>
              </Card>

              {/* Dimensions */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5" />
                  Ukuran
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {DIMENSION_TYPES.map((dim) => (
                    <div key={dim.id} className="text-center p-2 rounded-lg" style={{ background: `${dim.color}10` }}>
                      <p className="text-xs text-gray-500 mb-1">{dim.label}</p>
                      <p className="text-sm font-bold" style={{ color: dim.color }}>
                        {formatNumber(selectedItem[dim.field as keyof PisauRegistry] as string)} cm
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" />
                  {formatSize(selectedItem.panjang_cm, selectedItem.lebar_cm, selectedItem.tinggi_cm)}
                </p>
              </Card>

              {/* Catatan */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:format-text" className="w-3.5 h-3.5" />
                  Catatan
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedItem.catatan || '-'}
                </p>
              </Card>

              {/* Flags */}
              <div className="flex flex-wrap gap-2">
                {selectedItem.is_shipping_box === '1' && (
                  <Badge color="#3b82f6" bgColor="#dbeafe">
                    <Icon icon="mdi:package-variant" className="w-3 h-3 mr-1" />
                    Shipping Box
                  </Badge>
                )}
                {selectedItem.is_paperbag === '1' && (
                  <Badge color="#d97706" bgColor="#fef3c7">
                    <Icon icon="mdi:shopping" className="w-3 h-3 mr-1" />
                    Paper Bag
                  </Badge>
                )}
                <Badge color="#8b5cf6" bgColor="#ede9fe">
                  <Icon icon="mdi:ruler-square" className="w-3 h-3 mr-1" />
                  Input Mode: {selectedItem.input_mode}
                </Badge>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-400 flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                  Dibuat: {formatDate(selectedItem.created_at)}
                </div>
                {selectedItem.updated_at && (
                  <div className="flex items-center gap-1">
                    <Icon icon="mdi:clock-edit-outline" className="w-3 h-3" />
                    Diperbarui: {formatDate(selectedItem.updated_at)}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="Tambah Pisau Baru"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Box Model */}
          <BoxModelSelect
            value={addFormData.box_model_id}
            onChange={(val) => setAddFormData(prev => ({ ...prev, box_model_id: val }))}
            onBoxSelected={(bm) => {
              if (bm) {
                const existingCodes = registries.map(r => r.kode_pisau)
                setAddFormData(prev => ({
                  ...prev,
                  box_model_id: String(bm.id_bm),
                  kode_pisau: generateKodePisau(existingCodes)
                }))
              } else {
                setAddFormData(prev => ({ ...prev, box_model_id: '', kode_pisau: '' }))
              }
            }}
            boxModels={boxModels}
            loadingBoxModels={loadingBoxModels}
            required
          />

          {/* Kode Pisau - readonly, auto generated */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Kode Pisau <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={addFormData.kode_pisau}
              readOnly
              placeholder="Pilih box model untuk generate kode"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-slate-400 font-mono cursor-not-allowed select-none"
            />
          </div>

          {/* Dimensions */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ukuran (cm)</p>
            <div className="grid grid-cols-3 gap-3">
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

          {/* Catatan */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Catatan</label>
            <textarea
              value={addFormData.catatan}
              onChange={(e) => setAddFormData({ ...addFormData, catatan: e.target.value })}
              rows={2}
              placeholder="Keterangan tambahan (opsional)..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        title={`Edit Pisau — ${selectedItem?.kode_pisau}`}
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Box Model */}
            <BoxModelSelect
              value={selectedItem.box_model_id}
              onChange={(val) => setSelectedItem({ ...selectedItem, box_model_id: val })}
              boxModels={boxModels}
              loadingBoxModels={loadingBoxModels}
              disabled={isPosting}
              required
            />

            {/* Kode Pisau - readonly on edit */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kode Pisau</label>
              <input
                type="text"
                value={selectedItem.kode_pisau}
                readOnly
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-slate-400 font-mono cursor-not-allowed select-none"
              />
            </div>

            {/* Dimensions */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ukuran (cm)</p>
              <div className="grid grid-cols-3 gap-3">
                {DIMENSION_TYPES.map((dim) => (
                  <Input
                    key={dim.id}
                    label={dim.label}
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={selectedItem[dim.field as keyof PisauRegistry] as string}
                    onChange={(e) => setSelectedItem({ ...selectedItem, [dim.field]: e.target.value })}
                    required
                    disabled={isPosting}
                    leftIcon={dim.icon}
                  />
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Catatan</label>
              <textarea
                value={selectedItem.catatan || ''}
                onChange={(e) => setSelectedItem({ ...selectedItem, catatan: e.target.value })}
                rows={2}
                placeholder="Keterangan tambahan (opsional)..."
                disabled={isPosting}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}