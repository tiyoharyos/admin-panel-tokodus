'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { AxiosError } from 'axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Input from '@/components/UI/Input'
import Modal from '@/components/UI/Modal'
import LoadingState from '@/components/UI/LoadingState'
import SweetAlert from '@/components/UI/SweetAlert'
import { Icon } from '@iconify/react'

// ===== TYPE DEFINITIONS =====
interface Flute {
  id: string
  code: string
  name: string
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalFlutes: number
  bFlute: number
  cFlute: number
  cbFlute: number
  ebFlute: number
  others: number
}

interface FormData {
  code: string
  name: string
}

interface ApiResponse<T> {
  status: number
  message?: string
  data: T
}

interface FluteApiItem {
  id_f?: string | number
  code?: string
  name?: string
  created_at?: string
  updated_at?: string
}

interface FluteListResponse {
  status: number
  message?: string
  data: FluteApiItem[]
}

interface FluteSingleResponse {
  status: number
  message?: string
  data: FluteApiItem
}

// ===== CONSTANTS =====
const FLUTE_TYPE_MAP: Record<string, string> = {
  'B': 'B-Flute',
  'C': 'C-Flute',
  'CB': 'CB-Flute',
  'BC': 'BC-Flute',
  'EB': 'EB-Flute',
  'E': 'E-Flute',
  'A': 'A-Flute',
  'F': 'F-Flute'
}

const BASE_FORM_DATA: FormData = { code: '', name: '' }

// ===== BADGE (same as print-settings) =====
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

// ===== UTILITIES =====
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const getFluteAccent = (code: string): string => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B':  return '#3b82f6'
    case 'C':  return '#10b981'
    case 'CB':
    case 'BC': return '#f59e0b'
    case 'EB':
    case 'E':  return '#8b5cf6'
    default:   return '#64748b'
  }
}

const getFluteIcon = (code: string): string => {
  const upperCode = code.toUpperCase()
  switch (upperCode) {
    case 'B':  return 'mdi:alpha-b-box'
    case 'C':  return 'mdi:alpha-c-box'
    case 'CB':
    case 'BC': return 'mdi:layers-triple'
    case 'EB':
    case 'E':  return 'mdi:package-variant'
    default:   return 'mdi:shape'
  }
}

// ===== MAIN COMPONENT =====
export default function FlutesPage() {
  const router = useRouter()

  // ===== STATE =====
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM_DATA })
  const [editingItem, setEditingItem] = useState<Flute | null>(null)

  const [stats, setStats] = useState<Stats>({
    totalFlutes: 0, bFlute: 0, cFlute: 0, cbFlute: 0, ebFlute: 0, others: 0
  })

  // ===== HELPER FUNCTIONS =====
  const processFluteData = (items: FluteApiItem[]): Flute[] =>
    items.map(item => ({
      id: item.id_f?.toString() || '',
      code: item.code || '',
      name: item.name || '',
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString()
    }))

  const resetStats = (): void =>
    setStats({ totalFlutes: 0, bFlute: 0, cFlute: 0, cbFlute: 0, ebFlute: 0, others: 0 })

  const updateStatsFromFlutes = (data: Flute[]): void =>
    setStats({
      totalFlutes: data.length,
      bFlute:  data.filter(f => f.code.toUpperCase() === 'B').length,
      cFlute:  data.filter(f => f.code.toUpperCase() === 'C').length,
      cbFlute: data.filter(f => ['CB', 'BC'].includes(f.code.toUpperCase())).length,
      ebFlute: data.filter(f => ['EB', 'E'].includes(f.code.toUpperCase())).length,
      others:  data.filter(f => !['B','C','CB','BC','EB','E'].includes(f.code.toUpperCase())).length
    })

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') return 'Koneksi timeout. Silakan coba lagi.'
      if (!error.response) return 'Tidak bisa connect ke server. Periksa koneksi internet.'
      if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
        return (error.response.data as { message: string }).message
      return 'Terjadi kesalahan saat memuat data'
    }
    if (error instanceof Error) return error.message
    return 'Terjadi kesalahan yang tidak diketahui'
  }

  // ===== API CALLS =====
  const fetchFlutes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<FluteListResponse | FluteApiItem[] | ApiResponse<null>>(
        '/Admin/Flutes/Flutes' )
      if (response.data) {
        let processedFlutes: Flute[] = []
        if (typeof response.data === 'object' && response.data !== null) {
          if ('status' in response.data && response.data.status === 200) {
            const rd = response.data as FluteListResponse
            if (Array.isArray(rd.data)) processedFlutes = processFluteData(rd.data)
          } else if (Array.isArray(response.data)) {
            processedFlutes = processFluteData(response.data as FluteApiItem[])
          }
        }
        setFlutes(processedFlutes)
        updateStatsFromFlutes(processedFlutes)
      } else {
        setFlutes([])
        resetStats()
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError && (err.response?.status === 404 || err.response?.status === 204)) {
        setFlutes([]); resetStats(); setError(null)
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFlutes() }, [fetchFlutes])

  // ===== HANDLERS =====
  const handleCodeChange = (value: string): void => {
    const upperCode = value.toUpperCase()
    setAddFormData({ code: upperCode, name: FLUTE_TYPE_MAP[upperCode] || `${upperCode}-Flute` })
  }

  const handleEditCodeChange = (value: string): void => {
    if (!editingItem) return
    const upperCode = value.toUpperCase()
    setEditingItem({ ...editingItem, code: upperCode, name: FLUTE_TYPE_MAP[upperCode] || `${upperCode}-Flute` })
  }

  const validateForm = (data: FormData): boolean => {
    if (!data.code.trim()) { SweetAlert.error('Validasi Error', 'Kode tidak boleh kosong'); return false }
    if (data.code.length > 3) { SweetAlert.error('Validasi Error', 'Kode maksimal 3 karakter'); return false }
    if (!data.name.trim()) { SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong'); return false }
    return true
  }

  const handleAddClick = useCallback((): void => {
    setAddFormData({ ...BASE_FORM_DATA })
    setShowAddModal(true)
  }, [])

  const handleAddSave = async (): Promise<void> => {
    if (!validateForm(addFormData)) return
    const isDuplicate = flutes.some(f => f.code.toUpperCase() === addFormData.code.trim().toUpperCase())
    if (isDuplicate) { SweetAlert.error('Kode Sudah Ada!', `Kode "${addFormData.code}" sudah terdaftar.`); return }

    try {
      setIsPosting(true)
      const response = await axios.post<ApiResponse<FluteApiItem>>('/Admin/Flutes/FlutesAdd', {
        code: addFormData.code.trim(),
        name: addFormData.name.trim()
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 15000 })

      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil ditambahkan!')
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM_DATA })
        await fetchFlutes()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal menambahkan Flute')
      }
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat menyimpan data'
      if (err instanceof AxiosError) {
        if (err.response?.status === 500 && typeof err.response?.data === 'string' && err.response.data.includes('Duplicate entry'))
          errorMessage = `Kode "${addFormData.code}" sudah terdaftar.`
        else if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data)
          errorMessage = (err.response.data as { message: string }).message || errorMessage
        else if (err.code === 'ECONNABORTED')
          errorMessage = 'Koneksi timeout. Silakan coba lagi.'
      }
      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  const handleEditClick = useCallback(async (item: Flute): Promise<void> => {
    try {
      const response = await axios.get<FluteSingleResponse | ApiResponse<FluteApiItem>>(
        `/Admin/Flutes/FlutesByid/${item.id}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' }, timeout: 10000 }
      )
      if (response.data && 'status' in response.data && response.data.status === 200 && response.data.data) {
        const data = response.data.data as FluteApiItem
        setEditingItem({
          id: data.id_f?.toString() || item.id,
          code: data.code || item.code,
          name: data.name || item.name,
          createdAt: data.created_at || item.createdAt,
          updatedAt: data.updated_at || item.updatedAt
        })
      } else {
        setEditingItem({ ...item })
      }
    } catch {
      setEditingItem({ ...item })
    }
    setShowEditModal(true)
  }, [])

  const handleEditSave = async (): Promise<void> => {
    if (!editingItem || !validateForm(editingItem)) return
    const isDuplicate = flutes.some(f => f.id !== editingItem.id && f.code.toUpperCase() === editingItem.code.trim().toUpperCase())
    if (isDuplicate) { SweetAlert.error('Kode Sudah Ada!', `Kode "${editingItem.code}" sudah digunakan.`); return }

    try {
      setIsPosting(true)
      const response = await axios.put<ApiResponse<FluteApiItem>>(
        `/Admin/Flutes/FlutesEdit/${editingItem.id}`,
        { code: editingItem.code.trim(), name: editingItem.name.trim() },
        { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 15000 }
      )
      if (response.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil diperbarui!')
        setShowEditModal(false)
        setEditingItem(null)
        await fetchFlutes()
      } else {
        SweetAlert.error('Gagal!', response.data?.message || 'Gagal mengupdate data')
      }
    } catch (err: unknown) {
      let errorMessage = 'Terjadi kesalahan saat mengupdate data'
      if (err instanceof AxiosError) {
        if (err.response?.status === 500 && typeof err.response?.data === 'string' && err.response.data.includes('Duplicate entry'))
          errorMessage = `Kode "${editingItem.code}" sudah digunakan.`
        else if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data)
          errorMessage = (err.response.data as { message: string }).message || errorMessage
        else if (err.code === 'ECONNABORTED')
          errorMessage = 'Koneksi timeout. Silakan coba lagi.'
      }
      SweetAlert.error('Error!', errorMessage)
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = useCallback(async (id: string, name: string): Promise<void> => {
    const result = await SweetAlert.confirmDelete()
    if (result.isConfirmed) {
      try {
        const response = await axios.delete<ApiResponse<null>>(
          `/Admin/Flutes/FlutesDel/${id}`,
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        )
        if (response.data?.status === 200) {
          SweetAlert.success('Dihapus!', `Flute "${name}" berhasil dihapus!`)
          await fetchFlutes()
        } else {
          SweetAlert.error('Gagal!', response.data?.message || 'Gagal menghapus Flute')
        }
      } catch (err: unknown) {
        let errorMessage = 'Terjadi kesalahan saat menghapus data'
        if (err instanceof AxiosError && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data)
          errorMessage = (err.response.data as { message: string }).message
        SweetAlert.error('Error!', errorMessage)
      }
    }
  }, [fetchFlutes])

  const handleCloseAddModal = useCallback((): void => {
    if (!isPosting) { setShowAddModal(false); setAddFormData({ ...BASE_FORM_DATA }) }
  }, [isPosting])

  const handleCloseEditModal = useCallback((): void => {
    if (!isPosting) { setShowEditModal(false); setEditingItem(null) }
  }, [isPosting])

  // ===== RENDER =====
  if (loading) return <LoadingState icon="mdi:layers" message="Memuat Flutes..." submessage="Harap tunggu sebentar" />

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ===== HEADER ===== */}
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
          <Button variant="outline" size="md" onClick={fetchFlutes} icon="mdi:refresh">
            Refresh Data
          </Button>
          <Button variant="primary" size="md" onClick={handleAddClick} icon="mdi:plus">
            Tambah Flute
          </Button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: 'mdi:layers',         label: 'Total Flutes', value: stats.totalFlutes, sub: 'jenis tersedia',    accent: '#6366f1' },
          { icon: 'mdi:alpha-b-box',    label: 'B-Flute',      value: stats.bFlute,      sub: 'ketebalan ~3mm',   accent: '#3b82f6' },
          { icon: 'mdi:alpha-c-box',    label: 'C-Flute',      value: stats.cFlute,      sub: 'ketebalan ~4mm',   accent: '#10b981' },
          { icon: 'mdi:layers-triple',  label: 'CB/BC-Flute',  value: stats.cbFlute,     sub: 'double wall',      accent: '#f59e0b' },
          { icon: 'mdi:package-variant',label: 'Others',       value: stats.ebFlute + stats.others, sub: 'E, EB, A, F, dll', accent: '#8b5cf6' },
        ].map((s, i) => (
          <Card key={i} shadow="sm" padding="md" hoverable>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}15` }}>
                <Icon icon={s.icon} className="w-4 h-4" style={{ color: s.accent }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== TABLE CARD ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Flutes</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalFlutes} jenis flute terdaftar
            </p>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Icon icon="mdi:information-outline" className="w-3.5 h-3.5" />
            Kode flute otomatis uppercase
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {flutes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:layers-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data flute</p>
              <Button variant="primary" size="sm" onClick={handleAddClick} icon="mdi:plus">
                Tambah Flute
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Kode', 'Nama Flute', 'Tanggal Dibuat', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {flutes.map((flute) => {
                  const accent = getFluteAccent(flute.code)
                  return (
                    <tr key={flute.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Kode */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${accent}15` }}>
                            <Icon icon={getFluteIcon(flute.code)} className="w-5 h-5" style={{ color: accent }} />
                          </div>
                          <Badge color={accent}>{flute.code}</Badge>
                        </div>
                      </td>

                      {/* Nama */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-800">{flute.name}</p>
                      </td>

                      {/* Tanggal */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{formatDate(flute.createdAt)}</p>
                        {flute.updatedAt && flute.updatedAt !== flute.createdAt && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Icon icon="mdi:update" className="w-3 h-3" />
                            {formatDate(flute.updatedAt)}
                          </p>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditClick(flute)}
                            title="Edit"
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(flute.id, flute.name)}
                            title="Hapus"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
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
        {flutes.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{flutes.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{stats.totalFlutes}</span> flute
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Tambah Flute Baru"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseAddModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleAddSave} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Flute'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Info box */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Flute Baru</p>
              <p className="text-xs text-blue-600 mt-1">
                Nama otomatis terisi dari kode. Maksimal 3 karakter, otomatis uppercase.
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:layers" className="w-3.5 h-3.5 text-blue-600" />
              </div>
              Informasi Flute
            </h4>
            <Input
              label="Kode Flute *"
              value={addFormData.code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCodeChange(e.target.value)}
              placeholder="Contoh: B, C, CB, BC, EB"
              helperText="Masukkan kode flute (otomatis uppercase)"
              maxLength={3}
              disabled={isPosting}
            />
            <Input
              label="Nama Flute *"
              value={addFormData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddFormData({ ...addFormData, name: e.target.value })}
              placeholder="Contoh: B-Flute"
              helperText="Nama otomatis terisi, bisa diubah jika perlu"
              disabled={isPosting}
            />
          </div>

          {/* Preview */}
          {addFormData.code && (
            <div className="p-4 rounded-lg border"
              style={{ background: `${getFluteAccent(addFormData.code)}08`, borderColor: `${getFluteAccent(addFormData.code)}30` }}>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:eye-outline" className="w-3.5 h-3.5" />
                Preview
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${getFluteAccent(addFormData.code)}18` }}>
                  <Icon icon={getFluteIcon(addFormData.code)} className="w-5 h-5"
                    style={{ color: getFluteAccent(addFormData.code) }} />
                </div>
                <div>
                  <Badge color={getFluteAccent(addFormData.code)}>{addFormData.code}</Badge>
                  <p className="text-sm font-medium text-slate-700 mt-1">{addFormData.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={`Edit Flute — ${editingItem?.code}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isPosting}>Batal</Button>
            <Button variant="primary" onClick={handleEditSave} loading={isPosting} disabled={isPosting} icon="mdi:check">
              {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Info box */}
            <div className="flex items-center gap-3 p-4 rounded-lg border"
              style={{
                background: `${getFluteAccent(editingItem.code)}08`,
                borderColor: `${getFluteAccent(editingItem.code)}30`
              }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${getFluteAccent(editingItem.code)}18` }}>
                <Icon icon="mdi:pencil-outline" className="w-5 h-5" style={{ color: getFluteAccent(editingItem.code) }} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Mode Edit</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ID: <span className="font-mono">{editingItem.id}</span>
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:layers" className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Informasi Flute
              </h4>
              <Input
                label="Kode Flute *"
                value={editingItem.code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEditCodeChange(e.target.value)}
                placeholder="Contoh: B, C, CB, BC, EB"
                helperText="Ubah kode flute (maksimal 3 karakter)"
                maxLength={3}
                disabled={isPosting}
              />
              <Input
                label="Nama Flute *"
                value={editingItem.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Contoh: B-Flute"
                disabled={isPosting}
              />
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg border"
              style={{
                background: `${getFluteAccent(editingItem.code)}08`,
                borderColor: `${getFluteAccent(editingItem.code)}30`
              }}>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <Icon icon="mdi:eye-outline" className="w-3.5 h-3.5" />
                Preview Perubahan
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${getFluteAccent(editingItem.code)}18` }}>
                  <Icon icon={getFluteIcon(editingItem.code)} className="w-5 h-5"
                    style={{ color: getFluteAccent(editingItem.code) }} />
                </div>
                <div>
                  <Badge color={getFluteAccent(editingItem.code)}>{editingItem.code}</Badge>
                  <p className="text-sm font-medium text-slate-700 mt-1">{editingItem.name}</p>
                </div>
              </div>
            </div>

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
        )}
      </Modal>
    </div>
  )
}