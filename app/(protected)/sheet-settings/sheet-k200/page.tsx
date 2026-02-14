// app/(protected)/sheet-k200/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ===== TYPE DEFINITIONS =====
interface K200Data {
  id_s_k: number
  panjang: number
  lebar: number
  harga_per_lembar: number
  created_at?: string
  updated_at?: string
}

interface FormData {
  panjang: string
  lebar: string
  harga_per_lembar: string
}

interface Stats {
  totalRecords: number
  totalCombinations: number
  averagePrice: number
}

// ===== CONSTANTS =====
const API_ENDPOINTS = {
  BASE: '/Admin/Sheet/K200',
  ADD: '/Admin/Sheet/K200Add',
  EDIT: '/Admin/Sheet/K200Edit',
  DELETE: (id: number) => `/Admin/Sheet/K200Del/${id}`,
  BY_ID: (id: number) => `/Admin/Sheet/K200Byid/${id}`
} as const

const BASE_FORM: FormData = {
  panjang: '',
  lebar: '',
  harga_per_lembar: ''
}

const VALIDATION_RULES = {
  PANJANG: { min: 1, max: 1000 },
  LEBAR: { min: 1, max: 1000 },
  HARGA: { min: 1, max: 100000000 }
} as const

// ===== UTILITIES =====
const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)

const formatNumber = (num: number): string =>
  new Intl.NumberFormat('id-ID').format(num)

const calculateStats = (data: K200Data[]): Stats => {
  const totalRecords = data.length
  const uniqueCombinations = new Set(
    data.map(item => `${item.panjang}x${item.lebar}`)
  ).size
  const totalPrice = data.reduce((sum, item) => sum + item.harga_per_lembar, 0)
  const averagePrice = totalRecords > 0 ? totalPrice / totalRecords : 0

  return { totalRecords, totalCombinations: uniqueCombinations, averagePrice }
}

const validateForm = (
  formData: FormData, 
  existingData: K200Data[], 
  editingItem: K200Data | null = null
): Record<string, string> => {
  const errors: Record<string, string> = {}
  const { panjang, lebar, harga_per_lembar } = formData

  const p = parseFloat(panjang)
  if (!panjang?.trim()) errors.panjang = 'Panjang tidak boleh kosong'
  else if (isNaN(p) || p <= 0) errors.panjang = 'Panjang harus angka > 0'
  else if (p > VALIDATION_RULES.PANJANG.max) errors.panjang = `Panjang maksimal ${VALIDATION_RULES.PANJANG.max} cm`

  const l = parseFloat(lebar)
  if (!lebar?.trim()) errors.lebar = 'Lebar tidak boleh kosong'
  else if (isNaN(l) || l <= 0) errors.lebar = 'Lebar harus angka > 0'
  else if (l > VALIDATION_RULES.LEBAR.max) errors.lebar = `Lebar maksimal ${VALIDATION_RULES.LEBAR.max} cm`

  const h = parseFloat(harga_per_lembar)
  if (!harga_per_lembar?.trim()) errors.harga_per_lembar = 'Harga tidak boleh kosong'
  else if (isNaN(h) || h <= 0) errors.harga_per_lembar = 'Harga harus angka > 0'
  else if (h > VALIDATION_RULES.HARGA.max) errors.harga_per_lembar = 'Harga maksimal 100 juta'

  if (!errors.panjang && !errors.lebar && p > 0 && l > 0) {
    const isDuplicate = existingData.some(item => {
      const isSameSize = Math.abs(item.panjang - p) < 0.001 && Math.abs(item.lebar - l) < 0.001
      return editingItem ? isSameSize && item.id_s_k !== editingItem.id_s_k : isSameSize
    })
    
    if (isDuplicate) {
      errors.general = `Kombinasi ${p} × ${l} cm sudah ada dalam database`
    }
  }

  return errors
}

const showSuccess = (message: string) => 
  Swal.fire({ icon: 'success', title: 'Berhasil!', text: message, showConfirmButton: false, timer: 1500 })

const showError = (message: string) => 
  Swal.fire({ icon: 'error', title: 'Error!', text: message, confirmButtonColor: '#1f4390' })

const showConfirm = async (message: string) => 
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true
  })

// ===== MAIN COMPONENT =====
export default function K200SettingsPage() {
  // ===== STATE =====
  const [data, setData] = useState<K200Data[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  
  // Modal state
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | null>(null)
  
  // Form state
  const [addForm, setAddForm] = useState<FormData>(BASE_FORM)
  const [editForm, setEditForm] = useState<FormData>(BASE_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editingItem, setEditingItem] = useState<K200Data | null>(null)

  // ===== DERIVED STATE =====
  const stats = useMemo(() => calculateStats(data), [data])

  // ===== API CALLS =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(API_ENDPOINTS.BASE, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000
      })

      const responseData = Array.isArray(response.data) ? response.data : 
                          response.data?.data || []

      const processedData: K200Data[] = responseData.map((item: any) => ({
        id_s_k: item.id_s_k || item.id,
        panjang: parseFloat(item.panjang) || 0,
        lebar: parseFloat(item.lebar) || 0,
        harga_per_lembar: parseFloat(item.harga_per_lembar) || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))

      setData(processedData)
    } catch (err: any) {
      console.error('❌ Fetch error:', err)
      
      const errorMessage = err.response?.status === 404 || err.response?.status === 204
        ? 'Data K200 tidak ditemukan'
        : err.code === 'ECONNABORTED'
        ? 'Koneksi timeout. Silakan coba lagi.'
        : !err.response
        ? 'Tidak bisa connect ke server. Periksa koneksi internet.'
        : err.response?.data?.message || 'Terjadi kesalahan saat memuat data'
      
      setError(errorMessage)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchById = useCallback(async (id: number): Promise<K200Data | null> => {
    try {
      const response = await axios.get(API_ENDPOINTS.BY_ID(id), {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000
      })

      const data = response.data?.data || response.data
      
      return data ? {
        id_s_k: data.id_s_k || data.id,
        panjang: parseFloat(data.panjang) || 0,
        lebar: parseFloat(data.lebar) || 0,
        harga_per_lembar: parseFloat(data.harga_per_lembar) || 0
      } : null
    } catch (err) {
      console.error('❌ Fetch by ID error:', err)
      return null
    }
  }, [])

  const addK200 = useCallback(async (formData: Omit<K200Data, 'id_s_k'>) => {
    const response = await axios.post(API_ENDPOINTS.ADD, formData, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 15000
    })
    return response
  }, [])

  const updateK200 = useCallback(async (id: number, data: Partial<K200Data>) => {
    try {
      const response = await axios.put(`${API_ENDPOINTS.EDIT}/${id}`, data, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 15000
      })
      return response
    } catch {
      const response = await axios.put(API_ENDPOINTS.EDIT, { id_s_k: id, ...data }, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 15000
      })
      return response
    }
  }, [])

  const removeK200 = useCallback(async (id: number) => {
    const response = await axios.delete(API_ENDPOINTS.DELETE(id), {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
    return response
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async () => {
    setIsPosting(true)
    try {
      await fetchData()
      await showSuccess('Data K200 berhasil diperbarui')
    } catch {
      await showError('Gagal memperbarui data')
    } finally {
      setIsPosting(false)
    }
  }, [fetchData])

  const handleAdd = useCallback(async () => {
    const validationErrors = validateForm(addForm, data)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsPosting(true)
    try {
      const payload = {
        panjang: parseFloat(addForm.panjang),
        lebar: parseFloat(addForm.lebar),
        harga_per_lembar: parseFloat(addForm.harga_per_lembar)
      }

      const response = await addK200(payload)
      
      if (response.data?.status === 200 || response.data?.success) {
        await showSuccess('Data K200 berhasil ditambahkan')
        setActiveModal(null)
        setAddForm(BASE_FORM)
        setErrors({})
        await fetchData()
      } else {
        throw new Error(response.data?.message || 'Gagal menambahkan data')
      }
    } catch (err: any) {
      const errorMessage = err.response?.status === 500 && 
        typeof err.response?.data === 'string' && 
        err.response.data.includes('Duplicate entry')
        ? 'Data dengan ukuran tersebut sudah ada'
        : err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan data'
      
      await showError(errorMessage)
    } finally {
      setIsPosting(false)
    }
  }, [addForm, data, addK200, fetchData])

  const handleEditClick = useCallback(async (item: K200Data) => {
    setIsPosting(true)
    try {
      const freshData = await fetchById(item.id_s_k)
      const itemToEdit = freshData || item
      
      setEditingItem(itemToEdit)
      setEditForm({
        panjang: itemToEdit.panjang.toString(),
        lebar: itemToEdit.lebar.toString(),
        harga_per_lembar: itemToEdit.harga_per_lembar.toString()
      })
      setErrors({})
      setActiveModal('edit')
    } catch {
      setEditingItem(item)
      setEditForm({
        panjang: item.panjang.toString(),
        lebar: item.lebar.toString(),
        harga_per_lembar: item.harga_per_lembar.toString()
      })
      setErrors({})
      setActiveModal('edit')
    } finally {
      setIsPosting(false)
    }
  }, [fetchById])

  const handleEditSave = useCallback(async () => {
    if (!editingItem) return

    const validationErrors = validateForm(editForm, data, editingItem)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsPosting(true)
    try {
      const payload = {
        panjang: parseFloat(editForm.panjang),
        lebar: parseFloat(editForm.lebar),
        harga_per_lembar: parseFloat(editForm.harga_per_lembar)
      }

      const response = await updateK200(editingItem.id_s_k, payload)
      
      if (response.data?.status === 200 || response.data?.success) {
        await showSuccess('Data K200 berhasil diperbarui')
        setActiveModal(null)
        setEditingItem(null)
        setEditForm(BASE_FORM)
        setErrors({})
        await fetchData()
      } else {
        throw new Error(response.data?.message || 'Gagal memperbarui data')
      }
    } catch (err: any) {
      const errorMessage = err.response?.status === 500 && 
        typeof err.response?.data === 'string' && 
        err.response.data.includes('Duplicate entry')
        ? 'Data dengan ukuran tersebut sudah ada'
        : err.response?.data?.message || err.message || 'Terjadi kesalahan saat mengupdate data'
      
      await showError(errorMessage)
    } finally {
      setIsPosting(false)
    }
  }, [editingItem, editForm, data, updateK200, fetchData])

  const handleDelete = useCallback(async (id: number, displayName: string) => {
    const result = await showConfirm(`Ukuran ${displayName} akan dihapus permanen!`)
    
    if (result.isConfirmed) {
      try {
        const response = await removeK200(id)
        
        const isSuccess = response.status === 200 || 
                         response.data?.status === 200 || 
                         response.data?.success === true
        
        if (isSuccess) {
          await showSuccess('Data berhasil dihapus')
          await fetchData()
        } else {
          throw new Error(response.data?.message || 'Gagal menghapus data')
        }
      } catch (err: any) {
        await showError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat menghapus data')
      }
    }
  }, [removeK200, fetchData])

  const handleCloseModal = useCallback(() => {
    if (!isPosting) {
      setActiveModal(null)
      setAddForm(BASE_FORM)
      setEditForm(BASE_FORM)
      setEditingItem(null)
      setErrors({})
    }
  }, [isPosting])

  // ===== RENDER UTILS =====
  const getPreviewData = (form: FormData) => {
    const panjang = parseFloat(form.panjang) || 0
    const lebar = parseFloat(form.lebar) || 0
    const harga = parseFloat(form.harga_per_lembar) || 0
    const luasM2 = (panjang * lebar) / 10000
    const hargaPerM2 = luasM2 > 0 ? harga / luasM2 : 0
    return { panjang, lebar, harga, luasM2, hargaPerM2 }
  }

  // ===== RENDER =====
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            K200 Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola ukuran dan harga sheet K200 (panjang × lebar)
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            icon="mdi:refresh"
            disabled={loading || isPosting}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setActiveModal('add')}
            icon="mdi:plus"
            className="bg-gradient-to-r from-blue-600 to-blue-700"
            disabled={isPosting}
          >
            Tambah Ukuran
          </Button>
        </div>
      </div>

      {/* ===== LOADING STATE ===== */}
      {loading && data.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Icon icon="svg-spinners:ring-resize" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat data K200...</p>
          </div>
        </div>
      )}

      {/* ===== ERROR STATE ===== */}
      {error && data.length === 0 && !loading && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3 p-4">
            <Icon icon="mdi:alert-circle" className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <Button onClick={fetchData} variant="danger" className="mt-4" icon="mdi:refresh" disabled={isPosting}>
                Coba Lagi
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ===== STATS CARDS ===== */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: 'mdi:database', color: 'text-blue-600', label: 'Total Records', value: stats.totalRecords, unit: 'items', desc: 'jumlah data tersimpan' },
            { icon: 'mdi:ruler-square', color: 'text-green-600', label: 'Kombinasi Ukuran', value: stats.totalCombinations, unit: '', desc: 'ukuran unik' },
            { icon: 'mdi:cash-multiple', color: 'text-purple-600', label: 'Rata-rata Harga', value: formatCurrency(stats.averagePrice), unit: '', desc: 'per lembar' },
            { 
              icon: 'mdi:check-circle', 
              color: stats.totalRecords > 0 ? 'text-green-600' : 'text-gray-400', 
              label: 'Status', 
              value: stats.totalRecords > 0 ? 'Active' : 'Empty', 
              unit: '', 
              desc: stats.totalRecords > 0 ? 'Data tersedia' : 'Belum ada data' 
            }
          ].map((card, i) => (
            <Card key={i} className="bg-white hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Icon icon={card.icon} className={`w-4 h-4 ${card.color}`} />
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  {card.unit && <span className="text-sm text-blue-600 font-medium">{card.unit}</span>}
                </div>
                <p className="text-xs text-gray-500">{card.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ===== TABLE / EMPTY STATE ===== */}
      {!loading && !error && (
        <>
          {data.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Icon icon="mdi:package-variant" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Belum ada data K200</p>
                <p className="text-sm text-gray-400 mb-6">Tambahkan ukuran pertama untuk memulai</p>
                <Button
                  variant="primary"
                  onClick={() => setActiveModal('add')}
                  icon="mdi:plus"
                >
                  Tambah Ukuran
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Icon icon="mdi:table" className="w-5 h-5 text-blue-600" />
                    Daftar Ukuran K200
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.totalRecords} records, {stats.totalCombinations} kombinasi unik
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['No', 'Ukuran (cm)', 'Panjang', 'Lebar', 'Harga per Lembar', 'Actions'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => {
                      const luasM2 = (item.panjang * item.lebar) / 10000
                      const hargaPerM2 = luasM2 > 0 ? item.harga_per_lembar / luasM2 : 0
                      
                      return (
                        <tr key={item.id_s_k} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {formatNumber(item.panjang)} × {formatNumber(item.lebar)} cm
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Luas: {luasM2.toFixed(4)} m²
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="info">{formatNumber(item.panjang)} cm</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="warning">{formatNumber(item.lebar)} cm</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(item.harga_per_lembar)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatCurrency(hargaPerM2)}/m²
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                onClick={() => handleEditClick(item)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                icon="mdi:pencil"
                                disabled={loading || isPosting}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleDelete(item.id_s_k, `${item.panjang}×${item.lebar} cm`)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                icon="mdi:delete"
                                disabled={loading || isPosting}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-100 gap-4 px-6 py-4">
                <div className="text-sm text-gray-500">
                  Menampilkan {data.length} dari {data.length} records
                </div>
                <div className="text-sm text-gray-500">
                  Rata-rata harga: {formatCurrency(stats.averagePrice)} per lembar
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={activeModal === 'add'}
        onClose={handleCloseModal}
        title="Tambah Ukuran K200"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal} disabled={isPosting}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAdd} 
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Panjang (cm) *"
              type="number"
              value={addForm.panjang}
              onChange={(e) => {
                setAddForm({ ...addForm, panjang: e.target.value })
                setErrors({ ...errors, panjang: '', general: '' })
              }}
              placeholder="100"
              min={VALIDATION_RULES.PANJANG.min}
              max={VALIDATION_RULES.PANJANG.max}
              step="1"
              error={errors.panjang}
              disabled={isPosting}
              rightIcon={<span className="text-gray-500 text-sm">cm</span>}
            />
            <Input
              label="Lebar (cm) *"
              type="number"
              value={addForm.lebar}
              onChange={(e) => {
                setAddForm({ ...addForm, lebar: e.target.value })
                setErrors({ ...errors, lebar: '', general: '' })
              }}
              placeholder="80"
              min={VALIDATION_RULES.LEBAR.min}
              max={VALIDATION_RULES.LEBAR.max}
              step="1"
              error={errors.lebar}
              disabled={isPosting}
              rightIcon={<span className="text-gray-500 text-sm">cm</span>}
            />
          </div>

          <Input
            label="Harga per Lembar *"
            type="number"
            value={addForm.harga_per_lembar}
            onChange={(e) => {
              setAddForm({ ...addForm, harga_per_lembar: e.target.value })
              setErrors({ ...errors, harga_per_lembar: '', general: '' })
            }}
            placeholder="10000"
            min={VALIDATION_RULES.HARGA.min}
            max={VALIDATION_RULES.HARGA.max}
            step="100"
            error={errors.harga_per_lembar}
            disabled={isPosting}
            leftIcon={<span className="text-gray-500 text-sm">Rp</span>}
            helperText="Masukkan harga dalam rupiah"
          />

          {addForm.panjang && addForm.lebar && addForm.harga_per_lembar && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Preview:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-700">Ukuran:</p>
                      <p className="font-medium text-gray-900">
                        {addForm.panjang} × {addForm.lebar} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-700">Luas:</p>
                      <p className="font-medium text-gray-900">
                        {getPreviewData(addForm).luasM2.toFixed(4)} m²
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-700">Harga/m²:</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(getPreviewData(addForm).hargaPerM2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={activeModal === 'edit'}
        onClose={handleCloseModal}
        title="Edit Ukuran K200"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal} disabled={isPosting}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSave} 
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editingItem && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                ID: <strong className="text-gray-900">#{editingItem.id_s_k}</strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Panjang (cm) *"
              type="number"
              value={editForm.panjang}
              onChange={(e) => {
                setEditForm({ ...editForm, panjang: e.target.value })
                setErrors({ ...errors, panjang: '', general: '' })
              }}
              placeholder="100"
              min={VALIDATION_RULES.PANJANG.min}
              max={VALIDATION_RULES.PANJANG.max}
              step="1"
              error={errors.panjang}
              disabled={isPosting}
              rightIcon={<span className="text-gray-500 text-sm">cm</span>}
            />
            <Input
              label="Lebar (cm) *"
              type="number"
              value={editForm.lebar}
              onChange={(e) => {
                setEditForm({ ...editForm, lebar: e.target.value })
                setErrors({ ...errors, lebar: '', general: '' })
              }}
              placeholder="80"
              min={VALIDATION_RULES.LEBAR.min}
              max={VALIDATION_RULES.LEBAR.max}
              step="1"
              error={errors.lebar}
              disabled={isPosting}
              rightIcon={<span className="text-gray-500 text-sm">cm</span>}
            />
          </div>

          <Input
            label="Harga per Lembar *"
            type="number"
            value={editForm.harga_per_lembar}
            onChange={(e) => {
              setEditForm({ ...editForm, harga_per_lembar: e.target.value })
              setErrors({ ...errors, harga_per_lembar: '', general: '' })
            }}
            placeholder="10000"
            min={VALIDATION_RULES.HARGA.min}
            max={VALIDATION_RULES.HARGA.max}
            step="100"
            error={errors.harga_per_lembar}
            disabled={isPosting}
            leftIcon={<span className="text-gray-500 text-sm">Rp</span>}
            helperText="Masukkan harga dalam rupiah"
          />

          {editForm.panjang && editForm.lebar && editForm.harga_per_lembar && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Preview:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-700">Ukuran:</p>
                      <p className="font-medium text-gray-900">
                        {editForm.panjang} × {editForm.lebar} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-700">Luas:</p>
                      <p className="font-medium text-gray-900">
                        {getPreviewData(editForm).luasM2.toFixed(4)} m²
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-700">Harga/m²:</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(getPreviewData(editForm).hargaPerM2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}