// hooks/useSinglefaceActions.ts

import { useState } from 'react'
import Swal from 'sweetalert2'
import { getErrMsg } from '@/app/(protected)/Singgleface-indext/lib/utils'
import type { FormData, SinglefaceSubstance } from '@/app/(protected)/Singgleface-indext/types/types'

export const useSinglefaceActions = ({
  addItem,
  updateItem,
  deleteItem,
  fetchAll,
  substances,
  refetch,
  setShowAddModal,
  setShowEditModal,
  setSelectedItem,
  resetAddForm,
  resetEditForm,
}: {
  addItem: (data: unknown) => Promise<any>
  updateItem: (data: unknown) => Promise<any>
  deleteItem: (id: string) => Promise<any>
  fetchAll: () => Promise<void>
  substances: SinglefaceSubstance[]
  refetch: () => Promise<void>
  setShowAddModal: (show: boolean) => void
  setShowEditModal: (show: boolean) => void
  setSelectedItem: (item: SinglefaceSubstance | null) => void
  resetAddForm: () => void
  resetEditForm: () => void
}) => {
  const [isPosting, setIsPosting] = useState(false)

  const showValidationError = async () => {
    await Swal.fire({
      icon: 'error',
      title: 'Validasi Error',
      text: 'Periksa kembali data yang diisi',
      confirmButtonColor: '#3b82f6',
    })
  }

  const validateForm = (form: FormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!form.layer_1?.toString().trim()) {
      errors.layer_1 = 'Gramasi layer 1 tidak boleh kosong'
    } else if (parseFloat(form.layer_1) <= 0) {
      errors.layer_1 = 'Gramasi harus lebih dari 0'
    }

    if (!form.layer_2?.toString().trim()) {
      errors.layer_2 = 'Gramasi layer 2 tidak boleh kosong'
    } else if (parseFloat(form.layer_2) <= 0) {
      errors.layer_2 = 'Gramasi harus lebih dari 0'
    }

    const selectedFlutes = form.flutes.filter(f => f.selected)
    if (selectedFlutes.length === 0) {
      errors.flutes = 'Minimal satu flute harus dipilih'
    }

    selectedFlutes.forEach(flute => {
      if (!flute.price?.toString().trim()) {
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute wajib diisi`
      } else if (isNaN(parseFloat(flute.price)) || parseFloat(flute.price) <= 0) {
        errors[`price_${flute.code}`] = `Harga ${flute.code}-Flute harus lebih dari 0`
      }
    })

    return errors
  }

  const buildPayload = (form: FormData) => {
    const selectedFlutes = form.flutes.filter(f => f.selected)
    
    return {
      layer_1: parseFloat(form.layer_1.trim()),
      layer_1_type: form.layer_1_type,
      layer_2: parseFloat(form.layer_2.trim()),
      layer_2_type: form.layer_2_type,
      flutes: selectedFlutes.map(f => parseInt(f.id)).filter(id => id > 0),
      price_per_m2: selectedFlutes.map(f => parseFloat(f.price || '0')),
    }
  }

  const handleAdd = async (formData: FormData, setFormErrors: (errors: Record<string, string>) => void) => {
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await showValidationError()
      return
    }
    
    const newCode = `${formData.layer_1}${formData.layer_1_type}/${formData.layer_2}${formData.layer_2_type}`
    
    if (substances.some(s => s.substance_code === newCode)) {
      await Swal.fire({
        icon: 'error',
        title: 'Duplikat!',
        text: `Kombinasi "${newCode}" sudah ada.`,
        confirmButtonColor: '#3b82f6',
      })
      return
    }
    
    setIsPosting(true)
    try {
      const res = await addItem(buildPayload(formData))
      if (res?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        })
        setShowAddModal(false)
        resetAddForm()
        setFormErrors({})
        await fetchAll()
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: res?.message || 'Gagal menambahkan data',
          confirmButtonColor: '#3b82f6',
        })
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err),
        confirmButtonColor: '#3b82f6',
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleEdit = async (
    editingItem: SinglefaceSubstance,
    formData: FormData,
    setFormErrors: (errors: Record<string, string>) => void
  ) => {
    if (!editingItem) return
    
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await showValidationError()
      return
    }
    
    const newCode = `${formData.layer_1}${formData.layer_1_type}/${formData.layer_2}${formData.layer_2_type}`
    
    if (substances.some(s => s.id !== editingItem.id && s.substance_code === newCode)) {
      await Swal.fire({
        icon: 'error',
        title: 'Duplikat!',
        text: `Kombinasi "${newCode}" sudah digunakan.`,
        confirmButtonColor: '#3b82f6',
      })
      return
    }
    
    setIsPosting(true)
    try {
      const res = await updateItem({
        substance_id: parseInt(editingItem.id),
        ...buildPayload(formData),
      })
      if (res?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data berhasil diperbarui',
          timer: 1500,
          showConfirmButton: false,
        })
        setShowEditModal(false)
        setSelectedItem(null)
        resetEditForm()
        setFormErrors({})
        await fetchAll()
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: res?.message || 'Gagal memperbarui data',
          confirmButtonColor: '#3b82f6',
        })
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err),
        confirmButtonColor: '#3b82f6',
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus kombinasi "${code}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })
    if (!result.isConfirmed) return
    try {
      const res = await deleteItem(id)
      if (res?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Dihapus!',
          text: 'Data berhasil dihapus',
          timer: 1500,
          showConfirmButton: false,
        })
        await fetchAll()
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: res?.message || 'Gagal menghapus data',
          confirmButtonColor: '#3b82f6',
        })
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: getErrMsg(err),
        confirmButtonColor: '#3b82f6',
      })
    }
  }

  const handleRefresh = async (refetchFn: () => Promise<void>) => {
    const ok = await Swal.fire({
      icon: 'question',
      title: 'Refresh Data?',
      text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Refresh!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6B7280',
    })
    if (ok.isConfirmed) {
      await refetchFn()
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data berhasil di-refresh!',
        timer: 1500,
        showConfirmButton: false,
      })
    }
  }

  return {
    isPosting,
    handleAdd,
    handleEdit,
    handleDelete,
    handleRefresh,
    validateForm,
  }
}