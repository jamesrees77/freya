"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getProjects() {
  const user = await getCurrentUser()

  return prisma.project.findMany({
    where: { userId: user.id },
    include: {
      areas: {
        orderBy: { sortOrder: "asc" },
        include: {
          rooms: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      rooms: {
        where: { areaId: null },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  })
}

export async function createProject(name: string, clientName?: string) {
  const user = await getCurrentUser()

  const maxSort = await prisma.project.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  })

  const project = await prisma.project.create({
    data: {
      name,
      clientName: clientName || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      userId: user.id,
    },
  })

  revalidatePath("/dashboard")
  return project
}

export async function deleteProject(id: string) {
  const user = await getCurrentUser()

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project || project.userId !== user.id) {
    throw new Error("Project not found")
  }

  await prisma.project.delete({ where: { id } })
  revalidatePath("/dashboard")
}
