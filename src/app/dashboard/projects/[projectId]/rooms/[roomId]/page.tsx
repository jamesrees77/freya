import { getRoomWithLineItems } from "@/actions/rooms"
import { getSuppliers } from "@/actions/suppliers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Spreadsheet } from "@/components/spreadsheet/spreadsheet"
import type { SpreadsheetData } from "@/components/spreadsheet/types"
import type { RawRoomData } from "@/components/spreadsheet/types"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function toSpreadsheetData(room: RawRoomData): SpreadsheetData {
  const mapItem = (item: RawRoomData["lineItemGroups"][number]["lineItems"][number]) => ({
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
  })

  return {
    roomId: room.id,
    roomName: room.name,
    projectId: room.projectId,
    groups: room.lineItemGroups.map((group) => ({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      items: group.lineItems.map(mapItem),
    })),
    ungroupedItems: room.lineItems.map(mapItem),
  }
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ projectId: string; roomId: string }>
}) {
  const { projectId, roomId } = await params

  const [room, suppliers] = await Promise.all([
    getRoomWithLineItems(roomId),
    getSuppliers(),
  ])

  if (!room || room.projectId !== projectId) {
    redirect("/dashboard")
  }

  const data = toSpreadsheetData(room as RawRoomData)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={`/dashboard/projects/${projectId}`} />}>
                {room.project.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {room.area && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{room.area.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{data.roomName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex-1 overflow-auto">
        <Spreadsheet data={data} suppliers={suppliers} />
      </div>
    </div>
  )
}
