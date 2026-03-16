// app/(protected)/pisau-registry/hooks/usePisauActions.ts

import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import type { AddForm } from '../constants/constants'
import type { ApiResponse, PisauRegistry } from '../types/types'
import { buildPayload, extractErrorMessage, validatePisauForm } from '../lib/utils'

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' }

const swalSuccess = (text: string) =>
  Swal.fire({ icon: 'success', title: 'Berhasil!', text, timer: 1500, showConfirmButton: false })

const swalError = (err: unknown, fallback: string) =>
  Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err, fallback) })

interface UsePisauActionsProps {
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setSelectedItem: (item: PisauRegistry | null) => void
  resetAdd: () => void
}

export const usePisauActions = ({
  refetch,
  setShowAddModal, setShowEditModal,
  setSelectedItem, resetAdd,
}: UsePisauActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  // ===== ADD =====
  const handleAdd = async (form: AddForm): Promise<void> => {
    const err = validatePisauForm(form)
    if (err) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: err }); return }

    try {
      setIsPosting(true)
      const { data } = await axios.post<ApiResponse>(
        '/Admin/Pisau/PisauRegistryAdd',
        buildPayload({ ...form, status: 'active' }).toString(),
        { headers: FORM_HEADERS }
      )
      if (data?.status === 200) {
        await swalSuccess('Data pisau berhasil ditambahkan!')
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
  const handleEdit = async (item: PisauRegistry): Promise<void> => {
    const err = validatePisauForm(item)
    if (err) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: err }); return }

    try {
      setIsPosting(true)
      const { data } = await axios.put<ApiResponse>(
        `/Admin/Pisau/PisauRegistryEdit/${item.id}`,
        buildPayload(item).toString(),
        { headers: FORM_HEADERS }
      )
      if (data?.status === 200) {
        await swalSuccess('Data berhasil diperbarui!')
        setShowEditModal(false)
        setSelectedItem(null)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal mengupdate data' })
      }
    } catch (err) {
      swalError(err, 'Gagal mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
  const handleDelete = async (id: string, kodePisau: string): Promise<void> => {
    const ok = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus data pisau "${kodePisau}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
    })
    if (!ok.isConfirmed) return

    try {
      const { data } = await axios.delete<ApiResponse>(`/Admin/Pisau/PisauRegistryDel/${id}`)
      if (data?.status === 200) {
        await swalSuccess(`"${kodePisau}" berhasil dihapus!`)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: data?.message || 'Gagal menghapus data' })
      }
    } catch (err) {
      swalError(err, 'Gagal menghapus data')
    }
  }

  return { isPosting, handleAdd, handleEdit, handleDelete }
}