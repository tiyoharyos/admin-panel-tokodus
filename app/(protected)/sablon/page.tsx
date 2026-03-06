// app/(protected)/sablon/page.tsx
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

// ============ TYPES ============
interface Sablon {
  id_st: string
  code: string
  label: string
  harga_jual_gt500: string
  harga_jual_gt100: string
  qty_minimum: string
}

interface Stats {
  totalSablon: number
  withMinimumQty: number
  avgHargaGT500: number
  avgHargaGT100: number
  totalMinQty: number
}

// ============ API TYPES ============
interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

// ============ CONSTANTS ============
const BASE_ADD_FORM = {
  code: '',
  label: '',
  harga_jual_gt500: '0',
  harga_jual_gt100: '0',
  qty_minimum: '0'
}

// ============ META CONSTANTS ============
const SABLON_META: Record<string, { icon: string; accent: string }> = {
  'none': { icon: 'mdi:close-circle-outline', accent: '#64748b' },
  'biasa': { icon: 'mdi:palette', accent: '#3b82f6' },
  'special': { icon: 'mdi:star', accent: '#f59e0b' },
}
const DEFAULT_META = { icon: 'mdi:sticker', accent: '#64748b' }

// ============ UTILITIES ============
const generateCode = (existingCodes: string[]): string => {
  const baseCode = 'sbl'
  let counter = 1
  let newCode = `${baseCode}${counter.toString().padStart(2, '0')}`

  while (existingCodes.includes(newCode)) {
    counter++
    newCode = `${baseCode}${counter.toString().padStart(2, '0')}`
  }

  return newCode
}

const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

// Sanitize numeric string: remove thousand separators, keep only digits and one dot
const sanitizeNumber = (val: string): string => {
  // Remove all non-numeric chars except dot and minus
  const cleaned = val.replace(/[^\d.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? '0' : String(num)
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || fallback
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

// ============ CUSTOM HOOKS ============
const useSablon = () => {
  const [sablon, setSablon] = useState<Sablon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSablon = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await axios.get('/Admin/Sablon/Sablon')

      if (data?.status === 200 && Array.isArray(data.data)) {
        setSablon(data.data)
      } else {
        setSablon([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      console.error('Error fetching sablon:', err)
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSablon()
  }, [fetchSablon])

  return { sablon, loading, error, refetch: fetchSablon }
}

// ============ MAIN COMPONENT ============
export default function SablonPage() {
  const { sablon, loading, error, refetch } = useSablon()
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [addFormData, setAddFormData] = useState(BASE_ADD_FORM)
  const [editingItem, setEditingItem] = useState<Sablon | null>(null)
  const [selectedItem, setSelectedItem] = useState<Sablon | null>(null)

  // ===== STATS =====
  const stats = useMemo((): Stats => {
    const pricesGT500 = sablon.map(s => parseFloat(s.harga_jual_gt500))
    const pricesGT100 = sablon.map(s => parseFloat(s.harga_jual_gt100))
    const minQty = sablon.map(s => parseInt(s.qty_minimum))

    return {
      totalSablon: sablon.length,
      withMinimumQty: sablon.filter(s => parseInt(s.qty_minimum) > 0).length,
      avgHargaGT500: pricesGT500.length ? pricesGT500.reduce((a, b) => a + b, 0) / pricesGT500.length : 0,
      avgHargaGT100: pricesGT100.length ? pricesGT100.reduce((a, b) => a + b, 0) / pricesGT100.length : 0,
      totalMinQty: minQty.length ? minQty.reduce((a, b) => a + b, 0) : 0
    }
  }, [sablon])

  const filtered = useMemo(() =>
    sablon.filter(s =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    ), [sablon, search])

  // ===== VALIDATION =====
  const validateForm = (data: typeof BASE_ADD_FORM): boolean => {
    if (!data.code.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: 'Kode sablon harus diisi',
        confirmButtonColor: '#3b82f6'
      })
      return false
    }
    if (!data.label.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: 'Label sablon harus diisi',
        confirmButtonColor: '#3b82f6'
      })
      return false
    }
    if (!data.harga_jual_gt500 || parseFloat(sanitizeNumber(data.harga_jual_gt500)) < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: 'Harga jual >500 harus diisi dengan nilai valid',
        confirmButtonColor: '#3b82f6'
      })
      return false
    }
    if (!data.harga_jual_gt100 || parseFloat(sanitizeNumber(data.harga_jual_gt100)) < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: 'Harga jual >100 harus diisi dengan nilai valid',
        confirmButtonColor: '#3b82f6'
      })
      return false
    }
    if (!data.qty_minimum || parseInt(sanitizeNumber(data.qty_minimum)) < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: 'Minimum quantity harus diisi dengan nilai valid',
        confirmButtonColor: '#3b82f6'
      })
      return false
    }
    return true
  }

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    if (!validateForm(addFormData)) return

    try {
      setIsPosting(true)

      // Backend CodeIgniter pakai $this->post() → harus x-www-form-urlencoded
      const params = new URLSearchParams()
      params.append('code', addFormData.code.trim())
      params.append('label', addFormData.label.trim())
      params.append('harga_jual_gt500', sanitizeNumber(addFormData.harga_jual_gt500))
      params.append('harga_jual_gt100', sanitizeNumber(addFormData.harga_jual_gt100))
      params.append('qty_minimum', sanitizeNumber(addFormData.qty_minimum))

      const { data } = await axios.post<ApiResponse>('/Admin/Sablon/SablonAdd', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      if (data?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: data.message || 'Sablon berhasil ditambahkan!',
          timer: 1500,
          showConfirmButton: false
        })
        setShowAddModal(false)
        setAddFormData(BASE_ADD_FORM)
        await refetch()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data?.message || 'Gagal menyimpan data',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (err: unknown) {
      console.error('Error detail:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Gagal menyimpan data'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    if (!validateForm(editingItem)) return

    try {
      setIsPosting(true)

      // Backend CodeIgniter pakai $this->post() → harus x-www-form-urlencoded
      const params = new URLSearchParams()
      params.append('code', editingItem.code.trim())
      params.append('label', editingItem.label.trim())
      params.append('harga_jual_gt500', sanitizeNumber(editingItem.harga_jual_gt500))
      params.append('harga_jual_gt100', sanitizeNumber(editingItem.harga_jual_gt100))
      params.append('qty_minimum', sanitizeNumber(editingItem.qty_minimum))

      const { data } = await axios.put<ApiResponse>(`/Admin/Sablon/SablonEdit/${editingItem.id_st}`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      if (data?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: data.message || 'Sablon berhasil diperbarui!',
          timer: 1500,
          showConfirmButton: false
        })
        await refetch()
        setShowEditModal(false)
        setEditingItem(null)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data?.message || 'Gagal mengupdate data',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (err: unknown) {
      console.error('Error detail:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err, 'Gagal mengupdate data'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string, label: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus "${label}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!'
    })

    if (result.isConfirmed) {
      try {
        await axios.delete<ApiResponse>(`/Admin/Sablon/Sablon/${id}`)
      } catch {
        // tetap lanjut refetch meski error
      } finally {
        // Refetch dulu, cek apakah data benar-benar terhapus dari response terbaru
        await refetch()
        // Cek dari API langsung
        try {
          const { data: freshData } = await axios.get('/Admin/Sablon/Sablon')
          const stillExists = Array.isArray(freshData?.data) && freshData.data.find((s: Sablon) => s.id_st === id)
          if (!stillExists) {
            Swal.fire({
              icon: 'success',
              title: 'Dihapus!',
              text: `"${label}" berhasil dihapus!`,
              timer: 1500,
              showConfirmButton: false
            })
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Gagal menghapus data, silakan coba lagi.',
              confirmButtonColor: '#3b82f6'
            })
          }
        } catch {
          // Kalau refetch gagal, tampilkan sukses saja karena delete sudah jalan
          Swal.fire({
            icon: 'success',
            title: 'Dihapus!',
            text: `"${label}" berhasil dihapus!`,
            timer: 1500,
            showConfirmButton: false
          })
        }
      }
    }
  }

  const handleViewClick = (item: Sablon) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = (item: Sablon) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat data Sablon..." submessage="Harap tunggu sebentar" icon="mdi:palette" />

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          title="Gagal Memuat Data"
          message={error}
          onRetry={refetch}
          icon="mdi:alert-circle-outline"
        />
      </div>
    )
  }

  const maxHargaGT500 = Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt500)), 0)
  const maxHargaGT100 = Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt100)), 0)

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:palette" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manajemen Sablon</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola jenis sablon dan harga berdasarkan quantity</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setAddFormData({ ...BASE_ADD_FORM, code: generateCode(sablon.map(s => s.code)) })
            setShowAddModal(true)
          }}
          variant="primary"
          size="md"
          icon="mdi:plus"
        >
          Tambah Sablon Baru
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: 'mdi:sticker',
            label: 'Total Sablon',
            value: stats.totalSablon,
            sub: 'Jenis sablon tersedia',
          },
          {
            icon: 'mdi:package-variant',
            label: 'Dengan Minimum Qty',
            value: stats.withMinimumQty,
            sub: `${stats.totalSablon - stats.withMinimumQty} tanpa minimum`,
            bar: (stats.withMinimumQty / stats.totalSablon) * 100 || 0,
          },
          {
            icon: 'mdi:currency-usd',
            label: 'Rata-rata Harga >500',
            value: formatCurrency(stats.avgHargaGT500),
            sub: 'Untuk quantity >500 pcs',
            bar: maxHargaGT500 > 0 ? (stats.avgHargaGT500 / maxHargaGT500) * 100 : 0,
          },
          {
            icon: 'mdi:currency-usd',
            label: 'Rata-rata Harga >100',
            value: formatCurrency(stats.avgHargaGT100),
            sub: 'Untuk quantity 100-500 pcs',
            bar: maxHargaGT100 > 0 ? (stats.avgHargaGT100 / maxHargaGT100) * 100 : 0,
          },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{s.value}</p>
            {s.bar !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%` }} />
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
            <h3 className="text-base font-semibold text-slate-800">Daftar Jenis Sablon</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalSablon} jenis sablon ({stats.withMinimumQty} dengan minimum qty)
            </p>
          </div>

          {/* Search */}
          <div className="w-full sm:w-64">
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode atau label..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {sablon.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:sticker-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data sablon</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Kode', 'Label', 'Harga >500', 'Harga 100-500', 'Min. Qty', 'Aksi'].map(h => (
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
                        <Icon icon="mdi:sticker-off" className="w-16 h-16 text-gray-300" />
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
                    const meta = SABLON_META[item.code] || DEFAULT_META

                    return (
                      <tr key={item.id_st} className="hover:bg-slate-50/80 transition-colors">
                        {/* Kode */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}15` }}>
                              <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                            </div>
                            <div>
                              <p className="font-mono text-sm font-medium text-slate-800">{item.code}</p>
                            </div>
                          </div>
                        </td>

                        {/* Label */}
                        <td className="px-6 py-4">
                          <Badge color={meta.accent}>{item.label}</Badge>
                        </td>

                        {/* Harga >500 */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-emerald-600">
                            {formatCurrency(item.harga_jual_gt500)}
                          </p>
                        </td>

                        {/* Harga >100 */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-blue-600">
                            {formatCurrency(item.harga_jual_gt100)}
                          </p>
                        </td>

                        {/* Min Qty */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-medium text-slate-700">
                            {parseInt(item.qty_minimum).toLocaleString()} pcs
                          </span>
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
                              onClick={() => handleDelete(item.id_st, item.label)}
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
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filtered.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{sablon.length}</span> jenis sablon
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="➕ Tambah Sablon Baru"
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
              icon="mdi:check"
            >
              Simpan Sablon
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Kode akan digenerate otomatis. Semua field wajib diisi.
            </p>
          </div>

          <Input
            label="Kode Sablon"
            value={addFormData.code}
            onChange={(e) => setAddFormData({ ...addFormData, code: e.target.value })}
            placeholder="Contoh: biasa, special, none"
            required
            leftIcon="mdi:tag"
            helperText="Kode unik untuk sablon"
            disabled={isPosting}
          />

          <Input
            label="Label Sablon"
            value={addFormData.label}
            onChange={(e) => setAddFormData({ ...addFormData, label: e.target.value })}
            placeholder="Contoh: Sablon Biasa, Sablon Emas"
            required
            leftIcon="mdi:format-title"
            disabled={isPosting}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Harga Jual (Qty >500)"
              type="number"
              step="100"
              min="0"
              value={addFormData.harga_jual_gt500}
              onChange={(e) => setAddFormData({ ...addFormData, harga_jual_gt500: e.target.value })}
              leftIcon="mdi:currency-usd"
              required
              disabled={isPosting}
            />
            <Input
              label="Harga Jual (Qty 100-500)"
              type="number"
              step="100"
              min="0"
              value={addFormData.harga_jual_gt100}
              onChange={(e) => setAddFormData({ ...addFormData, harga_jual_gt100: e.target.value })}
              leftIcon="mdi:currency-usd"
              required
              disabled={isPosting}
            />
          </div>

          <Input
            label="Minimum Quantity"
            type="number"
            min="0"
            step="1"
            value={addFormData.qty_minimum}
            onChange={(e) => setAddFormData({ ...addFormData, qty_minimum: e.target.value })}
            leftIcon="mdi:package-variant"
            helperText="Minimum order untuk harga ini (dalam pcs)"
            required
            disabled={isPosting}
          />
        </div>
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Sablon"
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
              onClick={() => {
                setShowViewModal(false)
                selectedItem && handleEditClick(selectedItem)
              }}
            >
              Edit Sablon
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const meta = SABLON_META[selectedItem.code] || DEFAULT_META
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

              {/* Harga Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1">Harga 500 pcs</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(selectedItem.harga_jual_gt500)}
                  </p>
                </Card>

                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1">Harga 100-500 pcs</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedItem.harga_jual_gt100)}
                  </p>
                </Card>

                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1">Minimum Quantity</p>
                  <p className="text-lg font-bold text-amber-600">
                    {parseInt(selectedItem.qty_minimum).toLocaleString()} pcs
                  </p>
                </Card>
              </div>

              {/* Note */}
              <Card shadow="none" padding="sm" bordered>
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information-outline" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    Harga berlaku untuk quantity sesuai ketentuan. Untuk quantity di bawah minimum,
                    menggunakan harga khusus atau menyesuaikan dengan kebijakan.
                  </p>
                </div>
              </Card>
            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`Edit Sablon — ${editingItem?.label}`}
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
              onClick={handleEdit}
              loading={isPosting}
              disabled={isPosting}
              icon="mdi:check"
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-3 bg-amber-50 border border-amber-100 rounded-lg">
              <Icon icon="mdi:pencil" className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Edit data sablon. Perubahan akan langsung diterapkan pada perhitungan harga.
              </p>
            </div>

            <Input
              label="Kode Sablon"
              value={editingItem.code}
              onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
              leftIcon="mdi:tag"
              required
              disabled={isPosting}
            />

            <Input
              label="Label Sablon"
              value={editingItem.label}
              onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
              leftIcon="mdi:format-title"
              required
              disabled={isPosting}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Harga Jual (Qty >500)"
                type="number"
                step="100"
                min="0"
                value={editingItem.harga_jual_gt500}
                onChange={(e) => setEditingItem({ ...editingItem, harga_jual_gt500: e.target.value })}
                leftIcon="mdi:currency-usd"
                required
                disabled={isPosting}
              />
              <Input
                label="Harga Jual (Qty 100-500)"
                type="number"
                step="100"
                min="0"
                value={editingItem.harga_jual_gt100}
                onChange={(e) => setEditingItem({ ...editingItem, harga_jual_gt100: e.target.value })}
                leftIcon="mdi:currency-usd"
                required
                disabled={isPosting}
              />
            </div>

            <Input
              label="Minimum Quantity"
              type="number"
              min="0"
              step="1"
              value={editingItem.qty_minimum}
              onChange={(e) => setEditingItem({ ...editingItem, qty_minimum: e.target.value })}
              leftIcon="mdi:package-variant"
              helperText="Minimum order untuk harga ini (dalam pcs)"
              required
              disabled={isPosting}
            />

            {/* Preview Update */}
            <Card shadow="none" padding="sm" bordered>
              <p className="text-xs text-gray-500 mb-2">Preview Perubahan</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon icon="mdi:palette" className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{editingItem.label}</p>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-emerald-600">{formatCurrency(editingItem.harga_jual_gt500)} (&gt;500)</span>
                    <span className="text-blue-600">{formatCurrency(editingItem.harga_jual_gt100)} (100-500)</span>
                    <span className="text-amber-600">Min: {editingItem.qty_minimum} pcs</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}