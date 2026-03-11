"use client"

import { useReducer, useCallback } from "react"
import type { SpreadsheetData } from "@/components/spreadsheet/types"
import { calculateSellPrice, calculateMarkupPercent } from "@/lib/calculations"

const MAX_HISTORY = 50

type SpreadsheetAction =
  | { type: "UPDATE_CELL"; itemId: string; field: string; value: string | number }
  | { type: "UPDATE_SUPPLIER"; itemId: string; supplierId: string | null; supplierName: string | null }
  | { type: "BATCH_UPDATE"; updates: Array<{ itemId: string; field: string; value: string | number }> }
  | { type: "UNDO" }
  | { type: "REDO" }

interface SpreadsheetState {
  data: SpreadsheetData
  dirtyItemIds: string[]
  history: SpreadsheetData[]
  future: SpreadsheetData[]
}

/** Apply a single cell update to data, including bidirectional recalculation */
function applyCellUpdate(
  data: SpreadsheetData,
  itemId: string,
  field: string,
  value: string | number
): SpreadsheetData {
  const newGroups = data.groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.id !== itemId) return item
      const updated = { ...item, [field]: value }

      // Bidirectional recalculation
      if (field === "unitCost") {
        updated.sellPrice = calculateSellPrice(updated.unitCost, updated.markupPercent)
      } else if (field === "markupPercent") {
        updated.sellPrice = calculateSellPrice(updated.unitCost, updated.markupPercent)
      } else if (field === "sellPrice") {
        updated.markupPercent = calculateMarkupPercent(updated.unitCost, updated.sellPrice)
      }

      return updated
    }),
  }))
  return { ...data, groups: newGroups }
}

/** Apply a supplier update to data */
function applySupplierUpdate(
  data: SpreadsheetData,
  itemId: string,
  supplierId: string | null,
  supplierName: string | null
): SpreadsheetData {
  const newGroups = data.groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.id !== itemId) return item
      return { ...item, supplierId, supplierName }
    }),
  }))
  return { ...data, groups: newGroups }
}

/** Add an item to the dirty list if not already present */
function markDirty(dirtyItemIds: string[], itemId: string): string[] {
  return dirtyItemIds.includes(itemId) ? dirtyItemIds : [...dirtyItemIds, itemId]
}

/** Push current data onto history, capped at MAX_HISTORY */
function pushHistory(history: SpreadsheetData[], data: SpreadsheetData): SpreadsheetData[] {
  const newHistory = [...history, data]
  if (newHistory.length > MAX_HISTORY) newHistory.shift()
  return newHistory
}

function reducer(state: SpreadsheetState, action: SpreadsheetAction): SpreadsheetState {
  switch (action.type) {
    case "UPDATE_CELL": {
      const { itemId, field, value } = action
      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: applyCellUpdate(state.data, itemId, field, value),
        dirtyItemIds: markDirty(state.dirtyItemIds, itemId),
      }
    }

    case "UPDATE_SUPPLIER": {
      const { itemId, supplierId, supplierName } = action
      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: applySupplierUpdate(state.data, itemId, supplierId, supplierName),
        dirtyItemIds: markDirty(state.dirtyItemIds, itemId),
      }
    }

    case "BATCH_UPDATE": {
      let newData = state.data
      let newDirtyIds = [...state.dirtyItemIds]

      for (const update of action.updates) {
        newData = applyCellUpdate(newData, update.itemId, update.field, update.value)
        newDirtyIds = markDirty(newDirtyIds, update.itemId)
      }

      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: newData,
        dirtyItemIds: newDirtyIds,
      }
    }

    case "UNDO": {
      if (state.history.length === 0) return state
      const previous = state.history[state.history.length - 1]
      return {
        ...state,
        data: previous,
        history: state.history.slice(0, -1),
        future: [state.data, ...state.future],
      }
    }

    case "REDO": {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        ...state,
        data: next,
        history: [...state.history, state.data],
        future: state.future.slice(1),
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
    history: [],
    future: [],
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

  const batchUpdate = useCallback(
    (updates: Array<{ itemId: string; field: string; value: string | number }>) => {
      dispatch({ type: "BATCH_UPDATE", updates })
    },
    []
  )

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: "REDO" })
  }, [])

  return {
    data: state.data,
    dirtyItemIds: state.dirtyItemIds,
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
    updateCell,
    updateSupplier,
    batchUpdate,
    undo,
    redo,
  }
}
