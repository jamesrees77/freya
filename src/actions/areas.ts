"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createArea(projectId: string, name: string) {
  const user = await getCurrentUser()

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.userId !== user.id) {
    throw new Error("Project not found")
  }

  const maxSort = await prisma.area.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  })

  const area = await prisma.area.create({
    data: {
      name,
      projectId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  })

  revalidatePath("/dashboard")
  return area
}

export async function deleteArea(id: string) {
  const user = await getCurrentUser()

  const area = await prisma.area.findUnique({
    where: { id },
    include: { project: true },
  })
  if (!area || area.project.userId !== user.id) {
    throw new Error("Area not found")
  }

  await prisma.area.delete({ where: { id } })
  revalidatePath("/dashboard")
}
