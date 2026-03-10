import type { Decimal } from "@prisma/client/runtime/library"

export interface SpreadsheetLineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitCost: number
  markupPercent: number
  sellPrice: number
  sortOrder: number
  supplierId: string | null
  supplierName: string | null
}

export interface SpreadsheetGroup {
  id: string
  name: string
  sortOrder: number
  items: SpreadsheetLineItem[]
}

export interface SpreadsheetData {
  roomId: string
  roomName: string
  projectId: string
  groups: SpreadsheetGroup[]
}

// Row type for TanStack Table — a group header or a line item
export type SpreadsheetRow =
  | { type: "group"; group: SpreadsheetGroup }
  | { type: "item"; item: SpreadsheetLineItem; groupId: string }

// Prisma returns Decimals — this is what we get from the DB before converting
export interface RawLineItem {
  id: string
  description: string
  quantity: Decimal
  unit: string
  unitCost: Decimal
  markupPercent: Decimal
  sellPrice: Decimal
  sortOrder: number
  supplierId: string | null
  supplier: { name: string } | null
}

export interface RawLineItemGroup {
  id: string
  name: string
  sortOrder: number
  lineItems: RawLineItem[]
}

export interface RawRoomData {
  id: string
  name: string
  projectId: string
  project: { userId: string }
  lineItemGroups: RawLineItemGroup[]
}
