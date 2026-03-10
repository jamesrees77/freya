import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  if (!supabaseUser) {
    throw new Error("Not authenticated")
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  })

  if (!user) {
    throw new Error("User not found in database")
  }

  return user
}
