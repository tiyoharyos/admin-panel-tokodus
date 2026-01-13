// app/(protected)/price-settings/page.jsx
'use client'

import { useState } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'

const mockPriceSettings = [
  {
    id: 1,
    name: 'Duplek + Kraft',
    category: 'D+K',
    hargaModal: 7500,
    hargaJual: 12000,
    qty: 1000,
    ukuranBahan: { panjang: '100cm', lebar: '70cm' },
    jenisCorrugated: 'E-FLUTE',
    substance: '150gsm',
    status: 'active',
    margin: 60.0
  },
  {
    id: 2,
    name: 'Duplek Medium Duplek',
    category: 'DMD',
    hargaModal: 9800,
    hargaJual: 15500,
    qty: 500,
    ukuranBahan: { panjang: '110cm', lebar: '80cm' },
    jenisCorrugated: 'B-FLUTE',
    substance: '180gsm',
    status: 'active',
    margin: 58.2
  },
  {
    id: 3,
    name: 'Sheet Kraft',
    category: 'Sheet',
    hargaModal: 5500,
    hargaJual: 8500,
    qty: 2000,
    ukuranBahan: { panjang: '90cm', lebar: '60cm' },
    jenisCorrugated: 'N/A',
    substance: '120gsm',
    status: 'inactive',
    margin: 54.5
  },
  {
    id: 4,
    name: 'Corrugated Single',
    category: 'Single Wall',
    hargaModal: 6500,
    hargaJual: 10500,
    qty: 800,
    ukuranBahan: { panjang: '95cm', lebar: '65cm' },
    jenisCorrugated: 'C-FLUTE',
    substance: '160gsm',
    status: 'active',
    margin: 61.5
  },
  {
    id: 5,
    name: 'White Top Kraft',
    category: 'Premium',
    hargaModal: 12500,
    hargaJual: 18500,
    qty: 300,
    ukuranBahan: { panjang: '105cm', lebar: '75cm' },
    jenisCorrugated: 'E-FLUTE',
    substance: '200gsm',
    status: 'active',
    margin: 48.0
  },
  {
    id: 6,
    name: 'Art Carton Premium',
    category: 'Premium',
    hargaModal: 15000,
    hargaJual: 22500,
    qty: 200,
    ukuranBahan: { panjang: '120cm', lebar: '85cm' },
    jenisCorrugated: 'A-FLUTE',
    substance: '250gsm',
    status: 'active',
    margin: 50.0
  }
]

export default function PriceSettingsPage() {
  const [priceSettings, setPriceSettings] = useState(mockPriceSettings)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredPriceSettings = priceSettings.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateMargin = (hargaJual, hargaModal) => {
    return ((hargaJual - hargaModal) / hargaModal * 100).toFixed(1)
  }

  const getMarginColor = (margin) => {
    if (margin >= 60) return 'text-green-600'
    if (margin >= 50) return 'text-blue-600'
    if (margin >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusVariant = (status) => {
    return status === 'active' ? 'success' : 'danger'
  }

  const getCategoryVariant = (category) => {
    switch(category) {
      case 'D+K': return 'primary'
      case 'DMD': return 'info'
      case 'Sheet': return 'warning'
      case 'Single Wall': return 'gray'
      case 'Premium': return 'success'
      default: return 'gray'
    }
  }

  const handleViewDetails = (item) => {
    setSelectedPrice(item)
    setIsViewModalOpen(true)
  }

  const handleEdit = (item) => {
    setSelectedPrice(item)
    setIsEditModalOpen(true)
  }

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this price setting?')) {
      setPriceSettings(priceSettings.filter(item => item.id !== id))
    }
  }

  const handleToggleStatus = (id) => {
    setPriceSettings(priceSettings.map(item => 
      item.id === id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item
    ))
  }

  const handleSavePrice = (formData) => {
    if (selectedPrice) {
      // Update existing
      setPriceSettings(priceSettings.map(item => 
        item.id === selectedPrice.id ? {
          ...item,
          ...formData,
          margin: calculateMargin(formData.hargaJual, formData.hargaModal)
        } : item
      ))
      setIsEditModalOpen(false)
    } else {
      // Create new
      const newItem = {
        id: Math.max(...priceSettings.map(p => p.id)) + 1,
        ...formData,
        margin: calculateMargin(formData.hargaJual, formData.hargaModal),
        status: 'active'
      }
      setPriceSettings([...priceSettings, newItem])
      setIsCreateModalOpen(false)
    }
    setSelectedPrice(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:currency-usd" className="w-8 h-8" />
              Price Settings
            </h1>
            <p className="opacity-90 mt-1">Configure material prices, markups, and quantity breaks</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:chart-line">
                Avg Margin: {(() => {
                  const avg = priceSettings.reduce((acc, item) => acc + parseFloat(item.margin), 0) / priceSettings.length
                  return avg.toFixed(1) + '%'
                })()}
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                Active: {priceSettings.filter(p => p.status === 'active').length}
              </Badge>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            variant="success"
            icon="mdi:plus"
            className="w-full md:w-auto"
          >
            Add Price Setting
          </Button>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Margin</p>
              <p className="text-2xl font-bold text-green-600">
                {(() => {
                  const avg = priceSettings.reduce((acc, item) => acc + parseFloat(item.margin), 0) / priceSettings.length
                  return `${avg.toFixed(1)}%`
                })()}
              </p>
            </div>
            <CustomIcon icon="mdi:chart-line" className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Active Items</p>
              <p className="text-2xl font-bold text-blue-600">
                {priceSettings.filter(item => item.status === 'active').length}
              </p>
            </div>
            <CustomIcon icon="mdi:check-circle" className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Price Difference</p>
              <p className="text-2xl font-bold text-purple-600">
                {(() => {
                  const avgDiff = priceSettings.reduce((acc, item) => 
                    acc + (item.hargaJual - item.hargaModal), 0) / priceSettings.length
                  return formatCurrency(Math.round(avgDiff))
                })()}
              </p>
            </div>
            <CustomIcon icon="mdi:currency-exchange" className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search price settings..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'D+K', label: 'Duplek + Kraft' },
              { value: 'DMD', label: 'Duplek Medium Duplek' },
              { value: 'Sheet', label: 'Sheet Kraft' },
              { value: 'Single Wall', label: 'Corrugated Single' },
              { value: 'Premium', label: 'Premium' }
            ]}
          />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          <div className="text-sm text-gray-600">
            {filteredPriceSettings.length} price settings found
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
              icon="mdi:filter-remove"
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="mdi:export"
            >
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Price Settings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPriceSettings.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CustomIcon icon="mdi:package-variant" className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.jenisCorrugated} • {item.substance}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getCategoryVariant(item.category)}>
                      {item.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.hargaModal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(item.hargaJual)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getMarginColor(item.margin)}`}>
                        {item.margin}%
                      </span>
                      <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(100, item.margin)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <CustomIcon icon="mdi:package" className="mr-2 text-gray-400" />
                      {item.qty.toLocaleString()} pcs
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(item.status)}>
                        {item.status}
                      </Badge>
                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <CustomIcon icon="mdi:swap-vertical" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(item)}
                        icon="mdi:eye"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        icon="mdi:pencil"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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

      {/* Empty State */}
      {filteredPriceSettings.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <CustomIcon icon="mdi:currency-usd-off" className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Price Settings Found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
          <Button onClick={handleCreate} variant="primary" icon="mdi:plus">
            Add Price Setting
          </Button>
        </Card>
      )}

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center gap-2">
          <CustomIcon icon="mdi:information" />
          Price Settings Information
        </h3>
        <p className="text-blue-700 mb-3">
          Price settings determine the base costs for materials. The selling price is calculated based on cost price plus margin percentage.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-600">
          <div>
            <span className="font-medium">Margin Calculation:</span>
            <p className="mt-1">Margin = ((Selling Price - Cost Price) / Cost Price) × 100%</p>
          </div>
          <div>
            <span className="font-medium">Quantity Breaks:</span>
            <p className="mt-1">Prices may vary based on quantity ordered (bulk discounts)</p>
          </div>
        </div>
      </Card>

      {/* View Price Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Price Setting Details"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedPrice && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedPrice.name}</h3>
                <Badge variant={getCategoryVariant(selectedPrice.category)}>
                  {selectedPrice.category}
                </Badge>
              </div>
              <Badge variant={getStatusVariant(selectedPrice.status)}>
                {selectedPrice.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Cost Price</h4>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPrice.hargaModal)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Selling Price</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPrice.hargaJual)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Margin</h4>
                <p className={`text-xl font-bold ${getMarginColor(selectedPrice.margin)}`}>
                  {selectedPrice.margin}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, selectedPrice.margin)}%` }}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Quantity</h4>
                <p className="text-xl font-bold text-gray-900">{selectedPrice.qty.toLocaleString()} pcs</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Size</h4>
                <p className="text-gray-900">{selectedPrice.ukuranBahan.panjang} × {selectedPrice.ukuranBahan.lebar}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Corrugated Type</h4>
                <p className="text-gray-900">{selectedPrice.jenisCorrugated}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Substance</h4>
                <p className="text-gray-900">{selectedPrice.substance}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Price Difference</h4>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(selectedPrice.hargaJual - selectedPrice.hargaModal)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit/Add Price Modal */}
      <Modal
        isOpen={isEditModalOpen || isCreateModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setIsCreateModalOpen(false)
          setSelectedPrice(null)
        }}
        title={selectedPrice ? 'Edit Price Setting' : 'Add Price Setting'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false)
              setIsCreateModalOpen(false)
              setSelectedPrice(null)
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {
              const formData = {
                name: document.getElementById('priceName').value,
                category: document.getElementById('priceCategory').value,
                hargaModal: parseFloat(document.getElementById('hargaModal').value),
                hargaJual: parseFloat(document.getElementById('hargaJual').value),
                qty: parseInt(document.getElementById('priceQty').value),
                ukuranBahan: {
                  panjang: document.getElementById('ukuranPanjang').value,
                  lebar: document.getElementById('ukuranLebar').value
                },
                jenisCorrugated: document.getElementById('jenisCorrugated').value,
                substance: document.getElementById('substance').value
              }
              handleSavePrice(formData)
            }}>
              {selectedPrice ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Material Name *"
            id="priceName"
            defaultValue={selectedPrice?.name || ''}
            placeholder="e.g., Duplek + Kraft"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category *"
              id="priceCategory"
              defaultValue={selectedPrice?.category || 'D+K'}
              options={[
                { value: 'D+K', label: 'Duplek + Kraft' },
                { value: 'DMD', label: 'Duplek Medium Duplek' },
                { value: 'Sheet', label: 'Sheet Kraft' },
                { value: 'Single Wall', label: 'Corrugated Single' },
                { value: 'Premium', label: 'Premium' }
              ]}
            />
            
            <Input
              label="Quantity (pcs) *"
              id="priceQty"
              type="number"
              defaultValue={selectedPrice?.qty || 1000}
              placeholder="Enter quantity"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cost Price *"
              id="hargaModal"
              type="number"
              defaultValue={selectedPrice?.hargaModal || 0}
              placeholder="Enter cost price"
            />
            
            <Input
              label="Selling Price *"
              id="hargaJual"
              type="number"
              defaultValue={selectedPrice?.hargaJual || 0}
              placeholder="Enter selling price"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Size - Panjang *"
              id="ukuranPanjang"
              defaultValue={selectedPrice?.ukuranBahan?.panjang || '100cm'}
              placeholder="e.g., 100cm"
            />
            
            <Input
              label="Size - Lebar *"
              id="ukuranLebar"
              defaultValue={selectedPrice?.ukuranBahan?.lebar || '70cm'}
              placeholder="e.g., 70cm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Corrugated Type"
              id="jenisCorrugated"
              defaultValue={selectedPrice?.jenisCorrugated || 'E-FLUTE'}
              options={[
                { value: 'E-FLUTE', label: 'E-FLUTE' },
                { value: 'B-FLUTE', label: 'B-FLUTE' },
                { value: 'C-FLUTE', label: 'C-FLUTE' },
                { value: 'A-FLUTE', label: 'A-FLUTE' },
                { value: 'N/A', label: 'N/A' }
              ]}
            />
            
            <Input
              label="Substance"
              id="substance"
              defaultValue={selectedPrice?.substance || '150gsm'}
              placeholder="e.g., 150gsm"
            />
          </div>
          
          {selectedPrice && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-700">
                Current Margin: <span className={`font-bold ${getMarginColor(selectedPrice.margin)}`}>
                  {selectedPrice.margin}%
                </span>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}