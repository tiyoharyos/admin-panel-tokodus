// app/(protected)/paperbag-sheet-sizes/hooks/useSheetSizeActions.ts

import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import type { ApiResponse, SheetForm, SheetSize } from '../types/types'
import { buildPayload, extractErrorMessage, validateForm } from '../lib/utils'

const REQUEST_CONFIG = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }

const swalSuccess = (text: string) =>
  Swal.fire({ icon: 'success', title: 'Berhasil!', text, timer: 1500, showConfirmButton: false })

const swalError = (err: unknown, fallback: string) =>
  Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err, fallback) })

interface UseSheetSizeActionsProps {
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setSelectedItem: (item: SheetSize | null) => void
  resetAdd: () => void
}

export const useSheetSizeActions = ({
  refetch,
  setShowAddModal, setShowEditModal,
  setSelectedItem, resetAdd,
}: UseSheetSizeActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  // ===== ADD =====
  const handleAdd = async (form: SheetForm): Promise<void> => {
    const err = validateForm(form)
    if (err) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' }); return }

    try {
      setIsPosting(true)
      const { data } = await axios.post<ApiResponse<SheetSize>>(
        '/Admin/Paperbag/PaperbagSheetSizesAdd',
        buildPayload(form),
        REQUEST_CONFIG,
      )
      if (data?.status === 200) {
        await swalSuccess('Ukuran sheet baru berhasil ditambahkan!')
        setShowAddModal(false)
        resetAdd()
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menyimpan data' })
      }
    } catch (err) {
      swalError(err, 'Gagal menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT =====
  const handleEdit = async (item: SheetSize, form: SheetForm): Promise<void> => {
    const err = validateForm(form)
    if (err) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' }); return }

    try {
      setIsPosting(true)
      const { data } = await axios.put<ApiResponse>(
        `/Admin/Paperbag/PaperbagSheetSizesEdit/${item.id}`,
        buildPayload(form),
        REQUEST_CONFIG,
      )
      if (data?.status === 200) {
        await swalSuccess('Data ukuran sheet berhasil diperbarui!')
        setShowEditModal(false)
        setSelectedItem(null)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menyimpan data' })
      }
    } catch (err) {
      swalError(err, 'Gagal menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
  const handleDelete = async (item: SheetSize): Promise<void> => {
    const ok = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Ukuran Sheet?',
      html: `Ukuran <strong>${item.keterangan}</strong> (${item.code}) akan dihapus permanen.<br/>Tindakan ini tidak dapat dibatalkan.`,
      showCancelButton: true,
      confirmButtonColor: '#EF4444', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
    })
    if (!ok.isConfirmed) return

    try {
      const { data } = await axios.delete<ApiResponse>(`/Admin/Paperbag/PaperbagSheetSizesDel/${item.id}`)
      if (data?.status === 200) {
        await swalSuccess(`Ukuran sheet "${item.keterangan}" berhasil dihapus.`)
        await refetch()
      }
    } catch (err) {
      swalError(err, 'Gagal menghapus data')
    }
  }

  // ===== REFRESH with confirm =====
  const handleRefresh = async (refetchFn: () => Promise<void>): Promise<void> => {
    const ok = await Swal.fire({
      icon: 'question', title: 'Refresh Data?', text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6', cancelButtonColor: '#6B7280',
    })
    if (ok.isConfirmed) {
      await refetchFn()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil di-refresh!', timer: 1500, showConfirmButton: false })
    }
  }

  return { isPosting, handleAdd, handleEdit, handleDelete, handleRefresh }
}