'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from '../../../lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'
import SweetAlert from '@/components/UI/SweetAlert'
import { Table, TableRow, TableCell } from '@/components/UI/Table'

export default function FlutesPage() {
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
    code: '',
    name: ''
  })

  // Stats untuk dashboard
  const [stats, setStats] = useState({
    totalFlutes: 0,
    bFlute: 0,
    cFlute: 0,
    cbFlute: 0,
    ebFlute: 0,
    others: 0
  })

  // Mapping flute type untuk auto-generate name
  const fluteTypeMap = {
    'B': 'B-Flute',
    'C': 'C-Flute',
    'CB': 'CB-Flute',
    'BC': 'BC-Flute',
    'EB': 'EB-Flute',
    'E': 'E-Flute',
    'A': 'A-Flute',
    'F': 'F-Flute'
  }

  // ===== FETCH DATA =====
  const fetchFlutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/Admin/Flutes/Flutes', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('====== FETCH FLUTES RESPONSE ======')
      console.log('Response:', response)
      console.log('Response data:', response.data)
      console.log('Response status:', response.data?.status)
      console.log('===================================')
      
      // Handle berbagai format response
      if (response.data) {
        // Case 1: Response dengan status 200 dan data array
        if (response.data.status === 200 && Array.isArray(response.data.data)) {
          const processedFlutes = response.data.data.map(item => ({
            id: item.id_f?.toString() || '',
            code: item.code || '',
            name: item.name || '',
            createdAt: item.created_at || new Date().toISOString().split('T')[0],
            updatedAt: item.updated_at || new Date().toISOString().split('T')[0]
          }))
          
          setFlutes(processedFlutes)
          
          // Hitung stats
          const totalFlutes = processedFlutes.length
          const bFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'B').length
          const cFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'C').length
          const cbFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'CB' || f.code.toUpperCase() === 'BC').length
          const ebFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'EB' || f.code.toUpperCase() === 'E').length
          const others = processedFlutes.filter(f => {
            const code = f.code.toUpperCase()
            return !['B', 'C', 'CB', 'BC', 'EB', 'E'].includes(code)
          }).length
          
          setStats({
            totalFlutes,
            bFlute,
            cFlute,
            cbFlute,
            ebFlute,
            others
          })
        }
        // Case 2: Response langsung array
        else if (Array.isArray(response.data)) {
          const processedFlutes = response.data.map(item => ({
            id: item.id_f?.toString() || '',
            code: item.code || '',
            name: item.name || '',
            createdAt: item.created_at || new Date().toISOString().split('T')[0],
            updatedAt: item.updated_at || new Date().toISOString().split('T')[0]
          }))
          
          setFlutes(processedFlutes)
          
          const totalFlutes = processedFlutes.length
          const bFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'B').length
          const cFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'C').length
          const cbFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'CB' || f.code.toUpperCase() === 'BC').length
          const ebFlute = processedFlutes.filter(f => f.code.toUpperCase() === 'EB' || f.code.toUpperCase() === 'E').length
          const others = processedFlutes.filter(f => {
            const code = f.code.toUpperCase()
            return !['B', 'C', 'CB', 'BC', 'EB', 'E'].includes(code)
          }).length
          
          setStats({
            totalFlutes,
            bFlute,
            cFlute,
            cbFlute,
            ebFlute,
            others
          })
        }
        // Case 3: Response kosong tapi success
        else if (response.data.status === 200 && (!response.data.data || response.data.data.length === 0)) {
          setFlutes([])
          setStats({
            totalFlutes: 0,
            bFlute: 0,
            cFlute: 0,
            cbFlute: 0,
            ebFlute: 0,
            others: 0
          })
        }
        // Case 4: Response dengan message "success" atau text lain (data kosong)
        else if (typeof response.data === 'string' || response.data.message === 'success') {
          console.log('⚠️ Data kosong atau response tidak standar')
          setFlutes([])
          setStats({
            totalFlutes: 0,
            bFlute: 0,
            cFlute: 0,
            cbFlute: 0,
            ebFlute: 0,
            others: 0
          })
        }
        // Case 5: Format tidak dikenali
        else {
          console.warn('⚠️ Format response tidak dikenali:', response.data)
          setFlutes([])
          setStats({
            totalFlutes: 0,
            bFlute: 0,
            cFlute: 0,
            cbFlute: 0,
            ebFlute: 0,
            others: 0
          })
        }
      } else {
        setFlutes([])
      }
      
    } catch (err) {
      console.error('❌ Error fetching flutes:', err)
      console.error('❌ Error response:', err.response?.data)
      
      // Jika error 404 atau data tidak ditemukan, set empty array (bukan error)
      if (err.response?.status === 404 || err.response?.status === 204) {
        console.log('ℹ️ Data tidak ditemukan, menampilkan table kosong')
        setFlutes([])
        setStats({
          totalFlutes: 0,
          bFlute: 0,
          cFlute: 0,
          cbFlute: 0,
          ebFlute: 0,
          others: 0
        })
        setError(null) // Clear error
      } else {
        setError(err.response?.data?.message || 'Tidak bisa connect ke server')
      }
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
      code: '',
      name: ''
    })
  }

  // ===== AUTO GENERATE NAME =====
  const handleCodeChange = (value) => {
    const upperCode = value.toUpperCase()
    const autoName = fluteTypeMap[upperCode] || `${upperCode}-Flute`
    
    setAddFormData({
      code: upperCode,
      name: autoName
    })
  }

  const handleEditCodeChange = (value) => {
    const upperCode = value.toUpperCase()
    const autoName = fluteTypeMap[upperCode] || `${upperCode}-Flute`
    
    setEditingItem({
      ...editingItem,
      code: upperCode,
      name: autoName
    })
  }

  // ===== HANDLERS =====
  const handleAddClick = () => {
    setAddFormData({
      code: '',
      name: ''
    })
    setShowAddModal(true)
  }

  const handleAddSave = async () => {
    if (!addFormData.code.trim()) {
      SweetAlert.error('Validasi Error', 'Kode tidak boleh kosong')
      return
    }
    
    if (!addFormData.name.trim()) {
      SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong')
      return
    }
    
    // Check if code already exists
    const isDuplicate = flutes.some(
      flute => flute.code.toUpperCase() === addFormData.code.trim().toUpperCase()
    )
    
    if (isDuplicate) {
      SweetAlert.error('Kode Sudah Ada!', `Kode "${addFormData.code}" sudah terdaftar. Gunakan kode lain.`)
      return
    }
    
    try {
      setIsPosting(true)
      
      // Data yang akan dikirim
      const requestData = {
        code: addFormData.code.trim(),
        name: addFormData.name.trim()
      }
      
      console.log('====== ADD FLUTE REQUEST ======')
      console.log('URL:', '/Admin/Flutes/FlutesAdd')
      console.log('Method:', 'POST')
      console.log('Data:', requestData)
      console.log('================================')
      
      const response = await axios.post('/Admin/Flutes/FlutesAdd', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('====== ADD FLUTE RESPONSE ======')
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      console.log('================================')
      
      if (response.data && response.data.status === 200) {
        await SweetAlert.success('Berhasil!', 'Flute berhasil ditambahkan!')
        setShowAddModal(false)
        resetAddState()
        await fetchFlutes()
      } else {
        const errorMessage = response.data?.message || 'Gagal menambahkan Flute'
        SweetAlert.error('Gagal!', errorMessage)
      }
    } catch (err) {
      console.error('====== ADD FLUTE ERROR ======')
      console.error('Error:', err)
      console.error('Response:', err.response)
      console.error('Response Data:', err.response?.data)
      console.error('Response Status:', err.response?.status)
      console.error('Request Config:', err.config)
      console.error('============================')
      
      let errorMessage = 'Terjadi kesalahan saat menyimpan data'
      
      // Check for duplicate entry error
      if (err.response?.status === 500) {
        const responseText = err.response?.data
        if (typeof responseText === 'string' && responseText.includes('Duplicate entry')) {
          // Extract the duplicate key from error message
          const match = responseText.match(/Duplicate entry '([^']+)'/)
          const duplicateValue = match ? match[1] : addFormData.code
          errorMessage = `Kode "${duplicateValue}" sudah terdaftar. Silakan gunakan kode lain.`
        } else if (err.response?.data?.message) {
          errorMessage = 'Error server: ' + err.response.data.message
        } else {
          errorMessage = 'Error server: Gagal menyimpan Flute'
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.status === 400) {
        errorMessage = 'Validasi gagal: ' + (err.response?.data?.message || 'Beberapa data wajib belum diisi')
      }
      
      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  const handleEditClick = async (item) => {
    try {
      const response = await axios.get(`/Admin/Flutes/FlutesByid/${item.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200 && response.data.data) {
        const data = response.data.data
        setEditingItem({
          id: data.id_f?.toString() || item.id,
          code: data.code || item.code,
          name: data.name || item.name
        })
        setShowEditModal(true)
      } else {
        setEditingItem({ ...item })
        setShowEditModal(true)
      }
      
    } catch (err) {
      console.error('❌ Error loading flute for edit:', err)
      setEditingItem({ ...item })
      setShowEditModal(true)
    }
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    
    if (!editingItem.code.trim()) {
      SweetAlert.error('Validasi Error', 'Kode tidak boleh kosong')
      return
    }
    
    if (!editingItem.name.trim()) {
      SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong')
      return
    }
    
    // Check if new code already exists (excluding current item)
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
      
      // Data yang akan dikirim
      const requestData = {
        code: editingItem.code.trim(),
        name: editingItem.name.trim()
      }
      
      console.log('====== EDIT FLUTE REQUEST ======')
      console.log('URL:', `/Admin/Flutes/FlutesEdit/${editingItem.id}`)
      console.log('Method:', 'PUT')
      console.log('Data:', requestData)
      console.log('================================')
      
      const response = await axios.put(`/Admin/Flutes/FlutesEdit/${editingItem.id}`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('====== EDIT FLUTE RESPONSE ======')
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      console.log('================================')
      
      if (response.data && response.data.status === 200) {
        await SweetAlert.success('Berhasil!', 'Flute berhasil diperbarui!')
        setShowEditModal(false)
        resetEditState()
        await fetchFlutes()
      } else {
        const errorMsg = response.data?.message || 'Gagal mengupdate data'
        SweetAlert.error('Gagal!', errorMsg)
      }
      
    } catch (err) {
      console.error('====== EDIT FLUTE ERROR ======')
      console.error('Error:', err)
      console.error('Response:', err.response)
      console.error('Response Data:', err.response?.data)
      console.error('Response Status:', err.response?.status)
      console.error('Request Config:', err.config)
      console.error('============================')
      
      let errorMessage = 'Terjadi kesalahan saat mengupdate data'
      
      // Check for duplicate entry error
      if (err.response?.status === 500) {
        const responseText = err.response?.data
        if (typeof responseText === 'string' && responseText.includes('Duplicate entry')) {
          // Extract the duplicate key from error message
          const match = responseText.match(/Duplicate entry '([^']+)'/)
          const duplicateValue = match ? match[1] : editingItem.code
          errorMessage = `Kode "${duplicateValue}" sudah digunakan oleh flute lain. Silakan gunakan kode lain.`
        } else if (err.response?.data?.message) {
          errorMessage = 'Error server: ' + err.response.data.message
        } else {
          errorMessage = 'Error server: Gagal mengupdate Flute'
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.status === 400) {
        errorMessage = 'Validasi gagal: ' + (err.response?.data?.message || 'Beberapa data wajib belum diisi')
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
        console.log('====== DELETE FLUTE REQUEST ======')
        console.log('URL:', `/Admin/Flutes/FlutesDel/${id}`)
        console.log('Method:', 'DELETE')
        console.log('==================================')
        
        const response = await axios.delete(`/Admin/Flutes/FlutesDel/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        console.log('====== DELETE FLUTE RESPONSE ======')
        console.log('Status:', response.status)
        console.log('Data:', response.data)
        console.log('===================================')
        
        if (response.data && response.data.status === 200) {
          await SweetAlert.success('Dihapus!', `Flute "${name}" berhasil dihapus!`)
          await fetchFlutes()
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus Flute')
        }
      } catch (err) {
        console.error('====== DELETE FLUTE ERROR ======')
        console.error('Error:', err)
        console.error('Response:', err.response?.data)
        console.error('================================')
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus data')
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

  // ===== GET FLUTE BADGE VARIANT =====
  const getFluteBadgeVariant = (code) => {
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

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat flutes...</p>
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
              Flutes
            </h1>
            <p className="text-gray-600 mt-1">Kelola jenis flute untuk box</p>
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
            Flutes
          </h1>
          <p className="text-gray-600 mt-1">Kelola jenis flute untuk box corrugated</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:layers" className="text-blue-600" />
              Total Flutes
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.totalFlutes}</p>
              <span className="text-sm text-blue-600 font-medium flex items-center">
                <CustomIcon icon="mdi:chart-box" className="w-4 h-4 mr-1" />
                types
              </span>
            </div>
            <p className="text-xs text-gray-500">jenis flute tersedia</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:alpha-b-box" className="text-blue-600" />
              B-Flute
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.bFlute}</p>
            </div>
            <p className="text-xs text-gray-500">ketebalan ~3mm</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:alpha-c-box" className="text-green-600" />
              C-Flute
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.cFlute}</p>
            </div>
            <p className="text-xs text-gray-500">ketebalan ~4mm</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:layers-triple" className="text-orange-600" />
              CB/BC-Flute
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.cbFlute}</p>
            </div>
            <p className="text-xs text-gray-500">double wall</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:package-variant" className="text-purple-600" />
              Others
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.ebFlute + stats.others}</p>
            </div>
            <p className="text-xs text-gray-500">E, EB, A, F, dll</p>
          </div>
        </Card>
      </div>

      {/* Flutes Table dengan desain clean */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:clipboard-list-outline" className="text-blue-600" />
              All Flutes
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalFlutes} jenis flute terdaftar
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
          headers={['Kode', 'Nama Flute', 'Actions']}
          striped
          hoverable
          className="mb-4"
        >
          {flutes.map((flute) => (
            <TableRow key={flute.id} hoverable>
              <TableCell>
                <Badge variant={getFluteBadgeVariant(flute.code)} className="text-lg font-bold">
                  {flute.code}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900">{flute.name}</div>
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

        {flutes.length === 0 && (
          <div className="text-center py-12">
            <CustomIcon icon="mdi:layers-off" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Belum ada data flute</p>
            <p className="text-sm text-gray-400 mb-6">Tambahkan flute pertama untuk memulai</p>
            <Button
              variant="primary"
              onClick={handleAddClick}
              icon="mdi:plus"
            >
              Tambah Flute Pertama
            </Button>
          </div>
        )}

        {flutes.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {Math.min(10, flutes.length)} of {flutes.length} flutes
            </div>
            <Button
              variant="link"
              icon="mdi:export"
              onClick={() => SweetAlert.info('Export', 'Exporting flutes data...')}
            >
              Export Data
            </Button>
          </div>
        )}
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
          <div>
            <Input
              label="Kode Flute *"
              value={addFormData.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Contoh: B, C, CB, BC, EB"
              required
              helperText="Masukkan kode flute (B, C, CB, BC, EB, E, A, F, dll)"
              className="text-gray-700 uppercase"
              maxLength={3}
            />
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              <CustomIcon icon="mdi:information" className="w-4 h-4" />
              Nama akan otomatis terisi berdasarkan kode yang diinput
            </p>
          </div>

          <Input
            label="Nama Flute *"
            value={addFormData.name}
            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            placeholder="Contoh: C-Flute"
            required
            className="text-gray-700"
            helperText="Nama otomatis terisi, tetapi bisa diubah jika perlu"
          />

          {addFormData.code && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Preview:</h4>
                  <p className="text-sm text-blue-700">
                    Kode: <strong>{addFormData.code}</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    Nama: <strong>{addFormData.name}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
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
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                ID: <strong className="text-gray-900">{editingItem.id}</strong>
              </p>
            </div>

            <div>
              <Input
                label="Kode Flute *"
                value={editingItem.code}
                onChange={(e) => handleEditCodeChange(e.target.value)}
                placeholder="Contoh: B, C, CB, BC, EB"
                required
                className="text-gray-700 uppercase"
                maxLength={3}
                disabled={isPosting}
              />
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <CustomIcon icon="mdi:information" className="w-4 h-4" />
                Nama akan otomatis terisi berdasarkan kode yang diinput
              </p>
            </div>

            <Input
              label="Nama Flute *"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              placeholder="Contoh: C-Flute"
              required
              className="text-gray-700"
              disabled={isPosting}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Preview Perubahan:</h4>
                  <p className="text-sm text-blue-700">
                    Kode: <strong>{editingItem.code}</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    Nama: <strong>{editingItem.name}</strong>
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