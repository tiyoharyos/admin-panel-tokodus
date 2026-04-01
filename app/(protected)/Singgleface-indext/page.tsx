'use client'
// app/(protected)/Singgleface-indext/page.tsx
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import Input from '@/components/UI/Input'

// ── logic imports ────────────────────────────────────────────
import { useSingleface } from './hooks/useSingleface'
import { useSinglefaceActions } from './hooks/useSinglefaceActions'
import { LAYER_TYPE_OPTIONS, FLUTE_COLORS, BASE_FORM } from './constants/constants'
import { getLayerMeta, formatCurrency, formatSubstanceDisplay } from './lib/utils'
import type { SinglefaceSubstance, SinglefaceFormData, FluteSelection } from './types/types'

// ============================================================
// BADGE
// ============================================================

function Badge({
  color,
  light,
  children,
}: {
  color: string
  light?: string
  children: React.ReactNode
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ background: light || `${color}18`, color }}
    >
      {children}
    </span>
  )
}

// ============================================================
// FLUTE PRICING GRID
// ============================================================

interface FlutePricingGridProps {
  formData: SinglefaceFormData
  setFormData: React.Dispatch<React.SetStateAction<SinglefaceFormData>>
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  disabled: boolean
}

function FlutePricingGrid({ formData, setFormData, errors, setErrors, disabled }: FlutePricingGridProps) {
  const handleToggleFlute = (fluteCode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      flutes: prev.flutes.map(f => (f.code === fluteCode ? { ...f, selected: checked } : f)),
    }))
    if (checked) setErrors(prev => ({ ...prev, [`price_${fluteCode}`]: '' }))
  }

  const handlePriceChange = (fluteCode: string, price: string) => {
    setFormData(prev => ({
      ...prev,
      flutes: prev.flutes.map(f => (f.code === fluteCode ? { ...f, price } : f)),
    }))
    setErrors(prev => ({ ...prev, [`price_${fluteCode}`]: '' }))
  }

  const selectedCount = formData.flutes.filter(f => f.selected).length

  if (formData.flutes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
        <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-600" />
        <p className="text-yellow-800 text-sm">Tidak ada flute tersedia. Tambahkan flute terlebih dahulu.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Icon icon="mdi:currency-usd" className="w-4 h-4 text-green-500" />
          Harga per Flute
        </h3>
        {selectedCount > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {selectedCount} flute dipilih
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500" />
          <p className="text-xs text-blue-700">Centang flute yang ingin digunakan. Minimal satu flute harus dipilih.</p>
        </div>

        {errors.flutes && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4" />
              {errors.flutes}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.flutes.map((flute, idx) => {
            const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
            return (
              <Card
                key={flute.code}
                shadow="sm"
                padding="md"
                className={`border-l-4 transition-all ${
                  flute.selected ? 'border-l-green-500 bg-green-50/30' : 'border-l-gray-300 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      id={`flute-${flute.code}`}
                      checked={flute.selected}
                      onChange={e => handleToggleFlute(flute.code, e.target.checked)}
                      disabled={disabled}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <label htmlFor={`flute-${flute.code}`} className="font-medium text-slate-800 cursor-pointer">
                        {flute.name}
                      </label>
                      <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                    </div>
                    <Input
                      label="Harga per m²"
                      type="number"
                      value={flute.price}
                      onChange={e => handlePriceChange(flute.code, e.target.value)}
                      placeholder={flute.selected ? '0' : '-'}
                      min="1"
                      disabled={disabled || !flute.selected}
                      error={flute.selected ? errors[`price_${flute.code}`] : ''}
                      leftIcon="mdi:currency-usd"
                      className={!flute.selected ? 'opacity-50' : ''}
                    />
                    {flute.selected && !flute.price && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Icon icon="mdi:alert-circle" className="w-3 h-3" />
                        Harga harus diisi
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// LAYER CONFIG SECTION — reusable di Add & Edit modal
// ============================================================

interface LayerConfigProps {
  formData: SinglefaceFormData
  setFormData: React.Dispatch<React.SetStateAction<SinglefaceFormData>>
  formErrors: Record<string, string>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  disabled: boolean
}

function LayerConfig({ formData, setFormData, formErrors, setFormErrors, disabled }: LayerConfigProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Icon icon="mdi:layers" className="w-4 h-4 text-blue-500" />
        Konfigurasi Layer
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([1, 2] as const).map(num => (
          <Card key={num} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
            <h4 className="font-medium text-slate-800 mb-3">Layer {num}</h4>
            <div className="space-y-3">
              <Input
                label="Gramasi (gsm) *"
                type="number"
                value={formData[`layer_${num}` as 'layer_1' | 'layer_2']}
                onChange={e => {
                  setFormData(prev => ({ ...prev, [`layer_${num}`]: e.target.value }))
                  setFormErrors(prev => ({ ...prev, [`layer_${num}`]: '' }))
                }}
                placeholder="125"
                min="1"
                step="1"
                disabled={disabled}
                error={formErrors[`layer_${num}`]}
                leftIcon="mdi:weight"
              />
              <Select
                label="Jenis Kertas *"
                value={formData[`layer_${num}_type` as 'layer_1_type' | 'layer_2_type']}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData(prev => ({ ...prev, [`layer_${num}_type`]: e.target.value }))
                }
                options={LAYER_TYPE_OPTIONS}
                disabled={disabled}
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
// MAIN PAGE
// ============================================================

export default function SinglefaceSettingsPage() {
  const router = useRouter()

  const {
    substances,
    flutes,
    loading,
    error,
    stats,
    pagination,
    setPagination,
    fetchAll,
    handlePageChange,
    handleItemsPerPageChange,
    addItem,
    updateItem,
    deleteItem,
  } = useSingleface()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SinglefaceSubstance | null>(null)
  const [selectedItem, setSelectedItem] = useState<SinglefaceSubstance | null>(null)
  const [addFormData, setAddFormData] = useState<SinglefaceFormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<SinglefaceFormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const {
    isPosting,
    openEditModal,
    handleAdd,
    handleEdit,
    handleDelete,
    handleRefresh,
  } = useSinglefaceActions({
    substances,
    fetchAll,
    addItem,
    updateItem,
    deleteItem,
    setShowAddModal,
    setShowEditModal,
    setAddFormData,
    setEditFormData,
    setEditingItem,
    setFormErrors,
  })

  // ===== FILTERED + PAGINATED =====
  const filteredSubstances = useMemo(() => {
    if (!search.trim()) return substances
    const q = search.toLowerCase()
    return substances.filter(
      s =>
        s.substance_code.toLowerCase().includes(q) ||
        `${s.layer_1}${s.layer_1_type}`.toLowerCase().includes(q) ||
        `${s.layer_2}${s.layer_2_type}`.toLowerCase().includes(q)
    )
  }, [substances, search])

  const paginatedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage
    return filteredSubstances.slice(start, start + pagination.itemsPerPage)
  }, [filteredSubstances, pagination.currentPage, pagination.itemsPerPage])

  useEffect(() => {
    const totalItems = filteredSubstances.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage))
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }))
  }, [filteredSubstances.length, pagination.itemsPerPage, setPagination])

  // ===== INIT FLUTE SELECTIONS for Add Modal =====
  useEffect(() => {
    if (!showAddModal || flutes.length === 0) return
    setAddFormData(prev => ({
      ...prev,
      flutes: flutes.map(f => ({ id: f.id, code: f.code, name: f.name, selected: true, price: '' })),
    }))
  }, [showAddModal, flutes])

  // ===== INIT FLUTE SELECTIONS for Edit Modal =====
  useEffect(() => {
    if (!showEditModal || !editingItem || flutes.length === 0) return
    const fluteSelections: FluteSelection[] = flutes.map(f => {
      const price = editingItem[`${f.code.toLowerCase()}_flute_price`]
      const hasPrice = price !== undefined && price !== null && parseFloat(price as string) > 0
      return {
        id: f.id,
        code: f.code,
        name: f.name,
        selected: hasPrice,
        price: hasPrice ? price!.toString() : '',
      }
    })
    setEditFormData(prev => ({ ...prev, flutes: fluteSelections }))
  }, [showEditModal, editingItem, flutes])

  // ===== MODAL CLOSE HANDLERS =====
  const handleCloseAddModal = () => {
    if (isPosting) return
    setShowAddModal(false)
    setAddFormData({ ...BASE_FORM, flutes: [] })
    setFormErrors({})
  }

  const handleCloseEditModal = () => {
    if (isPosting) return
    setShowEditModal(false)
    setEditingItem(null)
    setEditFormData({ ...BASE_FORM, flutes: [] })
    setFormErrors({})
  }

  // ===== LOADING / ERROR =====
  if (loading && substances.length === 0 && !error) {
    return <LoadingState message="Memuat Data Singleface..." submessage="Harap tunggu sebentar" icon="mdi:layers" />
  }
  if (error && substances.length === 0) {
    return <ErrorState message={error} onRetry={fetchAll} />
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:layers" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Singleface Settings</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola harga bahan singleface berdasarkan flute type</p>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="md" icon="mdi:plus" disabled={flutes.length === 0}>
          Tambah Singleface
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: 'mdi:layers', label: 'Total Substances', value: stats.totalSubstances, sub: `${stats.activeSubstances} aktif` },
          { icon: 'mdi:waveform', label: 'Flute Types', value: flutes.length, sub: flutes.map(f => f.code).join(' · ') || '-' },
          { icon: 'mdi:database', label: 'Total Indices', value: stats.totalIndices, sub: `${substances.length} substance × ${flutes.length} flute` },
        ].map((s, i) => (
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

      {/* ===== ERROR BANNER ===== */}
      {error && substances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Icon icon="mdi:alert" className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchAll} icon="mdi:refresh" className="ml-auto">Refresh</Button>
        </div>
      )}

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Singleface Substances</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalSubstances} kombinasi ({stats.withAllFlutes} dengan harga lengkap)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari substance..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon="mdi:magnify"
            />
            <button onClick={handleRefresh} title="Refresh" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Icon icon="mdi:refresh" className="w-5 h-5" />
            </button>
            <button onClick={() => router.push('/flute-settings')} title="Kelola Flutes" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <Icon icon="mdi:cog" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pagination Top */}
        {filteredSubstances.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Per halaman:</span>
                <Select
                  value={pagination.itemsPerPage.toString()}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleItemsPerPageChange(parseInt(e.target.value), filteredSubstances.length)
                  }
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                  ]}
                  className="w-20"
                />
              </div>
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
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1, pagination.totalPages)}
                disabled={pagination.currentPage === 1}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-left" className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500">
                Halaman {pagination.currentPage} dari {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1, pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-right" className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {substances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data singleface</p>
              <p className="text-sm text-gray-400">Tambahkan singleface substance baru untuk memulai</p>
              <Button onClick={() => setShowAddModal(true)} variant="primary" icon="mdi:plus" disabled={flutes.length === 0}>
                {flutes.length === 0 ? 'Tambah Flute Dulu' : 'Tambah Data Pertama'}
              </Button>
            </div>
          ) : filteredSubstances.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
              <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
              <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">Hapus Pencarian</Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'Substance', 'Layer 1', 'Layer 2', ...flutes.map(f => `${f.code}-Flute`), 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((substance, index) => {
                  const rowNum = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1
                  const l1Meta = getLayerMeta(substance.layer_1_type)
                  const l2Meta = getLayerMeta(substance.layer_2_type)
                  return (
                    <tr key={substance.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{rowNum}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {[substance.layer_1_type, substance.layer_2_type].map((code, idx) => {
                                const meta = getLayerMeta(code)
                                return (
                                  <span key={idx} className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: meta.bg }}>
                                    {code}
                                  </span>
                                )
                              })}
                            </div>
                            <p className="text-xs font-mono text-gray-400">{substance.substance_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={l1Meta.bg} light={l1Meta.light}>{substance.layer_1}{substance.layer_1_type}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={l2Meta.bg} light={l2Meta.light}>{substance.layer_2}{substance.layer_2_type}</Badge>
                      </td>
                      {flutes.map((flute, idx) => {
                        const price = substance[`${flute.code.toLowerCase()}_flute_price`]
                        const hasPrice = price !== undefined && price !== null && parseFloat(price as string) > 0
                        const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                        return (
                          <td key={flute.id} className="px-6 py-4">
                            {hasPrice ? (
                              <span className="text-sm font-medium" style={{ color: color.bg }}>
                                {formatCurrency(price as string)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedItem(substance); setShowViewModal(true) }} title="Lihat Detail" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                          </button>
                          <button onClick={() => openEditModal(substance)} title="Edit" className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(substance.id, substance.substance_code)} title="Hapus" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Icon icon="mdi:delete-outline" className="w-5 h-5" />
                          </button>
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

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="➕ Tambah Singleface Substance"
        size="xl"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" size="md" onClick={() => handleAdd(addFormData)} loading={isPosting} disabled={isPosting || flutes.length === 0} icon="mdi:check">Simpan</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">Isi gramasi dan jenis kertas untuk setiap layer. Pilih flute yang ingin digunakan dan isi harganya.</p>
          </div>
          <LayerConfig formData={addFormData} setFormData={setAddFormData} formErrors={formErrors} setFormErrors={setFormErrors} disabled={isPosting} />
          <FlutePricingGrid formData={addFormData} setFormData={setAddFormData} errors={formErrors} setErrors={setFormErrors} disabled={isPosting} />
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="✏️ Edit Singleface Substance"
        size="xl"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" size="md" onClick={() => editingItem && handleEdit(editingItem, editFormData)} loading={isPosting} disabled={isPosting || flutes.length === 0} icon="mdi:check">Simpan Perubahan</Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Mengedit Singleface Substance</p>
                <p className="text-xs text-blue-600 mt-1">
                  ID: <span className="font-mono">#{editingItem.id}</span> · Kode:{' '}
                  <span className="font-semibold">{editingItem.substance_code}</span>
                </p>
              </div>
            </div>
            <LayerConfig formData={editFormData} setFormData={setEditFormData} formErrors={formErrors} setFormErrors={setFormErrors} disabled={isPosting} />
            <FlutePricingGrid formData={editFormData} setFormData={setEditFormData} errors={formErrors} setErrors={setFormErrors} disabled={isPosting} />
          </div>
        )}
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Singleface Substance"
        size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setShowViewModal(false)}>Tutup</Button>
            <Button
              variant="primary"
              size="md"
              icon="mdi:pencil-outline"
              onClick={() => { setShowViewModal(false); if (selectedItem) openEditModal(selectedItem) }}
            >
              Edit
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const l1Meta = getLayerMeta(selectedItem.layer_1_type)
          const l2Meta = getLayerMeta(selectedItem.layer_2_type)
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100">
                  <Icon icon="mdi:layers" className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{formatSubstanceDisplay(selectedItem)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {[selectedItem.layer_1_type, selectedItem.layer_2_type].map((code, idx) => {
                        const meta = getLayerMeta(code)
                        return (
                          <span key={idx} className="w-5 h-5 rounded text-xs font-bold text-white flex items-center justify-center" style={{ background: meta.bg }}>
                            {code}
                          </span>
                        )
                      })}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{selectedItem.substance_code}</span>
                  </div>
                </div>
              </div>

              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Komposisi Layer</p>
                <div className="space-y-2">
                  {[
                    { num: 1, gsm: selectedItem.layer_1, type: selectedItem.layer_1_type, meta: l1Meta },
                    { num: 2, gsm: selectedItem.layer_2, type: selectedItem.layer_2_type, meta: l2Meta },
                  ].map(({ num, gsm, type, meta }) => (
                    <div key={num} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 w-16">Layer {num}:</span>
                        <Badge color={meta.bg} light={meta.light}>{gsm}{type}</Badge>
                      </div>
                      <span className="text-xs text-gray-400">
                        {LAYER_TYPE_OPTIONS.find(o => o.value === type)?.label?.split(' - ')[1] || type}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Harga per Flute</p>
                <div className="grid grid-cols-2 gap-2">
                  {flutes.map((flute, idx) => {
                    const price = selectedItem[`${flute.code.toLowerCase()}_flute_price`] || 0
                    const hasPrice = parseFloat(price as string) > 0
                    const color = FLUTE_COLORS[idx % FLUTE_COLORS.length]
                    return (
                      <div key={flute.code} className={`flex items-center justify-between p-2 bg-slate-50 rounded ${!hasPrice ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Badge color={color.bg} light={color.light}>{flute.code}</Badge>
                          <span className="text-xs text-gray-600">{flute.name}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: color.bg }}>
                          {hasPrice ? formatCurrency(price as string) : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {(selectedItem.created_at || selectedItem.updated_at) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Dibuat</p>
                    <p className="text-sm text-slate-700">
                      {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Diperbarui</p>
                    <p className="text-sm text-slate-700">
                      {selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}