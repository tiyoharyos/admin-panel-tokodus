'use client'
// app/(protected)/paperbag-sheet-sizes/page.tsx

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'

import { useSheetSizes } from './hooks/useSheetSizes'
import { useSheetSizeActions } from './hooks/useSheetSizeActions'
import { CAT_COLOR_MAP, DIMENSION_TYPES, EMPTY_FORM } from './constants/constants'
import {
  applyDimensionChange,
  calcAreaM2,
  formatAreaM2,
  formatCm,
  formatMm,
  getSizeCategory,
} from './lib/utils'
import type { SheetForm, SheetSize, SheetStats } from './types/types'

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
// STATS CARDS (custom dengan gradient line)
// ============================================================

function StatsCards({ stats, filteredCount }: { stats: SheetStats; filteredCount: number }) {
  const cards = [
    { icon: 'mdi:ruler-square', label: 'Total Ukuran',     value: String(stats.totalSizes),           sub: `${stats.totalSizes} variasi ukuran`,       accent: '#3b82f6' },
    { icon: 'mdi:select-all',   label: 'Rata-rata Luas',   value: `${stats.avgArea.toFixed(4)} m²`,   sub: `Total: ${stats.totalArea.toFixed(4)} m²`,  accent: '#10b981' },
    { icon: 'mdi:arrow-expand', label: 'Luas Terbesar',    value: `${stats.maxArea.toFixed(4)} m²`,   sub: stats.largestSize?.code ?? '-',             accent: '#f59e0b' },
    { icon: 'mdi:magnify',      label: 'Hasil Pencarian',  value: String(filteredCount),               sub: `${stats.totalSizes - filteredCount} tersembunyi`, accent: '#8b5cf6' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
// TABLE (dengan gradient header dan konsistensi)
// ============================================================

function SheetTable({ data, totalCount, search, maxArea, onSearchClear, onView, onEdit, onDelete, onAdd }: {
  data: SheetSize[]; totalCount: number; search: string; maxArea: number
  onSearchClear: () => void
  onView: (i: SheetSize) => void; onEdit: (i: SheetSize) => void
  onDelete: (i: SheetSize) => void; onAdd: () => void
}) {
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <Icon icon="mdi:ruler-square" className="w-16 h-16 text-slate-300" />
        <p className="text-slate-500 font-medium text-lg">Belum ada data ukuran</p>
        <Button variant="primary" size="sm" onClick={onAdd} icon="mdi:plus">Tambah Ukuran</Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Icon icon="mdi:ruler-square" className="w-16 h-16 text-slate-300" />
          <p className="text-slate-500 font-medium text-lg">Tidak ada hasil</p>
          <p className="text-sm text-slate-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
          <Button variant="ghost" size="sm" onClick={onSearchClear} icon="mdi:close">Hapus Pencarian</Button>
        </div>
      ) : (
        <>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Ukuran', 'Code', 'Dimensi', 'Luas', 'Kategori', 'Aksi'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {data.map(item => {
                const cat = getSizeCategory(item.panjang_mm, item.lebar_mm)
                const area = calcAreaM2(item.panjang_mm, item.lebar_mm)
                const areaPercent = Math.round((area / (maxArea || 1)) * 100)
                const badgeColor = CAT_COLOR_MAP[cat.color]
                // Warna untuk icon dan background menggunakan style object karena dynamic
                const iconBgStyle = { backgroundColor: `${badgeColor}20` }
                const iconColorStyle = { color: badgeColor }

                return (
                  <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                    {/* Ukuran */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={iconBgStyle}>
                          <Icon icon={cat.icon} className="w-5 h-5" style={iconColorStyle} />
                        </div>
                        <p className="text-sm font-medium text-slate-800">{item.keterangan}</p>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="px-6 py-4">
                      <Badge color={badgeColor}>{item.code}</Badge>
                    </td>

                    {/* Dimensi */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {DIMENSION_TYPES.map(dim => (
                          <div key={dim.id} className="flex items-center gap-2">
                            <Icon icon={dim.icon} className="w-3.5 h-3.5" style={{ color: dim.color }} />
                            <span className="text-xs text-slate-400 w-16">{dim.label}:</span>
                            <span className="text-xs font-semibold" style={{ color: dim.color }}>
                              {formatCm(item[dim.field as keyof SheetSize] as string)}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({formatMm(item[dim.field as keyof SheetSize] as string)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Luas */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-lg">
                          <Icon icon="mdi:select-all" className="w-4 h-4" />
                          {formatAreaM2(item.panjang_mm, item.lebar_mm)}
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-1">
                          <div className="h-1 rounded-full" style={{ width: `${areaPercent}%`, backgroundColor: badgeColor }} />
                        </div>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}>
                        <Icon icon={cat.icon} className="w-3.5 h-3.5" />
                        {cat.label}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <ActionButton onClick={() => onView(item)} icon="mdi:eye-outline" hoverColor="blue" title="Lihat Detail" />
                        <ActionButton onClick={() => onEdit(item)} icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                        <ActionButton onClick={() => onDelete(item)} icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-400">
              Menampilkan <span className="font-semibold text-slate-600">{data.length}</span> dari{' '}
              <span className="font-semibold text-slate-600">{totalCount}</span> ukuran sheet
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// DIMENSION FORM (dengan gaya konsisten: bg-slate-50, border)
// ============================================================

function DimensionSection({ form, isPosting, onDimensionChange, onFieldChange }: {
  form: SheetForm; isPosting: boolean
  onDimensionChange: (field: 'panjang_mm' | 'lebar_mm', value: string) => void
  onFieldChange: (field: keyof SheetForm, value: string) => void
}) {
  return (
    <div className="space-y-5">
      {/* Dimensi */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:ruler" className="w-3.5 h-3.5 text-blue-600" />
          </div>
          Dimensi Sheet (mm)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Panjang (mm)" type="number" min={1} step={1}
            value={form.panjang_mm}
            onChange={e => onDimensionChange('panjang_mm', e.target.value)}
            disabled={isPosting} leftIcon="mdi:arrow-left-right" placeholder="Contoh: 650" required />
          <Input label="Lebar (mm)" type="number" min={1} step={1}
            value={form.lebar_mm}
            onChange={e => onDimensionChange('lebar_mm', e.target.value)}
            disabled={isPosting} leftIcon="mdi:arrow-up-down" placeholder="Contoh: 1000" required />
        </div>

        {/* Live luas preview */}
        {form.panjang_mm && form.lebar_mm && (
          <div className="mt-3 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200 flex items-center justify-between">
            <span className="text-xs text-blue-600 flex items-center gap-1.5">
              <Icon icon="mdi:select-all" className="w-4 h-4" />
              Preview Luas
            </span>
            <span className="text-sm font-bold text-blue-800">
              {formatAreaM2(form.panjang_mm, form.lebar_mm)}
            </span>
          </div>
        )}
      </div>

      {/* Identifikasi */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:text" className="w-3.5 h-3.5 text-amber-600" />
          </div>
          Identifikasi
        </h4>
        <Input label="Code" value={form.code}
          onChange={e => onFieldChange('code', e.target.value)}
          placeholder="Otomatis terisi dari dimensi" disabled={isPosting}
          leftIcon="mdi:barcode" helperText="Bisa diubah manual jika diperlukan" required />
        <Input label="Keterangan" value={form.keterangan}
          onChange={e => onFieldChange('keterangan', e.target.value)}
          placeholder="Otomatis terisi dari dimensi" disabled={isPosting}
          leftIcon="mdi:text" helperText="Bisa diubah manual jika diperlukan" required />
      </div>
    </div>
  )
}

// ============================================================
// MODALS
// ============================================================

function AddModal({ isOpen, form, isPosting, onDimensionChange, onFieldChange, onClose, onSubmit }: {
  isOpen: boolean; form: SheetForm; isPosting: boolean
  onDimensionChange: (f: 'panjang_mm' | 'lebar_mm', v: string) => void
  onFieldChange: (f: keyof SheetForm, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Ukuran Sheet Baru" size="lg"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            {isPosting ? 'Menyimpan...' : 'Simpan Ukuran'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Tambah Ukuran Baru</p>
            <p className="text-xs text-blue-600 mt-0.5">Masukkan dimensi dalam mm. Code dan Keterangan akan terisi otomatis.</p>
          </div>
        </div>
        <DimensionSection form={form} isPosting={isPosting}
          onDimensionChange={onDimensionChange} onFieldChange={onFieldChange} />
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, selectedItem, form, isPosting, onDimensionChange, onFieldChange, onClose, onSubmit }: {
  isOpen: boolean; selectedItem: SheetSize | null; form: SheetForm; isPosting: boolean
  onDimensionChange: (f: 'panjang_mm' | 'lebar_mm', v: string) => void
  onFieldChange: (f: keyof SheetForm, v: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Ukuran — ${selectedItem?.code}`} size="lg"
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
      {selectedItem && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:pencil-outline" className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Mode Edit</p>
              <p className="text-xs text-amber-600 mt-0.5">
                ID: <span className="font-mono font-semibold">{selectedItem.id}</span>
              </p>
            </div>
          </div>
          <DimensionSection form={form} isPosting={isPosting}
            onDimensionChange={onDimensionChange} onFieldChange={onFieldChange} />
        </div>
      )}
    </Modal>
  )
}

function ViewModal({ isOpen, item, onClose, onEdit }: {
  isOpen: boolean; item: SheetSize | null; onClose: () => void; onEdit: () => void
}) {
  if (!item) return null
  const cat = getSizeCategory(item.panjang_mm, item.lebar_mm)
  const badgeColor = CAT_COLOR_MAP[cat.color]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Ukuran Sheet" size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button variant="primary" onClick={onEdit} icon="mdi:pencil-outline">Edit Ukuran</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Identity */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/60">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${badgeColor}20` }}>
            <Icon icon={cat.icon} className="w-7 h-7" style={{ color: badgeColor }} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">{item.keterangan}</p>
            <p className="text-xs text-slate-400 mt-0.5">ID: {item.id}</p>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          {DIMENSION_TYPES.map(dim => (
            <div key={dim.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Icon icon={dim.icon} className="w-3.5 h-3.5" style={{ color: dim.color }} />
                {dim.label}
              </p>
              <p className="text-lg font-bold" style={{ color: dim.color }}>
                {formatCm(item[dim.field as keyof SheetSize] as string)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatMm(item[dim.field as keyof SheetSize] as string)}
              </p>
            </div>
          ))}
        </div>

        {/* Luas & Kategori */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Icon icon="mdi:select-all" className="w-3.5 h-3.5" /> Total Luas
            </p>
            <p className="text-lg font-bold text-violet-600">{formatAreaM2(item.panjang_mm, item.lebar_mm)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Icon icon="mdi:tag" className="w-3.5 h-3.5" /> Kategori
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}>
              <Icon icon={cat.icon} className="w-4 h-4" />
              {cat.label}
            </span>
          </div>
        </div>

        {/* Code */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Icon icon="mdi:barcode" className="w-3.5 h-3.5" /> Code
          </p>
          <Badge color={badgeColor}>{item.code}</Badge>
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function PaperbagSheetSizesPage() {
  const { sizeList, stats, loading, error, refetch } = useSheetSizes()
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  const [selectedItem, setSelectedItem] = useState<SheetSize | null>(null)
  const [addForm, setAddForm] = useState<SheetForm>({ ...EMPTY_FORM })
  const [editForm, setEditForm] = useState<SheetForm>({ ...EMPTY_FORM })

  const resetAdd = () => setAddForm({ ...EMPTY_FORM })

  const { isPosting, handleAdd, handleEdit, handleDelete, handleRefresh } = useSheetSizeActions({
    refetch, setShowAddModal, setShowEditModal, setSelectedItem, resetAdd,
  })

  const filtered = useMemo(() =>
    sizeList.filter(s =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.keterangan.toLowerCase().includes(search.toLowerCase())
    ), [sizeList, search])

  const openView = (item: SheetSize) => { setSelectedItem(item); setShowViewModal(true) }
  const openEdit = (item: SheetSize) => {
    setSelectedItem(item)
    setEditForm({ code: item.code, panjang_mm: item.panjang_mm, lebar_mm: item.lebar_mm, keterangan: item.keterangan })
    setShowViewModal(false)
    setShowEditModal(true)
  }
  const closeModal = () => {
    if (!isPosting) { setShowViewModal(false); setShowEditModal(false); setSelectedItem(null) }
  }

  if (loading) return <LoadingState icon="mdi:ruler-square" message="Memuat data Ukuran Sheet Paperbag..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    // HAPUS min-h-screen, ganti w-full
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 w-full">

      {/* Header dengan badge emas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:ruler-square" className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Ukuran Sheet Paperbag</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola dimensi dan ukuran sheet paperbag</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => handleRefresh(refetch)} variant="outline" size="md" icon="mdi:refresh">Refresh Data</Button>
          <Button onClick={() => { resetAdd(); setShowAddModal(true) }} variant="primary" size="md" icon="mdi:plus">Tambah Ukuran</Button>
        </div>
      </div>

      <StatsCards stats={stats} filteredCount={filtered.length} />

      {/* Table dengan Card style dan gradient header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b)' }} />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Daftar Ukuran Bahan Paperbag</h3>
              <p className="text-sm text-slate-400 mt-0.5">Total {stats.totalSizes} ukuran tersedia</p>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Cari kode atau keterangan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon="mdi:magnify"
              />
            </div>
          </div>
        </div>

        <SheetTable
          data={filtered} totalCount={sizeList.length} search={search} maxArea={stats.maxArea}
          onSearchClear={() => setSearch('')}
          onView={openView} onEdit={openEdit}
          onDelete={handleDelete}
          onAdd={() => { resetAdd(); setShowAddModal(true) }}
        />
      </div>

      {/* Modals */}
      <AddModal
        isOpen={showAddModal} form={addForm} isPosting={isPosting}
        onDimensionChange={(f, v) => setAddForm(prev => applyDimensionChange(prev, f, v))}
        onFieldChange={(f, v) => setAddForm(prev => ({ ...prev, [f]: v }))}
        onClose={() => !isPosting && setShowAddModal(false)}
        onSubmit={() => handleAdd(addForm)}
      />

      <EditModal
        isOpen={showEditModal} selectedItem={selectedItem} form={editForm} isPosting={isPosting}
        onDimensionChange={(f, v) => setEditForm(prev => applyDimensionChange(prev, f, v))}
        onFieldChange={(f, v) => setEditForm(prev => ({ ...prev, [f]: v }))}
        onClose={closeModal}
        onSubmit={() => { if (selectedItem) handleEdit(selectedItem, editForm) }}
      />

      <ViewModal
        isOpen={showViewModal} item={selectedItem}
        onClose={closeModal}
        onEdit={() => selectedItem && openEdit(selectedItem)}
      />
    </div>
  )
}