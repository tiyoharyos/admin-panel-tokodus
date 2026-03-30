'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import CustomIcon from '@/components/UI/Icon'
import SweetAlert from '@/components/UI/SweetAlert'
import { Table, TableRow, TableCell } from '@/components/UI/Table'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'

// Mock data untuk Tokodus
const mockData = {
  stats: {
    totalOrders: 1234,
    activeProduction: 8,
    lowStockMaterials: 3,
    pendingOrders: 5,
    completedOrders: 32,
    orderGrowth: 4.2,
    customerSatisfaction: 94,
    productivity: 87
  },
  recentOrders: [
    { 
      id: 'TOK-001', 
      order_code: 'TOK-2024-001',
      customer_name: 'PT Sinar Jaya', 
      brand: 'Brand A',
      category: 'Kardus Box 20x20',
      status: 'completed', 
      quantity: 1000,
      total_price: 12500000, 
      date: '2024-01-15',
      due_date: '2024-01-20'
    },
    { 
      id: 'TOK-002', 
      order_code: 'TOK-2024-002',
      customer_name: 'CV Maju Bersama', 
      brand: 'Brand B',
      category: 'Paper Bag Premium',
      status: 'processing', 
      quantity: 500,
      total_price: 8500000, 
      date: '2024-01-14',
      due_date: '2024-01-18'
    },
    { 
      id: 'TOK-003', 
      order_code: 'TOK-2024-003',
      customer_name: 'UD Berkah', 
      brand: 'Brand C',
      category: 'Sticker Vinyl',
      status: 'pending', 
      quantity: 2000,
      total_price: 5500000, 
      date: '2024-01-14',
      due_date: '2024-01-17'
    }
  ],
  topProducts: [
    { 
      id: 1, 
      name: 'Kardus Box 20x20', 
      sales: 1234, 
      growth: 15.2
    },
    { 
      id: 2, 
      name: 'Paper Bag Premium', 
      sales: 987, 
      growth: 12.5
    },
    { 
      id: 3, 
      name: 'Sticker Vinyl', 
      sales: 856, 
      growth: 8.3
    }
  ],
  lowStockMaterials: [
    { 
      id: 1, 
      name: 'Tinta Hitam CMYK', 
      stock: 12, 
      unit: 'liter', 
      min: 20, 
      supplier: 'CV Supplier B', 
      type: 'Consumable'
    },
    { 
      id: 2, 
      name: 'Lem PVA Premium', 
      stock: 8, 
      unit: 'kg', 
      min: 15, 
      supplier: 'PT Supplier D', 
      type: 'Consumable'
    }
  ],
  customerData: [
    {
      id: 'CUST-001',
      name: 'PT Sinar Jaya',
      email: 'contact@sinarjaya.com',
      totalOrders: 24,
      totalSpent: 125000000,
      status: 'active'
    },
    {
      id: 'CUST-002',
      name: 'CV Maju Bersama',
      email: 'info@majubersama.com',
      totalOrders: 18,
      totalSpent: 85000000,
      status: 'active'
    }
  ]
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('month')
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [newOrderData, setNewOrderData] = useState({
    customer_name: '',
    brand: '',
    category: '',
    quantity: 1,
    status: 'pending',
    notes: ''
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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

  const handleViewOrder = (orderId) => {
    SweetAlert.info('View Order', `Viewing order: ${orderId}`)
    router.push(`/orders/${orderId}`)
  }


  // Handle New Order
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
      
      // Generate new order ID
      const newId = `TOK-00${data.recentOrders.length + 1}`
      const newOrderCode = `TOK-2024-00${data.recentOrders.length + 1}`
      
      // Simulasi data yang akan dikirim ke API
      const newOrder = {
        id: newId,
        order_code: newOrderCode,
        customer_name: newOrderData.customer_name,
        brand: newOrderData.brand,
        category: newOrderData.category,
        quantity: parseInt(newOrderData.quantity),
        status: newOrderData.status,
        total_price: calculatePrice(newOrderData.category, newOrderData.quantity),
        date: new Date().toISOString().split('T')[0],
        due_date: getDueDate(),
        notes: newOrderData.notes
      }
      
      // Update data lokal
      setData(prev => ({
        ...prev,
        recentOrders: [newOrder, ...prev.recentOrders],
        stats: {
          ...prev.stats,
          totalOrders: prev.stats.totalOrders + 1,
          pendingOrders: newOrderData.status === 'pending' ? prev.stats.pendingOrders + 1 : prev.stats.pendingOrders
        }
      }))
      
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
      setIsNewOrderModalOpen(false)
      
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
    // Simulasi perhitungan harga
    const basePrices = {
      'Kardus Box 20x20': 12500,
      'Paper Bag Premium': 17000,
      'Sticker Vinyl': 2750,
      'Duplek Medium': 8000,
      'Karton Box': 9500
    }
    return (basePrices[category] || 10000) * quantity
  }

  const getDueDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7) // 7 hari dari sekarang
    return date.toISOString().split('T')[0]
  }

  const handleInputChange = (field, value) => {
    setNewOrderData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Simulasi loading data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header dengan judul */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1">Selamat datang di Tokodus Admin Panel</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={timeRange === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Minggu Ini
          </Button>
          <Button 
            variant={timeRange === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Bulan Ini
          </Button>
          <Button 
            variant={timeRange === 'year' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('year')}
          >
            Tahun Ini
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:package-variant-closed" className="text-blue-600" />
              Total Orders
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-green-600 font-medium flex items-center">
                <CustomIcon icon="mdi:trending-up" className="w-4 h-4 mr-1" />
                {data.stats.orderGrowth}%
              </span>
            </div>
            <p className="text-xs text-gray-500">vs last month</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:factory" className="text-orange-600" />
              Active Production
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{data.stats.activeProduction}</p>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <CustomIcon icon="mdi:trending-up" className="w-4 h-4 mr-1" />
                2 active jobs
              </span>
            </div>
            <p className="text-xs text-gray-500">currently running</p>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <CustomIcon icon="mdi:alert-circle-outline" className="text-red-600" />
              Low Stock Items
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{data.stats.lowStockMaterials}</p>
              <span className="text-sm text-red-600 font-medium flex items-center">
                <CustomIcon icon="mdi:alert" className="w-4 h-4 mr-1" />
                need attention
              </span>
            </div>
            <p className="text-xs text-gray-500">requires restocking</p>
          </div>
        </Card>
      </div>

      {/* Recent Orders dan Top Products side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Card */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:clipboard-list-outline" className="text-blue-600" />
              Recent Orders
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/orders')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    order.status === 'completed' ? 'bg-green-500' :
                    order.status === 'processing' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.order_code} - {order.category}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products Card */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:chart-bar" className="text-green-600" />
              Top Products
            </h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {data.topProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">
                    <CustomIcon icon="mdi:trending-up" className="w-3 h-3 inline mr-1" />
                    {product.growth}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Orders Table (versi lebih lengkap) */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:clipboard-list-outline" className="text-blue-600" />
              Recent Orders (Detailed)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {data.stats.pendingOrders} pending, {data.stats.completedOrders} completed
            </p>
          </div>
          <Button 
            variant="primary" 
            size="sm"
            icon="mdi:plus"
            onClick={() => setIsNewOrderModalOpen(true)}
          >
            New Order
          </Button>
        </div>
        
        <Table
          headers={['Order Code', 'Customer', 'Brand', 'Category', 'Quantity', 'Amount', 'Status', 'Actions']}
          striped
          hoverable
        >
          {data.recentOrders.map((order) => (
            <TableRow key={order.id} hoverable>
              <TableCell>
                <div className="font-medium text-blue-600">{order.order_code}</div>
                <div className="text-xs text-gray-500">{order.date}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900">{order.customer_name}</div>
              </TableCell>
              <TableCell>{order.brand}</TableCell>
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
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost"
                    icon="mdi:eye"
                    onClick={() => handleViewOrder(order.id)}
                  >
                    View
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>

      {/* New Order Modal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Create New Order"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsNewOrderModalOpen(false)}
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
                <span className="ml-2 font-medium">TOK-2024-00{data.recentOrders.length + 1}</span>
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

      {/* Bottom Section dengan stats tambahan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.customerSatisfaction}%</p>
            </div>
            <CustomIcon icon="mdi:account-heart" className="w-12 h-12 text-blue-400" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productivity</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.productivity}%</p>
            </div>
            <CustomIcon icon="mdi:progress-clock" className="w-12 h-12 text-green-400" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(8500000)}</p>
            </div>
            <CustomIcon icon="mdi:chart-timeline" className="w-12 h-12 text-purple-400" />
          </div>
        </Card>
      </div>
    </div>
  )
}