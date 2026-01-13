// app/(protected)/orders/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'

const mockOrders = [
  {
    id: '1',
    order_code: 'TOK-2024-001',
    customer_name: 'MBR',
    brand: 'MBR',
    category: 'Duplek Medium Duplek',
    quantity: 1000,
    total_price: 4850000,
    status: 'completed',
    created_at: '2024-09-23',
    due_date: '2024-10-01',
    payment_status: 'paid',
    notes: 'Prioritas tinggi'
  },
  {
    id: '2',
    order_code: 'TOK-2024-002',
    customer_name: 'ABC Corp',
    brand: 'ABC',
    category: 'Kardus Karton',
    quantity: 500,
    total_price: 2500000,
    status: 'processing',
    created_at: '2024-09-24',
    due_date: '2024-10-05',
    payment_status: 'unpaid',
    notes: 'Butuh desain khusus'
  },
  {
    id: '3',
    order_code: 'TOK-2024-003',
    customer_name: 'XYZ Ltd',
    brand: 'XYZ',
    category: 'Plastik Packaging',
    quantity: 2000,
    total_price: 7500000,
    status: 'pending',
    created_at: '2024-09-25',
    due_date: '2024-10-10',
    payment_status: 'unpaid',
    notes: 'Bulk order'
  },
  {
    id: '4',
    order_code: 'TOK-2024-004',
    customer_name: 'PT Maju Jaya',
    brand: 'MJ',
    category: 'Corrugated Box',
    quantity: 1500,
    total_price: 6250000,
    status: 'shipped',
    created_at: '2024-09-20',
    due_date: '2024-09-30',
    payment_status: 'paid',
    notes: 'Sudah dikirim'
  },
  {
    id: '5',
    order_code: 'TOK-2024-005',
    customer_name: 'CV Sentosa',
    brand: 'SENTOSA',
    category: 'Folding Carton',
    quantity: 800,
    total_price: 3200000,
    status: 'cancelled',
    created_at: '2024-09-18',
    due_date: '2024-09-28',
    payment_status: 'refunded',
    notes: 'Dibatalkan customer'
  }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState(mockOrders)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_code?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.brand?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
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

  const getStatusVariant = (status) => {
    switch(status) {
      case 'completed': return 'success'
      case 'processing': return 'primary'
      case 'pending': return 'warning'
      case 'shipped': return 'info'
      case 'cancelled': return 'danger'
      default: return 'gray'
    }
  }

  const getPaymentStatusVariant = (status) => {
    switch(status) {
      case 'paid': return 'success'
      case 'unpaid': return 'danger'
      case 'refunded': return 'warning'
      default: return 'gray'
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const handleCreateOrder = () => {
    setIsCreateModalOpen(true)
  }

  const handleDeleteOrder = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
      setOrders(orders.filter(order => order.id !== id))
    }
  }

  const handleUpdateStatus = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data pesanan...</p>
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
              <CustomIcon icon="mdi:clipboard-list-outline" className="w-8 h-8" />
              Orders Management
            </h1>
            <p className="opacity-90 mt-1">Kelola dan lacak pesanan pelanggan</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:package-variant">
                Total: {orders.length} Orders
              </Badge>
              <Badge variant="success" icon="mdi:cash-check">
                Paid: {orders.filter(o => o.payment_status === 'paid').length}
              </Badge>
            </div>
          </div>
          <Button
            onClick={handleCreateOrder}
            variant="success"
            icon="mdi:plus"
            className="w-full md:w-auto"
          >
            New Order
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search orders by code, customer, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'processing', label: 'Processing' },
              { value: 'completed', label: 'Completed' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            className="w-full md:w-48"
          />
          <Button
            variant="outline"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
            }}
            icon="mdi:filter-remove"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} hoverable className="overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                    <CustomIcon icon="mdi:ticket-confirmation" />
                    {order.order_code}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge variant={getPaymentStatusVariant(order.payment_status)} size="sm">
                    {order.payment_status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{order.brand}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{order.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{order.quantity.toLocaleString()} pcs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="font-bold text-green-600">{formatCurrency(order.total_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className={`font-medium ${new Date(order.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(order.due_date)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <CustomIcon icon="mdi:note-text" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{order.notes}</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(order)}
                    icon="mdi:eye"
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => alert(`Edit order ${order.id}`)}
                    icon="mdi:pencil"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => alert(`Print order ${order.id}`)}
                    icon="mdi:printer"
                  >
                    Print
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteOrder(order.id)}
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

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <CustomIcon icon="mdi:package-variant-remove" className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
          <Button onClick={handleCreateOrder} variant="primary" icon="mdi:plus">
            Create New Order
          </Button>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredOrders.length}</span> of <span className="font-semibold">{orders.length}</span> orders
          </div>
          <div className="text-sm text-gray-600">
            Total Value: <span className="font-bold text-green-600">
              {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total_price, 0))}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon="mdi:export">
              Export
            </Button>
            <Button variant="outline" size="sm" icon="mdi:printer">
              Print List
            </Button>
          </div>
        </div>
      </Card>

      {/* View Order Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Order Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => alert('Edit order')}>
              Edit Order
            </Button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Order Code</h4>
                <p className="text-gray-900 font-semibold">{selectedOrder.order_code}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Order Status</h4>
                <Badge variant={getStatusVariant(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Customer</h4>
                <p className="text-gray-900">{selectedOrder.customer_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Brand</h4>
                <p className="text-gray-900">{selectedOrder.brand}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                <p className="text-gray-900">{selectedOrder.category}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Quantity</h4>
                <p className="text-gray-900">{selectedOrder.quantity.toLocaleString()} pcs</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Created Date</h4>
                <p className="text-gray-900">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Due Date</h4>
                <p className={`font-medium ${new Date(selectedOrder.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(selectedOrder.due_date)}
                </p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Price</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedOrder.total_price)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h4>
              <Badge variant={getPaymentStatusVariant(selectedOrder.payment_status)}>
                {selectedOrder.payment_status}
              </Badge>
            </div>

            {selectedOrder.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-700">{selectedOrder.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Order"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => alert('Order created')}>
              Create Order
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Customer Name *" placeholder="Enter customer name" />
            <Input label="Brand *" placeholder="Enter brand name" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category *"
              options={[
                { value: 'duplek', label: 'Duplek Medium Duplek' },
                { value: 'kardus', label: 'Kardus Karton' },
                { value: 'plastik', label: 'Plastik Packaging' },
                { value: 'corrugated', label: 'Corrugated Box' },
                { value: 'folding', label: 'Folding Carton' }
              ]}
            />
            <Input label="Quantity *" type="number" placeholder="Enter quantity" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Due Date *" type="date" />
            <Input label="Total Price" type="number" placeholder="Enter total price" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes or special instructions..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}