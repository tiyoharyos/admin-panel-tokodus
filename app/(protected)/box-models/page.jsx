// app/(protected)/pengaturan/page.jsx
'use client'

import { useState, useEffect } from 'react'
import axios from '../../../lib/axios'
import { useRouter } from 'next/navigation'
import Modal from '@/components/UI/Modal'

export default function BoxModelsPage() {
  const [boxModels, setBoxModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFormulaModal, setShowFormulaModal] = useState(false)
  const [editingFormulaComponents, setEditingFormulaComponents] = useState([])
  
  // State untuk modal Add
  const [addFormData, setAddFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'Mailer Box',
    status_bm: '1'
  })

  // State untuk loading saat POST
  const [isPosting, setIsPosting] = useState(false)

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
    // Cari kode terakhir untuk increment
    if (boxModels.length > 0) {
      const lastCode = boxModels[boxModels.length - 1].kode
      if (lastCode && /^\d+$/.test(lastCode)) {
        const lastNum = parseInt(lastCode)
        return (lastNum + 1).toString().padStart(6, '0')
      }
    }
    
    // Jika tidak ada data atau kode bukan numeric, generate dari timestamp
    const timestamp = Date.now().toString().slice(-6)
    return timestamp.padStart(6, '0')
  }

  // ===== HANDLERS =====
  const handleAddClick = () => {
    // Auto-generate code ketika modal tambah dibuka
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
 
    
    try {
      setIsPosting(true)
      
      // Data yang akan dikirim ke API
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
        // Tampilkan pesan sukses
        // alert(response.data.message || 'Box Model berhasil ditambahkan!')
        
        // Tutup modal
        setShowAddModal(false)
        
        // Refresh data
        await fetchBoxModels()
        
        // Reset form
        setAddFormData({
          code: '',
          name: '',
          description: '',
          category: 'Mailer Box',
          status_bm: '1'
        })
      } else {
        // Handle error dari API
        const errorMessage = response.data?.message || 'Gagal menambahkan Box Model'
        alert(`Error: ${errorMessage}`)
      }
      
    } catch (err) {
      console.error('❌ Error saat POST:', err)
      
      let errorMessage = 'Terjadi kesalahan saat menyimpan data'
      
      if (err.response) {
        console.error('Response error details:', err.response.status, err.response.data)
        
        // Tampilkan pesan error dari server jika ada
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error
        } else {
          errorMessage = `Error ${err.response.status}: Gagal menyimpan data`
        }
      } else if (err.request) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
      } else {
        errorMessage = `Error: ${err.message}`
      }
      
      alert(errorMessage)
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
      alert('Kode tidak boleh kosong')
      return
    }
    
    if (!editingItem.namaModel.trim()) {
      alert('Nama tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      // Data yang akan dikirim ke API untuk update
      const updateData = {
        id_bm: editingItem.id,
        code: editingItem.kode.trim(),
        name: editingItem.namaModel.trim(),
        description: editingItem.deskripsi?.trim() || '',
        status_bm: editingItem.status_bm,
        category: editingItem.category || 'Mailer Box'
      }
      
      console.log('📤 Mengirim data update ke API:', updateData)
      
      // Gunakan PUT atau PATCH untuk update
      // Sesuaikan dengan endpoint API yang tersedia
      // Untuk sekarang, kita simulasi saja
      alert('Update API belum diimplementasi')
      
      // Untuk sekarang, update lokal dulu
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
      
      alert('Data berhasil diupdate (simulasi)')
      setShowEditModal(false)
      
    } catch (err) {
      console.error('Error updating box model:', err)
      alert('Error updating box model')
    } finally {
      setIsPosting(false)
    }
  }

  const handleFormulaClick = async (item) => {
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
      alert('Formula save API belum diimplementasi')
      setShowFormulaModal(false)
      setEditingItem(null)
      setEditingFormulaComponents([])
    } catch (err) {
      console.error('Error saving formula components:', err)
      alert('Error saving formula components')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus box model ini?')) {
      try {
        alert('Delete API belum diimplementasi')
        await fetchBoxModels()
      } catch (err) {
        console.error('Error:', err)
        alert('Error deleting box model')
      }
    }
  }

  const toggleStatus = async (item) => {
    try {
      alert('Toggle status API belum diimplementasi')
      setBoxModels(boxModels.map(model => 
        model.id === item.id ? { 
          ...model, 
          status: !model.status,
          status_bm: model.status_bm === '1' ? '0' : '1'
        } : model
      ))
    } catch (err) {
      console.error('Error:', err)
      alert('Error updating status')
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
      <button
        onClick={() => !isPosting && setShowAddModal(false)}
        disabled={isPosting}
        className={`px-4 py-2 border border-gray-300 rounded-lg ${isPosting ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
      >
        Batal
      </button>
      <button
        onClick={handleAddSave}
        disabled={isPosting}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isPosting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
      >
        {isPosting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menyimpan...
          </>
        ) : (
          'Simpan'
        )}
      </button>
    </div>
  )

  const editModalFooter = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => setShowEditModal(false)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        Batal
      </button>
      <button
        onClick={handleEditSave}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Update
      </button>
    </div>
  )

  const formulaModalFooter = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => setShowFormulaModal(false)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        Batal
      </button>
      <button
        onClick={handleFormulaSave}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Simpan Formula
      </button>
    </div>
  )

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading box models...</p>
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
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchBoxModels}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN UI =====
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Box Models</h1>
              <p className="text-gray-600 mt-2">
                Kelola model kotak dan rumus perhitungan dimensi
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Total: {boxModels.length} models | Active: {boxModels.filter(m => m.status).length}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchBoxModels}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={handleAddClick}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Model
              </button>
            </div>
          </div>
        </div>

        {/* Box Models Grid */}
        {boxModels.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Box Models Found</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first box model.</p>
            <button
              onClick={handleAddClick}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create First Model
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {boxModels.map((model) => (
              <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header Card */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        model.category === 'Mailer Box' ? 'bg-purple-100 text-purple-800' :
                        model.category === 'Shoe Box' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {model.category || 'Uncategorized'}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">
                        {model.namaModel}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Code: <span className="font-mono">{model.kode}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => toggleStatus(model)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        model.status ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        model.status ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {model.deskripsi || 'No description'}
                  </p>
                </div>

                {/* Formula Components */}
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Formula Components:
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-20">Panjang:</span>
                      <span className="text-gray-900">
                        {model.formulaComponents
                          ?.filter(c => c.target === 'panjang')
                          .map(c => c.source ? `${c.source}×${c.multiplier} + ${c.allowanceMm}mm` : `${c.allowanceMm}mm`)
                          .join(' + ') || 'No formula'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-20">Lebar:</span>
                      <span className="text-gray-900">
                        {model.formulaComponents
                          ?.filter(c => c.target === 'lebar')
                          .map(c => c.source ? `${c.source}×${c.multiplier} + ${c.allowanceMm}mm` : `${c.allowanceMm}mm`)
                          .join(' + ') || 'No formula'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(model)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleFormulaClick(model)}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.5 2.54l2.62 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z" />
                      </svg>
                      Formula
                    </button>
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode *
              </label>
              <input
                type="text"
                value={addFormData.code}
                onChange={(e) => setAddFormData({ ...addFormData, code: e.target.value })}
                className="w-full px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="isi kode"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Kode akan digenerate otomatis</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Model *
              </label>
              <input
                type="text"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                className="w-full px-4 py-2.5 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mailer Earlock"
                required
              />
            </div>

        

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Deskripsi model kotak..."
              />
            </div>

        

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Data akan dikirim ke API dengan field: <code>code</code>, <code>name</code>, <code>description</code>, <code>category</code>, dan <code>status_bm</code>.
              </p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode *
                  </label>
                  <input
                    type="text"
                    value={editingItem.kode}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      kode: e.target.value
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000001, MAILER001, etc"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Model *
                  </label>
                  <input
                    type="text"
                    value={editingItem.namaModel}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      namaModel: e.target.value
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mailer Earlock"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    category: e.target.value
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="Mailer Box">Mailer Box</option>
                  <option value="Shoe Box">Shoe Box</option>
                  <option value="Food Box">Food Box</option>
                  <option value="Premium Box">Premium Box</option>
                  <option value="Retail Box">Retail Box</option>
                </select>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingItem.status_bm}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    status_bm: e.target.value
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Info:</strong> To edit formula components, use the <strong>"Formula"</strong> button on the box model card.
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Formula components count: <strong>{editingItem.formulaComponents?.length || 0}</strong>
                </p>
              </div>
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
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.5 2.54l2.62 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{editingItem.namaModel}</h3>
                    <p className="text-sm text-gray-500">Code: {editingItem.kode} | Category: {editingItem.category}</p>
                  </div>
                </div>
              </div>

              {/* Formula Components Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Formula Components
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Define formula calculations for Length and Width
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addFormulaComponent}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Component</span>
                  </button>
                </div>

                {/* Formula Components List */}
                <div className="space-y-4">
                  {editingFormulaComponents.map((component, index) => (
                    <div key={index} className="border rounded-xl p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-medium text-gray-700">
                          Component #{index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFormulaComponent(index)}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Target
                          </label>
                          <select
                            value={component.target}
                            onChange={(e) => updateFormulaComponent(index, 'target', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="panjang">Length</option>
                            <option value="lebar">Width</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Source
                          </label>
                          <select
                            value={component.source || ''}
                            onChange={(e) => updateFormulaComponent(index, 'source', e.target.value || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">None</option>
                            <option value="A">A (Width)</option>
                            <option value="B">B (Length)</option>
                            <option value="C">C (Height)</option>
                            <option value="P">P</option>
                            <option value="L">L</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Multiplier
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={component.multiplier}
                            onChange={(e) => updateFormulaComponent(index, 'multiplier', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Allowance (mm)
                          </label>
                          <input
                            type="number"
                            value={component.allowanceMm}
                            onChange={(e) => updateFormulaComponent(index, 'allowanceMm', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {component.source && (
                        <div className="mt-3 text-sm text-gray-600">
                          Formula: {component.source} × {component.multiplier} + {component.allowanceMm}mm
                        </div>
                      )}
                    </div>
                  ))}

                  {editingFormulaComponents.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-1">No formula components</p>
                      <p className="text-sm text-gray-400">
                        Add components to define calculation formulas
                      </p>
                    </div>
                  )}
                </div>

                {/* Formula Preview */}
                {editingFormulaComponents.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">
                      Formula Preview
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-blue-700 mb-1">Length:</div>
                        <div className="text-sm text-blue-600 bg-white p-2 rounded border border-blue-100">
                          {generateFormulaPreview('panjang') || 'No components'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-blue-700 mb-1">Width:</div>
                        <div className="text-sm text-blue-600 bg-white p-2 rounded border border-blue-100">
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
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}