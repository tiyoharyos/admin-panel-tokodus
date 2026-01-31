'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from '../../../lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'
import SweetAlert from '@/components/UI/SweetAlert'
import { Table, TableRow, TableCell } from '@/components/UI/Table'

export default function FluteSettingsPage() {
  const router = useRouter()
  const [flutes, setFlutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  
  // State untuk modal Add
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    status: '1'
  })

  // Stats untuk dashboard
  const [stats, setStats] = useState({
    totalFlutes: 0,
    activeFlutes: 0,
    inactiveFlutes: 0
  })

  // ===== FETCH DATA =====
const fetchFlutes = async () => {
  try {
    setLoading(true)
    setError(null)
    
    console.log('🔍 Fetching from:', 'http://192.168.18.14:8080/Api_TokoDus/Admin/Flutes/Flutes')
    
    const response = await axios.get('Admin/Flutes/Flutes', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
    
    console.log('✅ Response:', response)
    console.log('📊 Response data:', response.data)
    
    if (response.data && response.data.status === 200) {
      console.log('🎯 Status 200 OK')
      
      if (Array.isArray(response.data.data)) {
        console.log('📦 Data array found, length:', response.data.data.length)
        
        const processedFlutes = response.data.data.map(item => ({
          id: item.id?.toString() || '',
          name: item.name || '',
          description: item.description || '',
          status: item.status === '1' || item.status === 1,
          status_bm: item.status?.toString(),
          createdAt: item.created_at || new Date().toISOString().split('T')[0],
          updatedAt: item.updated_at || new Date().toISOString().split('T')[0]
        }))
        
        console.log('🔄 Processed flutes:', processedFlutes)
        setFlutes(processedFlutes)
        
        // Hitung stats
        const totalFlutes = processedFlutes.length
        const activeFlutes = processedFlutes.filter(m => m.status).length
        const inactiveFlutes = totalFlutes - activeFlutes
        
        setStats({
          totalFlutes,
          activeFlutes,
          inactiveFlutes
        })
        
      } else {
        console.warn('⚠️ Data is not an array:', response.data.data)
        setFlutes([])
      }
    } else {
      const errorMsg = response.data?.message || 'Format response tidak sesuai'
      console.error('❌ Response status not 200:', response.data)
      setError(errorMsg)
    }
    
  } catch (err) {
    console.error('❌ Error fetching flutes:', err)
    console.error('❌ Error response:', err.response)
    console.error('❌ Error message:', err.message)
    
    setError(err.response?.data?.message || err.message || 'Tidak bisa connect ke server')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchFlutes()
  }, [])

  // ===== RESET STATE FUNCTIONS =====
  const resetEditState = () => {
    setEditingItem(null)
  }

  const resetAddState = () => {
    setAddFormData({
      name: '',
      description: '',
      status: '1'
    })
  }

  // ===== HANDLERS =====
  const handleAddClick = () => {
    resetAddState()
    setShowAddModal(true)
  }

  const handleAddSave = async () => {
    if (!addFormData.name.trim()) {
      SweetAlert.error('Validasi Error', 'Nama flute tidak boleh kosong')
      return
    }
    
    if (!addFormData.description.trim()) {
      SweetAlert.error('Validasi Error', 'Deskripsi tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      const postData = {
        name: addFormData.name.trim(),
        description: addFormData.description.trim(),
        status: addFormData.status
      }
      
      const response = await axios.post('Admin/Flutes/FlutesAdd', postData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil ditambahkan!')
        setShowAddModal(false)
        resetAddState()
        await fetchFlutes()
      } else {
        const errorMessage = response.data?.message || 'Gagal menambahkan Flute'
        SweetAlert.error('Gagal!', errorMessage)
      }
    } catch (err) {
      console.error('❌ Error saat POST:', err)
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  const handleEditClick = async (item) => {
    try {
      // Fetch data flute by ID
      const response = await axios.get(`Admin/Flutes/FlutesByid/${item.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200 && response.data.data) {
        const fluteData = response.data.data
        
        setEditingItem({
          id: fluteData.id?.toString() || '',
          name: fluteData.name || '',
          description: fluteData.description || '',
          status_bm: fluteData.status?.toString() || '1',
          status: fluteData.status === '1' || fluteData.status === 1
        })
      } else {
        // Jika tidak ditemukan, gunakan data dari item
        setEditingItem({ 
          ...item,
          status_bm: item.status ? '1' : '0'
        })
      }
      
      setShowEditModal(true)
      
    } catch (err) {
      console.error('❌ Error loading flute data for edit:', err)
      // Jika error, tetap tampilkan modal dengan data yang ada
      setEditingItem({ 
        ...item,
        status_bm: item.status ? '1' : '0'
      })
      setShowEditModal(true)
    }
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    
    if (!editingItem.name.trim()) {
      SweetAlert.error('Validasi Error', 'Nama flute tidak boleh kosong')
      return
    }
    
    if (!editingItem.description?.trim()) {
      SweetAlert.error('Validasi Error', 'Deskripsi tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      const putData = {
        name: editingItem.name.trim(),
        description: editingItem.description.trim(),
        status: editingItem.status_bm
      }
      
      const response = await axios.put(`Admin/Flutes/FlutesEdit/${editingItem.id}`, putData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil diperbarui!')
        
        try {
          await fetchFlutes()
        } catch (fetchErr) {
          console.error('⚠️ Error refreshing data:', fetchErr)
          SweetAlert.info('Info', 'Data berhasil disimpan, refresh halaman untuk melihat perubahan terbaru.')
        }
        
        setShowEditModal(false)
        resetEditState()
        
      } else {
        const errorMsg = response.data?.message || 'Gagal mengupdate data'
        SweetAlert.error('Gagal!', errorMsg)
      }
      
    } catch (err) {
      console.error('❌ Error updating flute:', err)
      
      let errorMessage = 'Terjadi kesalahan saat mengupdate data'
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      SweetAlert.error('Error!', errorMessage)
      
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id, name) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`Admin/Flutes/FlutesDel/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        if (response.data && response.data.status === 200) {
          SweetAlert.success('Dihapus!', `Flute "${name}" berhasil dihapus!`)
          await fetchFlutes()
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus Flute')
        }
      } catch (err) {
        console.error('❌ Error:', err)
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus data')
      }
    }
  }

  const toggleStatus = async (item) => {
    const result = await SweetAlert.confirmAction(
      'Ubah Status?',
      `Apakah Anda yakin ingin ${item.status ? 'menonaktifkan' : 'mengaktifkan'} flute ini?`
    )
    
    if (result.isConfirmed) {
      try {
        const newStatus = !item.status
        const statusValue = newStatus ? '1' : '0'
        
        const response = await axios.put(`Admin/Flutes/FlutesEdit/${item.id}`, {
          name: item.name,
          description: item.description,
          status: statusValue
        }, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        if (response.data && response.data.status === 200) {
          const statusText = newStatus ? 'diaktifkan' : 'dinonaktifkan'
          SweetAlert.success('Berhasil!', `Flute "${item.name}" berhasil ${statusText}!`)
          
          setFlutes(flutes.map(model => 
            model.id === item.id ? { 
              ...model, 
              status: newStatus,
              status_bm: statusValue
            } : model
          ))
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal mengubah status')
        }
      } catch (err) {
        console.error('❌ Error:', err)
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengubah status')
      }
    }
  }

  // ===== MODAL CLOSE HANDLERS =====
  const handleCloseAddModal = () => {
    if (!isPosting) {
      setShowAddModal(false)
      resetAddState()
    }
  }

  const handleCloseEditModal = () => {
    if (!isPosting) {
      setShowEditModal(false)
      resetEditState()
    }
  }

  // ===== MODAL FOOTERS =====
  const addModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={handleCloseAddModal}
        disabled={isPosting}
      >
        Batal
      </Button>
      <Button
        variant="primary"
        onClick={handleAddSave}
        loading={isPosting}
        disabled={isPosting}
      >
        {isPosting ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </div>
  )

  const editModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={handleCloseEditModal}
        disabled={isPosting}
      >
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
  )

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat flute settings...</p>
        </div>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              FLUTE Settings
            </h1>
            <p className="text-gray-600 mt-1">Kelola tipe flute untuk produk</p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <CustomIcon icon="mdi:alert-circle" className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <Button
                onClick={fetchFlutes}
                variant="danger"
                className="mt-4"
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ===== MAIN UI DENGAN DESAIN TOKODUS =====
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header dengan judul */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            FLUTE Settings
          </h1>
          <p className="text-gray-600 mt-1">Kelola tipe flute untuk produk</p>
        </div>
        
        <Button
          onClick={handleAddClick}
          variant="primary"
          icon="mdi:plus"
          className="w-full md:w-auto"
        >
          Tambah Flute
        </Button>
      </div>

      {/* Stats Cards Grid - Desain Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:layers-triple" className="text-blue-600" />
              Total Flutes
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.totalFlutes.toLocaleString()}</p>
              <span className="text-sm text-blue-600 font-medium flex items-center">
                <CustomIcon icon="mdi:chart-box" className="w-4 h-4 mr-1" />
                {stats.activeFlutes} active
              </span>
            </div>
            <p className="text-xs text-gray-500">tipe flute tersedia</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:check-circle" className="text-green-600" />
              Active Flutes
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.activeFlutes}</p>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <CustomIcon icon="mdi:check" className="w-4 h-4 mr-1" />
                ready to use
              </span>
            </div>
            <p className="text-xs text-gray-500">flute aktif</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:close-circle" className="text-orange-600" />
              Inactive Flutes
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.inactiveFlutes}</p>
              <span className="text-sm text-orange-600 font-medium flex items-center">
                <CustomIcon icon="mdi:pause" className="w-4 h-4 mr-1" />
                disabled
              </span>
            </div>
            <p className="text-xs text-gray-500">flute nonaktif</p>
          </div>
        </Card>
      </div>

      {/* Flutes Table dengan desain clean */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:clipboard-list-outline" className="text-blue-600" />
              All Flute Types
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.activeFlutes} active, {stats.inactiveFlutes} inactive
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="mdi:filter-variant"
            >
              Filter
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="mdi:refresh"
              onClick={fetchFlutes}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        <Table
          headers={['ID', 'Nama Flute', 'Deskripsi', 'Status', 'Created At', 'Actions']}
          striped
          hoverable
          className="mb-4"
        >
          {flutes.map((flute) => (
            <TableRow key={flute.id} hoverable>
              <TableCell>
                <div className="font-medium text-blue-600">#{flute.id}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900">{flute.name}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 line-clamp-2">{flute.description || 'No description'}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={flute.status ? 'success' : 'danger'}>
                    {flute.status ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    onClick={() => toggleStatus(flute)}
                    className="text-gray-400 hover:text-gray-600"
                    title={flute.status ? 'Set inactive' : 'Set active'}
                  >
                    <CustomIcon icon="mdi:swap-vertical" className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {new Date(flute.createdAt).toLocaleDateString('id-ID')}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleEditClick(flute)}
                    icon="mdi:pencil"
                    className="text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Edit
                  </Button>
                  
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDelete(flute.id, flute.name)}
                    icon="mdi:delete"
                    className="text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>

        {flutes.length === 0 && !loading && (
          <div className="text-center py-8">
            <CustomIcon icon="mdi:layers-off" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-1">Belum ada data flute</p>
            <p className="text-sm text-gray-400 mb-4">
              Tambahkan flute pertama Anda untuk mulai mengelola
            </p>
            <Button
              variant="primary"
              onClick={handleAddClick}
              icon="mdi:plus"
            >
              Tambah Flute Pertama
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {Math.min(10, flutes.length)} of {flutes.length} flutes
          </div>
          <Button
            variant="link"
            icon="mdi:export"
            onClick={() => SweetAlert.info('Export', 'Exporting flute data...')}
          >
            Export Data
          </Button>
        </div>
      </Card>

      {/* ===== MODAL TAMBAH FLUTE ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Tambah Flute Baru"
        size="md"
        footer={addModalFooter}
      >
        <div className="space-y-4">
          <Input
            label="Nama Flute *"
            value={addFormData.name}
            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            placeholder="Contoh: Single Flute, Double Flute, dll"
            className="text-gray-600"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi *
            </label>
            <textarea
              value={addFormData.description}
              onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border text-gray-600 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Deskripsi flute..."
              required
            />
          </div>

          <Select
            label="Status"
            value={addFormData.status}
            onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
            options={[
              { value: '1', label: 'Active' },
              { value: '0', label: 'Inactive' }
            ]}
          />
        </div>
      </Modal>

      {/* ===== MODAL EDIT FLUTE ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit Flute"
        size="md"
        footer={editModalFooter}
      >
        {editingItem && (
          <div className="space-y-4">
            <Input
              label="Nama Flute *"
              value={editingItem.name}
              onChange={(e) => setEditingItem({
                ...editingItem,
                name: e.target.value
              })}
              placeholder="Masukkan nama flute"
              className="text-gray-600"
              required
              disabled={isPosting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi *
              </label>
              <textarea
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  description: e.target.value
                })}
                rows={3}
                className="w-full px-4 py-2.5 border text-gray-600 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan deskripsi flute..."
                disabled={isPosting}
                required
              />
            </div>

            <Select
              label="Status"
              value={editingItem.status_bm}
              onChange={(e) => setEditingItem({
                ...editingItem,
                status_bm: e.target.value
              })}
              options={[
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' }
              ]}
              disabled={isPosting}
            />

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Info:</strong> ID: {editingItem.id}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}