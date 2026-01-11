'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Mock data (akan diganti dengan API nanti)
const mockDesignInputs = [
  {
    id: '1',
    name: 'Design Packaging A',
    orderId: 'ORD-001',
    materialType: 'Duplek + Kraft',
    panjangBahan: 1200,
    lebarBahan: 800,
    ukuranDuplek: '1000x600',
    status: 'approved',
    createdAt: '2024-09-23'
  },
]

const mockOrders = [
  { id: 'ORD-001', orderCode: 'TOK-2024-001', customerName: 'MBR', brand: 'MBR' },
  { id: 'ORD-002', orderCode: 'TOK-2024-002', customerName: 'ABC Corp', brand: 'ABC' }
]

const mockMachineLayouts = [
  { id: '1', designInputId: '1', machineId: 'MACH-001', machineName: 'Machine 1' }
]

export default function DesignsPage() {
  const [designs, setDesigns] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMaterial, setFilterMaterial] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  useEffect(() => {
    // Apply filters
    let filtered = [...mockDesignInputs]
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(design => design.status === filterStatus)
    }
    
    if (filterMaterial !== 'all') {
      filtered = filtered.filter(design => design.materialType === filterMaterial)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(design => 
        design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        design.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setDesigns(filtered)
  }, [filterStatus, filterMaterial, searchTerm])

  const getStatusVariant = (status) => {
    switch (status) {
      case 'approved': return 'success'
      case 'draft': return 'warning'
      case 'rejected': return 'danger'
      default: return 'default'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateNewDesign = () => {
    console.log('Creating new design')
    setIsCreateModalOpen(true)
  }

  const handleViewDetails = (design) => {
    setSelectedDesign(design)
    setIsViewModalOpen(true)
  }

  const handleApproveDesign = (designId) => {
    console.log('Approving design:', designId)
  }

  const handleRejectDesign = (designId) => {
    console.log('Rejecting design:', designId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Design Management</h1>
            <p className="opacity-90 mt-1">Manage and review design inputs for production</p>
          </div>
          <button
            onClick={handleCreateNewDesign}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Design
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Materials</option>
            <option value="Duplek + Kraft">Duplek + Kraft</option>
            <option value="Duplek Medium Duplek">Duplek Medium Duplek</option>
            <option value="Sheet Kraft">Sheet Kraft</option>
          </select>
          
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            {designs.length} designs found
          </div>
          <button
            onClick={() => {
              setFilterStatus('all')
              setFilterMaterial('all')
              setSearchTerm('')
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Designs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design) => {
          const order = mockOrders.find(o => o.id === design.orderId)
          const layout = mockMachineLayouts.find(l => l.designInputId === design.id)
          
          return (
            <div key={design.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{design.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Order: {design.orderId}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(design.status)}`}>
                    {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">Material:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {design.materialType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">Size:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {design.panjangBahan} × {design.lebarBahan} mm
                      </span>
                    </div>
                  </div>
                  
                  {design.ukuranDuplek && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <div className="flex-1">
                        <span className="text-sm text-gray-600">Duplek:</span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {design.ukuranDuplek}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {layout && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1">
                        <span className="text-sm text-gray-600">Machine:</span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {layout.machineId}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium text-gray-900">{design.createdAt}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                  <button
                    onClick={() => handleViewDetails(design)}
                    className="w-full md:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View Details
                  </button>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {design.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleApproveDesign(design.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectDesign(design.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </>
                    )}
                    <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {designs.length === 0 && (
        <div className="bg-white rounded-xl shadow text-center py-12">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No designs found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Try adjusting your search or filter to find what you're looking for.
          </p>
          <button
            onClick={handleCreateNewDesign}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Design
          </button>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedDesign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Design Details</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Design Name</h4>
                  <p className="text-gray-900">{selectedDesign.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Order ID</h4>
                  <p className="text-gray-900">{selectedDesign.orderId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Material Type</h4>
                  <p className="text-gray-900">{selectedDesign.materialType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Size</h4>
                  <p className="text-gray-900">{selectedDesign.panjangBahan} × {selectedDesign.lebarBahan} mm</p>
                </div>
              </div>
              
              {selectedDesign.ukuranDuplek && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Duplek Size</h4>
                  <p className="text-gray-900">{selectedDesign.ukuranDuplek}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Created At</h4>
                <p className="text-gray-900">{selectedDesign.createdAt}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDesign.status)}`}>
                  {selectedDesign.status.charAt(0).toUpperCase() + selectedDesign.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}