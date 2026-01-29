// app/(protected)/materials/page.jsx
'use client'

import { useState } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'

const mockMaterials = [
  {
    id: '1',
    name: 'Duplek 250GSM',
    stock: 45,
    unit: 'sheet',
    type: 'Duplek',
    substance: 'Paper',
    fluteType: 'E-Flute',
    gramasi: '250',
    ukuran: '1000x1200',
    supplier: 'PT Supplier A',
    price: 15000,
    minStock: 100,
    status: 'active',
    category: 'Paper'
  },
  {
    id: '2',
    name: 'Kraft Medium',
    stock: 85,
    unit: 'sheet',
    type: 'Kraft',
    substance: 'Paper',
    fluteType: 'B-Flute',
    gramasi: '180',
    ukuran: '800x1100',
    supplier: 'CV Supplier B',
    price: 12000,
    minStock: 50,
    status: 'active',
    category: 'Paper'
  },
  {
    id: '3',
    name: 'Sheet Kraft 300GSM',
    stock: 12,
    unit: 'sheet',
    type: 'Sheet',
    substance: 'Kraft',
    fluteType: 'A-Flute',
    gramasi: '300',
    ukuran: '700x1000',
    supplier: 'UD Supplier C',
    price: 25000,
    minStock: 20,
    status: 'active',
    category: 'Paper'
  },
  {
    id: '4',
    name: 'Tinta Cyan Pantone 300C',
    stock: 8,
    unit: 'liter',
    type: 'Ink',
    substance: 'Printing',
    fluteType: 'N/A',
    gramasi: 'N/A',
    ukuran: 'N/A',
    supplier: 'CMYK Supplies',
    price: 185000,
    minStock: 5,
    status: 'active',
    category: 'Printing'
  },
  {
    id: '5',
    name: 'Lem Kertas Water Based',
    stock: 25,
    unit: 'kg',
    type: 'Adhesive',
    substance: 'Finishing',
    fluteType: 'N/A',
    gramasi: 'N/A',
    ukuran: 'N/A',
    supplier: 'Adhesive Corp',
    price: 32500,
    minStock: 10,
    status: 'low',
    category: 'Finishing'
  },
  {
    id: '6',
    name: 'UV Coating Clear',
    stock: 3,
    unit: 'liter',
    type: 'Coating',
    substance: 'Finishing',
    fluteType: 'N/A',
    gramasi: 'N/A',
    ukuran: 'N/A',
    supplier: 'Coating Masters',
    price: 125000,
    minStock: 5,
    status: 'low',
    category: 'Finishing'
  }
]

export default function MaterialsPage() {
  const [materials, setMaterials] = useState(mockMaterials)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.name.toLowerCase().includes(search.toLowerCase()) ||
      material.supplier.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === 'all' || material.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter
    
    return matchesSearch && matchesType && matchesCategory
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStockColor = (stock, minStock) => {
    if (stock < minStock) return 'text-red-600 bg-red-50'
    if (stock < minStock * 1.5) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getStatusVariant = (status) => {
    switch(status) {
      case 'active': return 'success'
      case 'low': return 'danger'
      case 'inactive': return 'gray'
      default: return 'warning'
    }
  }

  const getCategoryVariant = (category) => {
    switch(category) {
      case 'Paper': return 'primary'
      case 'Printing': return 'info'
      case 'Finishing': return 'warning'
      default: return 'gray'
    }
  }

  const handleEdit = (material) => {
    setEditingMaterial({ ...material })
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingMaterial(null)
    setIsFormOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      setMaterials(materials.filter(material => material.id !== id))
    }
  }

  const handleSaveMaterial = (materialData) => {
    if (editingMaterial) {
      setMaterials(materials.map(m => 
        m.id === editingMaterial.id ? { ...materialData, id: editingMaterial.id } : m
      ))
    } else {
      const newMaterial = {
        ...materialData,
        id: `MAT${Date.now()}`,
        status: materialData.stock < materialData.minStock ? 'low' : 'active'
      }
      setMaterials([...materials, newMaterial])
    }
    setIsFormOpen(false)
    setEditingMaterial(null)
  }

  const handleReorder = (id) => {
    const material = materials.find(m => m.id === id)
    if (material) {
      const newStock = material.stock + material.minStock * 2
      setMaterials(materials.map(m => 
        m.id === id ? { ...m, stock: newStock, status: 'active' } : m
      ))
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:package-variant-closed" className="w-8 h-8" />
              Materials Inventory
            </h1>
            <p className="opacity-90 mt-1">Manage raw materials and stock levels</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:package-variant">
                Total: {materials.length} Materials
              </Badge>
              <Badge variant="danger" icon="mdi:alert">
                Low Stock: {materials.filter(m => m.status === 'low').length}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 border-white/20"
              icon={viewMode === 'grid' ? 'mdi:view-list' : 'mdi:view-grid'}
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </Button>
            <Button
              onClick={handleAddNew}
              variant="success"
              icon="mdi:plus"
            >
              Add Material
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search by material name or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'Duplek', label: 'Duplek' },
              { value: 'Kraft', label: 'Kraft' },
              { value: 'Sheet', label: 'Sheet' },
              { value: 'Ink', label: 'Ink' },
              { value: 'Adhesive', label: 'Adhesive' },
              { value: 'Coating', label: 'Coating' }
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'Paper', label: 'Paper' },
              { value: 'Printing', label: 'Printing' },
              { value: 'Finishing', label: 'Finishing' }
            ]}
          />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          <div className="text-sm text-gray-600">
            {filteredMaterials.length} materials found
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setTypeFilter('all')
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

      {/* Materials Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} hoverable className="overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant={getCategoryVariant(material.category)}>
                      {material.category}
                    </Badge>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">
                      {material.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {material.type} • {material.substance}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    material.category === 'Paper' ? 'bg-blue-100' :
                    material.category === 'Printing' ? 'bg-indigo-100' :
                    'bg-orange-100'
                  }`}>
                    <CustomIcon 
                      icon={
                        material.type === 'Duplek' || material.type === 'Kraft' || material.type === 'Sheet' ? 'mdi:paper' :
                        material.type === 'Ink' ? 'mdi:water' :
                        material.type === 'Adhesive' ? 'mdi:tube' :
                        'mdi:spray'
                      } 
                      className="w-5 h-5 text-gray-600"
                    />
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-bold ${getStockColor(material.stock, material.minStock)} px-2 py-1 rounded`}>
                      {material.stock} {material.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Min Stock:</span>
                    <span className="text-gray-400">{material.minStock} {material.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold text-green-600">{formatCurrency(material.price)}/{material.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="text-gray-400">{material.supplier}</span>
                  </div>
                  {material.fluteType !== 'N/A' && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Flute Type:</span>
                      <span className="text-gray-400">{material.fluteType}</span>
                    </div>
                  )}
                  {material.gramasi !== 'N/A' && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Gramasi:</span>
                      <span className="text-gray-400">{material.gramasi} GSM</span>
                    </div>
                  )}
                  {material.ukuran !== 'N/A' && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="text-gray-400">{material.ukuran}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(material)}
                      icon="mdi:pencil"
                    >
                      Edit
                    </Button>
                    {material.status === 'low' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(material.id)}
                        icon="mdi:cart-plus"
                        className="text-green-600 hover:text-green-700"
                      >
                        Reorder
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                    icon="mdi:delete"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
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
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
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
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          material.category === 'Paper' ? 'bg-blue-100' :
                          material.category === 'Printing' ? 'bg-indigo-100' :
                          'bg-orange-100'
                        }`}>
                          <CustomIcon 
                            icon={
                              material.type === 'Duplek' || material.type === 'Kraft' || material.type === 'Sheet' ? 'mdi:paper' :
                              material.type === 'Ink' ? 'mdi:water' :
                              material.type === 'Adhesive' ? 'mdi:tube' :
                              'mdi:spray'
                            } 
                            className="w-4 h-4 text-gray-600"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {material.type} • {material.gramasi !== 'N/A' ? material.gramasi + ' GSM' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getCategoryVariant(material.category)} size="sm">
                        {material.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`font-bold ${getStockColor(material.stock, material.minStock)}`}>
                          {material.stock} {material.unit}
                        </span>
                        <span className="text-xs text-gray-500">
                          Min: {material.minStock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(material.price)}/{material.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(material.status)} size="sm">
                        {material.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(material)}
                          icon="mdi:pencil"
                        />
                        {material.status === 'low' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReorder(material.id)}
                            icon="mdi:cart-plus"
                            className="text-green-600 hover:text-green-700"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(material.id)}
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
      )}

      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <CustomIcon icon="mdi:package-variant-remove" className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Materials Found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
          <Button onClick={handleAddNew} variant="primary" icon="mdi:plus">
            Add Your First Material
          </Button>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredMaterials.length}</span> of <span className="font-semibold">{materials.length}</span> materials
          </div>
          <div className="text-sm text-gray-600">
            Low stock items: <span className="font-bold text-red-600">
              {materials.filter(m => m.status === 'low').length}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon="mdi:printer">
              Print List
            </Button>
            <Button variant="outline" size="sm" icon="mdi:download">
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Material Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingMaterial ? 'Edit Material' : 'Add New Material'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handleSaveMaterial({
              name: document.getElementById('materialName').value,
              type: document.getElementById('materialType').value,
              category: document.getElementById('materialCategory').value,
              stock: parseInt(document.getElementById('materialStock').value),
              unit: document.getElementById('materialUnit').value,
              minStock: parseInt(document.getElementById('materialMinStock').value),
              price: parseInt(document.getElementById('materialPrice').value),
              supplier: document.getElementById('materialSupplier').value,
              substance: document.getElementById('materialSubstance').value,
              fluteType: document.getElementById('materialFluteType').value,
              gramasi: document.getElementById('materialGramasi').value,
              ukuran: document.getElementById('materialUkuran').value
            })}>
              {editingMaterial ? 'Update' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Name *
              </label>
              <input
                type="text"
                id="materialName"
                defaultValue={editingMaterial?.name || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Duplek 250GSM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                id="materialType"
                defaultValue={editingMaterial?.type || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Type</option>
                <option value="Duplek">Duplek</option>
                <option value="Kraft">Kraft</option>
                <option value="Sheet">Sheet</option>
                <option value="Ink">Ink</option>
                <option value="Adhesive">Adhesive</option>
                <option value="Coating">Coating</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="materialCategory"
                defaultValue={editingMaterial?.category || 'Paper'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Paper">Paper</option>
                <option value="Printing">Printing</option>
                <option value="Finishing">Finishing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Substance
              </label>
              <input
                type="text"
                id="materialSubstance"
                defaultValue={editingMaterial?.substance || 'Paper'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Paper, Kraft, etc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                id="materialStock"
                defaultValue={editingMaterial?.stock || 0}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                id="materialUnit"
                defaultValue={editingMaterial?.unit || 'sheet'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sheet">Sheet</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter</option>
                <option value="roll">Roll</option>
                <option value="pcs">Pieces</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock *
              </label>
              <input
                type="number"
                id="materialMinStock"
                defaultValue={editingMaterial?.minStock || 10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit *
              </label>
              <input
                type="number"
                id="materialPrice"
                defaultValue={editingMaterial?.price || 0}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <input
                type="text"
                id="materialSupplier"
                defaultValue={editingMaterial?.supplier || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Supplier name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flute Type
              </label>
              <input
                type="text"
                id="materialFluteType"
                defaultValue={editingMaterial?.fluteType || 'E-Flute'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="E-Flute, B-Flute, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gramasi
              </label>
              <input
                type="text"
                id="materialGramasi"
                defaultValue={editingMaterial?.gramasi || '250'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="250 GSM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <input
                type="text"
                id="materialUkuran"
                defaultValue={editingMaterial?.ukuran || '1000x1200'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1000x1200"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}