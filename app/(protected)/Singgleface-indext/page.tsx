// app/%28protected%29/sheet-settings/page.tsx

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Button from '@/components/UI/Button'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import SweetAlert from '@/components/UI/SweetAlert'
import { Icon } from '@iconify/react'

// ===== TYPE DEFINITIONS =====
interface Flute {
  id: string
  code: string
  name: string
}

interface SinglefaceSubstance {
  id: string
  no: string
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  substance_code: string
  created_at: string
  updated_at: string
  [key: string]: any
}

interface FormData {
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  flutes: string[]
  price_per_m2: { [key: string]: string }
}

interface Stats {
  totalSubstances: number
  activeSubstances: number
  withAllFlutes: number
  totalIndices: number
}

interface CacheData {
  layer_1: string
  layer_2: string
  timestamp: number
}

// ===== PAGINATION TYPES =====
interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

// ===== BASE FORM TEMPLATE =====
const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_type: 'K',
  layer_2: '',
  layer_2_type: 'M',
  flutes: [],
  price_per_m2: {}
}

export default function SinglefaceSettingsPage() {
  const router = useRouter()

  // ===== STATE =====
  const [singlefaceSubstances, setSinglefaceSubstances] = useState<SinglefaceSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  // Cache state
  const [layerCache, setLayerCache] = useState<Record<string, CacheData>>({})

  // Pagination state
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  })

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SinglefaceSubstance | null>(null)

  // Form states
  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalSubstances: 0,
    activeSubstances: 0,
    withAllFlutes: 0,
    totalIndices: 0
  })

  // ===== CLEAR ALL CACHE =====
  const clearAllLayerCache = useCallback(() => {
    // Konfirmasi sebelum menghapus
    SweetAlert.confirm(
      'Clear All Cache',
      'Apakah Anda yakin ingin menghapus semua cache? Tindakan ini tidak dapat dibatalkan.',
      'warning'
    ).then((result) => {
      if (result.isConfirmed) {
        try {
          // Clear from state
          setLayerCache({})
          
          // Clear from localStorage
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('layer_cache_')) {
              keysToRemove.push(key)
            }
          }
          
          keysToRemove.forEach(key => localStorage.removeItem(key))
          
          SweetAlert.success('Cache Cleared', 'Semua cache berhasil dihapus')
          
          // Refresh data
          setTimeout(() => {
            fetchSinglefaceIndex()
          }, 500)
          
        } catch (err) {
          console.error('Error clearing cache:', err)
          SweetAlert.error('Error', 'Gagal menghapus cache')
        }
      }
    })
  }, [])

  // ===== FILTERED DATA =====
  const filteredSubstances = useMemo(() => {
    return singlefaceSubstances
  }, [singlefaceSubstances])

  // ===== PAGINATED DATA =====
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return filteredSubstances.slice(startIndex, endIndex)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  // ===== OTOMATIS PILIH SEMUA FLUTE =====
  useEffect(() => {
    if (flutes.length > 0 && showAddModal) {
      setAddFormData(prev => ({
        ...prev,
        flutes: [],
        price_per_m2: {}
      }))
    }
  }, [flutes, showAddModal])

  // ===== PAGINATION HANDLERS =====
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: value,
      currentPage: 1,
      totalPages: Math.ceil(filteredSubstances.length / value)
    }))
  }

  // ===== UPDATE PAGINATION ON DATA CHANGE =====
  useEffect(() => {
    const totalItems = filteredSubstances.length
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: prev.currentPage > totalPages && totalPages > 0 ? 1 : prev.currentPage
    }))
  }, [filteredSubstances, pagination.itemsPerPage])

  // ===== LOAD CACHE FROM LOCALSTORAGE =====
  const loadLayerCache = useCallback((): Record<string, CacheData> => {
    const cache: Record<string, CacheData> = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('layer_cache_')) {
          const id = key.replace('layer_cache_', '')
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          if (data.timestamp && Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
            cache[id] = data
          }
        }
      }
    } catch (err) {
      console.error('Error loading cache:', err)
    }
    return cache
  }, [])

  // ===== SAVE TO CACHE =====
  const saveToCache = useCallback((id: string, layer_1: string, layer_2: string) => {
    const cacheData: CacheData = {
      layer_1,
      layer_2,
      timestamp: Date.now()
    }
    
    setLayerCache(prev => ({
      ...prev,
      [id]: cacheData
    }))
    
    localStorage.setItem(`layer_cache_${id}`, JSON.stringify(cacheData))
  }, [])

  // ===== FETCH FLUTES =====
  const fetchFlutes = useCallback(async (): Promise<Flute[]> => {
    try {
      const response = await axios.get('/Admin/Singelface/singelfaceFlutes', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      let processedFlutes: Flute[] = []

      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        processedFlutes = response.data.data.map((flute: any) => ({
          id: flute.id_f?.toString() || '',
          code: flute.code || '',
          name: flute.name || ''
        }))
      } else if (Array.isArray(response.data)) {
        processedFlutes = response.data.map((flute: any) => ({
          id: flute.id_f?.toString() || '',
          code: flute.code || '',
          name: flute.name || ''
        }))
      }

      setFlutes(processedFlutes)
      return processedFlutes
    } catch (err) {
      console.error('Error fetching flutes:', err)
      setFlutes([])
      return []
    }
  }, [])

  // ===== FETCH SINGLEFACE INDEX =====
  const fetchSinglefaceIndex = useCallback(async (): Promise<SinglefaceSubstance[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get('/Admin/Singelface/singelfaceIndex', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      const responseData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || []

      if (!Array.isArray(responseData)) {
        throw new Error('Invalid response format')
      }

      const currentCache = loadLayerCache()
      const groupedData: { [key: string]: SinglefaceSubstance } = {}
      
      responseData.forEach((item: any) => {
        const substanceId = item.substance_id || item.id_ss
        
        if (!groupedData[substanceId]) {
          let layer1 = item.layer_1_weight
          let layer2 = item.layer_2_weight
          
          const layer1Type = item.layer_1_type || 'K'
          const layer2Type = item.layer_2_type || 'M'
          
          if ((layer1 === '0' || layer1 === 0 || !layer1) && currentCache[substanceId]) {
            layer1 = currentCache[substanceId].layer_1
          }
          
          if ((layer2 === '0' || layer2 === 0 || !layer2) && currentCache[substanceId]) {
            layer2 = currentCache[substanceId].layer_2
          }
          
          if ((layer1 === '0' || layer1 === 0 || !layer1) && singlefaceSubstances.length > 0) {
            const existing = singlefaceSubstances.find(s => s.id === substanceId)
            if (existing && existing.layer_1 && existing.layer_1 !== '0') {
              layer1 = existing.layer_1
            }
          }
          
          if ((layer2 === '0' || layer2 === 0 || !layer2) && singlefaceSubstances.length > 0) {
            const existing = singlefaceSubstances.find(s => s.id === substanceId)
            if (existing && existing.layer_2 && existing.layer_2 !== '0') {
              layer2 = existing.layer_2
            }
          }
          
          groupedData[substanceId] = {
            id: substanceId.toString(),
            no: '',
            layer_1: layer1 ? layer1.toString() : '',
            layer_1_type: layer1Type,
            layer_2: layer2 ? layer2.toString() : '',
            layer_2_type: layer2Type,
            substance_code: `${layer1}${layer1Type}/${layer2}${layer2Type}`,
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
            _api_layer_1: item.layer_1_weight,
            _api_layer_2: item.layer_2_weight
          }
        }
        
        const fluteCode = item.code
        if (fluteCode) {
          const priceField = `${fluteCode.toLowerCase()}_flute_price`
          const price = parseFloat(item.price_per_m2) || 0
          groupedData[substanceId][priceField] = price
        }
      })

      const processedSubstances = Object.values(groupedData).map((item, index) => ({
        ...item,
        no: (index + 1).toString()
      }))
      
      const zeroLayers = processedSubstances.filter(s => s.layer_1 === '0' || s.layer_2 === '0')

      setSinglefaceSubstances(processedSubstances)

      const totalSubstances = processedSubstances.length
      const totalIndices = responseData.length

      setStats({
        totalSubstances,
        activeSubstances: totalSubstances - zeroLayers.length,
        withAllFlutes: totalSubstances,
        totalIndices
      })

      return processedSubstances
    } catch (err: any) {
      console.error('Error fetching singleface index:', err)
      setError(err.message || 'Failed to fetch data')
      setSinglefaceSubstances([])
      setStats({ totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0, totalIndices: 0 })
      return []
    } finally {
      setLoading(false)
    }
  }, [loadLayerCache, singlefaceSubstances])

  // ===== INITIAL LOAD =====
  useEffect(() => {
    const init = async () => {
      try {
        const initialCache = loadLayerCache()
        setLayerCache(initialCache)
        
        await fetchFlutes()
        await fetchSinglefaceIndex()
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to load data')
      }
    }
    init()
  }, [])

  // ===== FORM HANDLERS =====
  const handleAddInputChange = (field: string, value: any) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // ===== HANDLE FLUTE SELECTION =====
  const handleAddFluteToggle = (fluteCode: string) => {
    setAddFormData(prev => {
      const isSelected = prev.flutes.includes(fluteCode)
      let newFlutes: string[]
      let newPricePerM2 = { ...prev.price_per_m2 }
      
      if (isSelected) {
        newFlutes = prev.flutes.filter(code => code !== fluteCode)
        delete newPricePerM2[fluteCode]
      } else {
        newFlutes = [...prev.flutes, fluteCode]
        newPricePerM2[fluteCode] = ''
      }
      
      return {
        ...prev,
        flutes: newFlutes,
        price_per_m2: newPricePerM2
      }
    })
  }

  const handleEditFluteToggle = (fluteCode: string) => {
    setEditFormData(prev => {
      const isSelected = prev.flutes.includes(fluteCode)
      let newFlutes: string[]
      let newPricePerM2 = { ...prev.price_per_m2 }
      
      if (isSelected) {
        newFlutes = prev.flutes.filter(code => code !== fluteCode)
        delete newPricePerM2[fluteCode]
      } else {
        newFlutes = [...prev.flutes, fluteCode]
        if (!newPricePerM2[fluteCode]) {
          newPricePerM2[fluteCode] = ''
        }
      }
      
      return {
        ...prev,
        flutes: newFlutes,
        price_per_m2: newPricePerM2
      }
    })
  }

  // ===== VALIDATION =====
  const validateForm = (formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {}

    const layerFields = ['layer_1', 'layer_2']
    layerFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = 'Gramasi tidak boleh kosong'
      } else if (isNaN(parseFloat(formData[field])) || parseFloat(formData[field]) <= 0) {
        errors[field] = 'Gramasi harus angka lebih dari 0'
      }
    })

    formData.flutes.forEach(fluteCode => {
      const price = formData.price_per_m2?.[fluteCode]
      if (!price || price.toString().trim() === '') {
        errors[`price_${fluteCode}`] = `Harga ${fluteCode}-Flute tidak boleh kosong jika dipilih`
      } else if (isNaN(parseFloat(price))) {
        errors[`price_${fluteCode}`] = `Harga ${fluteCode}-Flute harus berupa angka`
      } else if (parseFloat(price) <= 0) {
        errors[`price_${fluteCode}`] = `Harga ${fluteCode}-Flute harus lebih dari 0`
      }
    })

    if (formData.flutes.length === 0) {
      errors.flutes = 'Pilih minimal satu flute type'
    }

    return errors
  }

  const handleAddSave = async () => {
    const errors = validateForm(addFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPosting(true)

      const fluteIds = addFormData.flutes.map(fluteCode => {
        const flute = flutes.find(f => f.code === fluteCode)
        return flute ? parseInt(flute.id) : 0
      }).filter(id => id > 0)

      const priceArray = addFormData.flutes.map(fluteCode => 
        parseFloat(addFormData.price_per_m2[fluteCode] || '0')
      )

      const layer1Value = parseFloat(addFormData.layer_1.trim())
      const layer2Value = parseFloat(addFormData.layer_2.trim())

      const postData = {
        layer_1_weight: layer1Value,
        layer_2_weight: layer2Value,
        layer_1: layer1Value,
        layer_2: layer2Value,
        layer_1_type: addFormData.layer_1_type.trim(),
        layer_2_type: addFormData.layer_2_type.trim(),
        flutes: fluteIds,
        price_per_m2: priceArray
      }

      const response = await axios.post('/Admin/Singelface/singelfaceIndexAdd', postData, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      })

      if (response.data?.status === 200 || response.status === 200) {
        SweetAlert.success('Berhasil!', `Data berhasil ditambahkan (Layer 1: ${addFormData.layer_1}, Layer 2: ${addFormData.layer_2})`)
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
        setFormErrors({})
        
        setTimeout(() => {
          fetchSinglefaceIndex()
        }, 1500)
        
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal menambahkan data')
      }
    } catch (err: any) {
      console.error('Error:', err)
      SweetAlert.error('Error!', err.response?.data?.message || `Terjadi kesalahan: ${err.message}`)
    } finally {
      setIsPosting(false)
    }
  }

  const handleEditClick = (item: SinglefaceSubstance) => {
    const existingFlutes: string[] = []
    const existingPrices: { [key: string]: string } = []
    
    flutes.forEach(flute => {
      const priceField = `${flute.code.toLowerCase()}_flute_price`
      const price = item[priceField]
      
      if (price !== undefined && price !== null && price !== '' && price !== 0) {
        existingFlutes.push(flute.code)
        existingPrices[flute.code] = price.toString()
      }
    })
    
    const editData: FormData = {
      layer_1: item.layer_1 && item.layer_1 !== '0' ? item.layer_1.toString() : '',
      layer_1_type: item.layer_1_type || 'K',
      layer_2: item.layer_2 && item.layer_2 !== '0' ? item.layer_2.toString() : '',
      layer_2_type: item.layer_2_type || 'M',
      flutes: existingFlutes,
      price_per_m2: existingPrices
    }

    setEditingItem(item)
    setEditFormData(editData)
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingItem) return
    
    const errors = validateForm(editFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPosting(true)

      const fluteIds = editFormData.flutes.map(fluteCode => {
        const flute = flutes.find(f => f.code === fluteCode)
        return flute ? parseInt(flute.id) : 0
      }).filter(id => id > 0)

      const priceArray = editFormData.flutes.map(fluteCode => 
        parseFloat(editFormData.price_per_m2[fluteCode] || '0')
      )

      const putData = {
        substance_id: parseInt(editingItem.id),
        layer_1: parseFloat(editFormData.layer_1.trim()),
        layer_1_type: editFormData.layer_1_type.trim(),
        layer_2: parseFloat(editFormData.layer_2.trim()),
        layer_2_type: editFormData.layer_2_type.trim(),
        flutes: fluteIds,
        price_per_m2: priceArray
      }

      const response = await axios.put('/Admin/Singelface/singelfaceIndexUpdate', putData, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data?.status === 200 || response.status === 200) {
        saveToCache(editingItem.id, editFormData.layer_1, editFormData.layer_2)
        
        setSinglefaceSubstances(prev => 
          prev.map(item => 
            item.id === editingItem.id 
              ? {
                  ...item,
                  layer_1: editFormData.layer_1,
                  layer_2: editFormData.layer_2,
                  layer_1_type: editFormData.layer_1_type,
                  layer_2_type: editFormData.layer_2_type,
                  substance_code: `${editFormData.layer_1}${editFormData.layer_1_type}/${editFormData.layer_2}${editFormData.layer_2_type}`,
                  ...flutes.reduce((acc, flute) => {
                    const priceField = `${flute.code.toLowerCase()}_flute_price`
                    if (editFormData.flutes.includes(flute.code)) {
                      acc[priceField] = parseFloat(editFormData.price_per_m2[flute.code] || '0')
                    } else {
                      acc[priceField] = 0
                    }
                    return acc
                  }, {} as Record<string, number>)
                }
              : item
          )
        )

        SweetAlert.success('Berhasil!', 'Data berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
        setFormErrors({})
        
        setTimeout(() => {
          fetchSinglefaceIndex()
        }, 1000)
        
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal memperbarui data')
      }
    } catch (err: any) {
      console.error('Error:', err)
      SweetAlert.error('Error!', err.response?.data?.message || `Terjadi kesalahan: ${err.message}`)
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE HANDLER =====
  const handleDelete = async (id: string, substanceCode: string) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        localStorage.removeItem(`layer_cache_${id}`)
        setLayerCache(prev => {
          const newCache = { ...prev }
          delete newCache[id]
          return newCache
        })

        const response = await axios.delete(`/Admin/Singelface/singelfaceIndexDelete/${id}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (response.data?.status === 200) {
          SweetAlert.success('Berhasil!', 'Data berhasil dihapus')
          
          setSinglefaceSubstances(prev => prev.filter(item => item.id !== id))
          
          setTimeout(() => {
            fetchSinglefaceIndex()
          }, 1000)
          
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus data')
        }
      } catch (err: any) {
        console.error('Delete error:', err)
        SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan')
      }
    }
  }

  // ===== REFRESH HANDLER =====
  const handleRefreshAll = async () => {
    setLoading(true)
    try {
      await fetchFlutes()
      await fetchSinglefaceIndex()
      SweetAlert.success('Berhasil!', 'Data berhasil diperbarui')
    } catch (err) {
      SweetAlert.error('Error!', 'Gagal memperbarui data')
    } finally {
      setLoading(false)
    }
  }

  // ===== MODAL CLOSE HANDLERS =====
  const handleCloseAddModal = () => {
    if (!isPosting) {
      setShowAddModal(false)
      setAddFormData({ ...BASE_FORM })
      setFormErrors({})
    }
  }

  const handleCloseEditModal = () => {
    if (!isPosting) {
      setShowEditModal(false)
      setEditingItem(null)
      setEditFormData({ ...BASE_FORM })
      setFormErrors({})
    }
  }

  // ===== UTILITY FUNCTIONS =====
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatSubstanceDisplay = (item: SinglefaceSubstance | FormData): string => {
    return `${item.layer_1}${item.layer_1_type}/${item.layer_2}${item.layer_2_type}`
  }

  const getFluteBadgeVariant = (code: string): string => {
    switch (code.toUpperCase()) {
      case 'B': return 'primary'
      case 'C': return 'success'
      case 'CB': return 'warning'
      case 'BC': return 'warning'
      case 'EB': return 'info'
      case 'E': return 'info'
      default: return 'gray'
    }
  }

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:loading" className="w-12 h-12 text-gray-400 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Singleface Settings
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Kelola harga bahan singleface berdasarkan flute type
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Cache: {Object.keys(layerCache).length} items
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { 
              title: 'Total Substances', 
              value: stats.totalSubstances, 
              icon: 'mdi:layers',
              color: 'text-blue-600'
            },
            { 
              title: 'Active', 
              value: stats.activeSubstances, 
              icon: 'mdi:check-circle',
              color: stats.activeSubstances === stats.totalSubstances ? 'text-green-600' : 'text-yellow-600'
            },
            { 
              title: 'Flute Types', 
              value: flutes.length, 
              icon: 'mdi:waveform',
              color: 'text-purple-600' 
            },
            { 
              title: 'Showing', 
              value: `${paginatedData.length} / ${filteredSubstances.length}`, 
              icon: 'mdi:table',
              color: 'text-gray-600' 
            }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <Icon 
                  icon={stat.icon as any} 
                  className={`w-5 h-5 ${stat.color}`}
                />
              </div>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshAll}
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Icon icon="mdi:refresh" className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={clearAllLayerCache}
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Icon icon="mdi:trash-can-outline" className="w-4 h-4 mr-1" />
                Clear Cache
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/flute-settings')}
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Icon icon="mdi:cog-outline" className="w-4 h-4 mr-1" />
                Kelola Flutes
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 text-white"
                disabled={flutes.length === 0}
              >
                <Icon icon="mdi:plus" className="w-4 h-4 mr-1" />
                Tambah Singleface
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              All Singleface Substances
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                <span className="font-medium">{pagination.currentPage}</span> of <span className="font-medium">{pagination.totalPages}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {singlefaceSubstances.length === 0 ? (
          <div className="text-center py-12">
            <Icon
              icon="mdi:database-off"
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada data
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              Belum ada singleface substance yang ditambahkan
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              className="bg-gray-900 hover:bg-gray-800"
              disabled={flutes.length === 0}
            >
              Tambah Substance Pertama
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Substance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Layer 1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Layer 2
                  </th>

                  {/* Flute columns */}
                  {flutes.map((flute) => (
                    <th
                      key={flute.code}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {flute.code}
                    </th>
                  ))}

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((substance, index) => {
                  const actualIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  const hasZeroLayer = substance.layer_1 === '0' || substance.layer_2 === '0'
                  
                  return (
                    <tr
                      key={substance.id}
                      className={`hover:bg-gray-50 ${
                        hasZeroLayer ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {actualIndex}
                          {hasZeroLayer && (
                            <Icon 
                              icon="mdi:alert" 
                              className="w-4 h-4 text-yellow-500 inline ml-2"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatSubstanceDisplay(substance)}
                        </div>
                      </td>
                      {['layer_1', 'layer_2'].map((layer) => (
                        <td key={layer} className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              substance[`${layer}_type`] === 'K' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : substance[`${layer}_type`] === 'M'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {substance[layer]}
                              {substance[`${layer}_type`]}
                            </span>
                          </div>
                        </td>
                      ))}

                      {/* Flute prices */}
                      {flutes.map((flute, idx) => {
                        const priceField = `${flute.code.toLowerCase()}_flute_price`
                        const price = substance[priceField] || 0
                        const hasPrice = price > 0

                        return (
                          <td key={flute.code} className="px-6 py-4">
                            <div className={`text-sm ${hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>
                              {hasPrice ? formatCurrency(price) : '-'}
                            </div>
                          </td>
                        )
                      })}

                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(substance)}
                            className="text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                            disabled={flutes.length === 0}
                          >
                            <Icon
                              icon="mdi:pencil"
                              className="w-4 h-4 mr-1"
                            />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDelete(
                                substance.id,
                                substance.substance_code
                              )
                            }
                            className="text-red-700 border-red-200 hover:bg-red-50 cursor-pointer"
                          >
                            <Icon
                              icon="mdi:delete"
                              className="w-4 h-4 mr-1"
                            />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {singlefaceSubstances.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> sampai{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span> dari{' '}
                <span className="font-medium">{pagination.totalItems}</span> results
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <Select
                    value={pagination.itemsPerPage.toString()}
                    onChange={(e: any) => handleItemsPerPageChange(parseInt(e.target.value))}
                    options={[
                      { value: '10', label: '10' },
                      { value: '25', label: '25' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' }
                    ]}
                    className="w-20 text-sm"
                  />
                </div>
                
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon icon="mdi:chevron-left" className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center">
                    {(() => {
                      const pages = []
                      const maxVisiblePages = 5
                      let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2))
                      let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)
                      
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1)
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.currentPage === i
                                ? 'z-10 bg-gray-900 border-gray-900 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }
                      
                      return pages
                    })()}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon icon="mdi:chevron-right" className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Tambah Singleface Substance"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCloseAddModal} 
              disabled={isPosting}
              className="border-gray-300"
            >
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddSave}
              loading={isPosting}
              disabled={isPosting || flutes.length === 0}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Layer Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Konfigurasi Layer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((num) => (
                <div key={num} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gramasi Layer {num} *
                    </label>
                    <input
                      type="number"
                      value={addFormData[`layer_${num}` as keyof FormData] as string}
                      onChange={(e) => handleAddInputChange(`layer_${num}`, e.target.value)}
                      placeholder="125"
                      min="1"
                      step="1"
                      disabled={isPosting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900"
                    />
                    {formErrors[`layer_${num}`] && (
                      <p className="mt-1 text-sm text-red-600">{formErrors[`layer_${num}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Kertas *
                    </label>
                    <Select
                      value={addFormData[`layer_${num}_type` as keyof FormData] as string}
                      onChange={(e: any) => handleAddInputChange(`layer_${num}_type`, e.target.value)}
                      options={[
                        { value: 'K', label: 'Kraft (Coklat Tua)' },
                        { value: 'M', label: 'Medium (Coklat)' },
                        { value: 'W', label: 'White (Putih)' }
                      ]}
                      disabled={isPosting}
                      className="text-gray-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flute Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Pilih Flute Types</h3>
              <span className="text-xs text-gray-500">
                {addFormData.flutes.length} dipilih dari {flutes.length}
              </span>
            </div>
            
            {flutes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Tidak ada flute yang tersedia. Harap tambahkan flute terlebih dahulu.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {flutes.map((flute) => {
                    const isSelected = addFormData.flutes.includes(flute.code)
                    return (
                      <button
                        key={flute.code}
                        type="button"
                        onClick={() => handleAddFluteToggle(flute.code)}
                        className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                          isSelected
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{flute.code}</span>
                          <span className="text-xs opacity-75">{flute.name}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {formErrors.flutes && (
                  <p className="text-sm text-red-600">{formErrors.flutes}</p>
                )}

                {/* Flute Pricing */}
                {addFormData.flutes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Harga per Flute yang Dipilih</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addFormData.flutes.map((fluteCode) => {
                        const flute = flutes.find(f => f.code === fluteCode)
                        if (!flute) return null

                        return (
                          <div key={fluteCode} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {flute.code}-Flute ({flute.name})
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500">Rp</span>
                              </div>
                              <input
                                type="number"
                                value={addFormData.price_per_m2[fluteCode] || ''}
                                onChange={(e) => {
                                  setAddFormData(prev => ({
                                    ...prev,
                                    price_per_m2: { 
                                      ...prev.price_per_m2, 
                                      [fluteCode]: e.target.value 
                                    }
                                  }))
                                }}
                                placeholder="0"
                                min="1"
                                disabled={isPosting}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                              />
                            </div>
                            {formErrors[`price_${fluteCode}`] && (
                              <p className="text-sm text-red-600">{formErrors[`price_${fluteCode}`]}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit Singleface Substance"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCloseEditModal} 
              disabled={isPosting}
              className="border-gray-300"
            >
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSave}
              loading={isPosting}
              disabled={isPosting || flutes.length === 0}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Simpan
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Konfigurasi Layer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((num) => (
                  <div key={num} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gramasi Layer {num} *
                      </label>
                      <input
                        type="number"
                        value={editFormData[`layer_${num}` as keyof FormData] as string}
                        onChange={(e) => handleEditInputChange(`layer_${num}`, e.target.value)}
                        placeholder="125"
                        min="1"
                        step="1"
                        disabled={isPosting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900"
                      />
                      {formErrors[`layer_${num}`] && (
                        <p className="mt-1 text-sm text-red-600">{formErrors[`layer_${num}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jenis Kertas *
                      </label>
                      <Select
                        value={editFormData[`layer_${num}_type` as keyof FormData] as string}
                        onChange={(e: any) => handleEditInputChange(`layer_${num}_type`, e.target.value)}
                        options={[
                          { value: 'K', label: 'Kraft (Coklat Tua)' },
                          { value: 'M', label: 'Medium (Coklat)' },
                          { value: 'W', label: 'White (Putih)' }
                        ]}
                        disabled={isPosting}
                        className="text-gray-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Pilih Flute Types</h3>
                <span className="text-xs text-gray-500">
                  {editFormData.flutes.length} dipilih dari {flutes.length}
                </span>
              </div>
              
              {flutes.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Tidak ada flute yang tersedia.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {flutes.map((flute) => {
                      const isSelected = editFormData.flutes.includes(flute.code)
                      return (
                        <button
                          key={flute.code}
                          type="button"
                          onClick={() => handleEditFluteToggle(flute.code)}
                          className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                            isSelected
                              ? 'bg-gray-900 border-gray-900 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{flute.code}</span>
                            <span className="text-xs opacity-75">{flute.name}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {formErrors.flutes && (
                    <p className="text-sm text-red-600">{formErrors.flutes}</p>
                  )}

                  {editFormData.flutes.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">Harga per Flute yang Dipilih</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editFormData.flutes.map((fluteCode) => {
                          const flute = flutes.find(f => f.code === fluteCode)
                          if (!flute) return null

                          return (
                            <div key={fluteCode} className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                {flute.code}-Flute ({flute.name})
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">Rp</span>
                                </div>
                                <input
                                  type="number"
                                  value={editFormData.price_per_m2[fluteCode] || ''}
                                  onChange={(e) => {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      price_per_m2: { 
                                        ...prev.price_per_m2, 
                                        [fluteCode]: e.target.value 
                                      }
                                    }))
                                  }}
                                  placeholder="0"
                                  min="1"
                                  disabled={isPosting}
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                />
                              </div>
                              {formErrors[`price_${fluteCode}`] && (
                                <p className="text-sm text-red-600">{formErrors[`price_${fluteCode}`]}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}