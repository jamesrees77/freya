"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  LayoutGridIcon,
  DoorOpenIcon,
  Trash2Icon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupAction,
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
import { CreateProjectDialog } from "./create-project-dialog"
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

// ─── Root ────────────────────────────────────────────────────────────────────

export function ProjectTree({ projects }: { projects: Project[] }) {
  const pathname = usePathname()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>

        {/* "+" button pinned to the top-right of the group label row */}
        <SidebarGroupAction
          title="New project"
          onClick={() => setCreateProjectOpen(true)}
          className="cursor-pointer"
        >
          <PlusIcon />
          <span className="sr-only">New project</span>
        </SidebarGroupAction>

        <SidebarGroupContent>
          {projects.length === 0 ? (
            <p className="px-3 py-3 text-xs italic text-sidebar-foreground/40">
              No projects yet — create one to get&nbsp;started.
            </p>
          ) : (
            <SidebarMenu>
              {projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Dialog is controlled here so the trigger can live in SidebarGroupAction */}
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
    </>
  )
}

// ─── Project row ─────────────────────────────────────────────────────────────

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
  const hasChildren = project.areas.length > 0 || project.rooms.length > 0

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
      {/*
        group/collapsible is the key fix: Base UI sets data-open on this element
        when expanded, and the chevron reads group-data-[open]/collapsible:rotate-90
      */}
      <Collapsible className="group/collapsible" defaultOpen={isActive}>
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                className={cn(
                  "font-medium",
                  project.clientName && "h-auto min-h-8 items-start py-1.5"
                )}
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}`)
                }
              />
            }
          >
            {/* Chevron — rotates when open. Hidden (invisible, not removed) when no children
                so the folder icon stays aligned across all rows. */}
            <ChevronRightIcon
              className={cn(
                "shrink-0 text-sidebar-foreground/30 transition-transform duration-200",
                "group-data-[open]/collapsible:rotate-90",
                project.clientName && "mt-0.5",
                !hasChildren && "invisible"
              )}
            />

            {/* Folder: closed when collapsed, open when expanded */}
            <FolderIcon
              className={cn(
                "shrink-0 text-sidebar-foreground/60",
                "group-data-[open]/collapsible:hidden",
                project.clientName && "mt-0.5"
              )}
            />
            <FolderOpenIcon
              className={cn(
                "hidden shrink-0 text-sidebar-foreground/60",
                "group-data-[open]/collapsible:block",
                project.clientName && "mt-0.5"
              )}
            />

            {/* Name + optional client subtitle */}
            <div className="flex min-w-0 flex-col">
              <span className="truncate leading-snug">{project.name}</span>
              {project.clientName && (
                <span className="truncate text-[11px] font-normal leading-tight text-sidebar-foreground/45">
                  {project.clientName}
                </span>
              )}
            </div>
          </CollapsibleTrigger>

          {/* ··· context menu — appears on hover */}
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

          {/* Children: areas first, then top-level rooms */}
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
        description={`Permanently delete "${project.name}" and all its areas, rooms, and line items? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Area row (collapsible) ───────────────────────────────────────────────────

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
      {/*
        SidebarMenuSubItem gives group/menu-sub-item so we can
        reveal the ··· button on row hover.
      */}
      <SidebarMenuSubItem>
        <Collapsible className="group/collapsible" defaultOpen={hasActiveRoom}>
          {/*
            Relative wrapper lets the absolute-positioned ··· button
            anchor to the right edge of this row.
          */}
          <div className="relative">
            <CollapsibleTrigger
              render={
                <SidebarMenuSubButton
                  /*
                    pr-6 reserves space for the ··· button so text is never
                    obscured when hovering over an area row.
                  */
                  className="w-full pr-6 text-sidebar-foreground/80"
                />
              }
            >
              <ChevronRightIcon
                className={cn(
                  "!size-3 shrink-0 text-sidebar-foreground/30 transition-transform duration-200",
                  "group-data-[open]/collapsible:rotate-90",
                  !area.rooms.length && "invisible"
                )}
              />
              <LayoutGridIcon className="!size-3.5 shrink-0 text-sidebar-foreground/50" />
              <span className="truncate">{area.name}</span>
            </CollapsibleTrigger>

            {/* ··· area actions — fade in on hover */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2",
                      "flex size-5 cursor-pointer items-center justify-center rounded-md",
                      "text-sidebar-foreground/40 opacity-0",
                      "transition-[opacity,background-color,color] duration-150",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "group-hover/menu-sub-item:opacity-100",
                      "aria-expanded:opacity-100 aria-expanded:text-sidebar-accent-foreground"
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

          {/*
            Rooms inside this area.

            We intentionally avoid nesting another <SidebarMenuSub> here.
            A second border-l inside the project's border-l would bleed past
            its container. Instead we use a plain indented list that visually
            continues the existing border hierarchy via a subtle left border.
          */}
          {area.rooms.length > 0 && (
            <CollapsibleContent>
              <ul className="mb-0.5 ml-[13px] mt-px flex flex-col border-l border-sidebar-border/60 pl-3">
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
        description={`Permanently delete "${area.name}" and all its rooms and line items? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Room nested inside an area ───────────────────────────────────────────────

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
      <li className="group/area-room relative py-px">
        <button
          onClick={() => router.push(roomPath)}
          data-active={isActive ? "" : undefined}
          className={cn(
            "flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm",
            "text-sidebar-foreground/70",
            "transition-[background-color,color] duration-150",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground"
          )}
        >
          <DoorOpenIcon className="size-3.5 shrink-0 text-sidebar-foreground/40" />
          <span className="truncate">{room.name}</span>
        </button>

        {/* ··· room actions — fade in on row hover */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2",
                  "flex size-5 cursor-pointer items-center justify-center rounded-md",
                  "text-sidebar-foreground/40 opacity-0",
                  "transition-[opacity,background-color,color] duration-150",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "group-hover/area-room:opacity-100",
                  "aria-expanded:opacity-100 aria-expanded:text-sidebar-accent-foreground"
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
        description={`Permanently delete "${room.name}" and all its line items? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Standalone room (directly under a project, no area) ─────────────────────

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
          className="text-sidebar-foreground/70"
        >
          <DoorOpenIcon className="!size-3.5 shrink-0 text-sidebar-foreground/40" />
          <span className="truncate">{room.name}</span>
        </SidebarMenuSubButton>

        {/* ··· room actions — fade in on row hover */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2",
                  "flex size-5 cursor-pointer items-center justify-center rounded-md",
                  "text-sidebar-foreground/40 opacity-0",
                  "transition-[opacity,background-color,color] duration-150",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "group-hover/menu-sub-item:opacity-100",
                  "aria-expanded:opacity-100 aria-expanded:text-sidebar-accent-foreground"
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
        description={`Permanently delete "${room.name}" and all its line items? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ─── Shared delete confirmation ───────────────────────────────────────────────

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
