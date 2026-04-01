'use client'
// hooks/useSinglefaceActions.ts
import { useState } from 'react'
import Swal from 'sweetalert2'
import { buildPayload } from '../lib/parsers'
import { getErrMsg, validateSinglefaceForm } from '../lib/utils'
import { BASE_FORM } from '../constants/constants'
import type { SinglefaceFormData, SinglefaceSubstance } from '../types/types'

interface UseSinglefaceActionsProps {
  substances: SinglefaceSubstance[]
  fetchAll: () => Promise<void>
  addItem: (data: unknown) => Promise<{ status: number; message?: string }>
  updateItem: (data: unknown) => Promise<{ status: number; message?: string }>
  deleteItem: (id: string) => Promise<{ status: number; message?: string }>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setAddFormData: (v: SinglefaceFormData) => void
  setEditFormData: (v: SinglefaceFormData) => void
  setEditingItem: (v: SinglefaceSubstance | null) => void
  setFormErrors: (v: Record<string, string>) => void
}

export const useSinglefaceActions = ({
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
}: UseSinglefaceActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  const showValidationError = async () => {
    await Swal.fire({
      icon: 'error',
      title: 'Validasi Error',
      text: 'Periksa kembali data yang diisi',
      confirmButtonColor: '#3b82f6',
    })
  }

  // ===== OPEN EDIT =====
  const openEditModal = (item: SinglefaceSubstance) => {
    setEditingItem(item)
    setEditFormData({
      layer_1: item.layer_1 || '',
      layer_1_type: item.layer_1_type || 'K',
      layer_2: item.layer_2 || '',
      layer_2_type: item.layer_2_type || 'M',
      flutes: [],
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  // ===== ADD =====
  const handleAdd = async (form: SinglefaceFormData) => {
    const errors = validateSinglefaceForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await showValidationError()
      return
    }

    const newCode = `${form.layer_1}${form.layer_1_type}/${form.layer_2}${form.layer_2_type}`
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
      const res = await addItem(buildPayload(form))
      if (res?.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        })
        setShowAddModal(false)
        setAddFormData({ ...BASE_FORM })
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
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT =====
  const handleEdit = async (editingItem: SinglefaceSubstance, form: SinglefaceFormData) => {
    const errors = validateSinglefaceForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      await showValidationError()
      return
    }

    const newCode = `${form.layer_1}${form.layer_1_type}/${form.layer_2}${form.layer_2_type}`
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
        ...buildPayload(form),
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
        setEditingItem(null)
        setEditFormData({ ...BASE_FORM })
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
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
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
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: res?.message || 'Gagal menghapus data',
          confirmButtonColor: '#3b82f6',
        })
      }
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    }
  }

  // ===== REFRESH =====
  const handleRefresh = async () => {
    try {
      await fetchAll()
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data berhasil diperbarui',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Error!', text: getErrMsg(err), confirmButtonColor: '#3b82f6' })
    }
  }

  return {
    isPosting,
    openEditModal,
    handleAdd,
    handleEdit,
    handleDelete,
    handleRefresh,
  }
}