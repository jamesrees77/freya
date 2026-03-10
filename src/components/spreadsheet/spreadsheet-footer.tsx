"use client"

import type { SpreadsheetGroup } from "./types"
import { calculateRoomTotal, formatCurrency } from "@/lib/calculations"

interface SpreadsheetFooterProps {
  groups: SpreadsheetGroup[]
}

export function SpreadsheetFooter({ groups }: SpreadsheetFooterProps) {
  const roomTotal = calculateRoomTotal(groups)

  return (
    <tfoot>
      <tr className="border-t-2 border-border bg-muted">
        <td colSpan={7} className="h-11 px-3 text-sm font-semibold">
          Room Total
        </td>
        <td className="h-11 px-3 text-right text-sm font-bold tabular-nums">
          {formatCurrency(roomTotal)}
        </td>
      </tr>
    </tfoot>
  )
}
