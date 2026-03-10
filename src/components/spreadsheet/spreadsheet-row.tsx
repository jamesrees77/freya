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
  isEven: boolean
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
  isEven,
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
}: SpreadsheetRowProps) {
  const lineTotal = calculateLineTotal(item.quantity, item.sellPrice)

  return (
    <tr
      className={
        isEven
          ? "border-b border-border bg-background"
          : "border-b border-border bg-muted/10"
      }
    >
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
            editValue={isCellEditing ? editValue : rawValue}
            onSelect={() =>
              onSelectCell({ rowId: item.id, columnId: config.columnId })
            }
            onStartEditing={onStartEditing}
            onEditValueChange={onEditValueChange}
            onKeyDown={onCellInputKeyDown}
            onCommit={onCommitEdit}
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
      <td
        className="h-9 px-3 text-right text-sm font-medium tabular-nums"
      >
        {formatCurrency(lineTotal)}
      </td>
    </tr>
  )
})
