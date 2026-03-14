'use client'

import { useState, useMemo } from 'react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import TextArea from '@/components/UI/TextArea'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import { Icon } from '@iconify/react'

import { useBoxModels } from './hooks/useBoxModels'
import { useFormulaState } from './hooks/useFormulaState'
import { useBoxModelActions } from './hooks/useBoxModelActions'
import { calculateStats, formatFormula, generateCode } from './lib/utils'
import {
  BOX_META,
  CATEGORY_OPTIONS,
  DEFAULT_BOX_META,
  DEFAULT_ADD_FORM,
  FORMULA_LEGEND_ITEMS,
  SOURCE_OPTIONS,
  TARGET_OPTIONS,
} from './constants/constants'

import type { AddFormData, BoxModel, BoxModelStats, FormulaComponent } from './types/types'

// ============================================================
// SHARED UI
// ============================================================

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: `${color}18`, color }}
    >
      {children}
    </span>
  )
}

function FormulaLegend() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-gray-200">
      {FORMULA_LEGEND_ITEMS.map(([code, label]) => (
        <div key={code} className="flex items-center gap-1.5">
          <span className="font-mono bg-white px-2 py-0.5 rounded text-xs font-bold text-blue-600 border border-blue-200">
            {code}
          </span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// STATS CARDS
// ============================================================

function StatsCards({ stats }: { stats: BoxModelStats }) {
  const items = [
    { icon: 'mdi:package-variant-closed', label: 'Total Model', value: stats.totalModels, sub: undefined },
    { icon: 'mdi:calculator', label: 'Dengan Formula', value: stats.withFormulas, sub: `${stats.withoutFormulas} belum memiliki formula` },
    { icon: 'mdi:chart-pie', label: 'Kategori', value: stats.mailerBoxCount, sub: `Mailer: ${stats.mailerBoxCount} · Shoe: ${stats.shoeBoxCount}` },
    { icon: 'mdi:format-list-numbered', label: 'Rata-rata Komponen', value: `${stats.avgComponents}/model`, sub: `Maks: ${stats.maxComponents} komponen` },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((s, i) => (
        <Card key={i} shadow="sm" padding="md" hoverable>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{s.label}</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icon icon={s.icon} className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{s.value}</p>
          {s.sub && <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>}
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// FORMULA COMPONENT FORM
// ============================================================

interface FormulaComponentFormProps {
  component: FormulaComponent
  index: number
  disabled: boolean
  onUpdate: (field: keyof FormulaComponent, value: string | number) => void
  onRemove: () => void
}

function FormulaComponentForm({ component, index, disabled, onUpdate, onRemove }: FormulaComponentFormProps) {
  return (
    <Card shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold text-gray-500">Komponen #{index + 1}</span>
        <Button onClick={onRemove} disabled={disabled} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Icon icon="mdi:delete-outline" className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Select label="Target" value={component.target} onChange={e => onUpdate('target', e.target.value)} options={TARGET_OPTIONS} disabled={disabled} />
        <Select label="Source" value={component.source} onChange={e => onUpdate('source', e.target.value)} options={SOURCE_OPTIONS} disabled={disabled} />
        <Input label="Multiplier" type="number" step="0.1" value={component.multiplier} onChange={e => onUpdate('multiplier', e.target.value)} placeholder="0" disabled={disabled} />
        <Input label="Allowance (mm)" type="number" value={component.allowance_mm || ''} onChange={e => onUpdate('allowance_mm', e.target.value)} placeholder="0" step="0.1" disabled={disabled} />
        <Input label="Sort Order" type="number" value={component.sort_order || index + 1} onChange={e => onUpdate('sort_order', e.target.value)} min="1" disabled={disabled} />
      </div>

      <div className="mt-3 p-2 bg-slate-50 rounded-lg">
        <p className="text-xs text-gray-500">
          Formula:{' '}
          <span className="font-mono font-medium text-blue-600">
            {component.source} × {component.multiplier}
            {component.allowance_mm ? ` + ${component.allowance_mm}mm` : ''}
          </span>
        </p>
      </div>
    </Card>
  )
}

// ============================================================
// FORMULA SECTION — reusable di Edit & Formula modal
// ============================================================

interface FormulaSectionProps {
  components: FormulaComponent[]
  disabled: boolean
  onAdd: () => void
  onUpdate: (index: number, field: keyof FormulaComponent, value: string | number) => void
  onRemove: (index: number) => void
}

function FormulaSection({ components, disabled, onAdd, onUpdate, onRemove }: FormulaSectionProps) {
  return (
    <div className="bg-white border border-green-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Formula Components</h4>
          <p className="text-xs text-gray-400 mt-0.5">Kelola rumus perhitungan dimensi box</p>
        </div>
        <Button type="button" onClick={onAdd} variant="success" size="sm" disabled={disabled} icon="mdi:plus">
          Tambah
        </Button>
      </div>

      <FormulaLegend />

      <div className="space-y-3 mt-4">
        {components.length > 0 ? (
          components.map((comp, i) => (
            <FormulaComponentForm
              key={comp.id || i}
              component={comp}
              index={i}
              disabled={disabled}
              onUpdate={(field, value) => onUpdate(i, field, value)}
              onRemove={() => onRemove(i)}
            />
          ))
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed">
            <Icon icon="mdi:calculator-off" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">Belum ada formula components</p>
            <Button variant="primary" onClick={onAdd} disabled={disabled} icon="mdi:plus" size="sm">
              Tambah Component Pertama
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// TABLE
// ============================================================

const HOVER_CLASSES: Record<string, string> = {
  blue:  'hover:text-blue-600 hover:bg-blue-50',
  green: 'hover:text-green-600 hover:bg-green-50',
  amber: 'hover:text-amber-600 hover:bg-amber-50',
  red:   'hover:text-red-600 hover:bg-red-50',
}

function ActionButton({ onClick, icon, hoverColor, title }: { onClick: () => void; icon: string; hoverColor: string; title: string }) {
  return (
    <button onClick={onClick} title={title} className={`p-2 text-gray-400 rounded-lg transition-colors ${HOVER_CLASSES[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

interface BoxModelTableProps {
  models: BoxModel[]
  totalCount: number
  search: string
  onSearchClear: () => void
  onView: (item: BoxModel) => void
  onEdit: (item: BoxModel) => void
  onAddFormula: (item: BoxModel) => void
  onDelete: (id: string, name: string) => void
}

function BoxModelTable({ models, totalCount, search, onSearchClear, onView, onEdit, onAddFormula, onDelete }: BoxModelTableProps) {
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Icon icon="mdi:package-variant-closed-off" className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium text-lg">Belum ada data box model</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {['Model', 'Kategori', 'Formula', 'Aksi'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {models.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Icon icon="mdi:package-variant-closed-off" className="w-16 h-16 text-gray-300" />
                  <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                  <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
                  <Button variant="ghost" size="sm" onClick={onSearchClear} icon="mdi:close">Hapus Pencarian</Button>
                </div>
              </td>
            </tr>
          ) : (
            models.map(model => {
              const meta = BOX_META[model.category] || DEFAULT_BOX_META
              return (
                <tr key={model.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}15` }}>
                        <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{model.namaModel}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{model.kode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={meta.accent}>{model.category}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={model.hasFormula ? '#10b981' : '#f59e0b'}>
                      {model.hasFormula ? '✓ Ada Formula' : '✗ Tanpa Formula'}
                    </Badge>
                    {model.hasFormula && (
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={formatFormula(model.formulaComponents)}>
                        {formatFormula(model.formulaComponents)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <ActionButton onClick={() => onView(model)} icon="mdi:eye-outline" hoverColor="blue" title="Lihat Detail" />
                      {!model.hasFormula && (
                        <ActionButton onClick={() => onAddFormula(model)} icon="mdi:calculator" hoverColor="green" title="Tambah Formula" />
                      )}
                      <ActionButton onClick={() => onEdit(model)} icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                      <ActionButton onClick={() => onDelete(model.id, model.namaModel)} icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {models.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-medium text-slate-700">{models.length}</span> dari{' '}
            <span className="font-medium text-slate-700">{totalCount}</span> box model
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MODALS
// ============================================================

function AddModal({ isOpen, isLoading, formData, onChange, onClose, onSubmit }: {
  isOpen: boolean; isLoading: boolean; formData: AddFormData
  onChange: (d: AddFormData) => void; onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title="Tambah Box Model Baru" size="md" closeOnOverlayClick={!isLoading}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={isLoading} disabled={isLoading} icon="mdi:check">Simpan Model</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">Kode akan digenerate otomatis. Isi semua field yang diperlukan.</p>
        </div>
        <Input label="Kode Model" value={formData.code} disabled leftIcon="mdi:tag" helperText="Kode otomatis" />
        <Input label="Nama Model" value={formData.name} onChange={e => onChange({ ...formData, name: e.target.value })} placeholder="Contoh: Mailer Box 30x20x15" required leftIcon="mdi:format-title" />
        <Select label="Kategori" value={formData.category} onChange={e => onChange({ ...formData, category: e.target.value })} options={CATEGORY_OPTIONS} leftIcon="mdi:shape" />
        <TextArea label="Deskripsi Model" value={formData.description} onChange={e => onChange({ ...formData, description: e.target.value })} rows={3} placeholder="Deskripsikan model kotak ini..." required />
      </div>
    </Modal>
  )
}

function ViewModal({ isOpen, item, onClose, onEdit }: {
  isOpen: boolean; item: BoxModel | null; onClose: () => void; onEdit: (item: BoxModel) => void
}) {
  if (!item) return null
  const meta = BOX_META[item.category] || DEFAULT_BOX_META

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Box Model" size="md"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Tutup</Button>
          <Button variant="primary" size="md" icon="mdi:pencil-outline" onClick={() => onEdit(item)}>Edit Model</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${meta.accent}0d` }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}20` }}>
            <Icon icon={meta.icon} className="w-7 h-7" style={{ color: meta.accent }} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{item.namaModel}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge color={meta.accent}>{item.category}</Badge>
              <span className="text-xs text-gray-400 font-mono">{item.kode}</span>
            </div>
          </div>
        </div>

        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-1">Deskripsi</p>
          <p className="text-sm text-slate-700">{item.deskripsi || '—'}</p>
        </Card>

        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-1">Formula</p>
          <Badge color={item.hasFormula ? '#10b981' : '#f59e0b'}>{item.hasFormula ? '✓ Ada' : '✗ Belum'}</Badge>
        </Card>

        {item.hasFormula && (
          <Card shadow="none" padding="sm" bordered>
            <p className="text-xs text-gray-500 mb-2">Rumus Perhitungan</p>
            <div className="space-y-2">
              {item.formulaComponents.map((comp, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <span className="text-xs font-semibold text-gray-500 w-16">{comp.target}:</span>
                  <span className="text-xs font-mono text-blue-600">
                    {comp.source} × {comp.multiplier}{comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Dibuat</p>
            <p className="text-sm text-slate-700">{new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Diperbarui</p>
            <p className="text-sm text-slate-700">{new Date(item.updatedAt).toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, isLoading, item, onClose, onSubmit, onChange, onFormulaAdd, onFormulaUpdate, onFormulaRemove }: {
  isOpen: boolean; isLoading: boolean; item: BoxModel | null
  onClose: () => void; onSubmit: () => void; onChange: (item: BoxModel) => void
  onFormulaAdd: () => void
  onFormulaUpdate: (i: number, field: keyof FormulaComponent, value: string | number) => void
  onFormulaRemove: (i: number) => void
}) {
  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title={`Edit Data — ${item.namaModel}`} size="full" closeOnOverlayClick={!isLoading}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={isLoading} disabled={isLoading} icon="mdi:check">Simpan Perubahan</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Informasi Dasar</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kode" value={item.kode} disabled leftIcon="mdi:tag" />
            <Input label="Nama Model" value={item.namaModel} onChange={e => onChange({ ...item, namaModel: e.target.value })} required disabled={isLoading} leftIcon="mdi:format-title" />
          </div>
          <div className="mt-4">
            <Select label="Kategori" value={item.category} onChange={e => onChange({ ...item, category: e.target.value })} options={CATEGORY_OPTIONS} disabled={isLoading} leftIcon="mdi:shape" />
          </div>
          <div className="mt-4">
            <TextArea label="Deskripsi" value={item.deskripsi || ''} onChange={e => onChange({ ...item, deskripsi: e.target.value })} rows={3} fullWidth disabled={isLoading} required />
          </div>
        </div>

        <FormulaSection
          components={item.formulaComponents || []}
          disabled={isLoading}
          onAdd={onFormulaAdd}
          onUpdate={onFormulaUpdate}
          onRemove={onFormulaRemove}
        />
      </div>
    </Modal>
  )
}

function FormulaModal({ isOpen, isLoading, item, components, onClose, onSubmit, onAdd, onUpdate, onRemove }: {
  isOpen: boolean; isLoading: boolean; item: BoxModel | null; components: FormulaComponent[]
  onClose: () => void; onSubmit: () => void; onAdd: () => void
  onUpdate: (i: number, field: keyof FormulaComponent, value: string | number) => void
  onRemove: (i: number) => void
}) {
  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title="➕ Tambah Formula" size="full" closeOnOverlayClick={!isLoading}
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={isLoading} disabled={isLoading} icon="mdi:check">Simpan Formula</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Menambahkan Formula Baru</p>
            <p className="text-xs text-blue-600 mt-1">
              Box Model: <span className="font-semibold">{item.namaModel}</span> (Kode: {item.kode})
            </p>
          </div>
        </div>

        <FormulaSection
          components={components}
          disabled={isLoading}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BoxModelsPage() {
  const { boxModels, loading, error, refetch } = useBoxModels()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFormulaModal, setShowFormulaModal] = useState(false)

  const [addFormData, setAddFormData] = useState<AddFormData>(DEFAULT_ADD_FORM)
  const [selectedItem, setSelectedItem] = useState<BoxModel | null>(null)
  const [editingItem, setEditingItem] = useState<BoxModel | null>(null)
  const [editingFormulaComponents, setEditingFormulaComponents] = useState<FormulaComponent[]>([])

  const stats = useMemo(() => calculateStats(boxModels), [boxModels])

  const filtered = useMemo(
    () => boxModels.filter(m =>
      m.namaModel.toLowerCase().includes(search.toLowerCase()) ||
      m.kode.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    ),
    [boxModels, search]
  )

  const { addFormulaComponent, updateFormulaComponent, removeFormulaComponent } = useFormulaState({
    editingItem,
    setEditingItem,
    editingFormulaComponents,
    setEditingFormulaComponents,
  })

  const { isPosting, handleAdd, handleEdit, handleFormulaSave, handleDelete, openEditModal, openFormulaModal } =
    useBoxModelActions({
      refetch,
      setShowAddModal,
      setShowEditModal,
      setShowFormulaModal,
      setShowViewModal,
      setAddFormData,
      setEditingItem,
      setEditingFormulaComponents,
    })

  if (loading) return <LoadingState message="Memuat data Box Models..." submessage="Harap tunggu sebentar" icon="mdi:package-variant-closed" />

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Icon icon="mdi:alert-circle-outline" className="w-16 h-16 text-red-400" />
      <p className="text-red-500 font-medium">{error}</p>
      <Button variant="primary" onClick={refetch} icon="mdi:refresh">Coba Lagi</Button>
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:package-variant-closed" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Box Models</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola model kotak dan rumus perhitungan dimensi</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setAddFormData({ ...DEFAULT_ADD_FORM, code: generateCode(boxModels.map(m => m.kode)) })
            setShowAddModal(true)
          }}
          variant="primary"
          size="md"
          icon="mdi:plus"
        >
          Tambah Model Baru
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Table */}
      <Card shadow="md" padding="none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Box Models</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalModels} model ({stats.withFormulas} dengan formula, {stats.withoutFormulas} tanpa formula)
            </p>
          </div>
          <Input
            placeholder="Cari model, kode, kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon="mdi:magnify"
          />
        </div>

        <BoxModelTable
          models={filtered}
          totalCount={boxModels.length}
          search={search}
          onSearchClear={() => setSearch('')}
          onView={item => { setSelectedItem(item); setShowViewModal(true) }}
          onEdit={openEditModal}
          onAddFormula={openFormulaModal}
          onDelete={handleDelete}
        />
      </Card>

      {/* Modals */}
      <AddModal
        isOpen={showAddModal}
        isLoading={isPosting}
        formData={addFormData}
        onChange={setAddFormData}
        onClose={() => setShowAddModal(false)}
        onSubmit={() => handleAdd(addFormData)}
      />

      <ViewModal
        isOpen={showViewModal}
        item={selectedItem}
        onClose={() => setShowViewModal(false)}
        onEdit={openEditModal}
      />

      <EditModal
        isOpen={showEditModal}
        isLoading={isPosting}
        item={editingItem}
        onClose={() => { setShowEditModal(false); setEditingItem(null) }}
        onSubmit={() => editingItem && handleEdit(editingItem)}
        onChange={item => setEditingItem(item)}
        onFormulaAdd={() => addFormulaComponent('edit')}
        onFormulaUpdate={(i, field, value) => updateFormulaComponent('edit', i, field, value)}
        onFormulaRemove={i => removeFormulaComponent('edit', i)}
      />

      <FormulaModal
        isOpen={showFormulaModal}
        isLoading={isPosting}
        item={editingItem}
        components={editingFormulaComponents}
        onClose={() => { setShowFormulaModal(false); setEditingItem(null) }}
        onSubmit={() => editingItem && handleFormulaSave(editingItem, editingFormulaComponents)}
        onAdd={() => addFormulaComponent('new')}
        onUpdate={(i, field, value) => updateFormulaComponent('new', i, field, value)}
        onRemove={i => removeFormulaComponent('new', i)}
      />
    </div>
  )
}