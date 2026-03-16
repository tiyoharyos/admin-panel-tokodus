'use client'
// app/(protected)/sheet-settings/sheet-index/page.tsx

import { useState, useEffect, useMemo, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Icon } from '@iconify/react'

import { useSheetIndex } from './hooks/useSheetIndex'
import { useSheetIndexActions } from './hooks/useSheetIndexActions'
import {
  BASE_FORM, FLUTE_COLORS, ITEMS_PER_PAGE_OPTIONS, LAYER_TYPE_OPTIONS,
} from './constants/constants'
import {
  extractErrorMessage,
  formatCurrency, formatDate,
  formatSubstanceDisplay,
  getFlutePrice,
  getLayerMeta,
  initEditPrices,
  initEmptyPrices,
} from './lib/utils'
import type { Flute, FormData, PaginationConfig, SheetSubstance } from './types/types'

// ============================================================
// SHARED UI
// ============================================================

function Badge({ color, light, children }: { color: string; light?: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: light || `${color}18`, color }}
    >
      {children}
    </span>
  )
}

function ActionButton({ onClick, icon, hoverColor, title, disabled }: {
  onClick: () => void; icon: string; hoverColor: string; title: string; disabled?: boolean
}) {
  const cls: Record<string, string> = {
    blue:  'hover:text-blue-600 hover:bg-blue-50',
    amber: 'hover:text-amber-600 hover:bg-amber-50',
    red:   'hover:text-red-600 hover:bg-red-50',
  }
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={`p-2 text-gray-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${cls[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

// ============================================================
// LAYER CONFIG SECTION — reused in Add & Edit modals
// ============================================================

function LayerSection({ form, isPosting, formErrors, onChange }: {
  form: FormData; isPosting: boolean; formErrors: Record<string, string>
  onChange: (field: string, value: string) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Icon icon="mdi:layers-triple" className="w-4 h-4 text-blue-500" />
        Konfigurasi Layer
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([1, 2, 3] as const).map(num => (
          <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
            <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
            <div className="space-y-3">
              <Input
                label="Gramasi *"
                type="number"
                value={form[`layer_${num}`]}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(`layer_${num}`, e.target.value)}
                placeholder="125" min="1" step="1" disabled={isPosting}
                error={formErrors[`layer_${num}`]}
                leftIcon="mdi:weight"
              />
              <Select
                label="Jenis Kertas *"
                value={form[`layer_${num}_gsm`]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(`layer_${num}_gsm`, e.target.value)}
                options={LAYER_TYPE_OPTIONS}
                disabled={isPosting}
                leftIcon="mdi:palette"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// FLUTE PRICING SECTION — reused in Add & Edit modals
// ============================================================

function FlutePricingSection({ form, flutes, isPosting, formErrors, warningText, onChange }: {
  form: FormData; flutes: Flute[]; isPosting: boolean
  formErrors: Record<string, string>; warningText?: string
  onChange: (fluteCode: string, value: string) => void
}) {
  if (flutes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
        <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
        <p className="text-yellow-800">Tidak ada flute tersedia. Harap tambahkan flute terlebih dahulu.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Icon icon="mdi:currency-usd" className="w-4 h-4 text-green-500" />
        Harga per Flute
      </h3>
      {warningText && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
          <Icon icon="mdi:alert-circle" className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-700">{warningText}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flutes.map((flute, idx) => {
          const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
          return (
            <Card key={flute.code} shadow="sm" padding="md" className="border-l-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium text-slate-800">{flute.name}</span>
                <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
              </div>
              <Input
                label="Harga per m² *"
                type="number"
                value={form.price_per_m2[flute.code] || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(flute.code, e.target.value)}
                placeholder="0" min="1" disabled={isPosting}
                error={formErrors[`price_${flute.code}`]}
                leftIcon="mdi:currency-usd"
              />
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// PAGINATION
// ============================================================

function Pagination({ pagination, onChange }: {
  pagination: PaginationConfig
  onChange: (page: number) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/50">
      <p className="text-sm text-gray-500">
        Menampilkan{' '}
        <span className="font-medium text-slate-700">
          {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
        </span>{' '}
        -{' '}
        <span className="font-medium text-slate-700">
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
        </span>{' '}
        dari <span className="font-medium text-slate-700">{pagination.totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:chevron-left" className="w-5 h-5" />
        </Button>
        <span className="text-sm text-gray-500">
          Halaman {pagination.currentPage} dari {pagination.totalPages}
        </span>
        <Button
          onClick={() => onChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:chevron-right" className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// MODALS
// ============================================================

function AddModal({ isOpen, form, flutes, isPosting, formErrors, onChange, onPriceChange, onClose, onSubmit }: {
  isOpen: boolean; form: FormData; flutes: Flute[]; isPosting: boolean
  formErrors: Record<string, string>
  onChange: (f: string, v: string) => void
  onPriceChange: (code: string, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Tambah Sheet Substance Baru" size="xl"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={isPosting}
            disabled={isPosting || flutes.length === 0} icon="mdi:check">
            Simpan Sheet
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">Isi gramasi dan jenis kertas untuk setiap layer. Harga per flute wajib diisi semua.</p>
        </div>
        <LayerSection form={form} isPosting={isPosting} formErrors={formErrors} onChange={onChange} />
        <FlutePricingSection form={form} flutes={flutes} isPosting={isPosting} formErrors={formErrors}
          onChange={onPriceChange} />
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, editingItem, form, flutes, isPosting, formErrors, onChange, onPriceChange, onClose, onSubmit }: {
  isOpen: boolean; editingItem: SheetSubstance | null; form: FormData; flutes: Flute[]; isPosting: boolean
  formErrors: Record<string, string>
  onChange: (f: string, v: string) => void
  onPriceChange: (code: string, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  if (!editingItem) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ Edit Sheet Substance" size="xl"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={isPosting}
            disabled={isPosting || flutes.length === 0} icon="mdi:check">
            Simpan Perubahan
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Mengedit Sheet Substance</p>
            <p className="text-xs text-blue-600 mt-1">
              Substance: <span className="font-semibold">{formatSubstanceDisplay(editingItem)}</span>
            </p>
          </div>
        </div>
        <LayerSection form={form} isPosting={isPosting} formErrors={formErrors} onChange={onChange} />
        <FlutePricingSection form={form} flutes={flutes} isPosting={isPosting} formErrors={formErrors}
          warningText="Semua flute types harus diisi dengan harga yang valid."
          onChange={onPriceChange} />
      </div>
    </Modal>
  )
}

function ViewModal({ isOpen, item, flutes, onClose, onEdit }: {
  isOpen: boolean; item: SheetSubstance | null; flutes: Flute[]
  onClose: () => void; onEdit: () => void
}) {
  if (!item) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Sheet Substance" size="md"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Tutup</Button>
          <Button variant="primary" size="md" icon="mdi:pencil-outline" onClick={onEdit}>Edit Sheet</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100">
            <Icon icon="mdi:layers-triple" className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{formatSubstanceDisplay(item)}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1">
                {[item.layer_1_gsm, item.layer_2_gsm, item.layer_3_gsm].map((code, idx) => {
                  const meta = getLayerMeta(code)
                  return (
                    <span key={idx} className="w-5 h-5 rounded text-xs font-bold text-white flex items-center justify-center"
                      style={{ background: meta.bg }}>{code}</span>
                  )
                })}
              </div>
              <span className="text-xs text-gray-400 font-mono">{item.substance_code}</span>
            </div>
          </div>
        </div>

        {/* Layer Details */}
        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2">Komposisi Layer</p>
          <div className="space-y-2">
            {[1, 2, 3].map(num => {
              const code = item[`layer_${num}_gsm`] as string
              const gram = item[`layer_${num}`] as string
              const meta = getLayerMeta(code)
              return (
                <div key={num} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 w-16">Layer {num}:</span>
                    <Badge color={meta.bg} light={meta.light}>{gram}{code}</Badge>
                  </div>
                  <span className="text-xs text-gray-400">
                    {LAYER_TYPE_OPTIONS.find(o => o.value === code)?.label || code}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Flute Prices */}
        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2">Harga per Flute</p>
          <div className="grid grid-cols-2 gap-2">
            {flutes.map((flute, idx) => {
              const price = getFlutePrice(item, flute.code)
              const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
              return (
                <div key={flute.code} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                    <span className="text-xs text-gray-600">{flute.name}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: color.bg }}>
                    {price > 0 ? formatCurrency(price) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Dibuat</p>
            <p className="text-sm text-slate-700">{formatDate(item.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Diperbarui</p>
            <p className="text-sm text-slate-700">{formatDate(item.updated_at)}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SheetSettingsPage() {
  const router = useRouter()
  const { sheetSubstances, flutes, flutesRef, loading, error, refetch } = useSheetIndex()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  const [editingItem, setEditingItem] = useState<SheetSubstance | null>(null)
  const [selectedItem, setSelectedItem] = useState<SheetSubstance | null>(null)

  const [addForm, setAddForm] = useState<FormData>({ ...BASE_FORM })
  const [editForm, setEditForm] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0,
  })

  // ===== RESET HELPERS =====
  const resetAdd = () => { setAddForm({ ...BASE_FORM }); setFormErrors({}) }
  const resetEdit = () => { setEditForm({ ...BASE_FORM }); setFormErrors({}) }

  const { isPosting, handleAdd, handleEdit, handleDelete } = useSheetIndexActions({
    flutesRef, refetch,
    setShowAddModal, setShowEditModal,
    setEditingItem, setFormErrors,
    resetAdd, resetEdit,
  })

  // ===== FILTERED + PAGINATED =====
  const filteredSubstances = useMemo(() => {
    if (!search.trim()) return sheetSubstances
    const q = search.toLowerCase()
    return sheetSubstances.filter(item =>
      item.substance_code.toLowerCase().includes(q) ||
      `${item.layer_1}${item.layer_1_gsm}`.toLowerCase().includes(q) ||
      `${item.layer_2}${item.layer_2_gsm}`.toLowerCase().includes(q) ||
      `${item.layer_3}${item.layer_3_gsm}`.toLowerCase().includes(q)
    )
  }, [sheetSubstances, search])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return filteredSubstances.slice(start, start + pagination.itemsPerPage)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  // Sync pagination when filtered changes
  useEffect(() => {
    const totalItems = filteredSubstances.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage))
    
  }, [filteredSubstances.length, pagination.itemsPerPage])

  // Auto-init prices when Add modal opens
  useEffect(() => {
    if (!showAddModal || flutes.length === 0) return
  }, [showAddModal, flutes])

  // Auto-init prices when Edit modal opens
  useEffect(() => {
    if (!showEditModal || !editingItem || flutes.length === 0) return
   
  }, [showEditModal, editingItem, flutes])

  // ===== STATS =====
  const stats = useMemo(() => ({
    totalSubstances: sheetSubstances.length,
    activeSubstances: sheetSubstances.length,
    withAllFlutes: sheetSubstances.filter(s =>
      flutes.every(f => getFlutePrice(s, f.code) > 0)
    ).length,
    totalIndices: sheetSubstances.reduce((acc, s) =>
      acc + flutes.filter(f => getFlutePrice(s, f.code) > 0).length, 0
    ),
  }), [sheetSubstances, flutes])

  // ===== OPEN EDIT =====
  const openEdit = (item: SheetSubstance) => {
    setEditingItem(item)
    setEditForm({
      layer_1: item.layer_1.toString(),
      layer_1_gsm: item.layer_1_gsm,
      layer_2: item.layer_2.toString(),
      layer_2_gsm: item.layer_2_gsm,
      layer_3: item.layer_3.toString(),
      layer_3_gsm: item.layer_3_gsm,
      price_per_m2: {},
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const closeAdd = () => { if (!isPosting) { setShowAddModal(false); resetAdd() } }
  const closeEdit = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null); resetEdit() } }

  const onAddChange = (field: string, value: string) => {
    setAddForm(p => ({ ...p, [field]: value }))
    setFormErrors(p => ({ ...p, [field]: '' }))
  }
  const onEditChange = (field: string, value: string) => {
    setEditForm(p => ({ ...p, [field]: value }))
    setFormErrors(p => ({ ...p, [field]: '' }))
  }
  const onAddPrice = (code: string, value: string) => {
    setAddForm(p => ({ ...p, price_per_m2: { ...p.price_per_m2, [code]: value } }))
    setFormErrors(p => ({ ...p, [`price_${code}`]: '' }))
  }
  const onEditPrice = (code: string, value: string) => {
    setEditForm(p => ({ ...p, price_per_m2: { ...p.price_per_m2, [code]: value } }))
    setFormErrors(p => ({ ...p, [`price_${code}`]: '' }))
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err, 'Gagal memperbarui data'), confirmButtonColor: '#3b82f6' })
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  // ===== RENDER GUARDS =====
  if (loading && sheetSubstances.length === 0) return (
    <LoadingState message="Memuat data Sheet Settings..." submessage="Harap tunggu sebentar" icon="mdi:layers-triple" />
  )
  if (error && sheetSubstances.length === 0) return (
    <ErrorState message={error} onRetry={refetch} />
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:layers-triple" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Sheet Settings</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola harga bahan sheet berdasarkan flute type</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="md" icon="mdi:plus"
          disabled={flutes.length === 0}>
          Tambah Sheet Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: 'mdi:layers-triple', label: 'Total Substances', value: stats.totalSubstances, sub: `${stats.activeSubstances} aktif` },
          { icon: 'mdi:waveform',      label: 'Flute Types',      value: flutes.length,          sub: flutes.map(f => f.code).join(' · ') || '-' },
          {
            icon: 'mdi:chart-arc', label: 'Rata-rata Flute/Sheet',
            value: (stats.totalIndices / (stats.totalSubstances || 1)).toFixed(1),
            sub: `Total ${stats.totalIndices} indeks`,
            bar: flutes.length > 0 ? (stats.totalIndices / (stats.totalSubstances || 1) / flutes.length) * 100 : 0,
          },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{s.value}</p>
            {s.bar !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(s.bar, 100)}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Error banner */}
      {error && sheetSubstances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Icon icon="mdi:alert" className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={handleRefresh} icon="mdi:refresh" className="ml-auto">Refresh</Button>
        </div>
      )}

      {/* Table Card */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Sheet Substances</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalSubstances} kombinasi ({stats.withAllFlutes} dengan harga lengkap)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Cari substance..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Per hal:</span>
              <Select
                value={pagination.itemsPerPage.toString()}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const n = parseInt(e.target.value)
                  setPagination(prev => ({
                    ...prev, itemsPerPage: n, currentPage: 1,
                    totalPages: Math.max(1, Math.ceil(filteredSubstances.length / n)),
                  }))
                }}
                options={ITEMS_PER_PAGE_OPTIONS}
                className="w-20"
              />
            </div>
            <ActionButton onClick={handleRefresh} icon="mdi:refresh" hoverColor="blue" title="Refresh" />
            <ActionButton onClick={() => router.push('/flute-settings')} icon="mdi:cog" hoverColor="blue" title="Kelola Flutes" />
          </div>
        </div>

        {/* Pagination top */}
        {filteredSubstances.length > 0 && (
          <Pagination pagination={pagination} onChange={handlePageChange} />
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {sheetSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data sheet substance</p>
              <Button onClick={() => setShowAddModal(true)} variant="primary" icon="mdi:plus" disabled={flutes.length === 0}>
                {flutes.length === 0 ? 'Tambah Flute Terlebih Dahulu' : 'Tambah Sheet Baru'}
              </Button>
            </div>
          ) : filteredSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
              <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
              <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">Hapus Pencarian</Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'Substance', 'Layer 1', 'Layer 2', 'Layer 3',
                    ...flutes.map(f => `${f.code}-Flute`), 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((substance, index) => {
                  const actualIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  return (
                    <tr key={substance.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{actualIndex}</td>

                      {/* Substance */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {[substance.layer_1_gsm, substance.layer_2_gsm, substance.layer_3_gsm].map((code, idx) => {
                              const meta = getLayerMeta(code)
                              return (
                                <span key={idx} className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
                                  style={{ background: meta.bg }}>{code}</span>
                              )
                            })}
                          </div>
                          <p className="text-xs font-mono text-gray-400">{substance.substance_code}</p>
                        </div>
                      </td>

                      {/* Layer badges */}
                      {(['layer_1', 'layer_2', 'layer_3'] as const).map(layer => {
                        const code = substance[`${layer}_gsm`]
                        const meta = getLayerMeta(code)
                        return (
                          <td key={layer} className="px-6 py-4 whitespace-nowrap">
                            <Badge color={meta.bg} light={meta.light}>
                              {substance[layer]}{code}
                            </Badge>
                          </td>
                        )
                      })}

                      {/* Flute prices */}
                      {flutes.map((flute, idx) => {
                        const price = getFlutePrice(substance, flute.code)
                        const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                        return (
                          <td key={flute.code} className="px-6 py-4 whitespace-nowrap">
                            {price > 0
                              ? <span className="text-sm font-medium" style={{ color: color.bg }}>{formatCurrency(price)}</span>
                              : <span className="text-xs text-gray-300">—</span>}
                          </td>
                        )
                      })}

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <ActionButton onClick={() => { setSelectedItem(substance); setShowViewModal(true) }}
                            icon="mdi:eye-outline" hoverColor="blue" title="Lihat Detail" />
                          <ActionButton onClick={() => openEdit(substance)}
                            icon="mdi:pencil-outline" hoverColor="amber" title="Edit"
                            disabled={flutes.length === 0} />
                          <ActionButton onClick={() => handleDelete(substance.id, substance.substance_code)}
                            icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
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
        {filteredSubstances.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{paginatedData.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{filteredSubstances.length}</span> substance
            </p>
          </div>
        )}
      </Card>

      {/* Modals */}
      <AddModal
        isOpen={showAddModal} form={addForm} flutes={flutes} isPosting={isPosting} formErrors={formErrors}
        onChange={onAddChange} onPriceChange={onAddPrice}
        onClose={closeAdd}
        onSubmit={() => handleAdd(addForm)}
      />

      <EditModal
        isOpen={showEditModal} editingItem={editingItem} form={editForm} flutes={flutes}
        isPosting={isPosting} formErrors={formErrors}
        onChange={onEditChange} onPriceChange={onEditPrice}
        onClose={closeEdit}
        onSubmit={() => { if (editingItem) handleEdit(editingItem, editForm) }}
      />

      <ViewModal
        isOpen={showViewModal} item={selectedItem} flutes={flutes}
        onClose={() => { setShowViewModal(false); setSelectedItem(null) }}
        onEdit={() => { setShowViewModal(false); if (selectedItem) openEdit(selectedItem) }}
      />
    </div>
  )
}