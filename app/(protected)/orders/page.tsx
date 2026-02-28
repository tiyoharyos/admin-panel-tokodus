// app/(protected)/orders/page.jsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import { Icon } from '@iconify/react'
import SweetAlert from '@/components/UI/SweetAlert'

// ===== TYPE DEFINITIONS =====
interface Order {
  id: string
  order_code: string
  customer_name: string
  brand: string
  category: string
  quantity: number
  total_price: number
  status: 'pending' | 'processing' | 'completed' | 'shipped' | 'cancelled'
  created_at: string
  due_date: string
  payment_status: 'paid' | 'unpaid' | 'refunded'
  notes?: string
}

interface Stats {
  totalOrders: number
  totalRevenue: number
  completedOrders: number
  pendingOrders: number
  averageOrderValue: number
}

interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

// ===== CONSTANTS =====
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' }
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'refunded', label: 'Refunded' }
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category' },
  { value: 'Kardus Box 20x20', label: 'Kardus Box 20x20' },
  { value: 'Paper Bag Premium', label: 'Paper Bag Premium' },
  { value: 'Sticker Vinyl', label: 'Sticker Vinyl' },
  { value: 'Corrugated Box', label: 'Corrugated Box' },
  { value: 'Folding Carton', label: 'Folding Carton' },
  { value: 'Duplek Medium', label: 'Duplek Medium' },
  { value: 'Singleface', label: 'Singleface' },
  { value: 'K200', label: 'K200' }
]

const BASE_PRICES = {
  'Kardus Box 20x20': 12500,
  'Paper Bag Premium': 17000,
  'Sticker Vinyl': 2750,
  'Corrugated Box': 9500,
  'Folding Carton': 7500,
  'Duplek Medium': 8000,
  'Singleface': 6500,
  'K200': 5500
}

// ===== MOCK DATA =====
const mockOrders: Order[] = [
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

// ===== UTILITIES =====
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num)
}

const formatDate = (dateString: string): string => {
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

const getStatusVariant = (status: string): string => {
  switch(status) {
    case 'completed': return 'success'
    case 'processing': return 'primary'
    case 'pending': return 'warning'
    case 'shipped': return 'info'
    case 'cancelled': return 'danger'
    default: return 'gray'
  }
}

const getStatusIcon = (status: string): string => {
  switch(status) {
    case 'completed': return 'mdi:check-circle'
    case 'processing': return 'mdi:progress-clock'
    case 'pending': return 'mdi:clock-outline'
    case 'shipped': return 'mdi:truck-delivery'
    case 'cancelled': return 'mdi:cancel'
    default: return 'mdi:circle'
  }
}

const getPaymentStatusVariant = (status: string): string => {
  switch(status) {
    case 'paid': return 'success'
    case 'unpaid': return 'danger'
    case 'refunded': return 'warning'
    default: return 'gray'
  }
}

const getPaymentStatusIcon = (status: string): string => {
  switch(status) {
    case 'paid': return 'mdi:cash-check'
    case 'unpaid': return 'mdi:cash-remove'
    case 'refunded': return 'mdi:cash-refund'
    default: return 'mdi:cash'
  }
}

const calculateStats = (orders: Order[]): Stats => {
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0)
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return {
    totalOrders,
    totalRevenue,
    completedOrders,
    pendingOrders,
    averageOrderValue
  }
}

const calculatePrice = (category: string, quantity: number): number => {
  const basePrice = BASE_PRICES[category as keyof typeof BASE_PRICES] || 10000
  return basePrice * quantity
}

const getDueDate = (): string => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}

// ===== MAIN COMPONENT =====
export default function OrdersPage() {
  // ===== STATE =====
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [loading, setLoading] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  
  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  })

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Form states
  const [newOrderData, setNewOrderData] = useState({
    customer_name: '',
    brand: '',
    category: '',
    quantity: 1,
    status: 'pending' as Order['status'],
    notes: ''
  })
  
  const [editOrderData, setEditOrderData] = useState({
    customer_name: '',
    brand: '',
    category: '',
    quantity: 1,
    status: 'pending' as Order['status'],
    notes: '',
    payment_status: 'unpaid' as Order['payment_status']
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ===== DERIVED STATE =====
  const stats = useMemo(() => calculateStats(orders), [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_code?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.brand?.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter
      
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [orders, search, statusFilter, paymentFilter])

  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }, [filteredOrders, pagination.currentPage, pagination.itemsPerPage])

  // ===== UPDATE PAGINATION =====
  useEffect(() => {
    const totalItems = filteredOrders.length
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: prev.currentPage > totalPages && totalPages > 0 ? 1 : prev.currentPage
    }))
  }, [filteredOrders, pagination.itemsPerPage])

  // ===== HANDLERS =====
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 600, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: value,
      currentPage: 1,
      totalPages: Math.ceil(filteredOrders.length / value)
    }))
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('all')
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order)
    setEditOrderData({
      customer_name: order.customer_name,
      brand: order.brand,
      category: order.category,
      quantity: order.quantity,
      status: order.status,
      notes: order.notes || '',
      payment_status: order.payment_status
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleDeleteOrder = async (id: string, orderCode: string) => {
    const result = await SweetAlert.confirmDelete(
      `Hapus order ${orderCode}?`,
    )
    
    if (result.isConfirmed) {
      try {
        setLoading(true)
        // Simulasi API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setOrders(orders.filter(order => order.id !== id))
        SweetAlert.success('Berhasil!', 'Order berhasil dihapus')
      } catch (error) {
        SweetAlert.error('Error!', 'Gagal menghapus order')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: Order['status']) => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ))
      
      SweetAlert.success('Berhasil!', `Status order diubah menjadi ${newStatus}`)
    } catch (error) {
      SweetAlert.error('Error!', 'Gagal mengupdate status order')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (data: any, isEdit: boolean = false): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!data.customer_name?.trim()) {
      errors.customer_name = 'Nama customer tidak boleh kosong'
    }

    if (!data.brand?.trim()) {
      errors.brand = 'Brand tidak boleh kosong'
    }

    if (!data.category) {
      errors.category = 'Kategori harus dipilih'
    }

    if (!data.quantity || data.quantity < 1) {
      errors.quantity = 'Quantity minimal 1'
    }

    return errors
  }

  const handleInputChange = (field: string, value: any, isEdit: boolean = false) => {
    if (isEdit) {
      setEditOrderData(prev => ({ ...prev, [field]: value }))
    } else {
      setNewOrderData(prev => ({ ...prev, [field]: value }))
    }
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleNewOrderSubmit = async () => {
    const errors = validateForm(newOrderData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPosting(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newId = `TOK-${String(orders.length + 1).padStart(3, '0')}`
      const newOrderCode = `TOK-2024-${String(orders.length + 1).padStart(3, '0')}`
      
      const newOrder: Order = {
        id: newId,
        order_code: newOrderCode,
        customer_name: newOrderData.customer_name,
        brand: newOrderData.brand,
        category: newOrderData.category,
        quantity: parseInt(newOrderData.quantity.toString()),
        status: newOrderData.status,
        total_price: calculatePrice(newOrderData.category, newOrderData.quantity),
        created_at: new Date().toISOString().split('T')[0],
        due_date: getDueDate(),
        payment_status: 'unpaid',
        notes: newOrderData.notes
      }
      
      setOrders([newOrder, ...orders])
      setNewOrderData({
        customer_name: '',
        brand: '',
        category: '',
        quantity: 1,
        status: 'pending',
        notes: ''
      })
      
      setIsCreateModalOpen(false)
      SweetAlert.success('Berhasil!', `Order ${newOrderCode} berhasil dibuat`)
      
    } catch (error) {
      console.error('Error creating order:', error)
      SweetAlert.error('Error!', 'Gagal membuat order baru')
    } finally {
      setIsPosting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedOrder) return

    const errors = validateForm(editOrderData, true)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPosting(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              customer_name: editOrderData.customer_name,
              brand: editOrderData.brand,
              category: editOrderData.category,
              quantity: parseInt(editOrderData.quantity.toString()),
              status: editOrderData.status,
              payment_status: editOrderData.payment_status,
              notes: editOrderData.notes,
              total_price: calculatePrice(editOrderData.category, editOrderData.quantity)
            } 
          : order
      ))
      
      setIsEditModalOpen(false)
      setSelectedOrder(null)
      SweetAlert.success('Berhasil!', 'Order berhasil diupdate')
      
    } catch (error) {
      console.error('Error updating order:', error)
      SweetAlert.error('Error!', 'Gagal mengupdate order')
    } finally {
      setIsPosting(false)
    }
  }

  const handleCloseModals = () => {
    if (!isPosting) {
      setIsViewModalOpen(false)
      setIsCreateModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedOrder(null)
      setFormErrors({})
    }
  }

  // ===== LOADING STATE =====
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Icon icon="mdi:clipboard-list" className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Memuat Data Orders...</p>
          <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Icon icon="mdi:clipboard-list-outline" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Orders Management
            </h1>
            <p className="text-gray-600 mt-1">Kelola dan lacak pesanan pelanggan</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-gray-600">
                <span className="font-medium">Total Orders:</span> {stats.totalOrders}
              </span>
              <span className="text-gray-600">
                <span className="font-medium">Revenue:</span> {formatCurrency(stats.totalRevenue)}
              </span>
              <span className="text-gray-600">
                <span className="font-medium">Completed:</span> {stats.completedOrders}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-gray-300 hover:bg-gray-50"
            icon="mdi:refresh"
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => alert('Export data')}
            className="border-gray-300 hover:bg-gray-50"
            icon="mdi:export"
          >
            Export
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
            icon="mdi:plus"
            disabled={loading}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full group-hover:bg-blue-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:package-variant" className="w-4 h-4 text-blue-600" />
              Total Orders
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            <p className="text-xs text-gray-500">semua pesanan</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full group-hover:bg-green-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-green-600" />
              Total Revenue
            </p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500">total pendapatan</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full group-hover:bg-purple-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4 text-purple-600" />
              Completed
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.completedOrders}</p>
            <p className="text-xs text-gray-500">pesanan selesai</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-all"></div>
          <div className="space-y-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Icon icon="mdi:trending-up" className="w-4 h-4 text-amber-600" />
              Average Value
            </p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
            <p className="text-xs text-gray-500">rata-rata per order</p>
          </div>
        </Card>
      </div>

      {/* ===== FILTERS ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4 p-6">
          <div className="flex-1">
            <Input
              leftIcon="mdi:magnify"
              placeholder="Search by code, customer, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            className="w-full md:w-48"
          />
          <Select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            options={PAYMENT_STATUS_OPTIONS}
            className="w-full md:w-48"
          />
          <Button
            variant="outline"
            onClick={handleClearFilters}
            icon="mdi:filter-remove"
            className="border-gray-300"
          >
            Clear
          </Button>
        </div>

        {/* ===== PAGINATION TOP ===== */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{paginatedData.length}</span> dari{' '}
              <span className="font-semibold">{filteredOrders.length}</span> orders
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per halaman:</span>
                <Select
                  value={pagination.itemsPerPage.toString()}
                  onChange={(e: any) => handleItemsPerPageChange(parseInt(e.target.value))}
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' }
                  ]}
                  className="w-20"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1"
                >
                  <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-gray-700">
                  Halaman {pagination.currentPage} dari {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1"
                >
                  <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ===== ORDERS TABLE ===== */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:package-variant-remove" className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              icon="mdi:plus"
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Create New Order
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((order) => {
                    const isOverdue = new Date(order.due_date) < new Date() && order.status !== 'completed' && order.status !== 'cancelled'
                    
                    return (
                      <tr key={order.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <Icon icon="mdi:receipt" className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{order.order_code}</span>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(order.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{order.customer_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{order.brand}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                            {order.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{formatNumber(order.quantity)}</span>
                          <span className="text-xs text-gray-500 ml-1">pcs</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-green-600">{formatCurrency(order.total_price)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusVariant(order.status)}>
                            <Icon icon={getStatusIcon(order.status)} className="w-3 h-3 mr-1" />
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getPaymentStatusVariant(order.payment_status)} size="sm">
                            <Icon icon={getPaymentStatusIcon(order.payment_status)} className="w-3 h-3 mr-1" />
                            {order.payment_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(order.due_date)}
                            {isOverdue && (
                              <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-500 inline ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Icon icon="mdi:eye" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditClick(order)}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id, order.order_code)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Icon icon="mdi:delete" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ===== PAGINATION BOTTOM ===== */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> -{' '}
                <span className="font-semibold">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span> dari{' '}
                <span className="font-semibold">{pagination.totalItems}</span> orders
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Halaman pertama"
                  >
                    <Icon icon="mdi:skip-backward" className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Halaman sebelumnya"
                  >
                    <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Halaman berikutnya"
                  >
                    <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Halaman terakhir"
                  >
                    <Icon icon="mdi:skip-forward" className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Ke:</span>
                  <input
                    type="number"
                    min="1"
                    max={pagination.totalPages}
                    value={pagination.currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value)
                      if (page >= 1 && page <= pagination.totalPages) {
                        handlePageChange(page)
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center text-sm"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ===== VIEW ORDER MODAL ===== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModals}
        title="📋 Order Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModals}>
              Close
            </Button>
            {selectedOrder && (
              <Button 
                variant="primary" 
                onClick={() => {
                  handleCloseModals()
                  handleEditClick(selectedOrder)
                }}
              >
                Edit Order
              </Button>
            )}
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge variant={getStatusVariant(selectedOrder.status)} size="lg">
                <Icon icon={getStatusIcon(selectedOrder.status)} className="w-4 h-4 mr-1" />
                Status: {selectedOrder.status}
              </Badge>
              <Badge variant={getPaymentStatusVariant(selectedOrder.payment_status)} size="lg">
                <Icon icon={getPaymentStatusIcon(selectedOrder.payment_status)} className="w-4 h-4 mr-1" />
                Payment: {selectedOrder.payment_status}
              </Badge>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                  Order Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Order Code</p>
                    <p className="text-gray-900 font-semibold">{selectedOrder.order_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created Date</p>
                    <p className="text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className={`font-medium ${new Date(selectedOrder.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(selectedOrder.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account" className="w-4 h-4 text-blue-600" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="text-gray-900 font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Brand</p>
                    <p className="text-gray-900">{selectedOrder.brand}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:package-variant" className="w-4 h-4 text-blue-600" />
                  Product Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <Badge className="bg-blue-100 text-blue-800 mt-1">
                      {selectedOrder.category}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="text-gray-900 font-medium">{formatNumber(selectedOrder.quantity)} pcs</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-blue-600" />
                  Payment Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Total Price</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedOrder.total_price)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Icon icon="mdi:note-text" className="w-4 h-4" />
                  Notes
                </h4>
                <p className="text-blue-800">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== CREATE ORDER MODAL ===== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        title="➕ Create New Order"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModals} disabled={isPosting}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleNewOrderSubmit}
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Informasi</h4>
                <p className="text-sm text-blue-700">
                  Isi semua field yang bertanda * untuk membuat order baru
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              placeholder="Enter customer name"
              value={newOrderData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              leftIcon="mdi:account"
              error={formErrors.customer_name}
              className={formErrors.customer_name ? 'border-red-500' : ''}
            />
            
            <Input
              label="Brand *"
              placeholder="Enter brand name"
              value={newOrderData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              leftIcon="mdi:tag"
              error={formErrors.brand}
              className={formErrors.brand ? 'border-red-500' : ''}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category *"
              value={newOrderData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              options={CATEGORY_OPTIONS}
              error={formErrors.category}
              className={formErrors.category ? 'border-red-500' : ''}
            />
            
            <Input
              label="Quantity *"
              type="number"
              placeholder="Enter quantity"
              value={newOrderData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              leftIcon="mdi:numeric"
              min="1"
              error={formErrors.quantity}
              className={formErrors.quantity ? 'border-red-500' : ''}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status *"
              value={newOrderData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={STATUS_OPTIONS.filter(opt => opt.value !== 'all')}
            />
          </div>
          
          <Input
            label="Notes"
            placeholder="Add any notes or special instructions..."
            value={newOrderData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            leftIcon="mdi:note-text"
            multiline
            rows={3}
          />

          {/* Preview */}
          {newOrderData.category && newOrderData.quantity > 0 && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                </div>
                Preview Order
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Order Code:</p>
                  <p className="font-medium text-gray-900">
                    TOK-2024-{String(orders.length + 1).padStart(3, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Created Date:</p>
                  <p className="font-medium text-gray-900">
                    {new Date().toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Estimated Price:</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(calculatePrice(newOrderData.category, newOrderData.quantity))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Due Date:</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(getDueDate())}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT ORDER MODAL ===== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        title="✏️ Edit Order"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModals} disabled={isPosting}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSubmit}
              loading={isPosting}
              disabled={isPosting}
            >
              {isPosting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Current Data Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Editing Order</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-blue-700 mb-1">Order Code:</p>
                      <p className="font-medium text-blue-900">
                        {selectedOrder.order_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Current Status:</p>
                      <Badge variant={getStatusVariant(selectedOrder.status)} size="sm">
                        {selectedOrder.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name *"
                placeholder="Enter customer name"
                value={editOrderData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value, true)}
                leftIcon="mdi:account"
                error={formErrors.customer_name}
                className={formErrors.customer_name ? 'border-red-500' : ''}
              />
              
              <Input
                label="Brand *"
                placeholder="Enter brand name"
                value={editOrderData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value, true)}
                leftIcon="mdi:tag"
                error={formErrors.brand}
                className={formErrors.brand ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category *"
                value={editOrderData.category}
                onChange={(e) => handleInputChange('category', e.target.value, true)}
                options={CATEGORY_OPTIONS}
                error={formErrors.category}
                className={formErrors.category ? 'border-red-500' : ''}
              />
              
              <Input
                label="Quantity *"
                type="number"
                placeholder="Enter quantity"
                value={editOrderData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1, true)}
                leftIcon="mdi:numeric"
                min="1"
                error={formErrors.quantity}
                className={formErrors.quantity ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status *"
                value={editOrderData.status}
                onChange={(e) => handleInputChange('status', e.target.value, true)}
                options={STATUS_OPTIONS.filter(opt => opt.value !== 'all')}
              />
              
              <Select
                label="Payment Status *"
                value={editOrderData.payment_status}
                onChange={(e) => handleInputChange('payment_status', e.target.value, true)}
                options={PAYMENT_STATUS_OPTIONS.filter(opt => opt.value !== 'all')}
              />
            </div>
            
            <Input
              label="Notes"
              placeholder="Add any notes or special instructions..."
              value={editOrderData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value, true)}
              leftIcon="mdi:note-text"
              multiline
              rows={3}
            />

            {/* Preview Update */}
            {editOrderData.category && editOrderData.quantity > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
                  </div>
                  Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">New Total:</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(calculatePrice(editOrderData.category, editOrderData.quantity))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">New Status:</p>
                    <Badge variant={getStatusVariant(editOrderData.status)} size="sm">
                      {editOrderData.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}