// app/(protected)/flutes/hooks/useFluteActions.ts

import { useState } from 'react'
import { AxiosError } from 'axios'
import axios from '@/lib/axios'
import Swal from 'sweetalert2'
import type { ApiResponse, Flute, FluteApiItem, FluteSingleResponse, FormData } from '../types/types'
import { extractErrorMessage, isDuplicateError, mapFluteItem } from '../lib/utils'

interface UseFluteActionsProps {
  flutes: Flute[]
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setEditingItem: (item: Flute | null) => void
  resetAdd: () => void
  resetEdit: () => void
}

export const useFluteActions = ({
  flutes, refetch,
  setShowAddModal, setShowEditModal,
  setEditingItem, resetAdd, resetEdit,
}: UseFluteActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  // ===== VALIDATION =====
  const validate = (data: FormData): boolean => {
    if (!data.code.trim()) { 
      Swal.fire('Validasi Error', 'Kode tidak boleh kosong', 'error')
      return false 
    }
    if (data.code.length > 3) { 
      Swal.fire('Validasi Error', 'Kode maksimal 3 karakter', 'error')
      return false 
    }
    if (!data.name.trim()) { 
      Swal.fire('Validasi Error', 'Nama tidak boleh kosong', 'error')
      return false 
    }
    return true
  }

  // ===== ADD =====
  const handleAdd = async (form: FormData): Promise<void> => {
    if (!validate(form)) return

    const isDuplicate = flutes.some(f => f.code.toUpperCase() === form.code.trim().toUpperCase())
    if (isDuplicate) { 
      Swal.fire('Kode Sudah Ada!', `Kode "${form.code}" sudah terdaftar.`, 'error')
      return 
    }

    try {
      setIsPosting(true)
      const res = await axios.post<ApiResponse<FluteApiItem>>(
        '/Admin/Flutes/FlutesAdd',
        { code: form.code.trim(), name: form.name.trim() },
        { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 15000 }
      )

      if (res.data?.status === 200) {
        Swal.fire('Berhasil!', 'Flute berhasil ditambahkan!', 'success')
        setShowAddModal(false)
        resetAdd()
        await refetch()
      } else {
        Swal.fire('Gagal!', res.data?.message || 'Gagal menambahkan Flute', 'error')
      }
    } catch (err) {
      const dupMsg = isDuplicateError(err, form.code)
      Swal.fire('Error!', dupMsg || extractErrorMessage(err, 'Terjadi kesalahan saat menyimpan data'), 'error')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== OPEN EDIT (fetch fresh data) =====
  const openEdit = async (item: Flute): Promise<void> => {
    try {
      const res = await axios.get<FluteSingleResponse | ApiResponse<FluteApiItem>>(
        `/Admin/Flutes/FlutesByid/${item.id}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' }, timeout: 10000 }
      )
      if (res.data && 'status' in res.data && res.data.status === 200 && res.data.data) {
        setEditingItem(mapFluteItem(res.data.data as FluteApiItem))
      } else {
        setEditingItem({ ...item })
      }
    } catch {
      setEditingItem({ ...item })
    }
    setShowEditModal(true)
  }

  // ===== EDIT =====
  const handleEdit = async (editingItem: Flute): Promise<void> => {
    const form: FormData = { code: editingItem.code, name: editingItem.name }
    if (!validate(form)) return

    const isDuplicate = flutes.some(
      f => f.id !== editingItem.id && f.code.toUpperCase() === editingItem.code.trim().toUpperCase()
    )
    if (isDuplicate) { 
      Swal.fire('Kode Sudah Ada!', `Kode "${editingItem.code}" sudah digunakan.`, 'error')
      return 
    }

    try {
      setIsPosting(true)
      const res = await axios.put<ApiResponse<FluteApiItem>>(
        `/Admin/Flutes/FlutesEdit/${editingItem.id}`,
        { code: editingItem.code.trim(), name: editingItem.name.trim() },
        { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 15000 }
      )

      if (res.data?.status === 200) {
        Swal.fire('Berhasil!', 'Flute berhasil diperbarui!', 'success')
        setShowEditModal(false)
        setEditingItem(null)
        resetEdit()
        await refetch()
      } else {
        Swal.fire('Gagal!', res.data?.message || 'Gagal mengupdate data', 'error')
      }
    } catch (err) {
      const dupMsg = isDuplicateError(err, editingItem.code)
      Swal.fire('Error!', dupMsg || extractErrorMessage(err, 'Terjadi kesalahan saat mengupdate data'), 'error')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
  const handleDelete = async (id: string, name: string): Promise<void> => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Data "${name}" akan dihapus secara permanen!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    })
    
    if (!result.isConfirmed) return

    try {
      const res = await axios.delete<ApiResponse<null>>(
        `/Admin/Flutes/FlutesDel/${id}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      )
      if (res.data?.status === 200) {
        Swal.fire('Dihapus!', `Flute "${name}" berhasil dihapus!`, 'success')
        await refetch()
      } else {
        Swal.fire('Gagal!', res.data?.message || 'Gagal menghapus Flute', 'error')
      }
    } catch (err) {
      const axiosMsg = err instanceof AxiosError
        ? (err.response?.data as { message?: string })?.message
        : undefined
      Swal.fire('Error!', axiosMsg || 'Terjadi kesalahan saat menghapus data', 'error')
    }
  }

  return { isPosting, handleAdd, openEdit, handleEdit, handleDelete }
}