// app/(protected)/sheet-settings/hooks/useSheetActions.ts

import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import type { ApiSuccessResponse, Flute, FormData, SheetSubstance } from '../types/types'
import { buildPayload, extractErrorMessage, validateForm } from '../lib/utils'

const HEADERS = { 'ngrok-skip-browser-warning': 'true' }

const swalSuccess = (text: string) =>
  Swal.fire({ icon: 'success', title: 'Berhasil!', text, timer: 1500, showConfirmButton: false })

const swalError = (err: unknown, fallback: string) =>
  Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err, fallback), confirmButtonColor: '#3b82f6' })

interface UseSheetActionsProps {
  flutes: Flute[]
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setEditingItem: (item: SheetSubstance | null) => void
  setFormErrors: (e: Record<string, string>) => void
  resetAdd: () => void
  resetEdit: () => void
}

export const useSheetActions = ({
  flutes, refetch,
  setShowAddModal, setShowEditModal,
  setEditingItem, setFormErrors,
  resetAdd, resetEdit,
}: UseSheetActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  const showValidationError = () =>
    Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Periksa kembali data yang diisi', confirmButtonColor: '#3b82f6' })

  // ===== ADD =====
  const handleAdd = async (form: FormData): Promise<void> => {
    const errors = validateForm(form, flutes)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); showValidationError(); return }

    try {
      setIsPosting(true)
      const res = await axios.post<ApiSuccessResponse>(
        '/Admin/Sheet/sheetIndexAdd',
        buildPayload(form, flutes),
        { headers: HEADERS }
      )
      if (res.data?.status === 200) {
        await swalSuccess('Data berhasil ditambahkan')
        setShowAddModal(false)
        resetAdd()
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: res.data?.message || 'Gagal menambahkan data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) { swalError(err, 'Terjadi kesalahan') }
    finally { setIsPosting(false) }
  }

  // ===== EDIT =====
  const handleEdit = async (editingItem: SheetSubstance, form: FormData): Promise<void> => {
    const errors = validateForm(form, flutes)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); showValidationError(); return }

    try {
      setIsPosting(true)
      const res = await axios.put<ApiSuccessResponse>(
        '/Admin/Sheet/sheetIndexUpdate',
        { substance_id: parseInt(editingItem.id), ...buildPayload(form, flutes) },
        { headers: HEADERS }
      )
      if (res.data?.status === 200) {
        await swalSuccess('Data berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        resetEdit()
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: res.data?.message || 'Gagal memperbarui data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) { swalError(err, 'Terjadi kesalahan server') }
    finally { setIsPosting(false) }
  }

  // ===== DELETE =====
  const handleDelete = async (id: string, substanceCode: string): Promise<void> => {
    const ok = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus kombinasi "${substanceCode}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
    })
    if (!ok.isConfirmed) return

    try {
      const res = await axios.delete<ApiSuccessResponse>(
        `/Admin/Sheet/sheetIndexDelete/${id}`,
        { headers: HEADERS }
      )
      if (res.data?.status === 200) {
        await swalSuccess('Data berhasil dihapus')
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: res.data?.message || 'Gagal menghapus data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) { swalError(err, 'Terjadi kesalahan') }
  }

  return { isPosting, handleAdd, handleEdit, handleDelete }
}