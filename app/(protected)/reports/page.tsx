// app/(protected)/reports/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import CustomIcon from '@/components/UI/Icon'
import { Table, TableRow, TableCell } from '@/components/UI/Table'
import SweetAlert from '@/components/UI/SweetAlert'

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
  { value: 'financial', label: '📊 Laporan Keuangan' },
  { value: 'production', label: '🏭 Laporan Produksi' },
  { value: 'materials', label: '📦 Laporan Material' },
  { value: 'orders', label: '📋 Laporan Pesanan' },
  { value: 'customers', label: '👥 Laporan Pelanggan' },
  { value: 'quality', label: '✅ Laporan Kualitas' }
]

const timeRangeOptions = [
  { value: 'week', label: '📅 Minggu Lalu' },
  { value: 'month', label: '📅 Bulan Lalu' },
  { value: 'quarter', label: '📅 Kuartal Lalu' },
  { value: 'year', label: '📅 Tahun Lalu' },
  { value: 'custom', label: '⚙️ Rentang Kustom' }
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
    if (mockReportsData[reportType]) {
      setReportData(mockReportsData[reportType])
    } else {
      setReportData(mockReportsData.financial)
    }
  }, [reportType])

  useEffect(() => {
    setIsCustomRange(timeRange === 'custom')
  }, [timeRange])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('id-ID').format(number)
  }

  const handleGenerateReport = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      SweetAlert.success('Berhasil!', `${reportData.title} telah digenerate untuk periode ${timeRangeOptions.find(t => t.value === timeRange)?.label}`)
    }, 1500)
  }

  const handleExportReport = (format) => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      SweetAlert.success('Berhasil!', `${reportData.title} berhasil diekspor sebagai ${format.toUpperCase()}!`)
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

  const getReportColor = () => {
    switch(reportType) {
      case 'financial': return 'from-blue-600 to-indigo-600'
      case 'production': return 'from-green-600 to-teal-600'
      case 'materials': return 'from-amber-600 to-orange-600'
      case 'orders': return 'from-purple-600 to-pink-600'
      case 'customers': return 'from-cyan-600 to-blue-600'
      case 'quality': return 'from-emerald-600 to-green-600'
      default: return 'from-blue-600 to-indigo-600'
    }
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

  // ===== COMPONENTS YANG SUDAH DISESUAIKAN =====
  
  // Financial Report Table Component
  const FinancialReportTable = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <CustomIcon icon="mdi:account-star" className="text-blue-600" />
          Top Customers
        </h4>
        <Badge variant="info" size="sm">
          {reportData.topCustomers?.length || 0} customers
        </Badge>
      </div>
      
      <Table
        headers={['Customer', 'Total Revenue', 'Orders', 'Avg Order', 'Contribution']}
        striped
        hoverable
      >
        {(reportData.topCustomers || []).map((customer) => (
          <TableRow key={customer.id} hoverable>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg">
                  <CustomIcon icon="mdi:account" className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500">ID: CUST-{customer.id.toString().padStart(3, '0')}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="font-bold text-green-600">{formatCurrency(customer.revenue)}</div>
            </TableCell>
            <TableCell>
              <Badge variant="info">{customer.orders} orders</Badge>
            </TableCell>
            <TableCell>
              <div className="text-gray-900">
                {formatCurrency(customer.revenue / customer.orders)}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(customer.revenue / reportData.totalRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {((customer.revenue / reportData.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )

  // Production Report Table Component
  const ProductionReportTable = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <CustomIcon icon="mdi:robot-industrial" className="text-green-600" />
          Machine Utilization
        </h4>
        <Badge variant="success" size="sm">
          {reportData.topMachines?.length || 0} machines
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(reportData.topMachines || []).map((machine) => (
          <Card key={machine.id} className="p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{machine.name}</p>
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
  )

  // Materials Report Table Component
  const MaterialsReportTable = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <CustomIcon icon="mdi:package-variant" className="text-amber-600" />
          Top Materials Usage
        </h4>
        <Badge variant="warning" size="sm">
          {reportData.topMaterials?.length || 0} materials
        </Badge>
      </div>
      
      <Table
        headers={['Material', 'Usage', 'Total Value', 'Unit Cost']}
        striped
        hoverable
      >
        {(reportData.topMaterials || []).map((material) => (
          <TableRow key={material.id} hoverable>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg">
                  <CustomIcon icon="mdi:package" className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{material.name}</div>
                  <div className="text-xs text-gray-500">ID: MAT-{material.id.toString().padStart(3, '0')}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium text-gray-900">{formatNumber(material.usage)}</div>
            </TableCell>
            <TableCell>
              <div className="font-bold text-purple-600">
                {formatCurrency(material.value)}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-gray-900">
                {formatCurrency(material.value / material.usage)}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )

  // Orders Report Table Component
  const OrdersReportTable = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <CustomIcon icon="mdi:tag" className="text-purple-600" />
          Top Brands by Revenue
        </h4>
        <Badge variant="info" size="sm">
          {reportData.topBrands?.length || 0} brands
        </Badge>
      </div>
      
      <Table
        headers={['Brand', 'Orders', 'Total Revenue', 'Avg Order Value']}
        striped
        hoverable
      >
        {(reportData.topBrands || []).map((brand) => (
          <TableRow key={brand.id} hoverable>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg">
                  <CustomIcon icon="mdi:tag" className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{brand.name}</div>
                  <div className="text-xs text-gray-500">Brand ID: {brand.id}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="info">{brand.orders} orders</Badge>
            </TableCell>
            <TableCell>
              <div className="font-bold text-green-600">
                {formatCurrency(brand.revenue)}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-gray-900">
                {formatCurrency(brand.revenue / brand.orders)}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )

  // Customers Report Table Component
  const CustomersReportTable = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <CustomIcon icon="mdi:account-star" className="text-cyan-600" />
          Top Customers by Lifetime Value
        </h4>
        <Badge variant="info" size="sm">
          {reportData.topCustomers?.length || 0} customers
        </Badge>
      </div>
      
      <Table
        headers={['Customer', 'Total Orders', 'Lifetime Value', 'Avg Order Value']}
        striped
        hoverable
      >
        {(reportData.topCustomers || []).map((customer) => (
          <TableRow key={customer.id} hoverable>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-cyan-50 text-cyan-600 rounded-lg">
                  <CustomIcon icon="mdi:account-star" className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500">ID: CUST-{customer.id.toString().padStart(3, '0')}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="info">{customer.orders} orders</Badge>
            </TableCell>
            <TableCell>
              <div className="font-bold text-green-600">
                {formatCurrency(customer.value)}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-gray-900">
                {formatCurrency(customer.value / customer.orders)}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )

  // Quality Report Table Component
  const QualityReportTable = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <CustomIcon icon="mdi:alert-circle" className="text-emerald-600" />
          Top Defects
        </h4>
        <Badge variant={reportData.defectRate > 10 ? 'danger' : 'success'} size="sm">
          Defect Rate: {reportData.defectRate}%
        </Badge>
      </div>
      
      <Table
        headers={['Defect Type', 'Count', 'Percentage', 'Severity']}
        striped
        hoverable
      >
        {(reportData.topDefects || []).map((defect) => {
          const percentage = (defect.count / (reportData.defects || 1)) * 100
          let severity = 'low'
          if (percentage > 30) severity = 'high'
          else if (percentage > 15) severity = 'medium'
          
          return (
            <TableRow key={defect.id} hoverable>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg">
                    <CustomIcon icon="mdi:alert-circle" className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-gray-900">{defect.type}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-gray-900">{defect.count}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {percentage.toFixed(1)}%
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={
                  severity === 'high' ? 'danger' : 
                  severity === 'medium' ? 'warning' : 'info'
                }>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </Table>
    </div>
  )

  // Render Report Content based on type
  const renderReportContent = () => {
    switch(reportType) {
      case 'financial': return <FinancialReportTable />
      case 'production': return <ProductionReportTable />
      case 'materials': return <MaterialsReportTable />
      case 'orders': return <OrdersReportTable />
      case 'customers': return <CustomersReportTable />
      case 'quality': return <QualityReportTable />
      default: return <FinancialReportTable />
    }
  }

  // ===== MAIN UI - DISESUAIKAN DENGAN BOX MODELS =====
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header dengan judul */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br ${getReportColor()} rounded-xl shadow-lg`}>
              <CustomIcon icon={getReportIcon()} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-1">Lihat laporan detail dan analisis untuk bisnis Anda</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            icon="mdi:printer"
            onClick={handlePrintReport}
            className="border-gray-300 hover:bg-gray-50"
          >
            Print
          </Button>
          <Button
            variant="primary"
            icon="mdi:download"
            onClick={() => handleExportReport('pdf')}
            loading={exporting}
            disabled={exporting}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20"
          >
            {exporting ? 'Mengekspor...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid - 3 cards seperti Box Models */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                <CustomIcon icon={getReportIcon()} className="w-6 h-6 text-blue-700" />
              </div>
              <Badge variant="primary" className="text-xs font-semibold">
                {reportTypeOptions.find(t => t.value === reportType)?.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Jenis Laporan</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold text-gray-900">{reportData.title}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">{reportData.description}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                <CustomIcon icon="mdi:calendar" className="w-6 h-6 text-green-700" />
              </div>
              <Badge variant="success" className="text-xs font-semibold">
                {timeRangeOptions.find(t => t.value === timeRange)?.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Periode</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {timeRange === 'custom' ? 'Custom' : timeRange}
                </p>
                <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  {isCustomRange ? `${startDate} - ${endDate}` : 'Terpilih'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Rentang waktu laporan</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
                <CustomIcon icon="mdi:chart-box" className="w-6 h-6 text-purple-700" />
              </div>
              <Badge variant="info" className="text-xs font-semibold">
                Generated
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Data Terbaru</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {new Date().toLocaleDateString('id-ID')}
                </p>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString('id-ID')}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Laporan diperbarui secara real-time</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Controls Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CustomIcon icon="mdi:chart-box" className="w-4 h-4" />
              Jenis Laporan
            </label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={reportTypeOptions}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CustomIcon icon="mdi:calendar" className="w-4 h-4" />
              Rentang Waktu
            </label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={timeRangeOptions}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CustomIcon icon="mdi:calendar-start" className="w-4 h-4" />
              Tanggal Mulai
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!isCustomRange}
              className={!isCustomRange ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CustomIcon icon="mdi:calendar-end" className="w-4 h-4" />
              Tanggal Akhir
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!isCustomRange}
              className={!isCustomRange ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            />
          </div>
        </div>

        {/* Report Description */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <CustomIcon icon="mdi:information" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">{reportData.title}</p>
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
            className="border-gray-300 hover:bg-gray-50"
          >
            Reset Filter
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon="mdi:content-save"
              onClick={() => SweetAlert.info('Simpan', 'Laporan disimpan ke dashboard')}
              className="border-gray-300 hover:bg-gray-50"
            >
              Simpan Laporan
            </Button>
            <Button
              variant="primary"
              icon="mdi:chart-bar"
              onClick={handleGenerateReport}
              loading={loading}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {loading ? 'Mengenerate...' : 'Generate Laporan'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content Card */}
      <Card className="shadow-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-r ${getReportColor().replace('from-', 'from-').replace('to-', 'to-')} bg-opacity-20 rounded-lg`}>
                <CustomIcon icon={getReportIcon()} className="w-5 h-5" style={{ color: getReportColor().split(' ')[0].replace('from-', '') + '600' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detail Laporan</h3>
                <p className="text-sm text-gray-600">
                  {reportData.title} • Periode: {startDate} sampai {endDate}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="mdi:file-pdf-box"
              onClick={() => handleExportReport('pdf')}
              loading={exporting}
              disabled={exporting}
              className="border-gray-300 hover:bg-gray-50"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="mdi:file-excel"
              onClick={() => handleExportReport('excel')}
              loading={exporting}
              disabled={exporting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="mdi:file-chart"
              onClick={() => handleExportReport('csv')}
              loading={exporting}
              disabled={exporting}
              className="border-gray-300 hover:bg-gray-50"
            >
              CSV
            </Button>
          </div>
        </div>
        
        {/* Report Content */}
        {renderReportContent()}

        {/* Export Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CustomIcon icon="mdi:export" className="w-5 h-5" />
            Ekspor Laporan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 text-center hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
              <div className="text-red-400 mb-4">
                <CustomIcon icon="mdi:file-pdf-box" className="w-12 h-12 mx-auto" />
              </div>
              <h5 className="font-semibold text-gray-900">PDF Document</h5>
              <p className="text-sm text-gray-500 mt-1">Format PDF profesional</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleExportReport('pdf')}
                loading={exporting}
                disabled={exporting}
                icon="mdi:download"
              >
                Ekspor PDF
              </Button>
            </Card>
            
            <Card className="p-5 text-center hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
              <div className="text-green-400 mb-4">
                <CustomIcon icon="mdi:file-excel" className="w-12 h-12 mx-auto" />
              </div>
              <h5 className="font-semibold text-gray-900">Excel Spreadsheet</h5>
              <p className="text-sm text-gray-500 mt-1">Siap untuk analisis data</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => handleExportReport('excel')}
                loading={exporting}
                disabled={exporting}
                icon="mdi:download"
              >
                Ekspor Excel
              </Button>
            </Card>
            
            <Card className="p-5 text-center hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
              <div className="text-blue-400 mb-4">
                <CustomIcon icon="mdi:file-chart" className="w-12 h-12 mx-auto" />
              </div>
              <h5 className="font-semibold text-gray-900">CSV Data</h5>
              <p className="text-sm text-gray-500 mt-1">Data mentah untuk pemrosesan</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => handleExportReport('csv')}
                loading={exporting}
                disabled={exporting}
                icon="mdi:download"
              >
                Ekspor CSV
              </Button>
            </Card>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-4 sm:mb-0">
            <div className="flex items-center gap-2">
              <CustomIcon icon="mdi:information-outline" className="w-4 h-4 text-gray-400" />
              <span>Laporan digenerate pada {new Date().toLocaleString('id-ID')}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon="mdi:printer"
            onClick={handlePrintReport}
            className="border-gray-300 hover:bg-gray-50"
          >
            Print Laporan
          </Button>
        </div>
      </Card>

      {/* Report Insights Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <CustomIcon icon="mdi:lightbulb-on" className="w-5 h-5" />
          Insight & Rekomendasi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-3">Temuan Utama</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CustomIcon icon="mdi:check-circle" className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Pertumbuhan Positif</p>
                  <p className="text-sm text-blue-700">Revenue meningkat {reportData.revenueGrowth || '0'}% dibanding periode sebelumnya</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CustomIcon icon="mdi:chart-pie" className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Konsentrasi Pelanggan</p>
                  <p className="text-sm text-blue-700">Top 3 customers berkontribusi {Math.round((reportData.topCustomers?.reduce((sum, c) => sum + (c.revenue / (reportData.totalRevenue || 1) * 100), 0) || 0))}% dari total revenue</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-3">Rekomendasi</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Fokus pada Top Customers</p>
                  <p className="text-sm text-blue-700">Tawarkan layanan tambahan kepada top 3 customers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CustomIcon icon="mdi:star" className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Optimasi Biaya</p>
                  <p className="text-sm text-blue-700">Review kontrak supplier untuk meningkatkan profit margin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center border-gray-200 hover:bg-gray-50"
          onClick={() => SweetAlert.info('Email', 'Fitur email laporan')}
        >
          <CustomIcon icon="mdi:email-send" className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium">Email Laporan</span>
        </Button>
        
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center border-gray-200 hover:bg-gray-50"
          onClick={() => SweetAlert.info('Jadwal', 'Fitur jadwal laporan')}
        >
          <CustomIcon icon="mdi:calendar-plus" className="w-6 h-6 text-green-600 mb-2" />
          <span className="text-sm font-medium">Jadwalkan</span>
        </Button>
        
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center border-gray-200 hover:bg-gray-50"
          onClick={() => SweetAlert.info('Bandingkan', 'Fitur bandingkan periode')}
        >
          <CustomIcon icon="mdi:chart-timeline" className="w-6 h-6 text-purple-600 mb-2" />
          <span className="text-sm font-medium">Bandingkan</span>
        </Button>
        
        <Button
          variant="outline"
          className="p-4 h-auto flex flex-col items-center justify-center border-gray-200 hover:bg-gray-50"
          onClick={() => SweetAlert.info('Pengaturan', 'Fitur pengaturan laporan')}
        >
          <CustomIcon icon="mdi:cog" className="w-6 h-6 text-orange-600 mb-2" />
          <span className="text-sm font-medium">Pengaturan</span>
        </Button>
      </div>
    </div>
  )
}