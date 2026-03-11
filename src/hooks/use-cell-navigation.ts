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

interface UseCellNavigationProps {
  visibleRowIds: string[]
  onCommit: (cell: CellAddress, rawValue: string) => void
  onClearCell: (cell: CellAddress) => void
  getCellRawValue: (cell: CellAddress) => string
  containerRef: React.RefObject<HTMLDivElement | null>
  // Undo/redo
  onUndo?: () => void
  onRedo?: () => void
  // Copy/paste
  onCopy?: () => void
  onPaste?: () => void
  onCut?: () => void
  // Selection
  onExtendSelection?: (direction: "up" | "down" | "left" | "right") => void
  onClearSelection?: () => void
}

export function useCellNavigation({
  visibleRowIds,
  onCommit,
  onClearCell,
  getCellRawValue,
  containerRef,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onExtendSelection,
  onClearSelection,
}: UseCellNavigationProps) {
  const [activeCell, setActiveCell] = useState<CellAddress | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const previousValueRef = useRef("")

  const focusContainer = useCallback(() => {
    requestAnimationFrame(() => {
      containerRef.current?.focus()
    })
  }, [containerRef])

  const selectCell = useCallback(
    (cell: CellAddress) => {
      if (isEditing && activeCell) {
        onCommit(activeCell, editValue)
      }
      setActiveCell(cell)
      setIsEditing(false)
      setEditValue("")
      onClearSelection?.()
      focusContainer()
    },
    [isEditing, activeCell, editValue, onCommit, focusContainer, onClearSelection]
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
      onClearSelection?.()
    },
    [activeCell, getCellRawValue, onClearSelection]
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

  const moveCell = useCallback(
    (direction: "up" | "down" | "left" | "right"): CellAddress | null => {
      if (!activeCell) return null

      const rowIdx = visibleRowIds.indexOf(activeCell.rowId)
      const colIdx = EDITABLE_COLUMNS.indexOf(activeCell.columnId as EditableColumn)
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

  const moveTab = useCallback(
    (reverse: boolean) => {
      if (!activeCell) return

      const rowIdx = visibleRowIds.indexOf(activeCell.rowId)
      const colIdx = EDITABLE_COLUMNS.indexOf(activeCell.columnId as EditableColumn)
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

  // Handler for keyboard events on the spreadsheet container
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl/Cmd shortcuts — work even when editing (for undo/redo)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault()
            if (isEditing) commitEdit()
            if (e.shiftKey) {
              onRedo?.()
            } else {
              onUndo?.()
            }
            return
          case "y":
            e.preventDefault()
            if (isEditing) commitEdit()
            onRedo?.()
            return
          case "c":
            if (!isEditing) {
              e.preventDefault()
              onCopy?.()
            }
            return
          case "v":
            if (!isEditing) {
              e.preventDefault()
              onPaste?.()
            }
            return
          case "x":
            if (!isEditing) {
              e.preventDefault()
              onCut?.()
            }
            return
        }
      }

      if (isEditing) return
      if (!activeCell) return

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          if (e.shiftKey) {
            onExtendSelection?.("up")
          } else {
            onClearSelection?.()
            moveCell("up")
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (e.shiftKey) {
            onExtendSelection?.("down")
          } else {
            onClearSelection?.()
            moveCell("down")
          }
          break
        case "ArrowLeft":
          e.preventDefault()
          if (e.shiftKey) {
            onExtendSelection?.("left")
          } else {
            onClearSelection?.()
            moveCell("left")
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (e.shiftKey) {
            onExtendSelection?.("right")
          } else {
            onClearSelection?.()
            moveCell("right")
          }
          break
        case "Tab":
          e.preventDefault()
          onClearSelection?.()
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
          onClearSelection?.()
          break
        default: {
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            startEditing(e.key)
          }
          break
        }
      }
    },
    [
      isEditing,
      activeCell,
      moveCell,
      moveTab,
      startEditing,
      commitEdit,
      onClearCell,
      onUndo,
      onRedo,
      onCopy,
      onPaste,
      onCut,
      onExtendSelection,
      onClearSelection,
    ]
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
    setActiveCell,
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
