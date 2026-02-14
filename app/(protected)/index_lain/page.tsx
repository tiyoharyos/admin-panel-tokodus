'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '../../../lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import SweetAlert from '@/components/UI/SweetAlert'
import { Icon } from '@iconify/react'

// ===== TYPE DEFINITIONS =====
interface IndexLainnya {
  id_pv: string
  category_id: string
  name_pv: string
  qty_min: string | null
  qty_max: string | null
  modal: string | null
  jual: string | null
  value_decimal: string | null
  value_int: string | null
  id_pc: string
  category_name: string
}

interface CategoryGroup {
  id_pc: string
  category_name: string
  items: IndexLainnya[]
}

interface Stats {
  totalItems: number
  totalCategories: number
  withQuantity: number
  withPrice: number
  withDecimal: number
  withInteger: number
}

interface AddFormData {
  category_id: string
  name_pv: string
  qty_min: string
  qty_max: string
  modal: string
  jual: string
  value_decimal: string
  value_int: string
}

// ===== CONSTANTS =====
const BASE_ADD_FORM: AddFormData = {
  category_id: '',
  name_pv: '',
  qty_min: '',
  qty_max: '',
  modal: '',
  jual: '',
  value_decimal: '',
  value_int: ''
}

// ===== UTILITIES =====
const formatCurrency = (value: string | null): string => {
  if (!value || value === 'null') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num)
}

const formatDecimal = (value: string | null): string => {
  if (!value || value === 'null') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return num.toFixed(4)
}

const formatQuantityRange = (min: string | null, max: string | null): string => {
  if (!min && !max) return '-'
  if (min && !max) return `≥ ${parseInt(min).toLocaleString()} pcs`
  if (!min && max) return `≤ ${parseInt(max).toLocaleString()} pcs`
  return `${parseInt(min).toLocaleString()} - ${parseInt(max).toLocaleString()} pcs`
}

const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    '1': 'bg-blue-100 text-blue-800 border-blue-200',
    '2': 'bg-green-100 text-green-800 border-green-200',
    '3': 'bg-purple-100 text-purple-800 border-purple-200',
    '4': 'bg-amber-100 text-amber-800 border-amber-200',
    '5': 'bg-rose-100 text-rose-800 border-rose-200',
    '6': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
  return colors[categoryId] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getValueTypeIcon = (item: IndexLainnya): string => {
  if (item.value_decimal && item.value_decimal !== 'null') return 'mdi:percent'
  if (item.value_int && item.value_int !== 'null') return 'mdi:numeric'
  if (item.modal || item.jual) return 'mdi:currency-usd'
  return 'mdi:help-circle'
}

// ===== MAIN COMPONENT =====
export default function IndexLainnyaPage() {
  // ===== STATE =====
  const [indexData, setIndexData] = useState<IndexLainnya[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Form states
  const [addFormData, setAddFormData] = useState<AddFormData>({ ...BASE_ADD_FORM })
  const [editingItem, setEditingItem] = useState<IndexLainnya | null>(null)
  const [selectedItem, setSelectedItem] = useState<IndexLainnya | null>(null)

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // ===== DERIVED STATE =====
  const categoryGroups = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {}
    
    indexData.forEach(item => {
      if (!groups[item.id_pc]) {
        groups[item.id_pc] = {
          id_pc: item.id_pc,
          category_name: item.category_name,
          items: []
        }
      }
      groups[item.id_pc].items.push(item)
    })
    
    return Object.values(groups).sort((a, b) => parseInt(a.id_pc) - parseInt(b.id_pc))
  }, [indexData])

  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return indexData
    return indexData.filter(item => item.category_id === selectedCategory)
  }, [indexData, selectedCategory])

  const stats = useMemo((): Stats => {
    return {
      totalItems: indexData.length,
      totalCategories: categoryGroups.length,
      withQuantity: indexData.filter(item => item.qty_min || item.qty_max).length,
      withPrice: indexData.filter(item => item.modal || item.jual).length,
      withDecimal: indexData.filter(item => item.value_decimal && item.value_decimal !== 'null').length,
      withInteger: indexData.filter(item => item.value_int && item.value_int !== 'null').length
    }
  }, [indexData, categoryGroups])

  const categoryOptions = useMemo(() => {
    return [
      { value: 'all', label: '🌐 Semua Kategori' },
      ...categoryGroups.map(group => ({
        value: group.id_pc,
        label: `${group.category_name} (${group.items.length})`
      }))
    ]
  }, [categoryGroups])

  // ===== API CALLS =====
  const fetchIndexLainnya = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/Admin/Other/indexLainnya', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setIndexData(response.data.data)
      } else {
        setIndexData([])
        setError('Format response tidak sesuai')
      }
      
    } catch (err: any) {
      console.error('Error fetching index lainnya:', err)
      setError(err.response?.data?.message || 'Tidak bisa connect ke server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIndexLainnya()
  }, [fetchIndexLainnya])

  // ===== HANDLERS - ADD =====
  const handleAddClick = useCallback(() => {
    setAddFormData({ ...BASE_ADD_FORM })
    setShowAddModal(true)
  }, [])

  const handleAddSave = async () => {
    if (!addFormData.category_id) {
      SweetAlert.error('Validasi Error', 'Kategori harus dipilih')
      return
    }
    
    if (!addFormData.name_pv.trim()) {
      SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      // Prepare data - only send non-empty values
      const postData: any = {
        category_id: addFormData.category_id,
        name_pv: addFormData.name_pv.trim()
      }
      
      if (addFormData.qty_min) postData.qty_min = addFormData.qty_min
      if (addFormData.qty_max) postData.qty_max = addFormData.qty_max
      if (addFormData.modal) postData.modal = addFormData.modal
      if (addFormData.jual) postData.jual = addFormData.jual
      if (addFormData.value_decimal) postData.value_decimal = addFormData.value_decimal
      if (addFormData.value_int) postData.value_int = addFormData.value_int
      
      const response = await axios.post('/Admin/Other/indexLainnya', postData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data?.status === 200 || response.data?.status === 201) {
        SweetAlert.success('Berhasil!', 'Data berhasil ditambahkan!')
        setShowAddModal(false)
        setAddFormData({ ...BASE_ADD_FORM })
        await fetchIndexLainnya()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal menambahkan data')
      }
    } catch (err: any) {
      console.error('Error saat POST:', err)
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS - EDIT =====
  const handleEditClick = useCallback((item: IndexLainnya) => {
    setEditingItem(item)
    setShowEditModal(true)
  }, [])

  const handleEditSave = async () => {
    if (!editingItem) return
    
    if (!editingItem.name_pv.trim()) {
      SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      const putData: any = {
        category_id: editingItem.category_id,
        name_pv: editingItem.name_pv.trim(),
        qty_min: editingItem.qty_min || null,
        qty_max: editingItem.qty_max || null,
        modal: editingItem.modal || null,
        jual: editingItem.jual || null,
        value_decimal: editingItem.value_decimal || null,
        value_int: editingItem.value_int || null
      }
      
      const response = await axios.put(`/Admin/Other/indexLainnya/${editingItem.id_pv}`, putData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Data berhasil diperbarui!')
        await fetchIndexLainnya()
        setShowEditModal(false)
        setEditingItem(null)
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal mengupdate data')
      }
      
    } catch (err: any) {
      console.error('Error updating data:', err)
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS - DELETE =====
  const handleDelete = useCallback(async (id: string, name: string) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/Admin/Other/indexLainnya/${id}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        
        if (response.data?.status === 200) {
          SweetAlert.success('Dihapus!', `Data "${name}" berhasil dihapus!`)
          await fetchIndexLainnya()
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus data')
        }
      } catch (err: any) {
        console.error('Error:', err)
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus data')
      }
    }
  }, [fetchIndexLainnya])

  // ===== HANDLERS - DETAIL =====
  const handleDetailClick = useCallback((item: IndexLainnya) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }, [])

  // ===== MODAL HANDLERS =====
  const handleCloseAddModal = useCallback(() => {
    if (!isPosting) {
      setShowAddModal(false)
      setAddFormData({ ...BASE_ADD_FORM })
    }
  }, [isPosting])

  const handleCloseEditModal = useCallback(() => {
    if (!isPosting) {
      setShowEditModal(false)
      setEditingItem(null)
    }
  }, [isPosting])

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedItem(null)
  }, [])

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:database" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Index Lainnya...</p>
          <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-red-200 bg-red-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:alert-circle" className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <Button onClick={fetchIndexLainnya} variant="danger" className="mx-auto">
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:database-settings" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Index Lainnya
            </h1>
            <p className="text-gray-600 mt-1">Kelola data index, margin, dan biaya produksi</p>
          </div>
        </div>
        
        <Button
          onClick={handleAddClick}
          variant="primary"
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          icon="mdi:plus"
        >
          Tambah Data Baru
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:database" className="w-4 h-4 text-blue-600" />
              Total Data
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.totalItems.toLocaleString()}</p>
            </div>
            <p className="text-xs text-gray-500">Dalam {stats.totalCategories} kategori</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:package-variant" className="w-4 h-4 text-green-600" />
              Dengan Quantity
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.withQuantity}</p>
              <span className="text-sm text-gray-500">/ {stats.totalItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${stats.totalItems ? (stats.withQuantity / stats.totalItems) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:currency-usd" className="w-4 h-4 text-purple-600" />
              Dengan Harga
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.withPrice}</p>
            </div>
            <p className="text-xs text-gray-500">Modal & harga jual</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:percent" className="w-4 h-4 text-amber-600" />
              Tipe Nilai
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-gray-900">Decimal: {stats.withDecimal}</p>
            </div>
            <p className="text-xs text-gray-500">Integer: {stats.withInteger}</p>
          </div>
        </Card>
      </div>

      {/* ===== FILTER & CATEGORY TABS ===== */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:filter" className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter Kategori:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedCategory(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === option.value
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ===== MAIN CARD - GROUPED BY CATEGORY ===== */}
      {selectedCategory === 'all' ? (
        <div className="space-y-4">
          {categoryGroups.map(group => (
            <Card key={group.id_pc} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              {/* Category Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getCategoryColor(group.id_pc)}`}>
                      <Icon icon={getValueTypeIcon(group.items[0])} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{group.category_name}</h3>
                      <p className="text-sm text-gray-500">{group.items.length} item</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(group.id_pc)}`}>
                    ID: {group.id_pc}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Nama', 'Range Quantity', 'Modal', 'Jual', 'Value Decimal', 'Value Integer', 'Actions'].map((header) => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.items.map((item) => (
                      <tr key={item.id_pv} className="hover:bg-blue-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Icon icon={getValueTypeIcon(item)} className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-900">{item.name_pv}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatQuantityRange(item.qty_min, item.qty_max)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(item.modal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {formatCurrency(item.jual)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-600">
                          {formatDecimal(item.value_decimal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-amber-600">
                          {item.value_int && item.value_int !== 'null' ? parseInt(item.value_int).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDetailClick(item)}
                              className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Detail"
                            >
                              <Icon icon="mdi:eye" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_pv, item.name_pv)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Icon icon="mdi:delete" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-blue-600" />
                Data Terfilter
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Menampilkan {filteredData.length} data
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIndexLainnya}
              className="border-gray-300 hover:bg-gray-50"
              icon="mdi:refresh"
            >
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Kategori', 'Nama', 'Range Quantity', 'Modal', 'Jual', 'Value Decimal', 'Value Integer', 'Actions'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Icon icon="mdi:database-off" className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Tidak ada data</p>
                        <p className="text-sm text-gray-400 mt-1">Coba filter kategori lain atau tambah data baru</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id_pv} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category_id)}`}>
                          {item.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Icon icon={getValueTypeIcon(item)} className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{item.name_pv}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatQuantityRange(item.qty_min, item.qty_max)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(item.modal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {formatCurrency(item.jual)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-600">
                        {formatDecimal(item.value_decimal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-amber-600">
                        {item.value_int && item.value_int !== 'null' ? parseInt(item.value_int).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDetailClick(item)}
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <Icon icon="mdi:eye" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id_pv, item.name_pv)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Icon icon="mdi:delete" className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Data Index Lainnya"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAddSave} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Informasi</p>
                <p className="text-xs text-blue-600 mt-1">
                  Isi field sesuai dengan tipe data yang diperlukan. Field yang tidak digunakan boleh dikosongkan.
                </p>
              </div>
            </div>
          </div>

          <Select
            label="Kategori *"
            value={addFormData.category_id}
            onChange={(e) => setAddFormData({ ...addFormData, category_id: e.target.value })}
            options={[
              { value: '', label: '-- Pilih Kategori --' },
              ...categoryGroups.map(g => ({ value: g.id_pc, label: g.category_name }))
            ]}
            required
          />

          <Input
            label="Nama *"
            value={addFormData.name_pv}
            onChange={(e) => setAddFormData({ ...addFormData, name_pv: e.target.value })}
            placeholder="Contoh: <1000 pcs"
            helperText="Masukkan nama atau deskripsi"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity Min"
              type="number"
              value={addFormData.qty_min}
              onChange={(e) => setAddFormData({ ...addFormData, qty_min: e.target.value })}
              placeholder="0"
              helperText="Batas minimal quantity"
            />

            <Input
              label="Quantity Max"
              type="number"
              value={addFormData.qty_max}
              onChange={(e) => setAddFormData({ ...addFormData, qty_max: e.target.value })}
              placeholder="999"
              helperText="Batas maksimal quantity"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Harga Modal"
              type="number"
              step="0.01"
              value={addFormData.modal}
              onChange={(e) => setAddFormData({ ...addFormData, modal: e.target.value })}
              placeholder="0.00"
              helperText="Harga modal (Rp)"
            />

            <Input
              label="Harga Jual"
              type="number"
              step="0.01"
              value={addFormData.jual}
              onChange={(e) => setAddFormData({ ...addFormData, jual: e.target.value })}
              placeholder="0.00"
              helperText="Harga jual (Rp)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Value Decimal"
              type="number"
              step="0.0001"
              value={addFormData.value_decimal}
              onChange={(e) => setAddFormData({ ...addFormData, value_decimal: e.target.value })}
              placeholder="0.0000"
              helperText="Nilai desimal (margin, dll)"
            />

            <Input
              label="Value Integer"
              type="number"
              value={addFormData.value_int}
              onChange={(e) => setAddFormData({ ...addFormData, value_int: e.target.value })}
              placeholder="0"
              helperText="Nilai integer"
            />
          </div>
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Data Index Lainnya"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleEditSave} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:tag" className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">ID: {editingItem.id_pv}</span>
                <span className="text-gray-300">•</span>
                <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(editingItem.category_id)}`}>
                  {editingItem.category_name}
                </span>
              </div>
            </div>

            <Input
              label="Nama *"
              value={editingItem.name_pv}
              onChange={(e) => setEditingItem({ ...editingItem, name_pv: e.target.value })}
              placeholder="Nama item"
              required
              disabled={isPosting}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity Min"
                type="number"
                value={editingItem.qty_min || ''}
                onChange={(e) => setEditingItem({ ...editingItem, qty_min: e.target.value })}
                placeholder="0"
                disabled={isPosting}
              />

              <Input
                label="Quantity Max"
                type="number"
                value={editingItem.qty_max || ''}
                onChange={(e) => setEditingItem({ ...editingItem, qty_max: e.target.value })}
                placeholder="999"
                disabled={isPosting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Harga Modal"
                type="number"
                step="0.01"
                value={editingItem.modal || ''}
                onChange={(e) => setEditingItem({ ...editingItem, modal: e.target.value })}
                placeholder="0.00"
                disabled={isPosting}
              />

              <Input
                label="Harga Jual"
                type="number"
                step="0.01"
                value={editingItem.jual || ''}
                onChange={(e) => setEditingItem({ ...editingItem, jual: e.target.value })}
                placeholder="0.00"
                disabled={isPosting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Value Decimal"
                type="number"
                step="0.0001"
                value={editingItem.value_decimal || ''}
                onChange={(e) => setEditingItem({ ...editingItem, value_decimal: e.target.value })}
                placeholder="0.0000"
                disabled={isPosting}
              />

              <Input
                label="Value Integer"
                type="number"
                value={editingItem.value_int || ''}
                onChange={(e) => setEditingItem({ ...editingItem, value_int: e.target.value })}
                placeholder="0"
                disabled={isPosting}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ===== DETAIL MODAL ===== */}
      <Modal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        title="👁️ Detail Data"
        size="md"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleCloseDetailModal}>
              Tutup
            </Button>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getCategoryColor(selectedItem.category_id)}`}>
                  <Icon icon={getValueTypeIcon(selectedItem)} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedItem.name_pv}</h3>
                  <p className="text-sm text-gray-600">{selectedItem.category_name}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">ID Data</p>
                <p className="font-mono font-medium text-gray-900">{selectedItem.id_pv}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">ID Kategori</p>
                <p className="font-mono font-medium text-gray-900">{selectedItem.category_id}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Icon icon="mdi:package-variant" className="w-4 h-4 text-blue-600" />
                Quantity Range
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 mb-1">Minimum</p>
                  <p className="font-bold text-green-900">
                    {selectedItem.qty_min ? parseInt(selectedItem.qty_min).toLocaleString() + ' pcs' : '-'}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600 mb-1">Maximum</p>
                  <p className="font-bold text-red-900">
                    {selectedItem.qty_max ? parseInt(selectedItem.qty_max).toLocaleString() + ' pcs' : '∞'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Icon icon="mdi:currency-usd" className="w-4 h-4 text-green-600" />
                Harga
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 mb-1">Modal</p>
                  <p className="font-bold text-green-900">{formatCurrency(selectedItem.modal)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Jual</p>
                  <p className="font-bold text-blue-900">{formatCurrency(selectedItem.jual)}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Icon icon="mdi:calculator" className="w-4 h-4 text-purple-600" />
                Nilai
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1">Decimal</p>
                  <p className="font-mono font-bold text-purple-900">{formatDecimal(selectedItem.value_decimal)}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-600 mb-1">Integer</p>
                  <p className="font-mono font-bold text-amber-900">
                    {selectedItem.value_int && selectedItem.value_int !== 'null' ? parseInt(selectedItem.value_int).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}