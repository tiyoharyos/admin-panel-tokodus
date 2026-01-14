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
import { useSweetAlert } from '@/hooks/useSweetAlert'

export default function BoxModelsPage() {
  const { showAlert } = useSweetAlert()
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

  // ===== FETCH DATA =====
  const fetchBoxModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/Admin/Box/boxModels', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
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
          
          setBoxModels(transformedData)
        } else {
          setBoxModels([])
        }
      } else {
        setError(response.data?.message || 'Format response tidak sesuai')
      }
      
    } catch (err) {
      console.error('❌ Error:', err)
      
      if (err.response) {
        setError(`Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`)
      } else if (err.request) {
        setError('Tidak bisa connect ke server')
      } else {
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
    // Validasi form
    if (!addFormData.code.trim()) {
      await showAlert('error', {
        title: 'Kode Kosong',
        text: 'Kode tidak boleh kosong'
      })
      return
    }
    
    if (!addFormData.name.trim()) {
      await showAlert('error', {
        title: 'Nama Kosong',
        text: 'Nama model tidak boleh kosong'
      })
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
      
      // Kirim POST request ke API
      const response = await axios.post('/Admin/Box/boxModels', postData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200) {
        await showAlert('success', {
          title: 'Sukses!',
          text: 'Box Model berhasil ditambahkan!',
          timer: 2000,
          showConfirmButton: false
        })
        
        // Reset form dan close modal
        setShowAddModal(false)
        setAddFormData({
          code: '',
          name: '',
          description: '',
          category: 'Mailer Box',
          status_bm: '1'
        })
        
        // Refresh data
        await fetchBoxModels()
        
      } else {
        const errorMessage = response.data?.message || 'Gagal menambahkan Box Model'
        await showAlert('error', {
          title: 'Gagal',
          text: errorMessage
        })
      }
    } catch (err) {
      console.error('❌ Error saat POST:', err)
      await showAlert('error', {
        title: 'Error',
        text: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data'
      })
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
    
    // Validasi form
    if (!editingItem.kode.trim()) {
      await showAlert('error', {
        title: 'Kode Kosong',
        text: 'Kode tidak boleh kosong'
      })
      return
    }
    
    if (!editingItem.namaModel.trim()) {
      await showAlert('error', {
        title: 'Nama Kosong',
        text: 'Nama tidak boleh kosong'
      })
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
      
      // Kirim update request (simulasi)
      // const response = await axios.put(`/Admin/Box/boxModels/${editingItem.id}`, updateData)
      
      // Simulasi update lokal untuk testing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update lokal
      setBoxModels(boxModels.map(model => 
        model.id === editingItem.id ? {
          ...model,
          kode: editingItem.kode.trim(),
          namaModel: editingItem.namaModel.trim(),
          deskripsi: editingItem.deskripsi?.trim() || '',
          status: editingItem.status_bm === '1',
          status_bm: editingItem.status_bm,
          category: editingItem.category || 'Mailer Box',
          updatedAt: new Date().toISOString().split('T')[0]
        } : model
      ))
      
      await showAlert('success', {
        title: 'Berhasil!',
        text: 'Data box model berhasil diperbarui',
        timer: 1500,
        showConfirmButton: false
      })
      
      setShowEditModal(false)
      
    } catch (err) {
      console.error('Error updating box model:', err)
      await showAlert('error', {
        title: 'Gagal',
        text: 'Error updating box model'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleFormulaClick = (item) => {
    setEditingItem({ ...item })
    setEditingFormulaComponents(item.formulaComponents || [])
    setShowFormulaModal(true)
  }

  const handleFormulaSave = async () => {
    if (!editingItem) return

    try {
      setIsPosting(true)
      
      await showAlert('success', {
        title: 'Berhasil!',
        text: 'Formula berhasil disimpan',
        timer: 1500,
        showConfirmButton: false
      })
      
      setShowFormulaModal(false)
      
    } catch (err) {
      console.error('Error saving formula components:', err)
      await showAlert('error', {
        title: 'Gagal',
        text: 'Error saving formula components'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id) => {
    const confirm = await showAlert('confirmDelete', {
      title: 'Hapus Box Model',
      text: 'Apakah Anda yakin ingin menghapus box model ini?'
    })
    
    if (confirm.isConfirmed) {
      try {
        // TODO: Implement delete API
        // await axios.delete(`/Admin/Box/boxModels/${id}`)
        
        // Simulasi
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setBoxModels(boxModels.filter(model => model.id !== id))
        
        await showAlert('success', {
          title: 'Terhapus!',
          text: 'Box model berhasil dihapus',
          timer: 1500,
          showConfirmButton: false
        })
        
      } catch (err) {
        console.error('Error:', err)
        await showAlert('error', {
          title: 'Gagal',
          text: 'Error deleting box model'
        })
      }
    }
  }

  const toggleStatus = async (item) => {
    const newStatus = !item.status
    const actionText = newStatus ? 'mengaktifkan' : 'menonaktifkan'
    
    const confirm = await showAlert('confirm', {
      title: `${newStatus ? 'Aktifkan' : 'Nonaktifkan'} Box Model`,
      text: `Apakah Anda yakin ingin ${actionText} box model ini?`
    })
    
    if (confirm.isConfirmed) {
      try {
        // TODO: Implement status toggle API
        // await axios.patch(`/Admin/Box/boxModels/${item.id}/status`, { status: newStatus })
        
        // Update lokal
        setBoxModels(boxModels.map(model => 
          model.id === item.id ? { 
            ...model, 
            status: newStatus,
            status_bm: newStatus ? '1' : '0'
          } : model
        ))
        
        await showAlert('toastSuccess', {
          title: `Status berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`
        })
        
      } catch (err) {
        console.error('Error:', err)
        await showAlert('toastError', {
          title: 'Gagal memperbarui status'
        })
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
        onClick={() => !isPosting && setShowEditModal(false)}
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
        {isPosting ? 'Memperbarui...' : 'Update'}
      </Button>
    </div>
  )

  const formulaModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => !isPosting && setShowFormulaModal(false)}
        disabled={isPosting}
      >
        Batal
      </Button>
      <Button
        variant="primary"
        onClick={handleFormulaSave}
        loading={isPosting}
        disabled={isPosting}
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
                  Coba Lagi
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CustomIcon icon="mdi:package-variant" className="w-8 h-8 text-blue-600" />
            Box Models
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola model kotak dan rumus perhitungan dimensi
          </p>
        </div>

        {/* Action Bar */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Total: {boxModels.length} models | Active: {boxModels.filter(m => m.status).length}
              </p>
            </div>
            <Button
              onClick={handleAddClick}
              variant="primary"
              icon="mdi:plus"
            >
              Tambah Model
            </Button>
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
              <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      onClick={() => handleDelete(model.id)}
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
              className="text-gray-700 "
              disabled
            />

            <Input
              label="Nama Model *"
              value={addFormData.name}
              onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
              placeholder="Masukan Nama Model"
              required
              className="text-gray-700 "
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700" 
                placeholder="Deskripsi model kotak..."
                
              />
            </div>
          </div>
        </Modal>

        {/* ===== MODAL EDIT BOX MODEL ===== */}
        <Modal
          isOpen={showEditModal}
          onClose={() => !isPosting && setShowEditModal(false)}
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
                  className="text-gray-700 "
                  required
                />
                
                <Input
                  label="Nama Model *"
                  value={editingItem.namaModel}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    namaModel: e.target.value
                  })}
                  className="text-gray-700 "
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Kategori"
                  value={editingItem.category}
                  className="text-gray-700 "
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    category: e.target.value
                  })}
                  options={[
                    { value: 'Mailer Box', label: 'Mailer Box' },
                    { value: 'Shoe Box', label: 'Shoe Box' },
                    { value: 'Food Box', label: 'Food Box' },
                    { value: 'Premium Box', label: 'Premium Box' },
                    { value: 'Custom Box', label: 'Custom Box' }
                  ]}
                />

                {/* <Select
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
                /> */}
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  placeholder="Description..."
                />
              </div>
            </div>
          )}
        </Modal>

        {/* ===== MODAL FORMULA BOX MODEL ===== */}
        <Modal
          isOpen={showFormulaModal}
          onClose={() => !isPosting && setShowFormulaModal(false)}
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
                          className="text-gray-700"
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
                          className="text-gray-700"
                        />

                        <Input
                          label="Multiplier"
                          type="number"
                          step="0.5"
                          value={component.multiplier}
                          onChange={(e) => updateFormulaComponent(index, 'multiplier', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="text-gray-700"
                        />

                        <Input
                          label="Allowance (mm)"
                          type="number"
                          value={component.allowanceMm}
                          onChange={(e) => updateFormulaComponent(index, 'allowanceMm', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="text-gray-700"
                        />
                      </div>
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
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}