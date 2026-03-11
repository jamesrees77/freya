import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectLoading() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-4 w-36" />
      </header>
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  )
}
