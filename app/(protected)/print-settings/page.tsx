'use client'

import { useState } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'
import SweetAlert from '@/components/UI/SweetAlert'

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
    }
  }

  const handleSave = async (formData) => {
    try {
      setLoading(true)
      
      if (selectedSetting) {
        // Update existing
        const updatedSetting = {
          ...selectedSetting,
          ...formData
        }
        
        setSettings(settings.map(s => 
          s.id === selectedSetting.id ? updatedSetting : s
        ))
        
        SweetAlert.success('Updated!', 'Print setting updated successfully!')
      } else {
        // Create new
        const newSetting = {
          id: `PRT-${Date.now().toString().slice(-6)}`,
          ...formData,
          status: 'active'
        }
        
        setSettings([...settings, newSetting])
        SweetAlert.success('Created!', 'New print setting created successfully!')
      }
      
      setIsEditModalOpen(false)
      setIsCreateModalOpen(false)
      setSelectedSetting(null)
      
    } catch (error) {
      SweetAlert.error('Error!', 'Failed to save print setting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:printer" className="w-8 h-8" />
              Print Settings
            </h1>
            <p className="opacity-90 mt-1">Configure printing machine settings and prices</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:printer">
                Total: {settings.length} Settings
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                Active: {settings.filter(s => s.status === 'active').length}
              </Badge>
              {machineTypes.map(machine => (
                <Badge key={machine} variant="warning" icon="mdi:printer-outline">
                  {machine}: {settings.filter(s => s.machine === machine).length}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            variant="success"
            icon="mdi:plus"
            onClick={() => {
              setSelectedSetting(null)
              setIsCreateModalOpen(true)
            }}
          >
            Add Print Setting
          </Button>
        </div>
      </Card>

      {/* Machine Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {machineTypes.map(machine => {
          const machineSettings = settings.filter(s => s.machine === machine)
          const totalPrice = machineSettings.reduce((sum, setting) => sum + setting.price, 0)
          
          return (
            <Card key={machine} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <CustomIcon icon="mdi:printer" className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{machine}</h3>
                  <p className="text-sm text-gray-600">
                    {machineSettings.length} print types
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Max Size: {machineSettings[0]?.maxMaterialSize.width || 0}x{machineSettings[0]?.maxMaterialSize.length || 0}cm
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Total: {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Settings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Print Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material Size (cm)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Print Size (cm)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSettings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-amber-600">{setting.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CustomIcon icon="mdi:printer-outline" className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{setting.machine}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">
                      {setting.printType}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">Max: {setting.maxMaterialSize.width} x {setting.maxMaterialSize.length}</div>
                      <div className="text-gray-500">Min: {setting.minMaterialSize.width} x {setting.minMaterialSize.length}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">Max: {setting.maxPrintSize.width} x {setting.maxPrintSize.length}</div>
                      <div className="text-gray-500">Min: {setting.minPrintSize.width} x {setting.minPrintSize.length}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-green-600">
                      {formatCurrency(setting.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={setting.status === 'active' ? 'success' : 'danger'}>
                        {setting.status}
                      </Badge>
                      <button
                        onClick={() => handleToggleStatus(setting)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <CustomIcon icon="mdi:swap-vertical" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSetting(setting)
                          setIsViewModalOpen(true)
                        }}
                        icon="mdi:eye"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSetting(setting)
                          setIsEditModalOpen(true)
                        }}
                        icon="mdi:pencil"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(setting.id, setting.machine)}
                        icon="mdi:delete"
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedSetting(null)
        }}
        title="Print Setting Details"
        size="lg"
      >
        {selectedSetting && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedSetting.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Machine</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSetting.machine}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Print Type</label>
              <p className="mt-1 text-sm text-gray-900">{selectedSetting.printType}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Material Size Limits (cm)</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Max:</span>
                    <span className="font-medium">{selectedSetting.maxMaterialSize.width} × {selectedSetting.maxMaterialSize.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Min:</span>
                    <span className="font-medium">{selectedSetting.minMaterialSize.width} × {selectedSetting.minMaterialSize.length}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Print Size Limits (cm)</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Max:</span>
                    <span className="font-medium">{selectedSetting.maxPrintSize.width} × {selectedSetting.maxPrintSize.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Min:</span>
                    <span className="font-medium">{selectedSetting.minPrintSize.width} × {selectedSetting.minPrintSize.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {formatCurrency(selectedSetting.price)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <Badge variant={selectedSetting.status === 'active' ? 'success' : 'danger'}>
                {selectedSetting.status}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isEditModalOpen || isCreateModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setIsCreateModalOpen(false)
          setSelectedSetting(null)
        }}
        title={selectedSetting ? 'Edit Print Setting' : 'Add Print Setting'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false)
                setIsCreateModalOpen(false)
                setSelectedSetting(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const formData = {
                  machine: document.getElementById('machine').value,
                  printType: document.getElementById('printType').value,
                  maxMaterialWidth: parseFloat(document.getElementById('maxMaterialWidth').value),
                  maxMaterialLength: parseFloat(document.getElementById('maxMaterialLength').value),
                  minMaterialWidth: parseFloat(document.getElementById('minMaterialWidth').value),
                  minMaterialLength: parseFloat(document.getElementById('minMaterialLength').value),
                  maxPrintWidth: parseFloat(document.getElementById('maxPrintWidth').value),
                  maxPrintLength: parseFloat(document.getElementById('maxPrintLength').value),
                  minPrintWidth: parseFloat(document.getElementById('minPrintWidth').value),
                  minPrintLength: parseFloat(document.getElementById('minPrintLength').value),
                  price: parseFloat(document.getElementById('price').value)
                }
                handleSave(formData)
              }}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : selectedSetting ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Machine *"
              id="machine"
              value={selectedSetting?.machine || ''}
              options={machineTypes.map(machine => ({ value: machine, label: machine }))}
              required
            />
            <Select
              label="Print Type *"
              id="printType"
              value={selectedSetting?.printType || ''}
              options={printTypes.map(type => ({ value: type, label: type }))}
              required
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Material Size Limits (cm)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Width"
                id="maxMaterialWidth"
                type="number"
                defaultValue={selectedSetting?.maxMaterialSize.width || 0}
                placeholder="0"
                step="0.1"
              />
              <Input
                label="Max Length"
                id="maxMaterialLength"
                type="number"
                defaultValue={selectedSetting?.maxMaterialSize.length || 0}
                placeholder="0"
                step="0.1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input
                label="Min Width"
                id="minMaterialWidth"
                type="number"
                defaultValue={selectedSetting?.minMaterialSize.width || 0}
                placeholder="0"
                step="0.1"
              />
              <Input
                label="Min Length"
                id="minMaterialLength"
                type="number"
                defaultValue={selectedSetting?.minMaterialSize.length || 0}
                placeholder="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Print Size Limits (cm)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Width"
                id="maxPrintWidth"
                type="number"
                defaultValue={selectedSetting?.maxPrintSize.width || 0}
                placeholder="0"
                step="0.1"
              />
              <Input
                label="Max Length"
                id="maxPrintLength"
                type="number"
                defaultValue={selectedSetting?.maxPrintSize.length || 0}
                placeholder="0"
                step="0.1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input
                label="Min Width"
                id="minPrintWidth"
                type="number"
                defaultValue={selectedSetting?.minPrintSize.width || 0}
                placeholder="0"
                step="0.1"
              />
              <Input
                label="Min Length"
                id="minPrintLength"
                type="number"
                defaultValue={selectedSetting?.minPrintSize.length || 0}
                placeholder="0"
                step="0.1"
              />
            </div>
          </div>

          <div>
            <Input
              label="Price *"
              id="price"
              type="number"
              defaultValue={selectedSetting?.price || 0}
              placeholder="0"
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}