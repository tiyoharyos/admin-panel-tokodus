'use client'
// app/(protected)/sheet-settings/page.tsx

import { useState, useEffect, useMemo, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'

import { useSheetSettings } from './hooks/useSheetSettings'
import { useSheetActions } from './hooks/useSheetActions'
import {
  BASE_FORM, FLUTE_COLORS, ITEMS_PER_PAGE_OPTIONS, LAYER_TYPE_OPTIONS,
} from './constants/constants'
import {
  extractErrorMessage, formatCurrency, formatDate,
  formatSubstanceDisplay, getFlutePrice,
  getLayerMeta, initEditPrices, initEmptyPrices,
} from './lib/utils'
import type { Flute, FormData, PaginationConfig, SheetStats, SheetSubstance } from './types/types'

// ============================================================
// SHARED UI
// ============================================================

function Badge({ color, light, children }: { color: string; light?: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: light || `${color}18`, color }}>
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
    green: 'hover:text-green-600 hover:bg-green-50',
  }
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={`p-2 text-gray-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${cls[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

// ============================================================
// STATS CARDS (custom dengan gradient line)
// ============================================================

function StatsCards({ stats, flutes, sheetSubstances }: {
  stats: SheetStats; flutes: Flute[]; sheetSubstances: SheetSubstance[]
}) {
  const cards = [
    { icon: 'mdi:layers-triple', label: 'Total Substances', value: stats.totalSubstances, sub: `${stats.activeSubstances} aktif`, accent: '#3b82f6' },
    { icon: 'mdi:waveform',      label: 'Flute Types',      value: flutes.length, sub: flutes.map(f => f.code).join(' · ') || '-', accent: '#8b5cf6' },
    { icon: 'mdi:database',      label: 'Total Indices',    value: stats.totalIndices, sub: `${sheetSubstances.length} substance × ${flutes.length} flute`, accent: '#10b981' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">{card.label}</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${card.accent}15` }}>
              <Icon icon={card.icon} className="w-4 h-4" style={{ color: card.accent }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 truncate">{card.value}</p>
          <p className="text-xs text-slate-400 mt-1.5">{card.sub}</p>
          <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${card.accent}60, transparent)` }} />
        </div>
      ))}
    </div>
  )
}

// ============================================================
// LAYER CONFIG SECTION (dengan gaya konsisten)
// ============================================================

function LayerSection({ form, isPosting, formErrors, onChange, onTypeChange }: {
  form: FormData; isPosting: boolean; formErrors: Record<string, string>
  onChange: (field: string, value: string) => void
  onTypeChange: (field: string) => (e: ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon icon="mdi:layers-triple" className="w-3.5 h-3.5 text-blue-600" />
        </div>
        Konfigurasi Layer
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([1, 2, 3] as const).map(num => (
          <div key={num} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">{num}</span>
              Layer {num}
            </h4>
            <div className="space-y-3">
              <Input
                label="Gramasi *" type="number"
                value={form[`layer_${num}` as 'layer_1' | 'layer_2' | 'layer_3']}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(`layer_${num}`, e.target.value)}
                placeholder="125" min="1" step="1" disabled={isPosting}
                error={formErrors[`layer_${num}`]}
                leftIcon="mdi:weight"
              />
              <Select
                label="Jenis Kertas *"
                value={form[`layer_${num}_gsm` as 'layer_1_gsm' | 'layer_2_gsm' | 'layer_3_gsm']}
                onChange={onTypeChange(`layer_${num}_gsm`)}
                options={LAYER_TYPE_OPTIONS}
                disabled={isPosting}
                leftIcon="mdi:palette"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// FLUTE PRICING SECTION (gaya konsisten)
// ============================================================

function FlutePricingSection({ form, flutes, isPosting, formErrors, warningText, onPriceChange }: {
  form: FormData; flutes: Flute[]; isPosting: boolean
  formErrors: Record<string, string>; warningText?: string
  onPriceChange: (code: string, value: string) => void
}) {
  if (flutes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-2">
        <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
        <p className="text-yellow-800 text-sm">Tidak ada flute tersedia. Tambahkan flute terlebih dahulu.</p>
      </div>
    )
  }
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
          <Icon icon="mdi:currency-usd" className="w-3.5 h-3.5 text-green-600" />
        </div>
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
            <div key={flute.code} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-slate-700">{flute.name}</span>
                <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
              </div>
              <Input
                label="Harga per m² *" type="number"
                value={form.price_per_m2[flute.code] || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onPriceChange(flute.code, e.target.value)}
                placeholder="0" min="1" disabled={isPosting}
                error={formErrors[`price_${flute.code}`]}
                leftIcon="mdi:currency-usd"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// PAGINATION (dengan gaya lebih rapi)
// ============================================================

function Pagination({ pagination, onChange }: {
  pagination: PaginationConfig; onChange: (page: number) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
      <p className="text-sm text-slate-500">
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
        <button onClick={() => onChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon icon="mdi:chevron-left" className="w-5 h-5" />
        </button>
        <span className="text-sm text-slate-500">
          Halaman {pagination.currentPage} dari {pagination.totalPages}
        </span>
        <button onClick={() => onChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon icon="mdi:chevron-right" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// ============================================================
// MODALS (gaya konsisten dengan info banner)
// ============================================================

function AddModal({ isOpen, form, flutes, isPosting, formErrors, onChange, onTypeChange, onPriceChange, onClose, onSubmit }: {
  isOpen: boolean; form: FormData; flutes: Flute[]; isPosting: boolean
  formErrors: Record<string, string>
  onChange: (f: string, v: string) => void
  onTypeChange: (f: string) => (e: ChangeEvent<HTMLSelectElement>) => void
  onPriceChange: (code: string, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Sheet Substance Baru" size="xl"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting}
            disabled={isPosting || flutes.length === 0} icon="mdi:check">
            Simpan Sheet
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Tambah Sheet Baru</p>
            <p className="text-xs text-blue-600 mt-0.5">Isi gramasi dan jenis kertas untuk setiap layer. Harga per flute wajib diisi semua.</p>
          </div>
        </div>
        <LayerSection form={form} isPosting={isPosting} formErrors={formErrors}
          onChange={onChange} onTypeChange={onTypeChange} />
        <FlutePricingSection form={form} flutes={flutes} isPosting={isPosting}
          formErrors={formErrors} onPriceChange={onPriceChange} />
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, editingItem, form, flutes, isPosting, formErrors, onChange, onTypeChange, onPriceChange, onClose, onSubmit }: {
  isOpen: boolean; editingItem: SheetSubstance | null; form: FormData; flutes: Flute[]; isPosting: boolean
  formErrors: Record<string, string>
  onChange: (f: string, v: string) => void
  onTypeChange: (f: string) => (e: ChangeEvent<HTMLSelectElement>) => void
  onPriceChange: (code: string, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  if (!editingItem) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Sheet Substance" size="xl"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting}
            disabled={isPosting || flutes.length === 0} icon="mdi:check">
            Simpan Perubahan
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:pencil-outline" className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Edit Sheet Substance</p>
            <p className="text-xs text-amber-600 mt-0.5">
              ID: <span className="font-mono">#{editingItem.id}</span> · Kode:{' '}
              <span className="font-semibold">{formatSubstanceDisplay(editingItem)}</span>
            </p>
          </div>
        </div>
        <LayerSection form={form} isPosting={isPosting} formErrors={formErrors}
          onChange={onChange} onTypeChange={onTypeChange} />
        <FlutePricingSection form={form} flutes={flutes} isPosting={isPosting}
          formErrors={formErrors}
          warningText="Semua flute types harus diisi dengan harga yang valid."
          onPriceChange={onPriceChange} />
      </div>
    </Modal>
  )
}

function ViewModal({ isOpen, item, flutes, onClose, onEdit }: {
  isOpen: boolean; item: SheetSubstance | null; flutes: Flute[]
  onClose: () => void; onEdit: () => void
}) {
  if (!item) return null
  const layerCodes = [item.layer_1_gsm, item.layer_2_gsm, item.layer_3_gsm]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Sheet Substance" size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button variant="primary" icon="mdi:pencil-outline" onClick={onEdit}>Edit Sheet</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/60">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100">
            <Icon icon="mdi:layers-triple" className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{formatSubstanceDisplay(item)}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1">
                {layerCodes.map((code, idx) => {
                  const meta = getLayerMeta(code)
                  return (
                    <span key={idx} className="w-5 h-5 rounded text-xs font-bold text-white flex items-center justify-center"
                      style={{ background: meta.bg }}>{code}</span>
                  )
                })}
              </div>
              <span className="text-xs text-slate-400 font-mono">{item.substance_code}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Icon icon="mdi:layers-triple" className="w-3.5 h-3.5" /> Komposisi Layer
          </p>
          <div className="space-y-2">
            {[1, 2, 3].map(num => {
              const code = item[`layer_${num}_gsm`] as string
              const gram = item[`layer_${num}`] as string
              const meta = getLayerMeta(code)
              return (
                <div key={num} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 w-16">Layer {num}:</span>
                    <Badge color={meta.bg} light={meta.light}>{gram}{code}</Badge>
                  </div>
                  <span className="text-xs text-slate-400">
                    {LAYER_TYPE_OPTIONS.find(o => o.value === code)?.label || code}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Icon icon="mdi:currency-usd" className="w-3.5 h-3.5" /> Harga per Flute
          </p>
          <div className="grid grid-cols-2 gap-2">
            {flutes.map((flute, idx) => {
              const price = getFlutePrice(item, flute.code)
              const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
              return (
                <div key={flute.code} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                    <span className="text-xs text-slate-600">{flute.name}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: color.bg }}>
                    {price > 0 ? formatCurrency(price) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400">Dibuat</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(item.created_at)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400">Diperbarui</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(item.updated_at)}</p>
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
  const { sheetSubstances, flutes, stats, loading, error, pagination, setPagination, refetch } = useSheetSettings()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  const [editingItem, setEditingItem] = useState<SheetSubstance | null>(null)
  const [selectedItem, setSelectedItem] = useState<SheetSubstance | null>(null)
  const [addForm, setAddForm] = useState<FormData>({ ...BASE_FORM })
  const [editForm, setEditForm] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const resetAdd = () => { setAddForm({ ...BASE_FORM }); setFormErrors({}) }
  const resetEdit = () => { setEditForm({ ...BASE_FORM }); setFormErrors({}) }

  const { isPosting, handleAdd, handleEdit, handleDelete } = useSheetActions({
    flutes, refetch,
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

  useEffect(() => {
    const totalItems = filteredSubstances.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage))
    setPagination(prev => ({
      ...prev, totalItems, totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }))
  }, [filteredSubstances.length, pagination.itemsPerPage, setPagination])

  // ===== HELPERS =====
  const openEdit = (item: SheetSubstance) => {
    setEditingItem(item)
    setEditForm({
      layer_1: item.layer_1.toString(), layer_1_gsm: item.layer_1_gsm,
      layer_2: item.layer_2.toString(), layer_2_gsm: item.layer_2_gsm,
      layer_3: item.layer_3.toString(), layer_3_gsm: item.layer_3_gsm,
      price_per_m2: {},
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const closeAdd  = () => { if (!isPosting) { setShowAddModal(false); resetAdd() } }
  const closeEdit = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null); resetEdit() } }

  const onAddChange = (field: string, value: string) => {
    setAddForm(p => ({ ...p, [field]: value }))
    setFormErrors(p => ({ ...p, [field]: '' }))
  }
  const onEditChange = (field: string, value: string) => {
    setEditForm(p => ({ ...p, [field]: value }))
    setFormErrors(p => ({ ...p, [field]: '' }))
  }
  const onAddTypeChange = (field: string) => (e: ChangeEvent<HTMLSelectElement>) => {
    setAddForm(p => ({ ...p, [field]: e.target.value }))
    setFormErrors(p => ({ ...p, [field]: '' }))
  }
  const onEditTypeChange = (field: string) => (e: ChangeEvent<HTMLSelectElement>) => {
    setEditForm(p => ({ ...p, [field]: e.target.value }))
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

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setPagination(prev => ({ ...prev, currentPage: page }))
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil diperbarui', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err, 'Gagal memperbarui data'), confirmButtonColor: '#3b82f6' })
    }
  }

  if (loading && sheetSubstances.length === 0 && !error) return (
    <LoadingState message="Memuat data Sheet Settings..." submessage="Harap tunggu sebentar" icon="mdi:layers-triple" />
  )
  if (error && sheetSubstances.length === 0) return <ErrorState message={error} onRetry={refetch} />

  return (
    // HAPUS min-h-screen, ganti w-full
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 w-full">

      {/* Header dengan badge emas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:layers-triple" className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Sheet Settings</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola harga bahan sheet berdasarkan flute type</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="md" icon="mdi:plus"
          disabled={flutes.length === 0}>
          Tambah Sheet Baru
        </Button>
      </div>

      <StatsCards stats={stats} flutes={flutes} sheetSubstances={sheetSubstances} />

      {/* Error banner (jika error tapi data ada) */}
      {error && sheetSubstances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Icon icon="mdi:alert" className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={handleRefresh} icon="mdi:refresh" className="ml-auto">Refresh</Button>
        </div>
      )}

      {/* Table Card dengan gradient header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Daftar Sheet Substances</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Total {stats.totalSubstances} kombinasi ({stats.withAllFlutes} dengan harga lengkap)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari substance..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                Per hal:
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
              <ActionButton onClick={() => router.push('/flute-settings')} icon="mdi:cog" hoverColor="green" title="Kelola Flutes" />
            </div>
          </div>
        </div>

        {filteredSubstances.length > 0 && (
          <Pagination pagination={pagination} onChange={handlePageChange} />
        )}

        <div className="overflow-x-auto">
          {sheetSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-slate-300" />
              <p className="text-slate-500 font-medium text-lg">Belum ada data sheet substance</p>
              <Button onClick={() => setShowAddModal(true)} variant="primary" icon="mdi:plus"
                disabled={flutes.length === 0}>
                {flutes.length === 0 ? 'Tambah Flute Dulu' : 'Tambah Sheet Baru'}
              </Button>
            </div>
          ) : filteredSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Icon icon="mdi:layers-triple-off" className="w-16 h-16 text-slate-300" />
              <p className="text-slate-500 font-medium text-lg">Tidak ada hasil</p>
              <p className="text-sm text-slate-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
              <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">Hapus Pencarian</Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['No', 'Substance', 'Layer 1', 'Layer 2', 'Layer 3',
                    ...flutes.map(f => `${f.code}-Flute`), 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedData.map((substance, index) => {
                  const rowNum = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  return (
                    <tr key={substance.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{rowNum}</td>

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
                          <p className="text-xs font-mono text-slate-400">{substance.substance_code}</p>
                        </div>
                      </td>

                      {/* Layer badges */}
                      {(['layer_1', 'layer_2', 'layer_3'] as const).map(layer => {
                        const code = substance[`${layer}_gsm`] as string
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
                              : <span className="text-xs text-slate-300">—</span>}
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

        {filteredSubstances.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-400">
              Menampilkan <span className="font-semibold text-slate-600">{paginatedData.length}</span> dari{' '}
              <span className="font-semibold text-slate-600">{filteredSubstances.length}</span> substance
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewModal
        isOpen={showViewModal} item={selectedItem} flutes={flutes}
        onClose={() => { setShowViewModal(false); setSelectedItem(null) }}
        onEdit={() => { setShowViewModal(false); if (selectedItem) openEdit(selectedItem) }}
      />

      <AddModal
        isOpen={showAddModal} form={addForm} flutes={flutes} isPosting={isPosting} formErrors={formErrors}
        onChange={onAddChange} onTypeChange={onAddTypeChange} onPriceChange={onAddPrice}
        onClose={closeAdd}
        onSubmit={() => handleAdd(addForm)}
      />

      <EditModal
        isOpen={showEditModal} editingItem={editingItem} form={editForm} flutes={flutes}
        isPosting={isPosting} formErrors={formErrors}
        onChange={onEditChange} onTypeChange={onEditTypeChange} onPriceChange={onEditPrice}
        onClose={closeEdit}
        onSubmit={() => { if (editingItem) handleEdit(editingItem, editForm) }}
      />
    </div>
  )
}