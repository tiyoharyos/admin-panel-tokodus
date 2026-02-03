'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import Input from '@/components/UI/Input'
import Select from '@/components/UI/Select'
import Modal from '@/components/UI/Modal'
import CustomIcon from '@/components/UI/Icon'
import SweetAlert from '@/components/UI/SweetAlert'

// ===== TYPE DEFINITIONS =====
interface Flute {
  id: string
  code: string
  name: string
  description: string
}

interface SheetSubstance {
  id: string
  no: string
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  layer_3: string
  layer_3_type: string
  substance_code: string
  created_at: string
  updated_at: string
  [key: string]: any // dynamic flute price fields
}

interface SheetIndex {
  id: string
  substance_id: string
  substance_code: string
  flute_codes: string[]
  price_per_m2: number
  minimal_qty: number
  created_at: string
  updated_at: string
}

// ===== TYPE BARU UNTUK ADD INDEX =====
interface AddIndexFormData {
  substance_id: string
  flute_codes: string[] // Array untuk multiple flutes
  price_per_m2: string
  minimal_qty: string
}

interface AddIndexFormErrors {
  [key: string]: string
}

interface FormData {
  layer_1: string
  layer_1_type: string
  layer_2: string
  layer_2_type: string
  layer_3: string
  layer_3_type: string
  substance_code: string
  [key: string]: any // dynamic flute price fields
}

interface FormErrors {
  [key: string]: string
}

interface Stats {
  totalSubstances: number
  activeSubstances: number
  withAllFlutes: number
}

interface IndexStats {
  totalIndexes: number
  activeIndexes: number
  avgPrice: number
}

// ===== BASE FORM TEMPLATE =====
const BASE_FORM: FormData = {
  layer_1: '',
  layer_1_type: 'K',
  layer_2: '',
  layer_2_type: 'M',
  layer_3: '',
  layer_3_type: 'M',
  substance_code: ''
}

// ===== BASE INDEX FORM TEMPLATE =====
const BASE_INDEX_FORM: AddIndexFormData = {
  substance_id: '',
  flute_codes: [],
  price_per_m2: '',
  minimal_qty: '1'
}

// ===== CUSTOM NUMBER INPUT COMPONENT =====
const CustomNumberInput = ({
  value,
  onChange,
  placeholder = '',
  min = '1',
  required = false,
  disabled = false,
  error = '',
  prefix = '',
  className = '',
  onEnterPress,
}: {
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  min?: string
  required?: boolean
  disabled?: boolean
  error?: string
  prefix?: string
  className?: string
  onEnterPress?: () => void
}) => {
  const [internalValue, setInternalValue] = useState(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInternalValue(value.toString())
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const filteredValue = newValue.replace(/[^\d.]/g, '')
    const parts = filteredValue.split('.')
    
    if (parts.length > 2) {
      const cleanedValue = parts[0] + '.' + parts.slice(1).join('')
      setInternalValue(cleanedValue)
    } else {
      setInternalValue(filteredValue)
    }
  }

  const handleBlur = () => {
    if (internalValue.trim() === '') {
      onChange('')
    } else {
      const numValue = parseFloat(internalValue)
      if (!isNaN(numValue) && numValue >= parseFloat(min)) {
        onChange(internalValue)
      } else {
        setInternalValue(value.toString())
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
      onEnterPress?.()
      const inputs = document.querySelectorAll('input[type="text"]')
      const currentIndex = Array.from(inputs).indexOf(e.currentTarget)
      if (currentIndex < inputs.length - 1) {
        (inputs[currentIndex + 1] as HTMLInputElement).focus()
        ;(inputs[currentIndex + 1] as HTMLInputElement).select()
      }
    }
  }

  const handleClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
      setTimeout(() => {
        inputRef.current?.select()
      }, 0)
    }
  }

  return (
    <div className="relative">
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">{prefix}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-lg
          ${prefix ? 'pl-10' : 'pl-3'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white cursor-text'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${className}
        `}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

export default function SheetSettingsPage() {
  const router = useRouter()

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState<'substance' | 'index'>('substance')

  // ===== STATE =====
  const [sheetSubstances, setSheetSubstances] = useState<SheetSubstance[]>([])
  const [sheetIndexes, setSheetIndexes] = useState<SheetIndex[]>([])
  const [flutes, setFlutes] = useState<Flute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingItem, setEditingItem] = useState<SheetSubstance | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailItem, setDetailItem] = useState<SheetIndex | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [addFormData, setAddFormData] = useState<FormData>({ ...BASE_FORM })
  const [editFormData, setEditFormData] = useState<FormData>({ ...BASE_FORM })

  // ===== STATE BARU UNTUK MANUAL ADD INDEX =====
  const [showAddIndexModal, setShowAddIndexModal] = useState(false)
  const [addIndexFormData, setAddIndexFormData] = useState<AddIndexFormData>({ ...BASE_INDEX_FORM })
  const [addIndexFormErrors, setAddIndexFormErrors] = useState<AddIndexFormErrors>({})
  const [isPostingIndex, setIsPostingIndex] = useState(false)

  const [stats, setStats] = useState<Stats>({
    totalSubstances: 0,
    activeSubstances: 0,
    withAllFlutes: 0
  })

  const [indexStats, setIndexStats] = useState<IndexStats>({
    totalIndexes: 0,
    activeIndexes: 0,
    avgPrice: 0
  })

  // ===== UTILITY: Build form data dengan flute price fields =====
  const buildFormWithFlutePrices = (
    baseData: FormData,
    fluteList: Flute[],
    existingPrices: Record<string, any> = {}
  ): FormData => {
    const result: FormData = { ...baseData }
    fluteList.forEach((flute) => {
      const priceField = `${flute.code.toLowerCase()}_flute_price`
      result[priceField] =
        existingPrices[priceField] !== undefined && existingPrices[priceField] !== null
          ? existingPrices[priceField].toString()
          : ''
    })
    return result
  }

  // ===== FETCH FLUTES =====
  const fetchFlutes = useCallback(async (): Promise<Flute[]> => {
    try {
      const response = await axios.get('/Admin/Flutes/Flutes', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      let processedFlutes: Flute[] = []

      if (
        response.data &&
        response.data.status === 200 &&
        Array.isArray(response.data.data)
      ) {
        processedFlutes = response.data.data.map((flute: any) => ({
          id: flute.id_f?.toString() || '',
          code: flute.code || '',
          name: flute.name || '',
          description: flute.description || ''
        }))
      } else if (Array.isArray(response.data)) {
        processedFlutes = response.data.map((flute: any) => ({
          id: flute.id_f?.toString() || '',
          code: flute.code || '',
          name: flute.name || '',
          description: flute.description || ''
        }))
      } else {
        console.warn('Format response flute tidak sesuai:', response.data)
      }

      setFlutes(processedFlutes)
      return processedFlutes
    } catch (err) {
      console.error('❌ Error fetching flutes:', err)
      setFlutes([])
      return []
    }
  }, [])

  // ===== FETCH SHEET SUBSTANCES =====
  const fetchSheetSubstances = useCallback(
    async (fluteList: Flute[]) => {
      try {
        setLoading(true)
        setError(null)

        const response = await axios.get('/Admin/Sheet/sheetSubstances', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })

        if (response.data && response.data.status === 200) {
          if (Array.isArray(response.data.data)) {
            const processedSubstances: SheetSubstance[] = response.data.data.map(
              (item: any) => {
                const substance: SheetSubstance = {
                  id: item.id?.toString() || '',
                  no: item.no?.toString() || '',
                  layer_1: item.layer_1 || '',
                  layer_1_type: item.layer_1_type || 'K',
                  layer_2: item.layer_2 || '',
                  layer_2_type: item.layer_2_type || 'M',
                  layer_3: item.layer_3 || '',
                  layer_3_type: item.layer_3_type || 'M',
                  substance_code: item.substance_code || '',
                  created_at: item.created_at || '',
                  updated_at: item.updated_at || ''
                }

                fluteList.forEach((flute) => {
                  const priceField = `${flute.code.toLowerCase()}_flute_price`
                  substance[priceField] = parseFloat(item[priceField]) || 0
                })

                return substance
              }
            )

            setSheetSubstances(processedSubstances)

            const totalSubstances = processedSubstances.length
            const withAllFlutes = processedSubstances.filter((substance) => {
              return fluteList.every((flute) => {
                const priceField = `${flute.code.toLowerCase()}_flute_price`
                return substance[priceField] > 0
              })
            }).length

            setStats({
              totalSubstances,
              activeSubstances: totalSubstances,
              withAllFlutes
            })
          } else {
            setSheetSubstances([])
            setStats({ totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0 })
          }
        } else {
          setSheetSubstances([])
          setStats({ totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0 })
          setError(response.data?.message || 'Format response tidak sesuai')
        }
      } catch (err: any) {
        console.error('❌ Error fetching sheet substances:', err)
        setSheetSubstances([])
        setStats({ totalSubstances: 0, activeSubstances: 0, withAllFlutes: 0 })
        setError(
          err.response?.data?.message || 'Tidak bisa connect ke server'
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ===== FETCH SHEET INDEXES =====
  const fetchSheetIndexes = useCallback(async () => {
    try {
      const response = await axios.get('/Admin/Sheet/sheetIndex', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      if (response.data && response.data.status === 200) {
        if (Array.isArray(response.data.data)) {
          const processedIndexes: SheetIndex[] = response.data.data.map(
            (item: any) => ({
              id: item.id?.toString() || '',
              substance_id: item.substance_id?.toString() || '',
              substance_code: item.substance_code || '',
              flute_codes: item.flutes ? item.flutes.split(',') : [],
              price_per_m2: parseFloat(item.price_per_m2) || 0,
              minimal_qty: parseInt(item.minimal_qty) || 1,
              created_at: item.created_at || '',
              updated_at: item.updated_at || ''
            })
          )

          setSheetIndexes(processedIndexes)

          const totalIndexes = processedIndexes.length
          const totalPrice = processedIndexes.reduce(
            (sum, item) => sum + item.price_per_m2,
            0
          )
          const avgPrice = totalIndexes > 0 ? totalPrice / totalIndexes : 0

          setIndexStats({
            totalIndexes,
            activeIndexes: totalIndexes,
            avgPrice
          })
        } else {
          setSheetIndexes([])
          setIndexStats({ totalIndexes: 0, activeIndexes: 0, avgPrice: 0 })
        }
      } else {
        setSheetIndexes([])
        setIndexStats({ totalIndexes: 0, activeIndexes: 0, avgPrice: 0 })
      }
    } catch (err: any) {
      console.error('❌ Error fetching sheet indexes:', err)
      setSheetIndexes([])
      setIndexStats({ totalIndexes: 0, activeIndexes: 0, avgPrice: 0 })
    }
  }, [])

  // ===== FETCH SHEET INDEX BY ID =====
  const fetchSheetIndexById = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`/Admin/Sheet/sheetIndexById/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })

      if (response.data && response.data.status === 200 && response.data.data) {
        const item = response.data.data
        const detailData: SheetIndex = {
          id: item.id?.toString() || '',
          substance_id: item.substance_id?.toString() || '',
          substance_code: item.substance_code || '',
          flute_codes: item.flutes ? item.flutes.split(',') : [],
          price_per_m2: parseFloat(item.price_per_m2) || 0,
          minimal_qty: parseInt(item.minimal_qty) || 1,
          created_at: item.created_at || '',
          updated_at: item.updated_at || ''
        }
        setDetailItem(detailData)
        setShowDetailModal(true)
      } else {
        SweetAlert.error('Error', 'Data tidak ditemukan')
      }
    } catch (err: any) {
      console.error('❌ Error fetching sheet index by ID:', err)
      SweetAlert.error(
        'Error',
        err.response?.data?.message || 'Gagal mengambil detail data'
      )
    }
  }, [])

  // ===== INITIAL LOAD =====
  useEffect(() => {
    const init = async () => {
      const latestFlutes = await fetchFlutes()
      await fetchSheetSubstances(latestFlutes)
      await fetchSheetIndexes()
    }
    init()
  }, [fetchFlutes, fetchSheetSubstances, fetchSheetIndexes])

  // ===== PREVENT SCROLL WHEN MODAL IS OPEN =====
  useEffect(() => {
    if (showAddModal || showEditModal || showDetailModal || showAddIndexModal) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [showAddModal, showEditModal, showDetailModal, showAddIndexModal])

  // ===== FOCUS FIRST INPUT IN MODAL =====
  useEffect(() => {
    if (showAddModal || showEditModal || showAddIndexModal) {
      const timer = setTimeout(() => {
        const modal = document.querySelector('.modal-content')
        if (modal) {
          const firstInput = modal.querySelector('input:not(:disabled), select:not(:disabled)') as HTMLElement
          if (firstInput) {
            firstInput.focus({ preventScroll: true })
          }
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [showAddModal, showEditModal, showAddIndexModal])

  // ===== GENERATE SUBSTANCE CODE =====
  const generateSubstanceCode = (data: FormData): string => {
    if (!data.layer_1 || !data.layer_2 || !data.layer_3) return ''
    return `${data.layer_1}${data.layer_1_type}/${data.layer_2}${data.layer_2_type}/${data.layer_3}${data.layer_3_type}`
  }

  // ===== VALIDASI SUBSTANCE =====
  const validateForm = (formData: FormData, fluteList: Flute[]): FormErrors => {
    const errors: FormErrors = {}

    const layerFields = ['layer_1', 'layer_2', 'layer_3']
    layerFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = 'Gramasi tidak boleh kosong'
      } else if (
        isNaN(parseFloat(formData[field])) ||
        parseFloat(formData[field]) <= 0
      ) {
        errors[field] = 'Gramasi harus angka lebih dari 0'
      }
    })

    fluteList.forEach((flute) => {
      const field = `${flute.code.toLowerCase()}_flute_price`
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = `Harga ${flute.code}-Flute tidak boleh kosong`
      } else if (isNaN(parseFloat(formData[field]))) {
        errors[field] = `Harga ${flute.code}-Flute harus berupa angka`
      } else if (parseFloat(formData[field]) <= 0) {
        errors[field] = `Harga ${flute.code}-Flute harus lebih dari 0`
      }
    })

    return errors
  }

  // ===== VALIDASI ADD INDEX =====
  const validateAddIndexForm = (formData: AddIndexFormData): AddIndexFormErrors => {
    const errors: AddIndexFormErrors = {}

    if (!formData.substance_id || formData.substance_id.trim() === '') {
      errors.substance_id = 'Pilih substance terlebih dahulu'
    }

    if (formData.flute_codes.length === 0) {
      errors.flute_codes = 'Pilih minimal satu flute'
    }

    if (!formData.price_per_m2 || formData.price_per_m2.trim() === '') {
      errors.price_per_m2 = 'Harga per M² tidak boleh kosong'
    } else if (isNaN(parseFloat(formData.price_per_m2))) {
      errors.price_per_m2 = 'Harga harus berupa angka'
    } else if (parseFloat(formData.price_per_m2) <= 0) {
      errors.price_per_m2 = 'Harga harus lebih dari 0'
    }

    if (!formData.minimal_qty || formData.minimal_qty.trim() === '') {
      errors.minimal_qty = 'Minimal quantity tidak boleh kosong'
    } else if (isNaN(parseInt(formData.minimal_qty))) {
      errors.minimal_qty = 'Minimal quantity harus berupa angka'
    } else if (parseInt(formData.minimal_qty) <= 0) {
      errors.minimal_qty = 'Minimal quantity harus lebih dari 0'
    }

    return errors
  }

  // ===== RESET =====
  const resetAddState = () => {
    setAddFormData({ ...BASE_FORM })
    setFormErrors({})
  }

  const resetEditState = () => {
    setEditingItem(null)
    setEditFormData({ ...BASE_FORM })
    setFormErrors({})
  }

  // ===== RESET ADD INDEX =====
  const resetAddIndexState = () => {
    setAddIndexFormData({ ...BASE_INDEX_FORM })
    setAddIndexFormErrors({})
  }

  // ===== HANDLER: OPEN ADD MODAL =====
  const handleAddClick = async () => {
    resetAddState()
    const latestFlutes = await fetchFlutes()
    const initializedData = buildFormWithFlutePrices(
      { ...BASE_FORM },
      latestFlutes
    )
    setAddFormData(initializedData)
    setShowAddModal(true)
  }

  // ===== HANDLER: SAVE ADD =====
  const handleAddSave = async () => {
    if (flutes.length === 0) {
      SweetAlert.error(
        'Error',
        'Tidak ada data flute tersedia. Harap tambahkan flute terlebih dahulu di halaman Flutes.'
      )
      return
    }

    const errors = validateForm(addFormData, flutes)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPosting(true)
      setFormErrors({})

      const substanceCode = generateSubstanceCode(addFormData)

      const postData: Record<string, any> = {
        layer_1: addFormData.layer_1.trim(),
        layer_1_type: addFormData.layer_1_type.trim(),
        layer_2: addFormData.layer_2.trim(),
        layer_2_type: addFormData.layer_2_type.trim(),
        layer_3: addFormData.layer_3.trim(),
        layer_3_type: addFormData.layer_3_type.trim(),
        substance_code: substanceCode
      }

      flutes.forEach((flute) => {
        const priceField = `${flute.code.toLowerCase()}_flute_price`
        postData[priceField] = parseFloat(addFormData[priceField])
      })

      const response = await axios.post(
        '/Admin/Sheet/sheetSubstancesAdd',
        postData,
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      )

      if (response.data && response.data.status === 200) {
        SweetAlert.success('Berhasil!', 'Sheet substance berhasil ditambahkan!')
        setShowAddModal(false)
        resetAddState()
        await fetchSheetSubstances(flutes)
        await fetchSheetIndexes() // Refresh index juga
      } else {
        SweetAlert.error(
          'Gagal!',
          response.data?.message || 'Gagal menambahkan sheet substance'
        )
      }
    } catch (err: any) {
      console.error('❌ Error saat POST:', err)
      if (err.response?.data) {
        const serverError = err.response.data
        let errorMsg =
          serverError.message || 'Terjadi kesalahan saat menyimpan data'
        if (
          serverError.errors &&
          typeof serverError.errors === 'object'
        ) {
          const errorList = Object.values(serverError.errors).flat()
          if (errorList.length > 0)
            errorMsg = (errorList as string[]).join('\n')
        }
        SweetAlert.error('Error Server!', errorMsg)
      } else {
        SweetAlert.error(
          'Error!',
          'Terjadi kesalahan saat menyimpan data'
        )
      }
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLER: OPEN EDIT MODAL =====
  const handleEditClick = async (item: SheetSubstance) => {
    console.log('Edit item:', item)
    const latestFlutes = await fetchFlutes()
    setEditingItem(item)
    const editData = buildFormWithFlutePrices(
      {
        layer_1: item.layer_1.toString(),
        layer_1_type: item.layer_1_type,
        layer_2: item.layer_2.toString(),
        layer_2_type: item.layer_2_type,
        layer_3: item.layer_3.toString(),
        layer_3_type: item.layer_3_type,
        substance_code: item.substance_code
      },
      latestFlutes,
      item
    )
    setEditFormData(editData)
    setFormErrors({})
    setShowEditModal(true)
  }

  // ===== HANDLER: SAVE EDIT =====
  const handleEditSave = async () => {
    if (flutes.length === 0) {
      SweetAlert.error(
        'Error',
        'Tidak ada data flute tersedia. Harap tambahkan flute terlebih dahulu di halaman Flutes.'
      )
      return
    }

    const errors = validateForm(editFormData, flutes)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPosting(true)
      setFormErrors({})

      const substanceCode = generateSubstanceCode(editFormData)

      const putData: Record<string, any> = {
        layer_1: editFormData.layer_1.toString().trim(),
        layer_1_type: editFormData.layer_1_type.toString().trim(),
        layer_2: editFormData.layer_2.toString().trim(),
        layer_2_type: editFormData.layer_2_type.toString().trim(),
        layer_3: editFormData.layer_3.toString().trim(),
        layer_3_type: editFormData.layer_3_type.toString().trim(),
        substance_code: substanceCode
      }

      flutes.forEach((flute) => {
        const priceField = `${flute.code.toLowerCase()}_flute_price`
        putData[priceField] = parseFloat(editFormData[priceField])
      })

      console.log('Sending PUT data:', putData)

      const response = await axios.put(
        `/Admin/Sheet/sheetSubstancesEdit/${editingItem!.id}`,
        putData,
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      )

      console.log('Edit response:', response.data)

      if (response.data && response.data.status === 200) {
        SweetAlert.success(
          'Berhasil!',
          'Sheet substance berhasil diperbarui!'
        )
        setShowEditModal(false)
        resetEditState()
        await fetchSheetSubstances(flutes)
        await fetchSheetIndexes() // Refresh index juga
      } else {
        SweetAlert.error(
          'Gagal!',
          response.data?.message || 'Gagal memperbarui sheet substance'
        )
      }
    } catch (err: any) {
      console.error('❌ Error saat PUT:', err)
      console.error('Error details:', err.response?.data)
      if (err.response?.data) {
        const serverError = err.response.data
        let errorMsg =
          serverError.message || 'Terjadi kesalahan saat memperbarui data'
        if (
          serverError.errors &&
          typeof serverError.errors === 'object'
        ) {
          const errorList = Object.values(serverError.errors).flat()
          if (errorList.length > 0)
            errorMsg = (errorList as string[]).join('\n')
        }
        SweetAlert.error('Error Server!', errorMsg)
      } else {
        SweetAlert.error(
          'Error!',
          'Terjadi kesalahan saat memperbarui data'
        )
      }
    } finally {
      setIsPosting(false)
    }
  }

  // ===== HANDLER: DELETE SUBSTANCE =====
  const handleDelete = async (id: string, substanceCode: string) => {
    const result = await SweetAlert.confirmDelete()

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `/Admin/Sheet/sheetSubstancesDel/${id}`,
          {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }
        )

        if (response.data && response.data.status === 200) {
          SweetAlert.success('Dihapus!', 'Sheet substance berhasil dihapus!')
          await fetchSheetSubstances(flutes)
          await fetchSheetIndexes() // Refresh index juga
        } else {
          SweetAlert.error(
            'Gagal!',
            response.data?.message || 'Gagal menghapus sheet substance'
          )
        }
      } catch (err: any) {
        console.error('❌ Error:', err)
        SweetAlert.error(
          'Error!',
          err.response?.data?.message ||
            'Terjadi kesalahan saat menghapus data'
        )
      }
    }
  }

  // ===== HANDLER: OPEN ADD INDEX MODAL =====
  const handleAddIndexClick = () => {
    if (sheetSubstances.length === 0) {
      SweetAlert.error(
        'Error',
        'Tidak ada substance tersedia. Harap tambahkan substance terlebih dahulu.'
      )
      return
    }

    if (flutes.length === 0) {
      SweetAlert.error(
        'Error',
        'Tidak ada flute tersedia. Harap tambahkan flute terlebih dahulu.'
      )
      return
    }

    resetAddIndexState()
    setShowAddIndexModal(true)
  }

  // ===== HANDLER: SAVE ADD INDEX =====
  const handleAddIndexSave = async () => {
    const errors = validateAddIndexForm(addIndexFormData)
    if (Object.keys(errors).length > 0) {
      setAddIndexFormErrors(errors)
      SweetAlert.error('Validasi Error', 'Periksa kembali data yang diisi')
      return
    }

    try {
      setIsPostingIndex(true)
      setAddIndexFormErrors({})

      // Format flute codes menjadi string dipisahkan koma
      const flutesString = addIndexFormData.flute_codes.join(',')

      const postData = {
        substance_id: addIndexFormData.substance_id,
        flutes: flutesString,
        price_per_m2: parseFloat(addIndexFormData.price_per_m2),
        minimal_qty: parseInt(addIndexFormData.minimal_qty)
      }

      console.log('POST data untuk add index:', postData)

      const response = await axios.post(
        '/Admin/Sheet/sheetIndexAdd',
        postData,
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      )

      console.log('Response add index:', response.data)

      if (response.data && response.data.status === 200) {
        SweetAlert.success('Berhasil!', 'Sheet index berhasil ditambahkan!')
        setShowAddIndexModal(false)
        resetAddIndexState()
        await fetchSheetIndexes() // Refresh index list
      } else {
        SweetAlert.error(
          'Gagal!',
          response.data?.message || 'Gagal menambahkan sheet index'
        )
      }
    } catch (err: any) {
      console.error('❌ Error saat POST index:', err)
      if (err.response?.data) {
        const serverError = err.response.data
        let errorMsg =
          serverError.message || 'Terjadi kesalahan saat menyimpan data'
        if (
          serverError.errors &&
          typeof serverError.errors === 'object'
        ) {
          const errorList = Object.values(serverError.errors).flat()
          if (errorList.length > 0)
            errorMsg = (errorList as string[]).join('\n')
        }
        SweetAlert.error('Error Server!', errorMsg)
      } else {
        SweetAlert.error(
          'Error!',
          'Terjadi kesalahan saat menyimpan data'
        )
      }
    } finally {
      setIsPostingIndex(false)
    }
  }

  // ===== HANDLER: TOGGLE FLUTE SELECTION =====
  const handleFluteToggle = (fluteCode: string) => {
    setAddIndexFormData(prev => {
      const currentFlutes = [...prev.flute_codes]
      if (currentFlutes.includes(fluteCode)) {
        // Remove if already selected
        return {
          ...prev,
          flute_codes: currentFlutes.filter(code => code !== fluteCode)
        }
      } else {
        // Add if not selected
        return {
          ...prev,
          flute_codes: [...currentFlutes, fluteCode]
        }
      }
    })

    // Clear error jika ada
    if (addIndexFormErrors.flute_codes) {
      setAddIndexFormErrors(prev => ({ ...prev, flute_codes: '' }))
    }
  }

  // ===== HANDLER: VIEW DETAIL INDEX =====
  const handleViewDetail = async (id: string) => {
    await fetchSheetIndexById(id)
  }

  // ===== HANDLER: REFRESH =====
  const handleRefreshAll = async () => {
    const latestFlutes = await fetchFlutes()
    await fetchSheetSubstances(latestFlutes)
    await fetchSheetIndexes()
  }

  // ===== MODAL CLOSE =====
  const handleCloseAddModal = () => {
    if (!isPosting) {
      setShowAddModal(false)
      resetAddState()
    }
  }

  const handleCloseEditModal = () => {
    if (!isPosting) {
      setShowEditModal(false)
      resetEditState()
    }
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setDetailItem(null)
  }

  const handleCloseAddIndexModal = () => {
    if (!isPostingIndex) {
      setShowAddIndexModal(false)
      resetAddIndexState()
    }
  }

  // ===== INPUT CHANGE =====
  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddIndexInputChange = (field: string, value: string) => {
    setAddIndexFormData((prev) => ({ ...prev, [field]: value }))
    if (addIndexFormErrors[field]) {
      setAddIndexFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // ===== MODAL FOOTERS =====
  const addModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={handleCloseAddModal}
        disabled={isPosting}
      >
        Batal
      </Button>
      <Button
        variant="primary"
        onClick={handleAddSave}
        loading={isPosting}
        disabled={isPosting}
      >
        {isPosting ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </div>
  )

  const editModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={handleCloseEditModal}
        disabled={isPosting}
      >
        Batal
      </Button>
      <Button
        variant="primary"
        onClick={handleEditSave}
        loading={isPosting}
        disabled={isPosting}
      >
        {isPosting ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Button>
    </div>
  )

  const addIndexModalFooter = (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={handleCloseAddIndexModal}
        disabled={isPostingIndex}
      >
        Batal
      </Button>
      <Button
        variant="primary"
        onClick={handleAddIndexSave}
        loading={isPostingIndex}
        disabled={isPostingIndex}
      >
        {isPostingIndex ? 'Menyimpan...' : 'Simpan Index'}
      </Button>
    </div>
  )

  // ===== UTILITY FORMATTERS =====
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatSubstanceDisplay = (item: SheetSubstance | FormData): string => {
    return `${item.layer_1}${item.layer_1_type}/${item.layer_2}${item.layer_2_type}/${item.layer_3}${item.layer_3_type}`
  }

  const getFluteBadgeVariant = (
    code: string
  ): 'primary' | 'success' | 'warning' | 'info' | 'gray' => {
    switch (code.toUpperCase()) {
      case 'B':
        return 'primary'
      case 'C':
        return 'success'
      case 'CB':
      case 'BC':
        return 'warning'
      case 'EB':
      case 'E':
        return 'info'
      default:
        return 'gray'
    }
  }

  // ===== FORM COMPONENTS =====
  const LayerFormFields = ({
    formData,
    onChange,
    errors,
    disabled
  }: {
    formData: FormData
    onChange: (field: string, value: string) => void
    errors: FormErrors
    disabled: boolean
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-800">
      {[
        { field: 'layer_1', typeField: 'layer_1_type', labelNum: '1' },
        { field: 'layer_2', typeField: 'layer_2_type', labelNum: '2' },
        { field: 'layer_3', typeField: 'layer_3_type', labelNum: '3' }
      ].map(({ field, typeField, labelNum }) => (
        <div
          key={field}
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
        >
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm mr-2">
              {labelNum}
            </span>
            Layer {labelNum}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gramasi *
              </label>
              <CustomNumberInput
                value={formData[field]}
                onChange={(value) => onChange(field, value)}
                className='text-gray-700'
                placeholder="125"
                min="1"
                required
                disabled={disabled}
                error={errors[field]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Kertas *
              </label>
              <Select
                value={formData[typeField]}
                onChange={(e: any) => onChange(typeField, e.target.value)}
                options={[
                  { value: 'K', label: 'K - Kraft (Coklat Tua)' },
                  { value: 'M', label: 'M - Medium (Coklat)' },
                  { value: 'W', label: 'W - White (Putih)' }
                ]}
                placeholder="Pilih jenis kertas"
                required
                disabled={disabled}
                error={errors[typeField]}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Badge
                variant={
                  formData[typeField] === 'K'
                    ? 'warning'
                    : formData[typeField] === 'M'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs"
              >
                {formData[field] || '125'}
                {formData[typeField]}
              </Badge>
              <span className="text-xs text-gray-500">
                {formData[typeField] === 'K'
                  ? 'Kraft'
                  : formData[typeField] === 'M'
                  ? 'Medium'
                  : 'White'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const PriceFormFields = ({
    formData,
    onChange,
    errors,
    disabled
  }: {
    formData: FormData
    onChange: (field: string, value: string) => void
    errors: FormErrors
    disabled: boolean
  }) => {
    const fluteColors: Record<string, string> = {
      B: 'text-green-600',
      C: 'text-blue-600',
      CB: 'text-purple-600',
      BC: 'text-purple-600',
      EB: 'text-orange-600',
      E: 'text-orange-600',
      A: 'text-red-600',
      F: 'text-indigo-600',
      T: 'text-teal-600'
    }

    const fluteNotes: Record<string, string> = {
      E: 'minimal 3000pcs',
      EB: 'minimal 3000pcs'
    }

    return (
      <div className="space-y-6">
        {flutes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flutes.map((flute) => {
              const field = `${flute.code.toLowerCase()}_flute_price`
              const color =
                fluteColors[flute.code.toUpperCase()] || 'text-gray-600'
              const note =
                fluteNotes[flute.code.toUpperCase()] || ''

              return (
                <div
                  key={flute.code}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {flute.name} Price *
                    </label>
                    <Badge
                      variant={getFluteBadgeVariant(flute.code)}
                      className="text-xs"
                    >
                      {flute.code}
                    </Badge>
                  </div>
                  <CustomNumberInput
                    value={formData[field] || ''}
                    onChange={(value) => onChange(field, value)}
                    placeholder="0"
                    min="1"
                    className='text-gray-700'
                    required
                    disabled={disabled}
                    error={errors[field]}
                    prefix="Rp"
                  />
                  {note && (
                    <p className="text-xs text-gray-500 mt-1">{note}</p>
                  )}
                  <div className={`text-xs font-medium mt-2 ${color}`}>
                    {formData[field]
                      ? formatCurrency(parseFloat(formData[field]) || 0)
                      : 'Rp 0'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Sheet Management
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola substance dan index sheet
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <CustomIcon
              icon="mdi:loading"
              className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4"
            />
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN UI =====
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Sheet Management
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola substance dan index sheet berdasarkan flute type
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            icon="mdi:refresh"
            onClick={handleRefreshAll}
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
            size="sm"
          >
            Refresh All
          </Button>
          <Button
            variant="outline"
            icon="mdi:open-in-new"
            onClick={() => router.push('/flute-settings')}
            className="text-blue-700 border-blue-300 hover:bg-blue-50"
            size="sm"
          >
            Kelola Flutes
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('substance')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'substance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <CustomIcon icon="mdi:layers-triple" className="w-5 h-5" />
              <span>Sheet Substances</span>
              <Badge variant="primary" className="text-xs">
                {stats.totalSubstances}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('index')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'index'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <CustomIcon icon="mdi:table-large" className="w-5 h-5" />
              <span>Sheet Index</span>
              <Badge variant="success" className="text-xs">
                {indexStats.totalIndexes}
              </Badge>
            </div>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT: SUBSTANCE */}
      {activeTab === 'substance' && (
        <>
          {/* Stats Cards - Substance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Total Substances
                  </p>
                  <CustomIcon
                    icon="mdi:layers-triple"
                    className="w-5 h-5 text-blue-500"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalSubstances}
                  </p>
                  <Badge variant="primary" className="text-sm">
                    {stats.activeSubstances} aktif
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">kombinasi bahan sheet</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-green-50 border border-green-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Complete Pricing
                  </p>
                  <CustomIcon
                    icon="mdi:currency-usd-circle"
                    className="w-5 h-5 text-green-500"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.withAllFlutes}
                  </p>
                  <Badge variant="success" className="text-sm">
                    {flutes.length} flute
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">dengan harga lengkap</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-purple-50 border border-purple-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Flute Types</p>
                  <CustomIcon
                    icon="mdi:waveform"
                    className="w-5 h-5 text-purple-500"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-gray-900">
                    {flutes.length}
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    tersedia
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {flutes.length > 0
                    ? flutes.slice(0, 3).map((f) => f.code).join(', ') +
                      (flutes.length > 3 ? ` +${flutes.length - 3}` : '')
                    : 'tidak ada flute'}
                </p>
              </div>
            </Card>
          </div>

          {/* Substances Table */}
          <Card className="border border-gray-200 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CustomIcon
                    icon="mdi:clipboard-list-outline"
                    className="text-blue-600"
                  />
                  All Sheet Substances
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.totalSubstances} kombinasi bahan sheet ({flutes.length} flute types)
                </p>
              </div>
              <Button
                onClick={handleAddClick}
                variant="primary"
                icon="mdi:plus"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={flutes.length === 0}
              >
                Tambah Substance
              </Button>
            </div>

            {sheetSubstances.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg mx-6 mb-6 bg-gray-50">
                <CustomIcon
                  icon="mdi:database-off"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada data
                </h3>
                <p className="text-gray-500 mb-6">
                  Belum ada sheet substance yang ditambahkan
                </p>
                <Button
                  onClick={handleAddClick}
                  variant="primary"
                  icon="mdi:plus"
                  className="bg-gradient-to-r from-blue-600 to-blue-700"
                  disabled={flutes.length === 0}
                >
                  {flutes.length === 0
                    ? 'Tambah Flute Terlebih Dahulu'
                    : 'Tambah Sheet Substance Pertama'}
                </Button>
                {flutes.length === 0 && (
                  <p className="text-xs text-red-600 mt-3">
                    <CustomIcon
                      icon="mdi:alert-circle"
                      className="w-4 h-4 inline mr-1"
                    />
                    Harap tambahkan flute terlebih dahulu
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Substance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Layer 1
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Layer 2
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Layer 3
                      </th>

                      {flutes.map((flute) => (
                        <th
                          key={flute.code}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {flute.code}-Flute
                        </th>
                      ))}

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sheetSubstances.map((substance, index) => (
                      <tr
                        key={substance.id}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {formatSubstanceDisplay(substance)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {substance.substance_code}
                          </div>
                        </td>
                        {['layer_1', 'layer_2', 'layer_3'].map((layer) => (
                          <td key={layer} className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  substance[`${layer}_type`] === 'K'
                                    ? 'warning'
                                    : substance[`${layer}_type`] === 'M'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {substance[layer]}
                                {substance[`${layer}_type`]}
                              </Badge>
                            </div>
                          </td>
                        ))}

                        {flutes.map((flute, idx) => {
                          const priceField = `${flute.code.toLowerCase()}_flute_price`
                          const price = substance[priceField] || 0
                          const colors = [
                            'text-green-600',
                            'text-blue-600',
                            'text-purple-600',
                            'text-orange-600',
                            'text-red-600',
                            'text-indigo-600',
                            'text-pink-600',
                            'text-teal-600'
                          ]
                          const color = colors[idx % colors.length]

                          return (
                            <td key={flute.code} className="px-6 py-4">
                              <div className={`font-medium ${color}`}>
                                {formatCurrency(price)}
                              </div>
                              {['E', 'EB'].includes(
                                flute.code.toUpperCase()
                              ) &&
                                price > 0 && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    min. 3000pcs
                                  </div>
                                )}
                            </td>
                          )
                        })}

                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(substance)}
                              className="text-blue-700 border-blue-200 hover:bg-blue-50"
                              disabled={flutes.length === 0}
                            >
                              <CustomIcon
                                icon="mdi:pencil"
                                className="w-4 h-4 mr-1"
                              />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  substance.id,
                                  substance.substance_code
                                )
                              }
                              className="text-red-700 border-red-200 hover:bg-red-50"
                            >
                              <CustomIcon
                                icon="mdi:delete"
                                className="w-4 h-4 mr-1"
                              />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-200 px-6 pb-6 gap-4">
              <div className="text-sm text-gray-500">
                Menampilkan {sheetSubstances.length} dari{' '}
                {sheetSubstances.length} substances
              </div>
              <div className="text-sm text-gray-500">
                Flute tersedia: {flutes.length} types
              </div>
            </div>
          </Card>
        </>
      )}

      {/* TAB CONTENT: INDEX */}
      {activeTab === 'index' && (
        <>
          {/* Stats Cards - Index */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Total Indexes</p>
                  <CustomIcon
                    icon="mdi:format-list-numbered"
                    className="w-5 h-5 text-blue-500"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-gray-900">
                    {indexStats.totalIndexes}
                  </p>
                  <Badge variant="primary" className="text-sm">
                    {indexStats.activeIndexes} aktif
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">kombinasi substance & flute</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-green-50 border border-green-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Avg Price/M²</p>
                  <CustomIcon
                    icon="mdi:currency-usd"
                    className="w-5 h-5 text-green-500"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(indexStats.avgPrice)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">rata-rata harga per meter</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-purple-50 border border-purple-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Available</p>
                  <CustomIcon
                    icon="mdi:package-variant"
                    className="w-5 h-5 text-purple-500"
                  />
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-lg font-bold text-gray-900">
                    {sheetSubstances.length} substances
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    {flutes.length} flutes
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">auto-generated dari substance</p>
              </div>
            </Card>
          </div>

          {/* Index Table */}
          <Card className="border border-gray-200 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-6 pt-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CustomIcon
                    icon="mdi:table-large"
                    className="text-blue-600"
                  />
                  All Sheet Indexes
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {indexStats.totalIndexes} kombinasi tersedia (Read Only)
                </p>
              </div>
              <Button
                onClick={handleAddIndexClick}
                variant="primary"
                icon="mdi:plus"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                disabled={sheetSubstances.length === 0 || flutes.length === 0}
              >
                Tambah Index
              </Button>
            </div>

            {sheetIndexes.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg mx-6 mb-6 bg-gray-50">
                <CustomIcon
                  icon="mdi:database-off"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada data
                </h3>
                <p className="text-gray-500 mb-6">
                  Belum ada sheet index. Index akan dibuat otomatis saat Anda menambahkan substance.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleAddIndexClick}
                    variant="primary"
                    icon="mdi:plus"
                    className="bg-gradient-to-r from-green-600 to-green-700"
                    disabled={sheetSubstances.length === 0 || flutes.length === 0}
                  >
                    Tambah Index Manual
                  </Button>
                  <Button
                    onClick={() => setActiveTab('substance')}
                    variant="outline"
                    icon="mdi:layers-triple"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Tambah Substance
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Substance Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Flutes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Price/M²
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Min. Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sheetIndexes.map((index, idx) => (
                      <tr
                        key={index.id}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{idx + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {index.substance_code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {index.flute_codes.map(code => (
                              <Badge
                                key={code}
                                variant={getFluteBadgeVariant(code)}
                                className="text-xs"
                              >
                                {code}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-green-600">
                            {formatCurrency(index.price_per_m2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">
                            {index.minimal_qty} pcs
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(index.id)}
                              className="text-blue-700 border-blue-200 hover:bg-blue-50"
                            >
                              <CustomIcon
                                icon="mdi:eye"
                                className="w-4 h-4 mr-1"
                              />
                              Detail
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-200 px-6 pb-6 gap-4">
              <div className="text-sm text-gray-500">
                Menampilkan {sheetIndexes.length} dari {sheetIndexes.length} indexes
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ===== MODALS ===== */}
      
      {/* MODAL ADD SUBSTANCE */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title={
          <div className="flex items-center gap-2">
            <CustomIcon
              icon="mdi:plus-circle"
              className="w-6 h-6 text-blue-600"
            />
            <span>Tambah Sheet Substance Baru</span>
          </div>
        }
        size="xl"
        footer={addModalFooter}
        className="modal-content"
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CustomIcon
                icon="mdi:layers-triple"
                className="text-blue-600"
              />
              Konfigurasi 3 Layer Substance
            </h3>

            <LayerFormFields
              formData={addFormData}
              onChange={handleAddInputChange}
              errors={formErrors}
              disabled={isPosting}
            />

            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Preview Substance Code:
              </p>
              <div className="text-lg font-bold text-blue-600 text-center p-3 bg-blue-50 rounded-lg">
                {generateSubstanceCode(addFormData) ||
                  'Isi semua gramasi untuk melihat preview'}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CustomIcon
                icon="mdi:currency-usd"
                className="text-green-600"
              />
              Harga per Meter Persegi (M²)
            </h3>

            <PriceFormFields
              formData={addFormData}
              onChange={handleAddInputChange}
              errors={formErrors}
              disabled={isPosting}
            />
          </div>

          {Object.keys(formErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <CustomIcon
                  icon="mdi:alert-circle"
                  className="w-5 h-5 text-red-600 mt-0.5 mr-2"
                />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Perbaiki data berikut:
                  </p>
                  <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                    {Object.entries(formErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL EDIT SUBSTANCE */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={
          <div className="flex items-center gap-2">
            <CustomIcon
              icon="mdi:pencil-circle"
              className="w-6 h-6 text-blue-600"
            />
            <span>Edit Sheet Substance</span>
            {editingItem && (
              <span className="text-sm text-gray-500 ml-2 font-normal">
                ({formatSubstanceDisplay(editingItem)})
              </span>
            )}
          </div>
        }
        size="xl"
        footer={editModalFooter}
        className="modal-content"
      >
        {editingItem && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-5 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon
                  icon="mdi:layers-edit"
                  className="text-blue-600"
                />
                Konfigurasi 3 Layer Substance
              </h3>

              <LayerFormFields
                formData={editFormData}
                onChange={handleEditInputChange}
                errors={formErrors}
                disabled={isPosting}
              />

              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300 shadow-sm">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Substance Code:
                </p>
                <div className="text-lg font-bold text-blue-600 text-center p-3 bg-blue-50 rounded-lg">
                  {generateSubstanceCode(editFormData)}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-green-50 p-5 rounded-xl border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon
                  icon="mdi:cash-multiple"
                  className="text-green-600"
                />
                Harga per Meter Persegi (M²)
              </h3>

              <PriceFormFields
                formData={editFormData}
                onChange={handleEditInputChange}
                errors={formErrors}
                disabled={isPosting}
              />
            </div>

            {Object.keys(formErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CustomIcon
                    icon="mdi:alert-circle"
                    className="w-5 h-5 text-red-600 mt-0.5 mr-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Perbaiki data berikut:
                    </p>
                    <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                      {Object.entries(formErrors).map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL ADD INDEX MANUAL */}
      <Modal
        isOpen={showAddIndexModal}
        onClose={handleCloseAddIndexModal}
        title={
          <div className="flex items-center gap-2">
            <CustomIcon
              icon="mdi:plus-box-multiple"
              className="w-6 h-6 text-green-600"
            />
            <span>Tambah Sheet Index Baru</span>
          </div>
        }
        size="lg"
        footer={addIndexModalFooter}
        className="modal-content"
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CustomIcon
                icon="mdi:layers-triple"
                className="text-blue-600"
              />
              Pilih Substance
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Substance *
              </label>
              <Select
                value={addIndexFormData.substance_id}
                onChange={(e: any) => handleAddIndexInputChange('substance_id', e.target.value)}
                options={[
                  { value: '', label: '-- Pilih Substance --', disabled: true },
                  ...sheetSubstances.map(substance => ({
                    value: substance.id,
                    label: `${substance.substance_code} (${substance.layer_1}${substance.layer_1_type}/${substance.layer_2}${substance.layer_2_type}/${substance.layer_3}${substance.layer_3_type})`
                  }))
                ]}
                required
                disabled={isPostingIndex}
                error={addIndexFormErrors.substance_id}
              />
            </div>

            <div className="p-4 bg-white rounded-lg border border-blue-300 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Total Substances Tersedia:
              </p>
              <div className="text-lg font-bold text-blue-600">
                {sheetSubstances.length} substances
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CustomIcon
                icon="mdi:waveform"
                className="text-green-600"
              />
              Pilih Flute Types
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flute Types * (bisa pilih lebih dari satu)
              </label>
              {flutes.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-gray-500">Tidak ada flute tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {flutes.map((flute) => (
                    <div
                      key={flute.code}
                      onClick={() => handleFluteToggle(flute.code)}
                      className={`
                        cursor-pointer p-3 rounded-lg border-2 transition-all duration-200
                        ${addIndexFormData.flute_codes.includes(flute.code)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{flute.name}</p>
                          <p className="text-sm text-gray-500">{flute.code}</p>
                        </div>
                        <Badge
                          variant={getFluteBadgeVariant(flute.code)}
                          className={addIndexFormData.flute_codes.includes(flute.code) ? 'opacity-100' : 'opacity-50'}
                        >
                          {flute.code}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {addIndexFormErrors.flute_codes && (
                <p className="text-xs text-red-600 mt-2">{addIndexFormErrors.flute_codes}</p>
              )}
              <div className="mt-4 text-sm text-gray-500">
                Terpilih: {addIndexFormData.flute_codes.length} flute(s) - {addIndexFormData.flute_codes.join(', ')}
              </div>
            </div>
          </div>

        
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CustomIcon
                  icon="mdi:currency-usd"
                  className="text-purple-600"
                />
                Harga per M²
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga per Meter Persegi *
                </label>
                <CustomNumberInput
                  value={addIndexFormData.price_per_m2}
                  onChange={(value) => handleAddIndexInputChange('price_per_m2', value)}
                  placeholder="0"
                  min="1"
                  className='text-gray-700'
                  required
                  disabled={isPostingIndex}
                  error={addIndexFormErrors.price_per_m2}
                  prefix="Rp"
                />
                <div className="mt-2 text-sm text-gray-500">
                  Contoh: 15000 untuk Rp 15.000 per m²
                </div>
              </div>
            </div>


          {Object.keys(addIndexFormErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <CustomIcon
                  icon="mdi:alert-circle"
                  className="w-5 h-5 text-red-600 mt-0.5 mr-2"
                />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Perbaiki data berikut:
                  </p>
                  <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                    {Object.entries(addIndexFormErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Preview Index:</h4>
            {addIndexFormData.substance_id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Substance:</span>
                  <span className="font-medium">
                    {sheetSubstances.find(s => s.id === addIndexFormData.substance_id)?.substance_code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Flutes:</span>
                  <div className="flex flex-wrap gap-1">
                    {addIndexFormData.flute_codes.map(code => (
                      <Badge key={code} variant={getFluteBadgeVariant(code)} className="text-xs">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Harga:</span>
                  <span className="font-medium text-green-600">
                    {addIndexFormData.price_per_m2 
                      ? formatCurrency(parseFloat(addIndexFormData.price_per_m2))
                      : 'Rp 0'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Min. Qty:</span>
                  <span className="font-medium">
                    {addIndexFormData.minimal_qty || '1'} pcs
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Isi data di atas untuk melihat preview</p>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL DETAIL INDEX */}
      <Modal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        title={
          <div className="flex items-center gap-2">
            <CustomIcon
              icon="mdi:information"
              className="w-6 h-6 text-blue-600"
            />
            <span>Detail Sheet Index</span>
          </div>
        }
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Substance Code</p>
                <p className="text-lg font-semibold text-gray-900">
                  {detailItem.substance_code}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Flute Types</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {detailItem.flute_codes.map(code => (
                    <Badge
                      key={code}
                      variant={getFluteBadgeVariant(code)}
                    >
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Price per M²</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(detailItem.price_per_m2)}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Minimal Quantity</p>
                <p className="text-lg font-semibold text-blue-600">
                  {detailItem.minimal_qty} pcs
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Informasi Tambahan</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Created: {new Date(detailItem.created_at).toLocaleString('id-ID')}</p>
                <p>Updated: {new Date(detailItem.updated_at).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}