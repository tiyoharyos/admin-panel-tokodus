// app/(protected)/sablon/hooks/useSablonActions.ts

import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import type { SablonForm } from '../constants/constants'
import type { ApiResponse, Sablon } from '../types/types'
import { buildPayload, extractErrorMessage, validateSablonForm } from '../lib/utils'

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' }

const swalSuccess = (text: string) =>
  Swal.fire({ icon: 'success', title: 'Berhasil!', text, timer: 1500, showConfirmButton: false })

const swalError = (err: unknown, fallback: string) =>
  Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err, fallback), confirmButtonColor: '#3b82f6' })

interface UseSablonActionsProps {
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setEditingItem: (item: Sablon | null) => void
  resetAdd: () => void
}

export const useSablonActions = ({
  refetch,
  setShowAddModal, setShowEditModal,
  setEditingItem, resetAdd,
}: UseSablonActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  // ===== ADD =====
  const handleAdd = async (form: SablonForm): Promise<void> => {
    const err = validateSablonForm(form)
    if (err) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' })
      return
    }

    try {
      setIsPosting(true)
      const { data } = await axios.post<ApiResponse>(
        '/Admin/Sablon/SablonAdd',
        buildPayload(form),
        { headers: FORM_HEADERS }
      )
      if (data?.status === 200) {
        await swalSuccess(data.message || 'Sablon berhasil ditambahkan!')
        setShowAddModal(false)
        resetAdd()
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menyimpan data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) {
      swalError(err, 'Gagal menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT =====
  const handleEdit = async (item: Sablon): Promise<void> => {
    const form: SablonForm = {
      code:             item.code,
      label:            item.label,
      harga_jual_gt500: item.harga_jual_gt500,
      harga_jual_gt100: item.harga_jual_gt100,
      qty_minimum:      item.qty_minimum,
    }
    const err = validateSablonForm(form)
    if (err) {
      Swal.fire({ icon: 'error', title: 'Validasi Error', text: err, confirmButtonColor: '#3b82f6' })
      return
    }

    try {
      setIsPosting(true)
      const { data } = await axios.put<ApiResponse>(
        `/Admin/Sablon/SablonEdit/${item.id_st}`,
        buildPayload(form),
        { headers: FORM_HEADERS }
      )
      if (data?.status === 200) {
        await swalSuccess(data.message || 'Sablon berhasil diperbarui!')
        setShowEditModal(false)
        setEditingItem(null)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal mengupdate data', confirmButtonColor: '#3b82f6' })
      }
    } catch (err) {
      swalError(err, 'Gagal mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
  // The original checks whether the item still exists after delete (backend quirk).
  const handleDelete = async (id: string, label: string): Promise<void> => {
    const ok = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus "${label}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!',
    })
    if (!ok.isConfirmed) return

    try {
      await axios.delete<ApiResponse>(`/Admin/Sablon/Sablon/${id}`)
    } catch {
      // swallow — verify via refetch below
    } finally {
      await refetch()
      // Verify deletion by checking fresh data
      try {
        const { data: fresh } = await axios.get('/Admin/Sablon/Sablon')
        const stillExists = Array.isArray(fresh?.data) &&
          fresh.data.find((s: Sablon) => s.id_st === id)

        if (!stillExists) {
          Swal.fire({ icon: 'success', title: 'Dihapus!', text: `"${label}" berhasil dihapus!`, timer: 1500, showConfirmButton: false })
        } else {
          Swal.fire({ icon: 'error', title: 'Error!', text: 'Gagal menghapus data, silakan coba lagi.', confirmButtonColor: '#3b82f6' })
        }
      } catch {
        // If re-check fails, assume success
        Swal.fire({ icon: 'success', title: 'Dihapus!', text: `"${label}" berhasil dihapus!`, timer: 1500, showConfirmButton: false })
      }
    }
  }

  return { isPosting, handleAdd, handleEdit, handleDelete }
}