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
  editValue: string
  onSelect: () => void
  onStartEditing: () => void
  onEditValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onCommit: () => void
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

export function SpreadsheetCell({
  value,
  columnId,
  type,
  align = "left",
  isActive,
  isEditing,
  editValue,
  onSelect,
  onStartEditing,
  onEditValueChange,
  onKeyDown,
  onCommit,
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
        // Select all text so typing replaces it
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

  const handleClick = () => {
    if (!isActive) {
      onSelect()
    } else if (!isEditing) {
      onStartEditing()
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
      // Small delay to allow dropdown clicks to register
      setTimeout(() => {
        if (type === "supplier-dropdown" && showSupplierDropdown) return
        onCommit()
      }, 150)
    }
  }

  const displayValue = formatDisplayValue(value, type)

  // --- UNIT DROPDOWN ---
  if (isEditing && type === "unit-dropdown") {
    return (
      <td
        className={cn(
          "relative h-9 p-0",
          "ring-2 ring-inset ring-primary bg-background"
        )}
      >
        <select
          ref={selectRef}
          value={editValue}
          onChange={(e) => {
            onEditValueChange(e.target.value)
            // Commit immediately on select
            setTimeout(() => onCommit(), 0)
          }}
          onKeyDown={onKeyDown}
          onBlur={handleBlur}
          className="h-full w-full border-0 bg-transparent px-3 text-sm outline-none"
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
      <td
        className={cn(
          "relative h-9 p-0",
          "ring-2 ring-inset ring-primary bg-background"
        )}
        ref={dropdownRef}
      >
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
          placeholder="Search supplier..."
          className="h-full w-full border-0 bg-transparent px-3 text-sm outline-none"
        />
        {showSupplierDropdown && filteredSuppliers.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-px max-h-40 w-56 overflow-auto rounded-md border border-border bg-popover shadow-md">
            {filteredSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault() // Prevent blur
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
          <div className="absolute left-0 top-full z-50 mt-px w-56 rounded-md border border-border bg-popover p-2 shadow-md">
            <p className="text-xs text-muted-foreground">No matching suppliers</p>
          </div>
        )}
      </td>
    )
  }

  // --- EDITING MODE (text / number / currency / percentage) ---
  if (isEditing) {
    return (
      <td
        className={cn(
          "relative h-9 p-0",
          "ring-2 ring-inset ring-primary bg-background"
        )}
      >
        <input
          ref={inputRef}
          type={type === "text" ? "text" : "text"} // Use text type for all — we handle parsing
          inputMode={type === "text" ? "text" : "decimal"}
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={handleBlur}
          className={cn(
            "h-full w-full border-0 bg-transparent px-3 text-sm tabular-nums outline-none",
            align === "right" && "text-right"
          )}
        />
      </td>
    )
  }

  // --- DISPLAY MODE ---
  return (
    <td
      className={cn(
        "relative h-9 cursor-cell select-none px-3 text-sm",
        align === "right" && "text-right tabular-nums",
        isActive
          ? "ring-2 ring-inset ring-primary bg-primary/5"
          : "hover:bg-muted/40"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {type === "text" && !displayValue ? (
        <span className="text-muted-foreground italic">No description</span>
      ) : type === "supplier-dropdown" && !displayValue ? (
        <span className="text-muted-foreground">&mdash;</span>
      ) : (
        displayValue
      )}
    </td>
  )
}

export { getRawEditValue, UNIT_OPTIONS }
