'use client'
// app/(protected)/index-lainnya/page.tsx

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Table, TableRow, TableCell } from '@/components/UI/Table' // ✅ Gunakan komponen tabel global

import { useIndexLainnya } from './hooks/useIndexLainnya'
import { useIndexLainnyaActions } from './hooks/useIndexLainnyaActions'
import { BASE_ADD_FORM } from './constants/constants'
import {
  formatConfigKeyLabel,
  formatQtyRange,
  formatRawValue,
  formatValue,
  getAccent,
  getValueIcon,
  isPercentage,
  qtyRangeBadgeColor,
} from './lib/utils'
import type { AddFormData, ConfigKeyGroup, IndexLainnya, IndexStats } from './types/types'

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

function ActionButton({ onClick, icon, hoverColor, title }: {
  onClick: () => void; icon: string; hoverColor: string; title: string
}) {
  const cls: Record<string, string> = {
    blue:  'hover:text-blue-600 hover:bg-blue-50',
    amber: 'hover:text-amber-600 hover:bg-amber-50',
    red:   'hover:text-red-600 hover:bg-red-50',
  }
  return (
    <button onClick={onClick} title={title}
      className={`p-2 text-gray-400 rounded-lg transition-colors ${cls[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

// ============================================================
// VALUE DISPLAY — shows both raw & formatted side-by-side
// ============================================================

function ValueCell({ value, accentBg }: { value: string | null; accentBg: string }) {
  if (!value || value === 'null') return <span className="text-sm text-gray-300 italic">-</span>
  const pct = isPercentage(value)
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-bold" style={{ color: accentBg }}>{formatValue(value)}</span>
      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded w-fit">
        {pct ? `${parseFloat(value).toFixed(4)}` : formatRawValue(value)}
      </span>
    </div>
  )
}

// ============================================================
// STATS CARDS (gaya baru: rounded-2xl, hover, garis gradien)
// ============================================================

function StatsCards({ stats }: { stats: IndexStats }) {
  const items = [
    { icon: 'mdi:database',         label: 'Total Data',        value: stats.totalItems,        sub: `dalam ${stats.totalConfigKeys} config key`, accent: '#3b82f6' },
    { icon: 'mdi:key-variant',       label: 'Config Keys',       value: stats.totalConfigKeys,   sub: 'tipe konfigurasi unik', accent: '#3b82f6' },
    { icon: 'mdi:package-variant',   label: 'Dengan Qty Range',  value: stats.withQuantityRange, sub: `dari ${stats.totalItems} total data`, accent: '#f59e0b' },
    { icon: 'mdi:check-circle',      label: 'Dengan Value',      value: stats.withValue,         sub: 'memiliki nilai konfigurasi', accent: '#3b82f6' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">{s.label}</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.accent}15` }}>
              <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{s.value}</p>
          <p className="text-xs text-slate-400 mt-1.5">{s.sub}</p>
          <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${s.accent}60, transparent)` }} />
        </div>
      ))}
    </div>
  )
}

// ============================================================
// FILTER TABS (dengan warna biru untuk aktif)
// ============================================================

function FilterTabs({ groups, allConfigKeys, selected, total, onSelect }: {
  groups: ConfigKeyGroup[]; allConfigKeys: string[]; selected: string; total: number
  onSelect: (key: string) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Icon icon="mdi:filter-outline" className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSelect('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selected === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({total})
          </button>
          {groups.map(group => {
            const accent = getAccent(group.config_key, allConfigKeys)
            const isActive = selected === group.config_key
            return (
              <button
                key={group.config_key}
                onClick={() => onSelect(group.config_key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={isActive
                  ? { background: accent.bg, color: '#fff' }
                  : { background: `${accent.bg}12`, color: accent.text }
                }
              >
                {formatConfigKeyLabel(group.config_key)} ({group.items.length})
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// GROUPED VIEW (menggunakan komponen Table global)
// ============================================================

function GroupedView({ groups, allConfigKeys, onDetail, onEdit, onDelete }: {
  groups: ConfigKeyGroup[]; allConfigKeys: string[]
  onDetail: (i: IndexLainnya) => void; onEdit: (i: IndexLainnya) => void
  onDelete: (i: IndexLainnya) => void
}) {
  return (
    <div className="space-y-4">
      {groups.map(group => {
        const accent = getAccent(group.config_key, allConfigKeys)
        return (
          <div key={group.config_key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Group header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
              style={{ background: `${accent.bg}08` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent.bg}18` }}>
                  <Icon icon={getValueIcon(group.items[0]?.value)} className="w-5 h-5" style={{ color: accent.bg }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{formatConfigKeyLabel(group.config_key)}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: accent.text }}>
                    {group.config_key} · {group.items.length} item
                  </p>
                </div>
              </div>
              <Badge color={accent.bg}>{group.items.length} item</Badge>
            </div>

            {/* ✅ Menggunakan Table global */}
            <Table headers={['Keterangan', 'Range Qty', 'Nilai', 'Aksi']}>
              {group.items.map(item => (
                <TableRow key={item.id} hoverable={false} className="hover:bg-blue-50/40 transition-colors">
                  <TableCell>{item.keterangan || '-'}</TableCell>
                  <TableCell>
                    <Badge color={qtyRangeBadgeColor(item.qty_max)}>
                      {formatQtyRange(item.qty_min, item.qty_max)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ValueCell value={item.value} accentBg={getAccent(item.config_key, allConfigKeys).bg} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ActionButton onClick={() => onDetail(item)} icon="mdi:eye-outline" hoverColor="blue" title="Detail" />
                      <ActionButton onClick={() => onEdit(item)} icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                      <ActionButton onClick={() => onDelete(item)} icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// FORM FIELDS — reused in Add & Edit modals (dengan fokus biru)
// ============================================================

function QtyRangeSection({ qtyMin, qtyMax, isPosting, onMinChange, onMaxChange }: {
  qtyMin: string; qtyMax: string; isPosting: boolean
  onMinChange: (v: string) => void; onMaxChange: (v: string) => void
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <Icon icon="mdi:package-variant" className="w-3.5 h-3.5 text-blue-600" />
        </div>
        Range Quantity <span className="text-xs font-normal text-gray-400 ml-1">(opsional)</span>
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Qty Min" type="number" value={qtyMin}
          onChange={e => onMinChange(e.target.value)}
          placeholder="0" helperText="Kosongkan = tidak ada batas bawah" disabled={isPosting} />
        <Input label="Qty Max" type="number" value={qtyMax}
          onChange={e => onMaxChange(e.target.value)}
          placeholder="kosongkan = ∞" helperText="Kosongkan = tidak ada batas atas" disabled={isPosting} />
      </div>
      {(qtyMin || qtyMax) && (
        <p className="text-xs text-blue-600 mt-2 font-medium">
          → {formatQtyRange(qtyMin || null, qtyMax || null)}
        </p>
      )}
    </div>
  )
}

function ValueSection({ value, keterangan, isPosting, onValueChange, onKetChange }: {
  value: string; keterangan: string; isPosting: boolean
  onValueChange: (v: string) => void; onKetChange: (v: string) => void
}) {
  const preview = value ? formatValue(value) : null
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
          <Icon icon="mdi:cash" className="w-3.5 h-3.5 text-amber-600" />
        </div>
        Nilai &amp; Keterangan
      </h4>
      <div className="space-y-3">
        <Input label="Value *" type="number" step="0.0001" value={value}
          onChange={e => onValueChange(e.target.value)}
          placeholder="Contoh: 500.0000 atau 0.1000"
          helperText={preview ? `Preview: ${preview}` : 'Desimal untuk persentase (0.1 = 10%), angka besar untuk IDR'}
          required disabled={isPosting} />
        <Input label="Keterangan" value={keterangan}
          onChange={e => onKetChange(e.target.value)}
          placeholder="Contoh: Margin >= 1000 pcs (10%)"
          helperText="Deskripsi singkat konfigurasi ini"
          disabled={isPosting} />
      </div>
    </div>
  )
}

// ============================================================
// MODALS (dengan info box biru untuk add)
// ============================================================

function AddModal({ isOpen, form, isPosting, allConfigKeys, onChange, onClose, onSubmit }: {
  isOpen: boolean; form: AddFormData; isPosting: boolean; allConfigKeys: string[]
  onChange: (field: keyof AddFormData, value: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Data Index Lainnya" size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            {isPosting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-blue-50 border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Data Baru</p>
            <p className="text-xs text-blue-600 mt-1"><strong>Config Key</strong> dan <strong>Value</strong> wajib diisi.</p>
          </div>
        </div>

        {/* Config Key with datalist suggestions */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Config Key <span className="text-red-500">*</span>
          </label>
          <input
            list="config-key-suggestions"
            value={form.config_key}
            onChange={e => onChange('config_key', e.target.value)}
            placeholder="Pilih yang ada atau ketik baru (snake_case)"
            disabled={isPosting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <datalist id="config-key-suggestions">
            {allConfigKeys.map(key => <option key={key} value={key} />)}
          </datalist>
          <p className="text-xs text-gray-400 mt-1">
            {allConfigKeys.length} config key tersedia · Format: snake_case
          </p>
        </div>

        <QtyRangeSection
          qtyMin={form.qty_min} qtyMax={form.qty_max} isPosting={isPosting}
          onMinChange={v => onChange('qty_min', v)} onMaxChange={v => onChange('qty_max', v)}
        />

        <ValueSection
          value={form.value} keterangan={form.keterangan} isPosting={isPosting}
          onValueChange={v => onChange('value', v)} onKetChange={v => onChange('keterangan', v)}
        />
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, item, isPosting, allConfigKeys, onChange, onClose, onSubmit }: {
  isOpen: boolean; item: IndexLainnya | null; isPosting: boolean; allConfigKeys: string[]
  onChange: (field: keyof IndexLainnya, value: string | null) => void
  onClose: () => void; onSubmit: () => void
}) {
  if (!item) return null
  const accent = getAccent(item.config_key, allConfigKeys)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit — ${item.config_key}`} size="lg"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Banner dengan warna sesuai config key */}
        <div className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: `${accent.bg}08`, borderColor: `${accent.bg}30` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent.bg}18` }}>
            <Icon icon="mdi:pencil-outline" className="w-5 h-5" style={{ color: accent.bg }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Mode Edit</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.config_key}</p>
          </div>
        </div>

        <QtyRangeSection
          qtyMin={item.qty_min || ''} qtyMax={item.qty_max || ''} isPosting={isPosting}
          onMinChange={v => onChange('qty_min', v || null)}
          onMaxChange={v => onChange('qty_max', v || null)}
        />

        <ValueSection
          value={item.value || ''} keterangan={item.keterangan || ''} isPosting={isPosting}
          onValueChange={v => onChange('value', v)}
          onKetChange={v => onChange('keterangan', v)}
        />
      </div>
    </Modal>
  )
}

function DetailModal({ isOpen, item, allConfigKeys, onClose, onEdit }: {
  isOpen: boolean; item: IndexLainnya | null; allConfigKeys: string[]
  onClose: () => void; onEdit: () => void
}) {
  if (!item) return null
  const accent = getAccent(item.config_key, allConfigKeys)
  const pct = isPercentage(item.value)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Konfigurasi" size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button variant="primary" icon="mdi:pencil-outline" onClick={onEdit}>Edit Data</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${accent.bg}0d` }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent.bg}20` }}>
            <Icon icon={getValueIcon(item.value)} className="w-7 h-7" style={{ color: accent.bg }} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{formatConfigKeyLabel(item.config_key)}</p>
            <p className="text-xs font-mono mt-1" style={{ color: accent.text }}>{item.config_key}</p>
            {item.keterangan && (
              <p className="text-xs text-gray-500 mt-1 italic">{item.keterangan}</p>
            )}
          </div>
        </div>

        {/* Value card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <Icon icon="mdi:cash-multiple" className="w-3.5 h-3.5" /> Nilai
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Raw Value</p>
              <p className="font-mono font-bold text-slate-700 text-sm">{formatRawValue(item.value)}</p>
              {pct && <p className="text-xs text-gray-400 mt-0.5">(desimal)</p>}
            </div>
            <div className="p-3 rounded-lg" style={{ background: `${accent.bg}10` }}>
              <p className="text-xs mb-1" style={{ color: accent.text }}>
                {pct ? 'Persentase' : 'Harga (IDR)'}
              </p>
              <p className="font-bold text-lg" style={{ color: accent.bg }}>{formatValue(item.value)}</p>
            </div>
          </div>
        </div>

        {/* Qty range */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" /> Range Quantity
          </p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="text-xs text-green-600 mb-1">Minimum</p>
              <p className="font-bold text-green-800 text-sm">
                {item.qty_min !== null ? `${parseInt(item.qty_min).toLocaleString()} pcs` : '0 pcs'}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Maximum</p>
              <p className="font-bold text-blue-800 text-sm">
                {item.qty_max && item.qty_max !== '0'
                  ? `${parseInt(item.qty_max).toLocaleString()} pcs`
                  : '∞ (tanpa batas)'}
              </p>
            </div>
          </div>
          <div className="text-center">
            <Badge color={qtyRangeBadgeColor(item.qty_max)}>
              {formatQtyRange(item.qty_min, item.qty_max)}
            </Badge>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE (dengan header biru dan dot amber)
// ============================================================

export default function IndexLainnyaPage() {
  const { indexData, configKeyGroups, allConfigKeys, stats, loading, error, refetch } = useIndexLainnya()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [addForm, setAddForm] = useState<AddFormData>({ ...BASE_ADD_FORM })
  const [editingItem, setEditingItem] = useState<IndexLainnya | null>(null)
  const [selectedItem, setSelectedItem] = useState<IndexLainnya | null>(null)
  const [selectedKey, setSelectedKey] = useState<string>('all')

  const resetAdd = () => setAddForm({ ...BASE_ADD_FORM })

  const { isPosting, handleAdd, handleEdit, handleDelete, handleRefresh } = useIndexLainnyaActions({
    refetch, setShowAddModal, setShowEditModal, setEditingItem, resetAdd,
  })

  const filteredData = useMemo(() =>
    selectedKey === 'all' ? indexData : indexData.filter(i => i.config_key === selectedKey)
  , [indexData, selectedKey])

  const openDetail = (item: IndexLainnya) => { setSelectedItem(item); setShowDetailModal(true) }
  const openEdit   = (item: IndexLainnya) => { setEditingItem({ ...item }); setShowEditModal(true) }
  const closeAdd   = () => { if (!isPosting) { setShowAddModal(false); resetAdd() } }
  const closeEdit  = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null) } }

  if (loading) return <LoadingState message="Memuat Index Lainnya..." icon="mdi:database-settings" />
  if (error)   return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header (gaya Box Models) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:database-settings" className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Index Lainnya</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola data index, margin, dan biaya produksi</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="md" onClick={() => handleRefresh(refetch)} icon="mdi:refresh">
            Refresh Data
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowAddModal(true)} icon="mdi:plus">
            Tambah Data
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <FilterTabs
        groups={configKeyGroups} allConfigKeys={allConfigKeys}
        selected={selectedKey} total={indexData.length}
        onSelect={setSelectedKey}
      />

      {/* Content */}
      {indexData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center gap-3 py-16">
            <Icon icon="mdi:database-off" className="w-16 h-16 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg">Belum ada data</p>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} icon="mdi:plus">
              Tambah Data
            </Button>
          </div>
        </div>
      ) : selectedKey === 'all' ? (
        <GroupedView
          groups={configKeyGroups} allConfigKeys={allConfigKeys}
          onDetail={openDetail} onEdit={openEdit}
          onDelete={item => handleDelete(item.id, item.keterangan || item.config_key)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-800">{formatConfigKeyLabel(selectedKey)}</h3>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{selectedKey} · {filteredData.length} item</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedKey('all')} icon="mdi:arrow-left">
                Lihat Semua
              </Button>
            </div>
          </div>

          {/* ✅ Menggunakan Table global untuk tampilan flat */}
          <Table headers={['Keterangan', 'Range Qty', 'Nilai', 'Aksi']}>
            {filteredData.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                  Tidak ada data untuk filter ini
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map(item => (
                <TableRow key={item.id} hoverable={false} className="hover:bg-blue-50/40 transition-colors">
                  <TableCell>{item.keterangan || '-'}</TableCell>
                  <TableCell>
                    <Badge color={qtyRangeBadgeColor(item.qty_max)}>
                      {formatQtyRange(item.qty_min, item.qty_max)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ValueCell value={item.value} accentBg={getAccent(item.config_key, allConfigKeys).bg} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ActionButton onClick={() => openDetail(item)} icon="mdi:eye-outline" hoverColor="blue" title="Detail" />
                      <ActionButton onClick={() => openEdit(item)} icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                      <ActionButton onClick={() => handleDelete(item.id, item.keterangan || item.config_key)} icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>

          {filteredData.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-sm text-slate-400">
                Menampilkan <span className="font-semibold text-slate-600">{filteredData.length}</span> item
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddModal
        isOpen={showAddModal} form={addForm} isPosting={isPosting} allConfigKeys={allConfigKeys}
        onChange={(f, v) => setAddForm(p => ({ ...p, [f]: v }))}
        onClose={closeAdd}
        onSubmit={() => handleAdd(addForm)}
      />

      <EditModal
        isOpen={showEditModal} item={editingItem} isPosting={isPosting} allConfigKeys={allConfigKeys}
        onChange={(f, v) => setEditingItem(p => p ? { ...p, [f]: v } : null)}
        onClose={closeEdit}
        onSubmit={() => { if (editingItem) handleEdit(editingItem) }}
      />

      <DetailModal
        isOpen={showDetailModal} item={selectedItem} allConfigKeys={allConfigKeys}
        onClose={() => { setShowDetailModal(false); setSelectedItem(null) }}
        onEdit={() => {
          setShowDetailModal(false)
          if (selectedItem) openEdit(selectedItem)
        }}
      />
    </div>
  )
}