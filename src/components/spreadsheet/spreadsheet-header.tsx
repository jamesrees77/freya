"use client"

const COLUMNS = [
  { id: "description", label: "Description", align: "left" as const, width: "flex" },
  { id: "supplier", label: "Supplier", align: "left" as const, width: "140px" },
  { id: "quantity", label: "Qty", align: "right" as const, width: "70px" },
  { id: "unit", label: "Unit", align: "left" as const, width: "70px" },
  { id: "unitCost", label: "Unit Cost", align: "right" as const, width: "100px" },
  { id: "markupPercent", label: "Markup %", align: "right" as const, width: "80px" },
  { id: "sellPrice", label: "Sell Price", align: "right" as const, width: "100px" },
  { id: "total", label: "Total", align: "right" as const, width: "100px" },
]

export function SpreadsheetHeader() {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="border-b-2 border-border bg-muted">
        {COLUMNS.map((col) => (
          <th
            key={col.id}
            className={`h-10 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground ${
              col.align === "right" ? "text-right" : "text-left"
            }`}
            style={{ width: col.width === "flex" ? undefined : col.width }}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export { COLUMNS }
