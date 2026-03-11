import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const user = await getCurrentUser()

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      rooms: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  })

  if (!project || project.userId !== user.id) {
    redirect("/dashboard")
  }

  // Redirect to first room if one exists
  if (project.rooms.length > 0) {
    redirect(`/dashboard/projects/${projectId}/rooms/${project.rooms[0].id}`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create a room in the sidebar to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
