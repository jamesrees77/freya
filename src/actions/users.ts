"use server"

import { prisma } from "@/lib/prisma"

export async function syncUser(supabaseId: string, email: string) {
  const user = await prisma.user.upsert({
    where: { supabaseId },
    update: { email },
    create: { supabaseId, email },
  })

  return user
}
