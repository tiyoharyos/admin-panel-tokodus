// app/(protected)/materials/page.jsx
'use client'

import { useState } from 'react'
// import axios from '../../lib/axios'

// Mock data (akan diganti dengan API nanti)
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
    minStock: 100
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
    minStock: 50
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
    minStock: 20
  },
]

export default function MaterialsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [materials, setMaterials] = useState(mockMaterials)

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.name.toLowerCase().includes(search.toLowerCase()) ||
      material.supplier.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === 'all' || material.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const handleEdit = (material) => {
    setEditingMaterial({ ...material })
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingMaterial(null)
    setIsFormOpen(true)
  }

  const getStockColor = (stock, minStock) => {
    if (stock < minStock) return 'text-red-600'
    if (stock < minStock * 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      setMaterials(materials.filter(material => material.id !== id))
      alert('Material deleted successfully!')
    }
  }

  const handleSaveMaterial = (materialData) => {
    if (editingMaterial) {
      // Update existing material
      setMaterials(materials.map(m => 
        m.id === editingMaterial.id ? { ...materialData, id: editingMaterial.id } : m
      ))
      alert('Material updated successfully!')
    } else {
      // Add new material
      const newMaterial = {
        ...materialData,
        id: `MAT${Date.now()}`
      }
      setMaterials([...materials, newMaterial])
      alert('Material added successfully!')
    }
    setIsFormOpen(false)
    setEditingMaterial(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials Inventory</h1>
          <p className="text-gray-600">Manage raw materials and stock levels</p>
          <p className="text-sm text-gray-500 mt-1">
            Total: {materials.length} materials • {materials.filter(m => m.stock < m.minStock).length} low stock
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or supplier..."
                className="text-gray-700 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="Duplek">Duplek</option>
            <option value="Kraft">Kraft</option>
            <option value="Sheet">Sheet</option>
            <option value="Medium">Medium</option>
          </select>
          <button
            onClick={() => {
              setSearch('')
              setTypeFilter('all')
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
                  <p className="text-sm text-gray-500">{material.type} • {material.substance}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockColor(material.stock, material.minStock)}`}>
                    {material.stock} {material.unit}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Min: {material.minStock}</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Flute: {material.fluteType}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span>Gramasi: {material.gramasi} GSM</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>Size: {material.ukuran}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Supplier: {material.supplier}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    Rp {material.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">per {material.unit}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(material)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(material.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <div className="bg-white rounded-xl shadow text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter</p>
          <button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700"
          >
            Add Your First Material
          </button>
        </div>
      )}

      {/* Material Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Name *
                </label>
                <input
                  type="text"
                  defaultValue={editingMaterial?.name || ''}
                  id="materialName"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Duplek 250GSM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  defaultValue={editingMaterial?.type || ''}
                  id="materialType"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="Duplek">Duplek</option>
                  <option value="Kraft">Kraft</option>
                  <option value="Sheet">Sheet</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock *
                  </label>
                  <input
                    type="number"
                    defaultValue={editingMaterial?.stock || 0}
                    id="materialStock"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <select
                    defaultValue={editingMaterial?.unit || 'sheet'}
                    id="materialUnit"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="sheet">Sheet</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="roll">Roll</option>
                    <option value="liter">Liter</option>
                    <option value="pcs">Pieces</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock *
                </label>
                <input
                  type="number"
                  defaultValue={editingMaterial?.minStock || 10}
                  id="materialMinStock"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Unit *
                </label>
                <input
                  type="number"
                  defaultValue={editingMaterial?.price || 0}
                  id="materialPrice"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  defaultValue={editingMaterial?.supplier || ''}
                  id="materialSupplier"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Supplier name"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingMaterial(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const formData = {
                    name: document.getElementById('materialName').value,
                    type: document.getElementById('materialType').value,
                    stock: parseInt(document.getElementById('materialStock').value),
                    unit: document.getElementById('materialUnit').value,
                    minStock: parseInt(document.getElementById('materialMinStock').value),
                    price: parseInt(document.getElementById('materialPrice').value),
                    supplier: document.getElementById('materialSupplier').value,
                    // Default values for other fields
                    substance: 'Paper',
                    fluteType: 'E-Flute',
                    gramasi: '250',
                    ukuran: '1000x1200'
                  }
                  handleSaveMaterial(formData)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingMaterial ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredMaterials.length}</span> of <span className="font-semibold">{materials.length}</span> materials
          </div>
          <div className="text-sm text-gray-600">
            Low stock items: <span className="font-bold text-red-600">
              {materials.filter(m => m.stock < m.minStock).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}