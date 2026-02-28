'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import ErrorState from '@/components/UI/ErrorState'
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

// ============ BADGE (same as print-settings) ============
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

// ============ CONSTANTS ============
const CONFIG_META: Record<string, { label: string; icon: string; accent: string; desc: string }> = {
  min_cetak:         { label: 'Min. Cetak',         icon: 'mdi:printer',         accent: '#3b82f6', desc: 'Minimal qty untuk cetakan (blok/tulisan/separasi)' },
  min_laminasi:      { label: 'Min. Laminasi',       icon: 'mdi:layers-triple',   accent: '#8b5cf6', desc: 'Minimal qty untuk menggunakan laminasi' },
  min_premium_white: { label: 'Min. Premium White',  icon: 'mdi:square-outline',  accent: '#64748b', desc: 'Minimal qty untuk material Premium White' },
  min_non_kraft:     { label: 'Min. Non Kraft',      icon: 'mdi:package-variant', accent: '#f59e0b', desc: 'Minimal qty untuk material selain BrownKraft' },
  min_paperbag:      { label: 'Min. Paperbag',       icon: 'mdi:shopping',        accent: '#10b981', desc: 'Minimal qty untuk pesanan paperbag/shopping bag' },
}

const DEFAULT_META = { label: 'Konfigurasi', icon: 'mdi:cog', accent: '#64748b', desc: '-' }

const getMeta = (key: string) => CONFIG_META[key] || DEFAULT_META

// ============ HELPERS ============
const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err)
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  return fallback
}

// ============ MAIN COMPONENT ============
export default function OtherMinOrderPage() {
  const [configs, setConfigs] = useState<MinOrderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MinOrderConfig | null>(null)
  const [editQty, setEditQty] = useState('')

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
  const handleEditClick = (item: MinOrderConfig) => {
    setEditingItem(item)
    setEditQty(item.min_qty)
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    if (!editQty || isNaN(Number(editQty)) || Number(editQty) < 0) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Masukkan nilai qty yang valid.', confirmButtonColor: '#3B82F6' })
      return
    }
    try {
      setIsPosting(true)
      await axios.put(`/Admin/Other/MinOrderConfig/${editingItem.id}`, { min_qty: editQty })
      setConfigs(prev => prev.map(c => c.id === editingItem.id ? { ...c, min_qty: editQty } : c))
      await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Konfigurasi berhasil diperbarui!', timer: 1500, showConfirmButton: false })
      setShowEditModal(false)
      setEditingItem(null)
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:cog-outline" className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Minimum Order Config</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola konfigurasi minimum qty pemesanan</p>
          </div>
        </div>
        <Button variant="outline" size="md" onClick={fetchData} icon="mdi:refresh">
          Refresh Data
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'mdi:tune-variant',     label: 'Total Konfigurasi',   value: String(stats.total),                          sub: `${stats.total} aktif terkonfigurasi`,    accent: '#6366f1' },
          { icon: 'mdi:arrow-down-circle',label: 'Min. Qty Terendah',   value: stats.minQty.toLocaleString('id-ID') + ' pcs', sub: 'Nilai qty terkecil',                     accent: '#10b981' },
          { icon: 'mdi:arrow-up-circle',  label: 'Min. Qty Tertinggi',  value: stats.maxQty.toLocaleString('id-ID') + ' pcs', sub: 'Nilai qty terbesar',                     accent: '#f59e0b' },
          { icon: 'mdi:chart-bell-curve', label: 'Rata-rata Qty',       value: stats.avgQty.toLocaleString('id-ID') + ' pcs', sub: 'Rata-rata semua konfigurasi',            accent: '#8b5cf6' },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}15` }}>
                <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 truncate">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Konfigurasi</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.total} konfigurasi minimum order
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {configs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:cog-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada konfigurasi</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Konfigurasi', 'Config Key', 'Min. Qty', 'Keterangan', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {configs.map((config) => {
                  const meta = getMeta(config.config_key)
                  return (
                    <tr key={config.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Konfigurasi */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${meta.accent}15` }}>
                            <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                          </div>
                          <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                        </div>
                      </td>

                      {/* Config Key */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={meta.accent}>{config.config_key}</Badge>
                      </td>

                      {/* Min Qty */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Icon icon="mdi:package-variant-closed" className="w-4 h-4" style={{ color: meta.accent }} />
                          <span className="text-sm font-bold" style={{ color: meta.accent }}>
                            {Number(config.min_qty).toLocaleString('id-ID')} pcs
                          </span>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs line-clamp-2">{config.keterangan}</p>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEditClick(config)}
                          title="Edit"
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {configs.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{configs.length}</span> konfigurasi
            </p>
          </div>
        )}
      </Card>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`Edit Config — ${editingItem ? getMeta(editingItem.config_key).label : ''}`}
        size="md"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" onClick={() => !isPosting && setShowEditModal(false)} disabled={isPosting}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleUpdate} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {editingItem && (() => {
          const meta = getMeta(editingItem.config_key)
          return (
            <div className="space-y-5">
              {/* Info box */}
              <div className="flex items-center gap-3 p-4 rounded-lg border"
                style={{ background: `${meta.accent}08`, borderColor: `${meta.accent}30` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${meta.accent}18` }}>
                  <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: meta.accent }}>{editingItem.config_key}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{editingItem.keterangan}</p>
                </div>
              </div>

              {/* Form */}
              <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 space-y-3">
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
                <p className="text-xs text-gray-400">
                  Nilai saat ini:{' '}
                  <span className="font-semibold" style={{ color: meta.accent }}>
                    {Number(editingItem.min_qty).toLocaleString('id-ID')} pcs
                  </span>
                </p>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}