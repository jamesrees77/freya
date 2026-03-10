"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createRoom(
  projectId: string,
  name: string,
  areaId?: string
) {
  const user = await getCurrentUser()

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.userId !== user.id) {
    throw new Error("Project not found")
  }

  if (areaId) {
    const area = await prisma.area.findUnique({ where: { id: areaId } })
    if (!area || area.projectId !== projectId) {
      throw new Error("Area not found")
    }
  }

  const maxSort = await prisma.room.aggregate({
    where: { projectId, areaId: areaId || null },
    _max: { sortOrder: true },
  })

  const room = await prisma.room.create({
    data: {
      name,
      projectId,
      areaId: areaId || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  })

  revalidatePath("/dashboard")
  return room
}

export async function deleteRoom(id: string) {
  const user = await getCurrentUser()

  const room = await prisma.room.findUnique({
    where: { id },
    include: { project: true },
  })
  if (!room || room.project.userId !== user.id) {
    throw new Error("Room not found")
  }

  await prisma.room.delete({ where: { id } })
  revalidatePath("/dashboard")
}
