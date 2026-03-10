"use client"

import { useState } from "react"
import { createRoom } from "@/actions/rooms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CreateRoomDialog({
  projectId,
  areaId,
  open,
  onOpenChange,
}: {
  projectId: string
  areaId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await createRoom(projectId, name.trim(), areaId)
      onOpenChange(false)
      setName("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Room</DialogTitle>
            <DialogDescription>
              Rooms contain your line item groups and individual items.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="room-name">Room name</Label>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Living Room"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
