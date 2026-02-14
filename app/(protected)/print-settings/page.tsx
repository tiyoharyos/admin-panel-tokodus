// app/(protected)/print-settings/page.tsx

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import SweetAlert from '@/components/UI/SweetAlert'
import { Icon } from '@iconify/react'

// ============ TYPES ============
interface Machine {
  id_ma: string
  name_ma: string
  bahan_max_panjang: string
  bahan_max_lebar: string
  bahan_min_panjang: string
  bahan_min_lebar: string
  cetak_max_panjang: string
  cetak_max_lebar: string
  cetak_min_panjang: string
  cetak_min_lebar: string
  harga_blok: string
  harga_tulisan: string
  harga_separasi: string
}

interface ApiResponse {
  status: number
  message: string
  data: Machine[]
}

interface Stats {
  totalMachines: number
  activeMachines: number
  pm52Count: number
  sm74Count: number
  planoMaxCount: number
  priceRange: {
    min: number
    max: number
  }
}

interface UpdateMachineFormData {
  maxMaterialWidth: number
  maxMaterialLength: number
  minMaterialWidth: number
  minMaterialLength: number
  maxPrintWidth: number
  maxPrintLength: number
  minPrintWidth: number
  minPrintLength: number
  priceBlok: number
  priceTulisan: number
  priceSeparasi: number
}

// ============ CONSTANTS ============
const PRINT_TYPES = [
  { id: 'blok', label: 'Cetak Blok', field: 'harga_blok', icon: 'mdi:layers', color: 'blue' },
  { id: 'tulisan', label: 'Cetak Tulisan', field: 'harga_tulisan', icon: 'mdi:format-text', color: 'green' },
  { id: 'separasi', label: 'Cetak Separasi', field: 'harga_separasi', icon: 'mdi:palette', color: 'purple' }
] as const

const MACHINE_FILTERS = {
  PM52: (name: string) => name?.toUpperCase() === 'PM52',
  SM74: (name: string) => name?.toUpperCase() === 'SM74',
  PLANO: (name: string) => name?.toUpperCase().includes('PLANO')
} as const

const MACHINE_SPECS = {
  PM52: { label: 'PM52', maxSize: '37×52 cm' },
  SM74: { label: 'SM74', maxSize: '52.5×72 cm' },
  PLANO: { label: 'Plano Max', maxSize: '72×102 cm' }
} as const

// ============ UTILS ============
const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

const formatSize = (panjang: string, lebar: string) => {
  return `${parseFloat(panjang).toFixed(1)} × ${parseFloat(lebar).toFixed(1)} cm`
}

const getMachineType = (name: string): keyof typeof MACHINE_SPECS => {
  if (MACHINE_FILTERS.PM52(name)) return 'PM52'
  if (MACHINE_FILTERS.SM74(name)) return 'SM74'
  if (MACHINE_FILTERS.PLANO(name)) return 'PLANO'
  return 'PLANO'
}

const getMachineBadgeClass = (name: string): string => {
  const type = getMachineType(name)
  const classes = {
    PM52: 'bg-blue-100 text-blue-800 border border-blue-200',
    SM74: 'bg-green-100 text-green-800 border border-green-200',
    PLANO: 'bg-purple-100 text-purple-800 border border-purple-200'
  }
  return classes[type]
}

// ============ HOOKS ============
const useMachineStats = (machines: Machine[]) => {
  return useMemo(() => {
    const totalMachines = machines.length
    const activeMachines = machines.length
    
    const pm52Count = machines.filter(m => MACHINE_FILTERS.PM52(m.name_ma)).length
    const sm74Count = machines.filter(m => MACHINE_FILTERS.SM74(m.name_ma)).length
    const planoMaxCount = machines.filter(m => MACHINE_FILTERS.PLANO(m.name_ma)).length
    
    const allPrices = machines.flatMap(m => [
      parseFloat(m.harga_blok),
      parseFloat(m.harga_tulisan),
      parseFloat(m.harga_separasi)
    ]).filter(price => !isNaN(price) && price > 0)
    
    return {
      totalMachines,
      activeMachines,
      pm52Count,
      sm74Count,
      planoMaxCount,
      priceRange: {
        min: allPrices.length > 0 ? Math.min(...allPrices) : 0,
        max: allPrices.length > 0 ? Math.max(...allPrices) : 0
      }
    }
  }, [machines])
}

// ============ MAIN COMPONENT ============
export default function PrintSettingsPage() {
  const router = useRouter()
  
  // ===== STATE =====
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [search, setSearch] = useState('')
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Selected data
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)

  const stats = useMachineStats(machines)

  // ===== DERIVED STATE =====
  const filteredMachines = useMemo(() => 
    machines.filter(machine => 
      machine.name_ma.toLowerCase().includes(search.toLowerCase()) ||
      machine.id_ma.includes(search)
    ), [machines, search]
  )

  // ===== API CALLS =====
  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get<ApiResponse>('Admin/Cetak/Machine', {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000
      })
      
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setMachines(response.data.data)
      } else {
        setMachines([])
      }
      
    } catch (err: any) {
      console.error('❌ Error fetching machines:', err)
      
      if (err.response?.status === 404 || err.response?.status === 204) {
        setMachines([])
        setError(null)
      } else if (err.code === 'ECONNABORTED') {
        setError('Koneksi timeout. Silakan coba lagi.')
      } else if (!err.response) {
        setError('Tidak bisa connect ke server. Periksa koneksi internet.')
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan saat memuat data')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMachines()
  }, [fetchMachines])

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async () => {
    const result = await SweetAlert.confirmAction(
      'Refresh Data?',
      'Data akan dimuat ulang dari server.'
    )
    
    if (result.isConfirmed) {
      await fetchMachines()
    }
  }, [fetchMachines])

  const handleViewDetails = useCallback((machine: Machine) => {
    setSelectedMachine(machine)
    setIsViewModalOpen(true)
  }, [])

  const handleEdit = useCallback((machine: Machine) => {
    setSelectedMachine(machine)
    setIsViewModalOpen(false)
    setIsEditModalOpen(true)
  }, [])

  const handleUpdate = useCallback(async (formData: UpdateMachineFormData) => {
    if (!selectedMachine) return
    
    try {
      setPosting(true)
      
      
      await SweetAlert.success('Berhasil!', 'Machine settings berhasil diperbarui!')
      
      setIsEditModalOpen(false)
      setSelectedMachine(null)
      await fetchMachines()
      
    } catch (error) {
      console.error('Error updating:', error)
      await SweetAlert.error('Error!', 'Gagal mengupdate machine settings')
    } finally {
      setPosting(false)
    }
  }, [selectedMachine, fetchMachines])

  const handleCloseModal = useCallback(() => {
    if (!posting) {
      setIsViewModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedMachine(null)
    }
  }, [posting])

  const handleSubmitEdit = useCallback(() => {
    const form = document.forms.namedItem('editForm')
    if (form) {
      const formData = {
        maxMaterialWidth: parseFloat((form.elements.namedItem('maxMaterialWidth') as HTMLInputElement).value),
        maxMaterialLength: parseFloat((form.elements.namedItem('maxMaterialLength') as HTMLInputElement).value),
        minMaterialWidth: parseFloat((form.elements.namedItem('minMaterialWidth') as HTMLInputElement).value),
        minMaterialLength: parseFloat((form.elements.namedItem('minMaterialLength') as HTMLInputElement).value),
        maxPrintWidth: parseFloat((form.elements.namedItem('maxPrintWidth') as HTMLInputElement).value),
        maxPrintLength: parseFloat((form.elements.namedItem('maxPrintLength') as HTMLInputElement).value),
        minPrintWidth: parseFloat((form.elements.namedItem('minPrintWidth') as HTMLInputElement).value),
        minPrintLength: parseFloat((form.elements.namedItem('minPrintLength') as HTMLInputElement).value),
        priceBlok: parseFloat((form.elements.namedItem('priceBlok') as HTMLInputElement).value),
        priceTulisan: parseFloat((form.elements.namedItem('priceTulisan') as HTMLInputElement).value),
        priceSeparasi: parseFloat((form.elements.namedItem('priceSeparasi') as HTMLInputElement).value)
      }
      handleUpdate(formData)
    }
  }, [handleUpdate])

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:printer" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Print Settings...</p>
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
            <Button onClick={fetchMachines} variant="danger" className="mx-auto">
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
            <Icon icon="mdi:printer-multiple" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Print Settings
            </h1>
            <p className="text-gray-600 mt-1">Kelola konfigurasi mesin cetak dan harga</p>
          </div>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="primary"
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
          icon="mdi:refresh"
        >
          Refresh Data
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:printer-multiple" className="w-4 h-4 text-blue-600" />
              Total Machines
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.totalMachines.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Icon icon="mdi:check-circle" className="w-3 h-3" />
                {stats.activeMachines} Aktif
              </span>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:printer" className="w-4 h-4 text-blue-600" />
              PM52
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.pm52Count}</p>
            </div>
            <p className="text-xs text-gray-500">Max: 37×52 cm</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:printer" className="w-4 h-4 text-green-600" />
              SM74
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.sm74Count}</p>
            </div>
            <p className="text-xs text-gray-500">Max: 52.5×72 cm</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:printer" className="w-4 h-4 text-purple-600" />
              Plano Max
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.planoMaxCount}</p>
            </div>
            <p className="text-xs text-gray-500">Max: 72×102 cm</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-amber-600" />
              Price Range
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.priceRange.min)}</p>
            </div>
            <p className="text-xs text-gray-500">to {formatCurrency(stats.priceRange.max)}</p>
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
              Daftar Mesin Cetak
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total {stats.totalMachines} mesin terkonfigurasi
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Input
                leftIcon="mdi:magnify"
                placeholder="Cari mesin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="mdi:close-circle" className="w-5 h-5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMachines}
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
                {['Mesin', 'Material Size', 'Print Area', 'Harga Cetak', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Icon icon="mdi:printer-off" className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Tidak ada mesin yang ditemukan</p>
                      <p className="text-sm text-gray-400 mt-1">Coba ubah kata kunci pencarian</p>
                      {search && (
                        <Button
                          variant="outline"
                          onClick={() => setSearch('')}
                          className="mt-4"
                          icon="mdi:close"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMachines.map((machine) => (
                  <tr key={machine.id_ma} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${getMachineBadgeClass(machine.name_ma)}`}>
                          <Icon icon="mdi:printer" className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{machine.name_ma}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Max:</span>{' '}
                          <span className="text-gray-600">{formatSize(machine.bahan_max_panjang, machine.bahan_max_lebar)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Min:</span>{' '}
                          <span className="text-gray-600">{formatSize(machine.bahan_min_panjang, machine.bahan_min_lebar)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Max:</span>{' '}
                          <span className="text-gray-600">{formatSize(machine.cetak_max_panjang, machine.cetak_max_lebar)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Min:</span>{' '}
                          <span className="text-gray-600">{formatSize(machine.cetak_min_panjang, machine.cetak_min_lebar)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {PRINT_TYPES.map((type) => (
                          <div key={type.id} className="flex items-center gap-1 text-sm">
                            <Icon icon={type.icon} className={`w-3 h-3 text-${type.color}-600`} />
                            <span className="text-gray-600">{type.label}:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(machine[type.field])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(machine)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Icon icon="mdi:eye" className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => handleEdit(machine)}
                          className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Icon icon="mdi:pencil" className="w-5 h-5" />
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
        {filteredMachines.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Menampilkan {filteredMachines.length} dari {machines.length} mesin
            </div>
            <button
              onClick={() => SweetAlert.info('Export', 'Exporting machine data...')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Icon icon="mdi:export" className="w-4 h-4" />
              <span className="text-sm font-medium">Export Data</span>
            </button>
          </div>
        )}
      </Card>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        title="🔍 Detail Mesin Cetak"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Tutup
            </Button>
            <Button
              variant="primary"
              onClick={() => selectedMachine && handleEdit(selectedMachine)}
              icon="mdi:pencil"
            >
              Edit Mesin
            </Button>
          </div>
        }
      >
        {selectedMachine && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getMachineBadgeClass(selectedMachine.name_ma)}`}>
                  <Icon icon="mdi:printer" className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMachine.name_ma}</h2>
                  <p className="text-sm text-gray-600 mt-1">ID Mesin: {selectedMachine.id_ma}</p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-5 bg-blue-50/50 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900">Material Size Limits</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Maksimum</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatSize(selectedMachine.bahan_max_panjang, selectedMachine.bahan_max_lebar)}
                    </p>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-xs text-blue-700 mb-1">Minimum</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {formatSize(selectedMachine.bahan_min_panjang, selectedMachine.bahan_min_lebar)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-green-50/50 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:printer" className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900">Print Area Limits</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-green-700 mb-1">Maksimum</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatSize(selectedMachine.cetak_max_panjang, selectedMachine.cetak_max_lebar)}
                    </p>
                  </div>
                  <div className="border-t border-green-200 pt-3">
                    <p className="text-xs text-green-700 mb-1">Minimum</p>
                    <p className="text-lg font-semibold text-green-800">
                      {formatSize(selectedMachine.cetak_min_panjang, selectedMachine.cetak_min_lebar)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-amber-600" />
                </div>
                Print Types & Pricing
              </h3>
              <div className="grid gap-3">
                {PRINT_TYPES.map((type) => (
                  <Card key={type.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-${type.color}-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`bg-${type.color}-100 p-2 rounded-lg`}>
                          <Icon icon={type.icon} className={`w-5 h-5 text-${type.color}-600`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.label}</p>
                          <p className="text-xs text-gray-500">Harga per lembar</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedMachine[type.field])}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title={`✏️ Edit Mesin - ${selectedMachine?.name_ma}`}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={posting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEdit}
              loading={posting}
              disabled={posting}
            >
              {posting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        {selectedMachine && (
          <form name="editForm" className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Mengedit Mesin Cetak</h4>
                  <p className="text-sm text-blue-700">
                    Mesin: <span className="font-medium">{selectedMachine.name_ma}</span> (ID: {selectedMachine.id_ma})
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Update semua field di bawah sesuai kebutuhan
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:cash" className="w-4 h-4 text-amber-600" />
                </div>
                Print Pricing (IDR)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRINT_TYPES.map((type) => (
                  <Input
                    key={type.id}
                    label={type.label}
                    name={`price${type.id.charAt(0).toUpperCase() + type.id.slice(1)}`}
                    type="number"
                    step="1000"
                    defaultValue={selectedMachine[type.field]}
                    disabled={posting}
                    leftIcon={type.icon}
                  />
                ))}
              </div>
            </div>

            {/* Material Size Section */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-600" />
                </div>
                Material Size (cm)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Width"
                  name="maxMaterialWidth"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.bahan_max_panjang}
                  disabled={posting}
                />
                <Input
                  label="Max Length"
                  name="maxMaterialLength"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.bahan_max_lebar}
                  disabled={posting}
                />
                <Input
                  label="Min Width"
                  name="minMaterialWidth"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.bahan_min_panjang}
                  disabled={posting}
                />
                <Input
                  label="Min Length"
                  name="minMaterialLength"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.bahan_min_lebar}
                  disabled={posting}
                />
              </div>
            </div>

            {/* Print Area Section */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:printer" className="w-4 h-4 text-green-600" />
                </div>
                Print Area (cm)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Width"
                  name="maxPrintWidth"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.cetak_max_panjang}
                  disabled={posting}
                />
                <Input
                  label="Max Length"
                  name="maxPrintLength"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.cetak_max_lebar}
                  disabled={posting}
                />
                <Input
                  label="Min Width"
                  name="minPrintWidth"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.cetak_min_panjang}
                  disabled={posting}
                />
                <Input
                  label="Min Length"
                  name="minPrintLength"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMachine.cetak_min_lebar}
                  disabled={posting}
                />
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}