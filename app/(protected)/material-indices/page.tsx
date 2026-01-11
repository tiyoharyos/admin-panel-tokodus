'use client'

import { useState } from 'react'
import CustomIcon from '@/components/UI/Icon'

// Mock data
const mockMaterials = [
  {
    id: 1,
    type: 'Sheet',
    name: 'Kertas Kraft 120gsm',
    category: 'Paper',
    subCategory: 'Kraft',
    price: 5250,
    unit: 'sheet',
    supplier: 'PT Paperindo',
    minOrder: 1000,
    leadTime: 3,
    status: 'active'
  },
  {
    id: 2,
    type: 'Ink',
    name: 'Tinta Cyan Pantone 300C',
    category: 'Printing',
    subCategory: 'Pantone',
    price: 185000,
    unit: 'liter',
    supplier: 'CMYK Supplies',
    minOrder: 5,
    leadTime: 7,
    status: 'active'
  },
  {
    id: 3,
    type: 'Adhesive',
    name: 'Lem Kertas Water Based',
    category: 'Finishing',
    subCategory: 'Adhesive',
    price: 32500,
    unit: 'kg',
    supplier: 'Adhesive Corp',
    minOrder: 20,
    leadTime: 5,
    status: 'active'
  },
  {
    id: 4,
    type: 'Sheet',
    name: 'Duplek 250gsm',
    category: 'Paper',
    subCategory: 'Duplek',
    price: 8200,
    unit: 'sheet',
    supplier: 'PT Duplek Prima',
    minOrder: 500,
    leadTime: 4,
    status: 'inactive'
  },
  {
    id: 5,
    type: 'Coating',
    name: 'UV Coating Clear',
    category: 'Finishing',
    subCategory: 'Coating',
    price: 125000,
    unit: 'liter',
    supplier: 'Coating Masters',
    minOrder: 10,
    leadTime: 14,
    status: 'active'
  },
  {
    id: 6,
    type: 'Sheet',
    name: 'Art Carton 260gsm',
    category: 'Paper',
    subCategory: 'Art Paper',
    price: 9500,
    unit: 'sheet',
    supplier: 'Art Paper Co',
    minOrder: 300,
    leadTime: 5,
    status: 'active'
  }
]

export default function MaterialIndicesPage() {
  const [materials] = useState(mockMaterials)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState('grid')

  const categories = ['All', 'Paper', 'Printing', 'Finishing']

  const filteredMaterials = materials.filter(material => 
    selectedCategory === 'All' || material.category === selectedCategory
  )

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Sheet': return 'mdi:paper'
      case 'Ink': return 'mdi:water'
      case 'Adhesive': return 'mdi:tube'
      case 'Coating': return 'mdi:spray'
      default: return 'mdi:package-variant'
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CustomIcon icon="mdi:database" className="mr-3" />
              Material Indices
            </h1>
            <p className="text-gray-600 mt-2">
              Manage raw material specifications, prices, and suppliers
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <CustomIcon icon={viewMode === 'grid' ? 'mdi:view-list' : 'mdi:view-grid'} />
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <CustomIcon icon="mdi:plus" />
              Add Material
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="text-gray-600">
              <span className="font-medium">{filteredMaterials.length}</span> of {materials.length} materials
            </div>
            <div className="flex items-center gap-2">
              <CustomIcon icon="mdi:filter" className="text-gray-400" />
              <span>Filtered by: {selectedCategory}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Materials Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    material.category === 'Paper' ? 'bg-yellow-100 text-yellow-800' :
                    material.category === 'Printing' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {material.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2">
                    {material.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {material.subCategory} • {material.type}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  material.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <CustomIcon icon={getTypeIcon(material.type)} className="w-6 h-6" />
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-bold text-green-600">{formatCurrency(material.price)}/{material.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Supplier:</span>
                  <span className="font-medium">{material.supplier}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Min Order:</span>
                  <span className="font-medium">{material.minOrder.toLocaleString()} {material.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lead Time:</span>
                  <span className="font-medium">{material.leadTime} days</span>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <span className={`text-xs px-2 py-1 rounded ${
                  material.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {material.status === 'active' ? '● Active' : '○ Inactive'}
                </span>
                <div className="flex gap-2">
                  <button className="p-1 text-blue-600 hover:text-blue-800">
                    <CustomIcon icon="mdi:pencil" />
                  </button>
                  <button className="p-1 text-red-600 hover:text-red-800">
                    <CustomIcon icon="mdi:delete" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
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
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Time
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
                          material.category === 'Paper' ? 'bg-yellow-100' :
                          material.category === 'Printing' ? 'bg-blue-100' :
                          'bg-green-100'
                        }`}>
                          <CustomIcon icon={getTypeIcon(material.type)} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {material.type} • {material.subCategory}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        material.category === 'Paper' ? 'bg-yellow-100 text-yellow-800' :
                        material.category === 'Printing' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(material.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CustomIcon icon="mdi:clock-outline" className="mr-1 text-gray-400" />
                        {material.leadTime} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        material.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {material.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <CustomIcon icon="mdi:pencil" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <CustomIcon icon="mdi:delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
          <CustomIcon icon="mdi:information" className="mr-2" />
          Material Management Guidelines
        </h3>
        <p className="text-blue-700 mb-3">
          Material indices are crucial for accurate cost calculations. Keep prices updated and maintain proper categorization for efficient inventory management.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-600">
          <div>
            <span className="font-medium">Best Practices:</span>
            <ul className="mt-1 space-y-1">
              <li>• Update prices monthly based on supplier quotes</li>
              <li>• Maintain minimum order quantity records</li>
              <li>• Track lead times for production planning</li>
              <li>• Review inactive materials quarterly</li>
            </ul>
          </div>
          <div>
            <span className="font-medium">Categories:</span>
            <ul className="mt-1 space-y-1">
              <li>• Paper: Raw materials like kraft, duplek, art paper</li>
              <li>• Printing: Inks, plates, and printing supplies</li>
              <li>• Finishing: Adhesives, coatings, and finishing materials</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}