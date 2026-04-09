'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import { Table, TableRow, TableCell } from '@/components/UI/Table'
import SweetAlert from '@/components/UI/SweetAlert'

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
    { id: 1, name: 'Kardus Box 20x20', sales: 1234, growth: 15.2 },
    { id: 2, name: 'Paper Bag Premium', sales: 987, growth: 12.5 },
    { id: 3, name: 'Sticker Vinyl', sales: 856, growth: 8.3 }
  ],
  lowStockMaterials: [
    { id: 1, name: 'Tinta Hitam CMYK', stock: 12, unit: 'liter', min: 20, supplier: 'CV Supplier B', type: 'Consumable' },
    { id: 2, name: 'Lem PVA Premium', stock: 8, unit: 'kg', min: 15, supplier: 'PT Supplier D', type: 'Consumable' }
  ],
  customerData: [
    { id: 'CUST-001', name: 'PT Sinar Jaya', email: 'contact@sinarjaya.com', totalOrders: 24, totalSpent: 125000000, status: 'active' },
    { id: 'CUST-002', name: 'CV Maju Bersama', email: 'info@majubersama.com', totalOrders: 18, totalSpent: 85000000, status: 'active' }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'completed': return 'success'
      case 'processing': return 'primary'
      case 'pending': return 'warning'
      case 'shipped': return 'info'
      case 'cancelled': return 'danger'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return 'mdi:check-circle'
      case 'processing': return 'mdi:progress-clock'
      case 'pending': return 'mdi:clock-outline'
      case 'shipped': return 'mdi:truck-delivery'
      case 'cancelled': return 'mdi:cancel'
      default: return 'mdi:circle'
    }
  }

  const handleViewOrder = (orderId: string) => {
    SweetAlert.info('View Order', `Viewing order: ${orderId}`)
    router.push(`/orders/${orderId}`)
  }

  const handleNewOrderSubmit = async () => {
    try {
      if (!newOrderData.customer_name || !newOrderData.brand || !newOrderData.category) {
        SweetAlert.error('Error!', 'Please fill in all required fields.')
        return
      }
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      const newId = `TOK-00${data.recentOrders.length + 1}`
      const newOrderCode = `TOK-2024-00${data.recentOrders.length + 1}`
      const newOrder = {
        id: newId,
        order_code: newOrderCode,
        customer_name: newOrderData.customer_name,
        brand: newOrderData.brand,
        category: newOrderData.category,
        quantity: parseInt(newOrderData.quantity as any),
        status: newOrderData.status,
        total_price: calculatePrice(newOrderData.category, newOrderData.quantity),
        date: new Date().toISOString().split('T')[0],
        due_date: getDueDate(),
        notes: newOrderData.notes
      }
      setData(prev => ({
        ...prev,
        recentOrders: [newOrder, ...prev.recentOrders],
        stats: {
          ...prev.stats,
          totalOrders: prev.stats.totalOrders + 1,
          pendingOrders: newOrderData.status === 'pending' ? prev.stats.pendingOrders + 1 : prev.stats.pendingOrders
        }
      }))
      setNewOrderData({ customer_name: '', brand: '', category: '', quantity: 1, status: 'pending', notes: '' })
      setIsNewOrderModalOpen(false)
      SweetAlert.success('Success!', `Order ${newOrderCode} has been created successfully!`)
    } catch (error) {
      console.error(error)
      SweetAlert.error('Error!', 'Failed to create new order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = (category: string, quantity: number) => {
    const basePrices: Record<string, number> = {
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
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  const handleInputChange = (field: string, value: any) => {
    setNewOrderData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Icon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  // Stats cards items untuk gaya baru
  const statItems = [
    {
      icon: 'mdi:package-variant-closed',
      label: 'Total Orders',
      value: data.stats.totalOrders.toLocaleString(),
      sub: `+${data.stats.orderGrowth}% vs last month`,
      accent: '#3b82f6'
    },
    {
      icon: 'mdi:factory',
      label: 'Active Production',
      value: data.stats.activeProduction,
      sub: 'currently running',
      accent: '#f59e0b'
    },
    {
      icon: 'mdi:alert-circle-outline',
      label: 'Low Stock Items',
      value: data.stats.lowStockMaterials,
      sub: 'requires restocking',
      accent: '#ef4444'
    }
  ]

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header dengan gaya biru dan dot amber */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:view-dashboard" className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Dashboard Overview</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Selamat datang di Tokodus Admin Panel</p>
          </div>
        </div>
        <div className="flex gap-2">
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

      {/* Stats Cards dengan gaya baru */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statItems.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{s.label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.accent}15` }}>
                <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1.5">{s.sub}</p>
            <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${s.accent}60, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Row: Recent Orders dan Top Products (sampingan) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Card (ringkasan) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Icon icon="mdi:clipboard-list-outline" className="text-blue-600" />
                  Recent Orders
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">{data.stats.pendingOrders} pending, {data.stats.completedOrders} completed</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>
                View All
              </Button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-blue-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    order.status === 'completed' ? 'bg-green-500' :
                    order.status === 'processing' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium text-slate-800">{order.customer_name}</p>
                    <p className="text-sm text-slate-500">{order.order_code} - {order.category}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #10b981, #f59e0b)' }} />
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Icon icon="mdi:chart-bar" className="text-green-600" />
                Top Products
              </h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.topProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 hover:bg-blue-50/40 transition-colors">
                <p className="font-medium text-slate-800">{product.name}</p>
                <div className="text-right">
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Icon icon="mdi:trending-up" className="w-3 h-3" />
                    {product.growth}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Orders Table dengan komponen Table global */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Icon icon="mdi:clipboard-list-outline" className="text-blue-600" />
                Recent Orders (Detailed)
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
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
        </div>
        <div className="overflow-x-auto">
          <Table
            headers={['Order Code', 'Customer', 'Brand', 'Category', 'Quantity', 'Amount', 'Status', 'Actions']}
          >
            {data.recentOrders.map((order) => (
              <TableRow key={order.id} hoverable={false} className="hover:bg-blue-50/40 transition-colors">
                <TableCell>
                  <div className="font-medium text-blue-600">{order.order_code}</div>
                  <div className="text-xs text-slate-400">{order.date}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-800">{order.customer_name}</div>
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
                    <Icon icon={getStatusIcon(order.status)} className="w-3 h-3 mr-1 inline" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost"
                    icon="mdi:eye"
                    size="sm"
                    onClick={() => handleViewOrder(order.id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-400">
            Menampilkan <span className="font-semibold text-slate-600">{data.recentOrders.length}</span> pesanan terbaru
          </p>
        </div>
      </div>

      {/* Bottom stats dengan gradient cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-slate-800">{data.stats.customerSatisfaction}%</p>
            </div>
            <Icon icon="mdi:account-heart" className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Productivity</p>
              <p className="text-2xl font-bold text-slate-800">{data.stats.productivity}%</p>
            </div>
            <Icon icon="mdi:progress-clock" className="w-10 h-10 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg. Order Value</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(8500000)}</p>
            </div>
            <Icon icon="mdi:chart-timeline" className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Modal New Order (dengan styling konsisten) */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Create New Order"
        size="lg"
        closeOnOverlayClick={!loading}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsNewOrderModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNewOrderSubmit} loading={loading} icon="mdi:check">
              Create Order
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-blue-50 border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Order Baru</p>
              <p className="text-xs text-blue-600 mt-1">Isi semua field yang diperlukan untuk membuat pesanan baru.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              placeholder="Enter customer name"
              value={newOrderData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              leftIcon="mdi:account"
            />
            <Input
              label="Brand *"
              placeholder="Enter brand name"
              value={newOrderData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              leftIcon="mdi:tag"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={newOrderData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'shipped', label: 'Shipped' }
              ]}
            />
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

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Icon icon="mdi:information" className="w-5 h-5" />
              <span className="font-medium">Order Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Order Code:</span>
                <span className="ml-2 font-medium">TOK-2024-00{data.recentOrders.length + 1}</span>
              </div>
              <div>
                <span className="text-slate-500">Created Date:</span>
                <span className="ml-2 font-medium">{new Date().toLocaleDateString('id-ID')}</span>
              </div>
              <div>
                <span className="text-slate-500">Estimated Price:</span>
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