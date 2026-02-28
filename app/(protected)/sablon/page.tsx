// app/(protected)/sablon/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import TextArea from '@/components/UI/TextArea'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import EmptyState from '@/components/UI/EmptyState'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import NumberFormat from '@/components/UI/NumberFormat'

// ===== TYPE DEFINITIONS =====
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
  withoutMinimumQty: number
  avgPriceGT500: number
  avgPriceGT100: number
}

// ===== API TYPES =====
interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}

// ===== CONSTANTS =====
const BASE_ADD_FORM = {
  code: '',
  label: '',
  harga_jual_gt500: '0',
  harga_jual_gt100: '0',
  qty_minimum: '0'
}

// ===== UTILITIES =====
const generateCode = (existingCodes: string[]): string => {
  const numericCodes = existingCodes.filter(code => /^\d+$/.test(code)).map(Number)
  if (numericCodes.length) {
    const nextCode = Math.max(...numericCodes) + 1
    return nextCode.toString()
  }
  return Date.now().toString().slice(-4)
}

const formatRupiah = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

const badgeClasses = {
  qty: (qty: string): string => {
    const num = parseInt(qty)
    if (num === 0) return 'bg-green-100 text-green-800 border border-green-200'
    if (num <= 100) return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    return 'bg-orange-100 text-orange-800 border border-orange-200'
  },
  price: (price: string): string => {
    const num = parseFloat(price)
    if (num === 0) return 'bg-gray-100 text-gray-800 border border-gray-200'
    if (num <= 500) return 'bg-blue-100 text-blue-800 border border-blue-200'
    return 'bg-purple-100 text-purple-800 border border-purple-200'
  }
}

// ===== CUSTOM HOOKS =====
const useSablon = () => {
  const [sablon, setSablon] = useState<Sablon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSablon = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await axios.get<ApiResponse<Sablon[]>>('/Admin/Sablon/Sablon', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      if (data?.status === 200 && Array.isArray(data.data)) {
        setSablon(data.data)
      } else {
        setSablon([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      console.error('Error fetching sablon:', err)
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      setError(msg || 'Tidak bisa connect ke server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSablon()
  }, [fetchSablon])

  return { sablon, loading, error, refetch: fetchSablon }
}

// ===== MAIN COMPONENT =====
export default function SablonPage() {
  const { sablon, loading, error, refetch } = useSablon()

  const [isPosting, setIsPosting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [addFormData, setAddFormData] = useState(BASE_ADD_FORM)
  const [editingItem, setEditingItem] = useState<Sablon | null>(null)

  const stats = useMemo((): Stats => {
    const pricesGT500 = sablon.map(s => parseFloat(s.harga_jual_gt500))
    const pricesGT100 = sablon.map(s => parseFloat(s.harga_jual_gt100))
    
    return {
      totalSablon: sablon.length,
      withMinimumQty: sablon.filter(s => parseInt(s.qty_minimum) > 0).length,
      withoutMinimumQty: sablon.filter(s => parseInt(s.qty_minimum) === 0).length,
      avgPriceGT500: pricesGT500.length ? pricesGT500.reduce((a, b) => a + b, 0) / pricesGT500.length : 0,
      avgPriceGT100: pricesGT100.length ? pricesGT100.reduce((a, b) => a + b, 0) / pricesGT100.length : 0
    }
  }, [sablon])

  // ===== API HANDLERS =====
  const getErrMsg = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    }
    return fallback
  }

  const handleAdd = async () => {
    if (!addFormData.label.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Label sablon harus diisi' })
      return
    }

    try {
      setIsPosting(true)
      const { data } = await axios.post<ApiResponse>('/Admin/Sablon/Sablon', {
        code: addFormData.code.trim(),
        label: addFormData.label.trim(),
        harga_jual_gt500: addFormData.harga_jual_gt500,
        harga_jual_gt100: addFormData.harga_jual_gt100,
        qty_minimum: addFormData.qty_minimum
      })

      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Sablon berhasil ditambahkan!', timer: 1500 })
        setShowAddModal(false)
        setAddFormData(BASE_ADD_FORM)
        await refetch()
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan data') })
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    if (!editingItem.label.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Label sablon harus diisi' })
      return
    }

    try {
      setIsPosting(true)
      const { data } = await axios.put<ApiResponse>(`/Admin/Sablon/Sablon/${editingItem.id_st}`, {
        code: editingItem.code.trim(),
        label: editingItem.label.trim(),
        harga_jual_gt500: editingItem.harga_jual_gt500,
        harga_jual_gt100: editingItem.harga_jual_gt100,
        qty_minimum: editingItem.qty_minimum
      })

      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui!', timer: 1500 })
        await refetch()
        setShowEditModal(false)
        setEditingItem(null)
      }
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal mengupdate data') })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string, label: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus sablon "${label}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!'
    })

    if (result.isConfirmed) {
      try {
        const { data } = await axios.delete<ApiResponse>(`/Admin/Sablon/Sablon/${id}`)
        if (data?.status === 200) {
          await Swal.fire({ icon: 'success', title: 'Dihapus!', text: `"${label}" berhasil dihapus!`, timer: 1500 })
          await refetch()
        }
      } catch (err: unknown) {
        Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menghapus data') })
      }
    }
  }

  const handleEditClick = (item: Sablon) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  // ===== RENDER =====
  if (loading) return <LoadingState icon="mdi:tshirt-crew" message="Memuat data sablon..." />
  if (error) return <ErrorState title="Error Loading Data" message={error} icon="mdi:alert-circle" />

  const PriceInput = ({ 
    label, 
    value, 
    onChange, 
    disabled 
  }: { 
    label: string
    value: string
    onChange: (value: string) => void
    disabled?: boolean
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-12"
          min="0"
          step="500"
          disabled={disabled}
          placeholder="0"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon icon="mdi:tshirt-crew" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Manajemen Sablon
            </h1>
            <p className="text-gray-600 mt-1">Kelola harga dan ketentuan sablon berdasarkan quantity</p>
          </div>
        </div>

        <Button 
          onClick={() => {
            setAddFormData({ 
              ...BASE_ADD_FORM, 
              code: generateCode(sablon.map(s => s.code).filter(c => c !== 'none')) 
            })
            setShowAddModal(true)
          }} 
          variant="primary" 
          className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600" 
          icon="mdi:plus"
        >
          Tambah Sablon Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: 'mdi:tshirt-crew',
            color: 'purple',
            label: 'Total Sablon',
            value: stats.totalSablon,
            children: (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600 flex items-center gap-1">
                  <Icon icon="mdi:check-circle" className="w-3 h-3" />
                  {stats.totalSablon - stats.withoutMinimumQty} Dengan Min. Qty
                </span>
              </div>
            )
          },
          {
            icon: 'mdi:package-variant',
            color: 'blue',
            label: 'Tanpa Minimum Qty',
            value: stats.withoutMinimumQty,
            children: (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full" 
                  style={{ width: `${(stats.withoutMinimumQty / stats.totalSablon) * 100 || 0}%` }} 
                />
              </div>
            )
          },
          {
            icon: 'mdi:currency-idr',
            color: 'green',
            label: 'Rata-rata Harga GT 500+',
            value: formatRupiah(stats.avgPriceGT500),
            children: (
              <p className="text-xs text-gray-500 mt-1">
                Tertinggi: {formatRupiah(Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt500))))}
              </p>
            )
          },
          {
            icon: 'mdi:chart-line',
            color: 'orange',
            label: 'Rata-rata Harga GT 100',
            value: formatRupiah(stats.avgPriceGT100),
            children: (
              <p className="text-xs text-gray-500 mt-1">
                Tertinggi: {formatRupiah(Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt100))))}
              </p>
            )
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

      {/* Main Table */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-purple-600" />
              Daftar Sablon
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.totalSablon} jenis sablon ({stats.withMinimumQty} dengan minimum quantity)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="border-gray-300" icon="mdi:refresh">
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          {sablon.length === 0 ? (
            <EmptyState 
              title="Belum ada data sablon" 
              message="Klik tombol 'Tambah Sablon Baru' untuk memulai" 
              icon="mdi:tshirt-crew" 
              actionLabel="Tambah Sablon Baru" 
              onAction={() => {
                setAddFormData({ ...BASE_ADD_FORM, code: generateCode(sablon.map(s => s.code)) })
                setShowAddModal(true)
              }} 
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Kode', 'Label Sablon', 'Min. Quantity', 'Harga GT 500+', 'Harga GT 100', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sablon.map(item => (
                  <tr key={item.id_st} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-3">
                          <Icon icon="mdi:tag" className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-mono font-medium text-purple-600">{item.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.label}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClasses.qty(item.qty_minimum)}`}>
                        {item.qty_minimum === '0' ? 'No Minimum' : `Min. ${item.qty_minimum} pcs`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClasses.price(item.harga_jual_gt500)}`}>
                        {formatRupiah(item.harga_jual_gt500)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClasses.price(item.harga_jual_gt100)}`}>
                        {formatRupiah(item.harga_jual_gt100)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(item)} 
                          className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg" 
                          title="Edit"
                          disabled={item.code === 'none'}
                        >
                          <Icon icon="mdi:pencil" className="w-5 h-5" />
                        </button>
                        {item.code !== 'none' && (
                          <button 
                            onClick={() => handleDelete(item.id_st, item.label)} 
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" 
                            title="Hapus"
                          >
                            <Icon icon="mdi:delete" className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => !isPosting && setShowAddModal(false)} 
        title="➕ Tambah Sablon Baru" 
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting}>
              Simpan Sablon
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:information" className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">Informasi</p>
                <p className="text-xs text-purple-600 mt-1">
                  Kode akan digenerate otomatis. Isi semua field dengan benar.
                </p>
              </div>
            </div>
          </div>

          <Input 
            label="Kode Sablon" 
            value={addFormData.code} 
            disabled 
            helperText="Kode otomatis" 
          />

          <Input 
            label="Label Sablon" 
            value={addFormData.label} 
            onChange={(e) => setAddFormData({ ...addFormData, label: e.target.value })} 
            placeholder="Contoh: Sablon Biasa, Sablon Emas, dll" 
            required 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PriceInput
              label="Harga Jual GT 500+"
              value={addFormData.harga_jual_gt500}
              onChange={(value) => setAddFormData({ ...addFormData, harga_jual_gt500: value })}
            />
            
            <PriceInput
              label="Harga Jual GT 100"
              value={addFormData.harga_jual_gt100}
              onChange={(value) => setAddFormData({ ...addFormData, harga_jual_gt100: value })}
            />
          </div>

          <Input 
            label="Minimum Quantity (pcs)" 
            type="number" 
            value={addFormData.qty_minimum} 
            onChange={(e) => setAddFormData({ ...addFormData, qty_minimum: e.target.value })} 
            min="0"
            step="1"
            helperText="0 berarti tanpa minimum order"
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => !isPosting && setShowEditModal(false)} 
        title="✏️ Edit Sablon" 
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => !isPosting && setShowEditModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleEdit} loading={isPosting} disabled={isPosting}>
              Simpan Perubahan
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:information-outline" className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">Edit Informasi Sablon</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                  label="Kode" 
                  value={editingItem.code} 
                  disabled={editingItem.code === 'none'}
                />
                
                <Input 
                  label="Label Sablon" 
                  value={editingItem.label} 
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })} 
                  required 
                  disabled={isPosting || editingItem.code === 'none'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <PriceInput
                  label="Harga Jual GT 500+"
                  value={editingItem.harga_jual_gt500}
                  onChange={(value) => setEditingItem({ ...editingItem, harga_jual_gt500: value })}
                  disabled={isPosting || editingItem.code === 'none'}
                />
                
                <PriceInput
                  label="Harga Jual GT 100"
                  value={editingItem.harga_jual_gt100}
                  onChange={(value) => setEditingItem({ ...editingItem, harga_jual_gt100: value })}
                  disabled={isPosting || editingItem.code === 'none'}
                />
              </div>

              <div className="mt-4">
                <Input 
                  label="Minimum Quantity (pcs)" 
                  type="number" 
                  value={editingItem.qty_minimum} 
                  onChange={(e) => setEditingItem({ ...editingItem, qty_minimum: e.target.value })} 
                  min="0"
                  step="1"
                  disabled={isPosting || editingItem.code === 'none'}
                />
              </div>

              {editingItem.code === 'none' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 flex items-center gap-2">
                    <Icon icon="mdi:alert" className="w-4 h-4" />
                    Sablon "Tanpa Sablonan" hanya dapat diedit sebagian field
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Icon icon="mdi:information" className="w-4 h-4" />
                Informasi Harga
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• GT 500+ : Harga untuk pembelian diatas 500 pcs</li>
                <li>• GT 100 : Harga untuk pembelian 100-500 pcs</li>
                <li>• Minimum Quantity: Jumlah minimum pemesanan</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}