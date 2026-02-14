'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import SweetAlert from '@/components/UI/SweetAlert'
import { Icon } from '@iconify/react'

// ===== TYPE DEFINITIONS =====
interface Flute {
  id: string
  code: string
  name: string
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalFlutes: number
  bFlute: number
  cFlute: number
  cbFlute: number
  ebFlute: number
  others: number
}

interface FormData {
  code: string
  name: string
}

// ===== CONSTANTS =====
const FLUTE_TYPE_MAP: Record<string, string> = {
  'B': 'B-Flute',
  'C': 'C-Flute',
  'CB': 'CB-Flute',
  'BC': 'BC-Flute',
  'EB': 'EB-Flute',
  'E': 'E-Flute',
  'A': 'A-Flute',
  'F': 'F-Flute'
}

const BASE_FORM_DATA: FormData = {
  code: '',
  name: ''
}

// ===== UTILITIES =====
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const getFluteBadgeVariant = (code: string): 'primary' | 'success' | 'warning' | 'info' | 'gray' => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B':
      return 'primary'
    case 'C':
      return 'success'
    case 'CB':
    case 'BC':
      return 'warning'
    case 'EB':
    case 'E':
      return 'info'
    default:
      return 'gray'
  }
}

const getFluteBadgeClass = (code: string): string => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'C':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'CB':
    case 'BC':
      return 'bg-orange-100 text-orange-800 border border-orange-200'
    case 'EB':
    case 'E':
      return 'bg-purple-100 text-purple-800 border border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
}

const getFluteIcon = (code: string): string => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B':
      return 'mdi:alpha-b-box'
    case 'C':
      return 'mdi:alpha-c-box'
    case 'CB':
    case 'BC':
      return 'mdi:layers-triple'
    case 'EB':
    case 'E':
      return 'mdi:package-variant'
    default:
      return 'mdi:shape'
  }
}

// ===== MAIN COMPONENT =====
export default function FlutesPage() {
  const router = useRouter()

  // ===== STATE =====
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Form states
  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM_DATA })
  const [editingItem, setEditingItem] = useState<Flute | null>(null)

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalFlutes: 0,
    bFlute: 0,
    cFlute: 0,
    cbFlute: 0,
    ebFlute: 0,
    others: 0
  })

  // ===== DERIVED STATE =====
  const flutesByType = useMemo(() => ({
    b: flutes.filter(f => f.code.toUpperCase() === 'B').length,
    c: flutes.filter(f => f.code.toUpperCase() === 'C').length,
    cb: flutes.filter(f => ['CB', 'BC'].includes(f.code.toUpperCase())).length,
    eb: flutes.filter(f => ['EB', 'E'].includes(f.code.toUpperCase())).length,
    others: flutes.filter(f => {
      const code = f.code.toUpperCase()
      return !['B', 'C', 'CB', 'BC', 'EB', 'E'].includes(code)
    }).length
  }), [flutes])

  // ===== API CALLS =====
  const fetchFlutes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/Admin/Flutes/Flutes', {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000
      })
      
      // Handle berbagai format response
      if (response.data) {
        let processedFlutes: Flute[] = []
        
        if (response.data.status === 200 && Array.isArray(response.data.data)) {
          processedFlutes = response.data.data.map((item: any) => ({
            id: item.id_f?.toString() || '',
            code: item.code || '',
            name: item.name || '',
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString()
          }))
        } else if (Array.isArray(response.data)) {
          processedFlutes = response.data.map((item: any) => ({
            id: item.id_f?.toString() || '',
            code: item.code || '',
            name: item.name || '',
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString()
          }))
        } else if (response.data.status === 200 && (!response.data.data || response.data.data.length === 0)) {
          processedFlutes = []
        } else if (typeof response.data === 'string' || response.data.message === 'success') {
          processedFlutes = []
        } else {
          console.warn('⚠️ Format response tidak dikenali:', response.data)
          processedFlutes = []
        }
        
        setFlutes(processedFlutes)
        setStats({
          totalFlutes: processedFlutes.length,
          bFlute: processedFlutes.filter(f => f.code.toUpperCase() === 'B').length,
          cFlute: processedFlutes.filter(f => f.code.toUpperCase() === 'C').length,
          cbFlute: processedFlutes.filter(f => ['CB', 'BC'].includes(f.code.toUpperCase())).length,
          ebFlute: processedFlutes.filter(f => ['EB', 'E'].includes(f.code.toUpperCase())).length,
          others: processedFlutes.filter(f => {
            const code = f.code.toUpperCase()
            return !['B', 'C', 'CB', 'BC', 'EB', 'E'].includes(code)
          }).length
        })
      } else {
        setFlutes([])
        resetStats()
      }
      
    } catch (err: any) {
      console.error('❌ Error fetching flutes:', err)
      
      if (err.response?.status === 404 || err.response?.status === 204) {
        setFlutes([])
        resetStats()
        setError(null)
      } else if (err.code === 'ECONNABORTED') {
        setError('Koneksi timeout. Silakan coba lagi.')
      } else if (!err.response) {
        setError('Tidak bisa connect ke server. Periksa koneksi internet.')
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan saat memuat data')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const resetStats = () => {
    setStats({
      totalFlutes: 0,
      bFlute: 0,
      cFlute: 0,
      cbFlute: 0,
      ebFlute: 0,
      others: 0
    })
  }

  useEffect(() => {
    fetchFlutes()
  }, [fetchFlutes])

  // ===== HANDLERS - AUTO GENERATE =====
  const handleCodeChange = (value: string) => {
    const upperCode = value.toUpperCase()
    const autoName = FLUTE_TYPE_MAP[upperCode] || `${upperCode}-Flute`
    
    setAddFormData({
      code: upperCode,
      name: autoName
    })
  }

  const handleEditCodeChange = (value: string) => {
    if (!editingItem) return
    const upperCode = value.toUpperCase()
    const autoName = FLUTE_TYPE_MAP[upperCode] || `${upperCode}-Flute`
    
    setEditingItem({
      ...editingItem,
      code: upperCode,
      name: autoName
    })
  }

  // ===== VALIDATION =====
  const validateForm = (data: FormData): boolean => {
    if (!data.code.trim()) {
      SweetAlert.error('Validasi Error', 'Kode tidak boleh kosong')
      return false
    }
    
    if (data.code.length > 3) {
      SweetAlert.error('Validasi Error', 'Kode maksimal 3 karakter')
      return false
    }
    
    if (!data.name.trim()) {
      SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong')
      return false
    }
    
    return true
  }

  // ===== HANDLERS - ADD =====
  const handleAddClick = useCallback(() => {
    setAddFormData({ ...BASE_FORM_DATA })
    setShowAddModal(true)
  }, [])

  const handleAddSave = async () => {
    if (!validateForm(addFormData)) return
    
    // Check duplicate
    const isDuplicate = flutes.some(
      flute => flute.code.toUpperCase() === addFormData.code.trim().toUpperCase()
    )
    
    if (isDuplicate) {
      SweetAlert.error('Kode Sudah Ada!', `Kode "${addFormData.code}" sudah terdaftar. Gunakan kode lain.`)
      return
    }
    
    try {
      setIsPosting(true)
      
      const response = await axios.post('/Admin/Flutes/FlutesAdd', {
        code: addFormData.code.trim(),
        name: addFormData.name.trim()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 15000
      })
      
      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil ditambahkan!')
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM_DATA })
        await fetchFlutes()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal menambahkan Flute')
      }
    } catch (err: any) {
      console.error('Error adding flute:', err)
      
      let errorMessage = 'Terjadi kesalahan saat menyimpan data'
      if (err.response?.status === 500 && typeof err.response?.data === 'string' && err.response.data.includes('Duplicate entry')) {
        errorMessage = `Kode "${addFormData.code}" sudah terdaftar. Silakan gunakan kode lain.`
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Koneksi timeout. Silakan coba lagi.'
      }
      
      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS - EDIT =====
  const handleEditClick = useCallback(async (item: Flute) => {
    try {
      const response = await axios.get(`/Admin/Flutes/FlutesByid/${item.id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000
      })
      
      if (response.data?.status === 200 && response.data.data) {
        const data = response.data.data
        setEditingItem({
          id: data.id_f?.toString() || item.id,
          code: data.code || item.code,
          name: data.name || item.name,
          createdAt: data.created_at || item.createdAt,
          updatedAt: data.updated_at || item.updatedAt
        })
      } else {
        setEditingItem({ ...item })
      }
      setShowEditModal(true)
    } catch (err) {
      console.error('Error loading flute for edit:', err)
      setEditingItem({ ...item })
      setShowEditModal(true)
    }
  }, [])

  const handleEditSave = async () => {
    if (!editingItem) return
    
    if (!validateForm(editingItem)) return
    
    // Check duplicate (excluding current)
    const isDuplicate = flutes.some(
      flute => flute.id !== editingItem.id && 
               flute.code.toUpperCase() === editingItem.code.trim().toUpperCase()
    )
    
    if (isDuplicate) {
      SweetAlert.error('Kode Sudah Ada!', `Kode "${editingItem.code}" sudah digunakan oleh flute lain. Gunakan kode lain.`)
      return
    }
    
    try {
      setIsPosting(true)
      
      const response = await axios.put(`/Admin/Flutes/FlutesEdit/${editingItem.id}`, {
        code: editingItem.code.trim(),
        name: editingItem.name.trim()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 15000
      })
      
      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil diperbarui!')
        setShowEditModal(false)
        setEditingItem(null)
        await fetchFlutes()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal mengupdate data')
      }
    } catch (err: any) {
      console.error('Error editing flute:', err)
      
      let errorMessage = 'Terjadi kesalahan saat mengupdate data'
      if (err.response?.status === 500 && typeof err.response?.data === 'string' && err.response.data.includes('Duplicate entry')) {
        errorMessage = `Kode "${editingItem.code}" sudah digunakan oleh flute lain. Silakan gunakan kode lain.`
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Koneksi timeout. Silakan coba lagi.'
      }
      
      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS - DELETE =====
  const handleDelete = useCallback(async (id: string, name: string) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/Admin/Flutes/FlutesDel/${id}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        
        if (response.data?.status === 200) {
          SweetAlert.success('Dihapus!', `Flute "${name}" berhasil dihapus!`)
          await fetchFlutes()
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus Flute')
        }
      } catch (err: any) {
        console.error('Error deleting flute:', err)
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus data')
      }
    }
  }, [fetchFlutes])

  // ===== MODAL HANDLERS =====
  const handleCloseAddModal = useCallback(() => {
    if (!isPosting) {
      setShowAddModal(false)
      setAddFormData({ ...BASE_FORM_DATA })
    }
  }, [isPosting])

  const handleCloseEditModal = useCallback(() => {
    if (!isPosting) {
      setShowEditModal(false)
      setEditingItem(null)
    }
  }, [isPosting])

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:layers" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Flutes...</p>
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
            <Button onClick={fetchFlutes} variant="danger" className="mx-auto">
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
            <Icon icon="mdi:layers" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Flutes
            </h1>
            <p className="text-gray-600 mt-1">Kelola jenis flute untuk box corrugated</p>
          </div>
        </div>
        
        <Button
          onClick={handleAddClick}
          variant="primary"
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          icon="mdi:plus"
        >
          Tambah Flute Baru
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:layers" className="w-4 h-4 text-blue-600" />
              Total Flutes
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.totalFlutes.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Icon icon="mdi:chart-box" className="w-3 h-3" />
              <span>jenis flute tersedia</span>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:alpha-b-box" className="w-4 h-4 text-blue-600" />
              B-Flute
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.bFlute}</p>
            <p className="text-xs text-gray-500">ketebalan ~3mm</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:alpha-c-box" className="w-4 h-4 text-green-600" />
              C-Flute
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.cFlute}</p>
            <p className="text-xs text-gray-500">ketebalan ~4mm</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-full group-hover:bg-orange-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:layers-triple" className="w-4 h-4 text-orange-600" />
              CB/BC-Flute
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.cbFlute}</p>
            <p className="text-xs text-gray-500">double wall</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:package-variant" className="w-4 h-4 text-purple-600" />
              Others
            </p>
            <p className="text-2xl font-bold text-gray-900">{stats.ebFlute + stats.others}</p>
            <p className="text-xs text-gray-500">E, EB, A, F, dll</p>
          </div>
        </Card>
      </div>

      {/* ===== MAIN CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:clipboard-list-outline" className="w-5 h-5 text-blue-600" />
              Daftar Flutes
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.totalFlutes} jenis flute terdaftar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFlutes}
              className="border-gray-300 hover:bg-gray-50"
              icon="mdi:refresh"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Kode', 'Nama Flute', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flutes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Icon icon="mdi:layers-off" className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Belum ada data flute</p>
                      <p className="text-sm text-gray-400 mt-1">Klik tombol "Tambah Flute Baru" untuk memulai</p>
                    </div>
                  </td>
                </tr>
              ) : (
                flutes.map((flute) => (
                  <tr key={flute.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <Icon icon={getFluteIcon(flute.code)} className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getFluteBadgeClass(flute.code)}`}>
                          {flute.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{flute.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Dibuat: {formatDate(flute.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(flute)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Icon icon="mdi:pencil" className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(flute.id, flute.name)}
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

        {/* Table Footer */}
        {flutes.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Menampilkan {flutes.length} dari {stats.totalFlutes} flute
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Icon icon="mdi:information" className="w-4 h-4 text-blue-500" />
              <span>Kode flute otomatis uppercase</span>
            </div>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Flute Baru"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAddSave} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Menyimpan...' : 'Simpan Flute'}
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
                  Nama flute akan otomatis terisi berdasarkan kode yang diinput (maksimal 3 karakter)
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Kode Flute *"
            value={addFormData.code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="Contoh: B, C, CB, BC, EB"
            helperText="Masukkan kode flute (otomatis uppercase)"
            maxLength={3}
            disabled={isPosting}
            className="uppercase"
          />

          <Input
            label="Nama Flute *"
            value={addFormData.name}
            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            placeholder="Contoh: B-Flute"
            helperText="Nama otomatis terisi, bisa diubah jika perlu"
            disabled={isPosting}
          />

          {addFormData.code && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:eye" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Preview:</h4>
                  <p className="text-sm text-blue-700">
                    Kode: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFluteBadgeClass(addFormData.code)}`}>
                      {addFormData.code}
                    </span>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Nama: <strong>{addFormData.name}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Flute"
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
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                ID: <span className="font-mono font-medium text-gray-900">{editingItem.id}</span>
              </p>
            </div>

            <Input
              label="Kode Flute *"
              value={editingItem.code}
              onChange={(e) => handleEditCodeChange(e.target.value)}
              placeholder="Contoh: B, C, CB, BC, EB"
              helperText="Ubah kode flute (maksimal 3 karakter)"
              maxLength={3}
              disabled={isPosting}
              className="uppercase"
            />

            <Input
              label="Nama Flute *"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              placeholder="Contoh: B-Flute"
              disabled={isPosting}
            />

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:eye" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Preview Perubahan:</h4>
                  <p className="text-sm text-blue-700">
                    Kode: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFluteBadgeClass(editingItem.code)}`}>
                      {editingItem.code}
                    </span>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Nama: <strong>{editingItem.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 p-3 rounded-lg">
              <Icon icon="mdi:clock-outline" className="w-3 h-3" />
              <span>Dibuat: {formatDate(editingItem.createdAt)}</span>
              <span className="mx-2">•</span>
              <Icon icon="mdi:update" className="w-3 h-3" />
              <span>Diperbarui: {formatDate(editingItem.updatedAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}