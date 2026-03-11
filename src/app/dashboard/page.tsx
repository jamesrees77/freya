import { SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SidebarTrigger className="-ml-1" />
      </header>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome to Freya
          </h2>
          <p className="mt-2 text-muted-foreground">
            Select a project from the sidebar or create a new one to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
