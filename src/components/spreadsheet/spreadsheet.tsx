"use client"

import { useState } from "react"
import type { SpreadsheetData } from "./types"
import { SpreadsheetHeader, COLUMNS } from "./spreadsheet-header"
import { SpreadsheetGroupRow } from "./spreadsheet-group-row"
import { SpreadsheetRow } from "./spreadsheet-row"
import { SpreadsheetFooter } from "./spreadsheet-footer"

interface SpreadsheetProps {
  data: SpreadsheetData
}

export function Spreadsheet({ data }: SpreadsheetProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // All groups expanded by default
    return new Set(data.groups.map((g) => g.id))
  })

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  if (data.groups.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No line item groups yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Groups and items will appear here once created.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-md border border-border">
      <table className="w-full border-collapse">
        <SpreadsheetHeader />
        <tbody>
          {data.groups.map((group) => {
            const isExpanded = expandedGroups.has(group.id)
            return (
              <GroupSection
                key={group.id}
                group={group}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(group.id)}
              />
            )
          })}
        </tbody>
        <SpreadsheetFooter groups={data.groups} />
      </table>
    </div>
  )
}

function GroupSection({
  group,
  isExpanded,
  onToggle,
}: {
  group: SpreadsheetData["groups"][number]
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <SpreadsheetGroupRow
        group={group}
        isExpanded={isExpanded}
        onToggle={onToggle}
        columnCount={COLUMNS.length}
      />
      {isExpanded &&
        group.items.map((item, index) => (
          <SpreadsheetRow
            key={item.id}
            item={item}
            isEven={index % 2 === 0}
          />
        ))}
    </>
  )
}
