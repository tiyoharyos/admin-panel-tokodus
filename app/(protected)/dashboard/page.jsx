// app/(protected)/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import StatsCard from '@/components/UI/StatsCard'
import Badge from '@/components/UI/Badge'
import CustomIcon from '@/components/UI/Icon'

const mockData = {
  stats: {
    totalOrders: 42,
    totalRevenue: 12500000,
    activeProduction: 8,
    lowStockMaterials: 3,
    pendingOrders: 5,
    completedOrders: 32,
    monthlyGrowth: 12,
    revenueGrowth: 8.5
  },
  recentOrders: [
    { id: 'ORD-001', customer: 'PT Sinar Jaya', brand: 'Brand A', status: 'completed', amount: 12500000, date: '2024-01-15' },
    { id: 'ORD-002', customer: 'CV Maju Bersama', brand: 'Brand B', status: 'processing', amount: 8500000, date: '2024-01-14' },
    { id: 'ORD-003', customer: 'UD Berkah', brand: 'Brand C', status: 'pending', amount: 5500000, date: '2024-01-14' },
    { id: 'ORD-004', customer: 'PT Indah Selalu', brand: 'Brand A', status: 'completed', amount: 9200000, date: '2024-01-13' },
    { id: 'ORD-005', customer: 'CV Jaya Abadi', brand: 'Brand D', status: 'processing', amount: 16500000, date: '2024-01-12' }
  ],
  lowStockMaterials: [
    { id: 1, name: 'Tinta Hitam', stock: 12, unit: 'liter', min: 20, supplier: 'CV Supplier B', type: 'Consumable' },
    { id: 2, name: 'Lem PVA', stock: 8, unit: 'kg', min: 15, supplier: 'PT Supplier D', type: 'Consumable' }
  ],
  activeProduction: [
    { id: 1, machine: 'MACH-001', orderId: 'ORD-002', quantity: 1000, progress: 75, operator: 'Budi Santoso', status: 'running' },
    { id: 2, machine: 'MACH-002', orderId: 'ORD-003', quantity: 500, progress: 0, operator: 'Siti Rahayu', status: 'queued' }
  ]
}

export default function DashboardPage() {
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('month')

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
      case 'running': return 'success'
      case 'queued': return 'warning'
      default: return 'gray'
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data dashboard...</p>
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
              <CustomIcon icon="mdi:view-dashboard" className="w-8 h-8" />
              Dashboard Overview
            </h1>
            <p className="opacity-90 mt-1">Selamat datang di Tokodus Admin Panel</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon="mdi:calendar">
                {timeRange === 'month' ? 'Bulan Ini' : 
                 timeRange === 'week' ? 'Minggu Ini' : 
                 timeRange === 'year' ? 'Tahun Ini' : 'Custom'}
              </Badge>
              <Badge variant="success" icon="mdi:check-circle">
                {data.stats.completedOrders} Orders Selesai
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
         
            <Button 
              onClick={handleRefresh}
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
              icon="mdi:refresh"
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard
          title="Total Orders"
          value={data.stats.totalOrders}
          icon="mdi:package-variant-closed"
          trend={data.stats.monthlyGrowth}
          trendLabel="from last month"
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data.stats.totalRevenue)}
          icon="mdi:cash-multiple"
          trend={data.stats.revenueGrowth}
          trendLabel="from last month"
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Active Production"
          value={data.stats.activeProduction}
          icon="mdi:factory"
          trend={2}
          trendLabel="active jobs"
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatsCard
          title="Low Stock Items"
          value={data.stats.lowStockMaterials}
          icon="mdi:alert-circle-outline"
          trend={-1}
          trendLabel="need attention"
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Recent Orders and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CustomIcon icon="mdi:clipboard-list-outline" />
                Recent Orders
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {data.stats.pendingOrders} pending orders
              </p>
            </div>
            <Button variant="primary" size="sm" icon="mdi:plus">
              New Order
            </Button>
          </div>
          
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CustomIcon icon="mdi:package-variant" className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{order.id}</div>
                    <div className="text-sm text-gray-500">{order.customer}</div>
                    <div className="text-xs text-gray-400 mt-1">{order.date}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                  <div className="font-medium text-green-600">{formatCurrency(order.amount)}</div>
                  <div className="text-xs text-gray-500">{order.brand}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button variant="ghost" fullWidth icon="mdi:arrow-right">
              View All Orders
            </Button>
          </div>
        </Card>

        {/* Low Stock Materials */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CustomIcon icon="mdi:package-variant-alert" />
                Low Stock Materials
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {data.stats.lowStockMaterials} items need attention
              </p>
            </div>
            <Button variant="primary" size="sm" icon="mdi:package-variant-plus">
              Reorder
            </Button>
          </div>
          
          {data.lowStockMaterials.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockMaterials.map((material) => (
                <div 
                  key={material.id} 
                  className="flex items-center justify-between p-4 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <CustomIcon icon="mdi:alert" className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{material.name}</div>
                      <div className="text-sm text-gray-500">{material.type} • {material.supplier}</div>
                      <div className="text-xs text-red-500 mt-1">
                        Minimum: {material.min} {material.unit}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600 text-lg">
                      {material.stock} {material.unit}
                    </div>
                    <Badge variant="danger" size="sm" className="mt-1">Low Stock</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CustomIcon 
                icon="mdi:check-circle-outline" 
                className="w-12 h-12 text-green-500 mx-auto mb-3" 
              />
              <p className="text-gray-600 font-medium">All materials are sufficiently stocked</p>
              <p className="text-sm text-gray-500 mt-1">No items need immediate attention</p>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button variant="ghost" fullWidth icon="mdi:arrow-right">
              View All Materials
            </Button>
          </div>
        </Card>
      </div>

      {/* Production Status */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CustomIcon icon="mdi:clipboard-flow-outline" />
              Production Status
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {data.activeProduction.length} active production jobs
            </p>
          </div>
          <Button variant="primary" size="sm" icon="mdi:clipboard-list-outline">
            View All Jobs
          </Button>
        </div>
        
        {data.activeProduction.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.activeProduction.map((job) => (
              <Card key={job.id} hoverable className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <CustomIcon icon="mdi:printer-3d" className="w-4 h-4" />
                      {job.machine}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Order: {job.orderId}</div>
                  </div>
                  <Badge variant={getStatusVariant(job.status)}>
                    {job.status}
                  </Badge>
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
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CustomIcon icon="mdi:package-variant" className="w-4 h-4 text-gray-400" />
                    <span>{job.quantity} pcs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CustomIcon icon="mdi:account" className="w-4 h-4 text-gray-400" />
                    <span>{job.operator}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CustomIcon 
              icon="mdi:factory-off" 
              className="w-12 h-12 text-gray-400 mx-auto mb-3" 
            />
            <p className="text-gray-600 font-medium">No active production jobs</p>
            <p className="text-sm text-gray-500 mt-1">
              All production jobs are completed or on hold
            </p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:plus-circle" className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-gray-900">New Order</h4>
          <p className="text-xs text-gray-500 mt-1">Create new order</p>
        </Card>
        
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:file-document-edit" className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-medium text-gray-900">Design Input</h4>
          <p className="text-xs text-gray-500 mt-1">Create design</p>
        </Card>
        
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:printer" className="w-6 h-6 text-orange-600" />
          </div>
          <h4 className="font-medium text-gray-900">Production</h4>
          <p className="text-xs text-gray-500 mt-1">Start production</p>
        </Card>
        
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:chart-box" className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-gray-900">Reports</h4>
          <p className="text-xs text-gray-500 mt-1">View reports</p>
        </Card>
      </div>
    </div>
  )
}