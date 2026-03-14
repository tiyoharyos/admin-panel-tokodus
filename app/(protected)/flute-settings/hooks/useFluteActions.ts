// app/(protected)/flutes/hooks/useFluteActions.ts

import { useState } from 'react'
import { AxiosError } from 'axios'
import axios from '@/lib/axios'
import SweetAlert from '@/components/UI/SweetAlert'
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
    if (!data.code.trim()) { SweetAlert.error('Validasi Error', 'Kode tidak boleh kosong'); return false }
    if (data.code.length > 3) { SweetAlert.error('Validasi Error', 'Kode maksimal 3 karakter'); return false }
    if (!data.name.trim()) { SweetAlert.error('Validasi Error', 'Nama tidak boleh kosong'); return false }
    return true
  }

  // ===== ADD =====
  const handleAdd = async (form: FormData): Promise<void> => {
    if (!validate(form)) return

    const isDuplicate = flutes.some(f => f.code.toUpperCase() === form.code.trim().toUpperCase())
    if (isDuplicate) { SweetAlert.error('Kode Sudah Ada!', `Kode "${form.code}" sudah terdaftar.`); return }

    try {
      setIsPosting(true)
      const res = await axios.post<ApiResponse<FluteApiItem>>(
        '/Admin/Flutes/FlutesAdd',
        { code: form.code.trim(), name: form.name.trim() },
        { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 15000 }
      )

      if (res.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil ditambahkan!')
        setShowAddModal(false)
        resetAdd()
        await refetch()
      } else {
        SweetAlert.error('Gagal!', res.data?.message || 'Gagal menambahkan Flute')
      }
    } catch (err) {
      const dupMsg = isDuplicateError(err, form.code)
      SweetAlert.error('Error!', dupMsg || extractErrorMessage(err, 'Terjadi kesalahan saat menyimpan data'))
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
    if (isDuplicate) { SweetAlert.error('Kode Sudah Ada!', `Kode "${editingItem.code}" sudah digunakan.`); return }

    try {
      setIsPosting(true)
      const res = await axios.put<ApiResponse<FluteApiItem>>(
        `/Admin/Flutes/FlutesEdit/${editingItem.id}`,
        { code: editingItem.code.trim(), name: editingItem.name.trim() },
        { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 15000 }
      )

      if (res.data?.status === 200) {
        SweetAlert.success('Berhasil!', 'Flute berhasil diperbarui!')
        setShowEditModal(false)
        setEditingItem(null)
        resetEdit()
        await refetch()
      } else {
        SweetAlert.error('Gagal!', res.data?.message || 'Gagal mengupdate data')
      }
    } catch (err) {
      const dupMsg = isDuplicateError(err, editingItem.code)
      SweetAlert.error('Error!', dupMsg || extractErrorMessage(err, 'Terjadi kesalahan saat mengupdate data'))
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
  const handleDelete = async (id: string, name: string): Promise<void> => {
    const result = await SweetAlert.confirmDelete()
    if (!result.isConfirmed) return

    try {
      const res = await axios.delete<ApiResponse<null>>(
        `/Admin/Flutes/FlutesDel/${id}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      )
      if (res.data?.status === 200) {
        SweetAlert.success('Dihapus!', `Flute "${name}" berhasil dihapus!`)
        await refetch()
      } else {
        SweetAlert.error('Gagal!', res.data?.message || 'Gagal menghapus Flute')
      }
    } catch (err) {
      const axiosMsg = err instanceof AxiosError
        ? (err.response?.data as { message?: string })?.message
        : undefined
      SweetAlert.error('Error!', axiosMsg || 'Terjadi kesalahan saat menghapus data')
    }
  }

  return { isPosting, handleAdd, openEdit, handleEdit, handleDelete }
}