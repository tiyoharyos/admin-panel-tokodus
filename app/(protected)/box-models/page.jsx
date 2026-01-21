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

  // ===== FETCH DATA dengan OPTIMASI untuk cek formula =====
  const fetchBoxModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/Admin/Box/boxModels', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('📦 Box Models Response:', response.data)
      
      if (response.data && response.data.status === 200) {
        if (Array.isArray(response.data.data)) {
          // MODIFIKASI: Optimasi cek formula - hanya cek jika benar-benar perlu
          const boxModelsWithFormulas = await Promise.all(
            response.data.data.map(async (item) => {
              try {
                let formulaComponents = []
                let hasFormula = false
                
                // Cek cepat: jika kita hanya perlu tahu ada/tidak formula
                // Gunakan endpoint yang lebih ringan jika ada
                try {
                  const formulaResponse = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id_bm}`, {
                    headers: {
                      'ngrok-skip-browser-warning': 'true'
                    }
                  })
                  
                  if (formulaResponse.data && formulaResponse.data.status === 200 && formulaResponse.data.data) {
                    const formulaData = formulaResponse.data.data
                    hasFormula = true // Flag utama untuk UI
                    
                    // Hanya parsing data jika benar-benar dibutuhkan untuk display
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
                  // Jika error 404/400, berarti belum ada formula
                  if (formulaErr.response?.status === 404 || formulaErr.response?.status === 400) {
                    hasFormula = false
                  } else {
                    console.error(`Error fetching formula for box ${item.id_bm}:`, formulaErr)
                    hasFormula = false // Default ke false jika error
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
                  hasFormula: hasFormula, // Flag penting untuk kontrol UI
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
                  hasFormula: false, // Default false jika error
                  category: item.category || 'Mailer Box'
                }
              }
            })
          )
          
          setBoxModels(boxModelsWithFormulas)
        } else {
          console.warn('Data bukan array:', response.data.data)
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
      
      console.log('➕ POST Data:', postData)
      
      const response = await axios.post('/Admin/Box/boxModels', postData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('➕ POST Response:', response.data)
      
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

  // MODIFIKASI: handleEditClick - Ambil formula untuk ditampilkan di modal Edit
  const handleEditClick = async (item) => {
    try {
      // Ambil data formula menggunakan JOIN API
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
        hasFormula: formulaComponents.length > 0 // Pastikan flag hasFormula sesuai
      })
      
      setShowEditModal(true)
      
    } catch (err) {
      console.error('❌ Error loading formula for edit:', err)
      // Tetap buka modal tanpa formula jika error
      setEditingItem({ 
        ...item,
        status_bm: item.status ? '1' : '0',
        formulaComponents: [],
        hasFormula: false
      })
      setShowEditModal(true)
    }
  }

  // MODIFIKASI: handleFormulaClick - HANYA untuk box model yang BELUM punya formula
  const handleFormulaClick = async (item) => {
    try {
      console.log('📐 Checking formula for box model:', item.id)
      
      // Cek apakah box model ini sudah punya formula menggunakan JOIN API
      const response = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      console.log('📐 Formula Check Response:', response.data)
      
      if (response.data && response.data.status === 200 && response.data.data) {
        // Jika sudah ada formula, tampilkan pesan dan arahkan ke Edit
        Swal.fire({
          title: 'Formula Sudah Ada',
          text: 'Box model ini sudah memiliki formula. Untuk mengedit formula, silakan gunakan menu Edit.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Buka Edit',
          cancelButtonText: 'Tutup',
          confirmButtonColor: '#3B82F6',
          cancelButtonColor: '#6B7280',
        }).then((result) => {
          if (result.isConfirmed) {
            // Buka modal Edit dengan data yang sudah ada
            handleEditClick(item)
          }
          // Tutup modal Formula (jika ada)
          setShowFormulaModal(false)
        })
      } else {
        // Jika belum ada formula, tampilkan modal Formula untuk membuat baru
        console.log('📭 No formula data found, show empty form for new formula')
        setEditingItem(item)
        setEditingFormulaComponents([]) // Reset form kosong
        setShowFormulaModal(true)
      }
      
    } catch (err) {
      console.error('❌ Error checking formula:', err)
      
      // Jika error 404 atau data tidak ditemukan, artinya belum ada formula
      if (err.response?.status === 404 || err.response?.status === 400) {
        console.log('📭 Box model belum punya formula')
        setEditingItem(item)
        setEditingFormulaComponents([])
        setShowFormulaModal(true)
      } else {
        showErrorAlert('Error', 'Gagal memeriksa formula')
      }
    }
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
      
      // 1. Update box model data
      const updateData = {
        id_bm: editingItem.id,
        code: editingItem.kode.trim(),
        name: editingItem.namaModel.trim(),
        description: editingItem.deskripsi?.trim() || '',
        status_bm: editingItem.status_bm,
        category: editingItem.category || 'Mailer Box'
      }

      console.log('✏️ Update box model:', updateData)
      
      const response = await axios.put(`/Admin/Box/boxModelsEdit/${editingItem.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        } 
      })
      
      console.log('✏️ Update response:', response.data)
      
      if (response.data && response.data.status === 200) {
        // 2. Update formula components jika ada
        if (editingItem.formulaComponents && editingItem.formulaComponents.length > 0) {
          console.log('📝 Updating formula components...')
          
          // Simpan formula components
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
              // Jika component sudah ada ID, update
              if (component.id && !component.id.startsWith('COMP')) {
                try {
                  const updateResponse = await axios.put(`/Admin/Box/boxFormulaComponentsEdit/${component.id}`, postData)
                  if (updateResponse.data?.status === 200) {
                    formulaSuccessCount++
                  }
                } catch (updateErr) {
                  // Jika update gagal, coba create baru
                  const createResponse = await axios.post('/Admin/Box/boxFormulaComponents', postData)
                  if (createResponse.data?.status === 201) {
                    formulaSuccessCount++
                  }
                }
              } else {
                // Component baru, create saja
                const createResponse = await axios.post('/Admin/Box/boxFormulaComponents', postData)
                if (createResponse.data?.status === 201) {
                  formulaSuccessCount++
                }
              }
            } catch (formulaErr) {
              console.error('❌ Error saving formula component:', formulaErr)
            }
          }
          
          console.log(`✅ ${formulaSuccessCount} formula components saved`)
        }
        
        showSuccessAlert('Berhasil!', 'Box Model berhasil diupdate!')
        await fetchBoxModels()
        setShowEditModal(false)
      } else {
        showErrorAlert('Gagal!', response.data?.message || 'Gagal mengupdate Box Model')
      }
      
    } catch (err) {
      console.error('❌ Error updating box model:', err)
      showErrorAlert('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  const handleFormulaSave = async () => {
    if (!editingItem) return

    console.log('💾 Saving new formula components...')

    // Validasi sesuai backend
    const missingRequired = editingFormulaComponents.filter(comp => 
      !comp.box_model_id || 
      !comp.target || 
      !comp.source || 
      comp.multiplier === '' || comp.multiplier === null || comp.multiplier === undefined
    )
    
    if (missingRequired.length > 0) {
      showErrorAlert('Validasi Error', 'Beberapa komponen memiliki data wajib yang belum diisi (box_model_id, target, source, multiplier)')
      return
    }

    // Validasi ENUM target (panjang, lebar)
    const invalidTarget = editingFormulaComponents.filter(comp => 
      !['panjang', 'lebar'].includes(comp.target)
    )
    
    if (invalidTarget.length > 0) {
      showErrorAlert('Validasi Error', 'Target harus "panjang" atau "lebar"')
      return
    }

    // Validasi ENUM source (P, L, T)
    const invalidSource = editingFormulaComponents.filter(comp => 
      !['P', 'L', 'T'].includes(comp.source)
    )
    
    if (invalidSource.length > 0) {
      showErrorAlert('Validasi Error', 'Source harus "P", "L", atau "T"')
      return
    }

    try {
      setIsPosting(true)
      
      // Simpan setiap formula component baru
      let successCount = 0
      
      for (const [index, component] of editingFormulaComponents.entries()) {
        try {
          // Siapkan data sesuai dengan format yang diharapkan backend
          const postData = {
            box_model_id: editingItem.id.toString(),
            target: component.target,
            source: component.source,
            multiplier: component.multiplier.toString(),
            allowance_mm: component.allowance_mm?.toString() || '',
            sort_order: component.sort_order?.toString() || (index + 1).toString()
          }

          console.log(`📤 POST komponen baru ${index + 1}:`, postData)

          const response = await axios.post('/Admin/Box/boxFormulaComponents', postData, {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          })
          
          console.log(`📥 Response komponen ${index + 1}:`, response.data)
          
          // Backend return 201 untuk success
          if (response.data && (response.data.status === 201 || response.data.status === 200)) {
            successCount++
            console.log(`✅ Komponen ${index + 1} berhasil disimpan`)
          } else {
            console.warn(`⚠️ Komponen ${index + 1} gagal:`, response.data)
          }
        } catch (postErr) {
          console.error(`❌ Error komponen ${index + 1}:`, postErr)
        }
      }
      
      if (successCount > 0) {
        showSuccessAlert('Berhasil!', `${successCount} komponen formula berhasil disimpan!`)
        
        // Tunggu sebentar lalu refresh data
        setTimeout(async () => {
          await fetchBoxModels()
          setShowFormulaModal(false)
        }, 1000)
        
      } else {
        showErrorAlert('Gagal!', 'Tidak ada komponen yang berhasil disimpan')
      }
      
    } catch (err) {
      console.error('❌ Error utama saat menyimpan formula:', err)
      showErrorAlert('Error!', err.message || 'Terjadi kesalahan saat menyimpan formula')
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id, name) => {
    const result = await showConfirmDelete()
    
    if (result.isConfirmed) {
      try {
        console.log('🗑️ Deleting box model:', id)
        
        const response = await axios.delete(`/Admin/Box/boxModelsDel/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        console.log('🗑️ Delete Response:', response.data)
        
        if (response.data && response.data.status === 200) {
          showSuccessAlert('Dihapus!', `Box Model "${name}" berhasil dihapus!`)
          await fetchBoxModels()
        } else {
          showErrorAlert('Gagal!', response.data?.message || 'Gagal menghapus Box Model')
        }
      } catch (err) {
        console.error('❌ Error:', err)
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
        
        console.log('🔄 Updating status:', item.id, 'to', statusValue)
        
        const response = await axios.patch(`/Admin/Box/boxModels/${item.id}/status`, {
          status_bm: statusValue
        }, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        })
        
        console.log('🔄 Status Update Response:', response.data)
        
        if (response.data && response.data.status === 200) {
          const statusText = newStatus ? 'diaktifkan' : 'dinonaktifkan'
          showSuccessAlert('Berhasil!', `Box Model "${item.namaModel}" berhasil ${statusText}!`)
          
          // Update lokal state
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
        console.error('❌ Error:', err)
        showErrorAlert('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengubah status')
      }
    }
  }

  // Formula component handlers untuk modal Add Formula (hanya untuk tambah baru)
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

  // Update formula component untuk modal Add Formula
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

  // Remove formula component untuk modal Add Formula
  const removeFormulaComponent = (index) => {
    const updated = editingFormulaComponents.filter((_, i) => i !== index)
    updated.forEach((comp, i) => {
      comp.sort_order = i + 1
    })
    setEditingFormulaComponents(updated)
  }

  // Update formula component di modal Edit
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

  // Add formula component di modal Edit
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

  // Remove formula component di modal Edit
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

  const generateFormulaPreview = (target) => {
    const components = editingFormulaComponents.filter(c => c.target === target)
    if (components.length === 0) return 'Belum ada formula'

    const formulaParts = components.map(comp => {
      if (comp.source && comp.source !== '') {
        return `(${comp.source} × ${comp.multiplier})`
      }
      return `${comp.allowance_mm}mm`
    })

    const allowanceTotal = components.reduce((sum, comp) => sum + (parseFloat(comp.allowance_mm) || 0), 0)
    
    let formula = formulaParts.join(' + ')
    if (allowanceTotal > 0 && formulaParts.length > 0) {
      formula += ` + ${allowanceTotal}mm`
    } else if (allowanceTotal > 0) {
      formula = `${allowanceTotal}mm`
    }

    return formula || 'Belum ada formula'
  }

  // MODIFIKASI: Fungsi untuk render formula display di card
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Memuat box models...</p>
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
                Total: {boxModels.length} models | 
                Dengan Formula: {boxModels.filter(m => m.hasFormula).length} | 
                Tanpa Formula: {boxModels.filter(m => !m.hasFormula).length}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Box Models</h3>
            <p className="text-gray-500 mb-6">Mulai dengan membuat box model pertama Anda.</p>
            <Button onClick={handleAddClick} variant="primary" icon="mdi:plus">
              Buat Model Pertama
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
                        {model.category || 'Tidak Berkategori'}
                      </Badge>
                      <Badge 
                        variant={model.hasFormula ? 'success' : 'warning'} 
                        className="ml-2"
                      >
                        {model.hasFormula ? 'Ada Formula' : 'Belum Ada Formula'}
                      </Badge>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">
                        {model.namaModel}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Kode: <span className="font-mono">{model.kode}</span>
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
                    {model.deskripsi || 'Tidak ada deskripsi'}
                  </p>

                  {/* Formula Components Display */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Formula:
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">Panjang:</span>
                        <span className="text-gray-900 font-medium">
                          {renderFormulaOnCard(model.formulaComponents, 'panjang')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">Lebar:</span>
                        <span className="text-gray-900 font-medium">
                          {renderFormulaOnCard(model.formulaComponents, 'lebar')}
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
                      
                      {/* MODIFIKASI PENTING: Hanya tampilkan Formula button jika BELUM ada formula */}
                      {!model.hasFormula && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFormulaClick(model)}
                          icon="mdi:calculator"
                        >
                          Formula
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(model.id, model.namaModel)}
                      icon="mdi:delete"
                      className="text-red-600 hover:text-red-700"
                    >
                      Hapus
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
          size="2xl"
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

              {/* MODIFIKASI: Formula Section dengan conditional rendering */}
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
                    // Jika hasFormula true tapi tidak ada components (keadaan tidak normal)
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
                    // Jika belum ada formula (hasFormula false)
                    <Card className="text-center py-8 border-dashed border-2">
                      <div className="text-gray-400 mb-2">
                        <CustomIcon icon="mdi:calculator-off" className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 mb-1">Belum ada formula untuk box model ini</p>
                      <p className="text-sm text-gray-400 mb-4">
                        
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
                    
                    // Validasi sesuai backend
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

                        {/* Tampilkan errors jika ada */}
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

                {/* Formula Preview */}
                {editingFormulaComponents.length > 0 && (
                  <Card className="mt-6 border-blue-200 bg-blue-50">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">
                      Preview Formula
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-blue-700 mb-1">Panjang:</div>
                        <div className="text-sm text-blue-600 bg-white p-3 rounded-lg border border-blue-100 font-mono">
                          {generateFormulaPreview('panjang')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-blue-700 mb-1">Lebar:</div>
                        <div className="text-sm text-blue-600 bg-white p-3 rounded-lg border border-blue-100 font-mono">
                          {generateFormulaPreview('lebar')}
                        </div>
                      </div>
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