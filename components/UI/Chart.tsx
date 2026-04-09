import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Icon } from '@iconify/react'

interface SalesDataPoint {
  name: string
  sales: number
  orders: number
}

interface StatusDataPoint {
  name: string
  value: number
  color: string
}

// Warna sesuai tema yang digunakan
const COLORS = {
  primary: '#3b82f6',
  amber: '#f59e0b',
  green: '#10b981',
  purple: '#8b5cf6',
  red: '#ef4444',
  slate: '#64748b'
}

interface SalesTrendChartProps {
  data: SalesDataPoint[]
  height?: number
  title?: string
}

export function SalesTrendChart({ data, height = 300, title = 'Sales Trend' }: SalesTrendChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="mdi:chart-line" className="text-blue-600 text-xl" />
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="sales" 
            name="Sales (IDR)" 
            stroke={COLORS.primary} 
            strokeWidth={2}
            dot={{ fill: COLORS.primary, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="orders" 
            name="Orders" 
            stroke={COLORS.amber} 
            strokeWidth={2}
            dot={{ fill: COLORS.amber, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface OrderStatusChartProps {
  data: StatusDataPoint[]
  height?: number
  title?: string
}

export function OrderStatusChart({ data, height = 300, title = 'Order Status Distribution' }: OrderStatusChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="mdi:chart-pie" className="text-green-600 text-xl" />
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface CategoryBarChartProps {
  data: Array<{ name: string; value: number }>
  height?: number
  title?: string
}

export function CategoryBarChart({ data, height = 300, title = 'Top Categories by Sales' }: CategoryBarChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="mdi:chart-bar" className="text-purple-600 text-xl" />
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px'
            }}
          />
          <Bar dataKey="value" name="Sales (IDR)" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}