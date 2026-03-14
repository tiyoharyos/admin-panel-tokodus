// ============================================================
// hooks/useFormulaState.ts — Formula component state management
// ============================================================

import { useCallback } from 'react'
import type { BoxModel, FormulaComponent } from '../types/types'
import { createFormulaComponent, parseComponentField } from '../lib/utils'

type FormulaTarget = 'edit' | 'new'

interface UseFormulaStateProps {
  editingItem: BoxModel | null
  setEditingItem: React.Dispatch<React.SetStateAction<BoxModel | null>>
  editingFormulaComponents: FormulaComponent[]
  setEditingFormulaComponents: React.Dispatch<React.SetStateAction<FormulaComponent[]>>
}

export const useFormulaState = ({
  editingItem,
  setEditingItem,
  editingFormulaComponents,
  setEditingFormulaComponents,
}: UseFormulaStateProps) => {
  // ===== ADD =====
  const addFormulaComponent = useCallback(
    (target: FormulaTarget) => {
      if (target === 'new') {
        setEditingFormulaComponents(prev => [
          ...prev,
          createFormulaComponent(editingItem?.id || '', prev.length + 1),
        ])
      } else if (editingItem) {
        setEditingItem(prev => {
          if (!prev) return prev
          const existing = prev.formulaComponents || []
          return {
            ...prev,
            formulaComponents: [
              ...existing,
              createFormulaComponent(prev.id, existing.length + 1),
            ],
          }
        })
      }
    },
    [editingItem, setEditingFormulaComponents, setEditingItem]
  )

  // ===== UPDATE =====
  const updateFormulaComponent = useCallback(
    (target: FormulaTarget, index: number, field: keyof FormulaComponent, value: string | number) => {
      const parsed = parseComponentField(field, value)

      if (target === 'new') {
        setEditingFormulaComponents(prev =>
          prev.map((item, i) => (i === index ? { ...item, [field]: parsed } : item))
        )
      } else {
        setEditingItem(prev => {
          if (!prev) return prev
          return {
            ...prev,
            formulaComponents: prev.formulaComponents.map((item, i) =>
              i === index ? { ...item, [field]: parsed } : item
            ),
          }
        })
      }
    },
    [setEditingFormulaComponents, setEditingItem]
  )

  // ===== REMOVE =====
  const removeFormulaComponent = useCallback(
    (target: FormulaTarget, index: number) => {
      const reorder = (list: FormulaComponent[]) =>
        list.filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i + 1 }))

      if (target === 'new') {
        setEditingFormulaComponents(prev => reorder(prev))
      } else {
        setEditingItem(prev => {
          if (!prev) return prev
          return { ...prev, formulaComponents: reorder(prev.formulaComponents) }
        })
      }
    },
    [setEditingFormulaComponents, setEditingItem]
  )

  return { addFormulaComponent, updateFormulaComponent, removeFormulaComponent }
}