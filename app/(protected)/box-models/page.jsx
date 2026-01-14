// app/(protected)/box-models/page.jsx
'use client'

import { useState, useEffect } from 'react'
import axios from '../../../lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'
import Swal from 'sweetalert2'

export default function BoxModelsPage() {
  const [boxModels, setBoxModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFormulaModal, setShowFormulaModal] = useState(false)
  const [editingFormulaComponents, setEditingFormulaComponents] = useState([])
  const [isPosting, setIsPosting] = useState(false)
  
  // State untuk modal Add
  const [addFormData, setAddFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'Mailer Box',
    status_bm: '1'
  })

  // ===== SWEETALERT CONFIG =====
  const showSuccessAlert = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#10B981',
      confirmButtonText: 'OK',
      timer: 3000,
      timerProgressBar: true,
    })
  }

  const showErrorAlert = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'OK',
    })
  }

  const showConfirmDelete = () => {
    return Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true
    })
  }

  const showConfirmStatus = (status) => {
    return Swal.fire({
      title: 'Ubah Status?',
      text: `Apakah Anda yakin ingin ${status ? 'menonaktifkan' : 'mengaktifkan'} box model ini?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, ubah',
      cancelButtonText: 'Batal',
      reverseButtons: true
    })
  }

  // ===== FETCH DATA =====
  const fetchBoxModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching box models...')
      
      const response = await axios.get('/Admin/Box/boxModels', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('✅ Response:', response)
      console.log('📊 Response data:', response.data)
      
      if (response.data && response.data.status === 200) {
        if (Array.isArray(response.data.data)) {
          const transformedData = response.data.data.map(item => ({
            id: item.id_bm?.toString() || '1',
            kode: item.code || '',
            namaModel: item.name || '',
            deskripsi: item.description || '',
            status: item.status_bm === '1' || item.status_bm === 1,
            status_bm: item.status_bm?.toString(),
            createdAt: item.created_at || new Date().toISOString().split('T')[0],
            updatedAt: item.updated_at || new Date().toISOString().split('T')[0],
            formulaComponents: item.formula_components || [],
            category: item.category || 'Mailer Box'
          }))
          
          console.log('🔄 Transformed data:', transformedData)
          setBoxModels(transformedData)
        } else {
          console.warn('Data bukan array:', response.data.data)
          setBoxModels([])
        }
      } else {
        setError(response.data?.message || 'Format response tidak sesuai')
      }
      
    } catch (err) {
      console.error('❌ Error:', err)
      
      if (err.response) {
        console.error('Response error:', err.response.status, err.response.data)
        setError(`Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`)
      } else if (err.request) {
        console.error('Network error:', err.request)
        setError('Tidak bisa connect ke server')
      } else {
        console.error('Setup error:', err.message)
        setError(`Error: ${err.message}`)
      }
      
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoxModels()
  }, [])

  // ===== GENERATE CODE =====
  const generateCode = () => {
    if (boxModels.length > 0) {
      const lastCode = boxModels[boxModels.length - 1].kode
      if (lastCode && /^\d+$/.test(lastCode)) {
        const lastNum = parseInt(lastCode)
        return (lastNum + 1).toString().padStart(6, '0')
      }
    }
    
    const timestamp = Date.now().toString().slice(-6)
    return timestamp.padStart(6, '0')
  }

  // ===== HANDLERS =====
  const handleAddClick = () => {
    const generatedCode = generateCode()
    setAddFormData({
      code: generatedCode,
      name: '',
      description: '',
      category: 'Mailer Box',
      status_bm: '1'
    })
    setShowAddModal(true)
  }

  const handleAddSave = async () => {
    if (!addFormData.code.trim()) {
      showErrorAlert('Validasi Error', 'Kode tidak boleh kosong')
      return
    }
    
    if (!addFormData.name.trim()) {
      showErrorAlert('Validasi Error', 'Nama model tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      const postData = {
        code: addFormData.code.trim(),
        name: addFormData.name.trim(),
        description: addFormData.description.trim() || '',
        category: addFormData.category.trim(),
        status_bm: addFormData.status_bm
      }
      
      console.log('📤 Mengirim data ke API:', postData)
      
      const response = await axios.post('/Admin/Box/boxModels', postData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200) {
        showSuccessAlert('Berhasil!', 'Box Model berhasil ditambahkan!')
        setShowAddModal(false)
        await fetchBoxModels()
        setAddFormData({
          code: '',
          name: '',
          description: '',
          category: 'Mailer Box',
          status_bm: '1'
        })
      } else {
        const errorMessage = response.data?.message || 'Gagal menambahkan Box Model'
        showErrorAlert('Gagal!', errorMessage)
      }
    } catch (err) {
      console.error('❌ Error saat POST:', err)
      showErrorAlert('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  const handleEditClick = (item) => {
    setEditingItem({ 
      ...item,
      status_bm: item.status ? '1' : '0'
    })
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    
    if (!editingItem.kode.trim()) {
      showErrorAlert('Validasi Error', 'Kode tidak boleh kosong')
      return
    }
    
    if (!editingItem.namaModel.trim()) {
      showErrorAlert('Validasi Error', 'Nama tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      const updateData = {
        id_bm: editingItem.id,
        code: editingItem.kode.trim(),
        name: editingItem.namaModel.trim(),
        description: editingItem.deskripsi?.trim() || '',
        status_bm: editingItem.status_bm,
        category: editingItem.category || 'Mailer Box'
      }
      
      console.log('📤 Mengirim data update ke API:', updateData)
      
      // Simulasi update untuk sekarang (ganti dengan API call sebenarnya)
      const response = await axios.put(`/Admin/Box/boxModels/${editingItem.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200) {
        showSuccessAlert('Berhasil!', 'Box Model berhasil diupdate!')
        await fetchBoxModels()
        setShowEditModal(false)
      } else {
        showErrorAlert('Gagal!', response.data?.message || 'Gagal mengupdate Box Model')
      }
      
    } catch (err) {
      console.error('Error updating box model:', err)
      showErrorAlert('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  const handleFormulaClick = (item) => {
    try {
      setEditingItem({ ...item })
      setEditingFormulaComponents([...item.formulaComponents])
      setShowFormulaModal(true)
    } catch (err) {
      console.error('Error loading formula components:', err)
      setEditingItem({ ...item })
      setEditingFormulaComponents([...item.formulaComponents])
      setShowFormulaModal(true)
    }
  }

  const handleFormulaSave = async () => {
    if (!editingItem) return

    try {
      // Simpan formula ke API
      const response = await axios.put(`/Admin/Box/boxModels/${editingItem.id}/formula`, {
        formulaComponents: editingFormulaComponents
      }, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200) {
        showSuccessAlert('Berhasil!', 'Formula berhasil disimpan!')
        await fetchBoxModels()
        setShowFormulaModal(false)
        setEditingItem(null)
        setEditingFormulaComponents([])
      } else {
        showErrorAlert('Gagal!', response.data?.message || 'Gagal menyimpan formula')
      }
    } catch (err) {
      console.error('Error saving formula components:', err)
      showErrorAlert('Error!', 'Terjadi kesalahan saat menyimpan formula')
    }
  }

  const handleDelete = async (id, name) => {
    const result = await showConfirmDelete()
    
    if (result.isConfirmed) {
      try {
        // Hapus data melalui API
        const response = await axios.delete(`/Admin/Box/boxModels/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        if (response.data && response.data.status === 200) {
          showSuccessAlert('Dihapus!', `Box Model "${name}" berhasil dihapus!`)
          await fetchBoxModels()
        } else {
          showErrorAlert('Gagal!', response.data?.message || 'Gagal menghapus Box Model')
        }
      } catch (err) {
        console.error('Error:', err)
        showErrorAlert('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus data')
      }
    }
  }

  const toggleStatus = async (item) => {
    const result = await showConfirmStatus(item.status)
    
    if (result.isConfirmed) {
      try {
        const newStatus = !item.status
        const statusValue = newStatus ? '1' : '0'
        
        // Update status melalui API
        const response = await axios.patch(`/Admin/Box/boxModels/${item.id}/status`, {
          status_bm: statusValue
        }, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        if (response.data && response.data.status === 200) {
          const statusText = newStatus ? 'diaktifkan' : 'dinonaktifkan'
          showSuccessAlert('Berhasil!', `Box Model "${item.namaModel}" berhasil ${statusText}!`)
          
          // Update state lokal
          setBoxModels(boxModels.map(model => 
            model.id === item.id ? { 
              ...model, 
              status: newStatus,
              status_bm: statusValue
            } : model
          ))
        } else {
          showErrorAlert('Gagal!', response.data?.message || 'Gagal mengubah status')
        }
      } catch (err) {
        console.error('Error:', err)
        showErrorAlert('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengubah status')
      }
    }
  }

  // Formula component handlers
  const addFormulaComponent = () => {
    const newComponent = {
      id: `COMP${Date.now()}`,
      boxModelId: editingItem?.id || '',
      target: 'panjang',
      source: 'A',
      multiplier: 0,
      allowanceMm: 0,
      sortOrder: editingFormulaComponents.length + 1
    }
    setEditingFormulaComponents([...editingFormulaComponents, newComponent])
  }

  const updateFormulaComponent = (index, field, value) => {
    const updated = [...editingFormulaComponents]
    updated[index] = { ...updated[index], [field]: value }
    setEditingFormulaComponents(updated)
  }

  const removeFormulaComponent = (index) => {
    const updated = editingFormulaComponents.filter((_, i) => i !== index)
    updated.forEach((comp, i) => {
      comp.sortOrder = i + 1
    })
    setEditingFormulaComponents(updated)
  }

  const generateFormulaPreview = (target) => {
    const components = editingFormulaComponents.filter(c => c.target === target)
    if (components.length === 0) return null

    const formulaParts = components.map(comp => {
      if (comp.source) {
        return `(${comp.source}×${comp.multiplier} + ${comp.allowanceMm}mm)`
      }
      return `${comp.allowanceMm}mm`
    })

    return formulaParts.join(' + ')
  }

  // ===== MODAL FOOTERS =====
  const addModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => !isPosting && setShowAddModal(false)}
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
        onClick={() => setShowEditModal(false)}
      >
        Batal
      </Button>
      <Button
        variant="primary"
        onClick={handleEditSave}
        loading={isPosting}
      >
        Update
      </Button>
    </div>
  )

  const formulaModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setShowFormulaModal(false)}
      >
        Batal
      </Button>
      <Button
        variant="primary"
        onClick={handleFormulaSave}
      >
        Simpan Formula
      </Button>
    </div>
  )

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading box models...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Box Models</h1>
            <p className="text-gray-600 mt-2">
              Kelola model kotak dan rumus perhitungan dimensi
            </p>
          </div>
          
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <CustomIcon icon="mdi:alert-circle" className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <Button
                  onClick={fetchBoxModels}
                  variant="danger"
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ===== MAIN UI =====
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CustomIcon icon="mdi:package-variant" className="w-8 h-8" />
                Box Models
              </h1>
              <p className="opacity-90 mt-1">
                Kelola model kotak dan rumus perhitungan dimensi
              </p>
              <p className="text-sm opacity-80 mt-2">
                Total: {boxModels.length} models | Active: {boxModels.filter(m => m.status).length}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={handleAddClick}
                variant="success"
                icon="mdi:plus"
              >
                Tambah Model
              </Button>
            </div>
          </div>
        </Card>

        {/* Box Models Grid */}
        {boxModels.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <CustomIcon icon="mdi:package-variant-plus" className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Box Models Found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first box model.</p>
            <Button onClick={handleAddClick} variant="primary" icon="mdi:plus">
              Create First Model
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boxModels.map((model) => (
              <Card key={model.id} hoverable className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge variant={
                        model.category === 'Mailer Box' ? 'primary' :
                        model.category === 'Shoe Box' ? 'success' :
                        model.category === 'Food Box' ? 'warning' :
                        model.category === 'Premium Box' ? 'info' : 'gray'
                      }>
                        {model.category || 'Uncategorized'}
                      </Badge>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">
                        {model.namaModel}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Code: <span className="font-mono">{model.kode}</span>
                      </p>
                    </div>
                    <div 
                      className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer ${
                        model.status ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      onClick={() => toggleStatus(model)}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        model.status ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {model.deskripsi || 'No description'}
                  </p>

                  {/* Formula Components */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Formula Components:
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">Panjang:</span>
                        <span className="text-gray-900 font-medium">
                          {model.formulaComponents
                            ?.filter(c => c.target === 'panjang')
                            .map(c => c.source ? `${c.source}×${c.multiplier} + ${c.allowanceMm}mm` : `${c.allowanceMm}mm`)
                            .join(' + ') || 'No formula'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">Lebar:</span>
                        <span className="text-gray-900 font-medium">
                          {model.formulaComponents
                            ?.filter(c => c.target === 'lebar')
                            .map(c => c.source ? `${c.source}×${c.multiplier} + ${c.allowanceMm}mm` : `${c.allowanceMm}mm`)
                            .join(' + ') || 'No formula'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(model)}
                        icon="mdi:pencil"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFormulaClick(model)}
                        icon="mdi:calculator"
                      >
                        Formula
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(model.id, model.namaModel)}
                      icon="mdi:delete"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ===== MODAL TAMBAH BOX MODEL ===== */}
        <Modal
          isOpen={showAddModal}
          onClose={() => !isPosting && setShowAddModal(false)}
          title="Tambah Box Model Baru"
          size="md"
          footer={addModalFooter}
        >
          <div className="space-y-4">
            <Input
              label="Kode *"
              value={addFormData.code}
              onChange={(e) => setAddFormData({ ...addFormData, code: e.target.value })}
              required
              helperText="Kode akan digenerate otomatis"
              disabled
              className="bg-gray-100 cursor-not-allowed text-gray-500"
            />

            <Input
              label="Nama Model *"
              value={addFormData.name}
              onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
              placeholder="Masukan Nama Model"
              className="text-gray-700"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border text-gray-700 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Deskripsi model kotak..."
              />
            </div>
          </div>
        </Modal>

        {/* ===== MODAL EDIT BOX MODEL ===== */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Box Model"
          size="lg"
          footer={editModalFooter}
        >
          {editingItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Kode *"
                  value={editingItem.kode}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    kode: e.target.value
                  })}
                  placeholder="000001, MAILER001, etc"
                  className="text-gray-700"
                  required
                />
                
                <Input
                  label="Nama Model *"
                  value={editingItem.namaModel}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    namaModel: e.target.value
                  })}
                  required
                  className="text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={editingItem.deskripsi}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    deskripsi: e.target.value
                  })}
                  rows={3}
                  className="w-full px-4 py-2.5 border text-gray-700 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description..."
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
                className="text-gray-700"
              />
            </div>
          )}
        </Modal>

        {/* ===== MODAL FORMULA BOX MODEL ===== */}
        <Modal
          isOpen={showFormulaModal}
          onClose={() => setShowFormulaModal(false)}
          title={editingItem ? `Formula: ${editingItem.namaModel}` : 'Formula Box Model'}
          size="xl"
          footer={formulaModalFooter}
        >
          {editingItem && (
            <div>
              {/* Info Box Model */}
              <Card className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                    <CustomIcon icon="mdi:calculator" className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{editingItem.namaModel}</h3>
                    <p className="text-sm text-gray-500">Code: {editingItem.kode} | Category: {editingItem.category}</p>
                  </div>
                </div>
              </Card>

              {/* Formula Components Section */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Formula Components
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Define formula calculations for Length and Width
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addFormulaComponent}
                    variant="success"
                    icon="mdi:plus"
                  >
                    Add Component
                  </Button>
                </div>

                {/* Formula Components List */}
                <div className="space-y-4">
                  {editingFormulaComponents.map((component, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-medium text-gray-700">
                          Component #{index + 1}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeFormulaComponent(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          icon="mdi:close"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Select
                          label="Target"
                          value={component.target}
                          onChange={(e) => updateFormulaComponent(index, 'target', e.target.value)}
                          options={[
                            { value: 'panjang', label: 'Length' },
                            { value: 'lebar', label: 'Width' }
                          ]}
                        />

                        <Select
                          label="Source"
                          value={component.source || ''}
                          onChange={(e) => updateFormulaComponent(index, 'source', e.target.value || null)}
                          options={[
                            { value: '', label: 'None' },
                            { value: 'A', label: 'A (Width)' },
                            { value: 'B', label: 'B (Length)' },
                            { value: 'C', label: 'C (Height)' },
                            { value: 'P', label: 'P' },
                            { value: 'L', label: 'L' }
                          ]}
                        />

                        <Input
                          label="Multiplier"
                          type="number"
                          step="0.5"
                          value={component.multiplier}
                          onChange={(e) => updateFormulaComponent(index, 'multiplier', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />

                        <Input
                          label="Allowance (mm)"
                          type="number"
                          value={component.allowanceMm}
                          onChange={(e) => updateFormulaComponent(index, 'allowanceMm', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>

                      {component.source && (
                        <div className="mt-3 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                          Formula: {component.source} × {component.multiplier} + {component.allowanceMm}mm
                        </div>
                      )}
                    </Card>
                  ))}

                  {editingFormulaComponents.length === 0 && (
                    <Card className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <CustomIcon icon="mdi:calculator-off" className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 mb-1">No formula components</p>
                      <p className="text-sm text-gray-400">
                        Add components to define calculation formulas
                      </p>
                    </Card>
                  )}
                </div>

                {/* Formula Preview */}
                {editingFormulaComponents.length > 0 && (
                  <Card className="mt-6 border-blue-200 bg-blue-50">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">
                      Formula Preview
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-blue-700 mb-1">Length:</div>
                        <div className="text-sm text-blue-600 bg-white p-3 rounded-lg border border-blue-100">
                          {generateFormulaPreview('panjang') || 'No components'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-blue-700 mb-1">Width:</div>
                        <div className="text-sm text-blue-600 bg-white p-3 rounded-lg border border-blue-100">
                          {generateFormulaPreview('lebar') || 'No components'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-500 pt-3 border-t border-blue-200">
                      <p><strong>Input Reference:</strong></p>
                      <p>• A = Width (Excel input A4)</p>
                      <p>• B = Length (Excel input B4)</p>
                      <p>• C = Height (Excel input C3)</p>
                      <p>• P & L = Special dimensions for Mailer</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}