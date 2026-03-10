import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

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
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          {project.name}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Create a room in the sidebar to get started.
        </p>
      </div>
    </div>
  )
}
