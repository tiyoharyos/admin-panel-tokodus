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
import SweetAlert from '@/components/UI/SweetAlert'
import { Table, TableRow, TableCell } from '@/components/UI/Table'

const mockOrders = [
  {
    id: 'TOK-001',
    order_code: 'TOK-2024-001',
    customer_name: 'PT Sinar Jaya',
    brand: 'Brand A',
    category: 'Kardus Box 20x20',
    quantity: 1000,
    total_price: 12500000,
    status: 'completed',
    created_at: '2024-01-15',
    due_date: '2024-01-20',
    payment_status: 'paid',
    notes: 'Prioritas tinggi'
  },
  {
    id: 'TOK-002',
    order_code: 'TOK-2024-002',
    customer_name: 'CV Maju Bersama',
    brand: 'Brand B',
    category: 'Paper Bag Premium',
    quantity: 500,
    total_price: 8500000,
    status: 'processing',
    created_at: '2024-01-14',
    due_date: '2024-01-18',
    payment_status: 'unpaid',
    notes: 'Butuh desain khusus'
  },
  {
    id: 'TOK-003',
    order_code: 'TOK-2024-003',
    customer_name: 'UD Berkah',
    brand: 'Brand C',
    category: 'Sticker Vinyl',
    quantity: 2000,
    total_price: 5500000,
    status: 'pending',
    created_at: '2024-01-14',
    due_date: '2024-01-17',
    payment_status: 'unpaid',
    notes: 'Bulk order'
  },
  {
    id: 'TOK-004',
    order_code: 'TOK-2024-004',
    customer_name: 'PT Maju Jaya',
    brand: 'MJ',
    category: 'Corrugated Box',
    quantity: 1500,
    total_price: 6250000,
    status: 'shipped',
    created_at: '2024-01-20',
    due_date: '2024-01-30',
    payment_status: 'paid',
    notes: 'Sudah dikirim'
  },
  {
    id: 'TOK-005',
    order_code: 'TOK-2024-005',
    customer_name: 'CV Sentosa',
    brand: 'SENTOSA',
    category: 'Folding Carton',
    quantity: 800,
    total_price: 3200000,
    status: 'cancelled',
    created_at: '2024-01-18',
    due_date: '2024-01-28',
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
  const [newOrderData, setNewOrderData] = useState({
    customer_name: '',
    brand: '',
    category: '',
    quantity: 1,
    status: 'pending',
    notes: ''
  })

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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return 'mdi:check-circle'
      case 'processing': return 'mdi:progress-clock'
      case 'pending': return 'mdi:clock-outline'
      case 'shipped': return 'mdi:truck-delivery'
      case 'cancelled': return 'mdi:cancel'
      default: return 'mdi:circle'
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

  const handleDeleteOrder = async (id) => {
    const result = await SweetAlert.confirm(
      'Delete Order',
      'Are you sure you want to delete this order? This action cannot be undone.'
    )
    
    if (result.isConfirmed) {
      try {
        setLoading(true)
        // Simulasi API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setOrders(orders.filter(order => order.id !== id))
        SweetAlert.success('Success!', 'Order has been deleted successfully.')
      } catch (error) {
        SweetAlert.error('Error!', 'Failed to delete order. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setLoading(true)
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ))
      
      SweetAlert.success('Success!', `Order status updated to ${newStatus}.`)
    } catch (error) {
      SweetAlert.error('Error!', 'Failed to update order status.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewOrderSubmit = async () => {
    try {
      // Validasi form
      if (!newOrderData.customer_name || !newOrderData.brand || !newOrderData.category) {
        SweetAlert.error('Error!', 'Please fill in all required fields.')
        return
      }

      setLoading(true)
      
      // Simulasi delay API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate new order data
      const newId = `TOK-00${orders.length + 1}`
      const newOrderCode = `TOK-2024-00${orders.length + 1}`
      
      const newOrder = {
        id: newId,
        order_code: newOrderCode,
        customer_name: newOrderData.customer_name,
        brand: newOrderData.brand,
        category: newOrderData.category,
        quantity: parseInt(newOrderData.quantity),
        status: newOrderData.status,
        total_price: calculatePrice(newOrderData.category, newOrderData.quantity),
        created_at: new Date().toISOString().split('T')[0],
        due_date: getDueDate(),
        payment_status: 'unpaid',
        notes: newOrderData.notes
      }
      
      // Add new order
      setOrders([newOrder, ...orders])
      
      // Reset form
      setNewOrderData({
        customer_name: '',
        brand: '',
        category: '',
        quantity: 1,
        status: 'pending',
        notes: ''
      })
      
      // Tutup modal
      setIsCreateModalOpen(false)
      
      // Tampilkan SweetAlert sukses
      SweetAlert.success('Success!', `Order ${newOrderCode} has been created successfully!`)
      
    } catch (error) {
      console.error('Error creating order:', error)
      SweetAlert.error('Error!', 'Failed to create new order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = (category, quantity) => {
    const basePrices = {
      'Kardus Box 20x20': 12500,
      'Paper Bag Premium': 17000,
      'Sticker Vinyl': 2750,
      'Corrugated Box': 9500,
      'Folding Carton': 7500,
      'Duplek Medium': 8000
    }
    return (basePrices[category] || 10000) * quantity
  }

  const getDueDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  const handleInputChange = (field, value) => {
    setNewOrderData(prev => ({
      ...prev,
      [field]: value
    }))
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CustomIcon icon="mdi:clipboard-list-outline" className="text-blue-600" />
            Orders Management
          </h1>
          <p className="text-gray-600 mt-1">Kelola dan lacak pesanan pelanggan</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="primary" 
            size="sm"
            icon="mdi:plus"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full md:w-auto"
          >
            New Order
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
        </Card>
        
        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(orders.reduce((sum, order) => sum + order.total_price, 0))}
            </p>
          </div>
        </Card>
        
        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Completed Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </div>
        </Card>
      </div>

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

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table
            headers={['Order Code', 'Customer', 'Brand', 'Category', 'Quantity', 'Amount', 'Status', 'Due Date', 'Actions']}
            striped
            hoverable
          >
            {filteredOrders.map((order) => (
              <TableRow key={order.id} hoverable>
                <TableCell>
                  <div className="font-medium text-blue-600">{order.order_code}</div>
                  <div className="text-xs text-gray-500">{formatDate(order.created_at)}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{order.customer_name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="gray" size="sm">{order.brand}</Badge>
                </TableCell>
                <TableCell>{order.category}</TableCell>
                <TableCell>
                  <div className="font-medium">{order.quantity.toLocaleString()}</div>
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(order.total_price)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    <CustomIcon icon={getStatusIcon(order.status)} className="w-3 h-3 mr-1" />
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={`font-medium ${
                    new Date(order.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatDate(order.due_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      size="xs" 
                      variant="ghost"
                      icon="mdi:eye"
                      onClick={() => handleViewDetails(order)}
                    >
                      View
                    </Button>
                    <Button 
                      size="xs" 
                      variant="ghost"
                      icon="mdi:pencil"
                      onClick={() => alert(`Edit order ${order.id}`)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="xs" 
                      variant="ghost"
                      icon="mdi:delete"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <CustomIcon icon="mdi:package-variant-remove" className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" icon="mdi:plus">
            Create New Order
          </Button>
        </Card>
      )}

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

      {/* Create Order Modal - SAMA dengan di Dashboard */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Order"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleNewOrderSubmit}
              loading={loading}
              icon="mdi:check"
            >
              Create Order
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Customer Name *"
                placeholder="Enter customer name"
                value={newOrderData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                leftIcon="mdi:account"
              />
            </div>
            
            <div>
              <Input
                label="Brand *"
                placeholder="Enter brand name"
                value={newOrderData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                leftIcon="mdi:tag"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Select
                label="Category *"
                value={newOrderData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={[
                  { value: '', label: 'Select category' },
                  { value: 'Kardus Box 20x20', label: 'Kardus Box 20x20' },
                  { value: 'Paper Bag Premium', label: 'Paper Bag Premium' },
                  { value: 'Sticker Vinyl', label: 'Sticker Vinyl' },
                  { value: 'Duplek Medium', label: 'Duplek Medium' },
                  { value: 'Karton Box', label: 'Karton Box' }
                ]}
              />
            </div>
            
            <div>
              <Input
                label="Quantity *"
                type="number"
                placeholder="Enter quantity"
                value={newOrderData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                leftIcon="mdi:numeric"
                min="1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Select
                label="Status *"
                value={newOrderData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'shipped', label: 'Shipped' }
                ]}
              />
            </div>
            
            <div className="md:col-span-2">
              <Input
                label="Notes"
                placeholder="Add any notes or special instructions..."
                value={newOrderData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                leftIcon="mdi:note-text"
                multiline
                rows={3}
              />
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <CustomIcon icon="mdi:information" className="w-5 h-5" />
              <span className="font-medium">Order Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Order Code:</span>
                <span className="ml-2 font-medium">TOK-2024-00{orders.length + 1}</span>
              </div>
              <div>
                <span className="text-gray-600">Created Date:</span>
                <span className="ml-2 font-medium">{new Date().toLocaleDateString('id-ID')}</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated Price:</span>
                <span className="ml-2 font-medium text-green-600">
                  {newOrderData.category && newOrderData.quantity ? 
                    formatCurrency(calculatePrice(newOrderData.category, newOrderData.quantity)) : 
                    'IDR 0'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}