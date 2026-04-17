// app/(protected)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { Table, TableRow, TableCell } from '@/components/UI/Table';

// ============================================================
// MOCK DATA (unchanged)
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
    productivity: 87,
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
      due_date: '2024-01-20',
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
      due_date: '2024-01-18',
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
      due_date: '2024-01-17',
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
      due_date: '2024-01-19',
    },
  ],
  topProducts: [
    { id: 1, name: 'Kardus Box 20x20', sales: 1234, growth: 15.2 },
    { id: 2, name: 'Paper Bag Premium', sales: 987, growth: 12.5 },
    { id: 3, name: 'Sticker Vinyl', sales: 856, growth: 8.3 },
  ],
  lowStockMaterials: [
    { id: 1, name: 'Tinta Hitam CMYK', stock: 12, unit: 'liter', min: 20, supplier: 'CV Supplier B', type: 'Consumable' },
    { id: 2, name: 'Lem PVA Premium', stock: 8, unit: 'kg', min: 15, supplier: 'PT Supplier D', type: 'Consumable' },
  ],
};

const salesByMonth = [
  { month: 'Jan', sales: 125000000, growth: '+5.2%' },
  { month: 'Feb', sales: 142000000, growth: '+13.6%' },
  { month: 'Mar', sales: 138000000, growth: '-2.8%' },
  { month: 'Apr', sales: 165000000, growth: '+19.6%' },
  { month: 'Mei', sales: 189000000, growth: '+14.5%' },
  { month: 'Jun', sales: 210000000, growth: '+11.1%' },
  { month: 'Jul', sales: 198000000, growth: '-5.7%' },
  { month: 'Agu', sales: 225000000, growth: '+13.6%' },
  { month: 'Sep', sales: 242000000, growth: '+7.6%' },
  { month: 'Okt', sales: 268000000, growth: '+10.7%' },
  { month: 'Nov', sales: 285000000, growth: '+6.3%' },
  { month: 'Des', sales: 310000000, growth: '+8.8%' },
];

const orderStatusCount = {
  completed: 32,
  processing: 8,
  pending: 5,
  shipped: 3,
};

const categorySales = [
  { name: 'Kardus Box', value: 42500000, percent: 42 },
  { name: 'Paper Bag', value: 28900000, percent: 28 },
  { name: 'Sticker', value: 18500000, percent: 18 },
  { name: 'Karton Box', value: 15200000, percent: 12 },
];

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

// Local Badge component (matching box-models style)
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: `${color}18`, color }}
    >
      {children}
    </span>
  );
}

// ============================================================
// STATS CARDS (no red – warning card uses orange)
// ============================================================

function StatsCards({ stats }: { stats: typeof mockData.stats }) {
  const items = [
    {
      icon: 'mdi:package-variant-closed',
      label: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      sub: `+${stats.orderGrowth}% vs last month`,
      accent: '#3b82f6', // blue
    },
    {
      icon: 'mdi:factory',
      label: 'Active Production',
      value: stats.activeProduction,
      sub: 'currently running',
      accent: '#f59e0b', // amber
    },
    {
      icon: 'mdi:alert-circle-outline',
      label: 'Low Stock Items',
      value: stats.lowStockMaterials,
      sub: 'requires restocking',
      accent: '#f97316', // orange (replaces red)
    },
  ];

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
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${s.accent}15` }}
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
  );
}

// ============================================================
// BOTTOM STATS CARDS (additional metrics)
// ============================================================

function BottomStats({ stats }: { stats: typeof mockData.stats }) {
  const items = [
    {
      label: 'Customer Satisfaction',
      value: `${stats.customerSatisfaction}%`,
      trend: '+5.2% from last month',
      icon: 'mdi:account-heart',
      accent: '#3b82f6',
    },
    {
      label: 'Productivity',
      value: `${stats.productivity}%`,
      trend: '+3.8% from last month',
      icon: 'mdi:progress-clock',
      accent: '#10b981',
    },
    {
      label: 'Avg. Order Value',
      value: formatCurrency(8500000),
      trend: '+12.3% from last month',
      icon: 'mdi:chart-timeline',
      accent: '#8b5cf6',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((s, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Icon icon="mdi:trending-up" className="w-3 h-3" />
                {s.trend}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.accent}15` }}
            >
              <Icon icon={s.icon} className="w-6 h-6" style={{ color: s.accent }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header with icon and time range toggle (blue instead of red) */}
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
            <p className="text-slate-500 mt-0.5 text-sm">Ringkasan performa bisnis & operasional</p>
          </div>
        </div>

        {/* Time range toggle (active background now blue) */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-slate-50'
              }`}
            >
              {range === 'week' ? 'Minggu Ini' : range === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
            </button>
          ))}
        </div>
      </div>

      {/* First row: main stats cards */}
      <StatsCards stats={mockData.stats} />

      {/* Second row: additional metrics */}
      <BottomStats stats={mockData.stats} />

      {/* Third row: Two columns - Left: Sales Trend, Right: Order Status + Category Sales stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column: Sales Trend Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                <Icon icon="mdi:trending-up" className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Trend Penjualan per Bulan</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Bulan</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Penjualan</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salesByMonth.map((item) => {
                  const isPositive = item.growth.startsWith('+');
                  const badgeColor = isPositive ? '#10b981' : '#f59e0b'; // green for positive, orange for negative (no red)
                  return (
                    <tr key={item.month} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{item.month}</td>
                      <td className="px-5 py-3 text-green-600 font-medium">{formatCurrency(item.sales)}</td>
                      <td className="px-5 py-3">
                        <Badge color={badgeColor}>{item.growth}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: stacked cards */}
        <div className="space-y-5">
          {/* Order Status Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50">
                <Icon icon="mdi:chart-pie" className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Distribusi Status Pesanan</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(orderStatusCount).map(([status, count]) => {
                const total = Object.values(orderStatusCount).reduce((a, b) => a + b, 0);
                const percent = (count / total) * 100;
                const statusColors: Record<string, string> = {
                  completed: '#10b981',
                  processing: '#3b82f6',
                  pending: '#f59e0b',
                  shipped: '#8b5cf6',
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-slate-600">{status}</span>
                      <span className="font-semibold text-slate-800">
                        {count} ({Math.round(percent)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: statusColors[status] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Penjualan per Kategori Produk (now directly below Order Status) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                <Icon icon="mdi:chart-bar" className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Penjualan per Kategori Produk</h3>
            </div>
            <div className="space-y-4">
              {categorySales.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{cat.name}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percent}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fifth row: Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Pesanan Terbaru</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {mockData.stats.pendingOrders} pending, {mockData.stats.completedOrders} completed
              </p>
            </div>
            <Button variant="ghost" size="sm" icon="mdi:arrow-right">
              Lihat Semua
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Order Code</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Total</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockData.recentOrders.map((order) => {
                let statusColor = '#3b82f6'; // default blue
                if (order.status === 'completed') statusColor = '#10b981';
                else if (order.status === 'processing') statusColor = '#3b82f6';
                else if (order.status === 'pending') statusColor = '#f59e0b';
                else if (order.status === 'shipped') statusColor = '#8b5cf6';
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-blue-600">{order.order_code}</td>
                    <td className="px-5 py-3 text-slate-800">{order.customer_name}</td>
                    <td className="px-5 py-3 text-slate-600">{order.category}</td>
                    <td className="px-5 py-3 text-green-600 font-medium">{formatCurrency(order.total_price)}</td>
                    <td className="px-5 py-3">
                      <Badge color={statusColor}>{order.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          Menampilkan {mockData.recentOrders.length} pesanan terbaru
        </div>
      </div>
    </div>
  );
}