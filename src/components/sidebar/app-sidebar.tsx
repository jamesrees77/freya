"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ProjectTree } from "./project-tree"
import { CreateProjectDialog } from "./create-project-dialog"

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

export function AppSidebar({ projects }: { projects: Project[] }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-lg font-semibold">Freya</span>
          <CreateProjectDialog />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ProjectTree projects={projects} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
