"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPercentage } from "@/lib/calculations"

export type CellType = "text" | "number" | "currency" | "percentage" | "unit-dropdown" | "supplier-dropdown"

interface SupplierOption {
  id: string
  name: string
}

interface SpreadsheetCellProps {
  value: string | number
  columnId: string
  type: CellType
  align?: "left" | "right"
  isActive: boolean
  isEditing: boolean
  isSelected?: boolean
  editValue: string
  onSelect: () => void
  onStartEditing: () => void
  onEditValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onCommit: () => void
  onExtendSelection?: () => void
  onStartDragSelection?: () => void
  onUpdateDragSelection?: () => void
  // Dropdown options
  suppliers?: SupplierOption[]
  onSupplierSelect?: (supplierId: string | null, supplierName: string | null) => void
}

const UNIT_OPTIONS = ["each", "m", "sqm", "m²", "hrs", "days", "set", "pair", "roll"]

function formatDisplayValue(value: string | number, type: CellType): string {
  if (type === "currency") return formatCurrency(value as number)
  if (type === "percentage") return formatPercentage(value as number)
  if (type === "number") {
    const n = value as number
    return n % 1 === 0 ? String(n) : n.toFixed(2)
  }
  if (value === "" || value === null || value === undefined) return ""
  return String(value)
}

function getRawEditValue(value: string | number, type: CellType): string {
  if (type === "currency" || type === "percentage" || type === "number") {
    const n = value as number
    if (n === 0) return ""
    return String(n)
  }
  return String(value ?? "")
}

// Base cell classes shared across all states
const BASE_CELL = "relative h-6 p-0 text-[13px] leading-6 border border-gray-200"
const ACTIVE_OUTLINE = "outline outline-2 outline-blue-600 -outline-offset-1 z-10"
const SELECTED_BG = "bg-[#d4e4fc]"

export function SpreadsheetCell({
  value,
  type,
  align = "left",
  isActive,
  isEditing,
  isSelected = false,
  editValue,
  onSelect,
  onStartEditing,
  onEditValueChange,
  onKeyDown,
  onCommit,
  onExtendSelection,
  onStartDragSelection,
  onUpdateDragSelection,
  suppliers,
  onSupplierSelect,
}: SpreadsheetCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const [supplierFilter, setSupplierFilter] = useState("")
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const dropdownRef = useRef<HTMLTableCellElement>(null)

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      if (type === "unit-dropdown") {
        selectRef.current?.focus()
      } else if (type === "supplier-dropdown") {
        inputRef.current?.focus()
        setSupplierFilter(editValue)
        setShowSupplierDropdown(true)
      } else {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    } else {
      setShowSupplierDropdown(false)
    }
  }, [isEditing, type, editValue])

  // Close supplier dropdown on outside click
  useEffect(() => {
    if (!showSupplierDropdown) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showSupplierDropdown])

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && onExtendSelection) {
      onExtendSelection()
      return
    }
    if (!isActive) {
      onSelect()
    } else if (!isEditing) {
      onStartEditing()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!e.shiftKey && onStartDragSelection) {
      onStartDragSelection()
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (e.buttons === 1 && onUpdateDragSelection) {
      onUpdateDragSelection()
    }
  }

  const handleDoubleClick = () => {
    if (!isEditing) {
      onSelect()
      onStartEditing()
    }
  }

  const handleBlur = () => {
    if (isEditing) {
      setTimeout(() => {
        if (type === "supplier-dropdown" && showSupplierDropdown) return
        onCommit()
      }, 150)
    }
  }

  const displayValue = formatDisplayValue(value, type)

  const inputClasses = cn(
    "h-full w-full border-0 bg-transparent px-1.5 text-[13px] leading-6 tabular-nums outline-none",
    align === "right" && "text-right"
  )

  // --- UNIT DROPDOWN ---
  if (isEditing && type === "unit-dropdown") {
    return (
      <td className={cn(BASE_CELL, ACTIVE_OUTLINE)}>
        <select
          ref={selectRef}
          value={editValue}
          onChange={(e) => {
            onEditValueChange(e.target.value)
            setTimeout(() => onCommit(), 0)
          }}
          onKeyDown={onKeyDown}
          onBlur={handleBlur}
          className="h-full w-full border-0 bg-transparent px-1 text-[13px] leading-6 outline-none"
        >
          {UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </td>
    )
  }

  // --- SUPPLIER DROPDOWN ---
  if (isEditing && type === "supplier-dropdown") {
    const filteredSuppliers = (suppliers ?? []).filter((s) =>
      s.name.toLowerCase().includes(supplierFilter.toLowerCase())
    )

    return (
      <td className={cn(BASE_CELL, ACTIVE_OUTLINE)} ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => {
            onEditValueChange(e.target.value)
            setSupplierFilter(e.target.value)
            setShowSupplierDropdown(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredSuppliers.length > 0) {
              e.preventDefault()
              e.stopPropagation()
              const match = filteredSuppliers[0]
              onSupplierSelect?.(match.id, match.name)
              setShowSupplierDropdown(false)
              return
            }
            onKeyDown(e)
          }}
          onBlur={handleBlur}
          placeholder="Search..."
          className={inputClasses}
        />
        {showSupplierDropdown && filteredSuppliers.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-px max-h-40 w-56 overflow-auto border border-gray-300 bg-white shadow-sm">
            {filteredSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                className="flex w-full items-center px-2 py-1 text-left text-[13px] hover:bg-blue-50"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSupplierSelect?.(supplier.id, supplier.name)
                  setShowSupplierDropdown(false)
                }}
              >
                {supplier.name}
              </button>
            ))}
          </div>
        )}
        {showSupplierDropdown && editValue && filteredSuppliers.length === 0 && (
          <div className="absolute left-0 top-full z-50 mt-px w-56 border border-gray-300 bg-white p-2 shadow-sm">
            <p className="text-xs text-gray-400">No matching suppliers</p>
          </div>
        )}
      </td>
    )
  }

  // --- EDITING MODE (text / number / currency / percentage) ---
  if (isEditing) {
    return (
      <td className={cn(BASE_CELL, ACTIVE_OUTLINE)}>
        <input
          ref={inputRef}
          type="text"
          inputMode={type === "text" ? "text" : "decimal"}
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={handleBlur}
          className={inputClasses}
        />
      </td>
    )
  }

  // --- DISPLAY MODE ---
  return (
    <td
      className={cn(
        BASE_CELL,
        "cursor-cell select-none px-1.5 truncate",
        align === "right" && "text-right tabular-nums",
        isActive && ACTIVE_OUTLINE,
        isSelected && !isActive && SELECTED_BG,
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onDoubleClick={handleDoubleClick}
    >
      {type === "text" && !displayValue ? (
        <span className="text-gray-400 italic">No description</span>
      ) : type === "supplier-dropdown" && !displayValue ? (
        <span className="text-gray-300">&mdash;</span>
      ) : (
        displayValue
      )}
    </td>
  )
}

export { getRawEditValue, UNIT_OPTIONS }
