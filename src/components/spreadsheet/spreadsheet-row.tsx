"use client"

import { memo } from "react"
import type { SpreadsheetLineItem } from "./types"
import { SpreadsheetCell, getRawEditValue } from "./spreadsheet-cell"
import type { CellType } from "./spreadsheet-cell"
import { calculateLineTotal, formatCurrency } from "@/lib/calculations"
import type { CellAddress } from "@/hooks/use-cell-navigation"

interface SupplierOption {
  id: string
  name: string
}

interface SpreadsheetRowProps {
  item: SpreadsheetLineItem
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
  isCellSelected?: (rowId: string, columnId: string) => boolean
  onExtendSelection?: (cell: CellAddress) => void
  onStartDragSelection?: (cell: CellAddress) => void
  onUpdateDragSelection?: (cell: CellAddress) => void
}

interface CellConfig {
  columnId: string
  type: CellType
  align: "left" | "right"
  getValue: (item: SpreadsheetLineItem) => string | number
}

const CELL_CONFIGS: CellConfig[] = [
  { columnId: "description", type: "text", align: "left", getValue: (item) => item.description },
  { columnId: "supplier", type: "supplier-dropdown", align: "left", getValue: (item) => item.supplierName ?? "" },
  { columnId: "quantity", type: "number", align: "right", getValue: (item) => item.quantity },
  { columnId: "unit", type: "unit-dropdown", align: "left", getValue: (item) => item.unit },
  { columnId: "unitCost", type: "currency", align: "right", getValue: (item) => item.unitCost },
  { columnId: "markupPercent", type: "percentage", align: "right", getValue: (item) => item.markupPercent },
  { columnId: "sellPrice", type: "currency", align: "right", getValue: (item) => item.sellPrice },
]

export const SpreadsheetRow = memo(function SpreadsheetRow({
  item,
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
  isCellSelected,
  onExtendSelection,
  onStartDragSelection,
  onUpdateDragSelection,
}: SpreadsheetRowProps) {
  const lineTotal = calculateLineTotal(item.quantity, item.sellPrice)

  return (
    <tr className="bg-white">
      {/* Gutter column */}
      <td className="h-6 w-7 border border-gray-200 bg-gray-50" />
      {CELL_CONFIGS.map((config) => {
        const isCellActive =
          activeCell?.rowId === item.id &&
          activeCell?.columnId === config.columnId
        const isCellEditing = isCellActive && isEditing
        const cellValue = config.getValue(item)
        const rawValue = isCellEditing
          ? editValue
          : getRawEditValue(cellValue, config.type)

        return (
          <SpreadsheetCell
            key={config.columnId}
            value={cellValue}
            columnId={config.columnId}
            type={config.type}
            align={config.align}
            isActive={isCellActive}
            isEditing={isCellEditing}
            isSelected={isCellSelected?.(item.id, config.columnId) ?? false}
            editValue={isCellEditing ? editValue : rawValue}
            onSelect={() =>
              onSelectCell({ rowId: item.id, columnId: config.columnId })
            }
            onStartEditing={onStartEditing}
            onEditValueChange={onEditValueChange}
            onKeyDown={onCellInputKeyDown}
            onCommit={onCommitEdit}
            onExtendSelection={
              onExtendSelection
                ? () => onExtendSelection({ rowId: item.id, columnId: config.columnId })
                : undefined
            }
            onStartDragSelection={
              onStartDragSelection
                ? () => onStartDragSelection({ rowId: item.id, columnId: config.columnId })
                : undefined
            }
            onUpdateDragSelection={
              onUpdateDragSelection
                ? () => onUpdateDragSelection({ rowId: item.id, columnId: config.columnId })
                : undefined
            }
            suppliers={config.type === "supplier-dropdown" ? suppliers : undefined}
            onSupplierSelect={
              config.type === "supplier-dropdown"
                ? (supplierId, supplierName) =>
                    onSupplierSelect(item.id, supplierId, supplierName)
                : undefined
            }
          />
        )
      })}
      {/* Total column — NOT editable */}
      <td className="h-6 px-1.5 text-right text-[13px] font-medium tabular-nums leading-6 border border-gray-200 bg-gray-50">
        {formatCurrency(lineTotal)}
      </td>
    </tr>
  )
})
