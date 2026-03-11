"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { SpreadsheetData, SpreadsheetLineItem } from "@/components/spreadsheet/types"
import { updateLineItem } from "@/actions/line-items"

export type SaveStatus = "saved" | "saving" | "error"

interface UseAutoSaveOptions {
  data: SpreadsheetData
  dirtyItemIds: string[]
  clearDirty: (itemIds: string[]) => void
  debounceMs?: number
}

export function useAutoSave({
  data,
  dirtyItemIds,
  clearDirty,
  debounceMs = 500,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  // Find an item by ID across groups and ungrouped items
  const findItem = useCallback(
    (itemId: string): SpreadsheetLineItem | undefined => {
      for (const group of data.groups) {
        const found = group.items.find((item) => item.id === itemId)
        if (found) return found
      }
      return data.ungroupedItems.find((item) => item.id === itemId)
    },
    [data]
  )

  const save = useCallback(async () => {
    if (savingRef.current || dirtyItemIds.length === 0) return

    savingRef.current = true
    setSaveStatus("saving")

    const idsToSave = [...dirtyItemIds]

    try {
      await Promise.all(
        idsToSave.map((itemId) => {
          const item = findItem(itemId)
          if (!item) return Promise.resolve()

          return updateLineItem(itemId, {
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            markupPercent: item.markupPercent,
            sellPrice: item.sellPrice,
            supplierId: item.supplierId,
          })
        })
      )

      clearDirty(idsToSave)
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    } finally {
      savingRef.current = false
    }
  }, [dirtyItemIds, findItem, clearDirty])

  // Debounce: whenever dirtyItemIds changes, schedule a save
  useEffect(() => {
    if (dirtyItemIds.length === 0) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [dirtyItemIds, debounceMs, save])

  return { saveStatus }
}
