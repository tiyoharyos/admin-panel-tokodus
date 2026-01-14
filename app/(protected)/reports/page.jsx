// app/(protected)/reports/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import CustomIcon from '@/components/UI/Icon'

// Mock data for reports
const mockReportsData = {
  financial: {
    title: 'Financial Report',
    description: 'Revenue, profit, costs, and financial performance',
    totalRevenue: 48500000,
    totalCost: 32000000,
    totalProfit: 16500000,
    avgOrderValue: 2450000,
    revenueGrowth: 12.5,
    profitGrowth: 8.3,
    topCustomers: [
      { id: 1, name: 'PT Sinar Jaya', revenue: 12500000, orders: 5 },
      { id: 2, name: 'CV Maju Bersama', revenue: 8500000, orders: 3 },
      { id: 3, name: 'UD Berkah', revenue: 7500000, orders: 4 }
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 12000000, profit: 3800000 },
      { month: 'Feb', revenue: 11500000, profit: 3500000 },
      { month: 'Mar', revenue: 13500000, profit: 4500000 },
      { month: 'Apr', revenue: 11500000, profit: 3200000 }
    ]
  },
  
  production: {
    title: 'Production Report',
    description: 'Machine utilization, efficiency, and production metrics',
    totalJobs: 42,
    completedJobs: 32,
    activeJobs: 8,
    cancelledJobs: 2,
    avgProductionTime: '4.2 days',
    efficiency: 85.5,
    topMachines: [
      { id: 'MACH-001', name: 'Heidelberg', utilization: 92, jobs: 15 },
      { id: 'MACH-002', name: 'Konica Minolta', utilization: 78, jobs: 10 },
      { id: 'MACH-003', name: 'Roland VersaUV', utilization: 85, jobs: 12 }
    ],
    monthlyProduction: [
      { month: 'Jan', jobs: 10, completed: 8 },
      { month: 'Feb', jobs: 12, completed: 10 },
      { month: 'Mar', jobs: 8, completed: 6 },
      { month: 'Apr', jobs: 12, completed: 8 }
    ]
  },
  
  materials: {
    title: 'Material Report',
    description: 'Inventory, usage, stock levels, and material costs',
    totalMaterials: 24,
    lowStock: 3,
    totalValue: 45000000,
    monthlyUsage: 1200,
    avgCost: 12500,
    topMaterials: [
      { id: 1, name: 'Duplek 250GSM', usage: 450, value: 6750000 },
      { id: 2, name: 'Kraft Medium', usage: 380, value: 4560000 },
      { id: 3, name: 'Tinta Cyan', usage: 25, value: 4625000 }
    ],
    inventoryTrend: [
      { month: 'Jan', stock: 850, value: 38000000 },
      { month: 'Feb', stock: 920, value: 42000000 },
      { month: 'Mar', stock: 780, value: 35000000 },
      { month: 'Apr', stock: 820, value: 36500000 }
    ]
  },
  
  orders: {
    title: 'Order Report',
    description: 'Order trends, brand performance, and customer satisfaction',
    totalOrders: 18,
    completedOrders: 12,
    pendingOrders: 3,
    cancelledOrders: 1,
    avgCompletionTime: '5.2 days',
    customerSatisfaction: 92,
    topBrands: [
      { id: 1, name: 'MBR', orders: 6, revenue: 18500000 },
      { id: 2, name: 'ABC', orders: 4, revenue: 12500000 },
      { id: 3, name: 'XYZ', orders: 3, revenue: 9500000 }
    ],
    orderTrend: [
      { month: 'Jan', orders: 4, revenue: 12500000 },
      { month: 'Feb', orders: 5, revenue: 14500000 },
      { month: 'Mar', orders: 4, revenue: 12000000 },
      { month: 'Apr', orders: 5, revenue: 9500000 }
    ]
  },
  
  customers: {
    title: 'Customer Report',
    description: 'Customer analysis, retention, and segmentation',
    totalCustomers: 45,
    activeCustomers: 32,
    newCustomers: 8,
    repeatRate: 68,
    avgLifetimeValue: 1850000,
    topCustomers: [
      { id: 1, name: 'PT Sinar Jaya', orders: 15, value: 28500000 },
      { id: 2, name: 'CV Maju Bersama', orders: 12, value: 18500000 },
      { id: 3, name: 'UD Berkah', orders: 10, value: 15500000 }
    ]
  },
  
  quality: {
    title: 'Quality Report',
    description: 'Defect rates, quality metrics, and improvement areas',
    totalInspections: 120,
    passed: 108,
    defects: 12,
    defectRate: 10,
    topDefects: [
      { id: 1, type: 'Print Misalignment', count: 4 },
      { id: 2, type: 'Color Variation', count: 3 },
      { id: 3, type: 'Material Flaw', count: 2 }
    ]
  }
}

const reportTypeOptions = [
  { value: 'financial', label: 'Financial Reports' },
  { value: 'production', label: 'Production Reports' },
  { value: 'materials', label: 'Material Reports' },
  { value: 'orders', label: 'Order Reports' },
  { value: 'customers', label: 'Customer Reports' },
  { value: 'quality', label: 'Quality Reports' }
]

const timeRangeOptions = [
  { value: 'week', label: 'Last Week' },
  { value: 'month', label: 'Last Month' },
  { value: 'quarter', label: 'Last Quarter' },
  { value: 'year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' }
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState('financial')
  const [timeRange, setTimeRange] = useState('month')
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState('2024-04-30')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [reportData, setReportData] = useState(mockReportsData.financial)
  const [isCustomRange, setIsCustomRange] = useState(false)

  useEffect(() => {
    // Update report data when report type changes
    if (mockReportsData[reportType]) {
      setReportData(mockReportsData[reportType])
    } else {
      setReportData(mockReportsData.financial)
    }
  }, [reportType])

  useEffect(() => {
    // Handle custom range toggle
    setIsCustomRange(timeRange === 'custom')
  }, [timeRange])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('id-ID').format(number)
  }

  const handleGenerateReport = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      alert(`${reportData.title} generated for ${timeRange} period`)
    }, 1500)
  }

  const handleExportReport = (format) => {
    setExporting(true)
    // Simulate export process
    setTimeout(() => {
      setExporting(false)
      alert(`${reportData.title} exported as ${format.toUpperCase()} successfully!`)
    }, 1000)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const getReportIcon = () => {
    switch(reportType) {
      case 'financial': return 'mdi:cash-multiple'
      case 'production': return 'mdi:factory'
      case 'materials': return 'mdi:package-variant'
      case 'orders': return 'mdi:clipboard-list'
      case 'customers': return 'mdi:account-group'
      case 'quality': return 'mdi:chart-bar'
      default: return 'mdi:chart-box'
    }
  }

  const getReportPeriod = () => {
    const timeLabel = timeRangeOptions.find(t => t.value === timeRange)?.label || 'Custom'
    return `${timeLabel} (${startDate} to ${endDate})`
  }

  const getGrowthColor = (value) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (value) => {
    if (value > 0) return 'mdi:trending-up'
    if (value < 0) return 'mdi:trending-down'
    return 'mdi:minus'
  }

  const renderReportContent = () => {
    switch(reportType) {
      case 'financial':
        return (
          <div className="space-y-6">
            {/* Top Customers Table */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:account-star" />
                Top Customers by Revenue
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contribution
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData.topCustomers || []).map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(customer.revenue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{customer.orders} orders</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(customer.revenue / customer.orders)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(customer.revenue / reportData.totalRevenue) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {((customer.revenue / reportData.totalRevenue) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Revenue Trend */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:chart-line" />
                Monthly Revenue Trend
              </h4>
              <div className="space-y-4">
                {(reportData.monthlyRevenue || []).map((month, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">{month.month}</div>
                    <div className="flex-1 ml-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Revenue: {formatCurrency(month.revenue)}</span>
                        <span className="text-green-600">Profit: {formatCurrency(month.profit)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full"
                          style={{ width: `${(month.revenue / Math.max(...(reportData.monthlyRevenue || []).map(m => m.revenue))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 'production':
        return (
          <div className="space-y-6">
            {/* Machine Utilization */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:robot-industrial" />
                Machine Utilization
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(reportData.topMachines || []).map((machine) => (
                  <Card key={machine.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{machine.name}</p>
                        <p className="text-sm text-gray-500">{machine.id}</p>
                      </div>
                      <Badge variant={machine.utilization > 90 ? 'success' : machine.utilization > 70 ? 'warning' : 'danger'}>
                        {machine.utilization}%
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Utilization</span>
                        <span>{machine.utilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            machine.utilization > 90 ? 'bg-green-500' :
                            machine.utilization > 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${machine.utilization}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Jobs: {machine.jobs}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 'materials':
        return (
          <div className="space-y-6">
            {/* Top Materials Usage */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:package-variant" />
                Top Materials Usage
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData.topMaterials || []).map((material) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{material.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatNumber(material.usage)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">
                            {formatCurrency(material.value)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(material.value / material.usage)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      case 'orders':
        return (
          <div className="space-y-6">
            {/* Top Brands Table */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:tag" />
                Top Brands by Revenue
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData.topBrands || []).map((brand) => (
                      <tr key={brand.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{brand.orders} orders</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(brand.revenue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(brand.revenue / brand.orders)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      case 'customers':
        return (
          <div className="space-y-6">
            {/* Top Customers Table */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:account-star" />
                Top Customers by Lifetime Value
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lifetime Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData.topCustomers || []).map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{customer.orders} orders</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(customer.value)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(customer.value / customer.orders)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      case 'quality':
        return (
          <div className="space-y-6">
            {/* Top Defects Table */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:alert-circle" />
                Top Defects
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Defect Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData.topDefects || []).map((defect) => {
                      const percentage = (defect.count / (reportData.defects || 1)) * 100
                      let severity = 'low'
                      if (percentage > 30) severity = 'high'
                      else if (percentage > 15) severity = 'medium'
                      
                      return (
                        <tr key={defect.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{defect.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{defect.count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">
                              {percentage.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              severity === 'high' ? 'danger' : 
                              severity === 'medium' ? 'warning' : 'info'
                            }>
                              {severity.charAt(0).toUpperCase() + severity.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8">
            <CustomIcon icon="mdi:chart-bar" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a report type to view details</p>
          </div>
        )
    }
  }

  const renderInsights = () => {
    switch(reportType) {
      case 'financial':
        return (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:check-circle" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Revenue Growth</p>
                  <p className="text-sm text-blue-700">Revenue increased by {reportData.revenueGrowth}% compared to last period</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:chart-pie" className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Customer Concentration</p>
                  <p className="text-sm text-blue-700">Top 3 customers contribute {(reportData.topCustomers?.reduce((sum, c) => sum + (c.revenue / reportData.totalRevenue * 100), 0) || 0).toFixed(1)}% of total revenue</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:star" className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Focus on Top Customers</p>
                  <p className="text-sm text-blue-700">Upsell additional services to top 3 customers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:star" className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Cost Optimization</p>
                  <p className="text-sm text-blue-700">Review supplier contracts to improve profit margins</p>
                </div>
              </div>
            </div>
          </>
        )
      
      case 'production':
        return (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:check-circle" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">High Efficiency</p>
                  <p className="text-sm text-blue-700">Overall efficiency rate is {reportData.efficiency}%, above target of 80%</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:robot-industrial" className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Machine Performance</p>
                  <p className="text-sm text-blue-700">Heidelberg machine shows highest utilization at {reportData.topMachines?.[0]?.utilization || 92}%</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:wrench" className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Maintenance Schedule</p>
                  <p className="text-sm text-blue-700">Schedule preventive maintenance for underutilized machines</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:clock-fast" className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Process Optimization</p>
                  <p className="text-sm text-blue-700">Optimize job scheduling to reduce production time</p>
                </div>
              </div>
            </div>
          </>
        )
      
      case 'materials':
        return (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:alert" className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Low Stock Alert</p>
                  <p className="text-sm text-blue-700">{reportData.lowStock} items are low in stock and need replenishment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:warehouse" className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Inventory Value</p>
                  <p className="text-sm text-blue-700">Total inventory value is {formatCurrency(reportData.totalValue)} with average cost of {formatCurrency(reportData.avgCost)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:clipboard-check" className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Replenish Low Stock</p>
                  <p className="text-sm text-blue-700">Order materials for items below minimum stock level</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:chart-timeline" className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Usage Analysis</p>
                  <p className="text-sm text-blue-700">Analyze material usage patterns to optimize inventory levels</p>
                </div>
              </div>
            </div>
          </>
        )
      
      default:
        return (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:information" className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Report Generated</p>
                  <p className="text-sm text-blue-700">Report data is based on selected period and filters</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CustomIcon icon="mdi:star" className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Export Data</p>
                  <p className="text-sm text-blue-700">Export report in various formats for further analysis</p>
                </div>
              </div>
            </div>
          </>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CustomIcon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Generating report...</p>
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
              <CustomIcon icon="mdi:chart-box-outline" className="w-8 h-8" />
              Reports & Analytics
            </h1>
            <p className="opacity-90 mt-1">View detailed reports and analytics for your business</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="info" icon={getReportIcon()}>
                {reportData.title}
              </Badge>
              <Badge variant="success" icon="mdi:calendar">
                {getReportPeriod()}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 border-white/20"
              icon="mdi:printer"
              onClick={handlePrintReport}
            >
              Print
            </Button>
            <Button
              variant="success"
              icon="mdi:download"
              onClick={() => handleExportReport('pdf')}
              loading={exporting}
            >
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Controls */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={reportTypeOptions}
              leftIcon={getReportIcon()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={timeRangeOptions}
              leftIcon="mdi:calendar"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!isCustomRange}
              leftIcon="mdi:calendar-start"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!isCustomRange}
              leftIcon="mdi:calendar-end"
            />
          </div>
        </div>

        {/* Report Description */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-3">
            <CustomIcon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">{reportData.title}</p>
              <p className="text-sm text-blue-700 mt-1">{reportData.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setReportType('financial')
              setTimeRange('month')
              setStartDate('2024-01-01')
              setEndDate('2024-04-30')
            }}
            icon="mdi:refresh"
          >
            Reset Filters
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon="mdi:content-save"
              onClick={() => alert('Report saved to dashboard')}
            >
              Save Report
            </Button>
            <Button
              variant="primary"
              icon="mdi:chart-bar"
              onClick={handleGenerateReport}
              loading={loading}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Financial Report Stats */}
        {reportType === 'financial' && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatCurrency(reportData.totalRevenue)}
                  </p>
                  <div className="flex items-center mt-2">
                    <CustomIcon 
                      icon={getGrowthIcon(reportData.revenueGrowth)} 
                      className={`w-4 h-4 mr-1 ${getGrowthColor(reportData.revenueGrowth)}`}
                    />
                    <span className={`text-sm font-medium ${getGrowthColor(reportData.revenueGrowth)}`}>
                      {reportData.revenueGrowth > 0 ? '+' : ''}{reportData.revenueGrowth}%
                    </span>
                    <span className="text-sm text-gray-500 ml-2">vs last period</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <CustomIcon icon="mdi:cash" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Profit</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatCurrency(reportData.totalProfit)}
                  </p>
                  <div className="flex items-center mt-2">
                    <CustomIcon 
                      icon={getGrowthIcon(reportData.profitGrowth)} 
                      className={`w-4 h-4 mr-1 ${getGrowthColor(reportData.profitGrowth)}`}
                    />
                    <span className={`text-sm font-medium ${getGrowthColor(reportData.profitGrowth)}`}>
                      {reportData.profitGrowth > 0 ? '+' : ''}{reportData.profitGrowth}%
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <CustomIcon icon="mdi:currency-usd" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatCurrency(reportData.avgOrderValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Based on {(reportData.topCustomers || []).reduce((sum, c) => sum + (c.orders || 0), 0)} orders</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <CustomIcon icon="mdi:calculator" className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Production Report Stats */}
        {reportType === 'production' && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Jobs</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {reportData.completedJobs}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {((reportData.completedJobs / (reportData.totalJobs || 1)) * 100).toFixed(1)}% completion rate
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <CustomIcon icon="mdi:check-circle" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Efficiency Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {reportData.efficiency}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.efficiency > 80 ? 'Above target' : 'Needs improvement'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <CustomIcon icon="mdi:chart-line" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Production Time</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {reportData.avgProductionTime}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.activeJobs} active jobs
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <CustomIcon icon="mdi:timer" className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Materials Report Stats */}
        {reportType === 'materials' && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Materials</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {reportData.totalMaterials}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.lowStock} items low in stock
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <CustomIcon icon="mdi:package-variant" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatCurrency(reportData.totalValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Avg cost: {formatCurrency(reportData.avgCost)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <CustomIcon icon="mdi:warehouse" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Usage</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatNumber(reportData.monthlyUsage)} sheets
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Top material: {reportData.topMaterials?.[0]?.name || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <CustomIcon icon="mdi:chart-bar" className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Orders Report Stats */}
        {reportType === 'orders' && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {reportData.totalOrders}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.completedOrders} completed
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <CustomIcon icon="mdi:clipboard-check" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Customer Satisfaction</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {reportData.customerSatisfaction}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.customerSatisfaction > 90 ? 'Excellent' : 'Good'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <CustomIcon icon="mdi:heart" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Completion Time</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {reportData.avgCompletionTime}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.pendingOrders} orders pending
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <CustomIcon icon="mdi:calendar-clock" className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Customers Report Stats */}
        {reportType === 'customers' && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {reportData.totalCustomers}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.activeCustomers} active
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <CustomIcon icon="mdi:account-group" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Repeat Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {reportData.repeatRate}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.newCustomers} new customers
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <CustomIcon icon="mdi:repeat" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Lifetime Value</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatCurrency(reportData.avgLifetimeValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Top customer: {reportData.topCustomers?.[0]?.name || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <CustomIcon icon="mdi:currency-usd" className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Quality Report Stats */}
        {reportType === 'quality' && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Inspections</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {reportData.totalInspections}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.passed} passed inspections
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <CustomIcon icon="mdi:clipboard-check" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Defect Rate</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {reportData.defectRate}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {reportData.defects} defects found
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-100">
                  <CustomIcon icon="mdi:alert-circle" className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {((reportData.passed / (reportData.totalInspections || 1)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Top defect: {reportData.topDefects?.[0]?.type || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <CustomIcon icon="mdi:check-circle" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Detailed Report Content */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{reportData.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Period: {startDate} to {endDate} • Generated: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="mdi:file-pdf-box"
              onClick={() => handleExportReport('pdf')}
              loading={exporting}
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="mdi:file-excel"
              onClick={() => handleExportReport('excel')}
              loading={exporting}
            >
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="mdi:file-chart"
              onClick={() => handleExportReport('csv')}
              loading={exporting}
            >
              CSV
            </Button>
          </div>
        </div>

        {/* Report Content */}
        {renderReportContent()}

        {/* Export Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Export Report</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CustomIcon icon="mdi:file-pdf-box" className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h5 className="font-medium text-gray-900">PDF Document</h5>
              <p className="text-sm text-gray-500 mt-1">Professional PDF format</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleExportReport('pdf')}
                loading={exporting}
              >
                Export PDF
              </Button>
            </Card>
            
            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CustomIcon icon="mdi:file-excel" className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h5 className="font-medium text-gray-900">Excel Spreadsheet</h5>
              <p className="text-sm text-gray-500 mt-1">Data analysis ready</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleExportReport('excel')}
                loading={exporting}
              >
                Export Excel
              </Button>
            </Card>
            
            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CustomIcon icon="mdi:file-chart" className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <h5 className="font-medium text-gray-900">CSV Data</h5>
              <p className="text-sm text-gray-500 mt-1">Raw data for processing</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleExportReport('csv')}
                loading={exporting}
              >
                Export CSV
              </Button>
            </Card>
          </div>
        </div>
      </Card>

      {/* Report Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
          <CustomIcon icon="mdi:lightbulb-on" />
          Report Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Key Findings</h4>
            <div className="space-y-3">
              {renderInsights()}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h4>
            <div className="space-y-3">
              {renderInsights()}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center"
          onClick={() => alert('Email report feature')}
        >
          <CustomIcon icon="mdi:email-send" className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium">Email Report</span>
        </Button>
        
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center"
          onClick={() => alert('Schedule report feature')}
        >
          <CustomIcon icon="mdi:calendar-plus" className="w-6 h-6 text-green-600 mb-2" />
          <span className="text-sm font-medium">Schedule</span>
        </Button>
        
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center"
          onClick={() => alert('Compare periods feature')}
        >
          <CustomIcon icon="mdi:chart-timeline" className="w-6 h-6 text-purple-600 mb-2" />
          <span className="text-sm font-medium">Compare</span>
        </Button>
        
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center"
          onClick={() => alert('Report settings feature')}
        >
          <CustomIcon icon="mdi:cog" className="w-6 h-6 text-orange-600 mb-2" />
          <span className="text-sm font-medium">Settings</span>
        </Button>
      </div>
    </div>
  )
}