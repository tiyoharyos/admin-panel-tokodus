'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Table, TableRow, TableCell } from '@/components/UI/Table'

// ============ TYPES ============
interface Machine {
  id_ma: string
  name_ma: string
  bahan_max_p_cm: string
  bahan_max_l_cm: string
  bahan_min_p_cm: string
  bahan_min_l_cm: string
  harga_blok: string
  harga_tulisan: string
  harga_separasi: string
}

interface ApiResponse {
  status: number
  message: string
  data: Machine[]
}

interface UpdateMachineFormData {
  id_ma: string
  name_ma: string
  bahan_max_p_cm: number
  bahan_max_l_cm: number
  bahan_min_p_cm: number
  bahan_min_l_cm: number
  harga_blok: number
  harga_tulisan: number
  harga_separasi: number
}

// ============ CONSTANTS ============
const PRINT_TYPES = [
  { id: 'blok',     label: 'Cetak Blok',     field: 'harga_blok',     icon: 'mdi:layers',      color: '#3b82f6' },
  { id: 'tulisan',  label: 'Cetak Tulisan',   field: 'harga_tulisan',  icon: 'mdi:format-text', color: '#10b981' },
  { id: 'separasi', label: 'Cetak Separasi',  field: 'harga_separasi', icon: 'mdi:palette',     color: '#8b5cf6' },
] as const

const MACHINE_META: Record<string, { icon: string; accent: string }> = {
  'PM52': { icon: 'mdi:printer',       accent: '#3b82f6' },
  'SM74': { icon: 'mdi:printer-check', accent: '#10b981' },
}
const DEFAULT_MACHINE_META = { icon: 'mdi:printer', accent: '#64748b' }

// ============ UTILS ============
const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(num)
}

const formatSize = (panjang: string, lebar: string) =>
  `${parseFloat(panjang).toFixed(1)} × ${parseFloat(lebar).toFixed(1)} cm`

const getMachineMeta = (name: string) =>
  MACHINE_META[name?.toUpperCase()] || DEFAULT_MACHINE_META

// ============ BADGE ============
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

// ============ ACTION BUTTON ============
function ActionButton({ onClick, icon, hoverClass, title }: {
  onClick: () => void; icon: string; hoverClass: string; title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 text-slate-400 rounded-lg transition-colors ${hoverClass}`}
    >
      <Icon icon={icon} className="w-5 h-5" />
    </button>
  )
}

// ============ STATS CARDS ============
function StatsCards({ stats }: {
  stats: { totalMachines: number; configuredCount: number; priceRange: { min: number; max: number; avgBlok: number } }
}) {
  const items = [
    { icon: 'mdi:layers',     label: 'Harga Cetak Blok',  value: formatCurrency(stats.priceRange.avgBlok), sub: 'Rata-rata semua mesin',      accent: '#3b82f6' },
    { icon: 'mdi:cash-minus', label: 'Harga Terendah',    value: formatCurrency(stats.priceRange.min),     sub: 'Dari semua tipe cetak',      accent: '#10b981' },
    { icon: 'mdi:cash-plus',  label: 'Harga Tertinggi',   value: formatCurrency(stats.priceRange.max),     sub: 'Dari semua tipe cetak',      accent: '#f59e0b' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">{s.label}</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.accent}15` }}>
              <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 truncate">{s.value}</p>
          <p className="text-xs text-slate-400 mt-1.5">{s.sub}</p>
          <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${s.accent}60, transparent)` }} />
        </div>
      ))}
    </div>
  )
}

// ============ HOOKS ============
const useMachineStats = (machines: Machine[]) => {
  return useMemo(() => {
    const totalMachines = machines.length
    const allPrices = machines.flatMap(m => [
      parseFloat(m.harga_blok),
      parseFloat(m.harga_tulisan),
      parseFloat(m.harga_separasi)
    ]).filter(p => !isNaN(p) && p > 0)

    const avgBlok = machines.length
      ? machines.reduce((acc, m) => acc + parseFloat(m.harga_blok), 0) / machines.length
      : 0

    const configuredCount = machines.filter(m =>
      parseFloat(m.bahan_max_p_cm) > 0 && parseFloat(m.bahan_max_l_cm) > 0
    ).length

    return {
      totalMachines,
      configuredCount,
      priceRange: {
        min: allPrices.length > 0 ? Math.min(...allPrices) : 0,
        max: allPrices.length > 0 ? Math.max(...allPrices) : 0,
        avgBlok
      }
    }
  }, [machines])
}

// ============ MAIN COMPONENT ============
export default function PrintSettingsPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)

  const stats = useMachineStats(machines)

  const filteredMachines = useMemo(() =>
    machines.filter(machine =>
      machine.name_ma.toLowerCase().includes(search.toLowerCase()) ||
      machine.id_ma.includes(search)
    ), [machines, search])

  // ===== API =====
  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('Admin/Cetak/Machine')
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setMachines(response.data.data)
      } else {
        setMachines([])
      }
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat memuat data'
      if (err && typeof err === 'object' && 'response' in err) {
        const errResponse = err as { response?: { status?: number; data?: { message?: string } } }
        if (errResponse.response?.status === 404 || errResponse.response?.status === 204) {
          setMachines([])
          setError(null)
          return
        }
        errorMessage = errResponse.response?.data?.message || errorMessage
      } else if (err && typeof err === 'object' && 'code' in err) {
        const errCode = err as { code?: string }
        errorMessage = errCode.code === 'ECONNABORTED'
          ? 'Koneksi timeout. Silakan coba lagi.'
          : 'Tidak bisa connect ke server.'
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      setMachines([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMachines() }, [fetchMachines])

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async () => {
    const result = await Swal.fire({
      icon: 'question', title: 'Refresh Data?', text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true, confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6', cancelButtonColor: '#6B7280'
    })
    if (result.isConfirmed) {
      await fetchMachines()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil di-refresh!', timer: 1500, showConfirmButton: false })
    }
  }, [fetchMachines])

  const handleViewDetails = useCallback((machine: Machine) => {
    setSelectedMachine(machine)
    setIsViewModalOpen(true)
  }, [])

  const handleEdit = useCallback((machine: Machine) => {
    setSelectedMachine(machine)
    setIsViewModalOpen(false)
    setIsEditModalOpen(true)
  }, [])

  const handleUpdate = useCallback(async (formData: UpdateMachineFormData) => {
    if (!selectedMachine) return
    try {
      setPosting(true)
      Swal.fire({ title: 'Loading...', text: 'Menyimpan perubahan...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() })

      await axios.put(`Admin/Cetak/MachineEdit/${formData.id_ma}`, {
        name_ma:        formData.name_ma,
        bahan_max_p_cm: formData.bahan_max_p_cm,
        bahan_max_l_cm: formData.bahan_max_l_cm,
        bahan_min_p_cm: formData.bahan_min_p_cm,
        bahan_min_l_cm: formData.bahan_min_l_cm,
        harga_blok:     formData.harga_blok,
        harga_tulisan:  formData.harga_tulisan,
        harga_separasi: formData.harga_separasi,
      })

      Swal.close()
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Machine settings berhasil diperbarui!', timer: 1500, showConfirmButton: false })
      setIsEditModalOpen(false)
      setSelectedMachine(null)
      await fetchMachines()
    } catch (err: unknown) {
      Swal.close()
      let msg = 'Gagal mengupdate machine settings'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        msg = e.response?.data?.message || msg
      } else if (err instanceof Error) {
        msg = err.message
      }
      Swal.fire({ icon: 'error', title: 'Error!', text: msg, confirmButtonColor: '#3b82f6' })
    } finally {
      setPosting(false)
    }
  }, [selectedMachine, fetchMachines])

  const handleCloseModal = useCallback(() => {
    if (!posting) {
      setIsViewModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedMachine(null)
    }
  }, [posting])

  const handleSubmitEdit = useCallback(() => {
    const form = document.forms.namedItem('editForm')
    if (form && selectedMachine) {
      const getNum = (name: string) => parseFloat((form.elements.namedItem(name) as HTMLInputElement).value)
      const getStr = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value
      handleUpdate({
        id_ma:          selectedMachine.id_ma,
        name_ma:        getStr('name_ma'),
        bahan_max_p_cm: getNum('bahan_max_p_cm'),
        bahan_max_l_cm: getNum('bahan_max_l_cm'),
        bahan_min_p_cm: getNum('bahan_min_p_cm'),
        bahan_min_l_cm: getNum('bahan_min_l_cm'),
        harga_blok:     getNum('harga_blok'),
        harga_tulisan:  getNum('harga_tulisan'),
        harga_separasi: getNum('harga_separasi'),
      })
    }
  }, [handleUpdate, selectedMachine])

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat Print Settings..." submessage="Harap tunggu sebentar" icon="mdi:printer-settings" />
  if (error) return <ErrorState message={error} onRetry={fetchMachines} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:printer-settings" className="w-6 h-6 text-blue-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Print Settings</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola konfigurasi mesin cetak dan harga</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">
          Refresh Data
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <StatsCards stats={stats} />

      {/* ===== TABLE CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative">
          {/* Gradient top line */}
          <div className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #10b981)' }}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Daftar Mesin Cetak</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Total {stats.totalMachines} mesin · {stats.configuredCount} terkonfigurasi
              </p>
            </div>
            <Input
              placeholder="Cari mesin atau ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon="mdi:magnify"
            />
          </div>
        </div>

        {machines.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Icon icon="mdi:printer-off" className="w-16 h-16 text-slate-300" />
            <p className="text-slate-500 font-medium text-lg">Belum ada data mesin cetak</p>
          </div>
        ) : (
          <>
            <Table headers={['Mesin', 'Ukuran Material', 'Harga Cetak', 'Aksi']}>
              {filteredMachines.length === 0 ? (
                <TableRow hoverable={false}>
                  <TableCell colSpan={4} className="py-16 text-center whitespace-normal">
                    <div className="flex flex-col items-center gap-3">
                      <Icon icon="mdi:printer-off" className="w-16 h-16 text-slate-300" />
                      <p className="text-slate-500 font-medium text-lg">Tidak ada hasil</p>
                      <p className="text-sm text-slate-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
                      <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                        Hapus Pencarian
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMachines.map((machine) => {
                  const meta = getMachineMeta(machine.name_ma)
                  return (
                    <TableRow key={machine.id_ma} hoverable={false} className="hover:bg-blue-50/40 transition-colors">

                      {/* Mesin */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ background: `${meta.accent}15` }}>
                            <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">{machine.name_ma}</p>
                        </div>
                      </TableCell>

                      {/* Ukuran Material */}
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge color="#3b82f6">Max</Badge>
                            <span className="text-sm text-slate-700">
                              {formatSize(machine.bahan_max_p_cm, machine.bahan_max_l_cm)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge color="#64748b">Min</Badge>
                            <span className="text-sm text-slate-700">
                              {formatSize(machine.bahan_min_p_cm, machine.bahan_min_l_cm)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Harga Cetak */}
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1.5">
                          {PRINT_TYPES.map((type) => (
                            <div key={type.id} className="flex items-center gap-2">
                              <Icon icon={type.icon} className="w-3.5 h-3.5" style={{ color: type.color }} />
                              <span className="text-xs text-slate-400 w-24">{type.label}:</span>
                              <span className="text-xs font-semibold" style={{ color: type.color }}>
                                {formatCurrency(machine[type.field as keyof Machine] as string)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ActionButton
                            onClick={() => handleViewDetails(machine)}
                            icon="mdi:eye-outline"
                            hoverClass="hover:text-blue-600 hover:bg-blue-50"
                            title="Lihat Detail"
                          />
                          <ActionButton
                            onClick={() => handleEdit(machine)}
                            icon="mdi:pencil-outline"
                            hoverClass="hover:text-amber-600 hover:bg-amber-50"
                            title="Edit"
                          />
                        </div>
                      </TableCell>

                    </TableRow>
                  )
                })
              )}
            </Table>

            {filteredMachines.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-400">
                  Menampilkan <span className="font-semibold text-slate-600">{filteredMachines.length}</span> dari{' '}
                  <span className="font-semibold text-slate-600">{machines.length}</span> mesin
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        title="Detail Mesin Cetak"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
            <Button variant="primary" onClick={() => selectedMachine && handleEdit(selectedMachine)} icon="mdi:pencil-outline">
              Edit Mesin
            </Button>
          </>
        }
      >
        {selectedMachine && (() => {
          const meta = getMachineMeta(selectedMachine.name_ma)
          return (
            <div className="space-y-4">

              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: `${meta.accent}08`, borderColor: `${meta.accent}25` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: `${meta.accent}18` }}>
                  <Icon icon={meta.icon} className="w-7 h-7" style={{ color: meta.accent }} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{selectedMachine.name_ma}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedMachine.id_ma}</p>
                </div>
              </div>

              {/* Ukuran Material */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5" />
                  Ukuran Material
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Maksimum</p>
                    <div className="flex items-center gap-1.5">
                      <Badge color="#3b82f6">Max</Badge>
                      <span className="text-sm font-medium text-slate-700">
                        {formatSize(selectedMachine.bahan_max_p_cm, selectedMachine.bahan_max_l_cm)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Minimum</p>
                    <div className="flex items-center gap-1.5">
                      <Badge color="#64748b">Min</Badge>
                      <span className="text-sm font-medium text-slate-700">
                        {formatSize(selectedMachine.bahan_min_p_cm, selectedMachine.bahan_min_l_cm)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Harga Cetak */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                  <Icon icon="mdi:cash-multiple" className="w-3.5 h-3.5" />
                  Harga Cetak
                </p>
                <div className="space-y-2">
                  {PRINT_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Icon icon={type.icon} className="w-4 h-4" style={{ color: type.color }} />
                        <span className="text-sm text-slate-600">{type.label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: type.color }}>
                        {formatCurrency(selectedMachine[type.field as keyof Machine] as string)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title={`Edit Mesin — ${selectedMachine?.name_ma}`}
        size="xl"
        closeOnOverlayClick={!posting}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal} disabled={posting}>Batal</Button>
            <Button variant="primary" onClick={handleSubmitEdit} loading={posting} disabled={posting} icon="mdi:check">
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {selectedMachine && (
          <form name="editForm" className="space-y-5">

            {/* Info box */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Mengedit Konfigurasi Mesin</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  ID Mesin: <span className="font-semibold">{selectedMachine.id_ma}</span>
                </p>
              </div>
            </div>

            {/* Nama Mesin */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:printer" className="w-3.5 h-3.5 text-slate-600" />
                </div>
                Nama Mesin
              </h4>
              <Input label="Nama Mesin" name="name_ma" type="text" defaultValue={selectedMachine.name_ma} disabled={posting} leftIcon="mdi:printer" />
            </div>

            {/* Ukuran Material */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Ukuran Material (cm)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Max Panjang" name="bahan_max_p_cm" type="number" step="0.01" defaultValue={selectedMachine.bahan_max_p_cm} disabled={posting} leftIcon="mdi:arrow-expand-horizontal" />
                <Input label="Max Lebar"   name="bahan_max_l_cm" type="number" step="0.01" defaultValue={selectedMachine.bahan_max_l_cm} disabled={posting} leftIcon="mdi:arrow-expand-vertical" />
                <Input label="Min Panjang" name="bahan_min_p_cm" type="number" step="0.01" defaultValue={selectedMachine.bahan_min_p_cm} disabled={posting} leftIcon="mdi:arrow-collapse-horizontal" />
                <Input label="Min Lebar"   name="bahan_min_l_cm" type="number" step="0.01" defaultValue={selectedMachine.bahan_min_l_cm} disabled={posting} leftIcon="mdi:arrow-collapse-vertical" />
              </div>
            </div>

            {/* Harga Cetak */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:cash" className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Harga Cetak (IDR)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRINT_TYPES.map((type) => (
                  <Input
                    key={type.id}
                    label={type.label}
                    name={type.field}
                    type="number"
                    step="1000"
                    defaultValue={selectedMachine[type.field as keyof Machine] as string}
                    disabled={posting}
                    leftIcon={type.icon}
                  />
                ))}
              </div>
            </div>

          </form>
        )}
      </Modal>
    </div>
  )
}