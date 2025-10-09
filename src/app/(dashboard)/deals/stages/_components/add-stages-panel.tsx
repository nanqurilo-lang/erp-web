"use client"

import type React from "react"

import { useState } from "react"

export default function AddStagePanel({
  onCreated,
  getToken,
}: {
  onCreated?: () => Promise<void> | void
  getToken: () => string | null
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const token = getToken()
    if (!token) {
      setError("No access token found. Please log in.")
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch("/api/deals/stages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Failed to create stage")
      setName("")
      setOpen(false)
      await onCreated?.()
    } catch (err: any) {
      setError(err?.message ?? "Failed to create stage")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-primary px-3 py-2 text-primary-foreground hover:opacity-90"
        >
          {"Add Stage"}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border border-border rounded-md p-2 bg-background"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Stage name"
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!name || submitting}
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setName("")
              setError(null)
            }}
            className="rounded-md border border-border px-3 py-2 text-foreground"
          >
            {"Cancel"}
          </button>
          {error && <span className="text-sm text-destructive ml-2">{error}</span>}
        </form>
      )}
    </div>
  )
}
