// app/(protected)/print-settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'
import SweetAlert from '@/components/UI/SweetAlert'
import { Table, TableRow, TableCell } from '@/components/UI/Table'

// Data berdasarkan Index Cetak sheet
const mockPrintSettings = [
  {
    id: 'PRT-001',
    machine: 'PM52',
    printType: 'Cetak Blok',
    maxMaterialSize: { width: 37, length: 52 },
    minMaterialSize: { width: 11, length: 14 },
    maxPrintSize: { width: 35, length: 50 },
    minPrintSize: { width: 9, length: 12 },
    price: 150000,
    status: 'active'
  },
  {
    id: 'PRT-002',
    machine: 'PM52',
    printType: 'Cetak Tulisan',
    maxMaterialSize: { width: 37, length: 52 },
    minMaterialSize: { width: 11, length: 14 },
    maxPrintSize: { width: 35, length: 50 },
    minPrintSize: { width: 9, length: 12 },
    price: 100000,
    status: 'active'
  },
  {
    id: 'PRT-003',
    machine: 'PM52',
    printType: 'Cetak Separasi',
    maxMaterialSize: { width: 37, length: 52 },
    minMaterialSize: { width: 11, length: 14 },
    maxPrintSize: { width: 35, length: 50 },
    minPrintSize: { width: 9, length: 12 },
    price: 400000,
    status: 'active'
  },
  {
    id: 'PRT-004',
    machine: 'SM74',
    printType: 'Cetak Blok',
    maxMaterialSize: { width: 52.5, length: 72 },
    minMaterialSize: { width: 24, length: 30 },
    maxPrintSize: { width: 50.5, length: 70 },
    minPrintSize: { width: 22, length: 28 },
    price: 300000,
    status: 'active'
  },
  {
    id: 'PRT-005',
    machine: 'SM74',
    printType: 'Cetak Tulisan',
    maxMaterialSize: { width: 52.5, length: 72 },
    minMaterialSize: { width: 24, length: 30 },
    maxPrintSize: { width: 50.5, length: 70 },
    minPrintSize: { width: 22, length: 28 },
    price: 200000,
    status: 'active'
  },
  {
    id: 'PRT-006',
    machine: 'Plano Max',
    printType: 'Cetak Blok',
    maxMaterialSize: { width: 72, length: 102 },
    minMaterialSize: { width: 36, length: 45 },
    maxPrintSize: { width: 70, length: 100 },
    minPrintSize: { width: 34, length: 43 },
    price: 500000,
    status: 'active'
  }
]

const machineTypes = ['PM52', 'SM74', 'Plano Max']
const printTypes = ['Cetak Blok', 'Cetak Tulisan', 'Cetak Separasi']

export default function PrintSettingsPage() {
  const [settings, setSettings] = useState(mockPrintSettings)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [machineFilter, setMachineFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedSetting, setSelectedSetting] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  // Stats untuk dashboard
  const [stats, setStats] = useState({
    totalSettings: 0,
    activeSettings: 0,
    pm52Count: 0,
    sm74Count: 0,
    planoMaxCount: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    calculateStats()
  }, [settings])

  const calculateStats = () => {
    const totalSettings = settings.length
    const activeSettings = settings.filter(s => s.status === 'active').length
    const pm52Count = settings.filter(s => s.machine === 'PM52').length
    const sm74Count = settings.filter(s => s.machine === 'SM74').length
    const planoMaxCount = settings.filter(s => s.machine === 'Plano Max').length
    const totalRevenue = settings.reduce((sum, setting) => sum + setting.price, 0)

    setStats({
      totalSettings,
      activeSettings,
      pm52Count,
      sm74Count,
      planoMaxCount,
      totalRevenue
    })
  }

  const filteredSettings = settings.filter(setting => {
    const matchesSearch = 
      setting.machine.toLowerCase().includes(search.toLowerCase()) ||
      setting.printType.toLowerCase().includes(search.toLowerCase()) ||
      setting.id.toLowerCase().includes(search.toLowerCase())
    
    const matchesMachine = machineFilter === 'all' || setting.machine === machineFilter
    const matchesType = typeFilter === 'all' || setting.printType === typeFilter
    
    return matchesSearch && matchesMachine && matchesType
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleDelete = async (id, machine) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setSettings(settings.filter(s => s.id !== id))
        SweetAlert.success('Deleted!', `Print setting for ${machine} has been deleted.`)
        calculateStats()
      } catch (error) {
        SweetAlert.error('Error!', 'Failed to delete print setting')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (item) => {
    const result = await SweetAlert.confirmAction(
      'Change Status?',
      `Are you sure you want to ${item.status === 'active' ? 'deactivate' : 'activate'} this print setting?`
    )
    
    if (result.isConfirmed) {
      const newStatus = item.status === 'active' ? 'inactive' : 'active'
      setSettings(settings.map(s => 
        s.id === item.id ? { ...s, status: newStatus } : s
      ))
      SweetAlert.success('Success!', `Print setting status changed to ${newStatus}`)
      calculateStats()
    }
  }

  const handleSave = async (formData) => {
    try {
      setIsPosting(true)
      
      if (selectedSetting) {
        // Update existing
        const updatedSetting = {
          ...selectedSetting,
          ...formData,
          maxMaterialSize: {
            width: formData.maxMaterialWidth,
            length: formData.maxMaterialLength
          },
          minMaterialSize: {
            width: formData.minMaterialWidth,
            length: formData.minMaterialLength
          },
          maxPrintSize: {
            width: formData.maxPrintWidth,
            length: formData.maxPrintLength
          },
          minPrintSize: {
            width: formData.minPrintWidth,
            length: formData.minPrintLength
          },
          price: formData.price
        }
        
        setSettings(settings.map(s => 
          s.id === selectedSetting.id ? updatedSetting : s
        ))
        
        SweetAlert.success('Updated!', 'Print setting updated successfully!')
      } else {
        // Create new
        const newSetting = {
          id: `PRT-${Date.now().toString().slice(-6)}`,
          machine: formData.machine,
          printType: formData.printType,
          maxMaterialSize: {
            width: formData.maxMaterialWidth,
            length: formData.maxMaterialLength
          },
          minMaterialSize: {
            width: formData.minMaterialWidth,
            length: formData.minMaterialLength
          },
          maxPrintSize: {
            width: formData.maxPrintWidth,
            length: formData.maxPrintLength
          },
          minPrintSize: {
            width: formData.minPrintWidth,
            length: formData.minPrintLength
          },
          price: formData.price,
          status: 'active'
        }
        
        setSettings([...settings, newSetting])
        SweetAlert.success('Created!', 'New print setting created successfully!')
      }
      
      setIsEditModalOpen(false)
      setIsCreateModalOpen(false)
      setSelectedSetting(null)
      calculateStats()
      
    } catch (error) {
      SweetAlert.error('Error!', 'Failed to save print setting')
    } finally {
      setIsPosting(false)
    }
  }

  const handleCloseModal = () => {
    if (!isPosting) {
      setIsEditModalOpen(false)
      setIsCreateModalOpen(false)
      setIsViewModalOpen(false)
      setSelectedSetting(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header dengan judul */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Print Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure printing machine settings and prices</p>
        </div>
        
        <Button
          variant="primary"
          icon="mdi:plus"
          onClick={() => {
            setSelectedSetting(null)
            setIsCreateModalOpen(true)
          }}
          className="w-full md:w-auto"
        >
          Add Print Setting
        </Button>
      </div>

      {/* Stats Cards Grid - Desain Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:printer" className="text-blue-600" />
              Total Settings
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.totalSettings}</p>
              <Badge variant="success" size="sm">
                {stats.activeSettings} active
              </Badge>
            </div>
            <p className="text-xs text-gray-500">settings configured</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:printer-outline" className="text-amber-600" />
              PM52 Machine
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.pm52Count}</p>
              <Badge variant="info" size="sm">
                print types
              </Badge>
            </div>
            <p className="text-xs text-gray-500">max: 37x52 cm</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:printer-outline" className="text-green-600" />
              SM74 Machine
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.sm74Count}</p>
              <Badge variant="info" size="sm">
                print types
              </Badge>
            </div>
            <p className="text-xs text-gray-500">max: 52.5x72 cm</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:printer-outline" className="text-purple-600" />
              Total Revenue
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <p className="text-xs text-gray-500">from all print types</p>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              All Print Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Filter and search print settings by machine and type
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="mdi:filter-variant"
              onClick={() => {
                setMachineFilter('all')
                setTypeFilter('all')
                setSearch('')
              }}
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="mdi:export"
              onClick={() => SweetAlert.info('Export', 'Exporting print settings data...')}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search by machine, type, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Machines' },
              ...machineTypes.map(machine => ({ value: machine, label: machine }))
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Print Types' },
              ...printTypes.map(type => ({ value: type, label: type }))
            ]}
          />
        </div>
      </Card>

      {/* Print Settings Table dengan desain clean */}
      <Card>
        <Table
          headers={['ID', 'Machine', 'Print Type', 'Material Size', 'Print Size', 'Price', 'Status', 'Actions']}
          striped
          hoverable
        >
          {filteredSettings.map((setting) => (
            <TableRow key={setting.id} hoverable>
              <TableCell>
                <div className="font-medium text-blue-600">{setting.id}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CustomIcon icon="mdi:printer-outline" className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{setting.machine}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="info">
                  {setting.printType}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">
                    Max: {setting.maxMaterialSize.width}×{setting.maxMaterialSize.length}cm
                  </div>
                  <div className="text-gray-500 text-xs">
                    Min: {setting.minMaterialSize.width}×{setting.minMaterialSize.length}cm
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">
                    Max: {setting.maxPrintSize.width}×{setting.maxPrintSize.length}cm
                  </div>
                  <div className="text-gray-500 text-xs">
                    Min: {setting.minPrintSize.width}×{setting.minPrintSize.length}cm
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-bold text-green-600">
                  {formatCurrency(setting.price)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={setting.status === 'active' ? 'success' : 'danger'}>
                    {setting.status}
                  </Badge>
                  <button
                    onClick={() => handleToggleStatus(setting)}
                    className="text-gray-400 hover:text-gray-600"
                    title={setting.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <CustomIcon icon="mdi:swap-vertical" className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setSelectedSetting(setting)
                      setIsViewModalOpen(true)
                    }}
                    icon="mdi:eye"
                    className="text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    View
                  </Button>
                  
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setSelectedSetting(setting)
                      setIsEditModalOpen(true)
                    }}
                    icon="mdi:pencil"
                    className="text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    Edit
                  </Button>
                  
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDelete(setting.id, setting.machine)}
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

        {filteredSettings.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <CustomIcon icon="mdi:printer-off" className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 mb-1">No print settings found</p>
            <p className="text-sm text-gray-400 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              icon="mdi:plus"
            >
              Add Print Setting
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {Math.min(10, filteredSettings.length)} of {filteredSettings.length} settings
          </div>
          <div className="text-sm text-gray-500">
            Total: {formatCurrency(filteredSettings.reduce((sum, s) => sum + s.price, 0))}
          </div>
        </div>
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        title="Print Setting Details"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </div>
        }
      >
        {selectedSetting && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedSetting.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">{selectedSetting.machine}</Badge>
                  <Badge variant="primary">{selectedSetting.printType}</Badge>
                </div>
              </div>
              <Badge variant={selectedSetting.status === 'active' ? 'success' : 'danger'}>
                {selectedSetting.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 border-l-4 border-blue-500">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <CustomIcon icon="mdi:ruler-square" className="w-4 h-4" />
                  Material Size Limits (cm)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Size:</span>
                    <span className="font-bold text-gray-900">
                      {selectedSetting.maxMaterialSize.width} × {selectedSetting.maxMaterialSize.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min Size:</span>
                    <span className="font-medium text-gray-900">
                      {selectedSetting.minMaterialSize.width} × {selectedSetting.minMaterialSize.length}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-green-500">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <CustomIcon icon="mdi:printer" className="w-4 h-4" />
                  Print Size Limits (cm)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Print:</span>
                    <span className="font-bold text-gray-900">
                      {selectedSetting.maxPrintSize.width} × {selectedSetting.maxPrintSize.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min Print:</span>
                    <span className="font-medium text-gray-900">
                      {selectedSetting.minPrintSize.width} × {selectedSetting.minPrintSize.length}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 border-l-4 border-amber-500">
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <CustomIcon icon="mdi:cash" className="w-4 h-4" />
                Price Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Print Price:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedSetting.price)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Price is per sheet/impression for this machine and print type combination.
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isEditModalOpen || isCreateModalOpen}
        onClose={handleCloseModal}
        title={selectedSetting ? 'Edit Print Setting' : 'Add Print Setting'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isPosting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const formData = {
                  machine: (document.getElementById('machine') as HTMLSelectElement).value,
                  printType: (document.getElementById('printType') as HTMLSelectElement).value,
                  maxMaterialWidth: parseFloat((document.getElementById('maxMaterialWidth') as HTMLInputElement).value),
                  maxMaterialLength: parseFloat((document.getElementById('maxMaterialLength') as HTMLInputElement).value),
                  minMaterialWidth: parseFloat((document.getElementById('minMaterialWidth') as HTMLInputElement).value),
                  minMaterialLength: parseFloat((document.getElementById('minMaterialLength') as HTMLInputElement).value),
                  maxPrintWidth: parseFloat((document.getElementById('maxPrintWidth') as HTMLInputElement).value),
                  maxPrintLength: parseFloat((document.getElementById('maxPrintLength') as HTMLInputElement).value),
                  minPrintWidth: parseFloat((document.getElementById('minPrintWidth') as HTMLInputElement).value),
                  minPrintLength: parseFloat((document.getElementById('minPrintLength') as HTMLInputElement).value),
                  price: parseFloat((document.getElementById('price') as HTMLInputElement).value)
                }
                handleSave(formData)
              }}
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Saving...' : selectedSetting ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CustomIcon icon="mdi:information-outline" className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Machine *"
                id="machine"
                value={selectedSetting?.machine || ''}
                onChange={(e) => {}}
                options={machineTypes.map(machine => ({ value: machine, label: machine }))}
                required
                disabled={isPosting}
              />
              <Select
                label="Print Type *"
                id="printType"
                value={selectedSetting?.printType || ''}
                onChange={(e) => {}}
                options={printTypes.map(type => ({ value: type, label: type }))}
                required
                disabled={isPosting}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Price (IDR) *"
                id="price"
                type="number"
                defaultValue={selectedSetting?.price || 0}
                placeholder="Enter price"
                required
                disabled={isPosting}
              />
            </div>
          </div>

          {/* Material Size Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CustomIcon icon="mdi:ruler-square" className="w-5 h-5" />
              Material Size Limits (cm)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Width"
                id="maxMaterialWidth"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.maxMaterialSize.width || 0}
                placeholder="0"
                disabled={isPosting}
              />
              <Input
                label="Max Length"
                id="maxMaterialLength"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.maxMaterialSize.length || 0}
                placeholder="0"
                disabled={isPosting}
              />
              <Input
                label="Min Width"
                id="minMaterialWidth"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.minMaterialSize.width || 0}
                placeholder="0"
                disabled={isPosting}
              />
              <Input
                label="Min Length"
                id="minMaterialLength"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.minMaterialSize.length || 0}
                placeholder="0"
                disabled={isPosting}
              />
            </div>
          </div>

          {/* Print Size Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CustomIcon icon="mdi:printer" className="w-5 h-5" />
              Print Size Limits (cm)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Print Width"
                id="maxPrintWidth"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.maxPrintSize.width || 0}
                placeholder="0"
                disabled={isPosting}
              />
              <Input
                label="Max Print Length"
                id="maxPrintLength"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.maxPrintSize.length || 0}
                placeholder="0"
                disabled={isPosting}
              />
              <Input
                label="Min Print Width"
                id="minPrintWidth"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.minPrintSize.width || 0}
                placeholder="0"
                disabled={isPosting}
              />
              <Input
                label="Min Print Length"
                id="minPrintLength"
                type="number"
                step="0.1"
                defaultValue={selectedSetting?.minPrintSize.length || 0}
                placeholder="0"
                disabled={isPosting}
              />
            </div>
          </div>

          {/* Preview Section */}
          {(isEditModalOpen || isCreateModalOpen) && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                <CustomIcon icon="mdi:eye" className="w-4 h-4" />
                Preview
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Material Size:</span>
                  <p className="font-medium">
                    Max: {selectedSetting?.maxMaterialSize.width || 0}×{selectedSetting?.maxMaterialSize.length || 0}cm
                  </p>
                  <p className="text-gray-600">
                    Min: {selectedSetting?.minMaterialSize.width || 0}×{selectedSetting?.minMaterialSize.length || 0}cm
                  </p>
                </div>
                <div>
                  <span className="text-blue-600">Print Size:</span>
                  <p className="font-medium">
                    Max: {selectedSetting?.maxPrintSize.width || 0}×{selectedSetting?.maxPrintSize.length || 0}cm
                  </p>
                  <p className="text-gray-600">
                    Min: {selectedSetting?.minPrintSize.width || 0}×{selectedSetting?.minPrintSize.length || 0}cm
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Modal>
    </div>
  )
}