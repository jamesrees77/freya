import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RoomPage({
  params,
}: {
  params: Promise<{ projectId: string; roomId: string }>
}) {
  const { projectId, roomId } = await params
  const user = await getCurrentUser()

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { project: true },
  })

  if (!room || room.projectId !== projectId || room.project.userId !== user.id) {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{room.name}</h2>
        <p className="mt-2 text-muted-foreground">
          Spreadsheet view coming in Ticket 3.
        </p>
      </div>
    </div>
  )
}
