// app/(protected)/box-models/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import TextArea from '@/components/UI/TextArea'
import LoadingState from '@/components/UI/LoadingState'
import { Icon } from '@iconify/react'
import Swal from 'sweetalert2'

// ============ TYPES ============
interface FormulaComponent {
  id?: string
  box_model_id?: string
  target: 'panjang' | 'lebar' | string
  source: 'P' | 'L' | 'T' | 'A' | 'B' | 'C' | string
  multiplier: number
  allowance_mm?: number
  sort_order?: number
}

interface BoxModel {
  id: string
  kode: string
  namaModel: string
  deskripsi: string
  status: boolean
  status_bm: string
  createdAt: string
  updatedAt: string
  formulaComponents: FormulaComponent[]
  hasFormula: boolean
  category: string
}

interface Stats {
  totalModels: number
  activeModels: number
  withFormulas: number
  withoutFormulas: number
  mailerBoxCount: number
  shoeBoxCount: number
}

// ============ API TYPES ============
interface ApiResponse<T = unknown> {
  status: number
  message?: string
  data?: T
}

interface BoxModelApiItem {
  id_bm?: string | number
  code?: string
  name?: string
  description?: string
  category?: string
  status_bm?: string | number
  created_at?: string
  updated_at?: string
}

interface FormulaApiItem {
  id_bfc?: string | number
  target?: string
  source?: string
  multiplier?: string | number
  allowance_mm?: string | number
  sort_order?: string | number
}

interface FormulaApiResponse {
  status: number
  data?: {
    formula?: FormulaApiItem | FormulaApiItem[]
  }
}

// ============ CONSTANTS ============
const SOURCE_OPTIONS = [
  { value: 'P', label: 'P (Panjang Produk - cm)' },
  { value: 'L', label: 'L (Lebar Produk - cm)' },
  { value: 'T', label: 'T (Tinggi Produk - cm)' },
  { value: 'A', label: 'A (Panjang ×10 - mm)' },
  { value: 'B', label: 'B (Lebar ×10 - mm)' },
  { value: 'C', label: 'C (Tinggi ×10 - mm)' }
]

const TARGET_OPTIONS = [
  { value: 'panjang', label: 'Panjang' },
  { value: 'lebar', label: 'Lebar' }
]

const CATEGORY_OPTIONS = [
  { value: 'Mailer Box', label: 'Mailer Box' },
  { value: 'Shoe Box', label: 'Shoe Box' },
  { value: 'Food Box', label: 'Food Box' },
  { value: 'Premium Box', label: 'Premium Box' }
]

const BASE_ADD_FORM = {
  code: '',
  name: '',
  description: '',
  category: 'Mailer Box',
  status_bm: '1'
}

// ============ META CONSTANTS ============
const BOX_META: Record<string, { icon: string; accent: string }> = {
  'Mailer Box': { icon: 'mdi:package-variant-closed', accent: '#3b82f6' },
  'Shoe Box': { icon: 'mdi:shoe-sneaker', accent: '#10b981' },
  'Food Box': { icon: 'mdi:food', accent: '#f59e0b' },
  'Premium Box': { icon: 'mdi:crown', accent: '#8b5cf6' },
}
const DEFAULT_META = { icon: 'mdi:package-variant', accent: '#64748b' }

// ============ UTILITIES ============
const generateCode = (existingCodes: string[]): string => {
  const numericCodes = existingCodes.filter(code => /^\d+$/.test(code)).map(Number)
  if (numericCodes.length) return (Math.max(...numericCodes) + 1).toString().padStart(6, '0')
  return Date.now().toString().slice(-6).padStart(6, '0')
}

const formatFormula = (components: FormulaComponent[]): string => {
  if (!components?.length) return '-'

  const format = (comp: FormulaComponent | undefined): string =>
    comp ? `${comp.source} × ${comp.multiplier}${comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}` : '-'

  const panjang = components.find(c => c.target === 'panjang')
  const lebar = components.find(c => c.target === 'lebar')

  return `P: ${format(panjang)} | L: ${format(lebar)}`
}

const parseFormulaComponent = (comp: FormulaApiItem): FormulaComponent => ({
  id: comp.id_bfc?.toString(),
  target: comp.target || 'panjang',
  source: comp.source || 'P',
  multiplier: parseFloat(comp.multiplier?.toString() || '0') || 0,
  allowance_mm: parseFloat(comp.allowance_mm?.toString() || '0') || 0,
  sort_order: parseInt(comp.sort_order?.toString() || '1') || 1
})

const processFormulaResponse = (data: FormulaApiResponse): FormulaComponent[] => {
  if (data?.status !== 200 || !data.data?.formula) return []
  const formula = data.data.formula
  return Array.isArray(formula)
    ? formula.map(parseFormulaComponent)
    : [parseFormulaComponent(formula)]
}

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
  }
  return fallback
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

// ============ CUSTOM HOOKS ============
const useBoxModels = () => {
  const [boxModels, setBoxModels] = useState<BoxModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoxModels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await axios.get('/Admin/Box/boxModels')

      if (data?.status === 200 && Array.isArray(data.data)) {
        const processed = await Promise.all(data.data.map(async (item: BoxModelApiItem) => {
          let components: FormulaComponent[] = []
          try {
            const formulaRes = await axios.get<FormulaApiResponse>(
              `/Admin/Box/boxFormulaComponentsJoinBox/${item.id_bm}`,
              { headers: { 'ngrok-skip-browser-warning': 'true' } }
            )
            components = processFormulaResponse(formulaRes.data)
          } catch {
            // formula not found, keep empty
          }

          return {
            id: item.id_bm?.toString() || '',
            kode: item.code || '',
            namaModel: item.name || '',
            deskripsi: item.description || '',
            status: item.status_bm === '1' || item.status_bm === 1,
            status_bm: item.status_bm?.toString() || '1',
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
            formulaComponents: components,
            hasFormula: components.length > 0,
            category: item.category || 'Mailer Box'
          }
        }))

        setBoxModels(processed)
      } else {
        setBoxModels([])
        setError('Format response tidak sesuai')
      }
    } catch (err: unknown) {
      console.error('Error fetching box models:', err)
      setError(getErrMsg(err, 'Tidak bisa connect ke server'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoxModels()
  }, [fetchBoxModels])

  return { boxModels, loading, error, refetch: fetchBoxModels }
}

// ============ MAIN COMPONENT ============
export default function BoxModelsPage() {
  const { boxModels, loading, error, refetch } = useBoxModels()
  const [isPosting, setIsPosting] = useState(false)
  const [search, setSearch] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFormulaModal, setShowFormulaModal] = useState(false)
  
  const [addFormData, setAddFormData] = useState(BASE_ADD_FORM)
  const [editingItem, setEditingItem] = useState<BoxModel | null>(null)
  const [selectedItem, setSelectedItem] = useState<BoxModel | null>(null)
  const [editingFormulaComponents, setEditingFormulaComponents] = useState<FormulaComponent[]>([])

  // ===== STATS =====
  const stats = useMemo((): Stats => ({
    totalModels: boxModels.length,
    activeModels: boxModels.filter(m => m.status).length,
    withFormulas: boxModels.filter(m => m.hasFormula).length,
    withoutFormulas: boxModels.filter(m => !m.hasFormula).length,
    mailerBoxCount: boxModels.filter(m => m.category === 'Mailer Box').length,
    shoeBoxCount: boxModels.filter(m => m.category === 'Shoe Box').length
  }), [boxModels])

  const filtered = useMemo(() =>
    boxModels.filter(m =>
      m.namaModel.toLowerCase().includes(search.toLowerCase()) ||
      m.kode.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    ), [boxModels, search])

  // ===== VALIDATION =====
  const validateFormula = (components: FormulaComponent[]): boolean => {
    const invalid = components.filter(c =>
      !c.target || !['panjang', 'lebar'].includes(c.target) ||
      !c.source || !['P', 'L', 'T', 'A', 'B', 'C'].includes(c.source) ||
      c.multiplier === undefined || isNaN(c.multiplier)
    )

    if (invalid.length) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: `${invalid.length} komponen memiliki data yang tidak valid`,
        confirmButtonColor: '#3b82f6'
      })
      return false
    }
    return true
  }

  // ===== API HANDLERS =====
  const handleAdd = async () => {
    if (!addFormData.name.trim() || !addFormData.description.trim()) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validasi Error', 
        text: 'Nama dan deskripsi harus diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    try {
      setIsPosting(true)
      const { data } = await axios.post<ApiResponse>('/Admin/Box/boxModels', {
        code: addFormData.code.trim(),
        name: addFormData.name.trim(),
        description: addFormData.description.trim(),
        category: addFormData.category.trim(),
        status_bm: addFormData.status_bm
      })

      if (data?.status === 200) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: 'Box Model berhasil ditambahkan!', 
          timer: 1500,
          showConfirmButton: false
        })
        setShowAddModal(false)
        setAddFormData(BASE_ADD_FORM)
        await refetch()
      }
    } catch (err: unknown) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Gagal menyimpan data'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    if (!editingItem.namaModel.trim() || !editingItem.deskripsi?.trim()) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validasi Error', 
        text: 'Nama dan deskripsi harus diisi',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    const components = editingItem.formulaComponents || []
    if (components.length && !validateFormula(components)) return

    try {
      setIsPosting(true)
      const { data } = await axios.put<ApiResponse>(`/Admin/Box/boxModelsFormulaEdit/${editingItem.id}`, {
        code: editingItem.kode.trim(),
        name: editingItem.namaModel.trim(),
        description: editingItem.deskripsi.trim(),
        category: editingItem.category || 'Mailer Box',
        status_bm: editingItem.status_bm || '1',
        formula: components.map(c => ({
          target: c.target,
          source: c.source,
          multiplier: c.multiplier.toString(),
          allowance_mm: c.allowance_mm?.toString() || '0',
          sort_order: c.sort_order?.toString() || '1'
        }))
      })

      if (data?.status === 200) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: 'Data berhasil diperbarui!', 
          timer: 1500,
          showConfirmButton: false
        })
        await refetch()
        setShowEditModal(false)
        setEditingItem(null)
      }
    } catch (err: unknown) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: getErrMsg(err, 'Gagal mengupdate data'),
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleFormulaSave = async () => {
    if (!editingItem || !validateFormula(editingFormulaComponents)) return

    try {
      setIsPosting(true)
      let success = 0

      for (const [index, c] of editingFormulaComponents.entries()) {
        try {
          await axios.post('/Admin/Box/boxFormulaComponents', {
            box_model_id: editingItem.id,
            target: c.target,
            source: c.source,
            multiplier: c.multiplier.toString(),
            allowance_mm: c.allowance_mm?.toString() || '0',
            sort_order: c.sort_order?.toString() || (index + 1).toString()
          })
          success++
        } catch (err: unknown) {
          console.error(`Error komponen ${index + 1}:`, err)
        }
      }

      if (success > 0) {
        await Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: `${success} komponen berhasil disimpan!`, 
          timer: 1500,
          showConfirmButton: false
        })
        await refetch()
        setShowFormulaModal(false)
        setEditingItem(null)
        setEditingFormulaComponents([])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan formula'
      Swal.fire({ 
        icon: 'error', 
        title: 'Error!', 
        text: msg,
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!'
    })

    if (result.isConfirmed) {
      try {
        const { data } = await axios.delete<ApiResponse>(`/Admin/Box/boxModelsDel/${id}`)
        if (data?.status === 200) {
          await Swal.fire({ 
            icon: 'success', 
            title: 'Dihapus!', 
            text: `"${name}" berhasil dihapus!`, 
            timer: 1500,
            showConfirmButton: false
          })
          await refetch()
        }
      } catch (err: unknown) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error!', 
          text: getErrMsg(err, 'Gagal menghapus data'),
          confirmButtonColor: '#3b82f6'
        })
      }
    }
  }


  // ===== FORMULA HANDLERS =====
  const addFormulaComponent = useCallback((target: 'edit' | 'new' = 'new') => {
    const newComponent = (): FormulaComponent => ({
      id: `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      box_model_id: editingItem?.id || '',
      target: 'panjang',
      source: 'P',
      multiplier: 0,
      allowance_mm: 0,
      sort_order: 1
    })

    if (target === 'new') {
      setEditingFormulaComponents(prev => [...prev, { ...newComponent(), sort_order: prev.length + 1 }])
    } else if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        formulaComponents: [...(prev.formulaComponents || []), { ...newComponent(), sort_order: (prev.formulaComponents?.length || 0) + 1 }]
      } : prev)
    }
  }, [editingItem])

  const updateFormulaComponent = useCallback((target: 'edit' | 'new', index: number, field: keyof FormulaComponent, value: string | number) => {
    const parseValue = (f: string, val: string | number): string | number => {
      if (f === 'multiplier' || f === 'allowance_mm') return parseFloat(val as string) || 0
      if (f === 'sort_order') return parseInt(val as string) || 1
      return val
    }

    if (target === 'new') {
      setEditingFormulaComponents(prev => prev.map((item, i) =>
        i === index ? { ...item, [field]: parseValue(field, value) } : item
      ))
    } else if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        formulaComponents: (prev.formulaComponents || []).map((item, i) =>
          i === index ? { ...item, [field]: parseValue(field, value) } : item
        )
      } : prev)
    }
  }, [editingItem])

  const removeFormulaComponent = useCallback((target: 'edit' | 'new', index: number) => {
    if (target === 'new') {
      setEditingFormulaComponents(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i + 1 })))
    } else if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        formulaComponents: (prev.formulaComponents || []).filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i + 1 }))
      } : prev)
    }
  }, [editingItem])

  const handleViewClick = (item: BoxModel) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = useCallback(async (item: BoxModel) => {
    try {
      const { data } = await axios.get<FormulaApiResponse>(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`)
      const components = processFormulaResponse(data)
      setEditingItem({ 
        ...item, 
        status_bm: item.status ? '1' : '0', 
        formulaComponents: components, 
        hasFormula: components.length > 0 
      })
    } catch {
      setEditingItem({ 
        ...item, 
        status_bm: item.status ? '1' : '0', 
        formulaComponents: [], 
        hasFormula: false 
      })
    }
    setShowViewModal(false)
    setShowEditModal(true)
  }, [])

  const handleFormulaClick = useCallback(async (item: BoxModel) => {
    try {
      const { data } = await axios.get<FormulaApiResponse>(`/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`)
      const hasFormula = data?.status === 200 && data.data?.formula &&
        (Array.isArray(data.data.formula) ? data.data.formula.length > 0 : true)

      if (hasFormula) {
        const result = await Swal.fire({
          icon: 'info',
          title: 'Formula Sudah Ada',
          text: 'Gunakan menu Edit untuk mengubah formula.',
          showCancelButton: true,
          confirmButtonText: 'Edit Model',
          confirmButtonColor: '#3b82f6'
        })
        if (result.isConfirmed) handleEditClick(item)
      } else {
        setEditingItem(item)
        setEditingFormulaComponents([])
        setShowFormulaModal(true)
      }
    } catch {
      setEditingItem(item)
      setEditingFormulaComponents([])
      setShowFormulaModal(true)
    }
  }, [handleEditClick])

  // ===== RENDER =====
  if (loading) return <LoadingState message="Memuat data Box Models..." submessage="Harap tunggu sebentar" icon="mdi:package-variant-closed" />


  const maxFormulaCount = Math.max(...boxModels.map(m => m.formulaComponents.length), 0)

  // ===== FORMULA COMPONENT FORM =====
  const FormulaComponentForm = ({
    component, index, target, onUpdate, onRemove, disabled
  }: {
    component: FormulaComponent
    index: number
    target: 'edit' | 'new'
    onUpdate: (field: keyof FormulaComponent, value: string | number) => void
    onRemove: () => void
    disabled: boolean
  }) => (
    <Card key={component.id} shadow="sm" padding="md" className="border-l-4 border-l-blue-500">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold text-gray-500">Komponen #{index + 1}</span>
        <Button
          onClick={onRemove}
          disabled={disabled}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Icon icon="mdi:delete-outline" className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Select
          label="Target"
          value={component.target}
          onChange={(e) => onUpdate('target', e.target.value)}
          options={TARGET_OPTIONS}
          disabled={disabled}
        />
        <Select
          label="Source"
          value={component.source}
          onChange={(e) => onUpdate('source', e.target.value)}
          options={SOURCE_OPTIONS}
          disabled={disabled}
        />
        <Input
          label="Multiplier"
          type="number"
          step="0.1"
          value={component.multiplier}
          onChange={(e) => onUpdate('multiplier', e.target.value)}
          placeholder="0"
          disabled={disabled}
        />
        <Input
          label="Allowance (mm)"
          type="number"
          value={component.allowance_mm || ''}
          onChange={(e) => onUpdate('allowance_mm', e.target.value)}
          placeholder="0"
          step="0.1"
          disabled={disabled}
        />
        <Input
          label="Sort Order"
          type="number"
          value={component.sort_order || index + 1}
          onChange={(e) => onUpdate('sort_order', e.target.value)}
          min="1"
          disabled={disabled}
        />
      </div>

      <div className="mt-3 p-2 bg-slate-50 rounded-lg">
        <p className="text-xs text-gray-500">
          Formula: <span className="font-mono font-medium text-blue-600">
            {component.source} × {component.multiplier}
            {component.allowance_mm ? ` + ${component.allowance_mm}mm` : ''}
          </span>
        </p>
      </div>
    </Card>
  )

  const FormulaLegend = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-gray-200">
      {[
        ['P', 'Panjang (cm)'], ['L', 'Lebar (cm)'], ['T', 'Tinggi (cm)'],
        ['A', 'P ×10 (mm)'], ['B', 'L ×10 (mm)'], ['C', 'T ×10 (mm)']
      ].map(([code, label]) => (
        <div key={code} className="flex items-center gap-1.5">
          <span className="font-mono bg-white px-2 py-0.5 rounded text-xs font-bold text-blue-600 border border-blue-200">
            {code}
          </span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
            <Icon icon="mdi:package-variant-closed" className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Box Models</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola model kotak dan rumus perhitungan dimensi</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setAddFormData({ ...BASE_ADD_FORM, code: generateCode(boxModels.map(m => m.kode)) })
            setShowAddModal(true)
          }}
          variant="primary"
          size="md"
          icon="mdi:plus"
        >
          Tambah Model Baru
        </Button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: 'mdi:package-variant-closed',
            label: 'Total Model',
            value: stats.totalModels,
            sub: `${stats.activeModels} aktif · ${stats.totalModels - stats.activeModels} nonaktif`,
          },
          {
            icon: 'mdi:calculator',
            label: 'Dengan Formula',
            value: stats.withFormulas,
            sub: `${stats.withoutFormulas} belum memiliki formula`,
            bar: (stats.withFormulas / stats.totalModels) * 100 || 0,
          },
          {
            icon: 'mdi:chart-pie',
            label: 'Kategori',
            value: stats.mailerBoxCount,
            sub: `Mailer: ${stats.mailerBoxCount} · Shoe: ${stats.shoeBoxCount}`,
          },
          {
            icon: 'mdi:format-list-numbered',
            label: 'Rata-rata Komponen',
            value: (stats.withFormulas ? (boxModels.reduce((acc, m) => acc + m.formulaComponents.length, 0) / stats.withFormulas).toFixed(1) : '0') + '/model',
            sub: `Maks: ${maxFormulaCount} komponen`,
            bar: maxFormulaCount > 0 ? (boxModels.reduce((acc, m) => acc + m.formulaComponents.length, 0) / boxModels.length / maxFormulaCount) * 100 : 0,
          },
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
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${s.bar}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ===== TABLE ===== */}
      <Card shadow="md" padding="none">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Daftar Box Models</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Total {stats.totalModels} model ({stats.withFormulas} dengan formula, {stats.withoutFormulas} tanpa formula)
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {boxModels.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Icon icon="mdi:package-variant-closed-off" className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Belum ada data box model</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Model', 'Kategori','Formula', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Icon icon="mdi:package-variant-closed-off" className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">Tidak ada hasil</p>
                        <p className="text-sm text-gray-400">Tidak ditemukan dengan kata kunci &ldquo;{search}&rdquo;</p>
                        <Button variant="ghost" size="sm" onClick={() => setSearch('')} icon="mdi:close">
                          Hapus Pencarian
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((model) => {
                    const meta = BOX_META[model.category] || DEFAULT_META
                    const componentCount = model.formulaComponents.length
                    const maxPossible = maxFormulaCount || 1
                    const pct = (componentCount / maxPossible) * 100

                    return (
                      <tr key={model.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Model */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}15` }}>
                              <Icon icon={meta.icon} className="w-5 h-5" style={{ color: meta.accent }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{model.namaModel}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{model.kode}</p>
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-6 py-4">
                          <Badge color={meta.accent}>{model.category}</Badge>
                        </td>
                        {/* Formula */}
                        <td className="px-6 py-4">
                          <Badge color={model.hasFormula ? '#10b981' : '#f59e0b'}>
                            {model.hasFormula ? '✓ Sudah Ada Formula' : '✗ Tidak Ada Formula'}
                          </Badge>
                          {model.hasFormula && (
                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={formatFormula(model.formulaComponents)}>
                              {formatFormula(model.formulaComponents)}
                            </p>
                          )}
                        </td>
                        {/* Aksi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewClick(model)}
                              title="Lihat Detail"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                            </button>
                            {!model.hasFormula && (
                              <button
                                onClick={() => handleFormulaClick(model)}
                                title="Tambah Formula"
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <Icon icon="mdi:calculator" className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(model)}
                              title="Edit"
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(model.id, model.namaModel)}
                              title="Hapus"
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Icon icon="mdi:delete-outline" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-slate-700">{filtered.length}</span> dari{' '}
              <span className="font-medium text-slate-700">{boxModels.length}</span> box model
            </p>
          </div>
        )}
      </Card>

      {/* ===== ADD MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !isPosting && setShowAddModal(false)}
        title="Tambah Box Model Baru"
        size="md"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => !isPosting && setShowAddModal(false)}
              disabled={isPosting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAdd}
              loading={isPosting}
              disabled={isPosting}
              icon="mdi:check"
            >
              Simpan Model
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Kode akan digenerate otomatis. Isi semua field yang diperlukan.
            </p>
          </div>

          <Input
            label="Kode Model"
            value={addFormData.code}
            disabled
            leftIcon="mdi:tag"
            helperText="Kode otomatis"
          />

          <Input
            label="Nama Model"
            value={addFormData.name}
            onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
            placeholder="Contoh: Mailer Box 30x20x15"
            required
            leftIcon="mdi:format-title"
          />

          <Select
            label="Kategori"
            value={addFormData.category}
            onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
            options={CATEGORY_OPTIONS}
            leftIcon="mdi:shape"
          />

          <TextArea
            label="Deskripsi Model"
            value={addFormData.description}
            onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
            rows={3}
            placeholder="Deskripsikan model kotak ini..."
            required
          />
        </div>
      </Modal>

      {/* ===== VIEW MODAL ===== */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Box Model"
        size="md"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setShowViewModal(false)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              size="md"
              icon="mdi:pencil-outline"
              onClick={() => selectedItem && handleEditClick(selectedItem)}
            >
              Edit Model
            </Button>
          </>
        }
      >
        {selectedItem && (() => {
          const meta = BOX_META[selectedItem.category] || DEFAULT_META
          return (
            <div className="space-y-4">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${meta.accent}0d` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.accent}20` }}>
                  <Icon icon={meta.icon} className="w-7 h-7" style={{ color: meta.accent }} />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">{selectedItem.namaModel}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={meta.accent}>{selectedItem.category}</Badge>
                    <span className="text-xs text-gray-400 font-mono">{selectedItem.kode}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <Card shadow="none" padding="sm" bordered>
                <p className="text-xs text-gray-500 mb-1">Deskripsi</p>
                <p className="text-sm text-slate-700">{selectedItem.deskripsi || '—'}</p>
              </Card>

              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-3">
               
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-1">Formula</p>
                  <Badge color={selectedItem.hasFormula ? '#10b981' : '#f59e0b'}>
                    {selectedItem.hasFormula ? '✓ Ada' : '✗ Belum'}
                  </Badge>
                </Card>
              </div>

              {/* Formula Detail */}
              {selectedItem.hasFormula && (
                <Card shadow="none" padding="sm" bordered>
                  <p className="text-xs text-gray-500 mb-2">Rumus Perhitungan</p>
                  <div className="space-y-2">
                    {selectedItem.formulaComponents.map((comp, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                        <span className="text-xs font-semibold text-gray-500 w-16">{comp.target}:</span>
                        <span className="text-xs font-mono text-blue-600">
                          {comp.source} × {comp.multiplier}
                          {comp.allowance_mm ? ` + ${comp.allowance_mm}mm` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Dibuat</p>
                  <p className="text-sm text-slate-700">
                    {new Date(selectedItem.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Diperbarui</p>
                  <p className="text-sm text-slate-700">
                    {new Date(selectedItem.updatedAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ===== EDIT MODAL ===== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !isPosting && setShowEditModal(false)}
        title={`Edit Data — ${editingItem?.namaModel}`}
        size="full"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => !isPosting && setShowEditModal(false)}
              disabled={isPosting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleEdit}
              loading={isPosting}
              disabled={isPosting}
              icon="mdi:check"
            >
              Simpan Perubahan
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Informasi Dasar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Kode"
                  value={editingItem.kode}
                  disabled
                  leftIcon="mdi:tag"
                />
                <Input
                  label="Nama Model"
                  value={editingItem.namaModel}
                  onChange={(e) => setEditingItem({ ...editingItem, namaModel: e.target.value })}
                  required
                  disabled={isPosting}
                  leftIcon="mdi:format-title"
                />
              </div>
              <div className="mt-4">
                <Select
                  label="Kategori"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  options={CATEGORY_OPTIONS}
                  disabled={isPosting}
                  leftIcon="mdi:shape"
                />
              </div>
              <div className="mt-4">
                <TextArea
                  label="Deskripsi"
                  value={editingItem.deskripsi || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })}
                  rows={3}
                  fullWidth
                  disabled={isPosting}
                  required
                />
              </div>
            </div>

            {/* Formula Components */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Formula Components</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Kelola rumus perhitungan dimensi box</p>
                </div>
                <Button
                  type="button"
                  onClick={() => addFormulaComponent('edit')}
                  variant="success"
                  size="sm"
                  disabled={isPosting}
                  icon="mdi:plus"
                >
                  Tambah
                </Button>
              </div>

              <FormulaLegend />

              <div className="space-y-3 mt-4">
                {editingItem.formulaComponents?.length ? (
                  editingItem.formulaComponents.map((comp, i) => (
                    <FormulaComponentForm
                      key={comp.id || i}
                      component={comp}
                      index={i}
                      target="edit"
                      onUpdate={(field, value) => updateFormulaComponent('edit', i, field, value)}
                      onRemove={() => removeFormulaComponent('edit', i)}
                      disabled={isPosting}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed">
                    <Icon icon="mdi:calculator-off" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Belum ada formula components</p>
                    <Button variant="primary" onClick={() => addFormulaComponent('edit')} disabled={isPosting} icon="mdi:plus" size="sm">
                      Tambah Component Pertama
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== FORMULA MODAL ===== */}
      <Modal
        isOpen={showFormulaModal}
        onClose={() => !isPosting && setShowFormulaModal(false)} 
        title="➕ Tambah Formula"
        size="full"
        closeOnOverlayClick={!isPosting}
        footer={
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={() => !isPosting && setShowFormulaModal(false)}
              disabled={isPosting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleFormulaSave}
              loading={isPosting}
              disabled={isPosting}
              icon="mdi:check"
            >
              Simpan Formula
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            {/* Info */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:information-outline" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Menambahkan Formula Baru</p>
                <p className="text-xs text-blue-600 mt-1">
                  Box Model: <span className="font-semibold">{editingItem.namaModel}</span> (Kode: {editingItem.kode})
                </p>
              </div>
            </div>

            <FormulaLegend />

            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold text-slate-700">Formula Components</h4>
                <Button
                  type="button"
                  onClick={() => addFormulaComponent('new')}
                  variant="success"
                  size="sm"
                  disabled={isPosting}
                  icon="mdi:plus"
                >
                  Tambah
                </Button>
              </div>

              <div className="space-y-3">
                {editingFormulaComponents.map((comp, i) => (
                  <FormulaComponentForm
                    key={comp.id}
                    component={comp}
                    index={i}
                    target="new"
                    onUpdate={(field, value) => updateFormulaComponent('new', i, field, value)}
                    onRemove={() => removeFormulaComponent('new', i)}
                    disabled={isPosting}
                  />
                ))}

                {!editingFormulaComponents.length && (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed">
                    <Icon icon="mdi:calculator-off" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Belum ada formula components</p>
                    <Button variant="primary" onClick={() => addFormulaComponent('new')} disabled={isPosting} icon="mdi:plus" size="sm">
                      Tambah Component Pertama
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}