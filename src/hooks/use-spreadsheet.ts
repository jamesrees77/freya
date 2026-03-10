"use client"

import { useReducer, useCallback } from "react"
import type { SpreadsheetData } from "@/components/spreadsheet/types"
import { calculateSellPrice, calculateMarkupPercent } from "@/lib/calculations"

type SpreadsheetAction =
  | { type: "UPDATE_CELL"; itemId: string; field: string; value: string | number }
  | { type: "UPDATE_SUPPLIER"; itemId: string; supplierId: string | null; supplierName: string | null }

interface SpreadsheetState {
  data: SpreadsheetData
  dirtyItemIds: string[]
}

function reducer(state: SpreadsheetState, action: SpreadsheetAction): SpreadsheetState {
  switch (action.type) {
    case "UPDATE_CELL": {
      const { itemId, field, value } = action
      const newGroups = state.data.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          if (item.id !== itemId) return item
          const updated = { ...item, [field]: value }

          // Bidirectional recalculation
          if (field === "unitCost") {
            updated.sellPrice = calculateSellPrice(
              updated.unitCost,
              updated.markupPercent
            )
          } else if (field === "markupPercent") {
            updated.sellPrice = calculateSellPrice(
              updated.unitCost,
              updated.markupPercent
            )
          } else if (field === "sellPrice") {
            updated.markupPercent = calculateMarkupPercent(
              updated.unitCost,
              updated.sellPrice
            )
          }

          return updated
        }),
      }))

      return {
        data: { ...state.data, groups: newGroups },
        dirtyItemIds: state.dirtyItemIds.includes(itemId)
          ? state.dirtyItemIds
          : [...state.dirtyItemIds, itemId],
      }
    }

    case "UPDATE_SUPPLIER": {
      const { itemId, supplierId, supplierName } = action
      const newGroups = state.data.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          if (item.id !== itemId) return item
          return { ...item, supplierId, supplierName }
        }),
      }))

      return {
        data: { ...state.data, groups: newGroups },
        dirtyItemIds: state.dirtyItemIds.includes(itemId)
          ? state.dirtyItemIds
          : [...state.dirtyItemIds, itemId],
      }
    }

    default:
      return state
  }
}

export function useSpreadsheet(initialData: SpreadsheetData) {
  const [state, dispatch] = useReducer(reducer, {
    data: initialData,
    dirtyItemIds: [],
  })

  const updateCell = useCallback(
    (itemId: string, field: string, value: string | number) => {
      dispatch({ type: "UPDATE_CELL", itemId, field, value })
    },
    []
  )

  const updateSupplier = useCallback(
    (
      itemId: string,
      supplierId: string | null,
      supplierName: string | null
    ) => {
      dispatch({ type: "UPDATE_SUPPLIER", itemId, supplierId, supplierName })
    },
    []
  )

  return {
    data: state.data,
    dirtyItemIds: state.dirtyItemIds,
    updateCell,
    updateSupplier,
  }
}
