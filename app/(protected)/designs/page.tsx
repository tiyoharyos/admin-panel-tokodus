// app/(protected)/designs/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'

const mockDesigns = [
  {
    id: '1',
    name: 'Design Packaging A',
    orderId: 'ORD-001',
    materialType: 'Duplek + Kraft',
    panjangBahan: 1200,
    lebarBahan: 800,
    ukuranDuplek: '1000x600',
    status: 'approved',
    createdAt: '2024-09-23',
    category: 'Mailer Box',
    complexity: 'Medium',
    revision: 1
  },
  {
    id: '2',
    name: 'Brand B Packaging',
    orderId: 'ORD-002',
    materialType: 'Corrugated Single',
    panjangBahan: 1500,
    lebarBahan: 1000,
    ukuranDuplek: '1300x800',
    status: 'draft',
    createdAt: '2024-09-24',
    category: 'Shoe Box',
    complexity: 'High',
    revision: 3
  },
  {
    id: '3',
    name: 'Product C Box Design',
    orderId: 'ORD-003',
    materialType: 'Sheet Kraft',
    panjangBahan: 1000,
    lebarBahan: 700,
    ukuranDuplek: '900x500',
    status: 'review',
    createdAt: '2024-09-25',
    category: 'Food Box',
    complexity: 'Low',
    revision: 0
  },
  {
    id: '4',
    name: 'Premium Packaging D',
    orderId: 'ORD-004',
    materialType: 'White Top Kraft',
    panjangBahan: 1400,
    lebarBahan: 900,
    ukuranDuplek: '1200x700',
    status: 'rejected',
    createdAt: '2024-09-20',
    category: 'Premium Box',
    complexity: 'High',
    revision: 2
  },
  {
    id: '5',
    name: 'Retail Box E',
    orderId: 'ORD-005',
    materialType: 'Duplek Medium Duplek',
    panjangBahan: 1100,
    lebarBahan: 750,
    ukuranDuplek: '1000x600',
    status: 'approved',
    createdAt: '2024-09-22',
    category: 'Retail Box',
    complexity: 'Medium',
    revision: 1
  }
]

export default function DesignsPage() {
  const [designs, setDesigns] = useState(mockDesigns)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = 
      design.name.toLowerCase().includes(search.toLowerCase()) ||
      design.orderId.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || design.status === statusFilter
    const matchesMaterial = materialFilter === 'all' || design.materialType === materialFilter
    
    return matchesSearch && matchesStatus && matchesMaterial
  })

  const getStatusVariant = (status) => {
    switch(status) {
      case 'approved': return 'success'
      case 'draft': return 'warning'
      case 'review': return 'info'
      case 'rejected': return 'danger'
      default: return 'gray'
    }
  }

  const getComplexityVariant = (complexity) => {
    switch(complexity) {
      case 'Low': return 'success'
      case 'Medium': return 'warning'
      case 'High': return 'danger'
      default: return 'gray'
    }
  }

  const handleViewDetails = (design) => {
    setSelectedDesign(design)
    setIsViewModalOpen(true)
  }

  const handleCreateDesign = () => {
    setIsCreateModalOpen(true)
  }

  const handleApproveDesign = (id) => {
    setDesigns(designs.map(design => 
      design.id === id ? { ...design, status: 'approved' } : design
    ))
  }

  const handleRejectDesign = (id) => {
    setDesigns(designs.map(design => 
      design.id === id ? { ...design, status: 'rejected' } : design
    ))
  }

  const handleDeleteDesign = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus desain ini?')) {
      setDesigns(designs.filter(design => design.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data desain...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CustomIcon icon="mdi:draw" className="w-8 h-8" />
              Design Management
            </h1>
            <p className="opacity-90 mt-1">Manage and review design inputs for production</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:file-document">
                Total: {designs.length} Designs
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                Approved: {designs.filter(d => d.status === 'approved').length}
              </Badge>
            </div>
          </div>
          <Button
            onClick={handleCreateDesign}
            variant="success"
            icon="mdi:plus"
            className="w-full md:w-auto"
          >
            Create New Design
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search designs by name or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'review', label: 'In Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]}
          />
          <Select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Materials' },
              { value: 'Duplek + Kraft', label: 'Duplek + Kraft' },
              { value: 'Duplek Medium Duplek', label: 'Duplek Medium Duplek' },
              { value: 'Sheet Kraft', label: 'Sheet Kraft' },
              { value: 'White Top Kraft', label: 'White Top Kraft' },
              { value: 'Corrugated Single', label: 'Corrugated Single' }
            ]}
          />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          <div className="text-sm text-gray-600">
            {filteredDesigns.length} designs found
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setMaterialFilter('all')
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

      {/* Designs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDesigns.map((design) => (
          <Card key={design.id} hoverable className="overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge variant={getStatusVariant(design.status)}>
                    {design.status}
                  </Badge>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2">
                    {design.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Order: {design.orderId} • {formatDate(design.createdAt)}
                  </p>
                </div>
                <Badge variant={getComplexityVariant(design.complexity)}>
                  {design.complexity}
                </Badge>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <CustomIcon icon="mdi:package-variant" className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm text-gray-600">Material:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {design.materialType}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CustomIcon icon="mdi:ruler" className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {design.panjangBahan} × {design.lebarBahan} mm
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CustomIcon icon="mdi:layers" className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm text-gray-600">Duplek:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {design.ukuranDuplek}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CustomIcon icon="mdi:shape" className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {design.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CustomIcon icon="mdi:history" className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <span className="text-sm text-gray-600">Revisions:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {design.revision} revision(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetails(design)}
                  icon="mdi:eye"
                  fullWidth
                >
                  View Details
                </Button>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  {design.status === 'draft' || design.status === 'review' ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveDesign(design.id)}
                        icon="mdi:check"
                        className="text-green-600 hover:text-green-700"
                        fullWidth
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectDesign(design.id)}
                        icon="mdi:close"
                        className="text-red-600 hover:text-red-700"
                        fullWidth
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => alert(`Edit design ${design.id}`)}
                      icon="mdi:pencil"
                      fullWidth
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDesigns.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <CustomIcon icon="mdi:file-document-outline" className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Designs Found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
          <Button onClick={handleCreateDesign} variant="primary" icon="mdi:plus">
            Create New Design
          </Button>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredDesigns.length}</span> of <span className="font-semibold">{designs.length}</span> designs
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" size="sm">
              Approved: {designs.filter(d => d.status === 'approved').length}
            </Badge>
            <Badge variant="warning" size="sm">
              Draft: {designs.filter(d => d.status === 'draft').length}
            </Badge>
            <Badge variant="info" size="sm">
              Review: {designs.filter(d => d.status === 'review').length}
            </Badge>
            <Badge variant="danger" size="sm">
              Rejected: {designs.filter(d => d.status === 'rejected').length}
            </Badge>
          </div>
        </div>
      </Card>

      {/* View Design Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Design Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => alert('Edit design')}>
              Edit Design
            </Button>
          </div>
        }
      >
        {selectedDesign && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedDesign.name}</h3>
                <p className="text-sm text-gray-500">Order: {selectedDesign.orderId}</p>
              </div>
              <Badge variant={getStatusVariant(selectedDesign.status)}>
                {selectedDesign.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Material Type</h4>
                <p className="text-gray-900">{selectedDesign.materialType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                <p className="text-gray-900">{selectedDesign.category}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Size</h4>
                <p className="text-gray-900">{selectedDesign.panjangBahan} × {selectedDesign.lebarBahan} mm</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Duplek Size</h4>
                <p className="text-gray-900">{selectedDesign.ukuranDuplek}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Complexity</h4>
                <Badge variant={getComplexityVariant(selectedDesign.complexity)}>
                  {selectedDesign.complexity}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Revisions</h4>
                <p className="text-gray-900">{selectedDesign.revision} revision(s)</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Created At</h4>
                <p className="text-gray-900">{formatDate(selectedDesign.createdAt)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                <p className="text-gray-900">{formatDate(selectedDesign.updatedAt || selectedDesign.createdAt)}</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                <CustomIcon icon="mdi:information" />
                Design Information
              </h4>
              <p className="text-sm text-blue-700">
                This design is ready for production. Please ensure all specifications are correct before proceeding.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Design Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Design"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => alert('Design created')}>
              Create Design
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Design Name *"
            placeholder="Enter design name"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Order ID *"
              placeholder="Enter order ID"
            />
            <Select
              label="Category *"
              options={[
                { value: 'mailer', label: 'Mailer Box' },
                { value: 'shoe', label: 'Shoe Box' },
                { value: 'food', label: 'Food Box' },
                { value: 'premium', label: 'Premium Box' },
                { value: 'retail', label: 'Retail Box' }
              ]}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Material Type *"
              options={[
                { value: 'duplek_kraft', label: 'Duplek + Kraft' },
                { value: 'duplek_medium', label: 'Duplek Medium Duplek' },
                { value: 'sheet_kraft', label: 'Sheet Kraft' },
                { value: 'white_top', label: 'White Top Kraft' },
                { value: 'corrugated', label: 'Corrugated Single' }
              ]}
            />
            <Select
              label="Complexity Level"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Panjang Bahan (mm) *"
              type="number"
              placeholder="Enter length"
            />
            <Input
              label="Lebar Bahan (mm) *"
              type="number"
              placeholder="Enter width"
            />
          </div>
          
          <Input
            label="Ukuran Duplek"
            placeholder="e.g., 1000x600"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add design description or notes..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Helper function
function formatDate(dateString) {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}