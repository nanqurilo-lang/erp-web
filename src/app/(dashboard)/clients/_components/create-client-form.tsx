"use client"

import React, { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export function CreateClientForm({ onClientCreated }: { onClientCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to create client")
      }

      toast.success("Client created successfully", { description: "Success" })
      setOpen(false)
      onClientCreated()
      e.currentTarget.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create client", { description: "Error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>Add a new client to your database</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" name="email" type="email" required />
              </div>
              {/* Other fields omitted for brevity */}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Client"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
