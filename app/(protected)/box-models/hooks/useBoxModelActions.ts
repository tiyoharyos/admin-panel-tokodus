// ============================================================
// hooks/useBoxModelActions.ts — CRUD & formula API actions
// ============================================================

import { useState, useCallback } from 'react'
import axios from '@/lib/axios'
import Swal from 'sweetalert2'
import type { AddFormData, BoxModel, FormulaComponent, FormulaApiResponse } from '../types/types'
import {
  buildFormulaPayload,
  extractErrorMessage,
  isInvalidComponent,
  parseFormulaResponse,
} from '../lib/utils'
import { DEFAULT_ADD_FORM } from '../constants/constants'

const swalSuccess = (text: string) =>
  Swal.fire({ icon: 'success', title: 'Berhasil!', text, timer: 1500, showConfirmButton: false })

const swalError = (text: string) =>
  Swal.fire({ icon: 'error', title: 'Error!', text, confirmButtonColor: '#3b82f6' })

interface UseBoxModelActionsProps {
  refetch: () => Promise<void>
  setShowAddModal: (v: boolean) => void
  setShowEditModal: (v: boolean) => void
  setShowFormulaModal: (v: boolean) => void
  setShowViewModal: (v: boolean) => void
  setAddFormData: (v: AddFormData) => void
  setEditingItem: React.Dispatch<React.SetStateAction<BoxModel | null>>
  setEditingFormulaComponents: React.Dispatch<React.SetStateAction<FormulaComponent[]>>
}

export const useBoxModelActions = ({
  refetch,
  setShowAddModal,
  setShowEditModal,
  setShowFormulaModal,
  setShowViewModal,
  setAddFormData,
  setEditingItem,
  setEditingFormulaComponents,
}: UseBoxModelActionsProps) => {
  const [isPosting, setIsPosting] = useState(false)

  // ===== VALIDATION =====
  const validateFormula = (components: FormulaComponent[]): boolean => {
    const invalidCount = components.filter(isInvalidComponent).length
    if (invalidCount) {
      Swal.fire({
        icon: 'error',
        title: 'Validasi Error',
        text: `${invalidCount} komponen memiliki data yang tidak valid`,
        confirmButtonColor: '#3b82f6',
      })
      return false
    }
    return true
  }

  // ===== ADD =====
  const handleAdd = async (formData: AddFormData) => {
    if (!formData.name.trim() || !formData.description.trim()) {
      return swalError('Nama dan deskripsi harus diisi')
    }

    try {
      setIsPosting(true)
      const { data } = await axios.post('/Admin/Box/boxModels', {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        status_bm: formData.status_bm,
      })

      if (data?.status === 200) {
        await swalSuccess('Box Model berhasil ditambahkan!')
        setShowAddModal(false)
        setAddFormData(DEFAULT_ADD_FORM)
        await refetch()
      }
    } catch (err) {
      swalError(extractErrorMessage(err, 'Gagal menyimpan data'))
    } finally {
      setIsPosting(false)
    }
  }

  // ===== EDIT =====
  const handleEdit = async (item: BoxModel) => {
    if (!item.namaModel.trim() || !item.deskripsi?.trim()) {
      return swalError('Nama dan deskripsi harus diisi')
    }

    const components = item.formulaComponents || []
    if (components.length && !validateFormula(components)) return

    try {
      setIsPosting(true)
      const { data } = await axios.put(`/Admin/Box/boxModelsFormulaEdit/${item.id}`, {
        code: item.kode.trim(),
        name: item.namaModel.trim(),
        description: item.deskripsi.trim(),
        category: item.category || 'Mailer Box',
        status_bm: item.status_bm || '1',
        formula: buildFormulaPayload(components),
      })

      if (data?.status === 200) {
        await swalSuccess('Data berhasil diperbarui!')
        await refetch()
        setShowEditModal(false)
        setEditingItem(null)
      }
    } catch (err) {
      swalError(extractErrorMessage(err, 'Gagal mengupdate data'))
    } finally {
      setIsPosting(false)
    }
  }

  // ===== FORMULA SAVE =====
  const handleFormulaSave = async (item: BoxModel, components: FormulaComponent[]) => {
    if (!validateFormula(components)) return

    try {
      setIsPosting(true)
      let successCount = 0

      for (const [index, c] of components.entries()) {
        try {
          await axios.post('/Admin/Box/boxFormulaComponents', {
            box_model_id: item.id,
            target: c.target,
            source: c.source,
            multiplier: c.multiplier.toString(),
            allowance_mm: c.allowance_mm?.toString() || '0',
            sort_order: c.sort_order?.toString() || (index + 1).toString(),
          })
          successCount++
        } catch (err) {
          console.error(`Error komponen ${index + 1}:`, err)
        }
      }

      if (successCount > 0) {
        await swalSuccess(`${successCount} komponen berhasil disimpan!`)
        await refetch()
        setShowFormulaModal(false)
        setEditingItem(null)
        setEditingFormulaComponents([])
      }
    } catch (err) {
      swalError(err instanceof Error ? err.message : 'Gagal menyimpan formula')
    } finally {
      setIsPosting(false)
    }
  }

  // ===== DELETE =====
  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Hapus "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
    })

    if (!result.isConfirmed) return

    try {
      const { data } = await axios.delete(`/Admin/Box/boxModelsDel/${id}`)
      if (data?.status === 200) {
        await swalSuccess(`"${name}" berhasil dihapus!`)
        await refetch()
      }
    } catch (err) {
      swalError(extractErrorMessage(err, 'Gagal menghapus data'))
    }
  }

  // ===== OPEN EDIT (with fresh formula fetch) =====
  const openEditModal = useCallback(
    async (item: BoxModel) => {
      try {
        const { data } = await axios.get<FormulaApiResponse>(
          `/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`
        )
        const components = parseFormulaResponse(data)
        setEditingItem({
          ...item,
          status_bm: item.status ? '1' : '0',
          formulaComponents: components,
          hasFormula: components.length > 0,
        })
      } catch {
        setEditingItem({ ...item, status_bm: item.status ? '1' : '0', formulaComponents: [], hasFormula: false })
      }
      setShowViewModal(false)
      setShowEditModal(true)
    },
    [setEditingItem, setShowViewModal, setShowEditModal]
  )

  // ===== OPEN FORMULA MODAL =====
  const openFormulaModal = useCallback(
    async (item: BoxModel) => {
      try {
        const { data } = await axios.get<FormulaApiResponse>(
          `/Admin/Box/boxFormulaComponentsJoinBox/${item.id}`
        )
        const formula = data?.data?.formula
        const hasFormula =
          data?.status === 200 && formula && (Array.isArray(formula) ? formula.length > 0 : true)

        if (hasFormula) {
          const result = await Swal.fire({
            icon: 'info',
            title: 'Formula Sudah Ada',
            text: 'Gunakan menu Edit untuk mengubah formula.',
            showCancelButton: true,
            confirmButtonText: 'Edit Model',
            confirmButtonColor: '#3b82f6',
          })
          if (result.isConfirmed) openEditModal(item)
          return
        }
      } catch {
        // formula not found, proceed to add
      }

      setEditingItem(item)
      setEditingFormulaComponents([])
      setShowFormulaModal(true)
    },
    [openEditModal, setEditingItem, setEditingFormulaComponents, setShowFormulaModal]
  )

  return {
    isPosting,
    handleAdd,
    handleEdit,
    handleFormulaSave,
    handleDelete,
    openEditModal,
    openFormulaModal,
  }
}