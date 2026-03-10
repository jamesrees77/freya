"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function getSuppliers() {
  const user = await getCurrentUser()

  const suppliers = await prisma.supplier.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return suppliers
}
