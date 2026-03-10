"use client"

import { useState, useCallback, useRef } from "react"

export interface CellAddress {
  rowId: string
  columnId: string
}

export const EDITABLE_COLUMNS = [
  "description",
  "supplier",
  "quantity",
  "unit",
  "unitCost",
  "markupPercent",
  "sellPrice",
] as const

export type EditableColumn = (typeof EDITABLE_COLUMNS)[number]

const NUMERIC_FIELDS = new Set(["quantity", "unitCost", "markupPercent", "sellPrice"])

interface UseCellNavigationProps {
  visibleRowIds: string[]
  onCommit: (cell: CellAddress, rawValue: string) => void
  onClearCell: (cell: CellAddress) => void
  getCellRawValue: (cell: CellAddress) => string
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useCellNavigation({
  visibleRowIds,
  onCommit,
  onClearCell,
  getCellRawValue,
  containerRef,
}: UseCellNavigationProps) {
  const [activeCell, setActiveCell] = useState<CellAddress | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const previousValueRef = useRef("")

  const focusContainer = useCallback(() => {
    // Delay to let React finish rendering before focusing
    requestAnimationFrame(() => {
      containerRef.current?.focus()
    })
  }, [containerRef])

  const selectCell = useCallback(
    (cell: CellAddress) => {
      // If currently editing, commit first
      if (isEditing && activeCell) {
        onCommit(activeCell, editValue)
      }
      setActiveCell(cell)
      setIsEditing(false)
      setEditValue("")
      focusContainer()
    },
    [isEditing, activeCell, editValue, onCommit, focusContainer]
  )

  const startEditing = useCallback(
    (initialValue?: string) => {
      if (!activeCell) return
      const raw =
        initialValue !== undefined
          ? initialValue
          : getCellRawValue(activeCell)
      previousValueRef.current = getCellRawValue(activeCell)
      setEditValue(raw)
      setIsEditing(true)
    },
    [activeCell, getCellRawValue]
  )

  const commitEdit = useCallback(() => {
    if (!activeCell) return
    onCommit(activeCell, editValue)
    setIsEditing(false)
    setEditValue("")
    focusContainer()
  }, [activeCell, editValue, onCommit, focusContainer])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditValue("")
    focusContainer()
  }, [focusContainer])

  // Move to an adjacent cell. Returns the new cell if moved, null if at boundary.
  const moveCell = useCallback(
    (
      direction: "up" | "down" | "left" | "right"
    ): CellAddress | null => {
      if (!activeCell) return null

      const rowIdx = visibleRowIds.indexOf(activeCell.rowId)
      const colIdx = EDITABLE_COLUMNS.indexOf(
        activeCell.columnId as EditableColumn
      )
      if (rowIdx === -1 || colIdx === -1) return null

      let newRowIdx = rowIdx
      let newColIdx = colIdx

      switch (direction) {
        case "up":
          newRowIdx = Math.max(0, rowIdx - 1)
          break
        case "down":
          newRowIdx = Math.min(visibleRowIds.length - 1, rowIdx + 1)
          break
        case "left":
          newColIdx = Math.max(0, colIdx - 1)
          break
        case "right":
          newColIdx = Math.min(EDITABLE_COLUMNS.length - 1, colIdx + 1)
          break
      }

      const newCell: CellAddress = {
        rowId: visibleRowIds[newRowIdx],
        columnId: EDITABLE_COLUMNS[newColIdx],
      }
      setActiveCell(newCell)
      setIsEditing(false)
      setEditValue("")
      return newCell
    },
    [activeCell, visibleRowIds]
  )

  // Tab navigation: move right, wrapping to next row
  const moveTab = useCallback(
    (reverse: boolean) => {
      if (!activeCell) return

      const rowIdx = visibleRowIds.indexOf(activeCell.rowId)
      const colIdx = EDITABLE_COLUMNS.indexOf(
        activeCell.columnId as EditableColumn
      )
      if (rowIdx === -1 || colIdx === -1) return

      let newRowIdx = rowIdx
      let newColIdx = colIdx

      if (reverse) {
        newColIdx--
        if (newColIdx < 0) {
          newColIdx = EDITABLE_COLUMNS.length - 1
          newRowIdx = Math.max(0, newRowIdx - 1)
        }
      } else {
        newColIdx++
        if (newColIdx >= EDITABLE_COLUMNS.length) {
          newColIdx = 0
          newRowIdx = Math.min(visibleRowIds.length - 1, newRowIdx + 1)
        }
      }

      const newCell: CellAddress = {
        rowId: visibleRowIds[newRowIdx],
        columnId: EDITABLE_COLUMNS[newColIdx],
      }
      setActiveCell(newCell)
      setIsEditing(false)
      setEditValue("")
    },
    [activeCell, visibleRowIds]
  )

  // Handler for keyboard events on the spreadsheet container (when NOT editing)
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) return
      if (!activeCell) return

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          moveCell("up")
          break
        case "ArrowDown":
          e.preventDefault()
          moveCell("down")
          break
        case "ArrowLeft":
          e.preventDefault()
          moveCell("left")
          break
        case "ArrowRight":
          e.preventDefault()
          moveCell("right")
          break
        case "Tab":
          e.preventDefault()
          moveTab(e.shiftKey)
          break
        case "Enter":
          e.preventDefault()
          startEditing()
          break
        case "F2":
          e.preventDefault()
          startEditing()
          break
        case "Delete":
        case "Backspace":
          e.preventDefault()
          onClearCell(activeCell)
          break
        case "Escape":
          e.preventDefault()
          setActiveCell(null)
          break
        default: {
          // Printable character → enter edit mode with that character
          if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            e.preventDefault()
            startEditing(e.key)
          }
          break
        }
      }
    },
    [isEditing, activeCell, moveCell, moveTab, startEditing, onClearCell]
  )

  // Handler for keyboard events on the cell input (when editing)
  const handleCellInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Tab":
          e.preventDefault()
          e.stopPropagation()
          commitEdit()
          moveTab(e.shiftKey)
          break
        case "Enter":
          e.preventDefault()
          e.stopPropagation()
          commitEdit()
          if (e.shiftKey) {
            moveCell("up")
          } else {
            moveCell("down")
          }
          break
        case "Escape":
          e.preventDefault()
          e.stopPropagation()
          cancelEdit()
          break
      }
    },
    [commitEdit, cancelEdit, moveCell, moveTab]
  )

  return {
    activeCell,
    isEditing,
    editValue,
    setEditValue,
    selectCell,
    startEditing,
    commitEdit,
    cancelEdit,
    handleContainerKeyDown,
    handleCellInputKeyDown,
  }
}
