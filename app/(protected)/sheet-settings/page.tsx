// app/(protected)/sheet-settings/page.jsx
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

// Based on Index Sheet sheet
const mockSheetSettings = [
  {
    id: 'SHT-001',
    substance: '125M/125M/125M',
    bFlute: 3855,
    cFlute: 3942,
    cbFlute: 6527,
    eFlute: 4069,
    ukuran: '650x1050',
    hargaPerlembar: 1100,
    status: 'active'
  },
  {
    id: 'SHT-002',
    substance: '125K/125M/125M',
    bFlute: 3969,
    cFlute: 4057,
    cbFlute: 6641,
    eFlute: 4190,
    ukuran: '790x1090',
    hargaPerlembar: 1400,
    status: 'active'
  },
  {
    id: 'SHT-003',
    substance: '125K/125M/125K',
    bFlute: 4083,
    cFlute: 4172,
    cbFlute: 6756,
    eFlute: 4310,
    ukuran: '670x1400',
    hargaPerlembar: 1500,
    status: 'active'
  },
  {
    id: 'SHT-004',
    substance: '150K/125M/125M',
    bFlute: 4168,
    cFlute: 4256,
    cbFlute: 6840,
    eFlute: 4399,
    ukuran: '900x1200',
    hargaPerlembar: 1700,
    status: 'active'
  },
  {
    id: 'SHT-005',
    substance: '150K/125M/125K',
    bFlute: 4282,
    cFlute: 4370,
    cbFlute: 6955,
    eFlute: 4520,
    ukuran: '650x1050',
    hargaPerlembar: 1100,
    status: 'inactive'
  }
]

export default function SheetSettingsPage() {
  const [settings, setSettings] = useState(mockSheetSettings)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [substanceFilter, setSubstanceFilter] = useState('all')
  const [selectedSetting, setSelectedSetting] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredSettings = settings.filter(setting => {
    const matchesSearch = 
      setting.substance.toLowerCase().includes(search.toLowerCase()) ||
      setting.id.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || setting.status === statusFilter
    const matchesSubstance = substanceFilter === 'all' || setting.substance === substanceFilter
    
    return matchesSearch && matchesStatus && matchesSubstance
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleDelete = async (id, substance) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setSettings(settings.filter(s => s.id !== id))
        SweetAlert.success('Deleted!', `Sheet setting "${substance}" has been deleted.`)
      } catch (error) {
        SweetAlert.error('Error!', 'Failed to delete sheet setting')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (item) => {
    const result = await SweetAlert.confirmAction(
      'Change Status?',
      `Are you sure you want to ${item.status === 'active' ? 'deactivate' : 'activate'} this sheet setting?`
    )
    
    if (result.isConfirmed) {
      const newStatus = item.status === 'active' ? 'inactive' : 'active'
      setSettings(settings.map(s => 
        s.id === item.id ? { ...s, status: newStatus } : s
      ))
      SweetAlert.success('Success!', `Sheet setting status changed to ${newStatus}`)
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
        
        SweetAlert.success('Updated!', 'Sheet setting updated successfully!')
      } else {
        // Create new
        const newSetting = {
          id: `SHT-${Date.now().toString().slice(-6)}`,
          ...formData,
          status: 'active'
        }
        
        setSettings([...settings, newSetting])
        SweetAlert.success('Created!', 'New sheet setting created successfully!')
      }
      
      setIsEditModalOpen(false)
      setIsCreateModalOpen(false)
      setSelectedSetting(null)
      
    } catch (error) {
      SweetAlert.error('Error!', 'Failed to save sheet setting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:file-document" className="w-8 h-8" />
              Sheet Settings
            </h1>
            <p className="opacity-90 mt-1">Configure sheet material prices and specifications</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:package-variant">
                Total: {settings.length} Settings
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                Active: {settings.filter(s => s.status === 'active').length}
              </Badge>
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
            Add Sheet Setting
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search by substance or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
          <Select
            value={substanceFilter}
            onChange={(e) => setSubstanceFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Substances' },
              { value: '125M/125M/125M', label: '125M/125M/125M' },
              { value: '125K/125M/125M', label: '125K/125M/125M' },
              { value: '125K/125M/125K', label: '125K/125M/125K' },
              { value: '150K/125M/125M', label: '150K/125M/125M' }
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Substance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-FLUTE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Sheet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSettings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-600">{setting.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{setting.substance}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{setting.ukuran}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(setting.eFlute)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-purple-600">
                      {formatCurrency(setting.hargaPerlembar)}
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
                        onClick={() => handleDelete(setting.id, setting.substance)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isEditModalOpen || isCreateModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setIsCreateModalOpen(false)
          setSelectedSetting(null)
        }}
        title={selectedSetting ? 'Edit Sheet Setting' : 'Add Sheet Setting'}
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
                  substance: document.getElementById('substance').value,
                  bFlute: parseFloat(document.getElementById('bFlute').value),
                  cFlute: parseFloat(document.getElementById('cFlute').value),
                  cbFlute: parseFloat(document.getElementById('cbFlute').value),
                  eFlute: parseFloat(document.getElementById('eFlute').value),
                  ukuran: document.getElementById('ukuran').value,
                  hargaPerlembar: parseFloat(document.getElementById('hargaPerlembar').value)
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
          <Input
            label="Substance *"
            id="substance"
            defaultValue={selectedSetting?.substance || ''}
            placeholder="e.g., 125M/125M/125M"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="B-FLUTE Price"
              id="bFlute"
              type="number"
              defaultValue={selectedSetting?.bFlute || 0}
              placeholder="0"
            />
            <Input
              label="C-FLUTE Price"
              id="cFlute"
              type="number"
              defaultValue={selectedSetting?.cFlute || 0}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CB-FLUTE Price"
              id="cbFlute"
              type="number"
              defaultValue={selectedSetting?.cbFlute || 0}
              placeholder="0"
            />
            <Input
              label="E-FLUTE Price *"
              id="eFlute"
              type="number"
              defaultValue={selectedSetting?.eFlute || 0}
              placeholder="0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Size *"
              id="ukuran"
              defaultValue={selectedSetting?.ukuran || ''}
              placeholder="e.g., 650x1050"
              required
            />
            <Input
              label="Price per Sheet *"
              id="hargaPerlembar"
              type="number"
              defaultValue={selectedSetting?.hargaPerlembar || 0}
              placeholder="0"
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}