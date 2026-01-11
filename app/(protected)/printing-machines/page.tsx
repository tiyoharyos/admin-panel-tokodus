'use client'

import { useState } from 'react'
import CustomIcon from '@/components/UI/Icon'

// Mock data
const mockPrintingMachines = [
  {
    id: 1,
    name: 'Heidelberg Speedmaster XL 106',
    type: 'Offset',
    maxSheetSize: '1060x750mm',
    maxSpeed: 18000,
    colorUnits: 6,
    status: 'active',
    maintenanceDue: '2024-03-15',
    hourlyRate: 850000
  },
  {
    id: 2,
    name: 'Konica Minolta AccurioPress C14000',
    type: 'Digital',
    maxSheetSize: '470x364mm',
    maxSpeed: 140,
    colorUnits: 4,
    status: 'active',
    maintenanceDue: '2024-02-28',
    hourlyRate: 450000
  },
  {
    id: 3,
    name: 'Roland VersaUV LEC2-640',
    type: 'UV Flatbed',
    maxSheetSize: '1600x2500mm',
    maxSpeed: 25,
    colorUnits: 6,
    status: 'maintenance',
    maintenanceDue: '2024-01-20',
    hourlyRate: 650000
  },
  {
    id: 4,
    name: 'Epson SureColor S80600',
    type: 'Inkjet',
    maxSheetSize: '1626mm Roll',
    maxSpeed: 25,
    colorUnits: 8,
    status: 'active',
    maintenanceDue: '2024-04-10',
    hourlyRate: 350000
  },
  {
    id: 5,
    name: 'Mitsubishi Diamond 3000LX',
    type: 'Offset',
    maxSheetSize: '720x1040mm',
    maxSpeed: 16000,
    colorUnits: 5,
    status: 'inactive',
    maintenanceDue: '2024-03-01',
    hourlyRate: 750000
  }
]

export default function PrintingMachinesPage() {
  const [machines] = useState(mockPrintingMachines)
  const [selectedType, setSelectedType] = useState('All')

  const machineTypes = ['All', 'Offset', 'Digital', 'UV Flatbed', 'Inkjet']

  const filteredMachines = machines.filter(machine => 
    selectedType === 'All' || machine.type === selectedType
  )

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return 'mdi:check-circle'
      case 'maintenance': return 'mdi:wrench'
      case 'inactive': return 'mdi:close-circle'
      default: return 'mdi:help-circle'
    }
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}/hour`
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CustomIcon icon="mdi:printer" className="mr-3" />
              Printing Machines
            </h1>
            <p className="text-gray-600 mt-2">
              Configure printing equipment, rates, and maintenance schedules
            </p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <CustomIcon icon="mdi:plus" />
            Add Machine
          </button>
        </div>
      </div>

      {/* Machine Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Machines</p>
              <p className="text-2xl font-bold text-gray-900">{machines.length}</p>
            </div>
            <CustomIcon icon="mdi:printer" className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Machines</p>
              <p className="text-2xl font-bold text-green-600">
                {machines.filter(m => m.status === 'active').length}
              </p>
            </div>
            <CustomIcon icon="mdi:check-circle" className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Hourly Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {(() => {
                  const avgRate = machines.reduce((acc, m) => acc + m.hourlyRate, 0) / machines.length
                  return `Rp ${Math.round(avgRate / 1000)}k`
                })()}
              </p>
            </div>
            <CustomIcon icon="mdi:currency-usd" className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Due Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {machines.filter(m => m.status === 'maintenance').length}
              </p>
            </div>
            <CustomIcon icon="mdi:alert-circle" className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-3">
          {machineTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredMachines.map((machine) => (
          <div key={machine.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Machine Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(machine.status)}`}>
                    <CustomIcon icon={getStatusIcon(machine.status)} className="inline mr-1" />
                    {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2">
                    {machine.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {machine.type} Printing
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CustomIcon icon="mdi:printer" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Machine Specifications */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Max Sheet Size</p>
                    <p className="text-sm font-medium text-gray-900">{machine.maxSheetSize}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max Speed</p>
                    <p className="text-sm font-medium text-gray-900">
                      {machine.type === 'Digital' || machine.type === 'Inkjet' || machine.type === 'UV Flatbed' 
                        ? `${machine.maxSpeed} m²/hour` 
                        : `${machine.maxSpeed.toLocaleString()} sph`}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Color Units</p>
                    <p className="text-sm font-medium text-gray-900">{machine.colorUnits} colors</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hourly Rate</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(machine.hourlyRate)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Maintenance Due</p>
                  <div className="flex items-center mt-1">
                    <CustomIcon icon="mdi:calendar-clock" className="w-4 h-4 text-gray-400 mr-2" />
                    <span className={`text-sm font-medium ${
                      machine.status === 'maintenance' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {machine.maintenanceDue}
                    </span>
                    {machine.status === 'maintenance' && (
                      <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">OVERDUE</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Machine Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1">
                    <CustomIcon icon="mdi:pencil" className="w-3 h-3" />
                    Edit
                  </button>
                  <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 flex items-center gap-1">
                    <CustomIcon icon="mdi:wrench" className="w-3 h-3" />
                    Maintenance
                  </button>
                </div>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1">
                  <CustomIcon icon="mdi:power" className="w-3 h-3" />
                  {machine.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMachines.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <CustomIcon icon="mdi:printer-off" className="w-16 h-16 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Machines Found</h3>
          <p className="mt-1 text-gray-500">No printing machines match the selected filter.</p>
          <button 
            onClick={() => setSelectedType('All')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View All Machines
          </button>
        </div>
      )}

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
          <CustomIcon icon="mdi:information" className="mr-2" />
          Printing Machine Management
        </h3>
        <p className="text-blue-700 mb-3">
          Printing machine settings affect production capacity and costing. Regular maintenance scheduling ensures optimal performance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-600">
          <div>
            <span className="font-medium">Machine Types:</span>
            <ul className="mt-1 space-y-1">
              <li>• Offset: High-volume, large format printing</li>
              <li>• Digital: Short-run, variable data printing</li>
              <li>• UV Flatbed: Rigid material printing</li>
              <li>• Inkjet: Large format roll-to-roll printing</li>
            </ul>
          </div>
          <div>
            <span className="font-medium">Maintenance Schedule:</span>
            <ul className="mt-1 space-y-1">
              <li>• Monthly: Cleaning and calibration</li>
              <li>• Quarterly: Parts inspection and replacement</li>
              <li>• Annually: Major overhaul and upgrades</li>
              <li>• As needed: Based on usage hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}