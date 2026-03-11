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
  ungroupedItems: SpreadsheetLineItem[]
}

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
  areaId: string | null
  project: { userId: string; name: string }
  area: { id: string; name: string } | null
  lineItemGroups: RawLineItemGroup[]
  lineItems: RawLineItem[]
}
