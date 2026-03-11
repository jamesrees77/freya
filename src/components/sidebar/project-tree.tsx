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
import { cn } from "@/lib/utils"

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
  rooms: Room[]
}

export function ProjectTree({ projects }: { projects: Project[] }) {
  const pathname = usePathname()

  if (projects.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <p className="px-3 py-2 text-xs text-sidebar-foreground/50">
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

// ─── Project ────────────────────────────────────────────────────────────────

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
  const hasChildren =
    project.areas.length > 0 || project.rooms.length > 0

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
      {/* group/collapsible is required so the chevron rotation selector works */}
      <Collapsible className="group/collapsible" defaultOpen={isActive}>
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                className={cn(
                  project.clientName ? "h-auto min-h-8 items-start py-1.5" : ""
                )}
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}`)
                }
              />
            }
          >
            {/* Chevron: only show when there are children to expand */}
            {hasChildren ? (
              <ChevronRightIcon className="mt-0.5 size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-data-[open]/collapsible:rotate-90" />
            ) : (
              <span className="size-3.5 shrink-0" />
            )}

            <FolderIcon
              className={cn(
                "shrink-0",
                project.clientName ? "mt-0.5" : ""
              )}
            />

            <div className="flex min-w-0 flex-col">
              <span className="truncate leading-snug">{project.name}</span>
              {project.clientName && (
                <span className="truncate text-[11px] leading-snug text-sidebar-foreground/50 font-normal">
                  {project.clientName}
                </span>
              )}
            </div>
          </CollapsibleTrigger>

          {/* Actions: add room / add area / delete */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuAction showOnHover />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={() => setCreateRoomOpen(true)}>
                <DoorOpenIcon />
                Add room
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateAreaOpen(true)}>
                <LayoutGridIcon />
                Add area
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive"
              >
                <Trash2Icon />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Children: areas and standalone rooms */}
          {hasChildren && (
            <CollapsibleContent>
              <SidebarMenuSub>
                {project.areas.map((area) => (
                  <AreaItem
                    key={area.id}
                    area={area}
                    projectId={project.id}
                    pathname={pathname}
                  />
                ))}
                {project.rooms.map((room) => (
                  <StandaloneRoomItem
                    key={room.id}
                    room={room}
                    projectId={project.id}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          )}
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
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete project?"
        description={`This will permanently delete "${project.name}" and all its areas, rooms, and line items. This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Area ───────────────────────────────────────────────────────────────────

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
      {/* SidebarMenuSubItem provides group/menu-sub-item for hover targets */}
      <SidebarMenuSubItem>
        <Collapsible className="group/collapsible" defaultOpen={hasActiveRoom}>
          {/* Trigger row — action button sits inside so it aligns naturally */}
          <div className="relative flex items-center">
            <CollapsibleTrigger
              render={
                <SidebarMenuSubButton
                  // Make room for the absolute-positioned action button
                  className="flex-1 pr-6"
                />
              }
            >
              {area.rooms.length > 0 ? (
                <ChevronRightIcon className="size-3 shrink-0 text-sidebar-foreground/40 transition-transform duration-200 group-data-[open]/collapsible:rotate-90" />
              ) : (
                <span className="size-3 shrink-0" />
              )}
              <LayoutGridIcon className="size-3.5 shrink-0 text-sidebar-foreground/60" />
              <span className="truncate">{area.name}</span>
            </CollapsibleTrigger>

            {/* Hover action button — absolutely placed at the right edge */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className={cn(
                      "absolute right-1 flex size-5 items-center justify-center rounded-md",
                      "text-sidebar-foreground/60 opacity-0 transition-opacity",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "group-hover/menu-sub-item:opacity-100",
                      "aria-expanded:opacity-100",
                    )}
                  />
                }
              >
                <MoreHorizontalIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={() => setCreateRoomOpen(true)}>
                  <DoorOpenIcon />
                  Add room
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive"
                >
                  <Trash2Icon />
                  Delete area
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rooms inside this area.
              We intentionally do NOT use SidebarMenuSub here — it would add
              a second border-l inside the project's border-l, causing overflow.
              Instead we just indent with padding. */}
          {area.rooms.length > 0 && (
            <CollapsibleContent>
              <ul className="my-0.5 ml-3.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                {area.rooms.map((room) => (
                  <AreaRoomItem
                    key={room.id}
                    room={room}
                    projectId={projectId}
                    pathname={pathname}
                  />
                ))}
              </ul>
            </CollapsibleContent>
          )}
        </Collapsible>
      </SidebarMenuSubItem>

      <CreateRoomDialog
        projectId={projectId}
        areaId={area.id}
        open={createRoomOpen}
        onOpenChange={setCreateRoomOpen}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete area?"
        description={`This will permanently delete "${area.name}" and all its rooms and line items. This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Room inside an area ─────────────────────────────────────────────────────

function AreaRoomItem({
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
      if (isActive) router.push(`/dashboard/projects/${projectId}`)
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      {/* Custom li — mirrors SidebarMenuSubItem but without the nested sub styles */}
      <li className="group/area-room relative">
        <button
          onClick={() => router.push(roomPath)}
          data-active={isActive ? "" : undefined}
          className={cn(
            "flex h-7 w-full items-center gap-2 rounded-md px-2 text-sm",
            "text-sidebar-foreground",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "data-[data-active]:bg-sidebar-accent data-[data-active]:font-medium data-[data-active]:text-sidebar-accent-foreground",
            // Tailwind v4 data-* variant
            "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground",
          )}
        >
          <DoorOpenIcon className="size-3.5 shrink-0 text-sidebar-foreground/60" />
          <span className="truncate">{room.name}</span>
        </button>

        {/* Action button visible on row hover */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  "absolute right-1 top-1 flex size-5 items-center justify-center rounded-md",
                  "text-sidebar-foreground/60 opacity-0 transition-opacity",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "group-hover/area-room:opacity-100",
                  "aria-expanded:opacity-100",
                )}
              />
            }
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive"
            >
              <Trash2Icon />
              Delete room
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete room?"
        description={`This will permanently delete "${room.name}" and all its line items. This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Standalone room (not inside an area) ────────────────────────────────────

function StandaloneRoomItem({
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
      if (isActive) router.push(`/dashboard/projects/${projectId}`)
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          isActive={isActive}
          onClick={() => router.push(roomPath)}
        >
          <DoorOpenIcon className="size-3.5 shrink-0 text-sidebar-foreground/60" />
          <span className="truncate">{room.name}</span>
        </SidebarMenuSubButton>

        {/* Action button visible on row hover */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  "absolute right-1 top-1 flex size-5 items-center justify-center rounded-md",
                  "text-sidebar-foreground/60 opacity-0 transition-opacity",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "group-hover/menu-sub-item:opacity-100",
                  "aria-expanded:opacity-100",
                )}
              />
            }
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive"
            >
              <Trash2Icon />
              Delete room
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuSubItem>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete room?"
        description={`This will permanently delete "${room.name}" and all its line items. This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Shared delete confirmation dialog ──────────────────────────────────────

function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            variant="destructive"
          >
            {loading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
