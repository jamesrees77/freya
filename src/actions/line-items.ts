"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createLineItem(roomId: string, groupId?: string) {
  const user = await getCurrentUser()

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { project: true },
  })
  if (!room || room.project.userId !== user.id) {
    throw new Error("Room not found")
  }

  if (groupId) {
    const group = await prisma.lineItemGroup.findUnique({ where: { id: groupId } })
    if (!group || group.roomId !== roomId) {
      throw new Error("Group not found")
    }
  }

  const maxSort = await prisma.lineItem.aggregate({
    where: groupId ? { groupId } : { roomId, groupId: null },
    _max: { sortOrder: true },
  })

  const item = await prisma.lineItem.create({
    data: {
      roomId,
      groupId: groupId ?? null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    include: {
      supplier: { select: { name: true } },
    },
  })

  revalidatePath("/dashboard")
  return item
}

export async function updateLineItem(
  id: string,
  data: {
    description?: string
    quantity?: number
    unit?: string
    unitCost?: number
    markupPercent?: number
    sellPrice?: number
    supplierId?: string | null
  }
) {
  const user = await getCurrentUser()

  const item = await prisma.lineItem.findUnique({
    where: { id },
    include: { room: { include: { project: true } } },
  })
  if (!item || item.room.project.userId !== user.id) {
    throw new Error("Line item not found")
  }

  const updated = await prisma.lineItem.update({
    where: { id },
    data,
  })

  return updated
}

export async function deleteLineItem(id: string) {
  const user = await getCurrentUser()

  const item = await prisma.lineItem.findUnique({
    where: { id },
    include: { room: { include: { project: true } } },
  })
  if (!item || item.room.project.userId !== user.id) {
    throw new Error("Line item not found")
  }

  await prisma.lineItem.delete({ where: { id } })

  // Reorder siblings
  const siblings = await prisma.lineItem.findMany({
    where: item.groupId ? { groupId: item.groupId } : { roomId: item.roomId, groupId: null },
    orderBy: { sortOrder: "asc" },
  })

  await Promise.all(
    siblings.map((sibling, index) =>
      prisma.lineItem.update({
        where: { id: sibling.id },
        data: { sortOrder: index },
      })
    )
  )

  revalidatePath("/dashboard")
}
