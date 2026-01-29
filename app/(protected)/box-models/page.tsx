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

export default function BoxModelsPage() {
  const router = useRouter()
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
          const boxModelsWithFormulas = await Promise.all(
            response.data.data.map(async (item) => {
              try {
                let formulaComponents = []
                let hasFormula = false
                
                try {
                  const formulaResponse = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id_bm}`, {
                    headers: {
                      'ngrok-skip-browser-warning': 'true'
                    }
                  })
                  
                  if (formulaResponse.data && formulaResponse.data.status === 200 && formulaResponse.data.data) {
                    const formulaData = formulaResponse.data.data
                    hasFormula = true
                    
                    if (Array.isArray(formulaData) && formulaData.length > 0) {
                      formulaComponents = formulaData.map(comp => ({
                        id: comp.id_bfc?.toString(),
                        target: comp.target || 'panjang',
                        source: comp.source || 'P',
                        multiplier: comp.multiplier || 0,
                        allowance_mm: comp.allowance_mm || 0,
                        sort_order: comp.sort_order || 1
                      }))
                    } else if (formulaData && typeof formulaData === 'object' && formulaData.id_bfc) {
                      formulaComponents = [{
                        id: formulaData.id_bfc?.toString(),
                        target: formulaData.target || 'panjang',
                        source: formulaData.source || 'P',
                        multiplier: formulaData.multiplier || 0,
                        allowance_mm: formulaData.allowance_mm || 0,
                        sort_order: formulaData.sort_order || 1
                      }]
                      hasFormula = true
                    }
                  }
                } catch (formulaErr) {
                  if (formulaErr.response?.status === 404 || formulaErr.response?.status === 400) {
                    hasFormula = false
                  } else {
                    console.error(`Error fetching formula for box ${item.id_bm}:`, formulaErr)
                    hasFormula = false
                  }
                }
                
                return {
                  id: item.id_bm?.toString() || '',
                  kode: item.code || '',
                  namaModel: item.name || '',
                  deskripsi: item.description || '',
                  status: item.status_bm === '1' || item.status_bm === 1,
                  status_bm: item.status_bm?.toString(),
                  createdAt: item.created_at || new Date().toISOString().split('T')[0],
                  updatedAt: item.updated_at || new Date().toISOString().split('T')[0],
                  formulaComponents: formulaComponents,
                  hasFormula: hasFormula,
                  category: item.category || 'Mailer Box'
                }
              } catch (err) {
                console.error(`Error processing box ${item.id_bm}:`, err)
                return {
                  id: item.id_bm?.toString() || '',
                  kode: item.code || '',
                  namaModel: item.name || '',
                  deskripsi: item.description || '',
                  status: item.status_bm === '1' || item.status_bm === 1,
                  status_bm: item.status_bm?.toString(),
                  createdAt: item.created_at || new Date().toISOString().split('T')[0],
                  updatedAt: item.updated_at || new Date().toISOString().split('T')[0],
                  formulaComponents: [],
                  hasFormula: false,
                  category: item.category || 'Mailer Box'
                }
              }
            })
          )
          
          setBoxModels(boxModelsWithFormulas)
        } else {
          setBoxModels([])
        }
      } else {
        setError(response.data?.message || 'Format response tidak sesuai')
      }
      
    } catch (err) {
      console.error('❌ Error fetching box models:', err)
      setError(err.response?.data?.message || 'Tidak bisa connect ke server')
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
      const lastItem = boxModels[boxModels.length - 1]
      if (lastItem.kode && /^\d+$/.test(lastItem.kode)) {
        const lastNum = parseInt(lastItem.kode)
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
      SweetAlert.error('Validasi Error', 'Kode tidak boleh kosong')
      return
    }
    
    if (!addFormData.name.trim()) {
      SweetAlert.error('Validasi Error', 'Nama model tidak boleh kosong')
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
      
      const response = await axios.post('/Admin/Box/boxModels', postData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200) {
        SweetAlert.success('Berhasil!', 'Box Model berhasil ditambahkan!')
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
      const formulaResponse = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      let formulaComponents = []
      
      if (formulaResponse.data && formulaResponse.data.status === 200 && formulaResponse.data.data) {
        const data = formulaResponse.data.data
        
        if (Array.isArray(data)) {
          formulaComponents = data.map(comp => ({
            id: comp.id_bfc?.toString(),
            box_model_id: comp.box_model_id,
            target: comp.target || 'panjang',
            source: comp.source || 'P',
            multiplier: parseFloat(comp.multiplier) || 0,
            allowance_mm: parseFloat(comp.allowance_mm) || 0,
            sort_order: parseInt(comp.sort_order) || 1
          }))
        } else if (data && typeof data === 'object') {
          formulaComponents = [{
            id: data.id_bfc?.toString(),
            box_model_id: data.box_model_id,
            target: data.target || 'panjang',
            source: data.source || 'P',
            multiplier: parseFloat(data.multiplier) || 0,
            allowance_mm: parseFloat(data.allowance_mm) || 0,
            sort_order: parseInt(data.sort_order) || 1
          }]
        }
      }
      
      setEditingItem({ 
        ...item,
        status_bm: item.status ? '1' : '0',
        formulaComponents: formulaComponents,
        hasFormula: formulaComponents.length > 0
      })
      
      setShowEditModal(true)
      
    } catch (err) {
      console.error('❌ Error loading formula for edit:', err)
      setEditingItem({ 
        ...item,
        status_bm: item.status ? '1' : '0',
        formulaComponents: [],
        hasFormula: false
      })
      setShowEditModal(true)
    }
  }

  const handleFormulaClick = async (item) => {
    try {
      const response = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data && response.data.status === 200 && response.data.data) {
        SweetAlert.confirmAction(
          'Formula Sudah Ada',
          'Box model ini sudah memiliki formula. Untuk mengedit formula, silakan gunakan menu Edit.'
        ).then((result) => {
          if (result.isConfirmed) {
            handleEditClick(item)
          }
          setShowFormulaModal(false)
        })
      } else {
        setEditingItem(item)
        setEditingFormulaComponents([])
        setShowFormulaModal(true)
      }
      
    } catch (err) {
      console.error('❌ Error checking formula:', err)
      if (err.response?.status === 404 || err.response?.status === 400) {
        setEditingItem(item)
        setEditingFormulaComponents([])
        setShowFormulaModal(true)
      } else {
        SweetAlert.error('Error', 'Gagal memeriksa formula')
      }
    }
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    
    if (!editingItem.kode.trim()) {
      SweetAlert.error('Validasi Error', 'Kode tidak boleh kosong')
      return
    }
    
    if (!editingItem.namaModel.trim()) {
      SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong')
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
      
      const response = await axios.put(`/Admin/Box/boxModelsEdit/${editingItem.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        } 
      })
      
      if (response.data && response.data.status === 200) {
        if (editingItem.formulaComponents && editingItem.formulaComponents.length > 0) {
          let formulaSuccessCount = 0
          
          for (const component of editingItem.formulaComponents) {
            const postData = {
              box_model_id: editingItem.id.toString(),
              target: component.target,
              source: component.source,
              multiplier: component.multiplier.toString(),
              allowance_mm: component.allowance_mm?.toString() || '',
              sort_order: component.sort_order?.toString() || '1'
            }
            
            try {
              if (component.id && !component.id.startsWith('COMP')) {
                try {
                  const updateResponse = await axios.put(`/Admin/Box/boxFormulaComponentsEdit/${component.id}`, postData)
                  if (updateResponse.data?.status === 200) {
                    formulaSuccessCount++
                  }
                } catch (updateErr) {
                  const createResponse = await axios.post('/Admin/Box/boxFormulaComponents', postData)
                  if (createResponse.data?.status === 201) {
                    formulaSuccessCount++
                  }
                }
              } else {
                const createResponse = await axios.post('/Admin/Box/boxFormulaComponents', postData)
                if (createResponse.data?.status === 201) {
                  formulaSuccessCount++
                }
              }
            } catch (formulaErr) {
              console.error('❌ Error saving formula component:', formulaErr)
            }
          }
        }
        
        SweetAlert.success('Berhasil!', 'Box Model berhasil diupdate!')
        await fetchBoxModels()
        setShowEditModal(false)
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal mengupdate Box Model')
      }
      
    } catch (err) {
      console.error('❌ Error updating box model:', err)
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  const handleFormulaSave = async () => {
    if (!editingItem) return

    const missingRequired = editingFormulaComponents.filter(comp => 
      !comp.box_model_id || 
      !comp.target || 
      !comp.source || 
      comp.multiplier === '' || comp.multiplier === null || comp.multiplier === undefined
    )
    
    if (missingRequired.length > 0) {
      SweetAlert.error('Validasi Error', 'Beberapa komponen memiliki data wajib yang belum diisi (box_model_id, target, source, multiplier)')
      return
    }

    const invalidTarget = editingFormulaComponents.filter(comp => 
      !['panjang', 'lebar'].includes(comp.target)
    )
    
    if (invalidTarget.length > 0) {
      SweetAlert.error('Validasi Error', 'Target harus "panjang" atau "lebar"')
      return
    }

    const invalidSource = editingFormulaComponents.filter(comp => 
      !['P', 'L', 'T'].includes(comp.source)
    )
    
    if (invalidSource.length > 0) {
      SweetAlert.error('Validasi Error', 'Source harus "P", "L", atau "T"')
      return
    }

    try {
      setIsPosting(true)
      
      let successCount = 0
      
      for (const [index, component] of editingFormulaComponents.entries()) {
        try {
          const postData = {
            box_model_id: editingItem.id.toString(),
            target: component.target,
            source: component.source,
            multiplier: component.multiplier.toString(),
            allowance_mm: component.allowance_mm?.toString() || '',
            sort_order: component.sort_order?.toString() || (index + 1).toString()
          }

          const response = await axios.post('/Admin/Box/boxFormulaComponents', postData, {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          })
          
          if (response.data && (response.data.status === 201 || response.data.status === 200)) {
            successCount++
          }
        } catch (postErr) {
          console.error(`❌ Error komponen ${index + 1}:`, postErr)
        }
      }
      
      if (successCount > 0) {
        SweetAlert.success('Berhasil!', `${successCount} komponen formula berhasil disimpan!`)
        
        setTimeout(async () => {
          await fetchBoxModels()
          setShowFormulaModal(false)
        }, 1000)
        
      } else {
        SweetAlert.error('Gagal!', 'Tidak ada komponen yang berhasil disimpan')
      }
      
    } catch (err) {
      console.error('❌ Error utama saat menyimpan formula:', err)
      SweetAlert.error('Error!', err.message || 'Terjadi kesalahan saat menyimpan formula')
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id, name) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/Admin/Box/boxModelsDel/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        if (response.data && response.data.status === 200) {
          SweetAlert.success('Dihapus!', `Box Model "${name}" berhasil dihapus!`)
          await fetchBoxModels()
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus Box Model')
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
      `Apakah Anda yakin ingin ${item.status ? 'menonaktifkan' : 'mengaktifkan'} box model ini?`
    )
    
    if (result.isConfirmed) {
      try {
        const newStatus = !item.status
        const statusValue = newStatus ? '1' : '0'
        
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
          SweetAlert.success('Berhasil!', `Box Model "${item.namaModel}" berhasil ${statusText}!`)
          
          setBoxModels(boxModels.map(model => 
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

  const addFormulaComponent = () => {
    const newComponent = {
      id: `COMP${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      box_model_id: editingItem?.id?.toString() || '',
      target: 'panjang',
      source: 'P',
      multiplier: 1,
      allowance_mm: 0,
      sort_order: editingFormulaComponents.length + 1
    }
    
    setEditingFormulaComponents([...editingFormulaComponents, newComponent])
  }

  const updateFormulaComponent = (index, field, value) => {
    const updated = [...editingFormulaComponents]
    
    if (field === 'multiplier' || field === 'allowance_mm') {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 }
    } else if (field === 'sort_order') {
      updated[index] = { ...updated[index], [field]: parseInt(value) || 1 }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    
    setEditingFormulaComponents(updated)
  }

  const removeFormulaComponent = (index) => {
    const updated = editingFormulaComponents.filter((_, i) => i !== index)
    updated.forEach((comp, i) => {
      comp.sort_order = i + 1
    })
    setEditingFormulaComponents(updated)
  }

  const updateEditFormulaComponent = (index, field, value) => {
    if (!editingItem) return
    
    const updated = [...editingItem.formulaComponents]
    
    if (field === 'multiplier' || field === 'allowance_mm') {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 }
    } else if (field === 'sort_order') {
      updated[index] = { ...updated[index], [field]: parseInt(value) || 1 }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    
    setEditingItem({
      ...editingItem,
      formulaComponents: updated
    })
  }

  const addEditFormulaComponent = () => {
    if (!editingItem) return
    
    const newComponent = {
      id: `COMP${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      box_model_id: editingItem.id,
      target: 'panjang',
      source: 'P',
      multiplier: 1,
      allowance_mm: 0,
      sort_order: editingItem.formulaComponents.length + 1
    }
    
    setEditingItem({
      ...editingItem,
      formulaComponents: [...editingItem.formulaComponents, newComponent]
    })
  }

  const removeEditFormulaComponent = (index) => {
    if (!editingItem) return
    
    const updated = editingItem.formulaComponents.filter((_, i) => i !== index)
    updated.forEach((comp, i) => {
      comp.sort_order = i + 1
    })
    
    setEditingItem({
      ...editingItem,
      formulaComponents: updated
    })
  }

  const renderFormulaOnCard = (formulaComponents, target) => {
    if (!formulaComponents || formulaComponents.length === 0) {
      return 'Tidak ada formula'
    }

    const targetComponents = formulaComponents.filter(c => c.target === target)
    if (targetComponents.length === 0) {
      return 'Tidak ada formula'
    }

    return targetComponents.map(comp => {
      const base = comp.source ? `${comp.source} × ${comp.multiplier}` : ''
      const allowance = comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''
      return base + allowance
    }).join(' + ')
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

  const formulaModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setShowFormulaModal(false)}
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
        {isPosting ? 'Menyimpan...' : 'Simpan Formula'}
      </Button>
    </div>
  )

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat box models...</p>
        </div>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CustomIcon icon="mdi:package-variant" className="w-8 h-8" />
                Box Models
              </h1>
              <p className="opacity-90 mt-1">Kelola model kotak dan rumus perhitungan dimensi</p>
            </div>
          </div>
        </Card>
        
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
    )
  }

  // ===== MAIN UI dengan gaya dashboard =====
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:package-variant" className="w-8 h-8" />
              Box Models
            </h1>
            <p className="opacity-90 mt-1">Kelola model kotak dan rumus perhitungan dimensi</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:counter">
                Total: {boxModels.length} models
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                Dengan Formula: {boxModels.filter(m => m.hasFormula).length}
              </Badge>
              <Badge variant="warning" icon="mdi:alert-circle">
                Tanpa Formula: {boxModels.filter(m => !m.hasFormula).length}
              </Badge>
            </div>
          </div>
          <Button
            onClick={handleAddClick}
            variant="success"
            icon="mdi:plus"
            className="w-full md:w-auto"
          >
            Tambah Model
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">{boxModels.length}</p>
            </div>
            <CustomIcon icon="mdi:package-variant" className="w-12 h-12 text-blue-400" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Models</p>
              <p className="text-2xl font-bold text-gray-900">{boxModels.filter(m => m.status).length}</p>
            </div>
            <CustomIcon icon="mdi:check-circle" className="w-12 h-12 text-green-400" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Formulas</p>
              <p className="text-2xl font-bold text-gray-900">{boxModels.filter(m => m.hasFormula).length}</p>
            </div>
            <CustomIcon icon="mdi:calculator" className="w-12 h-12 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Box Models Table */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:clipboard-list-outline" className="text-blue-600" />
              All Box Models
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {boxModels.filter(m => m.status).length} active, {boxModels.filter(m => !m.status).length} inactive
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
              onClick={fetchBoxModels}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Menggunakan komponen Table */}
        <Table
          headers={['Kode', 'Nama Model', 'Kategori', 'Status', 'Formula', 'Actions']}
          striped
          hoverable
          className="mb-4"
        >
          {boxModels.map((model) => (
            <TableRow key={model.id} hoverable>
              <TableCell>
                <div className="font-medium text-blue-600">{model.kode}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900">{model.namaModel}</div>
                <div className="text-sm text-gray-500 line-clamp-1">{model.deskripsi || 'No description'}</div>
              </TableCell>
              <TableCell>
                <Badge variant={
                  model.category === 'Mailer Box' ? 'primary' :
                  model.category === 'Shoe Box' ? 'success' :
                  model.category === 'Food Box' ? 'warning' :
                  model.category === 'Premium Box' ? 'info' : 'gray'
                }>
                  {model.category || 'Uncategorized'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={model.status ? 'success' : 'danger'}>
                    {model.status ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    onClick={() => toggleStatus(model)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <CustomIcon icon="mdi:swap-vertical" className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={model.hasFormula ? 'success' : 'warning'}>
                  {model.hasFormula ? 'Has Formula' : 'No Formula'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleEditClick(model)}
                    icon="mdi:pencil"
                  >
                    Edit
                  </Button>
                  
                  {!model.hasFormula && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleFormulaClick(model)}
                      icon="mdi:calculator"
                    >
                      Add Formula
                    </Button>
                  )}
                  
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDelete(model.id, model.namaModel)}
                    icon="mdi:delete"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {Math.min(10, boxModels.length)} of {boxModels.length} models
          </div>
          <Button
            variant="link"
            icon="mdi:export"
            onClick={() => SweetAlert.info('Export', 'Exporting box models data...')}
          >
            Export Data
          </Button>
        </div>
      </Card>

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
        size="xl"
        footer={editModalFooter}
      >
        {editingItem && (
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Kode *"
                  value={editingItem.kode}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    kode: e.target.value
                  })}
                  placeholder="000001, MAILER001, etc"
                  className="bg-gray-100 cursor-not-allowed text-gray-700"
                  required
                  disabled
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

              <div className="mt-4">
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
                  placeholder="Deskripsi..."
                />
              </div>
            </div>

            {/* Formula Section */}
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Formula Components
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingItem.hasFormula ? 
                      'Edit formula perhitungan untuk Panjang dan Lebar' : 
                      'Belum ada formula untuk box model ini'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    <strong>Ket:</strong> Source harus P (Panjang), L (Lebar), atau T (Tinggi)
                  </p>
                </div>
                {editingItem.hasFormula ? (
                  <Button
                    type="button"
                    onClick={addEditFormulaComponent}
                    variant="success"
                    icon="mdi:plus"
                  >
                    Tambah Component
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingItem(editingItem)
                      setEditingFormulaComponents([])
                      setShowFormulaModal(true)
                    }}
                    variant="primary"
                    icon="mdi:calculator-plus"
                  >
                    Buat Formula
                  </Button>
                )}
              </div>

              {/* Formula Components List */}
              <div className="space-y-4">
                {editingItem.hasFormula && editingItem.formulaComponents && editingItem.formulaComponents.length > 0 ? (
                  editingItem.formulaComponents.map((component, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-medium text-gray-700">
                          Component #{index + 1}
                          {component.id && !component.id.startsWith('COMP') && (
                            <span className="text-xs text-green-600 ml-2">(Saved)</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeEditFormulaComponent(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          icon="mdi:close"
                        >
                          Hapus
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <Select
                          label="Target *"
                          value={component.target}
                          onChange={(e) => updateEditFormulaComponent(index, 'target', e.target.value)}
                          options={[
                            { value: 'panjang', label: 'Panjang' },
                            { value: 'lebar', label: 'Lebar' }
                          ]}
                          required
                        />

                        <Select
                          label="Source *"
                          value={component.source}
                          onChange={(e) => updateEditFormulaComponent(index, 'source', e.target.value)}
                          options={[
                            { value: 'P', label: 'P (Panjang)' },
                            { value: 'L', label: 'L (Lebar)' },
                            { value: 'T', label: 'T (Tinggi)' }
                          ]}
                          required
                        />

                        <Input
                          label="Multiplier *"
                          type="number"
                          step="0.5"
                          value={component.multiplier}
                          onChange={(e) => updateEditFormulaComponent(index, 'multiplier', e.target.value)}
                          placeholder="0"
                          required
                        />

                        <Input
                          label="Allowance (mm)"
                          type="number"
                          value={component.allowance_mm}
                          onChange={(e) => updateEditFormulaComponent(index, 'allowance_mm', e.target.value)}
                          placeholder="0"
                          step="0.1"
                        />

                        <Input
                          label="Sort Order"
                          type="number"
                          value={component.sort_order}
                          onChange={(e) => updateEditFormulaComponent(index, 'sort_order', e.target.value)}
                          placeholder="1"
                          min="1"
                        />
                      </div>

                      <div className="mt-3 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                        <strong>Formula:</strong> {component.source} × {component.multiplier} + {component.allowance_mm}mm
                      </div>
                    </Card>
                  ))
                ) : editingItem.hasFormula ? (
                  <Card className="text-center py-8 border-dashed border-2">
                    <div className="text-gray-400 mb-2">
                      <CustomIcon icon="mdi:calculator-off" className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 mb-1">Data formula tidak ditemukan</p>
                    <p className="text-sm text-gray-400">
                      Tambahkan components baru untuk membuat formula
                    </p>
                  </Card>
                ) : (
                  <Card className="text-center py-8 border-dashed border-2">
                    <div className="text-gray-400 mb-2">
                      <CustomIcon icon="mdi:calculator-off" className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 mb-1">Belum ada formula untuk box model ini</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Klik tombol "Buat Formula" untuk menambahkan formula baru
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingItem(editingItem)
                        setEditingFormulaComponents([])
                        setShowFormulaModal(true)
                      }}
                      icon="mdi:calculator-plus"
                    >
                      Buat Formula
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== MODAL FORMULA (UNTUK TAMBAH BARU SAJA) ===== */}
      <Modal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        title={editingItem ? `Tambah Formula: ${editingItem.namaModel}` : 'Tambah Formula'}
        size="xl"
        footer={formulaModalFooter}
      >
        {editingItem && (
          <div>
            {/* Info Box Model */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                  <CustomIcon icon="mdi:plus-circle" className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Menambahkan Formula Baru</h3>
                  <p className="text-sm text-blue-700">
                    Box Model: <strong>{editingItem.namaModel}</strong> (Kode: {editingItem.kode})
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Box model ini belum memiliki formula. Tambahkan formula pertama.
                  </p>
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
                    Tentukan formula perhitungan untuk Panjang dan Lebar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    <strong>Ket:</strong> Source harus P (Panjang), L (Lebar), atau T (Tinggi)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addFormulaComponent}
                  variant="success"
                  icon="mdi:plus"
                >
                  Tambah Component
                </Button>
              </div>

              {/* Formula Components List */}
              <div className="space-y-4">
                {editingFormulaComponents.map((component, index) => {
                  const errors = []
                  
                  if (!component.box_model_id) errors.push('Box Model ID required')
                  if (!component.target) errors.push('Target required')
                  if (!['panjang', 'lebar'].includes(component.target)) errors.push('Target harus panjang/lebar')
                  if (!component.source) errors.push('Source required')
                  if (!['P', 'L', 'T'].includes(component.source)) errors.push('Source harus P/L/T')
                  if (component.multiplier === '' || component.multiplier === null) errors.push('Multiplier required')
                  
                  return (
                    <Card key={index} className={`p-4 ${errors.length > 0 ? 'border-red-300 bg-red-50' : ''}`}>
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
                          Hapus
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <Select
                          label="Target *"
                          value={component.target}
                          onChange={(e) => updateFormulaComponent(index, 'target', e.target.value)}
                          options={[
                            { value: 'panjang', label: 'Panjang' },
                            { value: 'lebar', label: 'Lebar' }
                          ]}
                          required
                        />

                        <Select
                          label="Source *"
                          value={component.source || 'P'}
                          onChange={(e) => updateFormulaComponent(index, 'source', e.target.value)}
                          options={[
                            { value: 'P', label: 'P (Panjang)' },
                            { value: 'L', label: 'L (Lebar)' },
                            { value: 'T', label: 'T (Tinggi)' }
                          ]}
                          required
                        />

                        <Input
                          label="Multiplier *"
                          type="number"
                          step="0.5"
                          value={component.multiplier}
                          onChange={(e) => updateFormulaComponent(index, 'multiplier', e.target.value)}
                          placeholder="0"
                          required
                          helperText="Tidak boleh kosong"
                        />

                        <Input
                          label="Allowance (mm)"
                          type="number"
                          value={component.allowance_mm}
                          onChange={(e) => updateFormulaComponent(index, 'allowance_mm', e.target.value)}
                          placeholder="0"
                          step="0.1"
                        />

                        <Input
                          label="Sort Order"
                          type="number"
                          value={component.sort_order}
                          onChange={(e) => updateFormulaComponent(index, 'sort_order', e.target.value)}
                          placeholder="1"
                          min="1"
                        />
                      </div>

                      <div className="mt-3 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                        <strong>Formula:</strong> {component.source} × {component.multiplier} + {component.allowance_mm}mm
                      </div>

                      {errors.length > 0 && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                          <strong>Validasi Error:</strong>
                          <ul className="list-disc pl-4 mt-1">
                            {errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  )
                })}

                {editingFormulaComponents.length === 0 && (
                  <Card className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <CustomIcon icon="mdi:calculator-off" className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 mb-1">Belum ada formula components</p>
                    <p className="text-sm text-gray-400">
                      Tambahkan components untuk menentukan formula perhitungan
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}