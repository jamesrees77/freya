"use client"

import type { SpreadsheetGroup, SpreadsheetLineItem } from "./types"
import { calculateRoomTotal, formatCurrency } from "@/lib/calculations"

interface SpreadsheetFooterProps {
  groups: SpreadsheetGroup[]
  ungroupedItems?: SpreadsheetLineItem[]
}

export function SpreadsheetFooter({ groups, ungroupedItems = [] }: SpreadsheetFooterProps) {
  const roomTotal = calculateRoomTotal(groups, ungroupedItems)

  return (
    <tfoot>
      <tr className="bg-gray-100">
        {/* Gutter column */}
        <td className="h-6 border border-gray-200 bg-gray-100" />
        <td colSpan={7} className="h-6 px-1.5 text-[13px] font-semibold border border-gray-200">
          Room Total
        </td>
        <td className="h-6 px-1.5 text-right text-[13px] font-bold tabular-nums border border-gray-200">
          {formatCurrency(roomTotal)}
        </td>
      </tr>
    </tfoot>
  )
}
