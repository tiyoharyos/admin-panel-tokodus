'use client'
// app/(protected)/pisau-registry/page.tsx

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'

import { useBoxModels, usePisauRegistry } from './hooks/usePisauRegistry'
import { usePisauActions } from './hooks/usePisauActions'
import { BASE_ADD_FORM, DIMENSION_TYPES, type AddForm } from './constants/constants'
import { formatDate, formatNumber, formatSize, generateKodePisau } from './lib/utils'
import type { BoxModel, PisauRegistry, PisauStats } from './types/types'

// ============================================================
// SHARED UI
// ============================================================

function Badge({ color, bgColor, children }: { color: string; bgColor: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: bgColor, color }}>
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

function StatsCards({ stats }: { stats: PisauStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total */}
      <Card shadow="sm" padding="md" hoverable>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Total Registry</p>
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:knife" className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-800">{stats.totalRegistry}</p>
        {stats.shippingBoxCount > 0 && (
          <div className="mt-1.5">
            <Badge color="#3b82f6" bgColor="#dbeafe">
              <Icon icon="mdi:package-variant" className="w-3 h-3 mr-1" />
              {stats.shippingBoxCount} Shipping Box
            </Badge>
          </div>
        )}
      </Card>

      {/* Dimension stats */}
      {[
        { icon: 'mdi:arrow-expand-horizontal', label: 'Rata-rata Panjang', avg: stats.avgPanjang, min: stats.minPanjang, max: stats.maxPanjang, color: '#3b82f6' },
        { icon: 'mdi:arrow-expand-vertical',   label: 'Rata-rata Lebar',   avg: stats.avgLebar,   min: stats.minLebar,   max: stats.maxLebar,   color: '#10b981' },
        { icon: 'mdi:arrow-expand-up',          label: 'Rata-rata Tinggi',  avg: stats.avgTinggi,  min: stats.minTinggi,  max: stats.maxTinggi,  color: '#8b5cf6' },
      ].map((s, i) => (
        <Card key={i} shadow="sm" padding="md" hoverable>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{s.label}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
              <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.color }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(s.avg)} cm</p>
          <p className="text-xs text-gray-400 mt-1.5">
            Min {formatNumber(s.min)} · Max {formatNumber(s.max)} cm
          </p>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// BOX MODEL SELECT
// ============================================================

function BoxModelSelect({ value, onChange, onBoxSelected, boxModels, loadingBoxModels, disabled, required }: {
  value: string
  onChange: (val: string) => void
  onBoxSelected?: (bm: BoxModel | null) => void
  boxModels: BoxModel[]
  loadingBoxModels: boolean
  disabled?: boolean
  required?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    onChange(val)
    onBoxSelected?.(boxModels.find(b => String(b.id_bm) === val) || null)
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
        Box Model {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={handleChange}
          disabled={disabled || loadingBoxModels} required={required}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:opacity-50 appearance-none pr-8">
          <option value="">{loadingBoxModels ? 'Memuat...' : 'Pilih box model'}</option>
          {boxModels.map((bm, idx) => (
            <option key={`bm-${bm.id_bm}-${idx}`} value={String(bm.id_bm)}>{bm.name}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
          {loadingBoxModels
            ? <Icon icon="mdi:loading" className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            : <Icon icon="mdi:chevron-down" className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FORM FIELDS — reused in Add & Edit modals
// ============================================================

function DimensionFields({ panjang, lebar, tinggi, isPosting, onChange }: {
  panjang: string; lebar: string; tinggi: string; isPosting: boolean
  onChange: (field: string, value: string) => void
}) {
  const values: Record<string, string> = { panjang_cm: panjang, lebar_cm: lebar, tinggi_cm: tinggi }
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ukuran (cm)</p>
      <div className="grid grid-cols-3 gap-3">
        {DIMENSION_TYPES.map(dim => (
          <Input key={dim.id} label={dim.label} type="number" step="0.1" min="0.1"
            value={values[dim.field]}
            onChange={e => onChange(dim.field, e.target.value)}
            placeholder="0.00" required disabled={isPosting}
            leftIcon={dim.icon} />
        ))}
      </div>
    </div>
  )
}

function CatatanField({ value, isPosting, onChange }: {
  value: string; isPosting: boolean; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Catatan</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        placeholder="Keterangan tambahan (opsional)..." disabled={isPosting}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none disabled:opacity-50" />
    </div>
  )
}

// ============================================================
// MODALS
// ============================================================

function AddModal({ isOpen, form, registries, boxModels, loadingBoxModels, isPosting, onChange, onClose, onSubmit }: {
  isOpen: boolean; form: AddForm; registries: PisauRegistry[]
  boxModels: BoxModel[]; loadingBoxModels: boolean; isPosting: boolean
  onChange: (field: string, value: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Pisau Baru" size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            {isPosting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <BoxModelSelect
          value={form.box_model_id}
          onChange={val => onChange('box_model_id', val)}
          onBoxSelected={bm => {
            if (bm) {
              const existingCodes = registries.map(r => r.kode_pisau)
              onChange('box_model_id', String(bm.id_bm))
              onChange('kode_pisau', generateKodePisau(existingCodes))
            } else {
              onChange('box_model_id', '')
              onChange('kode_pisau', '')
            }
          }}
          boxModels={boxModels} loadingBoxModels={loadingBoxModels} required
        />

        {/* Kode pisau — auto-generated, readonly */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Kode Pisau <span className="text-red-400">*</span>
          </label>
          <input type="text" value={form.kode_pisau} readOnly
            placeholder="Pilih box model untuk generate kode"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-slate-400 font-mono cursor-not-allowed select-none" />
        </div>

        <DimensionFields
          panjang={form.panjang_cm} lebar={form.lebar_cm} tinggi={form.tinggi_cm}
          isPosting={isPosting}
          onChange={onChange}
        />

        <CatatanField value={form.catatan} isPosting={isPosting} onChange={v => onChange('catatan', v)} />
      </div>
    </Modal>
  )
}

function EditModal({ isOpen, item, boxModels, loadingBoxModels, isPosting, onChange, onClose, onSubmit }: {
  isOpen: boolean; item: PisauRegistry | null
  boxModels: BoxModel[]; loadingBoxModels: boolean; isPosting: boolean
  onChange: (field: string, value: string) => void
  onClose: () => void; onSubmit: () => void
}) {
  if (!item) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Pisau — ${item.kode_pisau}`} size="lg"
      closeOnOverlayClick={!isPosting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPosting}>Batal</Button>
          <Button variant="primary" onClick={onSubmit} loading={isPosting} disabled={isPosting} icon="mdi:check">
            {isPosting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <BoxModelSelect
          value={item.box_model_id}
          onChange={val => onChange('box_model_id', val)}
          boxModels={boxModels} loadingBoxModels={loadingBoxModels}
          disabled={isPosting} required
        />

        {/* Kode pisau — readonly on edit */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kode Pisau</label>
          <input type="text" value={item.kode_pisau} readOnly
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-slate-400 font-mono cursor-not-allowed select-none" />
        </div>

        <DimensionFields
          panjang={item.panjang_cm} lebar={item.lebar_cm} tinggi={item.tinggi_cm}
          isPosting={isPosting} onChange={onChange}
        />

        <CatatanField value={item.catatan || ''} isPosting={isPosting} onChange={v => onChange('catatan', v)} />
      </div>
    </Modal>
  )
}

function ViewModal({ isOpen, item, onClose, onEdit }: {
  isOpen: boolean; item: PisauRegistry | null; onClose: () => void; onEdit: () => void
}) {
  if (!item) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Pisau Pond" size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button variant="primary" onClick={onEdit} icon="mdi:pencil-outline">Edit Data</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50/60">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-100">
            <Icon icon="mdi:knife" className="w-7 h-7 text-indigo-500" />
          </div>
          <p className="text-base font-semibold font-mono text-slate-800">{item.kode_pisau}</p>
        </div>

        {/* Box Model */}
        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" /> Informasi Box Model
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Kode Box</p>
              <p className="text-sm font-mono text-slate-700">{item.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Nama Box</p>
              <p className="text-sm font-medium text-slate-700">{item.name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Deskripsi</p>
              <p className="text-sm text-slate-600">{item.description || '-'}</p>
            </div>
          </div>
        </Card>

        {/* Dimensions */}
        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5" /> Ukuran
          </p>
          <div className="grid grid-cols-3 gap-3">
            {DIMENSION_TYPES.map(dim => (
              <div key={dim.id} className="text-center p-2 rounded-lg" style={{ background: `${dim.color}10` }}>
                <p className="text-xs text-gray-500 mb-1">{dim.label}</p>
                <p className="text-sm font-bold" style={{ color: dim.color }}>
                  {formatNumber(item[dim.field as keyof PisauRegistry] as string)} cm
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" />
            {formatSize(item.panjang_cm, item.lebar_cm, item.tinggi_cm)}
          </p>
        </Card>

        {/* Catatan */}
        <Card shadow="none" padding="sm" bordered>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <Icon icon="mdi:format-text" className="w-3.5 h-3.5" /> Catatan
          </p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.catatan || '-'}</p>
        </Card>

        {/* Flags */}
        <div className="flex flex-wrap gap-2">
          {item.is_shipping_box === '1' && (
            <Badge color="#3b82f6" bgColor="#dbeafe">
              <Icon icon="mdi:package-variant" className="w-3 h-3 mr-1" /> Shipping Box
            </Badge>
          )}
          {item.is_paperbag === '1' && (
            <Badge color="#d97706" bgColor="#fef3c7">
              <Icon icon="mdi:shopping" className="w-3 h-3 mr-1" /> Paper Bag
            </Badge>
          )}
          <Badge color="#8b5cf6" bgColor="#ede9fe">
            <Icon icon="mdi:ruler-square" className="w-3 h-3 mr-1" /> Input Mode: {item.input_mode}
          </Badge>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-400 flex items-center gap-4 pt-2">
          <span className="flex items-center gap-1">
            <Icon icon="mdi:clock-outline" className="w-3 h-3" />
            Dibuat: {formatDate(item.created_at)}
          </span>
          {item.updated_at && (
            <span className="flex items-center gap-1">
              <Icon icon="mdi:clock-edit-outline" className="w-3 h-3" />
              Diperbarui: {formatDate(item.updated_at)}
            </span>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function PisauRegistryPage() {
  const { registries, stats, loading, error, refetch } = usePisauRegistry()
  const { boxModels, loadingBoxModels } = useBoxModels()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PisauRegistry | null>(null)
  const [addForm, setAddForm] = useState<AddForm>({ ...BASE_ADD_FORM })
  const [search, setSearch] = useState('')

  const resetAdd = () => setAddForm({ ...BASE_ADD_FORM })

  const { isPosting, handleAdd, handleEdit, handleDelete } = usePisauActions({
    refetch, setShowAddModal, setShowEditModal, setSelectedItem, resetAdd,
  })

  const filteredRegistries = useMemo(() =>
    registries.filter(item =>
      item.kode_pisau.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      (item.catatan && item.catatan.toLowerCase().includes(search.toLowerCase()))
    ), [registries, search])

  const closeModals = () => {
    if (!isPosting) { setShowViewModal(false); setShowEditModal(false); setSelectedItem(null) }
  }

  const openEdit = (item: PisauRegistry) => {
    setSelectedItem(item); setShowViewModal(false); setShowEditModal(true)
  }

  const handleRefresh = async () => {
    const ok = await Swal.fire({
      icon: 'question', title: 'Refresh Data?', text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true, confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal',
      confirmButtonColor: '#6366f1', cancelButtonColor: '#6B7280',
    })
    if (ok.isConfirmed) {
      await refetch()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil di-refresh!', timer: 1500, showConfirmButton: false })
    }
  }

  if (loading) return <LoadingState icon="mdi:knife" message="Memuat data registry pisau..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:knife" className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Registry Pisau Pond</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola data pisau pond untuk box model</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">Refresh Data</Button>
          <Button onClick={() => { resetAdd(); setShowAddModal(true) }} variant="primary" size="md" icon="mdi:plus">
            Tambah Pisau
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} />

      {/* Table */}
      <Card shadow="md" padding="none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Pisau Pond</h3>
            <p className="text-sm text-gray-400 mt-0.5">Total {stats.totalRegistry} pisau terdaftar</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari kode, nama, catatan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon="mdi:magnify"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {registries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:knife-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data pisau</p>
              <Button variant="primary" size="sm" onClick={() => { resetAdd(); setShowAddModal(true) }} icon="mdi:plus">
                Tambah Pisau
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Kode Pisau', 'Box Model', 'Ukuran (P x L x T)', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRegistries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:knife-off" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">Tidak ada hasil</p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">Hapus Filter</Button>
                      </div>
                    </td>
                  </tr>
                ) : filteredRegistries.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Kode Pisau */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50">
                          <Icon icon="mdi:knife" className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium font-mono text-slate-800">{item.kode_pisau}</p>
                          {item.is_shipping_box === '1' && (
                            <Badge color="#3b82f6" bgColor="#dbeafe">Shipping Box</Badge>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Box Model */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.code}</p>
                    </td>

                    {/* Dimensions */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {DIMENSION_TYPES.map(dim => (
                          <div key={dim.id} className="flex items-center gap-2">
                            <Icon icon={dim.icon} className="w-3.5 h-3.5" style={{ color: dim.color }} />
                            <span className="text-xs text-gray-500 w-16">{dim.label}:</span>
                            <span className="text-xs font-semibold" style={{ color: dim.color }}>
                              {formatNumber(item[dim.field as keyof PisauRegistry] as string)} cm
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <ActionButton onClick={() => { setSelectedItem(item); setShowViewModal(true) }}
                          icon="mdi:eye-outline" hoverColor="blue" title="Lihat Detail" />
                        <ActionButton onClick={() => openEdit(item)}
                          icon="mdi:pencil-outline" hoverColor="amber" title="Edit" />
                        <ActionButton onClick={() => handleDelete(item.id, item.kode_pisau)}
                          icon="mdi:delete-outline" hoverColor="red" title="Hapus" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredRegistries.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filteredRegistries.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{registries.length}</span> data
            </p>
          </div>
        )}
      </Card>

      {/* Modals */}
      <ViewModal
        isOpen={showViewModal} item={selectedItem}
        onClose={closeModals}
        onEdit={() => selectedItem && openEdit(selectedItem)}
      />

      <AddModal
        isOpen={showAddModal} form={addForm} registries={registries}
        boxModels={boxModels} loadingBoxModels={loadingBoxModels} isPosting={isPosting}
        onChange={(field, value) => setAddForm(p => ({ ...p, [field]: value }))}
        onClose={() => { if (!isPosting) { setShowAddModal(false); resetAdd() } }}
        onSubmit={() => handleAdd(addForm)}
      />

      <EditModal
        isOpen={showEditModal} item={selectedItem}
        boxModels={boxModels} loadingBoxModels={loadingBoxModels} isPosting={isPosting}
        onChange={(field, value) => setSelectedItem(p => p ? { ...p, [field]: value } : null)}
        onClose={closeModals}
        onSubmit={() => { if (selectedItem) handleEdit(selectedItem) }}
      />
    </div>
  )
}