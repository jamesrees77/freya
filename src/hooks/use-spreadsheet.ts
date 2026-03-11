"use client"

import { useReducer, useCallback } from "react"
import type { SpreadsheetData, SpreadsheetLineItem } from "@/components/spreadsheet/types"
import { calculateSellPrice, calculateMarkupPercent } from "@/lib/calculations"

const MAX_HISTORY = 50

type SpreadsheetAction =
  | { type: "UPDATE_CELL"; itemId: string; field: string; value: string | number }
  | { type: "UPDATE_SUPPLIER"; itemId: string; supplierId: string | null; supplierName: string | null }
  | { type: "BATCH_UPDATE"; updates: Array<{ itemId: string; field: string; value: string | number }> }
  | { type: "ADD_ITEM"; item: SpreadsheetLineItem; groupId?: string }
  | { type: "DELETE_ITEM"; itemId: string }
  | { type: "ADD_GROUP"; group: { id: string; name: string; sortOrder: number } }
  | { type: "DELETE_GROUP"; groupId: string }
  | { type: "UPDATE_GROUP_NAME"; groupId: string; name: string }
  | { type: "CLEAR_DIRTY"; itemIds: string[] }
  | { type: "UNDO" }
  | { type: "REDO" }

interface SpreadsheetState {
  data: SpreadsheetData
  dirtyItemIds: string[]
  history: SpreadsheetData[]
  future: SpreadsheetData[]
}

/** Apply a single cell update to data, including bidirectional recalculation.
 *  Searches both grouped and ungrouped items. */
function applyCellUpdate(
  data: SpreadsheetData,
  itemId: string,
  field: string,
  value: string | number
): SpreadsheetData {
  const updateItem = (item: SpreadsheetLineItem): SpreadsheetLineItem => {
    if (item.id !== itemId) return item
    const updated = { ...item, [field]: value }

    if (field === "unitCost" || field === "markupPercent") {
      updated.sellPrice = calculateSellPrice(updated.unitCost, updated.markupPercent)
    } else if (field === "sellPrice") {
      updated.markupPercent = calculateMarkupPercent(updated.unitCost, updated.sellPrice)
    }

    return updated
  }

  return {
    ...data,
    groups: data.groups.map((group) => ({
      ...group,
      items: group.items.map(updateItem),
    })),
    ungroupedItems: data.ungroupedItems.map(updateItem),
  }
}

/** Apply a supplier update to data */
function applySupplierUpdate(
  data: SpreadsheetData,
  itemId: string,
  supplierId: string | null,
  supplierName: string | null
): SpreadsheetData {
  const updateItem = (item: SpreadsheetLineItem): SpreadsheetLineItem => {
    if (item.id !== itemId) return item
    return { ...item, supplierId, supplierName }
  }

  return {
    ...data,
    groups: data.groups.map((group) => ({
      ...group,
      items: group.items.map(updateItem),
    })),
    ungroupedItems: data.ungroupedItems.map(updateItem),
  }
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

    case "ADD_ITEM": {
      const { item, groupId } = action
      const newData = { ...state.data }

      if (groupId) {
        newData.groups = newData.groups.map((group) => {
          if (group.id !== groupId) return group
          return { ...group, items: [...group.items, item] }
        })
      } else {
        newData.ungroupedItems = [...newData.ungroupedItems, item]
      }

      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: newData,
      }
    }

    case "DELETE_ITEM": {
      const { itemId } = action
      const newData = {
        ...state.data,
        groups: state.data.groups.map((group) => ({
          ...group,
          items: group.items.filter((item) => item.id !== itemId),
        })),
        ungroupedItems: state.data.ungroupedItems.filter((item) => item.id !== itemId),
      }

      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: newData,
        dirtyItemIds: state.dirtyItemIds.filter((id) => id !== itemId),
      }
    }

    case "ADD_GROUP": {
      const { group } = action
      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: {
          ...state.data,
          groups: [...state.data.groups, { ...group, items: [] }],
        },
      }
    }

    case "DELETE_GROUP": {
      const { groupId } = action
      const deletedGroup = state.data.groups.find((g) => g.id === groupId)
      const deletedItemIds = deletedGroup ? deletedGroup.items.map((i) => i.id) : []

      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: {
          ...state.data,
          groups: state.data.groups.filter((g) => g.id !== groupId),
        },
        dirtyItemIds: state.dirtyItemIds.filter((id) => !deletedItemIds.includes(id)),
      }
    }

    case "UPDATE_GROUP_NAME": {
      const { groupId, name } = action
      return {
        ...state,
        history: pushHistory(state.history, state.data),
        future: [],
        data: {
          ...state.data,
          groups: state.data.groups.map((group) =>
            group.id === groupId ? { ...group, name } : group
          ),
        },
      }
    }

    case "CLEAR_DIRTY": {
      return {
        ...state,
        dirtyItemIds: state.dirtyItemIds.filter((id) => !action.itemIds.includes(id)),
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

  const addItem = useCallback(
    (item: SpreadsheetLineItem, groupId?: string) => {
      dispatch({ type: "ADD_ITEM", item, groupId })
    },
    []
  )

  const deleteItem = useCallback(
    (itemId: string) => {
      dispatch({ type: "DELETE_ITEM", itemId })
    },
    []
  )

  const addGroup = useCallback(
    (group: { id: string; name: string; sortOrder: number }) => {
      dispatch({ type: "ADD_GROUP", group })
    },
    []
  )

  const deleteGroup = useCallback(
    (groupId: string) => {
      dispatch({ type: "DELETE_GROUP", groupId })
    },
    []
  )

  const updateGroupName = useCallback(
    (groupId: string, name: string) => {
      dispatch({ type: "UPDATE_GROUP_NAME", groupId, name })
    },
    []
  )

  const clearDirty = useCallback(
    (itemIds: string[]) => {
      dispatch({ type: "CLEAR_DIRTY", itemIds })
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
    addItem,
    deleteItem,
    addGroup,
    deleteGroup,
    updateGroupName,
    clearDirty,
    undo,
    redo,
  }
}
