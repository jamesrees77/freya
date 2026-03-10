"use client"

import { createColumnHelper } from "@tanstack/react-table"
import type { SpreadsheetRow } from "./types"
import {
  calculateLineTotal,
  calculateGroupTotal,
  formatCurrency,
  formatPercentage,
} from "@/lib/calculations"

const columnHelper = createColumnHelper<SpreadsheetRow>()

export const columns = [
  columnHelper.display({
    id: "description",
    header: "Description",
    size: 250,
    minSize: 150,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") {
        return null // handled by group row component
      }
      return data.item.description || "\u00A0"
    },
  }),
  columnHelper.display({
    id: "supplier",
    header: "Supplier",
    size: 140,
    minSize: 100,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") return null
      return data.item.supplierName || "\u00A0"
    },
  }),
  columnHelper.display({
    id: "quantity",
    header: "Qty",
    size: 70,
    minSize: 50,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") return null
      return data.item.quantity
    },
  }),
  columnHelper.display({
    id: "unit",
    header: "Unit",
    size: 70,
    minSize: 50,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") return null
      return data.item.unit
    },
  }),
  columnHelper.display({
    id: "unitCost",
    header: "Unit Cost",
    size: 100,
    minSize: 80,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") return null
      return formatCurrency(data.item.unitCost)
    },
  }),
  columnHelper.display({
    id: "markupPercent",
    header: "Markup %",
    size: 80,
    minSize: 60,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") return null
      return formatPercentage(data.item.markupPercent)
    },
  }),
  columnHelper.display({
    id: "sellPrice",
    header: "Sell Price",
    size: 100,
    minSize: 80,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") return null
      return formatCurrency(data.item.sellPrice)
    },
  }),
  columnHelper.display({
    id: "total",
    header: "Total",
    size: 100,
    minSize: 80,
    cell: ({ row }) => {
      const data = row.original
      if (data.type === "group") {
        return formatCurrency(calculateGroupTotal(data.group.items))
      }
      return formatCurrency(
        calculateLineTotal(data.item.quantity, data.item.sellPrice)
      )
    },
  }),
]
