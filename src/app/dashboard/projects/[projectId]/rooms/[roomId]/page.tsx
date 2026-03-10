import { getRoomWithLineItems } from "@/actions/rooms"
import { redirect } from "next/navigation"
import { Spreadsheet } from "@/components/spreadsheet/spreadsheet"
import type { SpreadsheetData } from "@/components/spreadsheet/types"
import type { RawRoomData } from "@/components/spreadsheet/types"

function toSpreadsheetData(room: RawRoomData): SpreadsheetData {
  return {
    roomId: room.id,
    roomName: room.name,
    projectId: room.projectId,
    groups: room.lineItemGroups.map((group) => ({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      items: group.lineItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitCost: Number(item.unitCost),
        markupPercent: Number(item.markupPercent),
        sellPrice: Number(item.sellPrice),
        sortOrder: item.sortOrder,
        supplierId: item.supplierId,
        supplierName: item.supplier?.name ?? null,
      })),
    })),
  }
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ projectId: string; roomId: string }>
}) {
  const { projectId, roomId } = await params

  const room = await getRoomWithLineItems(roomId)

  if (!room || room.projectId !== projectId) {
    redirect("/dashboard")
  }

  const data = toSpreadsheetData(room as RawRoomData)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">{data.roomName}</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Spreadsheet data={data} />
      </div>
    </div>
  )
}
