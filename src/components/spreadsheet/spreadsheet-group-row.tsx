"use client"

import { ChevronRight } from "lucide-react"
import type { SpreadsheetGroup } from "./types"
import { calculateGroupTotal, formatCurrency } from "@/lib/calculations"
import { cn } from "@/lib/utils"

interface SpreadsheetGroupRowProps {
  group: SpreadsheetGroup
  isExpanded: boolean
  onToggle: () => void
  columnCount: number
}

export function SpreadsheetGroupRow({
  group,
  isExpanded,
  onToggle,
  columnCount,
}: SpreadsheetGroupRowProps) {
  const groupTotal = calculateGroupTotal(group.items)

  return (
    <tr
      className="group cursor-pointer border-b border-border bg-muted/50 hover:bg-muted/80"
      onClick={onToggle}
    >
      <td
        colSpan={columnCount - 1}
        className="h-10 px-3 text-sm font-semibold"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
          <span>{group.name}</span>
          <span className="text-xs text-muted-foreground">
            ({group.items.length} {group.items.length === 1 ? "item" : "items"})
          </span>
        </div>
      </td>
      <td className="h-10 px-3 text-right text-sm font-semibold">
        {formatCurrency(groupTotal)}
      </td>
    </tr>
  )
}
