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

// Data berdasarkan Excel sheet
const formulaTypes = [
  { id: 'D+K', name: 'Duplek + Kraft', description: 'Formula untuk innerbox Duplek + Kraft', icon: 'mdi:package-variant', sheet: 'HITUNG D+K' },
  { id: 'DMD', name: 'Duplek + Medium + Duplek', description: 'Formula untuk innerbox Duplek + Medium + Duplek', icon: 'mdi:layers', sheet: 'HITUNG DMD' },
  { id: 'SHEET', name: 'Sheet Kraft', description: 'Formula untuk innerbox Sheet Kraft', icon: 'mdi:file-document', sheet: 'HITUNG SHEET' }
]

const mockFormulas = [
  {
    id: 'FML-001',
    type: 'D+K',
    name: 'Standard D+K Formula',
    formula: 'Harga Modal = (Biaya Produksi + Harga Bahan + Cetakan + Laminasi + Pisau) x 5%',
    variables: [
      { name: 'Panjang Bahan (mm)', value: 'A3' },
      { name: 'Lebar Bahan (mm)', value: 'B3' },
      { name: 'QTY', value: 'C3' },
      { name: 'Toleransi', value: '5%' }
    ],
    status: 'active'
  },
  {
    id: 'FML-002',
    type: 'DMD',
    name: 'Premium DMD Formula',
    formula: 'Harga Modal = (Biaya Produksi + Duplek Luar + Medium + Duplek Dalam + Lem + Cetakan) x 5%',
    variables: [
      { name: 'Panjang Bahan', value: 'A3' },
      { name: 'Lebar Bahan', value: 'B3' },
      { name: 'Gramasi Duplek', value: '250 GSM' },
      { name: 'Substance Medium', value: '125M' }
    ],
    status: 'active'
  },
  {
    id: 'FML-003',
    type: 'SHEET',
    name: 'Sheet Kraft Formula',
    formula: 'Harga Modal = (Harga Bahan Sheet + Cetakan + Sablon + Laminasi + Pisau) + Biaya Produksi',
    variables: [
      { name: 'Ukuran Min', value: '70x70' },
      { name: 'Min QTY', value: '1000 PCS' },
      { name: 'Substance', value: '125K/125M/125K' }
    ],
    status: 'inactive'
  },
  {
    id: 'FML-004',
    type: 'D+K',
    name: 'D+K dengan Cetakan',
    formula: 'Harga Modal = (Biaya Produksi + Bahan + Cetakan Blok + Cetakan Tulisan + Laminasi Doff) x 5%',
    variables: [
      { name: 'Cetakan 1', value: 'Cetak Blok' },
      { name: 'Cetakan 2', value: 'Cetak Tulisan' },
      { name: 'Laminasi', value: 'Doff' }
    ],
    status: 'active'
  }
]

export default function MaterialFormulasPage() {
  const [formulas, setFormulas] = useState(mockFormulas)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedFormula, setSelectedFormula] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredFormulas = formulas.filter(formula => {
    const matchesSearch = 
      formula.name.toLowerCase().includes(search.toLowerCase()) ||
      formula.id.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === 'all' || formula.type === typeFilter
    const matchesStatus = statusFilter === 'all' || formula.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeInfo = (type) => {
    return formulaTypes.find(t => t.id === type) || formulaTypes[0]
  }

  const handleDelete = async (id, name) => {
    const result = await SweetAlert.confirmDelete()
    
    if (result.isConfirmed) {
      try {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setFormulas(formulas.filter(f => f.id !== id))
        SweetAlert.success('Deleted!', `Formula "${name}" has been deleted.`)
      } catch (error) {
        SweetAlert.error('Error!', 'Failed to delete formula')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (item) => {
    const result = await SweetAlert.confirmAction(
      'Change Status?',
      `Are you sure you want to ${item.status === 'active' ? 'deactivate' : 'activate'} this formula?`
    )
    
    if (result.isConfirmed) {
      const newStatus = item.status === 'active' ? 'inactive' : 'active'
      setFormulas(formulas.map(f => 
        f.id === item.id ? { ...f, status: newStatus } : f
      ))
      SweetAlert.success('Success!', `Formula status changed to ${newStatus}`)
    }
  }

  const handleSave = async (formData) => {
    try {
      setLoading(true)
      
      if (selectedFormula) {
        // Update existing
        const updatedFormula = {
          ...selectedFormula,
          ...formData
        }
        
        setFormulas(formulas.map(f => 
          f.id === selectedFormula.id ? updatedFormula : f
        ))
        
        SweetAlert.success('Updated!', 'Formula updated successfully!')
      } else {
        // Create new
        const newFormula = {
          id: `FML-${Date.now().toString().slice(-6)}`,
          ...formData,
          status: 'active',
          variables: []
        }
        
        setFormulas([...formulas, newFormula])
        SweetAlert.success('Created!', 'New formula created successfully!')
      }
      
      setIsEditModalOpen(false)
      setIsCreateModalOpen(false)
      setSelectedFormula(null)
      
    } catch (error) {
      SweetAlert.error('Error!', 'Failed to save formula')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:calculator" className="w-8 h-8" />
              Material Formulas
            </h1>
            <p className="opacity-90 mt-1">Manage calculation formulas for different material types</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:calculator">
                Total: {formulas.length} Formulas
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                Active: {formulas.filter(f => f.status === 'active').length}
              </Badge>
              {formulaTypes.map(type => (
                <Badge key={type.id} variant="warning" icon={type.icon}>
                  {type.name}: {formulas.filter(f => f.type === type.id).length}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            variant="success"
            icon="mdi:plus"
            onClick={() => {
              setSelectedFormula(null)
              setIsCreateModalOpen(true)
            }}
          >
            Add Formula
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {formulaTypes.map(type => {
          const count = formulas.filter(f => f.type === type.id).length
          const activeCount = formulas.filter(f => f.type === type.id && f.status === 'active').length
          return (
            <Card key={type.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <CustomIcon icon={type.icon} className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      {count} formulas
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {activeCount} active
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
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              ...formulaTypes.map(type => ({ value: type.id, label: type.name }))
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </div>
      </Card>

      {/* Formulas Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variables</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFormulas.map((formula) => {
                const typeInfo = getTypeInfo(formula.type)
                return (
                  <tr key={formula.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-purple-600">{formula.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CustomIcon icon={typeInfo.icon} className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{formula.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{formula.name}</div>
                      <div className="text-xs text-gray-500">{typeInfo.sheet}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 font-mono max-w-xs truncate">
                        {formula.formula}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {formula.variables.slice(0, 3).map((varItem, idx) => (
                          <Badge key={idx} variant="outline" size="sm">
                            {varItem.name}
                          </Badge>
                        ))}
                        {formula.variables.length > 3 && (
                          <Badge variant="info" size="sm">
                            +{formula.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={formula.status === 'active' ? 'success' : 'danger'}>
                          {formula.status}
                        </Badge>
                        <button
                          onClick={() => handleToggleStatus(formula)}
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
                            setSelectedFormula(formula)
                            setIsViewModalOpen(true)
                          }}
                          icon="mdi:eye"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFormula(formula)
                            setIsEditModalOpen(true)
                          }}
                          icon="mdi:pencil"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(formula.id, formula.name)}
                          icon="mdi:delete"
                          className="text-red-600 hover:text-red-700"
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedFormula(null)
        }}
        title="Formula Details"
        size="lg"
      >
        {selectedFormula && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{selectedFormula.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-sm text-gray-900">{getTypeInfo(selectedFormula.type).name}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{selectedFormula.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Formula</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                {selectedFormula.formula}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Variables</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {selectedFormula.variables.map((varItem, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">{varItem.name}</div>
                    <div className="text-sm font-medium">{varItem.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <Badge variant={selectedFormula.status === 'active' ? 'success' : 'danger'}>
                {selectedFormula.status}
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
          setSelectedFormula(null)
        }}
        title={selectedFormula ? 'Edit Formula' : 'Add Formula'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false)
                setIsCreateModalOpen(false)
                setSelectedFormula(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const formData = {
                  type: document.getElementById('type').value,
                  name: document.getElementById('name').value,
                  formula: document.getElementById('formula').value
                }
                handleSave(formData)
              }}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : selectedFormula ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Formula Type *"
            id="type"
            value={selectedFormula?.type || ''}
            options={formulaTypes.map(type => ({ value: type.id, label: type.name }))}
            required
          />

          <Input
            label="Formula Name *"
            id="name"
            defaultValue={selectedFormula?.name || ''}
            placeholder="e.g., Standard D+K Formula"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formula Expression *
            </label>
            <textarea
              id="formula"
              defaultValue={selectedFormula?.formula || ''}
              placeholder="Enter formula expression..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Use variables like: Harga Modal, Biaya Produksi, Harga Bahan, etc.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}