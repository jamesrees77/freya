"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createGroup(roomId: string, name: string) {
  const user = await getCurrentUser()

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { project: true },
  })
  if (!room || room.project.userId !== user.id) {
    throw new Error("Room not found")
  }

  const maxSort = await prisma.lineItemGroup.aggregate({
    where: { roomId },
    _max: { sortOrder: true },
  })

  const group = await prisma.lineItemGroup.create({
    data: {
      name,
      roomId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  })

  revalidatePath("/dashboard")
  return group
}

export async function updateGroup(id: string, data: { name?: string }) {
  const user = await getCurrentUser()

  const group = await prisma.lineItemGroup.findUnique({
    where: { id },
    include: { room: { include: { project: true } } },
  })
  if (!group || group.room.project.userId !== user.id) {
    throw new Error("Group not found")
  }

  const updated = await prisma.lineItemGroup.update({
    where: { id },
    data,
  })

  return updated
}

export async function deleteGroup(id: string) {
  const user = await getCurrentUser()

  const group = await prisma.lineItemGroup.findUnique({
    where: { id },
    include: { room: { include: { project: true } } },
  })
  if (!group || group.room.project.userId !== user.id) {
    throw new Error("Group not found")
  }

  await prisma.lineItemGroup.delete({ where: { id } })

  // Reorder remaining groups
  const siblings = await prisma.lineItemGroup.findMany({
    where: { roomId: group.roomId },
    orderBy: { sortOrder: "asc" },
  })

  await Promise.all(
    siblings.map((sibling, index) =>
      prisma.lineItemGroup.update({
        where: { id: sibling.id },
        data: { sortOrder: index },
      })
    )
  )

  revalidatePath("/dashboard")
}
