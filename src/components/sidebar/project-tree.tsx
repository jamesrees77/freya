"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  ChevronRightIcon,
  FolderIcon,
  LayoutGridIcon,
  DoorOpenIcon,
  Trash2Icon,
  MoreHorizontalIcon,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CreateAreaDialog } from "./create-area-dialog"
import { CreateRoomDialog } from "./create-room-dialog"
import { deleteProject } from "@/actions/projects"
import { deleteArea } from "@/actions/areas"
import { deleteRoom } from "@/actions/rooms"

type Room = {
  id: string
  name: string
  sortOrder: number
}

type Area = {
  id: string
  name: string
  sortOrder: number
  rooms: Room[]
}

type Project = {
  id: string
  name: string
  clientName: string | null
  areas: Area[]
  rooms: Room[] // rooms not in any area
}

export function ProjectTree({ projects }: { projects: Project[] }) {
  const pathname = usePathname()

  if (projects.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <p className="px-4 py-2 text-sm text-muted-foreground">
            No projects yet
          </p>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              pathname={pathname}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function ProjectItem({
  project,
  pathname,
}: {
  project: Project
  pathname: string
}) {
  const router = useRouter()
  const [createAreaOpen, setCreateAreaOpen] = useState(false)
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isActive = pathname.startsWith(`/dashboard/projects/${project.id}`)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProject(project.id)
      router.push("/dashboard")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <Collapsible defaultOpen={isActive}>
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}`)
                }
              />
            }
          >
            <ChevronRightIcon className="transition-transform group-data-[open]/collapsible:rotate-90" />
            <FolderIcon className="size-4" />
            <span className="truncate">{project.name}</span>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<SidebarMenuAction />}
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={() => setCreateRoomOpen(true)}>
                <DoorOpenIcon className="size-4" />
                Add room
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateAreaOpen(true)}>
                <LayoutGridIcon className="size-4" />
                Add area
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive"
              >
                <Trash2Icon className="size-4" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CollapsibleContent>
            <SidebarMenuSub>
              {/* Areas with their rooms */}
              {project.areas.map((area) => (
                <AreaItem
                  key={area.id}
                  area={area}
                  projectId={project.id}
                  pathname={pathname}
                />
              ))}

              {/* Rooms not in any area */}
              {project.rooms.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  projectId={project.id}
                  pathname={pathname}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>

      <CreateAreaDialog
        projectId={project.id}
        open={createAreaOpen}
        onOpenChange={setCreateAreaOpen}
      />
      <CreateRoomDialog
        projectId={project.id}
        open={createRoomOpen}
        onOpenChange={setCreateRoomOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{project.name}&quot; and all its
              areas, rooms, and line items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AreaItem({
  area,
  projectId,
  pathname,
}: {
  area: Area
  projectId: string
  pathname: string
}) {
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hasActiveRoom = area.rooms.some(
    (room) =>
      pathname === `/dashboard/projects/${projectId}/rooms/${room.id}`
  )

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteArea(area.id)
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <SidebarMenuSubItem>
        <Collapsible defaultOpen={hasActiveRoom}>
          <div className="flex items-center">
            <CollapsibleTrigger
              render={
                <SidebarMenuSubButton className="flex-1" />
              }
            >
              <ChevronRightIcon className="size-3 transition-transform group-data-[open]/collapsible:rotate-90" />
              <LayoutGridIcon className="size-3.5" />
              <span className="truncate">{area.name}</span>
            </CollapsibleTrigger>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="mr-1 rounded-sm p-0.5 opacity-0 hover:bg-sidebar-accent group-hover/menu-sub-item:opacity-100" />
                }
              >
                <MoreHorizontalIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={() => setCreateRoomOpen(true)}>
                  <DoorOpenIcon className="size-4" />
                  Add room
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive"
                >
                  <Trash2Icon className="size-4" />
                  Delete area
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CollapsibleContent>
            <SidebarMenuSub>
              {area.rooms.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  projectId={projectId}
                  pathname={pathname}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>

      <CreateRoomDialog
        projectId={projectId}
        areaId={area.id}
        open={createRoomOpen}
        onOpenChange={setCreateRoomOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete area?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{area.name}&quot; and all its
              rooms and line items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function RoomItem({
  room,
  projectId,
  pathname,
}: {
  room: Room
  projectId: string
  pathname: string
}) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const roomPath = `/dashboard/projects/${projectId}/rooms/${room.id}`
  const isActive = pathname === roomPath

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRoom(room.id)
      if (isActive) {
        router.push(`/dashboard/projects/${projectId}`)
      }
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          onClick={() => router.push(roomPath)}
          data-active={isActive}
        >
          <DoorOpenIcon className="size-3.5" />
          <span className="truncate">{room.name}</span>
        </SidebarMenuSubButton>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="mr-1 rounded-sm p-0.5 opacity-0 hover:bg-sidebar-accent group-hover/menu-sub-item:opacity-100" />
            }
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive"
            >
              <Trash2Icon className="size-4" />
              Delete room
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuSubItem>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{room.name}&quot; and all its
              line items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
