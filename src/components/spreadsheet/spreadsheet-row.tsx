"use client"

import type { SpreadsheetLineItem } from "./types"
import { calculateLineTotal, formatCurrency, formatPercentage } from "@/lib/calculations"

interface SpreadsheetRowProps {
  item: SpreadsheetLineItem
  isEven: boolean
}

export function SpreadsheetRow({ item, isEven }: SpreadsheetRowProps) {
  const lineTotal = calculateLineTotal(item.quantity, item.sellPrice)

  return (
    <tr
      className={
        isEven
          ? "border-b border-border bg-background hover:bg-muted/30"
          : "border-b border-border bg-muted/20 hover:bg-muted/30"
      }
    >
      <td className="h-9 px-3 text-sm">
        {item.description || <span className="text-muted-foreground italic">No description</span>}
      </td>
      <td className="h-9 px-3 text-sm text-muted-foreground">
        {item.supplierName || "\u2014"}
      </td>
      <td className="h-9 px-3 text-right text-sm tabular-nums">
        {item.quantity}
      </td>
      <td className="h-9 px-3 text-sm text-muted-foreground">
        {item.unit}
      </td>
      <td className="h-9 px-3 text-right text-sm tabular-nums">
        {formatCurrency(item.unitCost)}
      </td>
      <td className="h-9 px-3 text-right text-sm tabular-nums">
        {formatPercentage(item.markupPercent)}
      </td>
      <td className="h-9 px-3 text-right text-sm tabular-nums">
        {formatCurrency(item.sellPrice)}
      </td>
      <td className="h-9 px-3 text-right text-sm font-medium tabular-nums">
        {formatCurrency(lineTotal)}
      </td>
    </tr>
  )
}
