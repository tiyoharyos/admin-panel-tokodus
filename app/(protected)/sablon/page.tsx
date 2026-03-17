'use client'
// app/(protected)/sablon/page.tsx

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'

import { useSablon } from './hooks/useSablon'
import { useSablonActions } from './hooks/useSablonActions'
import { BASE_FORM, DEFAULT_META, SABLON_META, type SablonForm } from './constants/constants'
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
// STATS CARDS
// ============================================================

function StatsCards({ stats, sablon }: { stats: SablonStats; sablon: Sablon[] }) {
  const maxGT500 = Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt500)), 0)
  const maxGT100 = Math.max(...sablon.map(s => parseFloat(s.harga_jual_gt100)), 0)

  const items = [
    { icon: 'mdi:sticker',          label: 'Total Sablon',       value: stats.totalSablon,              sub: 'Jenis sablon tersedia' },
    { icon: 'mdi:package-variant',  label: 'Dengan Minimum Qty', value: stats.withMinimumQty,
      sub: `${stats.totalSablon - stats.withMinimumQty} tanpa minimum`,
      bar: stats.totalSablon ? (stats.withMinimumQty / stats.totalSablon) * 100 : 0 },
    { icon: 'mdi:currency-usd',     label: 'Rata-rata Harga >500', value: formatCurrency(stats.avgHargaGT500),
      sub: 'Untuk quantity >500 pcs',
      bar: maxGT500 > 0 ? (stats.avgHargaGT500 / maxGT500) * 100 : 0 },
    { icon: 'mdi:currency-usd',     label: 'Rata-rata Harga >100', value: formatCurrency(stats.avgHargaGT100),
      sub: 'Untuk quantity 100-500 pcs',
      bar: maxGT100 > 0 ? (stats.avgHargaGT100 / maxGT100) * 100 : 0 },
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
          {s.bar !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%` }} />
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// FORM FIELDS — reused in Add & Edit modals
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
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Tambah Sablon Baru" size="md"
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">Kode akan digenerate otomatis. Semua field wajib diisi.</p>
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
  const form: SablonForm = {
    code: editingItem.code, label: editingItem.label,
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-3 bg-amber-50 border border-amber-100 rounded-lg">
          <Icon icon="mdi:pencil" className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">Edit data sablon. Perubahan akan langsung diterapkan pada perhitungan harga.</p>
        </div>

        <SablonFormFields
          form={form} isPosting={isPosting}
          onChange={(f, v) => onChange(f as keyof Sablon, v)}
        />

        {/* Live preview */}
        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2">Preview Perubahan</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:palette" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{editingItem.label}</p>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-emerald-600">{formatCurrency(editingItem.harga_jual_gt500)} (&gt;500)</span>
                <span className="text-blue-600">{formatCurrency(editingItem.harga_jual_gt100)} (100-500)</span>
                <span className="text-amber-600">Min: {editingItem.qty_minimum} pcs</span>
              </div>
            </div>
          </div>
        </Card>
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
        {/* Identity */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${meta.accent}0d` }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}20` }}>
            <Icon icon={meta.icon} className="w-7 h-7" style={{ color: meta.accent }} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{item.label}</p>
            <div className="mt-1"><Badge color={meta.accent}>{item.code}</Badge></div>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card shadow="none" padding="sm" bordered>
            <p className="text-xs text-gray-500 mb-1">Harga 500 pcs</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(item.harga_jual_gt500)}</p>
          </Card>
          <Card shadow="none" padding="sm" bordered>
            <p className="text-xs text-gray-500 mb-1">Harga 100-500 pcs</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(item.harga_jual_gt100)}</p>
          </Card>
          <Card shadow="none" padding="sm" bordered>
            <p className="text-xs text-gray-500 mb-1">Minimum Quantity</p>
            <p className="text-lg font-bold text-amber-600">{parseInt(item.qty_minimum).toLocaleString()} pcs</p>
          </Card>
        </div>

        <Card shadow="none" padding="sm" bordered>
          <div className="flex items-start gap-2">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Harga berlaku untuk quantity sesuai ketentuan. Untuk quantity di bawah minimum,
              menggunakan harga khusus atau menyesuaikan dengan kebijakan.
            </p>
          </div>
        </Card>
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
    <div className="p-4 md:p-6">
      <ErrorState title="Gagal Memuat Data" message={error} onRetry={refetch} icon="mdi:alert-circle-outline" />
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:palette" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manajemen Sablon</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola jenis sablon dan harga berdasarkan quantity</p>
          </div>
        </div>
        <Button onClick={openAdd} variant="primary" size="md" icon="mdi:plus">Tambah Sablon Baru</Button>
      </div>

      <StatsCards stats={stats} sablon={sablon} />

      {/* Table */}
      <Card shadow="md" padding="none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Jenis Sablon</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalSablon} jenis sablon ({stats.withMinimumQty} dengan minimum qty)
            </p>
          </div>
          <div className="w-full sm:w-64 relative">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari label atau kode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon="mdi:magnify"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {sablon.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:sticker-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data sablon</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Kode', 'Label', 'Harga >500', 'Harga 100-500', 'Min. Qty', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:sticker-off" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Tidak ada hasil</p>
                        <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">Hapus Pencarian</Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(item => {
                  const meta = SABLON_META[item.code] || DEFAULT_META
                  return (
                    <tr key={item.id_st} className="hover:bg-slate-50/80 transition-colors">
                      {/* Kode */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${meta.accent}15` }}>
                            <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                          </div>
                          <p className="font-mono text-sm font-medium text-slate-800">{item.code}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge color={meta.accent}>{item.label}</Badge>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-emerald-600">{formatCurrency(item.harga_jual_gt500)}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-blue-600">{formatCurrency(item.harga_jual_gt100)}</p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-medium text-slate-700">
                          {parseInt(item.qty_minimum).toLocaleString()} pcs
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <ActionButton onClick={() => { setSelectedItem(item); setShowViewModal(true) }}
                            icon="mdi:eye-outline" hoverColor="blue" title="Lihat Detail" />
                          <ActionButton onClick={() => openEdit(item)}
                            icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                          <ActionButton onClick={() => handleDelete(item.id_st, item.label)}
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

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filtered.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{sablon.length}</span> jenis sablon
            </p>
          </div>
        )}
      </Card>

      {/* Modals */}
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