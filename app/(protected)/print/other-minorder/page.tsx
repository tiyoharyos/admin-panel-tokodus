'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
import { Table, TableRow, TableCell } from '@/components/UI/Table'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ============ TYPES ============
interface MinOrderConfig {
  id: string
  config_key: string
  min_qty: string
  keterangan: string
  updated_at: string | null
}

interface ApiResponse {
  status: number
  message: string
  data: MinOrderConfig[]
}

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

// ============ CONSTANTS ============
const CONFIG_META: Record<string, { label: string; icon: string; accent: string; desc: string }> = {
  min_cetak:         { label: 'Min. Cetak',        icon: 'mdi:printer',         accent: '#3b82f6', desc: 'Minimal qty untuk cetakan (blok/tulisan/separasi)' },
  min_laminasi:      { label: 'Min. Laminasi',      icon: 'mdi:layers-triple',   accent: '#8b5cf6', desc: 'Minimal qty untuk menggunakan laminasi' },
  min_premium_white: { label: 'Min. Premium White', icon: 'mdi:square-outline',  accent: '#64748b', desc: 'Minimal qty untuk material Premium White' },
  min_non_kraft:     { label: 'Min. Non Kraft',     icon: 'mdi:package-variant', accent: '#f59e0b', desc: 'Minimal qty untuk material selain BrownKraft' },
  min_paperbag:      { label: 'Min. Paperbag',      icon: 'mdi:shopping',        accent: '#10b981', desc: 'Minimal qty untuk pesanan paperbag/shopping bag' },
}

const DEFAULT_META = { label: 'Konfigurasi', icon: 'mdi:cog', accent: '#64748b', desc: '-' }
const getMeta = (key: string) => CONFIG_META[key] || DEFAULT_META

// ============ HELPERS ============
const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err)
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  return fallback
}

// ============ STATS CARDS ============
function StatsCards({ stats }: { stats: { total: number; minQty: number; maxQty: number; avgQty: number } }) {
  const items = [
    { icon: 'mdi:tune-variant',      label: 'Total Konfigurasi',  value: String(stats.total),                           sub: `${stats.total} aktif terkonfigurasi`, accent: '#6366f1' },
    { icon: 'mdi:arrow-down-circle', label: 'Min. Qty Terendah',  value: stats.minQty.toLocaleString('id-ID') + ' pcs', sub: 'Nilai qty terkecil',                  accent: '#10b981' },
    { icon: 'mdi:arrow-up-circle',   label: 'Min. Qty Tertinggi', value: stats.maxQty.toLocaleString('id-ID') + ' pcs', sub: 'Nilai qty terbesar',                  accent: '#f59e0b' },
    { icon: 'mdi:chart-bell-curve',  label: 'Rata-rata Qty',      value: stats.avgQty.toLocaleString('id-ID') + ' pcs', sub: 'Rata-rata semua konfigurasi',         accent: '#8b5cf6' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
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

// ============ MAIN COMPONENT ============
export default function OtherMinOrderPage() {
  const [configs, setConfigs] = useState<MinOrderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MinOrderConfig | null>(null)
  const [selectedItem, setSelectedItem] = useState<MinOrderConfig | null>(null)

  const [editQty, setEditQty] = useState('')
  const [editKeterangan, setEditKeterangan] = useState('')

  // ===== STATS =====
  const stats = useMemo(() => {
    const total = configs.length
    const qtys = configs.map(c => parseInt(c.min_qty) || 0)
    const minQty = qtys.length ? Math.min(...qtys) : 0
    const maxQty = qtys.length ? Math.max(...qtys) : 0
    const avgQty = qtys.length ? Math.round(qtys.reduce((a, b) => a + b, 0) / qtys.length) : 0
    return { total, minQty, maxQty, avgQty }
  }, [configs])

  // ===== API =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<ApiResponse>('/Admin/Other/MinOrderConfig')
      if (data?.status === 200 && Array.isArray(data.data)) {
        setConfigs(data.data)
      } else {
        setConfigs([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ===== HANDLERS =====
  const handleViewClick = (item: MinOrderConfig) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = (item: MinOrderConfig) => {
    setEditingItem(item)
    setEditQty(item.min_qty)
    setEditKeterangan(item.keterangan)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    if (!isPosting) {
      setShowEditModal(false)
      setEditingItem(null)
      setEditQty('')
      setEditKeterangan('')
    }
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedItem(null)
  }

  const handleUpdate = async () => {
    if (!editingItem) return

    if (!editQty || isNaN(Number(editQty)) || Number(editQty) < 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Masukkan nilai qty yang valid.', confirmButtonColor: '#3B82F6' })
      return
    }
    if (!editKeterangan.trim()) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Keterangan tidak boleh kosong.', confirmButtonColor: '#3B82F6' })
      return
    }

    try {
      setIsPosting(true)
      await axios.put(`/Admin/Other/MinOrderConfigEdit/${editingItem.id}`, {
        config_key: editingItem.config_key,
        min_qty:    editQty,
        keterangan: editKeterangan.trim(),
      })

      setConfigs(prev => prev.map(c =>
        c.id === editingItem.id
          ? { ...c, min_qty: editQty, keterangan: editKeterangan.trim(), updated_at: new Date().toISOString() }
          : c
      ))

      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Konfigurasi berhasil diperbarui!', timer: 1500, showConfirmButton: false })
      handleCloseEditModal()
    } catch (err: unknown) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menyimpan konfigurasi'), confirmButtonColor: '#3B82F6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== RENDER =====
  if (loading) return <LoadingState icon="mdi:cog-outline" message="Memuat Minimum Order Config..." />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
              <Icon icon="mdi:cog-outline" className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-400 rounded-full border-2 border-slate-50 shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Minimum Order Config</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Kelola konfigurasi minimum qty pemesanan</p>
          </div>
        </div>
        <Button variant="outline" size="md" onClick={fetchData} icon="mdi:refresh">
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
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Daftar Konfigurasi</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Total {stats.total} konfigurasi minimum order
              </p>
            </div>
          </div>
        </div>

        {configs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Icon icon="mdi:cog-off" className="w-16 h-16 text-slate-300" />
            <p className="text-slate-500 font-medium text-lg">Belum ada konfigurasi</p>
          </div>
        ) : (
          <>
            <Table headers={['Konfigurasi', 'Config Key', 'Min. Qty', 'Keterangan', 'Aksi']}>
              {configs.map((config) => {
                const meta = getMeta(config.config_key)
                return (
                  <TableRow key={config.id} hoverable={false} className="hover:bg-blue-50/40 transition-colors">

                    {/* Konfigurasi */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ background: `${meta.accent}15` }}>
                          <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{meta.label}</p>
                      </div>
                    </TableCell>

                    {/* Config Key */}
                    <TableCell>
                      <Badge color={meta.accent}>{config.config_key}</Badge>
                    </TableCell>

                    {/* Min Qty */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Icon icon="mdi:package-variant-closed" className="w-4 h-4" style={{ color: meta.accent }} />
                        <span className="text-sm font-bold" style={{ color: meta.accent }}>
                          {Number(config.min_qty).toLocaleString('id-ID')} pcs
                        </span>
                      </div>
                    </TableCell>

                    {/* Keterangan */}
                    <TableCell className="whitespace-normal">
                      <p className="text-sm text-slate-600 max-w-xs line-clamp-2">{config.keterangan}</p>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ActionButton
                          onClick={() => handleViewClick(config)}
                          icon="mdi:eye-outline"
                          hoverClass="hover:text-blue-600 hover:bg-blue-50"
                          title="Lihat Detail"
                        />
                        <ActionButton
                          onClick={() => handleEditClick(config)}
                          icon="mdi:pencil-outline"
                          hoverClass="hover:text-amber-600 hover:bg-amber-50"
                          title="Edit"
                        />
                      </div>
                    </TableCell>

                  </TableRow>
                )
              })}
            </Table>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-sm text-slate-400">
                Menampilkan <span className="font-semibold text-slate-600">{configs.length}</span> konfigurasi
              </p>
            </div>
          </>
        )}
      </div>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        title="Detail Minimum Order Config"
        size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={handleCloseViewModal}>Tutup</Button>
            <Button
              variant="primary" size="md" icon="mdi:pencil-outline"
              onClick={() => { setShowViewModal(false); if (selectedItem) handleEditClick(selectedItem) }}
            >
              Edit
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const meta = getMeta(selectedItem.config_key)
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
                  <p className="text-base font-semibold text-slate-800">{meta.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={meta.accent}>{selectedItem.config_key}</Badge>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 mb-1.5">Deskripsi</p>
                <p className="text-sm text-slate-700">{meta.desc}</p>
              </div>

              {/* Minimum Quantity */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Minimum Quantity</p>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${meta.accent}15` }}>
                    <Icon icon="mdi:package-variant-closed" className="w-5 h-5" style={{ color: meta.accent }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: meta.accent }}>
                      {Number(selectedItem.min_qty).toLocaleString('id-ID')}{' '}
                      <span className="text-sm font-normal text-slate-400">pcs</span>
                    </p>
                    <p className="text-xs text-slate-400">Minimum order quantity</p>
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 mb-1.5">Keterangan</p>
                <p className="text-sm text-slate-700">{selectedItem.keterangan}</p>
              </div>

            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={`Edit Config — ${editingItem ? getMeta(editingItem.config_key).label : ''}`}
        size="md"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleUpdate} loading={isPosting} disabled={isPosting} icon="mdi:check">
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {editingItem && (() => {
          const meta = getMeta(editingItem.config_key)
          return (
            <div className="space-y-5">

              {/* Info box */}
              <div className="flex items-center gap-3 p-4 rounded-xl border"
                style={{ background: `${meta.accent}08`, borderColor: `${meta.accent}30` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${meta.accent}18` }}>
                  <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: meta.accent }}>{editingItem.config_key}</p>
                </div>
              </div>

              {/* Min Qty */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:package-variant-closed" className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  Minimum Quantity
                </h4>
                <Input
                  label="Min. Qty (pcs)"
                  type="number"
                  min={0}
                  step={100}
                  value={editQty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditQty(e.target.value)}
                  disabled={isPosting}
                  leftIcon="mdi:package-variant-closed"
                />
                <p className="text-xs text-slate-400">
                  Nilai saat ini:{' '}
                  <span className="font-semibold" style={{ color: meta.accent }}>
                    {Number(editingItem.min_qty).toLocaleString('id-ID')} pcs
                  </span>
                </p>
              </div>

              {/* Keterangan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:text-box-outline" className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  Keterangan
                </h4>
                <Input
                  label="Keterangan"
                  type="text"
                  value={editKeterangan}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditKeterangan(e.target.value)}
                  disabled={isPosting}
                  leftIcon="mdi:text-box-outline"
                  placeholder="Deskripsi konfigurasi ini"
                />
              </div>

            </div>
          )
        })()}
      </Modal>
    </div>
  )
}