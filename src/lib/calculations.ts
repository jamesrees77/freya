import type { SpreadsheetLineItem, SpreadsheetGroup } from "@/components/spreadsheet/types"

export function calculateSellPrice(unitCost: number, markupPercent: number): number {
  return unitCost * (1 + markupPercent / 100)
}

export function calculateMarkupPercent(unitCost: number, sellPrice: number): number {
  if (unitCost === 0) return 0
  return ((sellPrice - unitCost) / unitCost) * 100
}

export function calculateLineTotal(quantity: number, sellPrice: number): number {
  return quantity * sellPrice
}

export function calculateGroupTotal(items: SpreadsheetLineItem[]): number {
  return items.reduce((sum, item) => {
    return sum + calculateLineTotal(item.quantity, item.sellPrice)
  }, 0)
}

export function calculateRoomTotal(groups: SpreadsheetGroup[], ungroupedItems: SpreadsheetLineItem[] = []): number {
  const groupsTotal = groups.reduce((sum, group) => {
    return sum + calculateGroupTotal(group.items)
  }, 0)
  const ungroupedTotal = ungroupedItems.reduce((sum, item) => {
    return sum + calculateLineTotal(item.quantity, item.sellPrice)
  }, 0)
  return groupsTotal + ungroupedTotal
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
