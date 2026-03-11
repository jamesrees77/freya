"use client"

import { useState } from "react"
import { createProject } from "@/actions/projects"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusIcon } from "lucide-react"

type Props = {
  /**
   * When provided the dialog is controlled externally — no trigger button
   * is rendered. Pass `open` + `onOpenChange` from a parent component.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateProjectDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState("")
  const [clientName, setClientName] = useState("")
  const [loading, setLoading] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen! : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset form on close
      setName("")
      setClientName("")
    }
    setOpen(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await createProject(name.trim(), clientName.trim() || undefined)
      handleOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Create a new project to organise your rooms and line items.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smith Residence"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-name">Client name (optional)</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Mr & Mrs Smith"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (isControlled) {
    // Controlled mode: trigger is managed outside, just render the dialog shell
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {content}
      </Dialog>
    )
  }

  // Uncontrolled mode (legacy): render with its own trigger button
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PlusIcon className="size-4" />
        <span className="sr-only">New project</span>
      </DialogTrigger>
      {content}
    </Dialog>
  )
}
