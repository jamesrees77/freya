"use client"

import { useState, useCallback } from "react"
import { EDITABLE_COLUMNS, type CellAddress, type EditableColumn } from "./use-cell-navigation"

export interface SelectionRange {
  anchor: CellAddress
  end: CellAddress
}

interface UseSelectionProps {
  visibleRowIds: string[]
}

export function useSelection({ visibleRowIds }: UseSelectionProps) {
  const [selectionAnchor, setSelectionAnchor] = useState<CellAddress | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<CellAddress | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  /** Set single-cell selection (regular click) */
  const setAnchor = useCallback((cell: CellAddress) => {
    setSelectionAnchor(cell)
    setSelectionEnd(null)
  }, [])

  /** Extend selection from anchor to cell (Shift+click or Shift+Arrow) */
  const extendTo = useCallback(
    (cell: CellAddress) => {
      if (!selectionAnchor) {
        setSelectionAnchor(cell)
        return
      }
      setSelectionEnd(cell)
    },
    [selectionAnchor]
  )

  /** Start drag selection */
  const startDrag = useCallback((cell: CellAddress) => {
    setSelectionAnchor(cell)
    setSelectionEnd(null)
    setIsDragging(true)
  }, [])

  /** Update drag selection (mousemove) */
  const updateDrag = useCallback(
    (cell: CellAddress) => {
      if (!isDragging) return
      setSelectionEnd(cell)
    },
    [isDragging]
  )

  /** End drag selection (mouseup) */
  const endDrag = useCallback(() => {
    setIsDragging(false)
  }, [])

  /** Clear multi-cell selection (keep anchor as single cell) */
  const clearSelection = useCallback(() => {
    setSelectionEnd(null)
  }, [])

  /** Check if a cell falls within the selected rectangle */
  const isCellSelected = useCallback(
    (rowId: string, columnId: string): boolean => {
      if (!selectionAnchor || !selectionEnd) return false

      const anchorRowIdx = visibleRowIds.indexOf(selectionAnchor.rowId)
      const endRowIdx = visibleRowIds.indexOf(selectionEnd.rowId)
      const cellRowIdx = visibleRowIds.indexOf(rowId)

      const anchorColIdx = EDITABLE_COLUMNS.indexOf(selectionAnchor.columnId as EditableColumn)
      const endColIdx = EDITABLE_COLUMNS.indexOf(selectionEnd.columnId as EditableColumn)
      const cellColIdx = EDITABLE_COLUMNS.indexOf(columnId as EditableColumn)

      if (cellRowIdx === -1 || cellColIdx === -1) return false

      const minRow = Math.min(anchorRowIdx, endRowIdx)
      const maxRow = Math.max(anchorRowIdx, endRowIdx)
      const minCol = Math.min(anchorColIdx, endColIdx)
      const maxCol = Math.max(anchorColIdx, endColIdx)

      return (
        cellRowIdx >= minRow &&
        cellRowIdx <= maxRow &&
        cellColIdx >= minCol &&
        cellColIdx <= maxCol
      )
    },
    [selectionAnchor, selectionEnd, visibleRowIds]
  )

  /** Get the selected rectangle as arrays of row IDs and column IDs */
  const getSelectedRect = useCallback((): {
    rows: string[]
    columns: string[]
  } | null => {
    if (!selectionAnchor) return null

    if (!selectionEnd) {
      // Single cell selected
      return {
        rows: [selectionAnchor.rowId],
        columns: [selectionAnchor.columnId],
      }
    }

    const anchorRowIdx = visibleRowIds.indexOf(selectionAnchor.rowId)
    const endRowIdx = visibleRowIds.indexOf(selectionEnd.rowId)
    const anchorColIdx = EDITABLE_COLUMNS.indexOf(selectionAnchor.columnId as EditableColumn)
    const endColIdx = EDITABLE_COLUMNS.indexOf(selectionEnd.columnId as EditableColumn)

    if (anchorRowIdx === -1 || endRowIdx === -1 || anchorColIdx === -1 || endColIdx === -1) {
      return null
    }

    const minRow = Math.min(anchorRowIdx, endRowIdx)
    const maxRow = Math.max(anchorRowIdx, endRowIdx)
    const minCol = Math.min(anchorColIdx, endColIdx)
    const maxCol = Math.max(anchorColIdx, endColIdx)

    const rows = visibleRowIds.slice(minRow, maxRow + 1)
    const columns = EDITABLE_COLUMNS.slice(minCol, maxCol + 1) as string[]

    return { rows, columns }
  }, [selectionAnchor, selectionEnd, visibleRowIds])

  return {
    selectionAnchor,
    selectionEnd,
    hasSelection: selectionAnchor !== null && selectionEnd !== null,
    isDragging,
    isCellSelected,
    setAnchor,
    extendTo,
    startDrag,
    updateDrag,
    endDrag,
    clearSelection,
    getSelectedRect,
  }
}
