'use client'
// app/(protected)/flutes/page.tsx

import { useState } from 'react'
import { Icon } from '@iconify/react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'

import { useFlutes } from './hooks/useFlutes'
import { useFluteActions } from './hooks/useFluteActions'
import { BASE_FORM } from './constants/constants'
import {
  formatDate,
  getFluteAccent,
  getFluteIcon,
  resolveFluteName,
} from './lib/utils'
import type { Flute, FluteStats, FormData } from './types/types'

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
  const hoverClass: Record<string, string> = {
    amber: 'hover:text-amber-600 hover:bg-amber-50',
    red:   'hover:text-red-600 hover:bg-red-50',
  }
  return (
    <button onClick={onClick} title={title}
      className={`p-2 text-gray-400 rounded-lg transition-colors ${hoverClass[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

// ============================================================
// FLUTE PREVIEW — reused in both Add & Edit modals
// ============================================================

function FlutePreview({ code, name, label }: { code: string; name: string; label: string }) {
  const accent = getFluteAccent(code)
  return (
    <div className="p-4 rounded-lg border"
      style={{ background: `${accent}08`, borderColor: `${accent}30` }}>
      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
        <Icon icon="mdi:eye-outline" className="w-3.5 h-3.5" />
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}18` }}>
          <Icon icon={getFluteIcon(code)} className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div>
          <Badge color={accent}>{code}</Badge>
          <p className="text-sm font-medium text-slate-700 mt-1">{name}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// STATS CARDS
// ============================================================

function StatsCards({ stats }: { stats: FluteStats }) {
  const items = [
    { icon: 'mdi:layers',          label: 'Total Flutes', value: stats.totalFlutes, sub: 'jenis tersedia',       accent: '#6366f1' },
    { icon: 'mdi:alpha-b-box',     label: 'B-Flute',      value: stats.bFlute,      sub: 'ketebalan ~3mm',      accent: '#3b82f6' },
    { icon: 'mdi:alpha-c-box',     label: 'C-Flute',      value: stats.cFlute,      sub: 'ketebalan ~4mm',      accent: '#10b981' },
    { icon: 'mdi:layers-triple',   label: 'CB/BC-Flute',  value: stats.cbFlute,     sub: 'double wall',         accent: '#f59e0b' },
    { icon: 'mdi:package-variant', label: 'Others',       value: stats.ebFlute + stats.others, sub: 'E, EB, A, F, dll', accent: '#8b5cf6' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map((s, i) => (
        <Card key={i} shadow="sm" padding="md" hoverable>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{s.label}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${s.accent}15` }}>
              <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{s.value}</p>
          <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// TABLE
// ============================================================

function FluteTable({ flutes, onEdit, onDelete, onAdd }: {
  flutes: Flute[]
  onEdit: (item: Flute) => void
  onDelete: (id: string, name: string) => void
  onAdd: () => void
}) {
  if (flutes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium text-lg">Belum ada data flute</p>
        <Button variant="primary" size="sm" onClick={onAdd} icon="mdi:plus">Tambah Flute</Button>
      </div>
    )
  }

  return (
    <>
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {['Kode', 'Nama Flute', 'Tanggal Dibuat', 'Aksi'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {flutes.map(flute => {
            const accent = getFluteAccent(flute.code)
            return (
              <tr key={flute.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accent}15` }}>
                      <Icon icon={getFluteIcon(flute.code)} className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <Badge color={accent}>{flute.code}</Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-800">{flute.name}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-600">{formatDate(flute.createdAt)}</p>
                  {flute.updatedAt && flute.updatedAt !== flute.createdAt && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Icon icon="mdi:update" className="w-3 h-3" />
                      {formatDate(flute.updatedAt)}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <ActionButton onClick={() => onEdit(flute)} icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                    <ActionButton onClick={() => onDelete(flute.id, flute.name)} icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">
          Menampilkan <span className="font-medium text-slate-700">{flutes.length}</span> flute
        </p>
      </div>
    </>
  )
}

// ============================================================
// FORM FIELDS — reused in Add & Edit modals
// ============================================================

function FluteFormFields({ code, name, isPosting, accentColor, onCodeChange, onNameChange }: {
  code: string; name: string; isPosting: boolean; accentColor: string
  onCodeChange: (v: string) => void; onNameChange: (v: string) => void
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: `${accentColor}20` }}>
          <Icon icon="mdi:layers" className="w-3.5 h-3.5" style={{ color: accentColor }} />
        </div>
        Informasi Flute
      </h4>
      <Input
        label="Kode Flute *"
        value={code}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCodeChange(e.target.value)}
        placeholder="Contoh: B, C, CB, BC, EB"
        helperText="Masukkan kode flute (otomatis uppercase, maks 3 karakter)"
        maxLength={3}
        disabled={isPosting}
      />
      <Input
        label="Nama Flute *"
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
        placeholder="Contoh: B-Flute"
        helperText="Nama otomatis terisi dari kode, bisa diubah"
        disabled={isPosting}
      />
    </div>
  )
}

// ============================================================
// MODALS
// ============================================================

function AddModal({ isOpen, form, isPosting, onCodeChange, onNameChange, onClose, onSubmit }: {
  isOpen: boolean; form: FormData; isPosting: boolean
  onCodeChange: (v: string) => void; onNameChange: (v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Flute Baru" size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            {isPosting ? 'Menyimpan...' : 'Simpan Flute'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Flute Baru</p>
            <p className="text-xs text-blue-600 mt-1">Nama otomatis terisi dari kode. Maksimal 3 karakter, otomatis uppercase.</p>
          </div>
        </div>

        <FluteFormFields
          code={form.code} name={form.name} isPosting={isPosting}
          accentColor="#3b82f6"
          onCodeChange={onCodeChange} onNameChange={onNameChange}
        />

        {form.code && (
          <FlutePreview code={form.code} name={form.name} label="Preview" />
        )}
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, editingItem, isPosting, onCodeChange, onNameChange, onClose, onSubmit }: {
  isOpen: boolean; editingItem: Flute | null; isPosting: boolean
  onCodeChange: (v: string) => void; onNameChange: (v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  if (!editingItem) return null
  const accent = getFluteAccent(editingItem.code)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Flute — ${editingItem.code}`} size="md"
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
        {/* Mode edit banner */}
        <div className="flex items-center gap-3 p-4 rounded-lg border"
          style={{ background: `${accent}08`, borderColor: `${accent}30` }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}18` }}>
            <Icon icon="mdi:pencil-outline" className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Mode Edit</p>
            <p className="text-xs text-gray-500 mt-0.5">ID: <span className="font-mono">{editingItem.id}</span></p>
          </div>
        </div>

        <FluteFormFields
          code={editingItem.code} name={editingItem.name} isPosting={isPosting}
          accentColor={accent}
          onCodeChange={onCodeChange} onNameChange={onNameChange}
        />

        <FlutePreview code={editingItem.code} name={editingItem.name} label="Preview Perubahan" />

        {/* Timestamps */}
        <div className="flex items-center gap-4 text-xs text-gray-400 bg-gray-50 px-3 py-2.5 rounded-lg">
          <span className="flex items-center gap-1">
            <Icon icon="mdi:clock-outline" className="w-3 h-3" />
            Dibuat: {formatDate(editingItem.createdAt)}
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1">
            <Icon icon="mdi:update" className="w-3 h-3" />
            Diperbarui: {formatDate(editingItem.updatedAt)}
          </span>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function FlutesPage() {
  const { flutes, stats, loading, refetch } = useFlutes()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Flute | null>(null)
  const [addForm, setAddForm] = useState<FormData>({ ...BASE_FORM })

  const resetAdd = () => setAddForm({ ...BASE_FORM })
  const resetEdit = () => { /* editingItem managed externally */ }

  const { isPosting, handleAdd, openEdit, handleEdit, handleDelete } = useFluteActions({
    flutes, refetch,
    setShowAddModal, setShowEditModal,
    setEditingItem, resetAdd, resetEdit,
  })

  // ===== Code change handlers =====
  const handleAddCodeChange = (value: string) => {
    const upper = value.toUpperCase()
    setAddForm({ code: upper, name: resolveFluteName(upper) })
  }

  const handleEditCodeChange = (value: string) => {
    if (!editingItem) return
    const upper = value.toUpperCase()
    setEditingItem({ ...editingItem, code: upper, name: resolveFluteName(upper) })
  }

  const closeAdd = () => { if (!isPosting) { setShowAddModal(false); resetAdd() } }
  const closeEdit = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null) } }

  if (loading) return (
    <LoadingState icon="mdi:layers" message="Memuat Flutes..." submessage="Harap tunggu sebentar" />
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:layers" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Flutes</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola jenis flute untuk box corrugated</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="md" onClick={refetch} icon="mdi:refresh">Refresh Data</Button>
          <Button variant="primary" size="md" onClick={() => { resetAdd(); setShowAddModal(true) }} icon="mdi:plus">
            Tambah Flute
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Table */}
      <Card shadow="md" padding="none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Flutes</h3>
            <p className="text-sm text-gray-400 mt-0.5">Total {stats.totalFlutes} jenis flute terdaftar</p>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Icon icon="mdi:information-outline" className="w-3.5 h-3.5" />
            Kode flute otomatis uppercase
          </p>
        </div>

        <div className="overflow-x-auto">
          <FluteTable
            flutes={flutes}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdd={() => { resetAdd(); setShowAddModal(true) }}
          />
        </div>
      </Card>

      {/* Modals */}
      <AddModal
        isOpen={showAddModal} form={addForm} isPosting={isPosting}
        onCodeChange={handleAddCodeChange}
        onNameChange={v => setAddForm(p => ({ ...p, name: v }))}
        onClose={closeAdd}
        onSubmit={() => handleAdd(addForm)}
      />

      <EditModal
        isOpen={showEditModal} editingItem={editingItem} isPosting={isPosting}
        onCodeChange={handleEditCodeChange}
        onNameChange={v => setEditingItem(p => p ? { ...p, name: v } : null)}
        onClose={closeEdit}
        onSubmit={() => { if (editingItem) handleEdit(editingItem) }}
      />
    </div>
  )
}