'use client'

import { useState } from 'react'
import Card from '../../../components/UI/Card'
import Button from '../../../components/UI/Button'
import StatsCard from '../../../components/UI/StatsCard'
import { Table, TableRow, TableCell } from '../../../components/UI/Table'
import { Icon } from '@iconify/react'

// Mock data (temporary, akan diganti dengan API)
const mockOrders = [
  {
    id: '1',
    orderCode: 'ORD-001',
    customerName: 'PT Sinar Jaya',
    brand: 'Brand A',
    status: 'completed',
    totalPrice: 12500000,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    orderCode: 'ORD-002',
    customerName: 'CV Maju Bersama',
    brand: 'Brand B',
    status: 'processing',
    totalPrice: 8500000,
    createdAt: '2024-01-14'
  },
  {
    id: '3',
    orderCode: 'ORD-003',
    customerName: 'UD Berkah',
    brand: 'Brand C',
    status: 'pending',
    totalPrice: 5500000,
    createdAt: '2024-01-14'
  },
  {
    id: '4',
    orderCode: 'ORD-004',
    customerName: 'PT Indah Selalu',
    brand: 'Brand A',
    status: 'completed',
    totalPrice: 9200000,
    createdAt: '2024-01-13'
  },
  {
    id: '5',
    orderCode: 'ORD-005',
    customerName: 'CV Jaya Abadi',
    brand: 'Brand D',
    status: 'processing',
    totalPrice: 16500000,
    createdAt: '2024-01-12'
  }
]

const mockMaterials = [
  {
    id: '1',
    name: 'Plastik HDPE',
    stock: 45,
    unit: 'kg',
    type: 'Raw Material',
    supplier: 'PT Supplier A'
  },
  {
    id: '2',
    name: 'Tinta Hitam',
    stock: 12,
    unit: 'liter',
    type: 'Consumable',
    supplier: 'CV Supplier B'
  },
  {
    id: '3',
    name: 'Karton Duplex',
    stock: 85,
    unit: 'sheet',
    type: 'Packaging',
    supplier: 'UD Supplier C'
  },
  {
    id: '4',
    name: 'Lem PVA',
    stock: 8,
    unit: 'kg',
    type: 'Consumable',
    supplier: 'PT Supplier D'
  }
]

const mockProductionJobs = [
  {
    id: '1',
    orderId: '2',
    designInputId: 'design-001',
    machineId: 'MACH-001',
    status: 'running',
    progress: 75,
    quantity: 1000,
    operator: 'Budi Santoso',
    startTime: '2024-01-14 08:30'
  },
  {
    id: '2',
    orderId: '3',
    designInputId: 'design-002',
    machineId: 'MACH-002',
    status: 'queued',
    progress: 0,
    quantity: 500,
    operator: 'Siti Rahayu',
    startTime: '2024-01-15 09:00'
  }
]

const mockDesignInputs = [
  { id: 'design-001', name: 'Design Packaging A' },
  { id: 'design-002', name: 'Design Packaging B' }
]

// Helper function untuk kalkulasi statistik dari mock data
const getDashboardStats = () => {
  const totalOrders = mockOrders.length
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.totalPrice, 0)
  const activeProduction = mockProductionJobs.filter(job => 
    job.status === 'running' || job.status === 'queued'
  ).length
  const lowStockMaterials = mockMaterials.filter(material => material.stock < 100).length
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length
  const completedOrders = mockOrders.filter(o => o.status === 'completed').length
  
  return {
    totalOrders,
    totalRevenue,
    activeProduction,
    lowStockMaterials,
    pendingOrders,
    completedOrders,
    monthlyGrowth: 12, // Contoh statis
    revenueGrowth: 8.5,
    productionChange: -2,
    stockChange: 3
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState(getDashboardStats())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usingMockData, setUsingMockData] = useState(true)

  // Fungsi untuk fetch data dari API (akan digunakan nanti)
  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // TODO: Ganti dengan API endpoint yang sesuai
      // Contoh: const response = await axios.get('/dashboard/stats')
      // setStats(response.data)
      
      // Untuk sekarang tetap pakai mock data
      const mockStats = getDashboardStats()
      setStats(mockStats)
      setUsingMockData(true)
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      
      // Tampilkan error dari API jika ada
      if (err.response?.data?.message) {
        setError(`API Error: ${err.response.data.message}`)
      } else {
        setError('Gagal memuat data dashboard. Menggunakan data contoh.')
      }
      
      // Fallback ke mock data
      const fallbackStats = getDashboardStats()
      setStats(fallbackStats)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(1)}K`
    }
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  // Status badge untuk order
  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { 
        icon: 'mdi:check-circle-outline',
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Completed'
      },
      processing: { 
        icon: 'mdi:cog-outline',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Processing'
      },
      pending: { 
        icon: 'mdi:clock-outline',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Pending'
      },
      cancelled: { 
        icon: 'mdi:close-circle-outline',
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Cancelled'
      }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    
    return (
      <span className={`px-3 py-1 text-xs rounded-full ${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
        <Icon icon={config.icon} className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  // Ambil 5 order terbaru dari mock data
  const recentOrders = [...mockOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(order => ({
      id: order.orderCode,
      customer: order.customerName,
      brand: order.brand,
      status: order.status,
      amount: order.totalPrice,
      date: order.createdAt
    }))

  // Ambil material dengan stock rendah
  const lowStockMaterials = mockMaterials
    .filter(material => material.stock < 100)
    .slice(0, 5)
    .map(material => ({
      id: material.id,
      name: material.name,
      stock: material.stock,
      min: 100, // Minimum stock threshold
      unit: material.unit,
      type: material.type,
      supplier: material.supplier
    }))

  // Ambil produksi aktif
  const activeProductionJobs = mockProductionJobs
    .filter(job => job.status === 'running' || job.status === 'queued')
    .slice(0, 3)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon 
            icon="mdi:loading" 
            className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" 
          />
          <p className="text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Icon icon="mdi:view-dashboard-outline" className="w-8 h-8" />
              Dashboard Overview
            </h1>
            <p className="opacity-90 mt-1">Selamat datang di Tokodus Admin Panel</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {usingMockData && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-1 text-sm">
                <Icon icon="mdi:information" className="inline w-4 h-4 mr-1" />
                Using demo data
              </div>
            )}
            <Button 
              variant="outline" 
              className="!bg-white/10 !border-white/20 hover:!bg-white/20 text-white"
              onClick={fetchDashboardData}
            >
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-1" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon icon="mdi:alert-circle-outline" className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Perhatian</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="mdi:package-variant-closed"
          trend={stats.monthlyGrowth}
          trendLabel="from last month"
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon="mdi:cash-multiple"
          trend={stats.revenueGrowth}
          trendLabel="from last month"
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Active Production"
          value={stats.activeProduction}
          icon="mdi:factory"
          trend={stats.productionChange}
          trendLabel="active jobs"
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockMaterials}
          icon="mdi:alert-circle-outline"
          trend={stats.stockChange}
          trendLabel="need attention"
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:clipboard-list-outline" className="w-5 h-5" />
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.pendingOrders} pending orders
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Icon icon="mdi:plus" className="w-4 h-4 mr-1" />
                New Order
              </Button>
            </div>
          </div>
          <div className="p-6">
            <Table headers={['Order ID', 'Customer', 'Status', 'Amount', 'Date']}>
              {recentOrders.map((order) => (
                <TableRow key={order.id} hoverable>
                  <TableCell>
                    <div className="font-medium text-blue-600 flex items-center gap-2">
                      <Icon icon="mdi:file-document-outline" className="w-4 h-4" />
                      {order.id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{order.customer}</div>
                    <div className="text-sm text-gray-500">{order.brand}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatCurrency(order.amount)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {order.date}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </Card>

        {/* Low Stock Materials */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:package-variant-alert" className="w-5 h-5" />
                  Low Stock Materials
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.lowStockMaterials} items need attention
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Icon icon="mdi:package-variant-plus" className="w-4 h-4 mr-1" />
                Reorder
              </Button>
            </div>
          </div>
          <div className="p-6">
            {lowStockMaterials.length > 0 ? (
              <div className="space-y-4">
                {lowStockMaterials.map((material) => (
                  <div 
                    key={material.id} 
                    className="flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Icon icon="mdi:alert" className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{material.name}</p>
                        <p className="text-sm text-gray-500">
                          {material.type} • Supplier: {material.supplier}
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          Minimum stock: {material.min} {material.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {material.stock} {material.unit}
                      </p>
                      <p className="text-xs text-red-500">Low Stock</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon 
                  icon="mdi:check-circle-outline" 
                  className="w-12 h-12 text-green-500 mx-auto mb-3" 
                />
                <p className="text-gray-600 font-medium">All materials are sufficiently stocked</p>
                <p className="text-sm text-gray-500 mt-1">No items need immediate attention</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Production Status */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="mdi:clipboard-flow-outline" className="w-5 h-5" />
                Production Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {activeProductionJobs.length} active production jobs
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Icon icon="mdi:clipboard-list-outline" className="w-4 h-4 mr-1" />
              View All Jobs
            </Button>
          </div>
        </div>
        <div className="p-6">
          {activeProductionJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeProductionJobs.map((job) => {
                const order = mockOrders.find(o => o.id === job.orderId)
                const design = mockDesignInputs.find(d => d.id === job.designInputId)
                
                return (
                  <div 
                    key={job.id} 
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <Icon icon="mdi:printer-3d" className="w-4 h-4" />
                          {job.machineId}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {design?.name || 'Unknown Design'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                        job.status === 'running' ? 'bg-green-100 text-green-800' :
                        job.status === 'queued' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <Icon 
                          icon={
                            job.status === 'running' ? 'mdi:play-circle-outline' :
                            job.status === 'queued' ? 'mdi:clock-outline' :
                            'mdi:pause-circle-outline'
                          } 
                          className="w-3 h-3" 
                        />
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            job.status === 'running' ? 'bg-green-500' :
                            job.status === 'queued' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Icon icon="mdi:package-variant" className="w-3 h-3" />
                          Quantity:
                        </span>
                        <span className="font-medium">{job.quantity} pcs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Icon icon="mdi:account" className="w-3 h-3" />
                          Operator:
                        </span>
                        <span>{job.operator}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                          Started:
                        </span>
                        <span>{job.startTime.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon 
                icon="mdi:factory-off" 
                className="w-12 h-12 text-gray-400 mx-auto mb-3" 
              />
              <p className="text-gray-600 font-medium">No active production jobs</p>
              <p className="text-sm text-gray-500 mt-1">
                All production jobs are completed or on hold
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}