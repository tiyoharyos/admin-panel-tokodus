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

// ============================================================
// TYPES
// ============================================================
interface PaperbagPrice {
  price_id: string
  id: string
  material_type_id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
  updated_at: string | null
  code: string
  panjang_mm: string
  lebar_mm: string
  keterangan: string
  name: string
  material_type: string
  is_premium: string
}

interface FormState {
  material_type_id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
}

interface ApiResponse<T = unknown> {
  status: number
  message: string
  data?: T
}

// ============================================================
// CONSTANTS
// ============================================================
const EMPTY_FORM: FormState = {
  material_type_id: '',
  gsm: '',
  sheet_size_id: '',
  harga_lembar: '',
}

const MATERIAL_OPTIONS = [
  { id: '1',  name: 'Brown Kraft', type: 'K'  },
  { id: '6',  name: 'Ivory',       type: 'IV' },
  { id: '7',  name: 'Art Paper',   type: 'AP' },
  { id: '20', name: 'Kraft',       type: 'KP' },
  { id: '22', name: 'Duplex',      type: 'D'  },
]

const SHEET_SIZE_OPTIONS = [
  { id: '1', code: '65x100',  panjang_mm: '650',  lebar_mm: '1000', keterangan: '65x100 cm' },
  { id: '2', code: '65x105',  panjang_mm: '650',  lebar_mm: '1050', keterangan: '65x105 cm' },
  { id: '3', code: '79x109',  panjang_mm: '790',  lebar_mm: '1090', keterangan: '79x109 cm' },
  { id: '4', code: '67x140',  panjang_mm: '670',  lebar_mm: '1400', keterangan: '67x140 cm' },
  { id: '5', code: '90x120',  panjang_mm: '900',  lebar_mm: '1200', keterangan: '90x120 cm' },
]

// ============================================================
// ACCENT COLORS
// ============================================================
const ACCENT_MAP: Record<string, { bg: string; text: string }> = {
  AP: { bg: '#3b82f6', text: '#1d4ed8' },
  IV: { bg: '#f59e0b', text: '#92400e' },
  KP: { bg: '#f97316', text: '#9a3412' },
  D:  { bg: '#8b5cf6', text: '#5b21b6' },
  K:  { bg: '#ca8a04', text: '#854d0e' },
  W:  { bg: '#6b7280', text: '#374151' },
}

const getAccent = (type: string) => ACCENT_MAP[type] ?? { bg: '#6b7280', text: '#374151' }

const MATERIAL_LABEL: Record<string, string> = {
  AP: 'Art Paper', IV: 'Ivory', KP: 'Kraft', D: 'Duplex', K: 'Brown Kraft', W: 'White Kraft',
}

// ============================================================
// UTILS
// ============================================================
const fmtCurrency = (val: string | number) => {
  const n = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(n)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

const fmtDate = (d: string | null) => {
  if (!d) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d))
  } catch { return d }
}

const calcArea = (p: string, l: string) => {
  const pv = parseFloat(p), lv = parseFloat(l)
  return isNaN(pv) || isNaN(lv) ? 0 : (pv * lv) / 1_000_000
}

const fmtArea = (p: string, l: string) => {
  const a = calcArea(p, l)
  return a === 0 ? '—' : `${a.toFixed(4)} m²`
}

const getErrMsg = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'response' in err) {
    const e = err as { response?: { data?: { message?: string } } }
    return e.response?.data?.message || fallback
  }
  return fallback
}

const validateForm = (f: FormState): string | null => {
  if (!f.material_type_id) return 'Pilih material terlebih dahulu.'
  if (!f.sheet_size_id)    return 'Pilih ukuran sheet terlebih dahulu.'
  if (!f.gsm || isNaN(Number(f.gsm)) || Number(f.gsm) <= 0) return 'GSM tidak valid.'
  if (!f.harga_lembar || isNaN(Number(f.harga_lembar)) || Number(f.harga_lembar) <= 0)
    return 'Harga lembar tidak valid.'
  return null
}

const rowKey = (item: PaperbagPrice) =>
  `${item.material_type_id}-${item.sheet_size_id}-${item.gsm}`

// ============================================================
// BADGE
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

const TABLE_HEADERS = ['GSM', 'Harga / Lembar', 'Harga / m²', 'Ukuran Sheet', 'Aksi']

function TableHead() {
  return (
    <thead className="bg-gray-50">
      <tr>
        {TABLE_HEADERS.map(h => (
          <th
            key={h}
            className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )
}

interface TableRowsProps {
  items: PaperbagPrice[]
  onDetail: (item: PaperbagPrice) => void
  onEdit: (item: PaperbagPrice) => void
  onDelete: (item: PaperbagPrice) => void
}

function TableRows({ items, onDetail, onEdit, onDelete }: TableRowsProps) {
  return (
    <>
      {items.map(item => {
        const accent = getAccent(item.material_type)
        const area   = calcArea(item.panjang_mm, item.lebar_mm)
        const perM2  = area > 0 ? parseFloat(item.harga_lembar) / area : 0

        return (
          <tr key={rowKey(item)} className="hover:bg-slate-50/80 transition-colors">
            <td className="px-5 py-3.5 whitespace-nowrap">
              <Badge color="#6b7280">{item.gsm} gsm</Badge>
            </td>
            <td className="px-5 py-3.5 whitespace-nowrap">
              <span className="text-sm font-bold text-slate-800">
                {fmtCurrency(item.harga_lembar)}
              </span>
            </td>
            <td className="px-5 py-3.5 whitespace-nowrap">
              <span className="text-sm font-medium" style={{ color: accent.text }}>
                {fmtCurrency(perM2.toFixed(0))}
              </span>
            </td>
            <td className="px-5 py-3.5 whitespace-nowrap">
              <span className="text-xs text-gray-500">
                {item.code} • {item.keterangan}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDetail(item)}
                  title="Detail"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Icon icon="mdi:eye-outline" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  title="Edit"
                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  title="Hapus"
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Icon icon="mdi:delete-outline" className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function PaperbagSheetPricesPage() {
  const [priceList, setPriceList] = useState<PaperbagPrice[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  const [filterMat, setFilterMat] = useState('all')

  // FIX 1: Ganti nama state menjadi konsisten — sebelumnya
  // dideklarasikan sebagai [searchGsm, setSearchGsm] tapi
  // di JSX dipakai sebagai {search} dan {setSearch} yang
  // tidak pernah dideklarasikan → crash runtime.
  const [search, setSearch] = useState('')

  const [showAddModal,    setShowAddModal]    = useState(false)
  const [showEditModal,   setShowEditModal]   = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [detailItem,  setDetailItem]  = useState<PaperbagPrice | null>(null)
  const [editingItem, setEditingItem] = useState<PaperbagPrice | null>(null)

  const [addForm,  setAddForm]  = useState<FormState>(EMPTY_FORM)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const { data } = await axios.get<ApiResponse<PaperbagPrice[]>>(
        '/Admin/Paperbag/PaperbagSheetPrices'
      )
      if (data?.status === 200 && Array.isArray(data.data)) {
        setPriceList(data.data)
      } else {
        setPriceList([]); setError('Format response tidak sesuai.')
      }
    } catch (err) {
      setError(getErrMsg(err, 'Tidak bisa connect ke server.'))
      setPriceList([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived ────────────────────────────────────────────────
  const materialGroups = useMemo(() => {
    const groups: Record<string, PaperbagPrice[]> = {}
    priceList.forEach(item => {
      if (!groups[item.material_type]) groups[item.material_type] = []
      groups[item.material_type].push(item)
    })
    return Object.entries(groups)
      .map(([type, items]) => ({ type, items }))
      .sort((a, b) => a.type.localeCompare(b.type))
  }, [priceList])

  const filteredList = useMemo(() => {
    return priceList.filter(p => {
      const matchMat = filterMat === 'all' || p.material_type === filterMat
      // FIX 1 lanjutan: filter sekarang pakai `search` yang konsisten dengan input
      const matchSearch = !search || p.gsm.includes(search) || p.keterangan.toLowerCase().includes(search.toLowerCase())
      return matchMat && matchSearch
    })
  }, [priceList, filterMat, search])

  const filteredGroups = useMemo(() => {
    const groups: Record<string, PaperbagPrice[]> = {}
    filteredList.forEach(item => {
      if (!groups[item.material_type]) groups[item.material_type] = []
      groups[item.material_type].push(item)
    })
    return Object.entries(groups)
      .map(([type, items]) => ({ type, items }))
      .sort((a, b) => a.type.localeCompare(b.type))
  }, [filteredList])

  const stats = useMemo(() => {
    if (!priceList.length) return { total: 0, minPrice: 0, maxPrice: 0, avgPrice: 0, mats: 0, sizes: 0 }
    const prices = priceList.map(p => parseFloat(p.harga_lembar)).filter(n => !isNaN(n))
    return {
      total:    priceList.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      mats:     new Set(priceList.map(p => p.material_type)).size,
      sizes:    new Set(priceList.map(p => p.sheet_size_id)).size,
    }
  }, [priceList])

  // ── Handlers ───────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    const r = await Swal.fire({
      icon: 'question', title: 'Refresh Data?',
      text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6', cancelButtonColor: '#6B7280',
    })
    if (r.isConfirmed) {
      await fetchData()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil di-refresh!', timer: 1500, showConfirmButton: false })
    }
  }, [fetchData])

  const handleAdd = async () => {
    const err = validateForm(addForm)
    if (err) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' })
      return
    }
    try {
      setIsPosting(true)
      const fd = new URLSearchParams()
      fd.append('material_type_id', addForm.material_type_id)
      fd.append('panjang_mm', addForm.gsm)
      fd.append('sheet_size_id', addForm.sheet_size_id)
      fd.append('harga_lembar', addForm.harga_lembar)

      const { data } = await axios.post<ApiResponse>(
        '/Admin/Paperbag/PaperbagSheetPricesAdd',
        fd.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Harga sheet baru berhasil ditambahkan!', timer: 1500, showConfirmButton: false })
        setShowAddModal(false)
        setAddForm(EMPTY_FORM)
        await fetchData()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: data?.message || 'Gagal menambahkan data.' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal menambahkan data.') })
    } finally { setIsPosting(false) }
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    const err = validateForm(editForm)
    if (err) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' })
      return
    }
    try {
      setIsPosting(true)
      const fd = new URLSearchParams()
      fd.append('material_type_id', editForm.material_type_id)
      fd.append('panjang_mm', editForm.gsm)
      fd.append('sheet_size_id', editForm.sheet_size_id)
      fd.append('harga_lembar', editForm.harga_lembar)

      const { data } = await axios.put<ApiResponse>(
        `/Admin/Paperbag/PaperbagSheetPricesEdit/${editingItem.price_id}`,
        fd.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      if (data?.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data harga sheet berhasil diperbarui!', timer: 1500, showConfirmButton: false })
        setShowEditModal(false)
        setEditingItem(null)
        await fetchData()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: data?.message || 'Gagal memperbarui data.' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err, 'Gagal memperbarui data.') })
    } finally { setIsPosting(false) }
  }

  const handleDelete = async (item: PaperbagPrice) => {
    const r = await Swal.fire({
      icon: 'warning',
      title: 'Konfirmasi Hapus',
      html: `Hapus <strong>${item.name} (${item.material_type}) — ${item.gsm} gsm — ${item.keterangan}</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6B7280',
    })
    if (!r.isConfirmed) return

    try {
      const fd = new URLSearchParams()
      fd.append('id_paperbag', item.price_id)

      const { data } = await axios.delete<ApiResponse>(
        `/Admin/Paperbag/PaperbagSheetPricesDelete/${item.price_id}`,
        { data: fd.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      if (data?.status === 200) {
        Swal.fire({ icon: 'success', title: 'Berhasil Dihapus!', timer: 1500, showConfirmButton: false })
        await fetchData()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal Menghapus', text: data?.message || 'Gagal menghapus data.', confirmButtonColor: '#ef4444' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: getErrMsg(err, 'Gagal menghapus data.') })
    }
  }

  const openEdit = (item: PaperbagPrice) => {
    setEditingItem(item)
    setEditForm({
      material_type_id: item.material_type_id,
      gsm:              item.gsm,
      sheet_size_id:    item.sheet_size_id,
      harga_lembar:     item.harga_lembar,
    })
    setShowEditModal(true)
  }

  const openDetail = (item: PaperbagPrice) => {
    setDetailItem(item)
    setShowDetailModal(true)
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) return <LoadingState message="Memuat Data Harga Sheet Paperbag..." icon="mdi:tag-multiple-outline" />
  if (error)   return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:tag-multiple-outline" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Harga Sheet Paperbag</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola harga berdasarkan material, ukuran, dan GSM</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="md" icon="mdi:refresh">
            Refresh
          </Button>
          <Button
            onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true) }}
            variant="primary" size="md" icon="mdi:plus"
          >
            Tambah Data Baru
          </Button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'mdi:format-list-bulleted', label: 'Total Variasi',   value: String(stats.total),        sub: `${stats.mats} material · ${stats.sizes} ukuran` },
          { icon: 'mdi:currency-idr',          label: 'Harga Terendah',  value: fmtCurrency(stats.minPrice), sub: 'per lembar' },
          { icon: 'mdi:currency-idr',          label: 'Harga Tertinggi', value: fmtCurrency(stats.maxPrice), sub: 'per lembar' },
          { icon: 'mdi:chart-line',            label: 'Rata-rata Harga', value: fmtCurrency(stats.avgPrice), sub: 'per lembar' },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon icon={s.icon} className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-800 leading-tight">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── FILTER & SEARCH ── */}
      <Card shadow="sm" padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Icon icon="mdi:filter-outline" className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <button
              onClick={() => setFilterMat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMat === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({priceList.length})
            </button>
            {materialGroups.map(({ type, items }) => {
              const accent   = getAccent(type)
              const isActive = filterMat === type
              return (
                <button
                  key={type}
                  onClick={() => setFilterMat(isActive ? 'all' : type)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={
                    isActive
                      ? { background: accent.bg, color: '#fff' }
                      : { background: `${accent.bg}15`, color: accent.text }
                  }
                >
                  {MATERIAL_LABEL[type] || type} ({items.length})
                </button>
              )
            })}
          </div>
          <div className="relative flex-shrink-0">
            <Input
              placeholder="Cari GSM atau keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon="mdi:magnify"
            />
          </div>
        </div>
      </Card>

      {/* ── TABLE ── */}
      {filteredList.length === 0 ? (
        <Card shadow="md" padding="none">
          <div className="flex flex-col items-center gap-3 py-16">
            <Icon icon="mdi:database-off" className="w-16 h-16 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg">Tidak ada data ditemukan</p>
            <Button
              variant="primary" size="sm"
              onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true) }}
              icon="mdi:plus"
            >
              Tambah Data Baru
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(({ type, items }) => {
            const accent = getAccent(type)
            return (
              <Card key={type} shadow="md" padding="none">
                <div
                  className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
                  style={{ background: `${accent.bg}08` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accent.bg}18` }}
                    >
                      <Icon icon="mdi:file-document-outline" className="w-5 h-5" style={{ color: accent.bg }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {MATERIAL_LABEL[type] || type}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: accent.text }}>
                        {type} · {items.length} variasi harga
                      </p>
                    </div>
                  </div>
                  <Badge color={accent.bg}>{items.length} item</Badge>
                </div>
                {/* FIX 2 & 3: Pakai TableHead dan TableRows sebagai komponen terpisah */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <TableHead />
                    <tbody className="bg-white divide-y divide-gray-100">
                      <TableRows
                        items={items}
                        onDetail={openDetail}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {/* FIX 4: Tambah closeOnOverlayClick agar konsisten dengan Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { if (!isPosting) { setShowAddModal(false); setAddForm(EMPTY_FORM) } }}
        title="Tambah Harga Sheet Baru"
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => { if (!isPosting) { setShowAddModal(false); setAddForm(EMPTY_FORM) } }}
              disabled={isPosting}
            >
              Batal
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </>
        }
      >
        <PriceForm form={addForm} onFormChange={setAddForm} disabled={isPosting} mode="add" />
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { if (!isPosting) { setShowEditModal(false); setEditingItem(null) } }}
        title={editingItem ? `Edit — ${editingItem.name} ${editingItem.gsm} gsm` : 'Edit'}
        size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => { if (!isPosting) { setShowEditModal(false); setEditingItem(null) } }}
              disabled={isPosting}
            >
              Batal
            </Button>
            <Button variant="primary" onClick={handleUpdate} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {editingItem && (
          <PriceForm form={editForm} onFormChange={setEditForm} disabled={isPosting} mode="edit" />
        )}
      </Modal>

      {/* ── DETAIL MODAL ── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailItem(null) }}
        title="Detail Harga Sheet"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowDetailModal(false); setDetailItem(null) }}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon="mdi:pencil-outline"
              onClick={() => {
                if (detailItem) { setShowDetailModal(false); setDetailItem(null); openEdit(detailItem) }
              }}
            >
              Edit Data
            </Button>
          </>
        }
      >
        {detailItem && <DetailView item={detailItem} />}
      </Modal>
    </div>
  )
}

// ============================================================
// PRICE FORM
// ============================================================
interface PriceFormProps {
  form: FormState
  onFormChange: (f: FormState) => void
  disabled: boolean
  mode: 'add' | 'edit'
}

function PriceForm({ form, onFormChange, disabled, mode }: PriceFormProps) {
  const selectedMat  = MATERIAL_OPTIONS.find(m => m.id === form.material_type_id)
  const selectedSize = SHEET_SIZE_OPTIONS.find(s => s.id === form.sheet_size_id)
  const accent       = selectedMat ? getAccent(selectedMat.type) : { bg: '#3b82f6', text: '#1d4ed8' }

  const previewPricePerM2 = useMemo(() => {
    if (!selectedSize || !form.harga_lembar) return null
    const area = calcArea(selectedSize.panjang_mm, selectedSize.lebar_mm)
    return area > 0 ? parseFloat(form.harga_lembar) / area : null
  }, [selectedSize, form.harga_lembar])

  const isPreviewReady = form.material_type_id && form.sheet_size_id && form.gsm && form.harga_lembar

  return (
    <div className="space-y-5">
      <div
        className="flex items-center gap-3 p-4 rounded-lg border"
        style={{ background: `${accent.bg}08`, borderColor: `${accent.bg}30` }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent.bg}18` }}
        >
          <Icon
            icon={mode === 'add' ? 'mdi:plus-circle-outline' : 'mdi:pencil-outline'}
            className="w-5 h-5"
            style={{ color: accent.bg }}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {mode === 'add' ? 'Tambah Data Harga Baru' : 'Mode Edit Data'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === 'add'
              ? 'Pilih material & ukuran, lalu isi GSM dan harga'
              : 'Perbarui data harga sesuai kebutuhan'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Icon icon="mdi:material-ui" className="w-4 h-4 text-gray-400" />
            Material <span className="text-red-500">*</span>
          </label>
          <select
            value={form.material_type_id}
            onChange={e => onFormChange({ ...form, material_type_id: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">— Pilih Material —</option>
            {MATERIAL_OPTIONS.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Icon icon="mdi:ruler" className="w-4 h-4 text-gray-400" />
            Ukuran Sheet <span className="text-red-500">*</span>
          </label>
          <select
            value={form.sheet_size_id}
            onChange={e => onFormChange({ ...form, sheet_size_id: e.target.value })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">— Pilih Ukuran —</option>
            {SHEET_SIZE_OPTIONS.map(s => (
              <option key={s.id} value={s.id}>
                {s.keterangan} ({s.code}) — {fmtArea(s.panjang_mm, s.lebar_mm)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon icon="mdi:tag" className="w-3.5 h-3.5 text-blue-600" />
          </div>
          Spesifikasi &amp; Harga
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="GSM *"
            type="number"
            min={1}
            step={1}
            placeholder="Contoh: 250"
            value={form.gsm}
            onChange={e => onFormChange({ ...form, gsm: e.target.value })}
            disabled={disabled}
            leftIcon="mdi:weight"
          />
          <Input
            label="Harga / Lembar (Rp) *"
            type="number"
            min={1}
            step={100}
            placeholder="Contoh: 2500"
            value={form.harga_lembar}
            onChange={e => onFormChange({ ...form, harga_lembar: e.target.value })}
            disabled={disabled}
            leftIcon="mdi:currency-idr"
          />
        </div>
      </div>

      {isPreviewReady && (
        <div
          className="rounded-xl px-4 py-3.5 border"
          style={{ background: `${accent.bg}08`, borderColor: `${accent.bg}30` }}
        >
          <p
            className="text-xs font-semibold flex items-center gap-1.5 mb-3"
            style={{ color: accent.text }}
          >
            <Icon icon="mdi:eye-check-outline" className="w-4 h-4" />
            Preview Data
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              { label: 'Material',     value: selectedMat  ? `${selectedMat.name} (${selectedMat.type})` : '—' },
              { label: 'Ukuran',       value: selectedSize ? selectedSize.keterangan : '—' },
              { label: 'GSM',          value: `${form.gsm} gsm` },
              { label: 'Harga Lembar', value: fmtCurrency(form.harga_lembar) },
              ...(previewPricePerM2 !== null
                ? [{ label: 'Harga / m²', value: fmtCurrency(previewPricePerM2.toFixed(0)) }]
                : []),
              ...(selectedSize
                ? [{ label: 'Luas Sheet', value: fmtArea(selectedSize.panjang_mm, selectedSize.lebar_mm) }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-gray-500">{label}:</span>
                <span className="font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// DETAIL VIEW
// ============================================================
function DetailView({ item }: { item: PaperbagPrice }) {
  const accent = getAccent(item.material_type)
  const area   = calcArea(item.panjang_mm, item.lebar_mm)
  const perM2  = area > 0 ? parseFloat(item.harga_lembar) / area : 0

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{ background: `${accent.bg}0d` }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent.bg}20` }}
        >
          <Icon icon="mdi:file-document-outline" className="w-7 h-7" style={{ color: accent.bg }} />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-800">{item.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={accent.bg}>{item.material_type}</Badge>
            <span className="text-xs text-gray-500">{item.gsm} gsm</span>
            {item.is_premium === '1' && <Badge color="#f59e0b">Premium</Badge>}
          </div>
        </div>
      </div>

      <Card shadow="none" padding="sm" bordered>
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
          <Icon icon="mdi:cash-multiple" className="w-3.5 h-3.5" /> Informasi Harga
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Harga / Lembar</p>
            <p className="font-bold text-slate-700 text-sm">{fmtCurrency(item.harga_lembar)}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: `${accent.bg}10` }}>
            <p className="text-xs mb-1" style={{ color: accent.text }}>Harga / m²</p>
            <p className="font-bold text-lg" style={{ color: accent.bg }}>
              {fmtCurrency(perM2.toFixed(0))}
            </p>
          </div>
        </div>
      </Card>

      <Card shadow="none" padding="sm" bordered>
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
          <Icon icon="mdi:ruler-square" className="w-3.5 h-3.5" /> Informasi Ukuran
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 p-2 rounded-lg">
            <p className="text-xs text-blue-600">Kode</p>
            <p className="font-semibold text-blue-800 text-sm">{item.code}</p>
          </div>
          <div className="bg-green-50 p-2 rounded-lg">
            <p className="text-xs text-green-600">Ukuran</p>
            <p className="font-semibold text-green-800 text-sm">{item.keterangan}</p>
          </div>
          <div className="bg-purple-50 p-2 rounded-lg">
            <p className="text-xs text-purple-600">Luas</p>
            <p className="font-semibold text-purple-800 text-sm">
              {fmtArea(item.panjang_mm, item.lebar_mm)}
            </p>
          </div>
        </div>
      </Card>

      <Card shadow="none" padding="sm" bordered>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Keterangan',      value: item.keterangan },
            { label: 'ID Record',       value: <span className="font-mono text-xs">{item.id}</span> },
            { label: 'Terakhir Update', value: fmtDate(item.updated_at) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-gray-400">{label}</span>
              <span className="text-slate-700 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}