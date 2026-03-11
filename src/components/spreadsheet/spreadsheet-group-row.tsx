"use client"

import { useState, useRef, useEffect } from "react"
import type { SpreadsheetGroup } from "./types"
import { calculateGroupTotal, formatCurrency } from "@/lib/calculations"

interface SpreadsheetGroupRowProps {
  group: SpreadsheetGroup
  isExpanded: boolean
  onToggle: () => void
  columnCount: number
  onUpdateGroupName?: (groupId: string, name: string) => void
  onDeleteGroup?: (groupId: string) => void
  onAddItem?: (groupId: string) => void
}

export function SpreadsheetGroupRow({
  group,
  isExpanded,
  onToggle,
  columnCount,
  onUpdateGroupName,
  onDeleteGroup,
  onAddItem,
}: SpreadsheetGroupRowProps) {
  const groupTotal = calculateGroupTotal(group.items)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  const commitName = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== group.name && onUpdateGroupName) {
      onUpdateGroupName(group.id, trimmed)
    } else {
      setEditName(group.name)
    }
    setIsEditingName(false)
  }

  return (
    <tr
      className="group/grouprow cursor-pointer bg-gray-50 hover:bg-gray-100"
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
        <span className="flex items-center gap-2">
          {isEditingName ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitName()
                } else if (e.key === "Escape") {
                  setEditName(group.name)
                  setIsEditingName(false)
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-48 rounded border border-blue-400 bg-white px-1 text-[13px] font-semibold outline-none"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (onUpdateGroupName) {
                  setEditName(group.name)
                  setIsEditingName(true)
                }
              }}
            >
              {group.name}
            </span>
          )}
          <span className="text-[11px] text-gray-400 font-normal">
            ({group.items.length} {group.items.length === 1 ? "item" : "items"})
          </span>
          {onAddItem && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onAddItem(group.id)
              }}
              className="hidden text-[11px] text-blue-500 hover:text-blue-700 group-hover/grouprow:inline"
            >
              + Item
            </button>
          )}
          {onDeleteGroup && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteGroup(group.id)
              }}
              className="hidden text-[11px] text-gray-400 hover:text-red-500 group-hover/grouprow:inline"
            >
              &times;
            </button>
          )}
        </span>
      </td>
      <td className="h-6 px-1.5 text-right text-[13px] font-semibold tabular-nums border border-gray-200">
        {formatCurrency(groupTotal)}
      </td>
    </tr>
  )
}
