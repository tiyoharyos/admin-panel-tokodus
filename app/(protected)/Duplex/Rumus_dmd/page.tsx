'use client'
// app/(protected)/duplex-dmd/page.tsx

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'

import { useDuplexDMD } from './hooks/useDuplexDMD'
import { useDuplexDMDActions } from './hooks/useDuplexDMDActions'
import { BASE_FORM } from './constants/constants'
import {
  buildSheetLabel,
  formatCurrency,
  formatLuas,
  formatUkuran,
  getGSMColor,
} from './lib/utils'
import type { DuplexDMDData, DuplexStats, FormData, GramasiItem, SheetSizeItem } from './types/types'

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

const HOVER_CLASSES: Record<string, string> = {
  blue:  'hover:text-blue-600 hover:bg-blue-50',
  amber: 'hover:text-amber-600 hover:bg-amber-50',
  red:   'hover:text-red-600 hover:bg-red-50',
}

function ActionButton({ onClick, icon, hoverColor, title }: {
  onClick: () => void; icon: string; hoverColor: string; title: string
}) {
  return (
    <button onClick={onClick} title={title} className={`p-2 text-gray-400 rounded-lg transition-colors ${HOVER_CLASSES[hoverColor]}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

// ============================================================
// STATS CARDS
// ============================================================

function StatsCards({ stats }: { stats: DuplexStats }) {
  const items = [
    { icon: 'mdi:book-open-variant', label: 'Total Records', value: stats.totalRecords, sub: `${stats.uniqueGsm} variasi GSM · ${stats.uniqueSizes} ukuran` },
    { icon: 'mdi:ruler-square', label: 'Kombinasi Ukuran', value: stats.totalCombinations, sub: `${stats.uniqueGsm} GSM × ${stats.uniqueSizes} ukuran` },
    { icon: 'mdi:cash-multiple', label: 'Rata-rata Harga', value: formatCurrency(stats.averagePrice), sub: 'per lembar' },
    { icon: 'mdi:check-circle', label: 'Data dengan Harga', value: stats.withPrice, sub: `${Math.round((stats.withPrice / stats.totalRecords) * 100) || 0}% dari total` },
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
          <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// TABLE
// ============================================================

interface TableProps {
  data: DuplexDMDData[]
  totalCount: number
  search: string
  onSearchClear: () => void
  onView: (item: DuplexDMDData) => void
  onEdit: (item: DuplexDMDData) => void
  onDelete: (item: DuplexDMDData) => void
  onAdd: () => void
}

function DuplexTable({ data, totalCount, search, onSearchClear, onView, onEdit, onDelete, onAdd }: TableProps) {
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Icon icon="mdi:book-open-variant-off" className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium text-lg">Belum ada data Duplex DMD</p>
        <Button onClick={onAdd} variant="primary" icon="mdi:plus" size="sm">Tambah Ukuran Baru</Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Icon icon="mdi:book-open-variant-off" className="w-16 h-16 text-gray-300" />
          <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
          <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
          <Button variant="ghost" size="sm" onClick={onSearchClear} icon="mdi:close">Hapus Pencarian</Button>
        </div>
      ) : (
        <>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['No', 'GSM', 'Ukuran (cm)', 'Harga per Lembar', 'Aksi'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((item, idx) => {
                const luasM2 = (item.panjang * item.lebar) / 10000
                const perM2 = item.harga_per_lembar > 0 ? item.harga_per_lembar / luasM2 : 0
                const color = getGSMColor(item.gsm)
                return (
                  <tr key={`dmd-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={color.bg}>{item.gsm} GSM</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{formatUkuran(item.panjang, item.lebar)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.harga_per_lembar > 0 ? (
                        <div>
                          <div className="text-sm font-bold text-slate-800">{formatCurrency(item.harga_per_lembar)}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{formatCurrency(perM2)}/m²</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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

          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{data.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{totalCount}</span> data
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// FORM FIELDS — reusable di Add & Edit modal
// ============================================================

interface FormFieldsProps {
  form: FormData
  formErrors: Record<string, string>
  gsmOptions: { value: string; label: string }[]
  sheetOptions: { value: string; label: string }[]
  gramasiList: GramasiItem[]
  sheetSizeList: SheetSizeItem[]
  loadingGramasi: boolean
  isPosting: boolean
  previewLabel: string
  onChangeGsm: (v: string) => void
  onChangeSheet: (v: string) => void
  onChangeHarga: (v: string) => void
}

function FormFields({
  form, formErrors, gsmOptions, sheetOptions, gramasiList, sheetSizeList,
  loadingGramasi, isPosting, previewLabel,
  onChangeGsm, onChangeSheet, onChangeHarga,
}: FormFieldsProps) {
  const selectedSize = sheetSizeList.find(i => i.id_sh === form.sheet_size_id) ?? null
  const selectedGsm = gramasiList.find(i => i.gsm === form.gsm) ?? null

  return (
    <div className="space-y-4">
      {/* GSM */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">GSM <span className="text-red-500">*</span></label>
        {loadingGramasi ? (
          <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
            <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-600">Memuat data gramasi...</span>
          </div>
        ) : (
          <Select value={form.gsm} onChange={e => onChangeGsm(e.target.value)} options={gsmOptions}
            placeholder="-- Pilih GSM --" disabled={isPosting} className={formErrors.gsm ? 'border-red-500' : ''} />
        )}
        {formErrors.gsm && <p className="text-xs text-red-600 mt-2">{formErrors.gsm}</p>}
        {!loadingGramasi && gramasiList.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">⚠ Data GSM DMD tidak tersedia</p>
        )}
      </div>

      {/* Ukuran */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran <span className="text-red-500">*</span></label>
        <Select value={form.sheet_size_id} onChange={e => onChangeSheet(e.target.value)} options={sheetOptions}
          placeholder="-- Pilih Ukuran --" disabled={isPosting} className={formErrors.sheet_size_id ? 'border-red-500' : ''} />
        {formErrors.sheet_size_id && <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>}
      </div>

      {/* Harga */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Harga per Lembar <span className="text-xs text-gray-400 ml-1">(opsional)</span>
        </label>
        <Input type="number" value={form.harga_per_lembar} onChange={e => onChangeHarga(e.target.value)}
          placeholder="0" leftIcon="mdi:cash" disabled={isPosting}
          className={formErrors.harga_per_lembar ? 'border-red-500' : ''} min="0" step="100" />
        {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
      </div>

      {/* Preview */}
      {selectedSize && selectedGsm && (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <Icon icon="mdi:check-circle" className="w-3 h-3 text-green-600" />
            </div>
            {previewLabel}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500 mb-1">GSM:</p><p className="font-medium text-gray-900">{selectedGsm.gsm} GSM</p></div>
            <div><p className="text-gray-500 mb-1">Ukuran:</p><p className="font-medium text-gray-900">{buildSheetLabel(selectedSize.panjang_sh, selectedSize.lebar_sh)}</p></div>
            <div><p className="text-gray-500 mb-1">Luas:</p><p className="font-medium text-gray-900">{formatLuas(selectedSize.panjang_sh, selectedSize.lebar_sh)} m²</p></div>
            <div>
              <p className="text-gray-500 mb-1">Harga:</p>
              <p className="font-medium text-gray-900">
                {form.harga_per_lembar && parseFloat(form.harga_per_lembar) > 0
                  ? formatCurrency(parseFloat(form.harga_per_lembar))
                  : <span className="text-gray-400 italic">(kosong / 0)</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* General Error */}
      {formErrors.general && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3">
          <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{formErrors.general}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MODALS
// ============================================================

type SharedFormProps = {
  gsmOptions: { value: string; label: string }[]
  sheetOptions: { value: string; label: string }[]
  gramasiList: GramasiItem[]
  sheetSizeList: SheetSizeItem[]
  loadingGramasi: boolean
  isPosting: boolean
}

function AddModal({ isOpen, form, formErrors, onChange, onClose, onSubmit, ...shared }: {
  isOpen: boolean; form: FormData; formErrors: Record<string, string>
  onChange: (f: string, v: string) => void; onClose: () => void; onSubmit: () => void
} & SharedFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Tambah Ukuran Duplex DMD" size="lg" closeOnOverlayClick={!shared.isPosting}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={shared.isPosting}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={shared.isPosting} disabled={shared.isPosting} icon="mdi:check">Simpan Data</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">Pilih GSM dan Ukuran yang tersedia. Harga boleh dikosongkan jika belum ada.</p>
        </div>
        <FormFields form={form} formErrors={formErrors} previewLabel="Preview Data"
          onChangeGsm={v => onChange('gsm', v)} onChangeSheet={v => onChange('sheet_size_id', v)} onChangeHarga={v => onChange('harga_per_lembar', v)}
          {...shared} />
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, editingItem, form, formErrors, onChange, onClose, onSubmit, ...shared }: {
  isOpen: boolean; editingItem: DuplexDMDData | null; form: FormData; formErrors: Record<string, string>
  onChange: (f: string, v: string) => void; onClose: () => void; onSubmit: () => void
} & SharedFormProps) {
  if (!editingItem) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`✏️ Edit Data — ${editingItem.gsm} GSM`} size="lg" closeOnOverlayClick={!shared.isPosting}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={shared.isPosting}>Batal</Button>
          <Button variant="primary" size="md" onClick={onSubmit} loading={shared.isPosting} disabled={shared.isPosting} icon="mdi:check">Update Data</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Current data banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">Data Saat Ini</h4>
              <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                <div><p className="text-blue-700 text-xs mb-1">Ukuran</p><p className="font-medium text-blue-900">{formatUkuran(editingItem.panjang, editingItem.lebar)}</p></div>
                <div><p className="text-blue-700 text-xs mb-1">GSM</p><p className="font-medium text-blue-900">{editingItem.gsm} GSM</p></div>
                <div><p className="text-blue-700 text-xs mb-1">Harga</p><p className="font-medium text-blue-900">{editingItem.harga_per_lembar > 0 ? formatCurrency(editingItem.harga_per_lembar) : '-'}</p></div>
              </div>
            </div>
          </div>
        </div>

        <FormFields form={form} formErrors={formErrors} previewLabel="Preview Update"
          onChangeGsm={v => onChange('gsm', v)} onChangeSheet={v => onChange('sheet_size_id', v)} onChangeHarga={v => onChange('harga_per_lembar', v)}
          {...shared} />
      </div>
    </Modal>
  )
}

function ViewModal({ isOpen, item, onClose, onEdit }: {
  isOpen: boolean; item: DuplexDMDData | null; onClose: () => void; onEdit: () => void
}) {
  if (!item) return null
  const luasM2 = (item.panjang * item.lebar) / 10000
  const perM2 = item.harga_per_lembar > 0 ? item.harga_per_lembar / luasM2 : 0
  const color = getGSMColor(item.gsm)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Duplex DMD" size="md"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Tutup</Button>
          <Button variant="primary" size="md" icon="mdi:pencil-outline" onClick={onEdit}>Edit Data</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${color.bg}0d` }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color.bg}20` }}>
            <Icon icon="mdi:book-open-variant" className="w-7 h-7" style={{ color: color.bg }} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">Duplex DMD</p>
            <div className="mt-1"><Badge color={color.bg}>{item.gsm} GSM</Badge></div>
          </div>
        </div>

        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2">Informasi Ukuran</p>
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs font-medium text-gray-500">Dimensi</span>
              <span className="text-sm font-medium text-slate-800">{formatUkuran(item.panjang, item.lebar)}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs font-medium text-gray-500">Luas</span>
              <span className="text-sm font-medium text-slate-800">{luasM2.toFixed(2)} m²</span>
            </div>
          </div>
        </Card>

        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2">Informasi Harga</p>
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs font-medium text-gray-500">Harga per Lembar</span>
              <span className="text-sm font-bold text-slate-800">{item.harga_per_lembar > 0 ? formatCurrency(item.harga_per_lembar) : '-'}</span>
            </div>
            {item.harga_per_lembar > 0 && (
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-xs font-medium text-gray-500">Harga per m²</span>
                <span className="text-sm font-medium text-slate-800">{formatCurrency(perM2)}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function DuplexDMDPage() {
  const { duplexData, gramasiList, sheetSizeList, loading, loadingGramasi, error, stats, refetch } = useDuplexDMD()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DuplexDMDData | null>(null)
  const [selectedItem, setSelectedItem] = useState<DuplexDMDData | null>(null)

  const [addForm, setAddForm] = useState<FormData>({ ...BASE_FORM })
  const [editForm, setEditForm] = useState<FormData>({ ...BASE_FORM })
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({})
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({})

  const resetAdd = () => { setAddForm({ ...BASE_FORM }); setAddFormErrors({}) }
  const resetEdit = () => { setEditForm({ ...BASE_FORM }); setEditFormErrors({}) }

  const { isPosting, handleAdd, handleEdit, handleDelete } = useDuplexDMDActions({
    duplexData, sheetSizeList, refetch,
    setShowAddModal, setShowEditModal,
    resetAdd, resetEdit, setEditingItem,
  })

  // ===== DERIVED =====
  const sortedData = useMemo(() =>
    [...duplexData].sort((a, b) =>
      a.gsm !== b.gsm ? a.gsm - b.gsm : a.panjang * a.lebar - b.panjang * b.lebar
    ), [duplexData])

  const filteredData = useMemo(() =>
    sortedData.filter(item =>
      item.gsm.toString().includes(search) ||
      formatUkuran(item.panjang, item.lebar).includes(search)
    ), [sortedData, search])

  const gsmOptions = useMemo(() =>
    gramasiList.map(item => ({ value: item.gsm, label: `${item.gsm} GSM` }))
  , [gramasiList])

  const sheetOptions = useMemo(() =>
    sheetSizeList.map(i => ({ value: i.id_sh, label: buildSheetLabel(i.panjang_sh, i.lebar_sh) }))
  , [sheetSizeList])

  // ===== HANDLERS =====
  const handleAddClick = () => { resetAdd(); setShowAddModal(true) }

  const handleEditClick = (item: DuplexDMDData) => {
    setEditingItem(item)
    setEditForm({
      sheet_size_id: item.sheet_size_id || '',
      gsm: item.gramasi_id || item.gsm.toString(),
      harga_per_lembar: item.harga_per_lembar > 0 ? item.harga_per_lembar.toString() : '',
    })
    setEditFormErrors({})
    setShowEditModal(true)
  }

  const closeAdd = () => { if (!isPosting) { setShowAddModal(false); resetAdd() } }
  const closeEdit = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null); resetEdit() } }

  const onAddChange = (field: string, value: string) => {
    setAddForm(p => ({ ...p, [field]: value }))
    setAddFormErrors(p => ({ ...p, [field]: '', general: '' }))
  }

  const onEditChange = (field: string, value: string) => {
    setEditForm(p => ({ ...p, [field]: value }))
    setEditFormErrors(p => ({ ...p, [field]: '' }))
  }

  const submitAdd = async () => {
    const errors = await handleAdd(addForm)
    if (errors) {
      setAddFormErrors(errors)
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi', confirmButtonColor: '#3b82f6' })
    }
  }

  const submitEdit = async () => {
    if (!editingItem) return
    const errors = await handleEdit(editingItem, editForm)
    if (errors) {
      setEditFormErrors(errors)
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi', confirmButtonColor: '#3b82f6' })
    }
  }

  const sharedFormProps = { gsmOptions, sheetOptions, gramasiList, sheetSizeList, loadingGramasi, isPosting }

  if (loading && duplexData.length === 0 && !error) return (
    <LoadingState message="Memuat Data Duplex DMD..." submessage="Harap tunggu sebentar" icon="mdi:book-open-variant" />
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:book-open-variant" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Duplex DMD</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola ukuran dan harga Duplex DMD</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-gray-600"><span className="font-medium">Total:</span> {stats.totalRecords}</span>
              <span className="text-gray-600"><span className="font-medium">GSM:</span> {stats.uniqueGsm} variasi</span>
              <span className="text-gray-600"><span className="font-medium">Ukuran:</span> {stats.uniqueSizes} unik</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refetch} icon="mdi:refresh">Refresh</Button>
          <Button onClick={handleAddClick} variant="primary" size="md" icon="mdi:plus">Tambah Ukuran DMD</Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Error banner */}
      {error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon icon="mdi:information" className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-blue-800 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <Card shadow="md" padding="none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Ukuran Duplex DMD</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalRecords} data dengan {stats.totalCombinations} kombinasi ukuran
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Input placeholder="Cari GSM atau Ukuran..." value={search} onChange={e => setSearch(e.target.value)} leftIcon="mdi:magnify" />
          </div>
        </div>

        <DuplexTable
          data={filteredData}
          totalCount={sortedData.length}
          search={search}
          onSearchClear={() => setSearch('')}
          onView={item => { setSelectedItem(item); setShowViewModal(true) }}
          onEdit={handleEditClick}
          onDelete={item => handleDelete(item.id, item.gsm, formatUkuran(item.panjang, item.lebar))}
          onAdd={handleAddClick}
        />
      </Card>

      {/* Modals */}
      <AddModal
        isOpen={showAddModal} form={addForm} formErrors={addFormErrors}
        onChange={onAddChange} onClose={closeAdd} onSubmit={submitAdd}
        {...sharedFormProps}
      />

      <EditModal
        isOpen={showEditModal} editingItem={editingItem} form={editForm} formErrors={editFormErrors}
        onChange={onEditChange} onClose={closeEdit} onSubmit={submitEdit}
        {...sharedFormProps}
      />

      <ViewModal
        isOpen={showViewModal}
        item={selectedItem}
        onClose={() => { setShowViewModal(false); setSelectedItem(null) }}
        onEdit={() => { setShowViewModal(false); if (selectedItem) handleEditClick(selectedItem) }}
      />
    </div>
  )
}