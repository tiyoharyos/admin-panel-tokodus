'use client'

import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import { Table, TableRow, TableCell } from '@/components/UI/Table'
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

const BASE_PRICES: Record<string, number> = {
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
    id: 'TOK-001', order_code: 'TOK-2024-001', customer_name: 'PT Sinar Jaya', brand: 'Brand A',
    category: 'Kardus Box 20x20', quantity: 1000, total_price: 12500000, status: 'completed',
    created_at: '2024-01-15', due_date: '2024-01-20', payment_status: 'paid', notes: 'Prioritas tinggi'
  },
  {
    id: 'TOK-002', order_code: 'TOK-2024-002', customer_name: 'CV Maju Bersama', brand: 'Brand B',
    category: 'Paper Bag Premium', quantity: 500, total_price: 8500000, status: 'processing',
    created_at: '2024-01-14', due_date: '2024-01-18', payment_status: 'unpaid', notes: 'Butuh desain khusus'
  },
  {
    id: 'TOK-003', order_code: 'TOK-2024-003', customer_name: 'UD Berkah', brand: 'Brand C',
    category: 'Sticker Vinyl', quantity: 2000, total_price: 5500000, status: 'pending',
    created_at: '2024-01-14', due_date: '2024-01-17', payment_status: 'unpaid', notes: 'Bulk order'
  },
  {
    id: 'TOK-004', order_code: 'TOK-2024-004', customer_name: 'PT Maju Jaya', brand: 'MJ',
    category: 'Corrugated Box', quantity: 1500, total_price: 6250000, status: 'shipped',
    created_at: '2024-01-20', due_date: '2024-01-30', payment_status: 'paid', notes: 'Sudah dikirim'
  },
  {
    id: 'TOK-005', order_code: 'TOK-2024-005', customer_name: 'CV Sentosa', brand: 'SENTOSA',
    category: 'Folding Carton', quantity: 800, total_price: 3200000, status: 'cancelled',
    created_at: '2024-01-18', due_date: '2024-01-28', payment_status: 'refunded', notes: 'Dibatalkan customer'
  }
]

// ===== UTILITIES =====
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num)
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
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
  return { totalOrders, totalRevenue, completedOrders, pendingOrders, averageOrderValue }
}

const calculatePrice = (category: string, quantity: number): number => {
  const basePrice = BASE_PRICES[category] || 10000
  return basePrice * quantity
}

const getDueDate = (): string => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}

// ===== ACTION BUTTON (konsisten dengan halaman lain) =====
function ActionButton({ onClick, icon, hoverColor, title }: {
  onClick: () => void; icon: string; hoverColor: string; title: string
}) {
  const cls: Record<string, string> = {
    blue:  'hover:text-blue-600 hover:bg-blue-50',
    amber: 'hover:text-amber-600 hover:bg-amber-50',
    red:   'hover:text-red-600 hover:bg-red-50',
    green: 'hover:text-green-600 hover:bg-green-50',
  }
  return (
    <button onClick={onClick} title={title}
      className={`p-2 text-gray-400 rounded-lg transition-colors ${cls[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

// ===== STATS CARD (gaya seragam) =====
function StatCard({ icon, label, value, sub, accent }: {
  icon: string; label: string; value: string | number; sub: string; accent: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon icon={icon} className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-1.5">{sub}</p>
      <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}60, transparent)` }} />
    </div>
  )
}

// ===== MAIN COMPONENT =====
export default function OrdersPage() {
  // State
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [loading, setLoading] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0
  })
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newOrderData, setNewOrderData] = useState({
    customer_name: '', brand: '', category: '', quantity: 1, status: 'pending' as Order['status'], notes: ''
  })
  const [editOrderData, setEditOrderData] = useState({
    customer_name: '', brand: '', category: '', quantity: 1, status: 'pending' as Order['status'],
    notes: '', payment_status: 'unpaid' as Order['payment_status']
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Derived
  const stats = useMemo(() => calculateStats(orders), [orders])
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.order_code.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.brand.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [orders, search, statusFilter, paymentFilter])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return filteredOrders.slice(start, start + pagination.itemsPerPage)
  }, [filteredOrders, pagination.currentPage, pagination.itemsPerPage])

  useEffect(() => {
    const totalItems = filteredOrders.length
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    setPagination(prev => ({
      ...prev, totalItems, totalPages,
      currentPage: prev.currentPage > totalPages && totalPages > 0 ? 1 : prev.currentPage
    }))
  }, [filteredOrders, pagination.itemsPerPage])

  // Handlers
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 600, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage: value, currentPage: 1 }))
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
      customer_name: order.customer_name, brand: order.brand, category: order.category,
      quantity: order.quantity, status: order.status, notes: order.notes || '',
      payment_status: order.payment_status
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleDeleteOrder = async (id: string, orderCode: string) => {
    const result = await SweetAlert.confirmDelete(`Hapus order ${orderCode}?`)
    if (result.isConfirmed) {
      try {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOrders(orders.filter(order => order.id !== id))
        SweetAlert.success('Berhasil!', 'Order berhasil dihapus')
      } catch {
        SweetAlert.error('Error!', 'Gagal menghapus order')
      } finally {
        setLoading(false)
      }
    }
  }

  const validateForm = (data: any, isEdit: boolean = false): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!data.customer_name?.trim()) errors.customer_name = 'Nama customer tidak boleh kosong'
    if (!data.brand?.trim()) errors.brand = 'Brand tidak boleh kosong'
    if (!data.category) errors.category = 'Kategori harus dipilih'
    if (!data.quantity || data.quantity < 1) errors.quantity = 'Quantity minimal 1'
    return errors
  }

  const handleInputChange = (field: string, value: any, isEdit: boolean = false) => {
    if (isEdit) {
      setEditOrderData(prev => ({ ...prev, [field]: value }))
    } else {
      setNewOrderData(prev => ({ ...prev, [field]: value }))
    }
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }))
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
        id: newId, order_code: newOrderCode, customer_name: newOrderData.customer_name,
        brand: newOrderData.brand, category: newOrderData.category, quantity: newOrderData.quantity,
        status: newOrderData.status, total_price: calculatePrice(newOrderData.category, newOrderData.quantity),
        created_at: new Date().toISOString().split('T')[0], due_date: getDueDate(),
        payment_status: 'unpaid', notes: newOrderData.notes
      }
      setOrders([newOrder, ...orders])
      setNewOrderData({ customer_name: '', brand: '', category: '', quantity: 1, status: 'pending', notes: '' })
      setIsCreateModalOpen(false)
      SweetAlert.success('Berhasil!', `Order ${newOrderCode} berhasil dibuat`)
    } catch {
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
      setOrders(orders.map(order => order.id === selectedOrder.id ? {
        ...order, customer_name: editOrderData.customer_name, brand: editOrderData.brand,
        category: editOrderData.category, quantity: editOrderData.quantity, status: editOrderData.status,
        payment_status: editOrderData.payment_status, notes: editOrderData.notes,
        total_price: calculatePrice(editOrderData.category, editOrderData.quantity)
      } : order))
      setIsEditModalOpen(false)
      setSelectedOrder(null)
      SweetAlert.success('Berhasil!', 'Order berhasil diupdate')
    } catch {
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

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Icon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER (gaya biru + dot amber) ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:clipboard-list-outline" className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Orders Management</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola dan lacak pesanan pelanggan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" onClick={() => window.location.reload()} icon="mdi:refresh">
            Refresh
          </Button>
          <Button variant="outline" size="md" onClick={() => alert('Export data')} icon="mdi:export">
            Export
          </Button>
          <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)} icon="mdi:plus">
            New Order
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS (gaya seragam) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="mdi:package-variant" label="Total Orders" value={stats.totalOrders} sub="semua pesanan" accent="#3b82f6" />
        <StatCard icon="mdi:cash-multiple" label="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub="total pendapatan" accent="#10b981" />
        <StatCard icon="mdi:check-circle" label="Completed" value={stats.completedOrders} sub="pesanan selesai" accent="#8b5cf6" />
        <StatCard icon="mdi:trending-up" label="Average Value" value={formatCurrency(stats.averageOrderValue)} sub="rata-rata per order" accent="#f59e0b" />
      </div>

      {/* ===== FILTER & TABLE CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
          
          {/* Filter bar */}
          <div className="flex flex-col md:flex-row gap-4 p-6 border-b border-slate-100">
            <div className="flex-1">
              <Input
                leftIcon="mdi:magnify"
                placeholder="Search by code, customer, or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            <Button variant="outline" onClick={handleClearFilters} icon="mdi:filter-remove">
              Clear
            </Button>
          </div>

          {/* Pagination top (if any) */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Menampilkan <span className="font-semibold text-slate-700">{paginatedData.length}</span> dari{' '}
                <span className="font-semibold text-slate-700">{filteredOrders.length}</span> orders
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Per halaman:</span>
                  <Select
                    value={pagination.itemsPerPage.toString()}
                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                    options={[
                      { value: '5', label: '5' },
                      { value: '10', label: '10' },
                      { value: '20', label: '20' },
                      { value: '50', label: '50' }
                    ]}
                    className="w-20"
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                  >
                    <Icon icon="mdi:skip-backward" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                  >
                    <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm text-slate-600">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                  >
                    <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                  >
                    <Icon icon="mdi:skip-forward" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabel menggunakan komponen global */}
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:package-variant-remove" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">No Orders Found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} icon="mdi:plus">
                Create New Order
              </Button>
            </div>
          ) : (
            <Table headers={[
              'Order', 'Customer', 'Product', 'Quantity', 'Amount', 'Status', 'Payment', 'Due Date', 'Actions'
            ]}>
              {paginatedData.map((order) => {
                const isOverdue = new Date(order.due_date) < new Date() && order.status !== 'completed' && order.status !== 'cancelled'
                return (
                  <TableRow key={order.id} hoverable={false} className="hover:bg-blue-50/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon icon="mdi:receipt" className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{order.order_code}</div>
                          <div className="text-xs text-slate-400">{formatDate(order.created_at)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{order.customer_name}</div>
                      <div className="text-xs text-slate-400">{order.brand}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info" size="sm">{order.category}</Badge>
                    </TableCell>
                    <TableCell>{formatNumber(order.quantity)} pcs</TableCell>
                    <TableCell className="font-bold text-green-600">{formatCurrency(order.total_price)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)} size="sm">
                        <Icon icon={getStatusIcon(order.status)} className="w-3 h-3 mr-1 inline" />
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(order.payment_status)} size="sm">
                        <Icon icon={getPaymentStatusIcon(order.payment_status)} className="w-3 h-3 mr-1 inline" />
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                        {formatDate(order.due_date)}
                        {isOverdue && <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-500 inline ml-1" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ActionButton onClick={() => handleViewDetails(order)} icon="mdi:eye-outline" hoverColor="blue" title="View Details" />
                        <ActionButton onClick={() => handleEditClick(order)} icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                        <ActionButton onClick={() => handleDeleteOrder(order.id, order.order_code)} icon="mdi:delete-outline" hoverColor="red" title="Delete" />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </Table>
          )}
        </div>

        {/* Pagination bottom */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="text-sm text-slate-500">
              Menampilkan <span className="font-semibold text-slate-700">
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
              </span> - <span className="font-semibold text-slate-700">
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
              </span> dari <span className="font-semibold text-slate-700">{pagination.totalItems}</span> orders
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={isViewModalOpen} onClose={handleCloseModals} title="Order Details" size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModals}>Close</Button>
            {selectedOrder && (
              <Button variant="primary" onClick={() => { handleCloseModals(); handleEditClick(selectedOrder) }}>
                Edit Order
              </Button>
            )}
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <Badge variant={getStatusVariant(selectedOrder.status)} size="lg">
                <Icon icon={getStatusIcon(selectedOrder.status)} className="w-4 h-4 mr-1 inline" />
                Status: {selectedOrder.status}
              </Badge>
              <Badge variant={getPaymentStatusVariant(selectedOrder.payment_status)} size="lg">
                <Icon icon={getPaymentStatusIcon(selectedOrder.payment_status)} className="w-4 h-4 mr-1 inline" />
                Payment: {selectedOrder.payment_status}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
                  Order Information
                </h4>
                <div className="space-y-2">
                  <div><p className="text-xs text-slate-400">Order Code</p><p className="font-semibold">{selectedOrder.order_code}</p></div>
                  <div><p className="text-xs text-slate-400">Created Date</p><p>{formatDate(selectedOrder.created_at)}</p></div>
                  <div><p className="text-xs text-slate-400">Due Date</p><p className={new Date(selectedOrder.due_date) < new Date() ? 'text-red-600' : ''}>{formatDate(selectedOrder.due_date)}</p></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:account" className="w-4 h-4 text-blue-600" />
                  Customer Information
                </h4>
                <div className="space-y-2">
                  <div><p className="text-xs text-slate-400">Customer Name</p><p className="font-medium">{selectedOrder.customer_name}</p></div>
                  <div><p className="text-xs text-slate-400">Brand</p><p>{selectedOrder.brand}</p></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:package-variant" className="w-4 h-4 text-blue-600" />
                  Product Information
                </h4>
                <div className="space-y-2">
                  <div><p className="text-xs text-slate-400">Category</p><Badge variant="info">{selectedOrder.category}</Badge></div>
                  <div><p className="text-xs text-slate-400">Quantity</p><p className="font-medium">{formatNumber(selectedOrder.quantity)} pcs</p></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:cash-multiple" className="w-4 h-4 text-blue-600" />
                  Payment Information
                </h4>
                <div className="space-y-2">
                  <div><p className="text-xs text-slate-400">Total Price</p><p className="text-2xl font-bold text-green-600">{formatCurrency(selectedOrder.total_price)}</p></div>
                </div>
              </div>
            </div>
            {selectedOrder.notes && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Icon icon="mdi:note-text" className="w-4 h-4" /> Notes
                </h4>
                <p className="text-blue-800">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== CREATE MODAL (konsisten) ===== */}
      <Modal
        isOpen={isCreateModalOpen} onClose={handleCloseModals} title="Create New Order" size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModals} disabled={isPosting}>Cancel</Button>
            <Button variant="primary" onClick={handleNewOrderSubmit} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-blue-50 border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Order Baru</p>
              <p className="text-xs text-blue-600">Isi semua field yang bertanda * untuk membuat order baru</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Customer Name *" placeholder="Enter customer name" value={newOrderData.customer_name}
              onChange={e => handleInputChange('customer_name', e.target.value)} leftIcon="mdi:account"
              error={formErrors.customer_name} />
            <Input label="Brand *" placeholder="Enter brand name" value={newOrderData.brand}
              onChange={e => handleInputChange('brand', e.target.value)} leftIcon="mdi:tag"
              error={formErrors.brand} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Category *" value={newOrderData.category}
              onChange={e => handleInputChange('category', e.target.value)} options={CATEGORY_OPTIONS}
              error={formErrors.category} />
            <Input label="Quantity *" type="number" placeholder="Enter quantity" value={newOrderData.quantity}
              onChange={e => handleInputChange('quantity', parseInt(e.target.value) || 1)} leftIcon="mdi:numeric"
              min="1" error={formErrors.quantity} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Status *" value={newOrderData.status}
              onChange={e => handleInputChange('status', e.target.value)}
              options={STATUS_OPTIONS.filter(opt => opt.value !== 'all')} />
          </div>
          <Input label="Notes" placeholder="Add any notes..." value={newOrderData.notes}
            onChange={e => handleInputChange('notes', e.target.value)} leftIcon="mdi:note-text" multiline rows={3} />
          {newOrderData.category && newOrderData.quantity > 0 && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="w-4 h-4" /> Preview Order
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">Order Code:</p><p className="font-medium">TOK-2024-{String(orders.length + 1).padStart(3, '0')}</p></div>
                <div><p className="text-slate-500">Created Date:</p><p className="font-medium">{new Date().toLocaleDateString('id-ID')}</p></div>
                <div><p className="text-slate-500">Estimated Price:</p><p className="font-medium text-green-600">{formatCurrency(calculatePrice(newOrderData.category, newOrderData.quantity))}</p></div>
                <div><p className="text-slate-500">Due Date:</p><p className="font-medium">{formatDate(getDueDate())}</p></div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL (konsisten) ===== */}
      <Modal
        isOpen={isEditModalOpen} onClose={handleCloseModals} title="Edit Order" size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModals} disabled={isPosting}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={isPosting} disabled={isPosting}>
              {isPosting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: '#3b82f608', borderColor: '#3b82f630' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#3b82f618' }}>
                <Icon icon="mdi:pencil-outline" className="w-5 h-5" style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Mode Edit</p>
                <p className="text-xs text-slate-500">Order Code: <span className="font-mono">{selectedOrder.order_code}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Customer Name *" value={editOrderData.customer_name}
                onChange={e => handleInputChange('customer_name', e.target.value, true)} leftIcon="mdi:account"
                error={formErrors.customer_name} />
              <Input label="Brand *" value={editOrderData.brand}
                onChange={e => handleInputChange('brand', e.target.value, true)} leftIcon="mdi:tag"
                error={formErrors.brand} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Category *" value={editOrderData.category}
                onChange={e => handleInputChange('category', e.target.value, true)} options={CATEGORY_OPTIONS}
                error={formErrors.category} />
              <Input label="Quantity *" type="number" value={editOrderData.quantity}
                onChange={e => handleInputChange('quantity', parseInt(e.target.value) || 1, true)} leftIcon="mdi:numeric"
                min="1" error={formErrors.quantity} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Status *" value={editOrderData.status}
                onChange={e => handleInputChange('status', e.target.value, true)} options={STATUS_OPTIONS.filter(opt => opt.value !== 'all')} />
              <Select label="Payment Status *" value={editOrderData.payment_status}
                onChange={e => handleInputChange('payment_status', e.target.value, true)} options={PAYMENT_STATUS_OPTIONS.filter(opt => opt.value !== 'all')} />
            </div>
            <Input label="Notes" placeholder="Add any notes..." value={editOrderData.notes}
              onChange={e => handleInputChange('notes', e.target.value, true)} leftIcon="mdi:note-text" multiline rows={3} />
            {editOrderData.category && editOrderData.quantity > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:check-circle" className="w-4 h-4" /> Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-slate-500">New Total:</p><p className="font-medium text-green-600">{formatCurrency(calculatePrice(editOrderData.category, editOrderData.quantity))}</p></div>
                  <div><p className="text-slate-500">New Status:</p><Badge variant={getStatusVariant(editOrderData.status)} size="sm">{editOrderData.status}</Badge></div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}