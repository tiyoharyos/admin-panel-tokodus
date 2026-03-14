// app/(protected)/index-lainnya/hooks/useIndexLainnyaActions.ts

import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from '@/lib/axios'
import type { AddFormData, ApiResponse, IndexLainnya } from '../types/types'
import { extractErrorMessage } from '../lib/utils'

const swalSuccess = (text: string) =>
  Swal.fire({ icon: 'success', title: 'Berhasil!', text, timer: 1500, showConfirmButton: false })

const swalError = (err: unknown, fallback: string) =>
  Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err, fallback) })

interface UseIndexLainnyaActionsProps {
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setEditingItem: (item: IndexLainnya | null) => void
  resetAdd: () => void
}

export const useIndexLainnyaActions = ({
  refetch,
  setShowAddModal, setShowEditModal,
  setEditingItem, resetAdd,
}: UseIndexLainnyaActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  // ===== VALIDATE =====
  const validateAdd = (form: AddFormData): boolean => {
    if (!form.config_key.trim()) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Config Key harus diisi' }); return false }
    if (!form.value.trim())      { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Value harus diisi' });      return false }
    return true
  }

  const validateEdit = (item: IndexLainnya): boolean => {
    if (!item.config_key?.trim()) { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Config Key tidak boleh kosong' }); return false }
    if (!item.value?.trim())      { Swal.fire({ icon: 'error', title: 'Validasi Error', text: 'Value tidak boleh kosong' });      return false }
    return true
  }

  // ===== ADD =====
  const handleAdd = async (form: AddFormData): Promise<void> => {
    if (!validateAdd(form)) return
    try {
      setIsPosting(true)
      const res = await axios.post<ApiResponse>('/Admin/Other/indexLainnya', {
        config_key:  form.config_key.trim(),
        value:       form.value.trim(),
        qty_min:     form.qty_min || null,
        qty_max:     form.qty_max || null,
        keterangan:  form.keterangan || null,
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } })

      if (res.data?.status === 200 || res.data?.status === 201) {
        await swalSuccess('Data berhasil ditambahkan!')
        setShowAddModal(false)
        resetAdd()
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: res.data?.message || 'Gagal menambahkan data' })
      }
    } catch (err) {
      swalError(err, 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT =====
  const handleEdit = async (item: IndexLainnya): Promise<void> => {
    if (!validateEdit(item)) return
    try {
      setIsPosting(true)
      const res = await axios.put<ApiResponse>(`/Admin/Other/indexLainnyaEdit/${item.id}`, {
        config_key:  item.config_key,
        qty_min:     item.qty_min || null,
        qty_max:     item.qty_max || null,
        value:       item.value ?? '',
        keterangan:  item.keterangan || null,
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } })

      if (res.data?.status === 200) {
        await swalSuccess('Data berhasil diperbarui!')
        setShowEditModal(false)
        setEditingItem(null)
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: res.data?.message || 'Gagal mengupdate data' })
      }
    } catch (err) {
      swalError(err, 'Terjadi kesalahan saat mengupdate data')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
  const handleDelete = async (id: string, label: string): Promise<void> => {
    const ok = await Swal.fire({
      title: 'Konfirmasi Hapus', text: `Hapus "${label}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
    })
    if (!ok.isConfirmed) return

    try {
      const res = await axios.delete<ApiResponse>(`/Admin/Other/indexLainnya/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
      if (res.data?.status === 200) {
        await swalSuccess('Data berhasil dihapus!')
        await refetch()
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: res.data?.message || 'Gagal menghapus data' })
      }
    } catch (err) {
      swalError(err, 'Terjadi kesalahan saat menghapus data')
    }
  }

  // ===== REFRESH with confirm =====
  const handleRefresh = async (refetchFn: () => Promise<void>): Promise<void> => {
    const ok = await Swal.fire({
      icon: 'question', title: 'Refresh Data?', text: 'Data akan dimuat ulang dari server.',
      showCancelButton: true, confirmButtonText: 'Ya, Refresh!', cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6', cancelButtonColor: '#6B7280',
    })
    if (ok.isConfirmed) {
      await refetchFn()
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Data berhasil di-refresh!', timer: 1500, showConfirmButton: false })
    }
  }

  return { isPosting, handleAdd, handleEdit, handleDelete, handleRefresh }
}