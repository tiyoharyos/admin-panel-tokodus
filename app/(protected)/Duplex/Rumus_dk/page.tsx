'use client'
// app/(protected)/Duplex/Rumus_dk/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'

// ===== TYPE DEFINITIONS =====
interface DuplexDataDK {
  id: number
  gsm: number
  sheet_size_id: string
  panjang: number
  lebar: number
  harga_per_lembar: number  // ← rename dari harga_lembar
  type: 'DK'
}

interface GramasiItem {
  id: string
  material_type_id: string
  gsm: string
  name: string
  material_type: string
  is_premium: string
}

interface SheetSizeItem {
  id_sh: string
  panjang_sh: string
  lebar_sh: string
}

interface FormData {
  sheet_size_id: string
  gsm: string
  harga_per_lembar: string  // ← rename dari harga_lembar
}

interface Stats {
  totalRecords: number
  averagePrice: number
  totalCombinations: number
  uniqueGsm: number
  uniqueSizes: number
}

// ===== API TYPES =====
interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

interface DuplexApiItem {
  id: string
  gsm: string
  sheet_size_id: string
  harga_lembar: string
  updated_at: string | null
  id_sh: string
  panjang_mm: string
  lebar_mm: string
}

interface GramasiApiResponse {
  status: number
  message?: string
  data?: GramasiItem[]
}


// ===== CONSTANTS =====
const BASE_FORM: FormData = { sheet_size_id: '', gsm: '', harga_per_lembar: '' }

const GSM_COLORS = [
  { bg: '#3b82f6', light: '#dbeafe' },
  { bg: '#10b981', light: '#d1fae5' },
  { bg: '#f59e0b', light: '#fed7aa' },
  { bg: '#8b5cf6', light: '#ede9fe' },
  { bg: '#ef4444', light: '#fee2e2' },
]

// ===== UTILITIES =====
const formatUkuranDisplay = (p: number, l: number) =>
  (!p || !l) ? '-' : `${p} × ${l} cm`

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n)

const formatHargaDisplay = (n: number) => n === 0 ? '-' : formatCurrency(n)

const getGSMColor = (gsm: number) => {
  if (gsm <= 200) return GSM_COLORS[0]
  if (gsm <= 300) return GSM_COLORS[1]
  if (gsm <= 400) return GSM_COLORS[2]
  if (gsm <= 450) return GSM_COLORS[3]
  return GSM_COLORS[4]
}

const buildSheetLabel = (p_mm: string, l_mm: string) => {
  const p = parseInt(p_mm) / 10, l = parseInt(l_mm) / 10
  return (!isNaN(p) && p > 0) ? `${p} × ${l} cm` : `${p_mm} × ${l_mm} mm`
}

const mapPriceItem = (item: DuplexApiItem): DuplexDataDK => ({
  id: parseInt(item.id),
  gsm: parseInt(item.gsm),
  sheet_size_id: item.id_sh,
  panjang: parseInt(item.panjang_mm) / 10,
  lebar: parseInt(item.lebar_mm) / 10,
  harga_per_lembar: parseFloat(item.harga_lembar) || 0,  // ← map dari API ke field baru
  type: 'DK'
})

// ===== CUSTOM HOOK =====
const useDuplexDK = () => {
  const [dataDK, setDataDK] = useState<DuplexDataDK[]>([])
  const [gramasiList, setGramasiList] = useState<GramasiItem[]>([])
  const [sheetSizeList, setSheetSizeList] = useState<SheetSizeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGramasi, setLoadingGramasi] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGramasi = useCallback(async () => {
    try {
      setLoadingGramasi(true)
      const res = await axios.get<GramasiApiResponse>('Admin/Duplek/gramasiIndex')
      if (res.data?.status === 200 && Array.isArray(res.data.data)) {
        const seenGsm = new Set<string>()
        const duplexOnly = res.data.data
          .filter(item => item.name === 'Duplex')
          .filter(item => {
            if (seenGsm.has(item.gsm)) return false
            seenGsm.add(item.gsm)
            return true
          })
          .sort((a, b) => parseInt(a.gsm) - parseInt(b.gsm))
        setGramasiList(duplexOnly)
      } else {
        setGramasiList([])
      }
    } catch (e) {
      console.error('fetchGramasi error:', e)
      setGramasiList([])
    } finally {
      setLoadingGramasi(false)
    }
  }, [])

const fetchData = useCallback(async () => {
  try {
    setLoading(true); setError(null)
    const res = await axios.get<ApiResponse<DuplexApiItem[]>>('Admin/Duplek/duplekKraftPrices')
    const raw: DuplexApiItem[] = (res.data?.status === 200 && Array.isArray(res.data.data))
      ? res.data.data : []

    setDataDK(raw.map(mapPriceItem))

    if (raw.length > 0) {
      // ← Normal: build sheetSizeList dari data DK sendiri
      const seenSh = new Set<string>()
      setSheetSizeList(
        raw
          .filter(i => { if (!i.id_sh || seenSh.has(i.id_sh)) return false; seenSh.add(i.id_sh); return true })
          .map(i => ({ id_sh: i.id_sh, panjang_sh: i.panjang_mm, lebar_sh: i.lebar_mm }))
          .sort((a, b) => parseInt(a.id_sh) - parseInt(b.id_sh))
      )
    } else {
      // ← Fallback: DB DK kosong, ambil ukuran dari DMD
      try {
        const fallback = await axios.get<ApiResponse<DuplexApiItem[]>>('Admin/Duplek/duplekMduplekPrices')
        const fallbackRaw: DuplexApiItem[] = (fallback.data?.status === 200 && Array.isArray(fallback.data.data))
          ? fallback.data.data : []

        const seenSh = new Set<string>()
        setSheetSizeList(
          fallbackRaw
            .filter(i => { if (!i.id_sh || seenSh.has(i.id_sh)) return false; seenSh.add(i.id_sh); return true })
            .map(i => ({ id_sh: i.id_sh, panjang_sh: i.panjang_mm, lebar_sh: i.lebar_mm }))
            .sort((a, b) => parseInt(a.id_sh) - parseInt(b.id_sh))
        )
      } catch {
        setSheetSizeList([])
      }
    }

  } catch (e) {
    console.error('fetchData error:', e)
    setError('Gagal mengambil data')
    setDataDK([])
  } finally {
    setLoading(false)
  }
}, [])

  useEffect(() => {
    fetchGramasi()
    fetchData()
  }, [fetchGramasi, fetchData])

  const stats = useMemo((): Stats => {
    const total = dataDK.length
    const wp = dataDK.filter(d => d.harga_per_lembar > 0)
    return {
      totalRecords: total,
      averagePrice: wp.length > 0 ? wp.reduce((s, d) => s + d.harga_per_lembar, 0) / wp.length : 0,
      totalCombinations: new Set(dataDK.map(d => `${d.gsm}-${d.sheet_size_id}`)).size,
      uniqueGsm: new Set(dataDK.map(d => d.gsm)).size,
      uniqueSizes: new Set(dataDK.map(d => d.sheet_size_id)).size
    }
  }, [dataDK])

  return { dataDK, gramasiList, sheetSizeList, loading, loadingGramasi, error, stats, refetch: fetchData }
}

// ===== MAIN COMPONENT =====
export default function DuplexDKPage() {
  const { dataDK, gramasiList, sheetSizeList, loading, loadingGramasi, error, stats, refetch } = useDuplexDK()

  const [isPosting, setIsPosting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DuplexDataDK | null>(null)
  const [selectedItem, setSelectedItem] = useState<DuplexDataDK | null>(null)

  const [addForm, setAddForm] = useState<FormData>({ ...BASE_FORM })
  const [editForm, setEditForm] = useState<FormData>({ ...BASE_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [addSize, setAddSize] = useState<SheetSizeItem | null>(null)
  const [editSize, setEditSize] = useState<SheetSizeItem | null>(null)
  const [addGramasi, setAddGramasi] = useState<GramasiItem | null>(null)
  const [editGramasi, setEditGramasi] = useState<GramasiItem | null>(null)

  // ===== SORTED DATA (tanpa search) =====
  const sortedData = useMemo(() =>
    [...dataDK].sort((a, b) =>
      a.gsm !== b.gsm ? a.gsm - b.gsm : (a.panjang * a.lebar) - (b.panjang * b.lebar)
    ), [dataDK])

  const gsmOptions = useMemo(() =>
    gramasiList.map((item, idx) => ({
      value: item.gsm,
      label: `${item.gsm} GSM`,
      key: `gr-${item.gsm}-${idx}`
    })), [gramasiList])

  // ← disamakan dengan DMD: tambah key prop + sort by id_sh sudah di hook
  const sheetOptions = useMemo(() =>
    sheetSizeList.map((i, idx) => ({
      value: i.id_sh,
      label: buildSheetLabel(i.panjang_sh, i.lebar_sh),
      key: `sh-${i.id_sh}-${idx}`
    })), [sheetSizeList])

  // ===== SYNC PREVIEW =====
  useEffect(() => {
    setAddSize(sheetSizeList.find(i => i.id_sh === addForm.sheet_size_id) ?? null)
  }, [addForm.sheet_size_id, sheetSizeList])

  useEffect(() => {
    setEditSize(sheetSizeList.find(i => i.id_sh === editForm.sheet_size_id) ?? null)
  }, [editForm.sheet_size_id, sheetSizeList])

  useEffect(() => {
    setAddGramasi(gramasiList.find(i => i.gsm === addForm.gsm) ?? null)
  }, [addForm.gsm, gramasiList])

  useEffect(() => {
    setEditGramasi(gramasiList.find(i => i.gsm === editForm.gsm) ?? null)
  }, [editForm.gsm, gramasiList])

  // ===== VALIDATION =====
  const validate = (form: FormData, isEdit = false): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!form.gsm) e.gsm = 'GSM tidak boleh kosong'
    if (!form.sheet_size_id) e.sheet_size_id = 'Ukuran tidak boleh kosong'
    if (form.harga_per_lembar.trim()) {
      const h = parseFloat(form.harga_per_lembar)
      if (isNaN(h)) e.harga_per_lembar = 'Harga harus berupa angka'
      else if (h < 0) e.harga_per_lembar = 'Harga tidak boleh negatif'
    }
    if (!isEdit && form.gsm && form.sheet_size_id) {
      const gNum = parseInt(form.gsm)
      if (dataDK.some(d => d.sheet_size_id === form.sheet_size_id && d.gsm === gNum)) {
        const sz = sheetSizeList.find(s => s.id_sh === form.sheet_size_id)
        e.general = `Kombinasi ${sz ? buildSheetLabel(sz.panjang_sh, sz.lebar_sh) : ''} dengan ${form.gsm} GSM sudah ada`
      }
    }
    return e
  }

  // ===== RESET =====
  const resetAdd = () => { setAddForm({ ...BASE_FORM }); setAddSize(null); setAddGramasi(null); setFormErrors({}) }
  const resetEdit = () => { setEditForm({ ...BASE_FORM }); setEditSize(null); setEditGramasi(null); setFormErrors({}) }

  // ===== UI HANDLERS =====
  const handleAddClick = () => { resetAdd(); setShowAddModal(true) }

  const handleEditClick = (item: DuplexDataDK) => {
    setEditingItem(item)
    setEditForm({
      gsm: item.gsm.toString(),
      sheet_size_id: item.sheet_size_id,
      harga_per_lembar: item.harga_per_lembar > 0 ? item.harga_per_lembar.toString() : ''
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleViewClick = (item: DuplexDataDK) => { setSelectedItem(item); setShowViewModal(true) }

  const closeAdd = () => { if (!isPosting) { setShowAddModal(false); resetAdd() } }
  const closeEdit = () => { if (!isPosting) { setShowEditModal(false); setEditingItem(null); resetEdit() } }
  const closeView = () => { setShowViewModal(false); setSelectedItem(null) }

  const onAddChange = (f: string, v: string) => {
    setAddForm(p => ({ ...p, [f]: v }))
    setFormErrors(p => ({ ...p, [f]: '', general: '' }))
  }
  const onEditChange = (f: string, v: string) => {
    setEditForm(p => ({ ...p, [f]: v }))
    setFormErrors(p => ({ ...p, [f]: '' }))
  }

  // ===== ERROR HELPERS =====
  const showDuplicateWarning = () => Swal.fire({
    icon: 'warning', title: 'Data Sudah Ada!',
    html: `<p class="text-gray-600">Kombinasi <strong>GSM</strong> dan <strong>Ukuran</strong> sudah terdaftar.</p>
           <p class="text-sm text-gray-400 mt-2">Pilih kombinasi lain atau edit data yang sudah ada.</p>`,
    confirmButtonColor: '#f59e0b', confirmButtonText: 'Mengerti'
  })

  const isDupErr = (err: unknown) => {
    const s = JSON.stringify((err as { response?: { data?: unknown } })?.response?.data ?? '')
    return s.includes('Duplicate entry') || s.includes('1062') || s.includes('uq_gsm_sheet')
  }

  const showErr = (err: unknown) => {
    const msg = (err as { response?: { data?: { message?: string } }, message?: string })
      ?.response?.data?.message || (err as { message?: string })?.message || 'Terjadi kesalahan'
    Swal.fire({ icon: 'error', title: 'Error!', text: msg, confirmButtonColor: '#3b82f6' })
  }

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    const errs = validate(addForm, false)
    if (Object.keys(errs).length) {
      setFormErrors(errs)
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi', confirmButtonColor: '#3b82f6' })
      return
    }

    const payload = {
      gramasi: addForm.gsm,
      pl: addForm.sheet_size_id,
      harga_lembar: addForm.harga_per_lembar.trim() || '0'  // ← key sesuai kolom DB
    }

    try {
      setIsPosting(true)
      const res = await axios.post<ApiResponse>('Admin/Duplek/duplekKraftPricesAdd', payload)
      const raw = res.data as unknown
      if (typeof raw === 'string' && ((raw as string).includes('Duplicate') || (raw as string).includes('Database Error'))) {
        showDuplicateWarning(); return
      }
      if (res.status === 200 || res.data?.status === 200) {
        const harga = parseFloat(addForm.harga_per_lembar.trim() || '0')
        if (harga > 0) {
          await refetch()
          const freshRes = await axios.get<ApiResponse<DuplexApiItem[]>>('Admin/Duplek/duplekKraftPrices')
          const freshData: DuplexApiItem[] = (freshRes.data?.status === 200 && Array.isArray(freshRes.data.data))
            ? freshRes.data.data : []
          const newItem = freshData.find(d => d.gsm === addForm.gsm && d.id_sh === addForm.sheet_size_id)
          if (newItem) {
            await axios.put<ApiResponse>(
              `Admin/Duplek/duplekKraftPricesEdit/${newItem.id}`,
              { gramasi: addForm.gsm, pl: addForm.sheet_size_id, harga_lembar: harga }
            )
            await refetch()
          }
        } else {
          await refetch()
        }
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data Duplex DK berhasil ditambahkan', timer: 1500, showConfirmButton: false })
        setShowAddModal(false); resetAdd()
      } else throw new Error(res.data?.message || 'Gagal')
    } catch (e) { if (isDupErr(e)) { showDuplicateWarning(); return }; showErr(e) }
    finally { setIsPosting(false) }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    const errs = validate(editForm, true)
    if (Object.keys(errs).length) {
      setFormErrors(errs)
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi', confirmButtonColor: '#3b82f6' })
      return
    }

    const payload = {
      gramasi: editForm.gsm,
      pl: editForm.sheet_size_id,
      harga_lembar: parseFloat(editForm.harga_per_lembar || '0')  // ← key sesuai kolom DB
    }

    try {
      setIsPosting(true)
      const res = await axios.put<ApiResponse>(`Admin/Duplek/duplekKraftPricesEdit/${editingItem.id}`, payload)
      const raw = res.data as unknown
      if (typeof raw === 'string' && ((raw as string).includes('Duplicate') || (raw as string).includes('Database Error'))) {
        showDuplicateWarning(); return
      }
      if (res.status === 200 || res.data?.status === 200) {
        await refetch()
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data Duplex DK berhasil diperbarui', timer: 1500, showConfirmButton: false })
        setShowEditModal(false); setEditingItem(null); resetEdit()
      } else throw new Error(res.data?.message || 'Gagal')
    } catch (e) { if (isDupErr(e)) { showDuplicateWarning(); return }; showErr(e) }
    finally { setIsPosting(false) }
  }

  const handleDelete = async (id: number, gsm: number, ukuran: string) => {
    const ok = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus data GSM ${gsm} - ${ukuran}?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
    })
    if (!ok.isConfirmed) return
    try {
      setIsPosting(true)
      const res = await axios.delete<ApiResponse>(`Admin/Duplek/duplekKraftPricesDel/${id}`)
      if (res.status === 200) {
        await refetch()
        Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Data berhasil dihapus', timer: 1500, showConfirmButton: false })
      } else throw new Error(res.data?.message || 'Gagal')
    } catch (e) { showErr(e) }
    finally { setIsPosting(false) }
  }

  // ===== LOADING =====
  if (loading && dataDK.length === 0 && !error)
    return <LoadingState message="Memuat Data Duplex DK..." submessage="Harap tunggu sebentar" icon="mdi:package-variant-closed" />

  // ===== RENDER =====
  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:package-variant-closed" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Duplex DK</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola ukuran dan harga Duplex Rumus DK</p>
          </div>
        </div>
        <Button onClick={handleAddClick} variant="primary" size="md" icon="mdi:plus">
          Tambah Ukuran DK
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: 'mdi:database', label: 'Total Records', value: stats.totalRecords, sub: `${stats.uniqueGsm} variasi GSM` },
          { icon: 'mdi:ruler-square', label: 'Kombinasi Ukuran', value: stats.totalCombinations, sub: `${stats.uniqueSizes} ukuran unik`, bar: (stats.totalCombinations / (stats.uniqueGsm * stats.uniqueSizes || 1)) * 100 },
          { icon: 'mdi:cash-multiple', label: 'Rata-rata Harga', value: formatHargaDisplay(stats.averagePrice), sub: 'per lembar' },
          { icon: 'mdi:chart-arc', label: 'Data dengan Harga', value: dataDK.filter(d => d.harga_per_lembar > 0).length, sub: `dari ${stats.totalRecords} data`, bar: (dataDK.filter(d => d.harga_per_lembar > 0).length / (stats.totalRecords || 1)) * 100 },
        ].map((s, i) => (
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
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(s.bar, 100)}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800">{error}</p>
        </div>
      )}

      {/* TABLE CARD */}
      <Card shadow="md" padding="none">
        {/* Toolbar — tanpa search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Ukuran Duplex DK</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalRecords} data · {stats.uniqueGsm} GSM · {stats.uniqueSizes} ukuran
            </p>
          </div>
          <button onClick={refetch} title="Refresh" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Icon icon="mdi:refresh" className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {sortedData.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:package-variant-closed-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data Duplex DK</p>
              <Button onClick={handleAddClick} variant="primary" icon="mdi:plus">Tambah Ukuran Baru</Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'GSM', 'Ukuran (cm)', 'Harga per Lembar', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedData.map((item, idx) => {
                  const luas = (item.panjang * item.lebar) / 10000
                  const perM2 = item.harga_per_lembar > 0 ? item.harga_per_lembar / luas : 0
                  return (
                    <tr key={`dk-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-800">{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: getGSMColor(item.gsm).light,
                                color: getGSMColor(item.gsm).bg
                              }}
                            >
                              {item.gsm} GSM
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                            <Icon icon="mdi:ruler-square" className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="font-medium text-slate-800">{formatUkuranDisplay(item.panjang, item.lebar)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.harga_per_lembar > 0 ? (
                          <div>
                            <div className="font-bold text-slate-800">{formatHargaDisplay(item.harga_per_lembar)}</div>
                            <div className="text-xs text-gray-400 mt-1">{formatCurrency(perM2)}/m²</div>
                          </div>
                        ) : <span className="text-gray-300 italic">Belum ada harga</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleViewClick(item)} title="Detail" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleEditClick(item)} title="Edit" className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.gsm, formatUkuranDisplay(item.panjang, item.lebar))} title="Hapus" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

        {sortedData.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{sortedData.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{stats.totalRecords}</span> data
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal isOpen={showAddModal} onClose={closeAdd} title="➕ Tambah Ukuran Duplex DK" size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={closeAdd} disabled={isPosting}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleAdd} loading={isPosting} disabled={isPosting} icon="mdi:check">Simpan Data</Button>
          </>
        }>
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">Pilih GSM Duplex dan Ukuran. Harga boleh dikosongkan jika belum tersedia.</p>
          </div>

          {/* GSM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GSM <span className="text-red-500">*</span></label>
            {loadingGramasi ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-500">Memuat data GSM Duplex...</span>
              </div>
            ) : (
              <Select value={addForm.gsm} onChange={e => onAddChange('gsm', e.target.value)}
                options={gsmOptions} placeholder="-- Pilih GSM Duplex --"
                disabled={isPosting} className={formErrors.gsm ? 'border-red-500' : ''} />
            )}
            {formErrors.gsm && <p className="text-xs text-red-600 mt-2">{formErrors.gsm}</p>}
            {!loadingGramasi && gramasiList.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">⚠ Data GSM Duplex tidak tersedia</p>
            )}
          </div>

          {/* Ukuran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran <span className="text-red-500">*</span></label>
            <Select value={addForm.sheet_size_id} onChange={e => onAddChange('sheet_size_id', e.target.value)}
              options={sheetOptions} placeholder="-- Pilih Ukuran --"
              disabled={isPosting} className={formErrors.sheet_size_id ? 'border-red-500' : ''} />
            {formErrors.sheet_size_id && <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>}
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga per Lembar <span className="text-xs text-gray-400 ml-1">(opsional)</span>
            </label>
            <Input type="number" value={addForm.harga_per_lembar} onChange={e => onAddChange('harga_per_lembar', e.target.value)}
              placeholder="Masukkan harga per lembar" leftIcon="mdi:cash" disabled={isPosting}
              className={formErrors.harga_per_lembar ? 'border-red-500' : ''} min="1" step="100" />
            {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
          </div>

          {/* Preview */}
          {addSize && addGramasi && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600" />Preview Data
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500 mb-1">GSM:</p><p className="font-medium">{addGramasi.gsm} GSM</p></div>
                <div><p className="text-gray-500 mb-1">Ukuran:</p><p className="font-medium">{buildSheetLabel(addSize.panjang_sh, addSize.lebar_sh)}</p></div>
                <div><p className="text-gray-500 mb-1">Luas:</p><p className="font-medium">{((parseInt(addSize.panjang_sh) / 10) * (parseInt(addSize.lebar_sh) / 10) / 10000).toFixed(2)} m²</p></div>
                <div>
                  <p className="text-gray-500 mb-1">Harga:</p>
                  <p className="font-medium">
                    {addForm.harga_per_lembar && parseFloat(addForm.harga_per_lembar) > 0
                      ? formatCurrency(parseFloat(addForm.harga_per_lembar))
                      : <span className="text-gray-400 italic">(kosong / 0)</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {formErrors.general && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
              <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{formErrors.general}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal isOpen={showEditModal} onClose={closeEdit} title="✏️ Edit Ukuran Duplex DK" size="lg"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button variant="outline" size="md" onClick={closeEdit} disabled={isPosting}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleEdit} loading={isPosting} disabled={isPosting} icon="mdi:check">Update Data</Button>
          </>
        }>
        {editingItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-1">Data Saat Ini</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><p className="text-blue-600 text-xs">Ukuran</p><p className="font-medium text-blue-900">{formatUkuranDisplay(editingItem.panjang, editingItem.lebar)}</p></div>
                  <div><p className="text-blue-600 text-xs">GSM</p><p className="font-medium text-blue-900">{editingItem.gsm} GSM</p></div>
                  <div><p className="text-blue-600 text-xs">Harga</p><p className="font-medium text-blue-900">{formatHargaDisplay(editingItem.harga_per_lembar)}</p></div>
                </div>
              </div>
            </div>

            {/* GSM Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GSM Baru <span className="text-red-500">*</span></label>
              {loadingGramasi ? (
                <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <Icon icon="mdi:loading" className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-gray-500">Memuat data GSM Duplex...</span>
                </div>
              ) : (
                <Select value={editForm.gsm} onChange={e => onEditChange('gsm', e.target.value)}
                  options={gsmOptions} placeholder="-- Pilih GSM Duplex --"
                  disabled={isPosting} className={formErrors.gsm ? 'border-red-500' : ''} />
              )}
              {formErrors.gsm && <p className="text-xs text-red-600 mt-2">{formErrors.gsm}</p>}
            </div>

            {/* Ukuran Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran Baru <span className="text-red-500">*</span></label>
              <Select value={editForm.sheet_size_id} onChange={e => onEditChange('sheet_size_id', e.target.value)}
                options={sheetOptions} placeholder="-- Pilih Ukuran --"
                disabled={isPosting} className={formErrors.sheet_size_id ? 'border-red-500' : ''} />
              {formErrors.sheet_size_id && <p className="text-xs text-red-600 mt-2">{formErrors.sheet_size_id}</p>}
            </div>

            {/* Harga Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Baru <span className="text-xs text-gray-400 ml-1">(opsional)</span>
              </label>
              <Input type="number" value={editForm.harga_per_lembar} onChange={e => onEditChange('harga_per_lembar', e.target.value)}
                placeholder="Kosongkan atau isi 0 jika belum ada harga" leftIcon="mdi:cash" disabled={isPosting}
                className={formErrors.harga_per_lembar ? 'border-red-500' : ''} min="0" step="100" />
              {formErrors.harga_per_lembar && <p className="text-xs text-red-600 mt-2">{formErrors.harga_per_lembar}</p>}
            </div>

            {/* Preview Update */}
            {editSize && editGramasi && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600" />Preview Update
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 mb-1">GSM Baru:</p><p className="font-medium">{editGramasi.gsm} GSM</p></div>
                  <div><p className="text-gray-500 mb-1">Ukuran Baru:</p><p className="font-medium">{buildSheetLabel(editSize.panjang_sh, editSize.lebar_sh)}</p></div>
                  <div><p className="text-gray-500 mb-1">Luas:</p><p className="font-medium">{((parseInt(editSize.panjang_sh) / 10) * (parseInt(editSize.lebar_sh) / 10) / 10000).toFixed(2)} m²</p></div>
                  <div>
                    <p className="text-gray-500 mb-1">Harga Baru:</p>
                    <p className="font-medium">
                      {editForm.harga_per_lembar && parseFloat(editForm.harga_per_lembar) > 0
                        ? formatCurrency(parseFloat(editForm.harga_per_lembar))
                        : <span className="text-gray-400 italic">(kosong / 0)</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal isOpen={showViewModal} onClose={closeView} title="Detail Duplex DK" size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={closeView}>Tutup</Button>
            <Button variant="primary" size="md" icon="mdi:pencil-outline" onClick={() => { closeView(); if (selectedItem) handleEditClick(selectedItem) }}>Edit Data</Button>
          </>
        }>
        {selectedItem && (() => {
          const luas = (selectedItem.panjang * selectedItem.lebar) / 10000
          const perM2 = selectedItem.harga_per_lembar > 0 ? selectedItem.harga_per_lembar / luas : 0
          const col = getGSMColor(selectedItem.gsm)
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="mdi:package-variant-closed" className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Duplex DK</p>
                  <div className="flex items-center gap-2 mt-1">
                   {selectedItem.gsm} GSM
                  </div>
                </div>
              </div>

              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Informasi Ukuran</p>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Dimensi</span>
                    <span className="text-sm font-medium text-slate-800">{formatUkuranDisplay(selectedItem.panjang, selectedItem.lebar)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Luas</span>
                    <span className="text-sm font-medium text-slate-800">{luas.toFixed(2)} m²</span>
                  </div>
                </div>
              </Card>

              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-2">Informasi Harga</p>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-xs font-medium text-gray-500">Harga per Lembar</span>
                    <span className="text-sm font-bold text-slate-800">{formatHargaDisplay(selectedItem.harga_per_lembar)}</span>
                  </div>
                  {selectedItem.harga_per_lembar > 0 && (
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs font-medium text-gray-500">Harga per m²</span>
                      <span className="text-sm font-medium text-slate-800">{formatCurrency(perM2)}</span>
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">Type</p><p className="text-sm font-medium text-slate-700">DK (Duplex Kraft)</p></div>
                <div><p className="text-xs text-gray-400">Sheet Size ID</p><p className="text-sm font-mono text-slate-700">{selectedItem.sheet_size_id}</p></div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}