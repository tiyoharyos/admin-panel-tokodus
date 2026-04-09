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
import LoadingState from '@/components/UI/LoadingState'
import { SalesTrendChart, OrderStatusChart, CategoryBarChart } from '@/components/UI/Chart'

// ============================================================
// MOCK DATA
// ============================================================

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
    },
    {
      id: 'TOK-004',
      order_code: 'TOK-2024-004',
      customer_name: 'PT Maju Jaya',
      brand: 'Brand D',
      category: 'Duplek Medium',
      status: 'shipped',
      quantity: 300,
      total_price: 2400000,
      date: '2024-01-13',
      due_date: '2024-01-19'
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
  ]
}

// ============================================================
// CHART DATA
// ============================================================

const salesTrendData = [
  { name: 'Jan', sales: 125000000, orders: 145 },
  { name: 'Feb', sales: 142000000, orders: 162 },
  { name: 'Mar', sales: 138000000, orders: 158 },
  { name: 'Apr', sales: 165000000, orders: 189 },
  { name: 'May', sales: 189000000, orders: 215 },
  { name: 'Jun', sales: 210000000, orders: 238 },
  { name: 'Jul', sales: 198000000, orders: 225 },
  { name: 'Aug', sales: 225000000, orders: 256 },
  { name: 'Sep', sales: 242000000, orders: 278 },
  { name: 'Oct', sales: 268000000, orders: 305 },
  { name: 'Nov', sales: 285000000, orders: 324 },
  { name: 'Dec', sales: 310000000, orders: 352 }
]

const orderStatusData = [
  { name: 'Completed', value: 32, color: '#10b981' },
  { name: 'Processing', value: 8, color: '#3b82f6' },
  { name: 'Pending', value: 5, color: '#f59e0b' },
  { name: 'Shipped', value: 3, color: '#8b5cf6' }
]

const categorySalesData = [
  { name: 'Kardus Box', value: 42500000 },
  { name: 'Paper Bag', value: 28900000 },
  { name: 'Sticker', value: 18500000 },
  { name: 'Duplek', value: 9600000 },
  { name: 'Karton Box', value: 15200000 }
]

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'primary'
    case 'pending': return 'warning'
    case 'shipped': return 'info'
    case 'cancelled': return 'danger'
    default: return 'gray'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'mdi:check-circle'
    case 'processing': return 'mdi:progress-clock'
    case 'pending': return 'mdi:clock-outline'
    case 'shipped': return 'mdi:truck-delivery'
    case 'cancelled': return 'mdi:cancel'
    default: return 'mdi:circle'
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

// ============================================================
// STATS CARDS
// ============================================================

function StatsCards({ stats }: { stats: typeof mockData.stats }) {
  const items = [
    {
      icon: 'mdi:package-variant-closed',
      label: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      sub: `+${stats.orderGrowth}% vs last month`,
      accent: '#3b82f6',
      accentBg: 'bg-blue-50'
    },
    {
      icon: 'mdi:factory',
      label: 'Active Production',
      value: stats.activeProduction,
      sub: 'currently running',
      accent: '#f59e0b',
      accentBg: 'bg-amber-50'
    },
    {
      icon: 'mdi:alert-circle-outline',
      label: 'Low Stock Items',
      value: stats.lowStockMaterials,
      sub: 'requires restocking',
      accent: '#ef4444',
      accentBg: 'bg-red-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((s, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">{s.label}</p>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.accentBg}`}
            >
              <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{s.value}</p>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <Icon icon="mdi:trending-up" className="w-3 h-3 text-green-500" />
            {s.sub}
          </p>
          <div
            className="mt-4 h-0.5 rounded-full"
            style={{ background: `linear-gradient(90deg, ${s.accent}60, transparent)` }}
          />
        </div>
      ))}
    </div>
  )
}

// ============================================================
// BOTTOM STATS CARDS
// ============================================================

function BottomStats({ stats }: { stats: typeof mockData.stats }) {
  const items = [
    {
      label: 'Customer Satisfaction',
      value: `${stats.customerSatisfaction}%`,
      trend: '+5.2% from last month',
      trendColor: 'text-green-600',
      icon: 'mdi:account-heart',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50'
    },
    {
      label: 'Productivity',
      value: `${stats.productivity}%`,
      trend: '+3.8% from last month',
      trendColor: 'text-green-600',
      icon: 'mdi:progress-clock',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50'
    },
    {
      label: 'Avg. Order Value',
      value: formatCurrency(8500000),
      trend: '+12.3% from last month',
      trendColor: 'text-amber-600',
      icon: 'mdi:chart-timeline',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((s, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
              <p className={`text-xs mt-2 flex items-center gap-1 ${s.trendColor}`}>
                <Icon icon="mdi:trending-up" className="w-3 h-3" />
                {s.trend}
              </p>
            </div>
            <div className={`w-12 h-12 ${s.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon icon={s.icon} className={`w-6 h-6 ${s.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

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

  const handleInputChange = (field: string, value: any) => {
    setNewOrderData(prev => ({ ...prev, [field]: value }))
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
          pendingOrders: newOrderData.status === 'pending'
            ? prev.stats.pendingOrders + 1
            : prev.stats.pendingOrders
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

  useEffect(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <LoadingState
        message="Memuat data Dashboard..."
        submessage="Harap tunggu sebentar"
        icon="mdi:view-dashboard"
      />
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Page Header */}
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
            <p className="text-slate-500 mt-0.5 text-sm flex items-center gap-1">
              <Icon icon="mdi:calendar-today" className="w-3 h-3" />
              Selamat datang di Tokodus Admin Panel
            </p>
          </div>
        </div>

        {/* Time Range Toggle */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-r border-slate-200 last:border-r-0 ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {range === 'week' ? 'Minggu Ini' : range === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={data.stats} />

      {/* Charts — Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrendChart data={salesTrendData} title="Sales & Orders Trend" height={320} />
        <OrderStatusChart data={orderStatusData} title="Order Status Distribution" height={320} />
      </div>

      {/* Charts — Row 2 */}
      <CategoryBarChart data={categorySalesData} title="Sales by Product Category" height={320} />

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="relative">
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }}
            />
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Icon icon="mdi:clipboard-list-outline" className="text-blue-600 text-xl" />
                  Recent Orders
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {data.stats.pendingOrders} pending, {data.stats.completedOrders} completed
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/orders')} icon="mdi:arrow-right">
                View All
              </Button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {data.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => handleViewOrder(order.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    order.status === 'completed' ? 'bg-green-500' :
                    order.status === 'processing' ? 'bg-blue-500' :
                    order.status === 'shipped' ? 'bg-purple-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{order.customer_name}</p>
                    <p className="text-xs text-slate-500">{order.order_code} · {order.category}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(order.status)} className="capitalize">
                  <Icon icon={getStatusIcon(order.status)} className="w-3 h-3 mr-1 inline" />
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="relative">
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: 'linear-gradient(90deg, #10b981, #f59e0b)' }}
            />
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Icon icon="mdi:chart-bar" className="text-green-600 text-xl" />
                Top Products Performance
              </h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.topProducts.map((product) => {
              const maxSales = Math.max(...data.topProducts.map(p => p.sales))
              const percentage = (product.sales / maxSales) * 100
              return (
                <div key={product.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                    <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                      <Icon icon="mdi:trending-up" className="w-3 h-3" />
                      +{product.growth}%
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{product.sales.toLocaleString()} sales</p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detailed Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="relative">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Icon icon="mdi:clipboard-list-outline" className="text-blue-600 text-xl" />
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
          <Table headers={['Order Code', 'Customer', 'Brand', 'Category', 'Quantity', 'Amount', 'Status', 'Actions']}>
            {data.recentOrders.map((order) => (
              <TableRow key={order.id} hoverable={false} className="hover:bg-slate-50 transition-colors">
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
                  <button
                    onClick={() => handleViewOrder(order.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Lihat Detail"
                  >
                    <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                  </button>
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

      {/* Bottom Stats */}
      <BottomStats stats={data.stats} />

      {/* New Order Modal */}
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
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
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
            <Input
              label="Notes"
              placeholder="Add any notes or special instructions..."
              value={newOrderData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              leftIcon="mdi:note-text"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 mb-3">
              <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-sm">Order Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Order Code:</span>
                <span className="ml-2 font-medium text-blue-600">
                  TOK-2024-00{data.recentOrders.length + 1}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Created Date:</span>
                <span className="ml-2 font-medium text-slate-700">
                  {new Date().toLocaleDateString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Estimated Price:</span>
                <span className="ml-2 font-medium text-green-600">
                  {newOrderData.category && newOrderData.quantity
                    ? formatCurrency(calculatePrice(newOrderData.category, newOrderData.quantity))
                    : 'IDR 0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  )
}