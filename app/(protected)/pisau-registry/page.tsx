// app/(protected)/pisau-registry/page.tsx
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
import EmptyState from '@/components/UI/EmptyState'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ===== TYPE DEFINITIONS =====
interface PisauRegistry {
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
}

// ===== API TYPES =====
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

const REGISTRY_META: Record<string, { icon: string; color: string; description: string }> = {
  'shipping_box_min_size': { 
    icon: 'mdi:package-variant', 
    color: 'indigo',
    description: 'Ukuran minimal untuk shipping box'
  },
  'default': { 
    icon: 'mdi:knife', 
    color: 'gray',
    description: 'Registry pisau pond'
  }
}

// ===== UTILITIES =====
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch {
    return dateString
  }
}

const formatNumber = (value: string): string => {
  const num = parseFloat(value)
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

const getRegistryMeta = (key: string) => {
  return REGISTRY_META[key] || { 
    ...REGISTRY_META.default, 
    description: key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
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

      if (data?.status === 200 && Array.isArray(data.data)) {
        setRegistries(data.data)
      } else {
        setRegistries([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      console.error('Error fetching pisau registry:', err)
      let errorMessage = 'Tidak bisa connect ke server'
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errResponse = err as { response?: { status?: number; data?: { message?: string } } }
        errorMessage = errResponse.response?.data?.message || errorMessage
      } else if (err && typeof err === 'object' && 'code' in err) {
        const errCode = err as { code?: string }
        if (errCode.code === 'ECONNABORTED') {
          errorMessage = 'Koneksi timeout. Silakan coba lagi.'
        }
      }
      
      setError(errorMessage)
      setRegistries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRegistries()
  }, [fetchRegistries])

  return { registries, loading, error, refetch: fetchRegistries }
}

// ===== MAIN COMPONENT =====
export default function PisauRegistryPage() {
  const { registries, loading, error, refetch } = usePisauRegistry()

  const [isPosting, setIsPosting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [addFormData, setAddFormData] = useState(BASE_ADD_FORM)
  const [selectedItem, setSelectedItem] = useState<PisauRegistry | null>(null)
  const [search, setSearch] = useState('')

  const stats = useMemo((): Stats => {
    if (registries.length === 0) {
      return {
        totalRegistry: 0,
        avgPanjang: 0,
        avgLebar: 0,
        avgTinggi: 0,
        minPanjang: 0,
        maxPanjang: 0,
        minLebar: 0,
        maxLebar: 0,
        minTinggi: 0,
        maxTinggi: 0
      }
    }

    const panjangValues = registries.map(item => parseFloat(item.min_panjang_cm))
    const lebarValues = registries.map(item => parseFloat(item.min_lebar_cm))
    const tinggiValues = registries.map(item => parseFloat(item.min_tinggi_cm))

    return {
      totalRegistry: registries.length,
      avgPanjang: panjangValues.reduce((a, b) => a + b, 0) / registries.length,
      avgLebar: lebarValues.reduce((a, b) => a + b, 0) / registries.length,
      avgTinggi: tinggiValues.reduce((a, b) => a + b, 0) / registries.length,
      minPanjang: Math.min(...panjangValues),
      maxPanjang: Math.max(...panjangValues),
      minLebar: Math.min(...lebarValues),
      maxLebar: Math.max(...lebarValues),
      minTinggi: Math.min(...tinggiValues),
      maxTinggi: Math.max(...tinggiValues)
    }
  }, [registries])

  // Filter data based on search
  const filteredRegistries = useMemo(() => 
    registries.filter(item => 
      item.config_key.toLowerCase().includes(search.toLowerCase()) ||
      item.keterangan.toLowerCase().includes(search.toLowerCase())
    ), [registries, search]
  )

  // ===== API HANDLERS =====
  const getErrMsg = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    }
    return fallback
  }

  const handleViewClick = (item: PisauRegistry) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = (item: PisauRegistry) => {
    setSelectedItem(item)
    setShowViewModal(false)
    setShowEditModal(true)
  }

  const handleCloseModal = () => {
    if (!isPosting) {
      setShowViewModal(false)
      setShowEditModal(false)
      setSelectedItem(null)
    }
  }

  // ===== RENDER =====
  if (loading) return <LoadingState icon="mdi:knife" message="Memuat data registry pisau..." />
  if (error) return <ErrorState title="Error Loading Data" message={error} icon="mdi:alert-circle" onRetry={refetch} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon icon="mdi:knife-military" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Registry Pisau Pond
            </h1>
            <p className="text-gray-600 mt-1">Lihat dan kelola registry ukuran pisau pond untuk shipping box</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refetch} 
            className="border-gray-300" 
            icon="mdi:refresh"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full group-hover:bg-emerald-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:knife" className="w-4 h-4 text-emerald-600" />
              Total Registry
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRegistry}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-500" />
              {stats.totalRegistry} entries
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:arrow-expand-horizontal" className="w-4 h-4 text-blue-600" />
              Rata-rata Panjang
            </p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.avgPanjang.toString())} cm</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: {formatNumber(stats.minPanjang.toString())} cm</span>
              <span>Max: {formatNumber(stats.maxPanjang.toString())} cm</span>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 rounded-bl-full group-hover:bg-teal-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:arrow-expand-vertical" className="w-4 h-4 text-teal-600" />
              Rata-rata Lebar
            </p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.avgLebar.toString())} cm</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: {formatNumber(stats.minLebar.toString())} cm</span>
              <span>Max: {formatNumber(stats.maxLebar.toString())} cm</span>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-50 rounded-bl-full group-hover:bg-cyan-100 transition-all" />
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:arrow-expand-up" className="w-4 h-4 text-cyan-600" />
              Rata-rata Tinggi
            </p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.avgTinggi.toString())} cm</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: {formatNumber(stats.minTinggi.toString())} cm</span>
              <span>Max: {formatNumber(stats.maxTinggi.toString())} cm</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-emerald-600" />
              Daftar Registry Pisau
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.totalRegistry} registry pisau pond
            </p>
          </div>
          
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari config key atau keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {registries.length === 0 ? (
            <EmptyState 
              title="Belum ada data registry" 
              message="Tidak ada data registry pisau yang tersedia" 
              icon="mdi:knife-off" 
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Config Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Ukuran Minimal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Keterangan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12">
                      <EmptyState
                        icon="mdi:knife-off"
                        title="Tidak ada hasil pencarian"
                        message={`Tidak ditemukan registry dengan kata kunci "${search}"`}
                        actionLabel="Clear Pencarian"
                        onAction={() => setSearch('')}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRegistries.map((item) => {
                    const meta = getRegistryMeta(item.config_key)
                    return (
                      <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 bg-${meta.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                              <Icon icon={meta.icon} className={`w-5 h-5 text-${meta.color}-600`} />
                            </div>
                            <div>
                              <span className="font-mono font-medium text-emerald-600">{item.config_key}</span>
                              <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                P: {formatNumber(item.min_panjang_cm)} cm
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                                L: {formatNumber(item.min_lebar_cm)} cm
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800">
                                T: {formatNumber(item.min_tinggi_cm)} cm
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={item.keterangan}>
                            {item.keterangan || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewClick(item)} 
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Icon icon="mdi:eye" className="w-5 h-5" />
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

        {/* Table Footer */}
        {filteredRegistries.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredRegistries.length} dari {registries.length} registry
            </p>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseModal}
        title="🔍 Detail Registry Pisau"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Tutup
            </Button>
          </div>
        }
      >
        {selectedItem && (() => {
          const meta = getRegistryMeta(selectedItem.config_key)
          return (
            <div className="space-y-6">
              {/* Header */}
              <div className={`bg-gradient-to-r from-${meta.color}-50 to-${meta.color}-100/50 p-5 rounded-xl border border-${meta.color}-200`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-${meta.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon icon={meta.icon} className={`w-7 h-7 text-${meta.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedItem.config_key}</h2>
                    <p className="text-sm text-gray-600 mt-1">{meta.description}</p>
                    <p className="text-xs text-gray-400 mt-1">ID: {selectedItem.id}</p>
                  </div>
                </div>
              </div>

              {/* Size Information */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className={`p-4 bg-blue-50/50 border-blue-200`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:arrow-expand-horizontal" className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Panjang Minimal</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatNumber(selectedItem.min_panjang_cm)} cm</p>
                </Card>

                <Card className={`p-4 bg-teal-50/50 border-teal-200`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:arrow-expand-vertical" className="w-4 h-4 text-teal-600" />
                    <p className="text-sm font-medium text-teal-900">Lebar Minimal</p>
                  </div>
                  <p className="text-2xl font-bold text-teal-900">{formatNumber(selectedItem.min_lebar_cm)} cm</p>
                </Card>

                <Card className={`p-4 bg-cyan-50/50 border-cyan-200`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:arrow-expand-up" className="w-4 h-4 text-cyan-600" />
                    <p className="text-sm font-medium text-cyan-900">Tinggi Minimal</p>
                  </div>
                  <p className="text-2xl font-bold text-cyan-900">{formatNumber(selectedItem.min_tinggi_cm)} cm</p>
                </Card>
              </div>

              {/* Description */}
              <Card className="p-5 bg-gray-50/50 border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:format-text" className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Keterangan</h3>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedItem.keterangan || '-'}</p>
              </Card>

              {/* Nilai Field (if exists) */}
              {selectedItem.nilai && (
                <Card className="p-4 bg-amber-50/50 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:tag" className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900">Nilai</p>
                  </div>
                  <p className="text-lg font-semibold text-amber-900">{selectedItem.nilai}</p>
                </Card>
              )}

              {/* Metadata */}
              {selectedItem.updated_at && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                  Terakhir diperbarui: {formatDate(selectedItem.updated_at)}
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}