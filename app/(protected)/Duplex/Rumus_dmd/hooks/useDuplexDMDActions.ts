// app/(protected)/duplex-dmd/hooks/useDuplexDMDActions.ts

import { useState } from 'react'
import axios from '@/lib/axios'
import Swal from 'sweetalert2'
import type { ApiResponse, DuplexDMDData, FormData, SheetSizeItem } from '../types/types'
import { buildSheetLabel, extractErrorMessage } from '../lib/utils'

const swalSuccess = (text: string) =>
  Swal.fire({ icon: 'success', title: 'Berhasil!', text, timer: 1500, showConfirmButton: false })

const swalError = (err: unknown) =>
  Swal.fire({ icon: 'error', title: 'Error!', text: extractErrorMessage(err), confirmButtonColor: '#3b82f6' })

interface UseDuplexDMDActionsProps {
  duplexData: DuplexDMDData[]
  sheetSizeList: SheetSizeItem[]
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  resetAdd: () => void
  resetEdit: () => void
  setEditingItem: (item: DuplexDMDData | null) => void
}

export const useDuplexDMDActions = ({
  duplexData,
  sheetSizeList,
  refetch,
  setShowAddModal,
  setShowEditModal,
  resetAdd,
  resetEdit,
  setEditingItem,
}: UseDuplexDMDActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  // ===== VALIDATION =====
  const validate = (form: FormData, isEdit = false): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!form.sheet_size_id) errors.sheet_size_id = 'Ukuran tidak boleh kosong'
    if (!form.gsm) errors.gsm = 'GSM tidak boleh kosong'

    if (form.harga_per_lembar?.trim()) {
      const h = parseFloat(form.harga_per_lembar)
      if (isNaN(h)) errors.harga_per_lembar = 'Harga harus berupa angka'
      else if (h < 0) errors.harga_per_lembar = 'Harga tidak boleh negatif'
    }

    if (!isEdit && form.sheet_size_id && form.gsm) {
      const gNum = parseInt(form.gsm)
      if (duplexData.some(d => d.sheet_size_id === form.sheet_size_id && d.gsm === gNum)) {
        const sz = sheetSizeList.find(s => s.id_sh === form.sheet_size_id)
        errors.general = `Kombinasi ${sz ? buildSheetLabel(sz.panjang_sh, sz.lebar_sh) : ''} dengan GSM ${form.gsm} sudah ada`
      }
    }

    return errors
  }

  // ===== ADD =====
  const handleAdd = async (form: FormData): Promise<Record<string, string> | null> => {
    const errors = validate(form, false)
    if (Object.keys(errors).length) return errors

    try {
      setIsPosting(true)
      const res = await axios.post<ApiResponse>('Admin/Duplek/duplekMduplekPricesAdd', {
        gramasi: form.gsm,
        pl: form.sheet_size_id,
        harga_lembar: form.harga_per_lembar || '0',
      })

      if (res.status === 200 || res.data?.status === 200) {
        await refetch()
        await swalSuccess('Data Duplex DMD berhasil ditambahkan')
        setShowAddModal(false)
        resetAdd()
      } else {
        throw new Error(res.data?.message || 'Gagal menambahkan data')
      }
    } catch (err) {
      swalError(err)
    } finally {
      setIsPosting(false)
    }

    return null
  }

  // ===== EDIT =====
  const handleEdit = async (item: DuplexDMDData, form: FormData): Promise<Record<string, string> | null> => {
    const errors = validate(form, true)
    if (Object.keys(errors).length) return errors

    try {
      setIsPosting(true)
      const res = await axios.put<ApiResponse>(`Admin/Duplek/duplekMduplekPricesEdit/${item.id}`, {
        gramasi: form.gsm,
        pl: form.sheet_size_id,
        harga_lembar: form.harga_per_lembar || '0',
      })

      if (res.status === 200 || res.data?.status === 200) {
        await refetch()
        await swalSuccess('Data Duplex DMD berhasil diperbarui')
        setShowEditModal(false)
        setEditingItem(null)
        resetEdit()
      } else {
        throw new Error(res.data?.message || 'Gagal mengupdate data')
      }
    } catch (err) {
      swalError(err)
    } finally {
      setIsPosting(false)
    }

    return null
  }

  // ===== DELETE =====
  const handleDelete = async (id: number, gsm: number, ukuran: string) => {
    const ok = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus data GSM ${gsm} - Ukuran ${ukuran}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })
    if (!ok.isConfirmed) return

    try {
      setIsPosting(true)
      const res = await axios.delete<ApiResponse>(`Admin/Duplek/duplekMduplekPricesDel/${id}`)
      if (res.status === 200) {
        await refetch()
        await swalSuccess('Data Duplex DMD berhasil dihapus')
      } else {
        throw new Error(res.data?.message || 'Gagal menghapus data')
      }
    } catch (err) {
      swalError(err)
    } finally {
      setIsPosting(false)
    }
  }

  return { isPosting, validate, handleAdd, handleEdit, handleDelete }
}