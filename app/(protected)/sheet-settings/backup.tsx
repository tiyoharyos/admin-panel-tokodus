
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
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

interface SheetSubstance {
  id: string
  no: string
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  layer_3: string
  layer_3_type: string
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
  layer_3: string
  layer_3_type: string
  flutes: string[]
  price_per_m2: { [key: string]: string }
  minimal_qty: { [key: string]: string }
}

interface Stats {
  totalSubstances: number
  activeSubstances: number
  withAllFlutes: number
  totalIndices: number
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
  layer_3: '',
  layer_3_type: 'M',
  flutes: [],
  price_per_m2: {},
  minimal_qty: {}
}

export default function SheetSettingsPage() {
  const router = useRouter()

  // ===== STATE =====
  const [sheetSubstances, setSheetSubstances] = useState<SheetSubstance[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

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
  const [editingItem, setEditingItem] = useState<SheetSubstance | null>(null)

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

  // ===== FILTERED DATA (TANPA SEARCH) =====
  const filteredSubstances = useMemo(() => {
    return sheetSubstances; // Langsung return semua data tanpa filter
  }, [sheetSubstances])

  // ===== PAGINATED DATA =====
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return filteredSubstances.slice(startIndex, endIndex)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  // ===== OTOMATIS PILIH SEMUA FLUTE =====
  useEffect(() => {
    // Ketika flutes berubah, otomatis pilih semua flute untuk form tambah
    if (flutes.length > 0 && showAddModal) {
      const allFluteCodes = flutes.map(flute => flute.code);
      const priceData: { [key: string]: string } = {};
      const qtyData: { [key: string]: string } = {};
      
      allFluteCodes.forEach(code => {
        priceData[code] = '';
        qtyData[code] = '';
      });
      
      setAddFormData(prev => ({
        ...prev,
        flutes: allFluteCodes,
        price_per_m2: priceData,
        minimal_qty: qtyData
      }));
    }
  }, [flutes, showAddModal])

  useEffect(() => {
    // Untuk form edit, otomatis pilih semua flute yang ada data harganya
    if (flutes.length > 0 && showEditModal && editingItem) {
      const allFluteCodes = flutes.map(flute => flute.code);
      const priceData: { [key: string]: string } = {};
      const qtyData: { [key: string]: string } = {};
      
      allFluteCodes.forEach(code => {
        const priceField = `${code.toLowerCase()}_flute_price`;
        const qtyField = `${code.toLowerCase()}_minimal_qty`;
        
        priceData[code] = editingItem[priceField]?.toString() || '';
        qtyData[code] = editingItem[qtyField]?.toString() || '';
      });
      
      setEditFormData(prev => ({
        ...prev,
        flutes: allFluteCodes,
        price_per_m2: priceData,
        minimal_qty: qtyData
      }));
    }
  }, [flutes, showEditModal, editingItem])

  // ===== PAGINATION HANDLERS =====
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    // Scroll to top of table
    window.scrollTo({ top: 600, behavior: 'smooth' })
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

  // ===== FETCH FLUTES =====
  const fetchFlutes = useCallback(async (): Promise<Flute[]> => {
    try {
      const response = await axios.get('/Admin/Flutes/Flutes', {
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

  // ===== FETCH SHEET INDEX =====
  const fetchSheetIndex = useCallback(async (): Promise<SheetSubstance[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get('/Admin/Sheet/sheetIndex', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      // Handle different response formats
      const responseData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || []

      if (!Array.isArray(responseData)) {
        throw new Error('Invalid response format')
      }

      // Group data by substance_id
      const groupedData: { [key: string]: SheetSubstance } = {}
      
      responseData.forEach((item: any) => {
        const substanceId = item.s_substance_id || item.id
        
        if (!groupedData[substanceId]) {
          groupedData[substanceId] = {
            id: substanceId.toString(),
            no: '',
            layer_1: item.layer_1 || '',
            layer_1_type: item.layer_1_type || 'K',
            layer_2: item.layer_2 || '',
            layer_2_type: item.layer_2_type || 'M',
            layer_3: item.layer_3 || '',
            layer_3_type: item.layer_3_type || 'M',
            substance_code: `${item.layer_1}${item.layer_1_type}/${item.layer_2}${item.layer_2_type}/${item.layer_3}${item.layer_3_type}`,
            created_at: item.created_at || '',
            updated_at: item.updated_at || ''
          }
        }
        
        // Add flute price
        const fluteCode = item.code
        if (fluteCode) {
          const priceField = `${fluteCode.toLowerCase()}_flute_price`
          const qtyField = `${fluteCode.toLowerCase()}_minimal_qty`
          
          groupedData[substanceId][priceField] = parseFloat(item.price_per_m2) || 0
          groupedData[substanceId][qtyField] = parseInt(item.minimal_qty) || 0
        }
      })

      // Convert to array
      const processedSubstances = Object.values(groupedData).map((item, index) => ({
        ...item,
        no: (index + 1).toString()
      }))

      setSheetSubstances(processedSubstances)

      // Calculate stats
      const totalSubstances = processedSubstances.length
      const totalIndices = responseData.length

      setStats({
        totalSubstances,
        activeSubstances: totalSubstances,
        withAllFlutes: totalSubstances,
        totalIndices
      })

      return processedSubstances
    } catch (err: any) {
      console.error('Error fetching sheet index:', err)
      setError(err.message || 'Failed to fetch data')
      setSheetSubstances([])
      setStats({ totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0, totalIndices: 0 })
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // ===== INITIAL LOAD =====
  useEffect(() => {
    const init = async () => {
      try {
        await fetchFlutes()
        await fetchSheetIndex()
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

  // ===== VALIDATION =====
  const validateForm = (formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {}

    // Validate layers
    const layerFields = ['layer_1', 'layer_2', 'layer_3']
    layerFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = 'Gramasi tidak boleh kosong'
      } else if (isNaN(parseFloat(formData[field])) || parseFloat(formData[field]) <= 0) {
        errors[field] = 'Gramasi harus angka lebih dari 0'
      }
    })

    // Validate prices untuk semua flute yang ada di sistem
    flutes.forEach(flute => {
      const price = formData.price_per_m2?.[flute.code]
      if (!price || price.toString().trim() === '') {
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute tidak boleh kosong`
      } else if (isNaN(parseFloat(price))) {
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus berupa angka`
      } else if (parseFloat(price) <= 0) {
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus lebih dari 0`
      }
    })

    return errors
  }

  // ===== ADD HANDLER =====
  const handleAddSave = async () => {
    const errors = validateForm(addFormData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPosting(true)

      // Prepare flute IDs
      const fluteIds = addFormData.flutes.map(fluteCode => {
        const flute = flutes.find(f => f.code === fluteCode)
        return flute ? parseInt(flute.id) : 0
      }).filter(id => id > 0)

      // Prepare arrays for API
      const priceArray = addFormData.flutes.map(fluteCode => 
        parseFloat(addFormData.price_per_m2[fluteCode] || '0')
      )
      
      const minQtyArray = addFormData.flutes.map(fluteCode =>
        parseInt(addFormData.minimal_qty[fluteCode] || '0')
      )

      const postData = {
        layer_1: addFormData.layer_1.trim(),
        layer_1_type: addFormData.layer_1_type.trim(),
        layer_2: addFormData.layer_2.trim(),
        layer_2_type: addFormData.layer_2_type.trim(),
        layer_3: addFormData.layer_3.trim(),
        layer_3_type: addFormData.layer_3_type.trim(),
        flutes: fluteIds,
        price_per_m2: priceArray,
        minimal_qty: minQtyArray
      }

      const response = await axios.post('/Admin/Sheet/sheetIndexAdd', postData, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Data berhasil ditambahkan')
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
        await fetchSheetIndex()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal menambahkan data')
      }
    } catch (err: any) {
      console.error('Add error:', err)
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT HANDLERS =====
  const handleEditClick = (item: SheetSubstance) => {
    const editData: FormData = {
      layer_1: item.layer_1.toString(),
      layer_1_type: item.layer_1_type,
      layer_2: item.layer_2.toString(),
      layer_2_type: item.layer_2_type,
      layer_3: item.layer_3.toString(),
      layer_3_type: item.layer_3_type,
      flutes: [],
      price_per_m2: {},
      minimal_qty: {}
    }

    // Populate from existing data
    flutes.forEach(flute => {
      const priceField = `${flute.code.toLowerCase()}_flute_price`
      const qtyField = `${flute.code.toLowerCase()}_minimal_qty`
      
      if (item[priceField] > 0) {
        editData.flutes.push(flute.code)
        editData.price_per_m2[flute.code] = item[priceField].toString()
        editData.minimal_qty[flute.code] = item[qtyField]?.toString() || '0'
      }
    })

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
      
      const minQtyArray = editFormData.flutes.map(fluteCode =>
        parseInt(editFormData.minimal_qty[fluteCode] || '0')
      )

      const putData = {
        substance_id: parseInt(editingItem.id),
        layer_1: editFormData.layer_1.trim(),
        layer_1_type: editFormData.layer_1_type.trim(),
        layer_2: editFormData.layer_2.trim(),
        layer_2_type: editFormData.layer_2_type.trim(),
        layer_3: editFormData.layer_3.trim(),
        layer_3_type: editFormData.layer_3_type.trim(),
        flutes: fluteIds,
        price_per_m2: priceArray,
        minimal_qty: minQtyArray
      }

      const response = await axios.put('/Admin/Sheet/sheetIndexUpdate', putData, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      // DEBUG: Log response
      console.log('Update response:', response.data)
      
      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Data berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
        await fetchSheetIndex()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal memperbarui data')
      }
    } catch (err: any) {
      console.error('Update error details:')
      console.error('Error message:', err.message)
      console.error('Response status:', err.response?.status)
      console.error('Response data:', err.response?.data)
      console.error('Response headers:', err.response?.headers)
      
      SweetAlert.error('Error!', err.response?.data?.message || 'Terjadi kesalahan server')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE HANDLER =====
  const handleDelete = async (id: string, substanceCode: string) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/Admin/Sheet/sheetIndexDelete/${id}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (response.data?.status === 200) {
          SweetAlert.success('Berhasil!', 'Data berhasil dihapus')
          await fetchSheetIndex()
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
      await fetchSheetIndex()
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

  const formatSubstanceDisplay = (item: SheetSubstance | FormData): string => {
    return `${item.layer_1}${item.layer_1_type}/${item.layer_2}${item.layer_2_type}/${item.layer_3}${item.layer_3_type}`
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
          <Icon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Sheet Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola harga bahan sheet berdasarkan flute type
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: 'Total Substances', 
            value: stats.totalSubstances, 
            icon: 'mdi:layers-triple',
            color: 'blue'
          },
          { 
            title: 'Complete Pricing', 
            value: stats.withAllFlutes, 
            icon: 'mdi:currency-usd-circle',
            color: 'green' 
          },
          { 
            title: 'Flute Types', 
            value: flutes.length, 
            icon: 'mdi:waveform',
            color: 'purple' 
          },
          { 
            title: 'Showing', 
            value: `${paginatedData.length} / ${filteredSubstances.length}`, 
            icon: 'mdi:table-of-contents',
            color: 'teal' 
          }
        ].map((stat, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <Icon 
                icon={stat.icon as any} 
                className={`w-5 h-5 text-${stat.color}-500`}
              />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border border-gray-200 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon
                icon="mdi:clipboard-list-outline"
                className="text-blue-600"
              />
              All Sheet Substances
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalSubstances} kombinasi bahan sheet ({flutes.length} flute types)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshAll}
                className="flex items-center gap-2"
              >
                <Icon icon="mdi:refresh" className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/flute-settings')}
                className="flex items-center gap-2"
              >
                <Icon icon="mdi:open-in-new" className="w-4 h-4" />
                Kelola Flutes
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={flutes.length === 0}
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Tambah Sheet
              </Button>
            </div>
          </div>
        </div>

        {/* Pagination Controls - Top */}
        {filteredSubstances.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{paginatedData.length}</span> dari{' '}
              <span className="font-semibold">{filteredSubstances.length}</span> substances
            </div>
            
            <div className="flex items-center gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per halaman:</span>
                <Select
                  value={pagination.itemsPerPage.toString()}
                  onChange={(e: any) => handleItemsPerPageChange(parseInt(e.target.value))}
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' }
                  ]}
                  className="w-20"
                />
              </div>
              
              {/* Page navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1"
                >
                  <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 5
                    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1)
                    }
                    
                    // First page
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600"
                        >
                          1
                        </button>
                      )
                      if (startPage > 2) {
                        pages.push(<span key="dots1" className="px-2">...</span>)
                      }
                    }
                    
                    // Visible pages
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-3 py-1 text-sm rounded ${
                            pagination.currentPage === i
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                          }`}
                        >
                          {i}
                        </button>
                      )
                    }
                    
                    // Last page
                    if (endPage < pagination.totalPages) {
                      if (endPage < pagination.totalPages - 1) {
                        pages.push(<span key="dots2" className="px-2">...</span>)
                      }
                      pages.push(
                        <button
                          key={pagination.totalPages}
                          onClick={() => handlePageChange(pagination.totalPages)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600"
                        >
                          {pagination.totalPages}
                        </button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1"
                >
                  <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        {sheetSubstances.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg mx-6 mb-6 bg-gray-50">
            <Icon
              icon="mdi:database-off"
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada data
            </h3>
            <p className="text-gray-500 mb-6">
              Belum ada sheet substance yang ditambahkan
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              icon="mdi:plus"
              className="bg-gradient-to-r from-blue-600 to-blue-700"
              disabled={flutes.length === 0}
            >
              {flutes.length === 0
                ? 'Tambah Flute Terlebih Dahulu'
                : 'Tambah Sheet Substance Pertama'}
            </Button>
            {flutes.length === 0 && (
              <p className="text-xs text-red-600 mt-3">
                <Icon
                  icon="mdi:alert-circle"
                  className="w-4 h-4 inline mr-1"
                />
                Harap tambahkan flute terlebih dahulu
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Substance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Layer 1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Layer 2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Layer 3
                  </th>

                  {/* Kolom flute — dinamis dari API */}
                  {flutes.map((flute) => (
                    <th
                      key={flute.code}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {flute.code}-Flute
                    </th>
                  ))}

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((substance, index) => {
                  const actualIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  
                  return (
                    <tr
                      key={substance.id}
                      className="hover:bg-blue-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {actualIndex}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {formatSubstanceDisplay(substance)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {substance.substance_code}
                        </div>
                      </td>
                      {['layer_1', 'layer_2', 'layer_3'].map((layer) => (
                        <td key={layer} className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                substance[`${layer}_type`] === 'K'
                                  ? 'warning'
                                  : substance[`${layer}_type`] === 'M'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {substance[layer]}
                              {substance[`${layer}_type`]}
                            </Badge>
                          </div>
                        </td>
                      ))}

                      {/* Harga flute — dinamis dari API */}
                      {flutes.map((flute, idx) => {
                        const priceField = `${flute.code.toLowerCase()}_flute_price`
                        const price = substance[priceField] || 0
                        const colors = [
                          'text-green-600',
                          'text-blue-600',
                          'text-purple-600',
                          'text-orange-600',
                          'text-red-600',
                          'text-indigo-600',
                          'text-pink-600',
                          'text-teal-600'
                        ]
                        const color = colors[idx % colors.length]

                        return (
                          <td key={flute.code} className="px-6 py-4">
                            <div className={`font-medium ${color}`}>
                              {formatCurrency(price)}
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
                            className="text-blue-700 border-blue-200 hover:bg-blue-50"
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
                            className="text-red-700 border-red-200 hover:bg-red-50"
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

        {/* Pagination Controls - Bottom */}
        {filteredSubstances.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200 px-6 pb-6">
            <div className="text-sm text-gray-500">
              Menampilkan <span className="font-semibold">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> -{' '}
              <span className="font-semibold">
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
              </span> dari{' '}
              <span className="font-semibold">{pagination.totalItems}</span> substances
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Halaman {pagination.currentPage} dari {pagination.totalPages}
              </span>
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.currentPage === 1}
                  className="px-2 py-1"
                  title="Halaman pertama"
                >
                  <Icon icon="mdi:skip-backward" className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-2 py-1"
                  title="Halaman sebelumnya"
                >
                  <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-2 py-1"
                  title="Halaman berikutnya"
                >
                  <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-2 py-1"
                  title="Halaman terakhir"
                >
                  <Icon icon="mdi:skip-forward" className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Ke halaman:</span>
                <input
                  type="number"
                  min="1"
                  max={pagination.totalPages}
                  value={pagination.currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= pagination.totalPages) {
                      handlePageChange(page)
                    }
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Tambah Sheet Substance"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddSave}
              loading={isPosting}
              disabled={isPosting || flutes.length === 0}
            >
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Layer Configuration */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">Konfigurasi Layer</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Layer {num}</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gramasi *
                      </label>
                      <input
                        type="number"
                        value={addFormData[`layer_${num}` as keyof FormData] as string}
                        onChange={(e) => handleAddInputChange(`layer_${num}`, e.target.value)}
                        placeholder="125"
                        min="1"
                        step="1"
                        disabled={isPosting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                      />
                      {formErrors[`layer_${num}`] && (
                        <p className="text-xs text-red-600 mt-1">{formErrors[`layer_${num}`]}</p>
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
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Badge
                        variant={
                          addFormData[`layer_${num}_type` as keyof FormData] === 'K' ? 'warning' :
                          addFormData[`layer_${num}_type` as keyof FormData] === 'M' ? 'default' : 'secondary'
                        }
                      >
                        {addFormData[`layer_${num}` as keyof FormData] || '0'}
                        {addFormData[`layer_${num}_type` as keyof FormData]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flute Pricing - SEMUA FLUTE OTOMATIS TERPILIH */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">Harga per Flute</h3>
            
            {flutes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800">
                    Tidak ada flute yang tersedia. Harap tambahkan flute terlebih dahulu di halaman Kelola Flutes.
                  </p>
                </div>
              </div>
            ) : (
              <>

                {addFormData.flutes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addFormData.flutes.map((fluteCode) => {
                      const flute = flutes.find(f => f.code === fluteCode)
                      if (!flute) return null

                      return (
                        <div key={fluteCode} className="bg-white p-4 rounded-lg border border-gray-200 text-gray-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={getFluteBadgeVariant(flute.code)}>
                                {flute.code}
                              </Badge>
                              <span className="font-medium">{flute.name}</span>
                            </div>
                            <Badge variant="success" className="text-xs">
                              Wajib Diisi
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Harga per m² *
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">Rp</span>
                                </div>
                                <input
                                  type="number"
                                  value={addFormData.price_per_m2[fluteCode] || ''}
                                  onChange={(e) => {
                                    setAddFormData((prev: FormData) => ({
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
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              {formErrors[`price_${fluteCode}`] && (
                                <p className="text-xs text-red-600 mt-1">{formErrors[`price_${fluteCode}`]}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
        title="Edit Sheet Substance"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>
              Batal
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSave}
              loading={isPosting}
              disabled={isPosting || flutes.length === 0}
            >
              {isPosting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            {/* Layer Configuration */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Konfigurasi Layer</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Layer {num}</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gramasi *
                        </label>
                        <input
                          type="number"
                          value={editFormData[`layer_${num}` as keyof FormData] as string}
                          onChange={(e) => handleEditInputChange(`layer_${num}`, e.target.value)}
                          placeholder="125"
                          min="1"
                          step="1"
                          disabled={isPosting}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        />
                        {formErrors[`layer_${num}`] && (
                          <p className="text-xs text-red-600 mt-1">{formErrors[`layer_${num}`]}</p>
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
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Badge
                          variant={
                            editFormData[`layer_${num}_type` as keyof FormData] === 'K' ? 'warning' :
                            editFormData[`layer_${num}_type` as keyof FormData] === 'M' ? 'default' : 'secondary'
                          }
                        >
                          {editFormData[`layer_${num}` as keyof FormData] || '0'}
                          {editFormData[`layer_${num}_type` as keyof FormData]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flute Pricing - SEMUA FLUTE OTOMATIS TERPILIH */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Harga per Flute</h3>
              
              {flutes.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800">
                      Tidak ada flute yang tersedia. Harap tambahkan flute terlebih dahulu di halaman Kelola Flutes.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Semua flute types harus diisi. Harap periksa harga untuk semua flute.
                      </p>
                    </div>
                  </div>

                  {editFormData.flutes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editFormData.flutes.map((fluteCode) => {
                        const flute = flutes.find(f => f.code === fluteCode)
                        if (!flute) return null

                        return (
                          <div key={fluteCode} className="bg-white p-4 rounded-lg border border-gray-200 text-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant={getFluteBadgeVariant(flute.code)}>
                                  {flute.code}
                                </Badge>
                                <span className="font-medium">{flute.name}</span>
                              </div>
                              <Badge variant="success" className="text-xs">
                                Wajib Diisi
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Harga per m² *
                                </label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">Rp</span>
                                  </div>
                                  <input
                                    type="number"
                                    value={editFormData.price_per_m2[fluteCode] || ''}
                                    onChange={(e) => {
                                      setEditFormData((prev: FormData) => ({
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
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                {formErrors[`price_${fluteCode}`] && (
                                  <p className="text-xs text-red-600 mt-1">{formErrors[`price_${fluteCode}`]}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
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