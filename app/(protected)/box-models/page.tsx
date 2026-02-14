// app/(protected)/box-models/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from '../../../lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import SweetAlert from '@/components/UI/SweetAlert'
import { Icon } from '@iconify/react'

// ===== TYPE DEFINITIONS =====
interface FormulaComponent {
  id?: string
  box_model_id?: string
  target: 'panjang' | 'lebar' | string
  source: 'P' | 'L' | 'T' | 'A' | 'B' | 'C' | string
  multiplier: number
  allowance_mm?: number
  sort_order?: number
}

interface BoxModel {
  id: string
  kode: string
  namaModel: string
  deskripsi: string
  status: boolean
  status_bm: string
  createdAt: string
  updatedAt: string
  formulaComponents: FormulaComponent[]
  hasFormula: boolean
  category: string
}

interface Stats {
  totalModels: number
  activeModels: number
  withFormulas: number
  withoutFormulas: number
  mailerBoxCount: number
  shoeBoxCount: number
}

interface AddFormData {
  code: string
  name: string
  description: string
  category: string
  status_bm: string
}

// ===== CONSTANTS =====
const CATEGORY_OPTIONS = [
  { value: 'Mailer Box', label: '📦 Mailer Box' },
  { value: 'Shoe Box', label: '👟 Shoe Box' },
  { value: 'Food Box', label: '🍱 Food Box' },
  { value: 'Premium Box', label: '✨ Premium Box' }
]

const SOURCE_OPTIONS = [
  { value: 'P', label: 'P (Panjang Produk - cm)' },
  { value: 'L', label: 'L (Lebar Produk - cm)' },
  { value: 'T', label: 'T (Tinggi Produk - cm)' },
  { value: 'A', label: 'A (Panjang Produk ×10 - mm)' },
  { value: 'B', label: 'B (Lebar Produk ×10 - mm)' },
  { value: 'C', label: 'C (Tinggi Produk ×10 - mm)' }
]

const TARGET_OPTIONS = [
  { value: 'panjang', label: '📐 Panjang' },
  { value: 'lebar', label: '📏 Lebar' }
]

const STATUS_OPTIONS = [
  { value: '1', label: '✅ Aktif' },
  { value: '0', label: '❌ Nonaktif' }
]

const BASE_ADD_FORM: AddFormData = {
  code: '',
  name: '',
  description: '',
  category: 'Mailer Box',
  status_bm: '1'
}

// ===== UTILITIES =====
const generateCode = (existingCodes: string[]): string => {
  const numericCodes = existingCodes
    .filter(code => /^\d+$/.test(code))
    .map(code => parseInt(code))
  
  if (numericCodes.length > 0) {
    const lastNum = Math.max(...numericCodes)
    return (lastNum + 1).toString().padStart(6, '0')
  }
  
  const timestamp = Date.now().toString().slice(-6)
  return timestamp.padStart(6, '0')
}

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

const getCategoryBadgeClass = (category: string): string => {
  const classes = {
    'Mailer Box': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Shoe Box': 'bg-green-100 text-green-800 border border-green-200',
    'Food Box': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Premium Box': 'bg-purple-100 text-purple-800 border border-purple-200'
  }
  return classes[category as keyof typeof classes] || 'bg-gray-100 text-gray-800 border border-gray-200'
}

const getStatusBadgeClass = (status: boolean): string => {
  return status 
    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
    : 'bg-rose-100 text-rose-800 border border-rose-200'
}

const getFormulaBadgeClass = (hasFormula: boolean): string => {
  return hasFormula
    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
    : 'bg-amber-100 text-amber-800 border border-amber-200'
}

const formatFormulaDisplay = (components: FormulaComponent[]): string => {
  if (!components || components.length === 0) return '-'
  
  const panjangComp = components.find(c => c.target === 'panjang')
  const lebarComp = components.find(c => c.target === 'lebar')
  
  const formatComp = (comp: FormulaComponent | undefined): string => {
    if (!comp) return '-'
    return `${comp.source} × ${comp.multiplier}${comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}`
  }
  
  return `P: ${formatComp(panjangComp)} | L: ${formatComp(lebarComp)}`
}

// ===== MAIN COMPONENT =====
export default function BoxModelsPage() {
  const router = useRouter()

  // ===== STATE =====
  const [boxModels, setBoxModels] = useState<BoxModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFormulaModal, setShowFormulaModal] = useState(false)

  // Form states
  const [addFormData, setAddFormData] = useState<AddFormData>({ ...BASE_ADD_FORM })
  const [editingItem, setEditingItem] = useState<BoxModel | null>(null)
  const [editingFormulaComponents, setEditingFormulaComponents] = useState<FormulaComponent[]>([])

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalModels: 0,
    activeModels: 0,
    withFormulas: 0,
    withoutFormulas: 0,
    mailerBoxCount: 0,
    shoeBoxCount: 0
  })

  // ===== DERIVED STATE =====
  const activeModels = useMemo(() => 
    boxModels.filter(m => m.status).length, [boxModels]
  )
  
  const inactiveModels = useMemo(() => 
    boxModels.filter(m => !m.status).length, [boxModels]
  )

  // ===== API CALLS =====
  const fetchBoxModels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/Admin/Box/boxModels', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        const processedBoxModels: BoxModel[] = []
        
        for (const item of response.data.data) {
          try {
            const formulaResponse = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id_bm}`, {
              headers: { 'ngrok-skip-browser-warning': 'true' }
            })
            
            let formulaComponents: FormulaComponent[] = []
            let hasFormula = false
            
            if (formulaResponse.data?.status === 200 && formulaResponse.data.data) {
              const formulaData = formulaResponse.data.data
              
              if (Array.isArray(formulaData.formula)) {
                formulaComponents = formulaData.formula.map((comp: any) => ({
                  id: comp.id_bfc?.toString(),
                  target: comp.target || 'panjang',
                  source: comp.source || 'P',
                  multiplier: parseFloat(comp.multiplier) || 0,
                  allowance_mm: parseFloat(comp.allowance_mm) || 0,
                  sort_order: parseInt(comp.sort_order) || 1
                }))
                hasFormula = formulaComponents.length > 0
              } else if (formulaData.formula && typeof formulaData.formula === 'object') {
                const comp = formulaData.formula
                formulaComponents = [{
                  id: comp.id_bfc?.toString(),
                  target: comp.target || 'panjang',
                  source: comp.source || 'P',
                  multiplier: parseFloat(comp.multiplier) || 0,
                  allowance_mm: parseFloat(comp.allowance_mm) || 0,
                  sort_order: parseInt(comp.sort_order) || 1
                }]
                hasFormula = true
              }
            }
            
            processedBoxModels.push({
              id: item.id_bm?.toString() || '',
              kode: item.code || '',
              namaModel: item.name || '',
              deskripsi: item.description || '',
              status: item.status_bm === '1' || item.status_bm === 1,
              status_bm: item.status_bm?.toString() || '1',
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || new Date().toISOString(),
              formulaComponents,
              hasFormula,
              category: item.category || 'Mailer Box'
            })
            
          } catch (err) {
            processedBoxModels.push({
              id: item.id_bm?.toString() || '',
              kode: item.code || '',
              namaModel: item.name || '',
              deskripsi: item.description || '',
              status: item.status_bm === '1' || item.status_bm === 1,
              status_bm: item.status_bm?.toString() || '1',
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || new Date().toISOString(),
              formulaComponents: [],
              hasFormula: false,
              category: item.category || 'Mailer Box'
            })
          }
        }
        
        setBoxModels(processedBoxModels)
        
        setStats({
          totalModels: processedBoxModels.length,
          activeModels: processedBoxModels.filter(m => m.status).length,
          withFormulas: processedBoxModels.filter(m => m.hasFormula).length,
          withoutFormulas: processedBoxModels.filter(m => !m.hasFormula).length,
          mailerBoxCount: processedBoxModels.filter(m => m.category === 'Mailer Box').length,
          shoeBoxCount: processedBoxModels.filter(m => m.category === 'Shoe Box').length
        })
        
      } else {
        setBoxModels([])
        setError('Format response tidak sesuai')
      }
      
    } catch (err: any) {
      console.error('Error fetching box models:', err)
      setError(err.response?.data?.message || 'Tidak bisa connect ke server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoxModels()
  }, [fetchBoxModels])

  // ===== HANDLERS - ADD =====
  const handleAddClick = useCallback(() => {
    const generatedCode = generateCode(boxModels.map(m => m.kode))
    setAddFormData({
      code: generatedCode,
      name: '',
      description: '',
      category: 'Mailer Box',
      status_bm: '1'
    })
    setShowAddModal(true)
  }, [boxModels])

  const handleAddSave = async () => {
    if (!addFormData.name.trim()) {
      SweetAlert.error('Validasi Error', 'Nama model tidak boleh kosong')
      return
    }
    
    if (!addFormData.description.trim()) {
      SweetAlert.error('Validasi Error', 'Deskripsi tidak boleh kosong')
      return
    }
    
    try {
      setIsPosting(true)
      
      const response = await axios.post('/Admin/Box/boxModels', {
        code: addFormData.code.trim(),
        name: addFormData.name.trim(),
        description: addFormData.description.trim(),
        category: addFormData.category.trim(),
        status_bm: addFormData.status_bm
      }, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Box Model berhasil ditambahkan!')
        setShowAddModal(false)
        setAddFormData({ ...BASE_ADD_FORM })
        await fetchBoxModels()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal menambahkan Box Model')
      }
    } catch (err: any) {
      console.error('Error saat POST:', err)
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS - EDIT =====
  const handleEditClick = useCallback(async (item: BoxModel) => {
    try {
      const formulaResponse = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      
      let formulaComponents: FormulaComponent[] = []
      let hasFormula = false
      
      if (formulaResponse.data?.status === 200 && formulaResponse.data.data) {
        const formulaData = formulaResponse.data.data
        
        if (Array.isArray(formulaData.formula)) {
          formulaComponents = formulaData.formula.map((comp: any) => ({
            id: comp.id_bfc?.toString(),
            target: comp.target || 'panjang',
            source: comp.source || 'P',
            multiplier: parseFloat(comp.multiplier) || 0,
            allowance_mm: parseFloat(comp.allowance_mm) || 0,
            sort_order: parseInt(comp.sort_order) || 1
          }))
          hasFormula = formulaComponents.length > 0
        } else if (formulaData.formula && typeof formulaData.formula === 'object') {
          const comp = formulaData.formula
          formulaComponents = [{
            id: comp.id_bfc?.toString(),
            target: comp.target || 'panjang',
            source: comp.source || 'P',
            multiplier: parseFloat(comp.multiplier) || 0,
            allowance_mm: parseFloat(comp.allowance_mm) || 0,
            sort_order: parseInt(comp.sort_order) || 1
          }]
          hasFormula = true
        }
      }
      
      setEditingItem({
        ...item,
        status_bm: item.status ? '1' : '0',
        formulaComponents,
        hasFormula
      })
      
      setShowEditModal(true)
      
    } catch (err) {
      console.error('Error loading formula for edit:', err)
      setEditingItem({
        ...item,
        status_bm: item.status ? '1' : '0',
        formulaComponents: [],
        hasFormula: false
      })
      setShowEditModal(true)
    }
  }, [])

  const handleEditSave = async () => {
    if (!editingItem) return
    
    if (!editingItem.namaModel.trim()) {
      SweetAlert.error('Validasi Error', 'Nama model tidak boleh kosong')
      return
    }
    
    if (!editingItem.deskripsi?.trim()) {
      SweetAlert.error('Validasi Error', 'Deskripsi tidak boleh kosong')
      return
    }
    
    if (editingItem.formulaComponents?.length > 0) {
      const invalidComponents: string[] = []
      
      editingItem.formulaComponents.forEach((comp, index) => {
        if (!comp.target || !['panjang', 'lebar'].includes(comp.target)) {
          invalidComponents.push(`Component ${index + 1}: Target harus "panjang" atau "lebar"`)
        }
        if (!comp.source || !['P', 'L', 'T', 'A', 'B', 'C'].includes(comp.source)) {
          invalidComponents.push(`Component ${index + 1}: Source harus P/L/T/A/B/C`)
        }
        if (comp.multiplier === undefined || comp.multiplier === null || isNaN(comp.multiplier) || comp.multiplier <= 0) {
          invalidComponents.push(`Component ${index + 1}: Multiplier harus angka > 0`)
        }
      })
      
      if (invalidComponents.length > 0) {
        SweetAlert.error('Validasi Formula Error', 
          invalidComponents.slice(0, 3).join('<br>') + 
          (invalidComponents.length > 3 ? `<br>... dan ${invalidComponents.length - 3} error lainnya` : '')
        )
        return
      }
    }
    
    try {
      setIsPosting(true)
      
      const formulaData = (editingItem.formulaComponents || []).map(comp => ({
        target: comp.target,
        source: comp.source,
        multiplier: parseFloat(comp.multiplier.toString()).toString(),
        allowance_mm: comp.allowance_mm ? parseFloat(comp.allowance_mm.toString()).toString() : '0',
        sort_order: comp.sort_order ? parseInt(comp.sort_order.toString()).toString() : '1'
      }))
      
      const response = await axios.put(`/Admin/Box/boxModelsFormulaEdit/${editingItem.id}`, {
        code: editingItem.kode.trim(),
        name: editingItem.namaModel.trim(),
        description: editingItem.deskripsi.trim(),
        category: editingItem.category || 'Mailer Box',
        status_bm: editingItem.status_bm || '1',
        formula: formulaData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Box Model dan Formula berhasil diperbarui!')
        await fetchBoxModels()
        setShowEditModal(false)
        setEditingItem(null)
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal mengupdate data')
      }
      
    } catch (err: any) {
      console.error('Error updating box model:', err)
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS - FORMULA =====
  const handleFormulaClick = useCallback(async (item: BoxModel) => {
    try {
      const response = await axios.get(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      
      if (response.data?.status === 200 && response.data.data) {
        const hasExistingFormula = Array.isArray(response.data.data.formula) && 
                                   response.data.data.formula.length > 0
        
        if (hasExistingFormula) {
          SweetAlert.confirmAction(
            'Formula Sudah Ada',
            'Box model ini sudah memiliki formula. Untuk mengedit formula, silakan gunakan menu Edit.'
          ).then((result) => {
            if (result.isConfirmed) {
              handleEditClick(item)
            }
          })
        } else {
          setEditingItem(item)
          setEditingFormulaComponents([])
          setShowFormulaModal(true)
        }
      } else {
        setEditingItem(item)
        setEditingFormulaComponents([])
        setShowFormulaModal(true)
      }
      
    } catch (err: any) {
      console.error('Error checking formula:', err)
      if (err.response?.status === 404 || err.response?.status === 400) {
        setEditingItem(item)
        setEditingFormulaComponents([])
        setShowFormulaModal(true)
      } else {
        SweetAlert.error('Error', 'Gagal memeriksa formula')
      }
    }
  }, [handleEditClick])

  const handleFormulaSave = async () => {
    if (!editingItem) return

    const invalidComponents = editingFormulaComponents.filter(comp => 
      !comp.box_model_id || 
      !comp.target || 
      !comp.source || 
      comp.multiplier === undefined || comp.multiplier === null || isNaN(comp.multiplier) || comp.multiplier <= 0
    )
    
    if (invalidComponents.length > 0) {
      SweetAlert.error('Validasi Error', 'Beberapa komponen memiliki data wajib yang belum diisi')
      return
    }

    try {
      setIsPosting(true)
      let successCount = 0
      
      for (const [index, component] of editingFormulaComponents.entries()) {
        try {
          await axios.post('/Admin/Box/boxFormulaComponents', {
            box_model_id: editingItem.id.toString(),
            target: component.target,
            source: component.source,
            multiplier: component.multiplier.toString(),
            allowance_mm: component.allowance_mm?.toString() || '',
            sort_order: component.sort_order?.toString() || (index + 1).toString()
          }, {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          })
          successCount++
        } catch (postErr) {
          console.error(`Error komponen ${index + 1}:`, postErr)
        }
      }
      
      if (successCount > 0) {
        SweetAlert.success('Berhasil!', `${successCount} komponen formula berhasil disimpan!`)
        await fetchBoxModels()
        setShowFormulaModal(false)
        setEditingItem(null)
        setEditingFormulaComponents([])
      } else {
        SweetAlert.error('Gagal!', 'Tidak ada komponen yang berhasil disimpan')
      }
      
    } catch (err: any) {
      console.error('Error menyimpan formula:', err)
      SweetAlert.error('Error!', err.message || 'Terjadi kesalahan saat menyimpan formula')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLERS - DELETE & STATUS =====
  const handleDelete = useCallback(async (id: string, name: string) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/Admin/Box/boxModelsDel/${id}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        
        if (response.data?.status === 200) {
          SweetAlert.success('Dihapus!', `Box Model "${name}" berhasil dihapus!`)
          await fetchBoxModels()
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus Box Model')
        }
      } catch (err: any) {
        console.error('Error:', err)
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus data')
      }
    }
  }, [fetchBoxModels])

  const toggleStatus = useCallback(async (item: BoxModel) => {
    const result = await SweetAlert.confirmAction(
      'Ubah Status?',
      `Apakah Anda yakin ingin ${item.status ? 'menonaktifkan' : 'mengaktifkan'} "${item.namaModel}"?`
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
        
        if (response.data?.status === 200) {
          const statusText = newStatus ? 'diaktifkan' : 'dinonaktifkan'
          SweetAlert.success('Berhasil!', `Box Model "${item.namaModel}" berhasil ${statusText}!`)
          
          setBoxModels(prev => prev.map(model => 
            model.id === item.id ? { 
              ...model, 
              status: newStatus,
              status_bm: statusValue
            } : model
          ))
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal mengubah status')
        }
      } catch (err: any) {
        console.error('Error:', err)
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan saat mengubah status')
      }
    }
  }, [])

  // ===== HANDLERS - FORMULA COMPONENTS =====
  const addFormulaComponent = useCallback(() => {
    setEditingFormulaComponents(prev => [
      ...prev,
      {
        id: `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        box_model_id: editingItem?.id?.toString() || '',
        target: 'panjang',
        source: 'P',
        multiplier: 1,
        allowance_mm: 0,
        sort_order: prev.length + 1
      }
    ])
  }, [editingItem])

  const updateFormulaComponent = useCallback((index: number, field: string, value: any) => {
    setEditingFormulaComponents(prev => {
      const updated = [...prev]
      if (field === 'multiplier' || field === 'allowance_mm') {
        updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 }
      } else if (field === 'sort_order') {
        updated[index] = { ...updated[index], [field]: parseInt(value) || 1 }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }, [])

  const removeFormulaComponent = useCallback((index: number) => {
    setEditingFormulaComponents(prev => {
      const updated = prev.filter((_, i) => i !== index)
      updated.forEach((comp, i) => { comp.sort_order = i + 1 })
      return updated
    })
  }, [])

  const addEditFormulaComponent = useCallback(() => {
    if (!editingItem) return
    
    setEditingItem(prev => {
      if (!prev) return prev
      
      const newComponent: FormulaComponent = {
        id: `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        box_model_id: prev.id,
        target: 'panjang',
        source: 'P',
        multiplier: 1,
        allowance_mm: 0,
        sort_order: (prev.formulaComponents?.length || 0) + 1
      }
      
      return {
        ...prev,
        formulaComponents: [...(prev.formulaComponents || []), newComponent]
      }
    })
  }, [editingItem])

  const updateEditFormulaComponent = useCallback((index: number, field: string, value: any) => {
    if (!editingItem) return
    
    setEditingItem(prev => {
      if (!prev) return prev
      
      const updated = [...(prev.formulaComponents || [])]
      
      if (field === 'multiplier' || field === 'allowance_mm') {
        updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 }
      } else if (field === 'sort_order') {
        updated[index] = { ...updated[index], [field]: parseInt(value) || 1 }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      
      return { ...prev, formulaComponents: updated }
    })
  }, [editingItem])

  const removeEditFormulaComponent = useCallback((index: number) => {
    if (!editingItem) return
    
    setEditingItem(prev => {
      if (!prev) return prev
      
      const updated = (prev.formulaComponents || []).filter((_, i) => i !== index)
      updated.forEach((comp, i) => { comp.sort_order = i + 1 })
      
      return { ...prev, formulaComponents: updated }
    })
  }, [editingItem])

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

  const handleCloseFormulaModal = useCallback(() => {
    if (!isPosting) {
      setShowFormulaModal(false)
      setEditingItem(null)
      setEditingFormulaComponents([])
    }
  }, [isPosting])

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:package-variant" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Box Models...</p>
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
            <Button onClick={fetchBoxModels} variant="danger" className="mx-auto">
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
            <Icon icon="mdi:package-variant-closed" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Box Models
            </h1>
            <p className="text-gray-600 mt-1">Kelola model kotak dan rumus perhitungan dimensi</p>
          </div>
        </div>
        
        <Button
          onClick={handleAddClick}
          variant="primary"
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          icon="mdi:plus"
        >
          Tambah Model Baru
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:package-variant" className="w-4 h-4 text-blue-600" />
              Total Models
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.totalModels.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Icon icon="mdi:check-circle" className="w-3 h-3" />
                {stats.activeModels} Aktif
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-red-600 font-medium flex items-center gap-1">
                <Icon icon="mdi:minus-circle" className="w-3 h-3" />
                {inactiveModels} Nonaktif
              </span>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:calculator" className="w-4 h-4 text-green-600" />
              Dengan Formula
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.withFormulas}</p>
              <span className="text-sm text-gray-500">/ {stats.totalModels}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${stats.totalModels ? (stats.withFormulas / stats.totalModels) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalModels ? Math.round((stats.withFormulas / stats.totalModels) * 100) : 0}% sudah punya formula
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4 text-amber-600" />
              Tanpa Formula
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.withoutFormulas}</p>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Icon icon="mdi:alert" className="w-3 h-3 text-amber-500" />
              {stats.withoutFormulas} model perlu setup formula
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:chart-pie" className="w-4 h-4 text-purple-600" />
              Kategori
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-gray-900">Mailer: {stats.mailerBoxCount}</p>
            </div>
            <p className="text-xs text-gray-500">Shoe: {stats.shoeBoxCount} | Lainnya: {stats.totalModels - stats.mailerBoxCount - stats.shoeBoxCount}</p>
          </div>
        </Card>
      </div>

      {/* ===== MAIN CARD ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-blue-600" />
              Daftar Box Models
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.totalModels} model ({stats.withFormulas} dengan formula, {stats.withoutFormulas} tanpa formula)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBoxModels}
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
                {['Kode', 'Nama Model', 'Kategori', 'Status', 'Formula', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boxModels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Icon icon="mdi:package-variant" className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Belum ada data box model</p>
                      <p className="text-sm text-gray-400 mt-1">Klik tombol "Tambah Model Baru" untuk memulai</p>
                    </div>
                  </td>
                </tr>
              ) : (
                boxModels.map((model) => (
                  <tr key={model.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <Icon icon="mdi:tag" className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-mono font-medium text-blue-600">{model.kode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{model.namaModel}</div>
                      <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">{model.deskripsi || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadgeClass(model.category)}`}>
                        {model.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(model.status)}`}>
                          {model.status ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <button
                          onClick={() => toggleStatus(model)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          title={model.status ? 'Set nonaktif' : 'Set aktif'}
                        >
                          <Icon icon="mdi:swap-vertical" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getFormulaBadgeClass(model.hasFormula)}`}>
                          {model.hasFormula ? '✓ Ada Formula' : '✗ Belum Ada'}
                        </span>
                        {model.hasFormula && (
                          <div className="text-xs text-gray-500 max-w-xs truncate" title={formatFormulaDisplay(model.formulaComponents)}>
                            {formatFormulaDisplay(model.formulaComponents)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(model)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Icon icon="mdi:pencil" className="w-5 h-5" />
                        </button>
                        
                        {!model.hasFormula && (
                          <button
                            onClick={() => handleFormulaClick(model)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Tambah Formula"
                          >
                            <Icon icon="mdi:calculator" className="w-5 h-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(model.id, model.namaModel)}
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
        {boxModels.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Menampilkan {boxModels.length} dari {stats.totalModels} model
            </div>
            <button
              onClick={() => SweetAlert.info('Export', 'Exporting box models data...')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Icon icon="mdi:export" className="w-4 h-4" />
              <span className="text-sm font-medium">Export Data</span>
            </button>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Box Model Baru"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAddSave} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Menyimpan...' : 'Simpan Model'}
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
                  Kode akan digenerate otomatis. Isi semua field wajib yang bertanda *
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Model *
            </label>
            <input
              type="text"
              value={addFormData.code}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed text-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">Kode otomatis, tidak dapat diubah</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Model *
            </label>
            <input
              type="text"
              value={addFormData.name}
              onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
              placeholder="Contoh: Mailer Box 30x20x15"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Masukkan nama yang deskriptif</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Model *
            </label>
            <textarea
              value={addFormData.description}
              onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              placeholder="Deskripsikan model kotak ini..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Deskripsi singkat tentang model kotak</p>
          </div>
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Box Model"
        size="4xl"
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
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                  <Icon icon="mdi:information-outline" className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Informasi Dasar</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode
                  </label>
                  <input
                    type="text"
                    value={editingItem.kode}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed text-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Model *
                  </label>
                  <input
                    type="text"
                    value={editingItem.namaModel}
                    onChange={(e) => setEditingItem({ ...editingItem, namaModel: e.target.value })}
                    placeholder="Masukkan nama model"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    required
                    disabled={isPosting}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi *
                </label>
                <textarea
                  value={editingItem.deskripsi || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  placeholder="Masukkan deskripsi box model..."
                  disabled={isPosting}
                  required
                />
              </div>
            </div>

            {/* Formula Section */}
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                    <Icon icon="mdi:calculator" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Formula Components</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Kelola rumus perhitungan dimensi box</p>
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={addEditFormulaComponent}
                  variant="success"
                  size="sm"
                  disabled={isPosting}
                  icon="mdi:plus"
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  Tambah Component
                </Button>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-5 border border-blue-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-blue-100 px-2 py-1 rounded font-semibold text-blue-700">P</span>
                  <span className="text-gray-600">Panjang (cm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-green-100 px-2 py-1 rounded font-semibold text-green-700">L</span>
                  <span className="text-gray-600">Lebar (cm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-purple-100 px-2 py-1 rounded font-semibold text-purple-700">T</span>
                  <span className="text-gray-600">Tinggi (cm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-amber-100 px-2 py-1 rounded font-semibold text-amber-700">A</span>
                  <span className="text-gray-600">P × 10 (mm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-amber-100 px-2 py-1 rounded font-semibold text-amber-700">B</span>
                  <span className="text-gray-600">L × 10 (mm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-amber-100 px-2 py-1 rounded font-semibold text-amber-700">C</span>
                  <span className="text-gray-600">T × 10 (mm)</span>
                </div>
              </div>

              <div className="space-y-4">
                {editingItem.formulaComponents && editingItem.formulaComponents.length > 0 ? (
                  editingItem.formulaComponents.map((component, index) => (
                    <Card key={component.id || `comp-${index}`} className="p-5 border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-700 bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-1.5 rounded-full border border-blue-200">
                            Component #{index + 1}
                          </span>
                          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {component.target === 'panjang' ? '📐 Panjang' : '📏 Lebar'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditFormulaComponent(index)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isPosting}
                          title="Hapus component"
                        >
                          <Icon icon="mdi:delete" className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target *
                          </label>
                          <select
                            value={component.target}
                            onChange={(e) => updateEditFormulaComponent(index, 'target', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            disabled={isPosting}
                          >
                            {TARGET_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Source *
                          </label>
                          <select
                            value={component.source}
                            onChange={(e) => updateEditFormulaComponent(index, 'source', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            disabled={isPosting}
                          >
                            {SOURCE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Multiplier *
                          </label>
                          <input
                            type="number"
                            value={component.multiplier}
                            onChange={(e) => updateEditFormulaComponent(index, 'multiplier', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            disabled={isPosting}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Allowance (mm)
                          </label>
                          <input
                            type="number"
                            value={component.allowance_mm || ''}
                            onChange={(e) => updateEditFormulaComponent(index, 'allowance_mm', e.target.value)}
                            placeholder="0"
                            step="0.1"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            disabled={isPosting}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            value={component.sort_order || index + 1}
                            onChange={(e) => updateEditFormulaComponent(index, 'sort_order', e.target.value)}
                            min="1"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            disabled={isPosting}
                          />
                        </div>
                      </div>

                      <div className="mt-4 text-sm bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg border border-gray-200">
                        <span className="font-semibold text-gray-700">Formula: </span>
                        <span className="text-blue-600 font-mono font-medium">
                          {component.source} × {component.multiplier}
                          {component.allowance_mm ? ` + ${component.allowance_mm}mm` : ''}
                        </span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border-2 border-dashed border-gray-300">
                    <Icon icon="mdi:calculator-off" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold mb-1 text-lg">Belum ada formula components</p>
                    <p className="text-sm text-gray-500 mb-6">Tambahkan komponen formula untuk mulai menghitung dimensi box</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={addEditFormulaComponent}
                      disabled={isPosting}
                      icon="mdi:plus"
                      className="shadow-md hover:shadow-lg transition-all"
                    >
                      Tambah Component Pertama
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== FORMULA MODAL ===== */}
      <Modal
        isOpen={showFormulaModal}
        onClose={handleCloseFormulaModal}
        title="➕ Tambah Formula"
        size="4xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseFormulaModal} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleFormulaSave} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Menyimpan...' : 'Simpan Formula'}
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Icon icon="mdi:information" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-2 text-lg">Menambahkan Formula Baru</h4>
                  <p className="text-sm text-blue-700 mb-1">
                    <span className="font-semibold">Box Model:</span> {editingItem.namaModel} 
                    <span className="text-blue-600 ml-2">(Kode: {editingItem.kode})</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-2 bg-blue-100 px-3 py-1.5 rounded-lg inline-block">
                    ℹ️ Box model ini belum memiliki formula. Tambahkan komponen formula di bawah.
                  </p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-blue-100 px-2 py-1 rounded font-semibold text-blue-700">P</span>
                <span className="text-gray-600">Panjang (cm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-green-100 px-2 py-1 rounded font-semibold text-green-700">L</span>
                <span className="text-gray-600">Lebar (cm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-purple-100 px-2 py-1 rounded font-semibold text-purple-700">T</span>
                <span className="text-gray-600">Tinggi (cm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-amber-100 px-2 py-1 rounded font-semibold text-amber-700">A</span>
                <span className="text-gray-600">P × 10 (mm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-amber-100 px-2 py-1 rounded font-semibold text-amber-700">B</span>
                <span className="text-gray-600">L × 10 (mm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-amber-100 px-2 py-1 rounded font-semibold text-amber-700">C</span>
                <span className="text-gray-600">T × 10 (mm)</span>
              </div>
            </div>

            {/* Formula Components */}
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                    <Icon icon="mdi:calculator" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Formula Components</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Tambahkan komponen rumus perhitungan</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addFormulaComponent}
                  variant="success"
                  size="sm"
                  disabled={isPosting}
                  icon="mdi:plus"
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  Tambah Component
                </Button>
              </div>

              <div className="space-y-4">
                {editingFormulaComponents.map((component, index) => (
                  <Card key={component.id} className="p-5 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-gray-700 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-1.5 rounded-full border border-green-200">
                        Component #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFormulaComponent(index)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isPosting}
                        title="Hapus component"
                      >
                        <Icon icon="mdi:delete" className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target *
                        </label>
                        <select
                          value={component.target}
                          onChange={(e) => updateFormulaComponent(index, 'target', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={isPosting}
                        >
                          {TARGET_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Source *
                        </label>
                        <select
                          value={component.source}
                          onChange={(e) => updateFormulaComponent(index, 'source', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={isPosting}
                        >
                          {SOURCE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Multiplier *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={component.multiplier}
                          onChange={(e) => updateFormulaComponent(index, 'multiplier', e.target.value)}
                          placeholder="1.0"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={isPosting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allowance (mm)
                        </label>
                        <input
                          type="number"
                          value={component.allowance_mm || ''}
                          onChange={(e) => updateFormulaComponent(index, 'allowance_mm', e.target.value)}
                          placeholder="0"
                          step="0.1"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={isPosting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={component.sort_order || index + 1}
                          onChange={(e) => updateFormulaComponent(index, 'sort_order', e.target.value)}
                          min="1"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={isPosting}
                        />
                      </div>
                    </div>

                    <div className="mt-4 text-sm bg-gradient-to-r from-gray-50 to-green-50 p-3 rounded-lg border border-gray-200">
                      <span className="font-semibold text-gray-700">Formula: </span>
                      <span className="text-green-600 font-mono font-medium">
                        {component.source} × {component.multiplier}
                        {component.allowance_mm ? ` + ${component.allowance_mm}mm` : ''}
                      </span>
                    </div>
                  </Card>
                ))}

                {editingFormulaComponents.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl border-2 border-dashed border-gray-300">
                    <Icon icon="mdi:calculator-off" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold mb-1 text-lg">Belum ada formula components</p>
                    <p className="text-sm text-gray-500 mb-6">Klik tombol "Tambah Component" untuk memulai</p>
                    <Button
                      variant="primary"
                      onClick={addFormulaComponent}
                      disabled={isPosting}
                      icon="mdi:plus"
                      className="shadow-md hover:shadow-lg transition-all"
                    >
                      Tambah Component Pertama
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}