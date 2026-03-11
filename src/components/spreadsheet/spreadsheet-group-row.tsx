"use client"

import type { SpreadsheetGroup } from "./types"
import { calculateGroupTotal, formatCurrency } from "@/lib/calculations"

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
      className="cursor-pointer bg-gray-50 hover:bg-gray-100"
      onClick={onToggle}
    >
      {/* Gutter cell with +/- toggle */}
      <td className="h-6 w-7 border border-gray-200 bg-gray-50 text-center">
        <button
          type="button"
          className="text-[11px] font-medium leading-none text-gray-500"
        >
          {isExpanded ? "−" : "+"}
        </button>
      </td>
      <td
        colSpan={columnCount - 2}
        className="h-6 px-1.5 text-[13px] font-semibold border border-gray-200"
      >
        {group.name}
        <span className="ml-2 text-[11px] text-gray-400 font-normal">
          ({group.items.length} {group.items.length === 1 ? "item" : "items"})
        </span>
      </td>
      <td className="h-6 px-1.5 text-right text-[13px] font-semibold tabular-nums border border-gray-200">
        {formatCurrency(groupTotal)}
      </td>
    </tr>
  )
}
