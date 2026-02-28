'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '../../../lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ===== TYPE DEFINITIONS =====
interface IndexLainnya {
  id: string
  config_key: string
  qty_min: string | null
  qty_max: string | null
  value: string | null
  keterangan: string | null
}

interface ConfigKeyGroup {
  config_key: string
  items: IndexLainnya[]
}

interface Stats {
  totalItems: number
  totalConfigKeys: number
  withQuantityRange: number
  withValue: number
}

interface AddFormData {
  config_key: string
  qty_min: string
  qty_max: string
  value: string
  keterangan: string
}

interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

// ===== CONSTANTS =====
const BASE_ADD_FORM: AddFormData = {
  config_key: '',
  qty_min: '',
  qty_max: '',
  value: '',
  keterangan: ''
}

const ACCENT_COLORS = [
  { bg: '#3b82f6', text: '#1d4ed8' },
  { bg: '#10b981', text: '#065f46' },
  { bg: '#8b5cf6', text: '#5b21b6' },
  { bg: '#f59e0b', text: '#92400e' },
  { bg: '#ef4444', text: '#991b1b' },
  { bg: '#06b6d4', text: '#0e7490' },
  { bg: '#f97316', text: '#9a3412' },
  { bg: '#ec4899', text: '#9d174d' },
]

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

// ===== UTILITIES =====
const isPercentage = (value: string | null): boolean => {
  if (!value) return false
  const num = parseFloat(value)
  return !isNaN(num) && num > 0 && num < 1
}

const formatValue = (value: string | null): string => {
  if (!value || value === 'null') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  if (isPercentage(value)) return `${(num * 100).toFixed(0)}%`
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(num)
}

const formatRawValue = (value: string | null): string => {
  if (!value || value === 'null') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return num % 1 === 0 ? num.toLocaleString('id-ID') : parseFloat(value).toFixed(4)
}

const formatQuantityRange = (min: string | null, max: string | null): string => {
  if (min === null && max === null) return 'Semua qty'
  if (min !== null && max === null) return `≥ ${parseInt(min).toLocaleString()} pcs`
  if (min !== null && max !== null) return `${parseInt(min).toLocaleString()} – ${parseInt(max).toLocaleString()} pcs`
  if (min === null && max !== null) return `≤ ${parseInt(max!).toLocaleString()} pcs`
  return '-'
}

const formatConfigKeyLabel = (key: string): string =>
  key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const getAccent = (key: string, allKeys: string[]) =>
  ACCENT_COLORS[allKeys.indexOf(key) % ACCENT_COLORS.length] || ACCENT_COLORS[0]

const getValueIcon = (value: string | null): string =>
  isPercentage(value) ? 'mdi:percent' : 'mdi:currency-usd'

// ===== CUSTOM HOOK =====
const useIndexLainnya = () => {
  const [indexData, setIndexData] = useState<IndexLainnya[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIndexLainnya = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<ApiResponse<IndexLainnya[]>>('/Admin/Other/indexLainnya', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setIndexData(response.data.data)
      } else {
        setIndexData([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      let msg = 'Tidak bisa connect ke server'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        msg = e.response?.data?.message || msg
      }
      setError(msg)
      setIndexData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIndexLainnya() }, [fetchIndexLainnya])
  return { indexData, loading, error, refetch: fetchIndexLainnya }
}

// ===== MAIN COMPONENT =====
export default function IndexLainnyaPage() {
  const { indexData, loading, error, refetch } = useIndexLainnya()

  const [isPosting, setIsPosting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [addFormData, setAddFormData] = useState<AddFormData>({ ...BASE_ADD_FORM })
  const [editingItem, setEditingItem] = useState<IndexLainnya | null>(null)
  const [selectedItem, setSelectedItem] = useState<IndexLainnya | null>(null)
  const [selectedConfigKey, setSelectedConfigKey] = useState<string>('all')

  // ===== DERIVED STATE =====
  const allConfigKeys = useMemo(() =>
    Array.from(new Set(indexData.map(i => i.config_key))).sort()
  , [indexData])

  const configKeyGroups = useMemo((): ConfigKeyGroup[] => {
    const groups: Record<string, ConfigKeyGroup> = {}
    indexData.forEach(item => {
      if (!groups[item.config_key]) groups[item.config_key] = { config_key: item.config_key, items: [] }
      groups[item.config_key].items.push(item)
    })
    return Object.values(groups).sort((a, b) => a.config_key.localeCompare(b.config_key))
  }, [indexData])

  const filteredData = useMemo(() =>
    selectedConfigKey === 'all' ? indexData : indexData.filter(i => i.config_key === selectedConfigKey)
  , [indexData, selectedConfigKey])

  const stats = useMemo((): Stats => ({
    totalItems: indexData.length,
    totalConfigKeys: allConfigKeys.length,
    withQuantityRange: indexData.filter(i => i.qty_min !== null || i.qty_max !== null).length,
    withValue: indexData.filter(i => i.value && i.value !== 'null').length
  }), [indexData, allConfigKeys])

  // ===== HELPERS =====
  const getErrMsg = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object' && 'response' in err)
      return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    return fallback
  }

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

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    if (!addFormData.config_key.trim()) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Config Key harus diisi' }); return }
    if (!addFormData.value.trim()) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Value harus diisi' }); return }
    try {
      setIsPosting(true)
      const response = await axios.post<ApiResponse>('/Admin/Other/indexLainnya', {
        config_key: addFormData.config_key.trim(),
        value: addFormData.value.trim(),
        qty_min: addFormData.qty_min || null,
        qty_max: addFormData.qty_max || null,
        keterangan: addFormData.keterangan || null
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } })

      if (response.data?.status === 200 || response.data?.status === 201) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
        setShowAddModal(false)
        setAddFormData({ ...BASE_ADD_FORM })
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: response.data?.message || 'Gagal menambahkan data' })
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Terjadi kesalahan saat menyimpan data') })
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    if (!editingItem.value?.trim()) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Value tidak boleh kosong' }); return }
    try {
      setIsPosting(true)
      const response = await axios.put<ApiResponse>(`/Admin/Other/indexLainnya/${editingItem.id}`, {
        config_key: editingItem.config_key,
        qty_min: editingItem.qty_min || null,
        qty_max: editingItem.qty_max || null,
        value: editingItem.value ?? '',
        keterangan: editingItem.keterangan || null
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } })

      if (response.data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui!', timer: 1500, showConfirmButton: false })
        await refetch()
        setShowEditModal(false)
        setEditingItem(null)
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: response.data?.message || 'Gagal mengupdate data' })
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Terjadi kesalahan saat mengupdate data') })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = useCallback(async (id: string, label: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus "${label}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
    })
    if (result.isConfirmed) {
      try {
        const response = await axios.delete<ApiResponse>(`/Admin/Other/indexLainnya/${id}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        if (response.data?.status === 200) {
          await Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Data berhasil dihapus!', timer: 1500, showConfirmButton: false })
          await refetch()
        } else {
          Swal.fire({ icon: 'error', title: 'Gagal!', text: response.data?.message || 'Gagal menghapus data' })
        }
      } catch (err: unknown) {
        Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Terjadi kesalahan saat menghapus data') })
      }
    }
  }, [refetch])

  // ===== UI HANDLERS =====
  const handleAddClick = useCallback(() => { setAddFormData({ ...BASE_ADD_FORM }); setShowAddModal(true) }, [])
  const handleEditClick = useCallback((item: IndexLainnya) => { setEditingItem({ ...item }); setShowEditModal(true) }, [])
  const handleDetailClick = useCallback((item: IndexLainnya) => { setSelectedItem(item); setShowDetailModal(true) }, [])
  const handleCloseAddModal = () => { if (!isPosting) { setShowAddModal(false); setAddFormData({ ...BASE_ADD_FORM }) } }
  const handleCloseEditModal = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null) } }
  const handleCloseDetailModal = () => { setShowDetailModal(false); setSelectedItem(null) }

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat Index Lainnya..." icon="mdi:database-settings" />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const TABLE_HEADERS_BASE = ['Keterangan', 'Range Qty', 'Raw Value', 'Formatted', 'Aksi']

  const renderRows = (items: IndexLainnya[], withConfigKey = false) =>
    items.map((item) => {
      const accent = getAccent(item.config_key, allConfigKeys)
      return (
        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
          {withConfigKey && (
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent.bg}15` }}>
                  <Icon icon={getValueIcon(item.value)} className="w-3.5 h-3.5" style={{ color: accent.bg }} />
                </div>
                <span className="text-xs font-mono font-medium" style={{ color: accent.text }}>
                  {item.config_key}
                </span>
              </div>
            </td>
          )}
          <td className="px-6 py-4">
            <p className="text-sm text-gray-700 max-w-xs">{item.keterangan || '-'}</p>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge color={item.qty_max === null ? '#10b981' : '#3b82f6'}>
              {formatQuantityRange(item.qty_min, item.qty_max)}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {formatRawValue(item.value)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm font-bold" style={{ color: accent.bg }}>
              {formatValue(item.value)}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-1">
              <button onClick={() => handleDetailClick(item)} title="Detail"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Icon icon="mdi:eye-outline" className="w-5 h-5" />
              </button>
              <button onClick={() => handleEditClick(item)} title="Edit"
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(item.id, item.keterangan || item.config_key)} title="Hapus"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Icon icon="mdi:delete-outline" className="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
      )
    })

  const TableHead = ({ withConfigKey }: { withConfigKey: boolean }) => (
    <thead className="bg-gray-50">
      <tr>
        {[...(withConfigKey ? ['Config Key'] : []), ...TABLE_HEADERS_BASE].map(h => (
          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
        ))}
      </tr>
    </thead>
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:database-settings" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Index Lainnya</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola data index, margin, dan biaya produksi</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">
            Refresh Data
          </Button>
          <Button onClick={handleAddClick} variant="primary" size="md" icon="mdi:plus">
            Tambah Data Baru
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'mdi:database', label: 'Total Data', value: String(stats.totalItems), sub: `Dalam ${stats.totalConfigKeys} config key` },
          { icon: 'mdi:key-variant', label: 'Config Keys', value: String(stats.totalConfigKeys), sub: 'Tipe konfigurasi unik' },
          { icon: 'mdi:package-variant', label: 'Dengan Qty Range', value: String(stats.withQuantityRange), sub: `dari ${stats.totalItems} total data` },
          { icon: 'mdi:check-circle', label: 'Dengan Value', value: String(stats.withValue), sub: 'Memiliki nilai konfigurasi' },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== FILTER TABS ===== */}
      <Card shadow="sm" padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Icon icon="mdi:filter-outline" className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedConfigKey('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedConfigKey === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({indexData.length})
            </button>
            {configKeyGroups.map(group => {
              const accent = getAccent(group.config_key, allConfigKeys)
              const isActive = selectedConfigKey === group.config_key
              return (
                <button key={group.config_key}
                  onClick={() => setSelectedConfigKey(group.config_key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={isActive ? { background: accent.bg, color: '#fff' } : { background: `${accent.bg}12`, color: accent.text }}>
                  {formatConfigKeyLabel(group.config_key)} ({group.items.length})
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* ===== MAIN CONTENT ===== */}
      {indexData.length === 0 ? (
        <Card shadow="md" padding="none">
          <div className="flex flex-col items-center gap-3 py-16">
            <Icon icon="mdi:database-off" className="w-16 h-16 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg">Belum ada data</p>
            <Button variant="primary" size="sm" onClick={handleAddClick} icon="mdi:plus">Tambah Data Baru</Button>
          </div>
        </Card>
      ) : selectedConfigKey === 'all' ? (
        // Grouped by config_key
        <div className="space-y-4">
          {configKeyGroups.map(group => {
            const accent = getAccent(group.config_key, allConfigKeys)
            return (
              <Card key={group.config_key} shadow="md" padding="none">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                  style={{ background: `${accent.bg}08` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accent.bg}18` }}>
                      <Icon icon={getValueIcon(group.items[0]?.value)} className="w-5 h-5" style={{ color: accent.bg }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{formatConfigKeyLabel(group.config_key)}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: accent.text }}>
                        {group.config_key} · {group.items.length} item
                      </p>
                    </div>
                  </div>
                  <Badge color={accent.bg}>{group.items.length} item</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <TableHead withConfigKey={false} />
                    <tbody className="bg-white divide-y divide-gray-100">
                      {renderRows(group.items, false)}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        // Single filtered view
        <Card shadow="md" padding="none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">{formatConfigKeyLabel(selectedConfigKey)}</h3>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{selectedConfigKey} · {filteredData.length} item</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedConfigKey('all')} icon="mdi:arrow-left">
              Lihat Semua
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <TableHead withConfigKey={false} />
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Icon icon="mdi:database-off" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Tidak ada data untuk filter ini</p>
                    </td>
                  </tr>
                ) : renderRows(filteredData, false)}
              </tbody>
            </table>
          </div>
          {filteredData.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                Menampilkan <span className="font-medium text-slate-700">{filteredData.length}</span> item
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ===== ADD MODAL ===== */}
      <Modal isOpen={showAddModal} onClose={handleCloseAddModal} title="Tambah Data Index Lainnya" size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Data Baru</p>
              <p className="text-xs text-blue-600 mt-1"><strong>Config Key</strong> dan <strong>Value</strong> wajib diisi.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Config Key <span className="text-red-500">*</span>
            </label>
            <input
              list="config-key-suggestions"
              value={addFormData.config_key}
              onChange={e => setAddFormData(prev => ({ ...prev, config_key: e.target.value }))}
              placeholder="Contoh: margin, biaya_produksi"
              disabled={isPosting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <datalist id="config-key-suggestions">
              {allConfigKeys.map(key => <option key={key} value={key} />)}
            </datalist>
            <p className="text-xs text-gray-400 mt-1">Pilih yang sudah ada atau ketik baru (format snake_case)</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:package-variant" className="w-3.5 h-3.5 text-blue-600" />
              </div>
              Range Quantity (opsional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Qty Min" type="number"
                value={addFormData.qty_min}
                onChange={e => setAddFormData(prev => ({ ...prev, qty_min: e.target.value }))}
                placeholder="0" helperText="Kosongkan = tidak ada batas bawah" disabled={isPosting} />
              <Input label="Qty Max" type="number"
                value={addFormData.qty_max}
                onChange={e => setAddFormData(prev => ({ ...prev, qty_max: e.target.value }))}
                placeholder="kosongkan = ∞" helperText="Kosongkan = tidak ada batas atas" disabled={isPosting} />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:cash" className="w-3.5 h-3.5 text-amber-600" />
              </div>
              Nilai & Keterangan
            </h4>
            <div className="space-y-3">
              <Input label="Value *" type="number" step="0.0001"
                value={addFormData.value}
                onChange={e => setAddFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Contoh: 500.0000 atau 0.1000"
                helperText="Gunakan desimal untuk persentase (0.1 = 10%)"
                required disabled={isPosting} />
              <Input label="Keterangan"
                value={addFormData.keterangan}
                onChange={e => setAddFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Contoh: Margin >= 1000 pcs (10%)"
                helperText="Deskripsi singkat konfigurasi ini"
                disabled={isPosting} />
            </div>
          </div>
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal}
        title={`Edit — ${editingItem?.config_key}`} size="lg" closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {editingItem && (() => {
          const accent = getAccent(editingItem.config_key, allConfigKeys)
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-lg border"
                style={{ background: `${accent.bg}08`, borderColor: `${accent.bg}30` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent.bg}18` }}>
                  <Icon icon="mdi:pencil-outline" className="w-5 h-5" style={{ color: accent.bg }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Mode Edit</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-mono" style={{ color: accent.text }}>{editingItem.config_key}</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:package-variant" className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  Range Quantity
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Qty Min" type="number"
                    value={editingItem.qty_min || ''}
                    onChange={e => setEditingItem({ ...editingItem, qty_min: e.target.value || null })}
                    placeholder="0" disabled={isPosting} />
                  <Input label="Qty Max" type="number"
                    value={editingItem.qty_max || ''}
                    onChange={e => setEditingItem({ ...editingItem, qty_max: e.target.value || null })}
                    placeholder="kosongkan = ∞" disabled={isPosting} />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:cash" className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  Nilai & Keterangan
                </h4>
                <div className="space-y-3">
                  <Input label="Value *" type="number" step="0.0001"
                    value={editingItem.value || ''}
                    onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                    placeholder="0.0000" required disabled={isPosting}
                    helperText={editingItem.value ? `Preview: ${formatValue(editingItem.value)}` : undefined} />
                  <Input label="Keterangan"
                    value={editingItem.keterangan || ''}
                    onChange={e => setEditingItem({ ...editingItem, keterangan: e.target.value })}
                    placeholder="Deskripsi konfigurasi" disabled={isPosting} />
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== DETAIL MODAL ===== */}
      <Modal isOpen={showDetailModal} onClose={handleCloseDetailModal} title="Detail Data" size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseDetailModal}>Tutup</Button>
            <Button variant="primary" icon="mdi:pencil-outline"
              onClick={() => { if (selectedItem) { handleCloseDetailModal(); handleEditClick(selectedItem) } }}>
              Edit Data
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const accent = getAccent(selectedItem.config_key, allConfigKeys)
          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${accent.bg}0d` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent.bg}20` }}>
                  <Icon icon={getValueIcon(selectedItem.value)} className="w-7 h-7" style={{ color: accent.bg }} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{formatConfigKeyLabel(selectedItem.config_key)}</p>
                  <p className="text-xs font-mono mt-1" style={{ color: accent.text }}>{selectedItem.config_key}</p>
                </div>
              </div>

              {/* Value */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:cash-multiple" className="w-3.5 h-3.5" /> Nilai
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Raw Value</p>
                    <p className="font-mono font-bold text-slate-700 text-sm">{formatRawValue(selectedItem.value)}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: `${accent.bg}10` }}>
                    <p className="text-xs mb-1" style={{ color: accent.text }}>Formatted</p>
                    <p className="font-bold text-lg" style={{ color: accent.bg }}>{formatValue(selectedItem.value)}</p>
                  </div>
                </div>
              </Card>

              {/* Range Qty */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" /> Range Quantity
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <p className="text-xs text-green-600 mb-1">Minimum</p>
                    <p className="font-bold text-green-800 text-sm">
                      {selectedItem.qty_min !== null ? `${parseInt(selectedItem.qty_min!).toLocaleString()} pcs` : '0 pcs'}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 mb-1">Maximum</p>
                    <p className="font-bold text-blue-800 text-sm">
                      {selectedItem.qty_max !== null ? `${parseInt(selectedItem.qty_max!).toLocaleString()} pcs` : '∞ (tanpa batas)'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center font-medium">
                  {formatQuantityRange(selectedItem.qty_min, selectedItem.qty_max)}
                </p>
              </Card>

              {/* Keterangan */}
              {selectedItem.keterangan && (
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                    <Icon icon="mdi:format-text" className="w-3.5 h-3.5" /> Keterangan
                  </p>
                  <p className="text-sm text-slate-700">{selectedItem.keterangan}</p>
                </Card>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}