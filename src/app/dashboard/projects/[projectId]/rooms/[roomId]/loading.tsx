import { Skeleton } from "@/components/ui/skeleton"

export default function RoomLoading() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-4 w-52" />
      </header>
      <div className="flex-1 overflow-auto p-2">
        <div className="border border-border bg-white">
          {/* Column headers */}
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24 ml-4" />
            <Skeleton className="h-3 w-10 ml-4" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-16 ml-4" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Skeleton groups */}
          {[1, 2, 3].map((g) => (
            <div key={g}>
              <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-3 py-2">
                <Skeleton className="h-3 w-3 rounded-sm" />
                <Skeleton className="h-3 w-32" />
              </div>
              {[1, 2, 3].map((r) => (
                <div key={r} className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24 ml-4" />
                  <Skeleton className="h-3 w-10 ml-4" />
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-16 ml-4" />
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
