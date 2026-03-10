import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { syncUser } from "@/actions/users"
import { getProjects } from "@/actions/projects"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Ensure user record exists in our database
  await syncUser(user.id, user.email!)

  const projects = await getProjects()
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar projects={projects} />
      <SidebarInset>
        {children}
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
