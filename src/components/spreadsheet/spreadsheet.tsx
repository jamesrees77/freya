"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import type { SpreadsheetData } from "./types"
import { SpreadsheetHeader } from "./spreadsheet-header"
import { SpreadsheetGroupRow } from "./spreadsheet-group-row"
import { SpreadsheetRow } from "./spreadsheet-row"
import { SpreadsheetFooter } from "./spreadsheet-footer"
import { useSpreadsheet } from "@/hooks/use-spreadsheet"
import {
  useCellNavigation,
  EDITABLE_COLUMNS,
  type CellAddress,
} from "@/hooks/use-cell-navigation"
import { getRawEditValue } from "./spreadsheet-cell"

interface SupplierOption {
  id: string
  name: string
}

interface SpreadsheetProps {
  data: SpreadsheetData
  suppliers: SupplierOption[]
}

const NUMERIC_FIELDS = new Set(["quantity", "unitCost", "markupPercent", "sellPrice"])

export function Spreadsheet({ data: initialData, suppliers }: SpreadsheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { data, updateCell, updateSupplier } = useSpreadsheet(initialData)

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    return new Set(data.groups.map((g) => g.id))
  })

  // Flat ordered list of visible row IDs (items in expanded groups only)
  const visibleRowIds = useMemo(() => {
    const ids: string[] = []
    for (const group of data.groups) {
      if (expandedGroups.has(group.id)) {
        for (const item of group.items) {
          ids.push(item.id)
        }
      }
    }
    return ids
  }, [data.groups, expandedGroups])

  // Lookup: item ID → item data
  const itemMap = useMemo(() => {
    const map = new Map<string, (typeof data.groups)[number]["items"][number]>()
    for (const group of data.groups) {
      for (const item of group.items) {
        map.set(item.id, item)
      }
    }
    return map
  }, [data.groups])

  // Get the raw (unformatted) edit value for a cell
  const getCellRawValue = useCallback(
    (cell: CellAddress): string => {
      const item = itemMap.get(cell.rowId)
      if (!item) return ""

      const columnTypeMap: Record<string, string> = {
        description: "text",
        supplier: "supplier-dropdown",
        quantity: "number",
        unit: "unit-dropdown",
        unitCost: "currency",
        markupPercent: "percentage",
        sellPrice: "currency",
      }

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
      const type = columnTypeMap[cell.columnId] ?? "text"
      return getRawEditValue(rawValue, type as any)
    },
    [itemMap]
  )

  // Commit an edit: parse the value and dispatch to state
  const handleCommit = useCallback(
    (cell: CellAddress, rawValue: string) => {
      if (cell.columnId === "supplier") {
        // For supplier, just update the name (text typed). Supplier linking
        // is handled separately via onSupplierSelect.
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

  // Clear a cell (Delete/Backspace on selected cell)
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
  })

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

  // Handle supplier selection from dropdown
  const handleSupplierSelect = useCallback(
    (itemId: string, supplierId: string | null, supplierName: string | null) => {
      updateSupplier(itemId, supplierId, supplierName)
      commitEdit()
    },
    [updateSupplier, commitEdit]
  )

  if (data.groups.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No line item groups yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Groups and items will appear here once created.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      className="overflow-auto rounded-md border border-border outline-none"
    >
      <table className="w-full border-collapse">
        <SpreadsheetHeader />
        <tbody>
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
                onSelectCell={selectCell}
                onStartEditing={startEditing}
                onEditValueChange={setEditValue}
                onCellInputKeyDown={handleCellInputKeyDown}
                onCommitEdit={commitEdit}
                suppliers={suppliers}
                onSupplierSelect={handleSupplierSelect}
              />
            )
          })}
        </tbody>
        <SpreadsheetFooter groups={data.groups} />
      </table>
    </div>
  )
}

interface SupplierOption {
  id: string
  name: string
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
}) {
  return (
    <>
      <SpreadsheetGroupRow
        group={group}
        isExpanded={isExpanded}
        onToggle={onToggle}
        columnCount={EDITABLE_COLUMNS.length + 1}
      />
      {isExpanded &&
        group.items.map((item, index) => (
          <SpreadsheetRow
            key={item.id}
            item={item}
            isEven={index % 2 === 0}
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
          />
        ))}
    </>
  )
}
