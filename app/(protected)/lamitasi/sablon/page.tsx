'use client'
// app/(protected)/sablon/page.tsx

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Table, TableRow, TableCell } from '@/components/UI/Table'

import { useSablon } from './hooks/useSablon'
import { useSablonActions } from './hooks/useSablonActions'
import { BASE_FORM, SABLON_META, DEFAULT_META, type SablonForm } from './constants/constants'
import { formatCurrency, generateCode } from './lib/utils'
import type { Sablon, SablonStats } from './types/types'

// ============================================================
// SHARED UI
// ============================================================

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: `${color}18`, color }}>
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
// STATS CARDS (gaya baru)
// ============================================================

function StatsCards({ stats, sablon }: { stats: SablonStats; sablon: Sablon[] }) {
  const maxGT500 = Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt500)), 0)
  const maxGT100 = Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt100)), 0)

  const items = [
    {
      icon: 'mdi:sticker',
      label: 'Total Sablon',
      value: stats.totalSablon,
      sub: 'Jenis sablon tersedia',
      accent: '#3b82f6'
    },
    {
      icon: 'mdi:package-variant',
      label: 'Dengan Minimum Qty',
      value: stats.withMinimumQty,
      sub: `${stats.totalSablon - stats.withMinimumQty} tanpa minimum`,
      accent: '#f59e0b',
      bar: stats.totalSablon ? (stats.withMinimumQty / stats.totalSablon) * 100 : 0
    },
    {
      icon: 'mdi:currency-usd',
      label: 'Rata-rata Harga >500',
      value: formatCurrency(stats.avgHargaGT500),
      sub: 'Untuk quantity >500 pcs',
      accent: '#10b981',
      bar: maxGT500 > 0 ? (stats.avgHargaGT500 / maxGT500) * 100 : 0
    },
    {
      icon: 'mdi:currency-usd',
      label: 'Rata-rata Harga >100',
      value: formatCurrency(stats.avgHargaGT100),
      sub: 'Untuk quantity 100-500 pcs',
      accent: '#8b5cf6',
      bar: maxGT100 > 0 ? (stats.avgHargaGT100 / maxGT100) * 100 : 0
    },
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
          {s.bar !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%`, background: s.accent }} />
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1.5">{s.sub}</p>
          <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${s.accent}60, transparent)` }} />
        </div>
      ))}
    </div>
  )
}

// ============================================================
// FORM FIELDS (Add/Edit)
// ============================================================

function SablonFormFields({ form, isPosting, onChange }: {
  form: SablonForm; isPosting: boolean
  onChange: (field: keyof SablonForm, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <Input label="Kode Sablon" value={form.code}
        onChange={e => onChange('code', e.target.value)}
        placeholder="Contoh: biasa, special, none"
        required leftIcon="mdi:tag" helperText="Kode unik untuk sablon" disabled={isPosting} />

      <Input label="Label Sablon" value={form.label}
        onChange={e => onChange('label', e.target.value)}
        placeholder="Contoh: Sablon Biasa, Sablon Emas"
        required leftIcon="mdi:format-title" disabled={isPosting} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Harga Jual (Qty >500)" type="number" step="100" min="0"
          value={form.harga_jual_gt500}
          onChange={e => onChange('harga_jual_gt500', e.target.value)}
          leftIcon="mdi:currency-usd" required disabled={isPosting} />
        <Input label="Harga Jual (Qty 100-500)" type="number" step="100" min="0"
          value={form.harga_jual_gt100}
          onChange={e => onChange('harga_jual_gt100', e.target.value)}
          leftIcon="mdi:currency-usd" required disabled={isPosting} />
      </div>

      <Input label="Minimum Quantity" type="number" min="0" step="1"
        value={form.qty_minimum}
        onChange={e => onChange('qty_minimum', e.target.value)}
        leftIcon="mdi:package-variant"
        helperText="Minimum order untuk harga ini (dalam pcs)"
        required disabled={isPosting} />
    </div>
  )
}

// ============================================================
// MODALS
// ============================================================

function AddModal({ isOpen, form, isPosting, onChange, onClose, onSubmit }: {
  isOpen: boolean; form: SablonForm; isPosting: boolean
  onChange: (f: keyof SablonForm, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Sablon Baru" size="md"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            Simpan Sablon
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
            <p className="text-sm font-semibold text-blue-800">Sablon Baru</p>
            <p className="text-xs text-blue-600 mt-1">Kode akan digenerate otomatis. Semua field wajib diisi.</p>
          </div>
        </div>
        <SablonFormFields form={form} isPosting={isPosting} onChange={onChange} />
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, editingItem, isPosting, onChange, onClose, onSubmit }: {
  isOpen: boolean; editingItem: Sablon | null; isPosting: boolean
  onChange: (f: keyof Sablon, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  if (!editingItem) return null
  const meta = SABLON_META[editingItem.code] || DEFAULT_META
  const form: SablonForm = {
    code: editingItem.code,
    label: editingItem.label,
    harga_jual_gt500: editingItem.harga_jual_gt500,
    harga_jual_gt100: editingItem.harga_jual_gt100,
    qty_minimum: editingItem.qty_minimum,
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Sablon — ${editingItem.label}`} size="md"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            Simpan Perubahan
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: `${meta.accent}08`, borderColor: `${meta.accent}30` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${meta.accent}18` }}>
            <Icon icon="mdi:pencil-outline" className="w-5 h-5" style={{ color: meta.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Mode Edit</p>
            <p className="text-xs text-slate-500 mt-0.5">ID: <span className="font-mono">{editingItem.id_st}</span></p>
          </div>
        </div>

        <SablonFormFields
          form={form} isPosting={isPosting}
          onChange={(f, v) => onChange(f as keyof Sablon, v)}
        />

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <Icon icon="mdi:eye-outline" className="w-3.5 h-3.5" />
            Preview Perubahan
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${meta.accent}15` }}>
              <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
            </div>
            <div>
              <p className="font-medium text-slate-800">{editingItem.label}</p>
              <div className="flex flex-wrap gap-3 mt-1 text-xs">
                <span className="text-emerald-600 font-medium">{formatCurrency(editingItem.harga_jual_gt500)} (&gt;500)</span>
                <span className="text-blue-600 font-medium">{formatCurrency(editingItem.harga_jual_gt100)} (100-500)</span>
                <span className="text-amber-600 font-medium">Min: {parseInt(editingItem.qty_minimum).toLocaleString()} pcs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ViewModal({ isOpen, item, onClose, onEdit }: {
  isOpen: boolean; item: Sablon | null; onClose: () => void; onEdit: () => void
}) {
  if (!item) return null
  const meta = SABLON_META[item.code] || DEFAULT_META

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Sablon" size="md"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Tutup</Button>
          <Button variant="primary" size="md" icon="mdi:pencil-outline" onClick={onEdit}>Edit Sablon</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${meta.accent}0d` }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}20` }}>
            <Icon icon={meta.icon} className="w-7 h-7" style={{ color: meta.accent }} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{item.label}</p>
            <div className="mt-1"><Badge color={meta.accent}>{item.code}</Badge></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Harga 500 pcs</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(item.harga_jual_gt500)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Harga 100-500 pcs</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(item.harga_jual_gt100)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Minimum Quantity</p>
            <p className="text-lg font-bold text-amber-600">{parseInt(item.qty_minimum).toLocaleString()} pcs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-start gap-2">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Harga berlaku untuk quantity sesuai ketentuan. Untuk quantity di bawah minimum,
              menggunakan harga khusus atau menyesuaikan dengan kebijakan.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SablonPage() {
  const { sablon, stats, loading, error, refetch } = useSablon()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [addForm, setAddForm] = useState<SablonForm>({ ...BASE_FORM })
  const [editingItem, setEditingItem] = useState<Sablon | null>(null)
  const [selectedItem, setSelectedItem] = useState<Sablon | null>(null)

  const resetAdd = () => setAddForm({ ...BASE_FORM })

  const { isPosting, handleAdd, handleEdit, handleDelete } = useSablonActions({
    refetch, setShowAddModal, setShowEditModal, setEditingItem, resetAdd,
  })

  const filtered = useMemo(() =>
    sablon.filter(s =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    ), [sablon, search])

  const openAdd = () => {
    setAddForm({ ...BASE_FORM, code: generateCode(sablon.map(s => s.code)) })
    setShowAddModal(true)
  }

  const openEdit = (item: Sablon) => { setEditingItem(item); setShowViewModal(false); setShowEditModal(true) }
  const closeAdd  = () => { if (!isPosting) { setShowAddModal(false); resetAdd() } }
  const closeEdit = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null) } }

  if (loading) return <LoadingState message="Memuat data Sablon..." submessage="Harap tunggu sebentar" icon="mdi:palette" />
  if (error)   return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
      <Icon icon="mdi:alert-circle-outline" className="w-16 h-16 text-red-400" />
      <p className="text-red-500 font-medium">{error}</p>
      <Button variant="primary" onClick={refetch} icon="mdi:refresh">Coba Lagi</Button>
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:palette" className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manajemen Sablon</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola jenis sablon dan harga berdasarkan quantity</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="md" onClick={refetch} icon="mdi:refresh">Refresh Data</Button>
          <Button variant="primary" size="md" onClick={openAdd} icon="mdi:plus">Tambah Sablon</Button>
        </div>
      </div>

      <StatsCards stats={stats} sablon={sablon} />

      {/* TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Daftar Jenis Sablon</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Total {stats.totalSablon} jenis sablon ({stats.withMinimumQty} dengan minimum qty)
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari label atau kode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon="mdi:magnify"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {sablon.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:sticker-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data sablon</p>
              <Button variant="primary" size="sm" onClick={openAdd} icon="mdi:plus">Tambah Sablon Pertama</Button>
            </div>
          ) : (
            <Table headers={['Kode', 'Label', 'Harga >500', 'Harga 100-500', 'Min. Qty', 'Aksi']}>
              {filtered.length === 0 ? (
                <TableRow hoverable={false}>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Icon icon="mdi:sticker-off" className="w-16 h-16 text-gray-300" />
                      <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                      <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
                      <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">Hapus Pencarian</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(item => {
                  const meta = SABLON_META[item.code] || DEFAULT_META
                  return (
                    <TableRow key={item.id_st} hoverable={false} className="hover:bg-blue-50/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${meta.accent}15` }}>
                            <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                          </div>
                          <p className="font-mono text-sm font-medium text-slate-800">{item.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge color={meta.accent}>{item.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-emerald-600">{formatCurrency(item.harga_jual_gt500)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-blue-600">{formatCurrency(item.harga_jual_gt100)}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono font-medium text-slate-700">
                          {parseInt(item.qty_minimum).toLocaleString()} pcs
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ActionButton onClick={() => { setSelectedItem(item); setShowViewModal(true) }}
                            icon="mdi:eye-outline" hoverColor="blue" title="Lihat Detail" />
                          <ActionButton onClick={() => openEdit(item)}
                            icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                          <ActionButton onClick={() => handleDelete(item.id_st, item.label)}
                            icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </Table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-400">
              Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> dari{' '}
              <span className="font-semibold text-slate-600">{sablon.length}</span> jenis sablon
            </p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <ViewModal
        isOpen={showViewModal} item={selectedItem}
        onClose={() => { setShowViewModal(false); setSelectedItem(null) }}
        onEdit={() => selectedItem && openEdit(selectedItem)}
      />

      <AddModal
        isOpen={showAddModal} form={addForm} isPosting={isPosting}
        onChange={(f, v) => setAddForm(p => ({ ...p, [f]: v }))}
        onClose={closeAdd}
        onSubmit={() => handleAdd(addForm)}
      />

      <EditModal
        isOpen={showEditModal} editingItem={editingItem} isPosting={isPosting}
        onChange={(f, v) => setEditingItem(p => p ? { ...p, [f]: v } : null)}
        onClose={closeEdit}
        onSubmit={() => { if (editingItem) handleEdit(editingItem) }}
      />
    </div>
  )
}