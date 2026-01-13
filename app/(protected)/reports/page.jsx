// app/(protected)/reports/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'

// Mock data for reports
const mockReportsData = {
  financial: {
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
  }
}

const reportTypes = [
  { id: 'financial', label: 'Financial Reports', icon: 'mdi:cash-multiple' },
  { id: 'production', label: 'Production Reports', icon: 'mdi:factory' },
  { id: 'materials', label: 'Material Reports', icon: 'mdi:package-variant' },
  { id: 'orders', label: 'Order Reports', icon: 'mdi:clipboard-list' },
  { id: 'customers', label: 'Customer Reports', icon: 'mdi:account-group' },
  { id: 'quality', label: 'Quality Reports', icon: 'mdi:chart-bar' }
]

const timeRanges = [
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
  const [viewMode, setViewMode] = useState('overview') // 'overview', 'detailed', 'charts'

  useEffect(() => {
    // Update report data when report type changes
    setReportData(mockReportsData[reportType] || mockReportsData.financial)
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
      alert(`Report generated for ${reportType} (${timeRange})`)
    }, 1500)
  }

  const handleExportReport = (format) => {
    setExporting(true)
    // Simulate export process
    setTimeout(() => {
      setExporting(false)
      alert(`${format.toUpperCase()} report exported successfully!`)
    }, 1000)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const getReportTitle = () => {
    const type = reportTypes.find(t => t.id === reportType)?.label || 'Report'
    const range = timeRanges.find(t => t.value === timeRange)?.label || 'Custom'
    return `${type} - ${range}`
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
              <Badge variant="info" icon="mdi:calendar">
                {getReportTitle()}
              </Badge>
              <Badge variant="success" icon="mdi:update">
                Last Updated: Today
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

      {/* Report Type Selection */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${
                  reportType === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <CustomIcon icon={type.icon} className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium text-center">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={timeRanges}
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
            />
          </div>
          
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              icon="mdi:chart-bar"
              fullWidth
            >
              Generate Report
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            {['overview', 'detailed', 'charts'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-md capitalize ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {mode} View
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {reportType === 'financial' ? 'Total Revenue' :
                 reportType === 'production' ? 'Completed Jobs' :
                 reportType === 'materials' ? 'Total Materials' :
                 'Total Orders'}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reportType === 'financial' ? formatCurrency(reportData.totalRevenue) :
                 reportType === 'production' ? reportData.completedJobs :
                 reportType === 'materials' ? reportData.totalMaterials :
                 reportData.totalOrders}
              </p>
              {reportData.revenueGrowth && (
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
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <CustomIcon 
                icon={reportTypes.find(t => t.id === reportType)?.icon || 'mdi:chart-bar'}
                className="w-6 h-6 text-blue-600"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {reportType === 'financial' ? 'Total Profit' :
                 reportType === 'production' ? 'Active Jobs' :
                 reportType === 'materials' ? 'Low Stock Items' :
                 'Pending Orders'}
              </p>
              <p className={`text-2xl font-bold mt-1 ${
                reportType === 'financial' ? 'text-green-600' :
                reportType === 'materials' ? 'text-red-600' :
                'text-gray-900'
              }`}>
                {reportType === 'financial' ? formatCurrency(reportData.totalProfit) :
                 reportType === 'production' ? reportData.activeJobs :
                 reportType === 'materials' ? reportData.lowStock :
                 reportData.pendingOrders}
              </p>
              {reportData.profitGrowth && (
                <div className="flex items-center mt-2">
                  <CustomIcon 
                    icon={getGrowthIcon(reportData.profitGrowth)} 
                    className={`w-4 h-4 mr-1 ${getGrowthColor(reportData.profitGrowth)}`}
                  />
                  <span className={`text-sm font-medium ${getGrowthColor(reportData.profitGrowth)}`}>
                    {reportData.profitGrowth > 0 ? '+' : ''}{reportData.profitGrowth}%
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${
              reportType === 'financial' ? 'bg-green-100' :
              reportType === 'materials' ? 'bg-red-100' :
              'bg-yellow-100'
            }`}>
              <CustomIcon 
                icon={
                  reportType === 'financial' ? 'mdi:cash' :
                  reportType === 'production' ? 'mdi:clock' :
                  reportType === 'materials' ? 'mdi:alert' :
                  'mdi:progress-clock'
                }
                className={`w-6 h-6 ${
                  reportType === 'financial' ? 'text-green-600' :
                  reportType === 'materials' ? 'text-red-600' :
                  'text-yellow-600'
                }`}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {reportType === 'financial' ? 'Avg Order Value' :
                 reportType === 'production' ? 'Avg Production Time' :
                 reportType === 'materials' ? 'Monthly Usage' :
                 'Avg Completion Time'}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reportType === 'financial' ? formatCurrency(reportData.avgOrderValue) :
                 reportType === 'production' ? reportData.avgProductionTime :
                 reportType === 'materials' ? formatNumber(reportData.monthlyUsage) + ' sheets' :
                 reportData.avgCompletionTime}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <CustomIcon 
                icon={
                  reportType === 'financial' ? 'mdi:calculator' :
                  reportType === 'production' ? 'mdi:timer' :
                  reportType === 'materials' ? 'mdi:package-down' :
                  'mdi:calendar-clock'
                }
                className="w-6 h-6 text-purple-600"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {reportType === 'financial' ? 'Total Cost' :
                 reportType === 'production' ? 'Efficiency Rate' :
                 reportType === 'materials' ? 'Inventory Value' :
                 'Customer Satisfaction'}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reportType === 'financial' ? formatCurrency(reportData.totalCost) :
                 reportType === 'production' ? reportData.efficiency + '%' :
                 reportType === 'materials' ? formatCurrency(reportData.totalValue) :
                 reportData.customerSatisfaction + '%'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <CustomIcon 
                icon={
                  reportType === 'financial' ? 'mdi:currency-usd-off' :
                  reportType === 'production' ? 'mdi:chart-line' :
                  reportType === 'materials' ? 'mdi:warehouse' :
                  'mdi:heart'
                }
                className="w-6 h-6 text-orange-600"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Report Content */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getReportTitle()}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {startDate} to {endDate}
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Financial Report */}
        {reportType === 'financial' && (
          <div className="space-y-6">
            {/* Top Customers */}
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
                        Number of Orders
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
                    {reportData.topCustomers.map((customer) => (
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
                          <div className="text-sm text-gray-900">{customer.orders}</div>
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

            {/* Monthly Revenue Chart */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:chart-line" />
                Monthly Revenue Trend
              </h4>
              <div className="space-y-4">
                {reportData.monthlyRevenue.map((month, index) => (
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
                          style={{ width: `${(month.revenue / Math.max(...reportData.monthlyRevenue.map(m => m.revenue))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Production Report */}
        {reportType === 'production' && (
          <div className="space-y-6">
            {/* Machine Utilization */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:robot-industrial" />
                Machine Utilization
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.topMachines.map((machine) => (
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

            {/* Monthly Production */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:chart-bar" />
                Monthly Production Volume
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Jobs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed Jobs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyProduction.map((month, index) => {
                      const completionRate = (month.completed / month.jobs) * 100
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{month.month}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{month.jobs}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{month.completed}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    completionRate > 90 ? 'bg-green-500' :
                                    completionRate > 70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{completionRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              completionRate > 90 ? 'success' :
                              completionRate > 70 ? 'warning' : 'danger'
                            }>
                              {completionRate > 90 ? 'Excellent' :
                               completionRate > 70 ? 'Good' : 'Needs Improvement'}
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
        )}

        {/* Materials Report */}
        {reportType === 'materials' && (
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
                        Usage (Sheets/Kg/Liter)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.topMaterials.map((material) => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(material.usage / Math.max(...reportData.topMaterials.map(m => m.usage))) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {((material.usage / reportData.monthlyUsage) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Trend */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:chart-areaspline" />
                Inventory Trend
              </h4>
              <div className="space-y-4">
                {reportData.inventoryTrend.map((month, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">{month.month}</div>
                    <div className="flex-1 ml-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Stock: {formatNumber(month.stock)} sheets</span>
                        <span className="text-purple-600">Value: {formatCurrency(month.value)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                          style={{ width: `${(month.stock / Math.max(...reportData.inventoryTrend.map(m => m.stock))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders Report */}
        {reportType === 'orders' && (
          <div className="space-y-6">
            {/* Top Brands */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:tag-multiple" />
                Top Brands Performance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.topBrands.map((brand) => (
                  <Card key={brand.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{brand.name}</p>
                        <p className="text-sm text-gray-500">{brand.orders} Orders</p>
                      </div>
                      <Badge variant="primary">
                        {formatCurrency(brand.revenue)}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Order Contribution</span>
                        <span>{((brand.orders / reportData.totalOrders) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(brand.orders / reportData.totalOrders) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg Order: {formatCurrency(brand.revenue / brand.orders)}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Trend */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon icon="mdi:chart-bell-curve" />
                Monthly Order Trend
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.orderTrend.map((month, index) => {
                      const prevMonth = reportData.orderTrend[index - 1]
                      const growth = prevMonth 
                        ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
                        : 0
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{month.month}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{month.orders}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600">
                              {formatCurrency(month.revenue)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(month.revenue / month.orders)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <CustomIcon 
                                icon={getGrowthIcon(growth)} 
                                className={`w-4 h-4 mr-1 ${getGrowthColor(growth)}`}
                              />
                              <span className={`text-sm font-medium ${getGrowthColor(growth)}`}>
                                {growth > 0 ? '+' : ''}{growth}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Export Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CustomIcon icon="mdi:file-pdf-box" className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h5 className="font-medium text-gray-900">PDF Report</h5>
              <p className="text-sm text-gray-500 mt-1">Download as PDF document</p>
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
              <h5 className="font-medium text-gray-900">Excel Report</h5>
              <p className="text-sm text-gray-500 mt-1">Download as Excel spreadsheet</p>
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
              <p className="text-sm text-gray-500 mt-1">Download raw data as CSV</p>
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
          Report Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Key Findings</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              {reportType === 'financial' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Revenue increased by {reportData.revenueGrowth}% compared to last period</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Top 3 customers contribute {(reportData.topCustomers.reduce((sum, c) => sum + (c.revenue / reportData.totalRevenue * 100), 0)).toFixed(1)}% of total revenue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Profit margin is {(reportData.totalProfit / reportData.totalRevenue * 100).toFixed(1)}%, aim for 40%</span>
                  </li>
                </>
              )}
              {reportType === 'production' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Overall efficiency rate is {reportData.efficiency}%, above target of 80%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Heidelberg machine shows highest utilization at 92%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Average production time increased by 0.3 days, needs optimization</span>
                  </li>
                </>
              )}
              {reportType === 'materials' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:alert-circle" className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{reportData.lowStock} materials are below minimum stock levels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Inventory value increased by 8% compared to last period</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:information" className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Duplek 250GSM is the most used material at {(reportData.topMaterials[0]?.usage / reportData.monthlyUsage * 100).toFixed(1)}%</span>
                  </li>
                </>
              )}
              {reportType === 'orders' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Customer satisfaction score is {reportData.customerSatisfaction}%, excellent rating</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>MBR brand contributes the highest revenue at {formatCurrency(reportData.topBrands[0]?.revenue)}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:alert-circle" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{reportData.pendingOrders} orders are still pending, follow up required</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              {reportType === 'financial' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Focus on upselling to top 3 customers to increase revenue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Review cost structure to improve profit margins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Consider offering bulk discounts to increase order values</span>
                  </li>
                </>
              )}
              {reportType === 'production' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Schedule preventive maintenance for underutilized machines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Optimize job scheduling to reduce production time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Cross-train operators for better machine utilization</span>
                  </li>
                </>
              )}
              {reportType === 'materials' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Replenish low stock materials immediately to avoid delays</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Negotiate bulk pricing with suppliers for high-usage materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Implement just-in-time inventory to reduce holding costs</span>
                  </li>
                </>
              )}
              {reportType === 'orders' && (
                <>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Follow up on pending orders to improve completion rate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Develop loyalty program for top brand customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Streamline order processing to reduce completion time</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:email-send" className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-gray-900">Email Report</h4>
          <p className="text-xs text-gray-500 mt-1">Send to stakeholders</p>
        </Card>
        
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:calendar-plus" className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-medium text-gray-900">Schedule</h4>
          <p className="text-xs text-gray-500 mt-1">Auto-generate reports</p>
        </Card>
        
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:chart-timeline" className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-gray-900">Compare</h4>
          <p className="text-xs text-gray-500 mt-1">Compare periods</p>
        </Card>
        
        <Card className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-full mx-auto mb-3">
            <CustomIcon icon="mdi:cog" className="w-6 h-6 text-orange-600" />
          </div>
          <h4 className="font-medium text-gray-900">Settings</h4>
          <p className="text-xs text-gray-500 mt-1">Customize reports</p>
        </Card>
      </div>
    </div>
  )
}