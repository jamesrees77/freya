"use client"

const COLUMNS = [
  { id: "description", label: "Description", align: "left" as const, minWidth: 200 },
  { id: "supplier", label: "Supplier", align: "left" as const, minWidth: 120 },
  { id: "quantity", label: "Qty", align: "right" as const, minWidth: 60 },
  { id: "unit", label: "Unit", align: "left" as const, minWidth: 60 },
  { id: "unitCost", label: "Unit Cost", align: "right" as const, minWidth: 90 },
  { id: "markupPercent", label: "Markup %", align: "right" as const, minWidth: 80 },
  { id: "sellPrice", label: "Sell Price", align: "right" as const, minWidth: 90 },
  { id: "total", label: "Total", align: "right" as const, minWidth: 90 },
]

export function SpreadsheetHeader() {
  return (
    <thead className="sticky top-0 z-20">
      <tr className="bg-[#f3f3f3]">
        {/* Gutter column */}
        <th className="h-6 w-7 border border-gray-200 bg-[#f3f3f3]" />
        {COLUMNS.map((col) => (
          <th
            key={col.id}
            className={`h-6 px-1.5 text-xs font-medium text-gray-600 border border-gray-200 select-none ${
              col.align === "right" ? "text-right" : "text-left"
            }`}
            style={{ minWidth: col.minWidth }}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export { COLUMNS }
