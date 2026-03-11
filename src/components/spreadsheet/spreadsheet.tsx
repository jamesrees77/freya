"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import type { SpreadsheetData, SpreadsheetLineItem } from "./types"
import { SpreadsheetHeader } from "./spreadsheet-header"
import { SpreadsheetGroupRow } from "./spreadsheet-group-row"
import { SpreadsheetRow } from "./spreadsheet-row"
import { SpreadsheetFooter } from "./spreadsheet-footer"
import { useSpreadsheet } from "@/hooks/use-spreadsheet"
import { useAutoSave, type SaveStatus } from "@/hooks/use-auto-save"
import {
  useCellNavigation,
  EDITABLE_COLUMNS,
  type CellAddress,
  type EditableColumn,
} from "@/hooks/use-cell-navigation"
import { useSelection } from "@/hooks/use-selection"
import { getRawEditValue, type CellType } from "./spreadsheet-cell"
import { createLineItem, deleteLineItem } from "@/actions/line-items"
import { createGroup, updateGroup, deleteGroup as deleteGroupAction } from "@/actions/line-item-groups"

interface SupplierOption {
  id: string
  name: string
}

interface SpreadsheetProps {
  data: SpreadsheetData
  suppliers: SupplierOption[]
}

const NUMERIC_FIELDS = new Set(["quantity", "unitCost", "markupPercent", "sellPrice"])

// Total columns: gutter(1) + data columns(7) + total(1) = 9
const TOTAL_COLUMN_COUNT = 10

const COLUMN_TYPE_MAP: Record<string, string> = {
  description: "text",
  supplier: "supplier-dropdown",
  quantity: "number",
  unit: "unit-dropdown",
  unitCost: "currency",
  markupPercent: "percentage",
  sellPrice: "currency",
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "saved") {
    return <span className="text-xs text-gray-400">Saved</span>
  }
  if (status === "saving") {
    return <span className="text-xs text-amber-500">Saving...</span>
  }
  return <span className="text-xs text-red-500">Save error</span>
}

export function Spreadsheet({ data: initialData, suppliers }: SpreadsheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    data,
    dirtyItemIds,
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
  } = useSpreadsheet(initialData)

  const { saveStatus } = useAutoSave({
    data,
    dirtyItemIds,
    clearDirty,
  })

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    return new Set(data.groups.map((g) => g.id))
  })

  // Flat ordered list of visible row IDs (ungrouped items + grouped items)
  const visibleRowIds = useMemo(() => {
    const ids: string[] = []
    // Ungrouped items first
    for (const item of data.ungroupedItems) {
      ids.push(item.id)
    }
    // Then grouped items
    for (const group of data.groups) {
      if (expandedGroups.has(group.id)) {
        for (const item of group.items) {
          ids.push(item.id)
        }
      }
    }
    return ids
  }, [data.groups, data.ungroupedItems, expandedGroups])

  // Lookup: item ID → item data
  const itemMap = useMemo(() => {
    const map = new Map<string, SpreadsheetLineItem>()
    for (const item of data.ungroupedItems) {
      map.set(item.id, item)
    }
    for (const group of data.groups) {
      for (const item of group.items) {
        map.set(item.id, item)
      }
    }
    return map
  }, [data.groups, data.ungroupedItems])

  // Selection hook
  const selection = useSelection({ visibleRowIds })

  // Get the raw (unformatted) edit value for a cell
  const getCellRawValue = useCallback(
    (cell: CellAddress): string => {
      const item = itemMap.get(cell.rowId)
      if (!item) return ""

      const valueMap: Record<string, string | number> = {
        description: item.description,
        supplier: item.supplierName ?? "",
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        markupPercent: item.markupPercent,
        sellPrice: item.sellPrice,
      }

      const rawValue = valueMap[cell.columnId] ?? ""
      const type = COLUMN_TYPE_MAP[cell.columnId] ?? "text"
      return getRawEditValue(rawValue, type as CellType)
    },
    [itemMap]
  )

  // Get display value for copy
  const getCellDisplayValue = useCallback(
    (cell: CellAddress): string => {
      const item = itemMap.get(cell.rowId)
      if (!item) return ""

      switch (cell.columnId) {
        case "description":
          return item.description
        case "supplier":
          return item.supplierName ?? ""
        case "quantity":
          return item.quantity % 1 === 0 ? String(item.quantity) : item.quantity.toFixed(2)
        case "unit":
          return item.unit
        case "unitCost":
          return String(item.unitCost)
        case "markupPercent":
          return String(item.markupPercent)
        case "sellPrice":
          return String(item.sellPrice)
        default:
          return ""
      }
    },
    [itemMap]
  )

  // Commit an edit
  const handleCommit = useCallback(
    (cell: CellAddress, rawValue: string) => {
      if (cell.columnId === "supplier") {
        updateSupplier(cell.rowId, null, rawValue || null)
        return
      }

      if (NUMERIC_FIELDS.has(cell.columnId)) {
        const parsed = parseFloat(rawValue)
        const numValue = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
        updateCell(cell.rowId, cell.columnId, numValue)
      } else {
        updateCell(cell.rowId, cell.columnId, rawValue)
      }
    },
    [updateCell, updateSupplier]
  )

  // Clear a cell
  const handleClearCell = useCallback(
    (cell: CellAddress) => {
      if (cell.columnId === "supplier") {
        updateSupplier(cell.rowId, null, null)
      } else if (NUMERIC_FIELDS.has(cell.columnId)) {
        updateCell(cell.rowId, cell.columnId, 0)
      } else if (cell.columnId === "unit") {
        updateCell(cell.rowId, cell.columnId, "each")
      } else {
        updateCell(cell.rowId, cell.columnId, "")
      }
    },
    [updateCell, updateSupplier]
  )

  // We need activeCell for copy/paste/selection, but it comes from useCellNavigation.
  const activeCellRef = useRef<CellAddress | null>(null)

  // --- Copy ---
  const handleCopy = useCallback(() => {
    const rect = selection.getSelectedRect()
    const cell = activeCellRef.current

    if (!rect && cell) {
      const val = getCellDisplayValue(cell)
      navigator.clipboard.writeText(val).catch(() => {})
      return
    }

    if (!rect) return

    const lines: string[] = []
    for (const rowId of rect.rows) {
      const cells: string[] = []
      for (const colId of rect.columns) {
        cells.push(getCellDisplayValue({ rowId, columnId: colId }))
      }
      lines.push(cells.join("\t"))
    }
    navigator.clipboard.writeText(lines.join("\n")).catch(() => {})
  }, [selection, getCellDisplayValue])

  // --- Paste ---
  const handlePaste = useCallback(async () => {
    const cell = activeCellRef.current
    if (!cell) return

    try {
      const text = await navigator.clipboard.readText()
      if (!text) return

      const rows = text.split("\n").filter((line) => line.length > 0)
      const grid = rows.map((row) => row.split("\t"))

      const startRowIdx = visibleRowIds.indexOf(cell.rowId)
      const startColIdx = EDITABLE_COLUMNS.indexOf(cell.columnId as EditableColumn)
      if (startRowIdx === -1 || startColIdx === -1) return

      const updates: Array<{ itemId: string; field: string; value: string | number }> = []

      for (let r = 0; r < grid.length; r++) {
        const targetRowIdx = startRowIdx + r
        if (targetRowIdx >= visibleRowIds.length) break
        const targetRowId = visibleRowIds[targetRowIdx]

        for (let c = 0; c < grid[r].length; c++) {
          const targetColIdx = startColIdx + c
          if (targetColIdx >= EDITABLE_COLUMNS.length) break
          const targetColId = EDITABLE_COLUMNS[targetColIdx]
          const pastedValue = grid[r][c]

          if (targetColId === "supplier") continue

          if (NUMERIC_FIELDS.has(targetColId)) {
            const parsed = parseFloat(pastedValue)
            const numValue = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
            updates.push({ itemId: targetRowId, field: targetColId, value: numValue })
          } else {
            updates.push({ itemId: targetRowId, field: targetColId, value: pastedValue })
          }
        }
      }

      if (updates.length > 0) {
        batchUpdate(updates)
      }
    } catch {
      // Clipboard access denied
    }
  }, [visibleRowIds, batchUpdate])

  // --- Cut ---
  const handleCut = useCallback(() => {
    handleCopy()

    const rect = selection.getSelectedRect()
    if (rect && (rect.rows.length > 1 || rect.columns.length > 1)) {
      const updates: Array<{ itemId: string; field: string; value: string | number }> = []
      for (const rowId of rect.rows) {
        for (const colId of rect.columns) {
          if (colId === "supplier") continue
          if (NUMERIC_FIELDS.has(colId)) {
            updates.push({ itemId: rowId, field: colId, value: 0 })
          } else if (colId === "unit") {
            updates.push({ itemId: rowId, field: colId, value: "each" })
          } else {
            updates.push({ itemId: rowId, field: colId, value: "" })
          }
        }
      }
      if (updates.length > 0) batchUpdate(updates)
    } else {
      const cell = activeCellRef.current
      if (cell) handleClearCell(cell)
    }
  }, [handleCopy, selection, batchUpdate, handleClearCell])

  // --- Extend selection (Shift+Arrow) ---
  const handleExtendSelectionDir = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      const cell = activeCellRef.current
      if (!cell) return

      const currentEnd = selection.selectionEnd ?? cell
      const rowIdx = visibleRowIds.indexOf(currentEnd.rowId)
      const colIdx = EDITABLE_COLUMNS.indexOf(currentEnd.columnId as EditableColumn)
      if (rowIdx === -1 || colIdx === -1) return

      let newRowIdx = rowIdx
      let newColIdx = colIdx

      switch (direction) {
        case "up":
          newRowIdx = Math.max(0, rowIdx - 1)
          break
        case "down":
          newRowIdx = Math.min(visibleRowIds.length - 1, rowIdx + 1)
          break
        case "left":
          newColIdx = Math.max(0, colIdx - 1)
          break
        case "right":
          newColIdx = Math.min(EDITABLE_COLUMNS.length - 1, colIdx + 1)
          break
      }

      if (!selection.selectionAnchor) {
        selection.setAnchor(cell)
      }
      selection.extendTo({
        rowId: visibleRowIds[newRowIdx],
        columnId: EDITABLE_COLUMNS[newColIdx],
      })
    },
    [selection, visibleRowIds]
  )

  const {
    activeCell,
    isEditing,
    editValue,
    setEditValue,
    selectCell,
    startEditing,
    commitEdit,
    handleContainerKeyDown,
    handleCellInputKeyDown,
  } = useCellNavigation({
    visibleRowIds,
    onCommit: handleCommit,
    onClearCell: handleClearCell,
    getCellRawValue,
    containerRef,
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onCut: handleCut,
    onExtendSelection: handleExtendSelectionDir,
    onClearSelection: selection.clearSelection,
  })

  // Keep the ref in sync with activeCell
  activeCellRef.current = activeCell

  // When cell is selected, also update selection anchor
  const handleSelectCell = useCallback(
    (cell: CellAddress) => {
      selectCell(cell)
      selection.setAnchor(cell)
    },
    [selectCell, selection]
  )

  // Extend selection (Shift+click)
  const handleExtendSelectionToCell = useCallback(
    (cell: CellAddress) => {
      const current = activeCellRef.current
      if (!current) {
        handleSelectCell(cell)
        return
      }
      if (!selection.selectionAnchor) {
        selection.setAnchor(current)
      }
      selection.extendTo(cell)
    },
    [selection, handleSelectCell]
  )

  // Drag selection
  const handleStartDragSelection = useCallback(
    (cell: CellAddress) => {
      selection.startDrag(cell)
    },
    [selection]
  )

  const handleUpdateDragSelection = useCallback(
    (cell: CellAddress) => {
      selection.updateDrag(cell)
    },
    [selection]
  )

  const handleMouseUp = useCallback(() => {
    selection.endDrag()
  }, [selection])

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleSupplierSelect = useCallback(
    (itemId: string, supplierId: string | null, supplierName: string | null) => {
      updateSupplier(itemId, supplierId, supplierName)
      commitEdit()
    },
    [updateSupplier, commitEdit]
  )

  // --- Add/Delete handlers ---
  const handleAddItem = useCallback(
    async (groupId?: string) => {
      try {
        const created = await createLineItem(data.roomId, groupId)
        const newItem: SpreadsheetLineItem = {
          id: created.id,
          description: "",
          quantity: 1,
          unit: "each",
          unitCost: 0,
          markupPercent: 0,
          sellPrice: 0,
          sortOrder: created.sortOrder,
          supplierId: null,
          supplierName: null,
        }
        addItem(newItem, groupId)
      } catch {
        // TODO: toast error
      }
    },
    [data.roomId, addItem]
  )

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      try {
        await deleteLineItem(itemId)
        deleteItem(itemId)
      } catch {
        // TODO: toast error
      }
    },
    [deleteItem]
  )

  const handleAddGroup = useCallback(async () => {
    try {
      const created = await createGroup(data.roomId, "New Group")
      addGroup({ id: created.id, name: created.name, sortOrder: created.sortOrder })
      setExpandedGroups((prev) => new Set([...prev, created.id]))
    } catch {
      // TODO: toast error
    }
  }, [data.roomId, addGroup])

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      try {
        await deleteGroupAction(groupId)
        deleteGroup(groupId)
      } catch {
        // TODO: toast error
      }
    },
    [deleteGroup]
  )

  const handleUpdateGroupName = useCallback(
    async (groupId: string, name: string) => {
      updateGroupName(groupId, name)
      try {
        await updateGroup(groupId, { name })
      } catch {
        // TODO: toast error / revert
      }
    },
    [updateGroupName]
  )

  const hasContent = data.groups.length > 0 || data.ungroupedItems.length > 0

  if (!hasContent) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="text-center">
          <p className="text-muted-foreground">No items yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an item or create a group to get started.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAddItem()}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            + Add Item
          </button>
          <button
            type="button"
            onClick={handleAddGroup}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            + Add Group
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end px-2">
        <SaveStatusIndicator status={saveStatus} />
      </div>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleContainerKeyDown}
        onMouseUp={handleMouseUp}
        className="overflow-auto border border-border bg-white outline-none"
      >
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <SpreadsheetHeader />
          <tbody>
            {/* Ungrouped items */}
            {data.ungroupedItems.map((item) => (
              <SpreadsheetRow
                key={item.id}
                item={item}
                activeCell={activeCell}
                isEditing={isEditing}
                editValue={editValue}
                onSelectCell={handleSelectCell}
                onStartEditing={startEditing}
                onEditValueChange={setEditValue}
                onCellInputKeyDown={handleCellInputKeyDown}
                onCommitEdit={commitEdit}
                suppliers={suppliers}
                onSupplierSelect={handleSupplierSelect}
                onDeleteItem={handleDeleteItem}
                isCellSelected={selection.isCellSelected}
                onExtendSelection={handleExtendSelectionToCell}
                onStartDragSelection={handleStartDragSelection}
                onUpdateDragSelection={handleUpdateDragSelection}
              />
            ))}
            {/* Grouped items */}
            {data.groups.map((group) => {
              const isExpanded = expandedGroups.has(group.id)
              return (
                <GroupSection
                  key={group.id}
                  group={group}
                  isExpanded={isExpanded}
                  onToggle={() => toggleGroup(group.id)}
                  activeCell={activeCell}
                  isEditing={isEditing}
                  editValue={editValue}
                  onSelectCell={handleSelectCell}
                  onStartEditing={startEditing}
                  onEditValueChange={setEditValue}
                  onCellInputKeyDown={handleCellInputKeyDown}
                  onCommitEdit={commitEdit}
                  suppliers={suppliers}
                  onSupplierSelect={handleSupplierSelect}
                  onDeleteItem={handleDeleteItem}
                  onAddItem={handleAddItem}
                  onDeleteGroup={handleDeleteGroup}
                  onUpdateGroupName={handleUpdateGroupName}
                  isCellSelected={selection.isCellSelected}
                  onExtendSelection={handleExtendSelectionToCell}
                  onStartDragSelection={handleStartDragSelection}
                  onUpdateDragSelection={handleUpdateDragSelection}
                />
              )
            })}
          </tbody>
          <SpreadsheetFooter groups={data.groups} ungroupedItems={data.ungroupedItems} />
        </table>
      </div>
      {/* Action buttons */}
      <div className="flex gap-2 px-2">
        <button
          type="button"
          onClick={() => handleAddItem()}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
        >
          + Add Item
        </button>
        <button
          type="button"
          onClick={handleAddGroup}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
        >
          + Add Group
        </button>
      </div>
    </div>
  )
}

function GroupSection({
  group,
  isExpanded,
  onToggle,
  activeCell,
  isEditing,
  editValue,
  onSelectCell,
  onStartEditing,
  onEditValueChange,
  onCellInputKeyDown,
  onCommitEdit,
  suppliers,
  onSupplierSelect,
  onDeleteItem,
  onAddItem,
  onDeleteGroup,
  onUpdateGroupName,
  isCellSelected,
  onExtendSelection,
  onStartDragSelection,
  onUpdateDragSelection,
}: {
  group: SpreadsheetData["groups"][number]
  isExpanded: boolean
  onToggle: () => void
  activeCell: CellAddress | null
  isEditing: boolean
  editValue: string
  onSelectCell: (cell: CellAddress) => void
  onStartEditing: () => void
  onEditValueChange: (value: string) => void
  onCellInputKeyDown: (e: React.KeyboardEvent) => void
  onCommitEdit: () => void
  suppliers: SupplierOption[]
  onSupplierSelect: (itemId: string, supplierId: string | null, supplierName: string | null) => void
  onDeleteItem: (itemId: string) => void
  onAddItem: (groupId?: string) => void
  onDeleteGroup: (groupId: string) => void
  onUpdateGroupName: (groupId: string, name: string) => void
  isCellSelected: (rowId: string, columnId: string) => boolean
  onExtendSelection: (cell: CellAddress) => void
  onStartDragSelection: (cell: CellAddress) => void
  onUpdateDragSelection: (cell: CellAddress) => void
}) {
  return (
    <>
      <SpreadsheetGroupRow
        group={group}
        isExpanded={isExpanded}
        onToggle={onToggle}
        columnCount={TOTAL_COLUMN_COUNT}
        onUpdateGroupName={onUpdateGroupName}
        onDeleteGroup={onDeleteGroup}
        onAddItem={onAddItem}
      />
      {isExpanded &&
        group.items.map((item) => (
          <SpreadsheetRow
            key={item.id}
            item={item}
            activeCell={activeCell}
            isEditing={isEditing}
            editValue={editValue}
            onSelectCell={onSelectCell}
            onStartEditing={onStartEditing}
            onEditValueChange={onEditValueChange}
            onCellInputKeyDown={onCellInputKeyDown}
            onCommitEdit={onCommitEdit}
            suppliers={suppliers}
            onSupplierSelect={onSupplierSelect}
            onDeleteItem={onDeleteItem}
            isCellSelected={isCellSelected}
            onExtendSelection={onExtendSelection}
            onStartDragSelection={onStartDragSelection}
            onUpdateDragSelection={onUpdateDragSelection}
          />
        ))}
    </>
  )
}

interface SupplierOption {
  id: string
  name: string
}
