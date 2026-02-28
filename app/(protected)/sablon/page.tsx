// app/(protected)/box-models/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ============ TYPES ============
interface FormulaComponent {
  id?: string
  box_model_id?: string
  target: 'panjang' | 'lebar' | string
  source: 'P' | 'L' | 'T' | 'A' | 'B' | 'C' | string
  multiplier: number
  allowance_mm?: number
  sort_order?: number
}

interface BoxModel {
  id: string
  kode: string
  namaModel: string
  deskripsi: string
  status: boolean
  status_bm: string
  createdAt: string
  updatedAt: string
  formulaComponents: FormulaComponent[]
  hasFormula: boolean
  category: string
}

interface Stats {
  totalModels: number
  activeModels: number
  withFormulas: number
  withoutFormulas: number
  mailerBoxCount: number
  shoeBoxCount: number
  foodBoxCount: number
  premiumBoxCount: number
}

// ============ API TYPES ============
interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

interface BoxModelApiItem {
  id_bm?: string | number
  code?: string
  name?: string
  description?: string
  category?: string
  status_bm?: string | number
  created_at?: string
  updated_at?: string
}

interface FormulaApiItem {
  id_bfc?: string | number
  target?: string
  source?: string
  multiplier?: string | number
  allowance_mm?: string | number
  sort_order?: string | number
}

interface FormulaApiResponse {
  status: number
  data?: {
    formula?: FormulaApiItem | FormulaApiItem[]
  }
}

// ============ CONSTANTS ============
const SOURCE_OPTIONS = [
  { value: 'P', label: 'P (Panjang Produk - cm)' },
  { value: 'L', label: 'L (Lebar Produk - cm)' },
  { value: 'T', label: 'T (Tinggi Produk - cm)' },
  { value: 'A', label: 'A (Panjang ×10 - mm)' },
  { value: 'B', label: 'B (Lebar ×10 - mm)' },
  { value: 'C', label: 'C (Tinggi ×10 - mm)' }
]

const TARGET_OPTIONS = [
  { value: 'panjang', label: 'Panjang' },
  { value: 'lebar', label: 'Lebar' }
]

const CATEGORY_OPTIONS = [
  { value: 'Mailer Box', label: 'Mailer Box' },
  { value: 'Shoe Box', label: 'Shoe Box' },
  { value: 'Food Box', label: 'Food Box' },
  { value: 'Premium Box', label: 'Premium Box' }
]

const BASE_ADD_FORM = {
  code: '',
  name: '',
  description: '',
  category: 'Mailer Box',
  status_bm: '1'
}

// ============ META CONSTANTS ============
const BOX_META: Record<string, { icon: string; color: string; bg: string; gradient: string }> = {
  'Mailer Box': { 
    icon: 'mdi:package-variant-closed', 
    color: '#3b82f6', 
    bg: '#eff6ff',
    gradient: 'from-blue-50 to-blue-100/50'
  },
  'Shoe Box': { 
    icon: 'mdi:shoe-sneaker', 
    color: '#10b981', 
    bg: '#ecfdf5',
    gradient: 'from-emerald-50 to-emerald-100/50'
  },
  'Food Box': { 
    icon: 'mdi:food', 
    color: '#f59e0b', 
    bg: '#fffbeb',
    gradient: 'from-amber-50 to-amber-100/50'
  },
  'Premium Box': { 
    icon: 'mdi:crown', 
    color: '#8b5cf6', 
    bg: '#f5f3ff',
    gradient: 'from-purple-50 to-purple-100/50'
  },
}
const DEFAULT_META = { 
  icon: 'mdi:package-variant', 
  color: '#64748b', 
  bg: '#f8fafc',
  gradient: 'from-slate-50 to-slate-100/50'
}

// ============ UTILITIES ============
const generateCode = (existingCodes: string[]): string => {
  const numericCodes = existingCodes.filter(code => /^\d+$/.test(code)).map(Number)
  if (numericCodes.length) return (Math.max(...numericCodes) + 1).toString().padStart(6, '0')
  return Date.now().toString().slice(-6).padStart(6, '0')
}

const formatFormula = (components: FormulaComponent[]): string => {
  if (!components?.length) return '-'

  const format = (comp: FormulaComponent | undefined): string =>
    comp ? `${comp.source} × ${comp.multiplier}${comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}` : '-'

  const panjang = components.find(c => c.target === 'panjang')
  const lebar = components.find(c => c.target === 'lebar')

  return `P: ${format(panjang)} | L: ${format(lebar)}`
}

const parseFormulaComponent = (comp: FormulaApiItem): FormulaComponent => ({
  id: comp.id_bfc?.toString(),
  target: comp.target || 'panjang',
  source: comp.source || 'P',
  multiplier: parseFloat(comp.multiplier?.toString() || '0') || 0,
  allowance_mm: parseFloat(comp.allowance_mm?.toString() || '0') || 0,
  sort_order: parseInt(comp.sort_order?.toString() || '1') || 1
})

const processFormulaResponse = (data: FormulaApiResponse): FormulaComponent[] => {
  if (data?.status !== 200 || !data.data?.formula) return []
  const formula = data.data.formula
  return Array.isArray(formula)
    ? formula.map(parseFormulaComponent)
    : [parseFormulaComponent(formula)]
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ============ BADGE COMPONENT ============
function Badge({ color, bg, children, size = 'md' }: { 
  color: string; 
  bg: string; 
  children: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  }
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold tracking-wider ${sizes[size]}`}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  )
}

// ============ STAT CARD ============
function StatCard({ icon, label, value, sub, accent, trend }: {
  icon: string; 
  label: string; 
  value: React.ReactNode; 
  sub: string; 
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendIcon = {
    up: 'mdi:trending-up',
    down: 'mdi:trending-down',
    neutral: 'mdi:trending-neutral'
  }[trend || 'neutral']
  
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${accent}08, transparent 60%)` }} />
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ background: `${accent}12` }}>
            <Icon icon={icon} className="w-4 h-4" style={{ color: accent }} />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{value}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Icon icon={trendIcon} className="w-3.5 h-3.5" style={{ color: accent }} />
          <p className="text-xs text-slate-500 font-medium">{sub}</p>
        </div>
      </div>
    </div>
  )
}

// ============ MODAL ============
function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean; 
  onClose: () => void; 
  title: string;
  children: React.ReactNode; 
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  }
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {title}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <Icon icon="mdi:close" className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ FIELD ============
function Field({ label, icon, helper, error, prefix, ...props }: {
  label: string; 
  icon?: string; 
  helper?: string; 
  error?: string; 
  prefix?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  
  return (
    <div className="space-y-1.5">
      <label className={`block text-xs font-bold transition-colors duration-200 ${error ? 'text-red-500' : focused ? 'text-blue-600' : 'text-slate-500'}`}>
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
            <Icon icon={icon} className={`w-4 h-4 transition-colors duration-200 ${error ? 'text-red-400' : focused ? 'text-blue-500' : 'text-slate-400'}`} />
          </div>
        )}
        {prefix && (
          <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors duration-200 ${error ? 'text-red-400' : focused ? 'text-blue-500' : 'text-slate-400'}`}>
            {prefix}
          </span>
        )}
        <input 
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className={`
            w-full ${icon || prefix ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-sm font-medium text-slate-800
            bg-white border rounded-xl transition-all duration-200 outline-none
            placeholder:text-slate-300 placeholder:font-normal
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            group-hover:border-slate-300
            ${error
              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : focused 
                ? 'border-blue-400 ring-2 ring-blue-100'
                : 'border-slate-200'
            }
          `}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1">
          <Icon icon="mdi:alert-circle-outline" className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
          <Icon icon="mdi:information-outline" className="w-3.5 h-3.5" />
          {helper}
        </p>
      )}
    </div>
  )
}

// ============ SELECT ============
function Select({ label, icon, options, error, ...props }: {
  label: string;
  icon?: string;
  options: { value: string; label: string }[];
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  
  return (
    <div className="space-y-1.5">
      <label className={`block text-xs font-bold transition-colors duration-200 ${error ? 'text-red-500' : focused ? 'text-blue-600' : 'text-slate-500'}`}>
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
            <Icon icon={icon} className={`w-4 h-4 transition-colors duration-200 ${error ? 'text-red-400' : focused ? 'text-blue-500' : 'text-slate-400'}`} />
          </div>
        )}
        <select
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className={`
            w-full ${icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 text-sm font-medium text-slate-800
            bg-white border rounded-xl transition-all duration-200 outline-none appearance-none
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            group-hover:border-slate-300
            ${error
              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : focused 
                ? 'border-blue-400 ring-2 ring-blue-100'
                : 'border-slate-200'
            }
          `}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon icon="mdi:chevron-down" className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1">
          <Icon icon="mdi:alert-circle-outline" className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}

// ============ TEXTAREA ============
function TextArea({ label, icon, error, ...props }: {
  label: string;
  icon?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false)
  
  return (
    <div className="space-y-1.5">
      <label className={`block text-xs font-bold transition-colors duration-200 ${error ? 'text-red-500' : focused ? 'text-blue-600' : 'text-slate-500'}`}>
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-3">
            <Icon icon={icon} className={`w-4 h-4 transition-colors duration-200 ${error ? 'text-red-400' : focused ? 'text-blue-500' : 'text-slate-400'}`} />
          </div>
        )}
        <textarea
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className={`
            w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-sm font-medium text-slate-800
            bg-white border rounded-xl transition-all duration-200 outline-none resize-none
            placeholder:text-slate-300 placeholder:font-normal
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            group-hover:border-slate-300
            ${error
              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : focused 
                ? 'border-blue-400 ring-2 ring-blue-100'
                : 'border-slate-200'
            }
          `}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1">
          <Icon icon="mdi:alert-circle-outline" className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}

// ============ BUTTON ============
function Btn({ variant = 'primary', size = 'md', icon, loading, children, className = '', ...props }: {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: string; 
  loading?: boolean;
  children?: React.ReactNode; 
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { 
    sm: 'px-3.5 py-1.5 text-xs gap-1.5', 
    md: 'px-4 py-2.5 text-sm gap-2', 
    lg: 'px-5 py-3 text-base gap-2.5' 
  }
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200',
    outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    ghost:   'bg-transparent text-slate-600 hover:bg-slate-100',
    danger:  'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200',
  }
  
  return (
    <button 
      {...props}
      disabled={loading || props.disabled}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl 
        transition-all duration-200 active:scale-[0.97] disabled:opacity-50 
        disabled:cursor-not-allowed disabled:active:scale-100
        ${sizes[size]} ${variants[variant]} ${className}
      `}>
      {loading ? (
        <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <Icon icon={icon} className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  )
}

// ============ EMPTY STATE ============
function EmptyState({ onAdd, searchTerm }: { onAdd: () => void; searchTerm?: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 px-4">
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center">
          <Icon icon="mdi:package-variant-closed" className="w-12 h-12 text-blue-300" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
          <Icon icon="mdi:plus" className="w-5 h-5 text-white" />
        </div>
      </div>
      
      <div className="text-center max-w-sm">
        {searchTerm ? (
          <>
            <p className="font-bold text-slate-700 text-lg">Tidak Ditemukan</p>
            <p className="text-sm text-slate-400 mt-2">
              Pencarian "{searchTerm}" tidak menghasilkan data. Coba kata kunci lain.
            </p>
          </>
        ) : (
          <>
            <p className="font-bold text-slate-700 text-lg">Belum Ada Data Box Model</p>
            <p className="text-sm text-slate-400 mt-2">
              Mulai dengan menambahkan box model pertama untuk kelola dimensi dan formula.
            </p>
          </>
        )}
      </div>
      
      {searchTerm ? (
        <Btn variant="outline" size="md" icon="mdi:close" onClick={() => window.location.reload()}>
          Reset Pencarian
        </Btn>
      ) : (
        <Btn variant="primary" size="lg" icon="mdi:plus" onClick={onAdd}>
          Tambah Box Model Baru
        </Btn>
      )}
    </div>
  )
}

// ============ SKELETON ============
function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-3 w-48 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse mb-4" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse mb-2" />
        ))}
      </div>
    </div>
  )
}

// ============ CUSTOM HOOKS ============
const useBoxModels = () => {
  const [boxModels, setBoxModels] = useState<BoxModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoxModels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await axios.get('/Admin/Box/boxModels', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      if (data?.status === 200 && Array.isArray(data.data)) {
        const processed = await Promise.all(data.data.map(async (item: BoxModelApiItem) => {
          let components: FormulaComponent[] = []
          try {
            const formulaRes = await axios.get<FormulaApiResponse>(
              `/Admin/Box/boxFormulaComponentsJoinBox/${item.id_bm}`,
              { headers: { 'ngrok-skip-browser-warning': 'true' } }
            )
            components = processFormulaResponse(formulaRes.data)
          } catch {
            // formula not found, keep empty
          }

          return {
            id: item.id_bm?.toString() || '',
            kode: item.code || '',
            namaModel: item.name || '',
            deskripsi: item.description || '',
            status: item.status_bm === '1' || item.status_bm === 1,
            status_bm: item.status_bm?.toString() || '1',
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
            formulaComponents: components,
            hasFormula: components.length > 0,
            category: item.category || 'Mailer Box'
          }
        }))

        setBoxModels(processed)
      } else {
        setBoxModels([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      console.error('Error fetching box models:', err)
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoxModels()
  }, [fetchBoxModels])

  return { boxModels, loading, error, refetch: fetchBoxModels }
}

// ============ MAIN COMPONENT ============
export default function BoxModelsPage() {
  const { boxModels, loading, error, refetch } = useBoxModels()
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFormulaModal, setShowFormulaModal] = useState(false)
  
  const [addFormData, setAddFormData] = useState(BASE_ADD_FORM)
  const [editingItem, setEditingItem] = useState<BoxModel | null>(null)
  const [selectedItem, setSelectedItem] = useState<BoxModel | null>(null)
  const [editingFormulaComponents, setEditingFormulaComponents] = useState<FormulaComponent[]>([])

  // ===== STATS =====
  const stats = useMemo((): Stats => ({
    totalModels: boxModels.length,
    activeModels: boxModels.filter(m => m.status).length,
    withFormulas: boxModels.filter(m => m.hasFormula).length,
    withoutFormulas: boxModels.filter(m => !m.hasFormula).length,
    mailerBoxCount: boxModels.filter(m => m.category === 'Mailer Box').length,
    shoeBoxCount: boxModels.filter(m => m.category === 'Shoe Box').length,
    foodBoxCount: boxModels.filter(m => m.category === 'Food Box').length,
    premiumBoxCount: boxModels.filter(m => m.category === 'Premium Box').length
  }), [boxModels])

  const filtered = useMemo(() =>
    boxModels.filter(m =>
      m.namaModel.toLowerCase().includes(search.toLowerCase()) ||
      m.kode.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    ), [boxModels, search])

  const maxFormulaCount = useMemo(() => 
    Math.max(...boxModels.map(m => m.formulaComponents.length), 0)
  , [boxModels])

  // ===== VALIDATION =====
  const validateFormula = (components: FormulaComponent[]): boolean => {
    const invalid = components.filter(c =>
      !c.target || !['panjang', 'lebar'].includes(c.target) ||
      !c.source || !['P', 'L', 'T', 'A', 'B', 'C'].includes(c.source) ||
      c.multiplier === undefined || isNaN(c.multiplier)
    )

    if (invalid.length) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: `${invalid.length} komponen memiliki data yang tidak valid`,
        confirmButtonColor: '#3b82f6'
      })
      return false
    }
    return true
  }

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    if (!addFormData.name.trim() || !addFormData.description.trim()) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validasi Error', 
        text: 'Nama dan deskripsi harus diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    try {
      setIsPosting(true)
      const { data } = await axios.post<ApiResponse>('/Admin/Box/boxModels', {
        code: addFormData.code.trim(),
        name: addFormData.name.trim(),
        description: addFormData.description.trim(),
        category: addFormData.category.trim(),
        status_bm: addFormData.status_bm
      })

      if (data?.status === 200) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: 'Box Model berhasil ditambahkan!', 
          timer: 1500,
          showConfirmButton: false
        })
        setShowAddModal(false)
        setAddFormData(BASE_ADD_FORM)
        await refetch()
      }
    } catch (err: unknown) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Gagal menyimpan data'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    if (!editingItem.namaModel.trim() || !editingItem.deskripsi?.trim()) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validasi Error', 
        text: 'Nama dan deskripsi harus diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    const components = editingItem.formulaComponents || []
    if (components.length && !validateFormula(components)) return

    try {
      setIsPosting(true)
      const { data } = await axios.put<ApiResponse>(`/Admin/Box/boxModelsFormulaEdit/${editingItem.id}`, {
        code: editingItem.kode.trim(),
        name: editingItem.namaModel.trim(),
        description: editingItem.deskripsi.trim(),
        category: editingItem.category || 'Mailer Box',
        status_bm: editingItem.status_bm || '1',
        formula: components.map(c => ({
          target: c.target,
          source: c.source,
          multiplier: c.multiplier.toString(),
          allowance_mm: c.allowance_mm?.toString() || '0',
          sort_order: c.sort_order?.toString() || '1'
        }))
      })

      if (data?.status === 200) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: 'Data berhasil diperbarui!', 
          timer: 1500,
          showConfirmButton: false
        })
        await refetch()
        setShowEditModal(false)
        setEditingItem(null)
      }
    } catch (err: unknown) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Gagal mengupdate data'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleFormulaSave = async () => {
    if (!editingItem || !validateFormula(editingFormulaComponents)) return

    try {
      setIsPosting(true)
      let success = 0

      for (const [index, c] of editingFormulaComponents.entries()) {
        try {
          await axios.post('/Admin/Box/boxFormulaComponents', {
            box_model_id: editingItem.id,
            target: c.target,
            source: c.source,
            multiplier: c.multiplier.toString(),
            allowance_mm: c.allowance_mm?.toString() || '0',
            sort_order: c.sort_order?.toString() || (index + 1).toString()
          })
          success++
        } catch (err: unknown) {
          console.error(`Error komponen ${index + 1}:`, err)
        }
      }

      if (success > 0) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: `${success} komponen berhasil disimpan!`, 
          timer: 1500,
          showConfirmButton: false
        })
        await refetch()
        setShowFormulaModal(false)
        setEditingItem(null)
        setEditingFormulaComponents([])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan formula'
      Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: msg,
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      html: `
        <div class="text-left">
          <p class="text-sm text-slate-600 mb-2">Anda akan menghapus:</p>
          <p class="font-bold text-slate-800">${name}</p>
          <p class="text-xs text-red-500 mt-3">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      try {
        const { data } = await axios.delete<ApiResponse>(`/Admin/Box/boxModelsDel/${id}`)
        if (data?.status === 200) {
          await Swal.fire({ 
            icon: 'success', 
            title: 'Dihapus!', 
            text: `"${name}" berhasil dihapus!`, 
            timer: 1500,
            showConfirmButton: false
          })
          await refetch()
        }
      } catch (err: unknown) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error!', 
          text: getErrMsg(err, 'Gagal menghapus data'),
          confirmButtonColor: '#3b82f6'
        })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCodes.length === 0) return
    
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Massal?',
      html: `
        <p class="text-sm text-slate-600">
          Anda akan menghapus <span class="font-bold text-red-500">${selectedCodes.length}</span> data box model.
        </p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal'
    })
    
    if (!result.isConfirmed) return
    
    // Implement bulk delete here
    setSelectedCodes([])
  }

  const toggleStatus = async (item: BoxModel) => {
    const result = await Swal.fire({
      title: 'Ubah Status?',
      text: `${item.status ? 'Nonaktifkan' : 'Aktifkan'} "${item.namaModel}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: item.status ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
      confirmButtonColor: '#3b82f6'
    })

    if (result.isConfirmed) {
      try {
        const newStatus = !item.status
        const { data } = await axios.patch<ApiResponse>(`/Admin/Box/boxModels/${item.id}/status`, {
          status_bm: newStatus ? '1' : '0'
        })

        if (data?.status === 200) {
          await Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: `"${item.namaModel}" ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`,
            timer: 1500,
            showConfirmButton: false
          })
          await refetch()
        }
      } catch (err: unknown) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error!', 
          text: getErrMsg(err, 'Gagal mengubah status'),
          confirmButtonColor: '#3b82f6'
        })
      }
    }
  }

  // ===== FORMULA HANDLERS =====
  const addFormulaComponent = useCallback((target: 'edit' | 'new' = 'new') => {
    const newComponent = (): FormulaComponent => ({
      id: `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      box_model_id: editingItem?.id || '',
      target: 'panjang',
      source: 'P',
      multiplier: 0,
      allowance_mm: 0,
      sort_order: 1
    })

    if (target === 'new') {
      setEditingFormulaComponents(prev => [...prev, { ...newComponent(), sort_order: prev.length + 1 }])
    } else if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        formulaComponents: [...(prev.formulaComponents || []), { ...newComponent(), sort_order: (prev.formulaComponents?.length || 0) + 1 }]
      } : prev)
    }
  }, [editingItem])

  const updateFormulaComponent = useCallback((target: 'edit' | 'new', index: number, field: keyof FormulaComponent, value: string | number) => {
    const parseValue = (f: string, val: string | number): string | number => {
      if (f === 'multiplier' || f === 'allowance_mm') return parseFloat(val as string) || 0
      if (f === 'sort_order') return parseInt(val as string) || 1
      return val
    }

    if (target === 'new') {
      setEditingFormulaComponents(prev => prev.map((item, i) =>
        i === index ? { ...item, [field]: parseValue(field, value) } : item
      ))
    } else if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        formulaComponents: (prev.formulaComponents || []).map((item, i) =>
          i === index ? { ...item, [field]: parseValue(field, value) } : item
        )
      } : prev)
    }
  }, [editingItem])

  const removeFormulaComponent = useCallback((target: 'edit' | 'new', index: number) => {
    if (target === 'new') {
      setEditingFormulaComponents(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i + 1 })))
    } else if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        formulaComponents: (prev.formulaComponents || []).filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i + 1 }))
      } : prev)
    }
  }, [editingItem])

  const handleViewClick = (item: BoxModel) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = useCallback(async (item: BoxModel) => {
    try {
      const { data } = await axios.get<FormulaApiResponse>(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`)
      const components = processFormulaResponse(data)
      setEditingItem({ 
        ...item, 
        status_bm: item.status ? '1' : '0', 
        formulaComponents: components, 
        hasFormula: components.length > 0 
      })
    } catch {
      setEditingItem({ 
        ...item, 
        status_bm: item.status ? '1' : '0', 
        formulaComponents: [], 
        hasFormula: false 
      })
    }
    setShowViewModal(false)
    setShowEditModal(true)
  }, [])

  const handleFormulaClick = useCallback(async (item: BoxModel) => {
    try {
      const { data } = await axios.get<FormulaApiResponse>(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`)
      const hasFormula = data?.status === 200 && data.data?.formula &&
        (Array.isArray(data.data.formula) ? data.data.formula.length > 0 : true)

      if (hasFormula) {
        const result = await Swal.fire({
          icon: 'info',
          title: 'Formula Sudah Ada',
          text: 'Gunakan menu Edit untuk mengubah formula.',
          showCancelButton: true,
          confirmButtonText: 'Edit Model',
          confirmButtonColor: '#3b82f6'
        })
        if (result.isConfirmed) handleEditClick(item)
      } else {
        setEditingItem(item)
        setEditingFormulaComponents([])
        setShowFormulaModal(true)
      }
    } catch {
      setEditingItem(item)
      setEditingFormulaComponents([])
      setShowFormulaModal(true)
    }
  }, [handleEditClick])

  // ===== FORMULA COMPONENT FORM =====
  const FormulaComponentForm = ({
    component, index, target, onUpdate, onRemove, disabled
  }: {
    component: FormulaComponent
    index: number
    target: 'edit' | 'new'
    onUpdate: (field: keyof FormulaComponent, value: string | number) => void
    onRemove: () => void
    disabled: boolean
  }) => {
    const meta = BOX_META[editingItem?.category || 'Mailer Box'] || DEFAULT_META
    
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}15` }}>
              <span className="text-xs font-bold" style={{ color: meta.color }}>#{index + 1}</span>
            </div>
            <span className="text-xs font-semibold text-slate-400">KOMPONEN FORMULA</span>
          </div>
          <button
            onClick={onRemove}
            disabled={disabled}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Icon icon="mdi:delete-outline" className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            label="Target"
            value={component.target}
            onChange={(e) => onUpdate('target', e.target.value)}
            options={TARGET_OPTIONS}
            disabled={disabled}
            icon="mdi:target"
          />
          <Select
            label="Source"
            value={component.source}
            onChange={(e) => onUpdate('source', e.target.value)}
            options={SOURCE_OPTIONS}
            disabled={disabled}
            icon="mdi:source-branch"
          />
          <Field
            label="Multiplier"
            type="number"
            step="0.1"
            value={component.multiplier}
            onChange={(e) => onUpdate('multiplier', e.target.value)}
            placeholder="0"
            disabled={disabled}
            icon="mdi:calculator"
          />
          <Field
            label="Allowance (mm)"
            type="number"
            value={component.allowance_mm || ''}
            onChange={(e) => onUpdate('allowance_mm', e.target.value)}
            placeholder="0"
            step="0.1"
            disabled={disabled}
            icon="mdi:ruler"
          />
          <Field
            label="Sort Order"
            type="number"
            value={component.sort_order || index + 1}
            onChange={(e) => onUpdate('sort_order', e.target.value)}
            min="1"
            disabled={disabled}
            icon="mdi:sort-numeric-ascending"
          />
        </div>

        <div className="mt-3 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Icon icon="mdi:function" className="w-3.5 h-3.5" />
            <span>Formula: </span>
            <span className="font-mono font-bold" style={{ color: meta.color }}>
              {component.source} × {component.multiplier}
              {component.allowance_mm ? ` + ${component.allowance_mm}mm` : ''}
            </span>
          </p>
        </div>
      </div>
    )
  }

  const FormulaLegend = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
      <p className="col-span-full text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
        <Icon icon="mdi:information-outline" className="w-4 h-4" />
        Kode Source:
      </p>
      {[
        ['P', 'Panjang (cm)'], ['L', 'Lebar (cm)'], ['T', 'Tinggi (cm)'],
        ['A', 'P ×10 (mm)'], ['B', 'L ×10 (mm)'], ['C', 'T ×10 (mm)']
      ].map(([code, label]) => (
        <div key={code} className="flex items-center gap-1.5">
          <span className="font-mono bg-white px-2 py-0.5 rounded text-xs font-bold text-blue-600 border border-blue-200 shadow-sm">
            {code}
          </span>
          <span className="text-xs text-slate-500">{label}</span>
        </div>
      ))}
    </div>
  )

  // ===== RENDER =====
  if (loading) return <Skeleton />
  
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
              <Icon icon="mdi:alert-circle-outline" className="w-10 h-10 text-red-400" />
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-bold text-slate-800">Gagal Memuat Data</h2>
            <p className="text-sm text-slate-500 mt-2">{error}</p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Btn variant="outline" icon="mdi:refresh" onClick={refetch}>
              Coba Lagi
            </Btn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8">
          <div className="absolute inset-0 bg-grid-white/10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-xl">
                <Icon icon="mdi:package-variant-closed" className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Manajemen Box Models</h1>
                <p className="text-sm text-blue-100 font-medium mt-1">Kelola model box dan rumus perhitungan dimensi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Btn 
                variant="outline" 
                size="md" 
                icon="mdi:refresh"
                className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
                onClick={refetch}
              >
                Refresh
              </Btn>
              <Btn 
                variant="primary" 
                size="md" 
                icon="mdi:plus"
                className="!bg-white !text-blue-600 hover:!bg-blue-50 !border-0"
                onClick={() => {
                  setAddFormData({ ...BASE_ADD_FORM, code: generateCode(boxModels.map(m => m.kode)) })
                  setShowAddModal(true)
                }}
              >
                Tambah Model Baru
              </Btn>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon="mdi:package-variant-closed" 
            label="Total Model"
            value={stats.totalModels}
            sub={`${stats.activeModels} aktif · ${stats.totalModels - stats.activeModels} nonaktif`}
            accent="#3b82f6"
            trend="up"
          />
          <StatCard 
            icon="mdi:calculator" 
            label="Dengan Formula"
            value={stats.withFormulas}
            sub={`${stats.withoutFormulas} belum memiliki formula`}
            accent="#10b981"
            trend={stats.withFormulas > stats.withoutFormulas ? 'up' : 'down'}
          />
          <StatCard 
            icon="mdi:chart-pie" 
            label="Kategori"
            value={stats.mailerBoxCount + stats.shoeBoxCount + stats.foodBoxCount + stats.premiumBoxCount}
            sub={`Mailer: ${stats.mailerBoxCount} · Shoe: ${stats.shoeBoxCount} · Food: ${stats.foodBoxCount} · Premium: ${stats.premiumBoxCount}`}
            accent="#f59e0b"
            trend="neutral"
          />
          <StatCard 
            icon="mdi:format-list-numbered" 
            label="Rata-rata Komponen"
            value={(stats.withFormulas ? (boxModels.reduce((acc, m) => acc + m.formulaComponents.length, 0) / stats.withFormulas).toFixed(1) : '0') + '/model'}
            sub={`Maks: ${maxFormulaCount} komponen`}
            accent="#8b5cf6"
            trend={maxFormulaCount > 2 ? 'up' : 'down'}
          />
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Daftar Box Models
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {filtered.length} dari {boxModels.length}
                </span>
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedCodes.length > 0 && (
                <Btn 
                  variant="danger" 
                  size="sm" 
                  icon="mdi:delete-outline"
                  onClick={handleBulkDelete}
                >
                  Hapus ({selectedCodes.length})
                </Btn>
              )}
              
              <div className="relative w-full sm:w-64">
                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari kode atau nama model..."
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200
                    rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300
                    placeholder:text-slate-400 hover:border-slate-300 transition-all"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Icon icon="mdi:close" className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {boxModels.length === 0 ? (
              <EmptyState onAdd={() => {
                setAddFormData({ ...BASE_ADD_FORM, code: generateCode([]) })
                setShowAddModal(true)
              }} />
            ) : filtered.length === 0 ? (
              <EmptyState onAdd={() => {
                setAddFormData({ ...BASE_ADD_FORM, code: generateCode(boxModels.map(m => m.kode)) })
                setShowAddModal(true)
              }} searchTerm={search} />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                        checked={selectedCodes.length === filtered.length && filtered.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCodes(filtered.map(m => m.id))
                          } else {
                            setSelectedCodes([])
                          }
                        }}
                      />
                    </th>
                    {['Model', 'Kategori', 'Formula', 'Status', 'Aksi'].map((h, i) => (
                      <th key={i} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((model) => {
                    const meta = BOX_META[model.category] || DEFAULT_META
                    const componentCount = model.formulaComponents.length

                    return (
                      <tr 
                        key={model.id}
                        className={`
                          group hover:bg-gradient-to-r hover:from-slate-50 hover:to-white 
                          transition-all duration-200 cursor-pointer
                          ${selectedCodes.includes(model.id) ? 'bg-blue-50/30' : ''}
                        `}
                        onClick={() => handleViewClick(model)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                            checked={selectedCodes.includes(model.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCodes([...selectedCodes, model.id])
                              } else {
                                setSelectedCodes(selectedCodes.filter(id => id !== model.id))
                              }
                            }}
                          />
                        </td>

                        {/* Model */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-xl flex items-center justify-center 
                              transition-all duration-300 group-hover:scale-110 
                              group-hover:rotate-3 bg-gradient-to-br ${meta.gradient}
                            `}>
                              <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.color }} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">{model.namaModel}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">{model.kode}</p>
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-6 py-4">
                          <Badge color={meta.color} bg={meta.bg}>
                            {model.category}
                          </Badge>
                        </td>

                        {/* Formula */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Badge color={model.hasFormula ? '#10b981' : '#f59e0b'} bg={model.hasFormula ? '#ecfdf5' : '#fffbeb'}>
                              {model.hasFormula ? '✓ Ada' : '✗ Belum'}
                            </Badge>
                            {model.hasFormula && (
                              <p className="text-xs text-slate-500 truncate max-w-[200px]" title={formatFormula(model.formulaComponents)}>
                                {formatFormula(model.formulaComponents)}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleStatus(model); }}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                              ${model.status 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }
                            `}
                          >
                            {model.status ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={() => handleViewClick(model)}
                              title="Lihat Detail"
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <Icon icon="mdi:eye-outline" className="w-4 h-4" />
                            </button>
                            {!model.hasFormula && (
                              <button
                                onClick={() => handleFormulaClick(model)}
                                title="Tambah Formula"
                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              >
                                <Icon icon="mdi:calculator" className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(model)}
                              title="Edit"
                              className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            >
                              <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(model.id, model.namaModel)}
                              title="Hapus"
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs">
                <p className="text-slate-500">
                  Menampilkan <span className="font-bold text-slate-700">{filtered.length}</span> dari{' '}
                  <span className="font-bold text-slate-700">{boxModels.length}</span> box model
                </p>
                <p className="text-slate-400">
                  Diperbarui: {new Date().toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== ADD MODAL ===== */}
      <Modal
        open={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="Tambah Box Model Baru"
        size="lg"
        footer={
          <>
            <Btn variant="outline" onClick={() => !isPosting && setShowAddModal(false)} disabled={isPosting}>
              Batal
            </Btn>
            <Btn variant="primary" icon="mdi:plus" loading={isPosting} disabled={isPosting} onClick={handleAdd}>
              Simpan Model
            </Btn>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-blue-700 font-medium">
              Kode akan digenerate otomatis. Isi semua field yang diperlukan.
            </p>
          </div>

          <Field
            label="Kode Model"
            value={addFormData.code}
            disabled
            icon="mdi:tag"
            helper="Kode otomatis"
          />

          <Field
            label="Nama Model"
            value={addFormData.name}
            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            placeholder="Contoh: Mailer Box 30x20x15"
            icon="mdi:format-title"
          />

          <Select
            label="Kategori"
            value={addFormData.category}
            onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
            options={CATEGORY_OPTIONS}
            icon="mdi:shape"
          />

          <TextArea
            label="Deskripsi Model"
            value={addFormData.description}
            onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
            rows={3}
            placeholder="Deskripsikan model box ini..."
            icon="mdi:text-box-outline"
          />

          {/* Preview */}
          <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Preview</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Icon icon="mdi:package-variant-closed" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{addFormData.name || 'Nama Model'}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                    {addFormData.code || 'Kode'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {addFormData.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Box Model"
        size="lg"
        footer={
          <>
            <Btn variant="outline" onClick={() => setShowViewModal(false)}>
              Tutup
            </Btn>
            <Btn
              variant="primary"
              icon="mdi:pencil-outline"
              onClick={() => selectedItem && handleEditClick(selectedItem)}
            >
              Edit Model
            </Btn>
          </>
        }
      >
        {selectedItem && (() => {
          const meta = BOX_META[selectedItem.category] || DEFAULT_META
          return (
            <div className="space-y-5">
              {/* Hero Section */}
              <div className={`relative overflow-hidden p-6 rounded-xl bg-gradient-to-br ${meta.gradient}`}>
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                  <Icon icon={meta.icon} className="w-32 h-32 text-white/10" />
                </div>
                
                <div className="relative flex items-center gap-5">
                  <div className="w-20 h-20 bg-white/60 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
                    <Icon icon={meta.icon} className="w-10 h-10" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{selectedItem.namaModel}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge color={meta.color} bg="white" size="sm">{selectedItem.category}</Badge>
                      <span className="text-xs text-slate-500 font-mono">{selectedItem.kode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-xl border border-slate-100 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                  <Icon icon="mdi:text-box-outline" className="w-4 h-4" />
                  Deskripsi
                </p>
                <p className="text-sm text-slate-700">{selectedItem.deskripsi || '—'}</p>
              </div>

              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:circle-outline" className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                  </div>
                  <Badge color={selectedItem.status ? '#10b981' : '#64748b'} bg={selectedItem.status ? '#ecfdf5' : '#f1f5f9'}>
                    {selectedItem.status ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:calculator" className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Formula</p>
                  </div>
                  <Badge color={selectedItem.hasFormula ? '#10b981' : '#f59e0b'} bg={selectedItem.hasFormula ? '#ecfdf5' : '#fffbeb'}>
                    {selectedItem.hasFormula ? '✓ Ada' : '✗ Belum'}
                  </Badge>
                </div>
              </div>

              {/* Formula Detail */}
              {selectedItem.hasFormula && (
                <div className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50 to-white">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Icon icon="mdi:function" className="w-4 h-4" />
                    Rumus Perhitungan
                  </p>
                  <div className="space-y-2">
                    {selectedItem.formulaComponents.map((comp, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-blue-100">
                        <span className="text-xs font-semibold text-slate-500 w-16">{comp.target}:</span>
                        <span className="text-xs font-mono font-bold text-blue-600">
                          {comp.source} × {comp.multiplier}
                          {comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Icon icon="mdi:calendar-plus" className="w-3.5 h-3.5" />
                    Dibuat
                  </p>
                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {formatDate(selectedItem.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Icon icon="mdi:calendar-refresh" className="w-3.5 h-3.5" />
                    Diperbarui
                  </p>
                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {formatDate(selectedItem.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        open={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`Edit Box Model — ${editingItem?.namaModel}`}
        size="full"
        footer={
          <>
            <Btn variant="outline" onClick={() => !isPosting && setShowEditModal(false)} disabled={isPosting}>
              Batal
            </Btn>
            <Btn variant="primary" icon="mdi:check" loading={isPosting} disabled={isPosting} onClick={handleEdit}>
              Simpan Perubahan
            </Btn>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gradient-to-r from-slate-50 to-white p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Informasi Dasar
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Kode"
                  value={editingItem.kode}
                  disabled
                  icon="mdi:tag"
                />
                <Field
                  label="Nama Model"
                  value={editingItem.namaModel}
                  onChange={(e) => setEditingItem({ ...editingItem, namaModel: e.target.value })}
                  icon="mdi:format-title"
                  disabled={isPosting}
                />
              </div>
              <div className="mt-4">
                <Select
                  label="Kategori"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  options={CATEGORY_OPTIONS}
                  disabled={isPosting}
                  icon="mdi:shape"
                />
              </div>
              <div className="mt-4">
                <TextArea
                  label="Deskripsi"
                  value={editingItem.deskripsi || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })}
                  rows={3}
                  icon="mdi:text-box-outline"
                  disabled={isPosting}
                />
              </div>
            </div>

            {/* Formula Components */}
            <div className="bg-gradient-to-r from-emerald-50 to-white p-5 rounded-xl border border-emerald-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Formula Components
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Kelola rumus perhitungan dimensi box</p>
                </div>
                <Btn
                  type="button"
                  onClick={() => addFormulaComponent('edit')}
                  variant="success"
                  size="sm"
                  disabled={isPosting}
                  icon="mdi:plus"
                >
                  Tambah
                </Btn>
              </div>

              <FormulaLegend />

              <div className="space-y-3 mt-4">
                {editingItem.formulaComponents?.length ? (
                  editingItem.formulaComponents.map((comp, i) => (
                    <FormulaComponentForm
                      key={comp.id || i}
                      component={comp}
                      index={i}
                      target="edit"
                      onUpdate={(field, value) => updateFormulaComponent('edit', i, field, value)}
                      onRemove={() => removeFormulaComponent('edit', i)}
                      disabled={isPosting}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                    <Icon icon="mdi:calculator-off" className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-3">Belum ada formula components</p>
                    <Btn variant="primary" onClick={() => addFormulaComponent('edit')} disabled={isPosting} icon="mdi:plus" size="sm">
                      Tambah Component Pertama
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== FORMULA MODAL ===== */}
      <Modal
        open={showFormulaModal}
        onClose={() => !isPosting && setShowFormulaModal(false)}
        title="Tambah Formula Baru"
        size="xl"
        footer={
          <>
            <Btn variant="outline" onClick={() => !isPosting && setShowFormulaModal(false)} disabled={isPosting}>
              Batal
            </Btn>
            <Btn variant="primary" icon="mdi:check" loading={isPosting} disabled={isPosting} onClick={handleFormulaSave}>
              Simpan Formula
            </Btn>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Info */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Menambahkan Formula Baru</p>
                <p className="text-xs text-blue-600 mt-1">
                  Box Model: <span className="font-semibold">{editingItem.namaModel}</span> (Kode: {editingItem.kode})
                </p>
              </div>
            </div>

            <FormulaLegend />

            <div className="bg-gradient-to-r from-emerald-50 to-white p-5 rounded-xl border border-emerald-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Formula Components
                </h4>
                <Btn
                  type="button"
                  onClick={() => addFormulaComponent('new')}
                  variant="success"
                  size="sm"
                  disabled={isPosting}
                  icon="mdi:plus"
                >
                  Tambah
                </Btn>
              </div>

              <div className="space-y-3">
                {editingFormulaComponents.map((comp, i) => (
                  <FormulaComponentForm
                    key={comp.id}
                    component={comp}
                    index={i}
                    target="new"
                    onUpdate={(field, value) => updateFormulaComponent('new', i, field, value)}
                    onRemove={() => removeFormulaComponent('new', i)}
                    disabled={isPosting}
                  />
                ))}

                {!editingFormulaComponents.length && (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                    <Icon icon="mdi:calculator-off" className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-3">Belum ada formula components</p>
                    <Btn variant="primary" onClick={() => addFormulaComponent('new')} disabled={isPosting} icon="mdi:plus" size="sm">
                      Tambah Component Pertama
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}