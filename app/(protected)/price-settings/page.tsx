'use client'

import { useState } from 'react'
import CustomIcon from '@/components/UI/Icon'

// Mock data
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
    status: 'active'
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
    status: 'active'
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
    status: 'inactive'
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
    status: 'active'
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
    status: 'active'
  }
]

export default function PriceSettingsPage() {
  const [priceSettings] = useState(mockPriceSettings)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const calculateMargin = (hargaJual: number, hargaModal: number) => {
    const margin = ((hargaJual - hargaModal) / hargaModal) * 100
    return margin.toFixed(1)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CustomIcon icon="mdi:currency-usd" className="mr-3" />
              Price Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure material prices, markups, and quantity breaks
            </p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <CustomIcon icon="mdi:plus" />
            Add Price Setting
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Margin</p>
              <p className="text-2xl font-bold text-green-600">
                {(() => {
                  const avgMargin = priceSettings.reduce((acc, item) => 
                    acc + parseFloat(calculateMargin(item.hargaJual, item.hargaModal)), 0) / priceSettings.length
                  return `${avgMargin.toFixed(1)}%`
                })()}
              </p>
            </div>
            <CustomIcon icon="mdi:chart-line" className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Active Items</p>
              <p className="text-2xl font-bold text-blue-600">
                {priceSettings.filter(item => item.status === 'active').length}
              </p>
            </div>
            <CustomIcon icon="mdi:check-circle" className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
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
        </div>
      </div>

      {/* Price Settings Table */}
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
              {priceSettings.map((item) => (
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.category === 'D+K' ? 'bg-blue-100 text-blue-800' :
                      item.category === 'DMD' ? 'bg-purple-100 text-purple-800' :
                      item.category === 'Premium' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(item.hargaModal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    {formatCurrency(item.hargaJual)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        parseFloat(calculateMargin(item.hargaJual, item.hargaModal)) > 50 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        {calculateMargin(item.hargaJual, item.hargaModal)}%
                      </span>
                      <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(100, parseFloat(calculateMargin(item.hargaJual, item.hargaModal)))}%` 
                          }}
                        ></div>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="Edit">
                        <CustomIcon icon="mdi:pencil" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="Duplicate">
                        <CustomIcon icon="mdi:content-copy" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="Delete">
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

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
          <CustomIcon icon="mdi:information" className="mr-2" />
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
      </div>
    </div>
  )
}