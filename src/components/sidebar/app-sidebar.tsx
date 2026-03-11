"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ProjectTree } from "./project-tree"

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
        <div className="px-3 py-2">
          <span className="text-base font-semibold tracking-tight">Freya</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ProjectTree projects={projects} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
