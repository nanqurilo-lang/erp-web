"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, TableIcon, MoreVertical } from "lucide-react"

type Deal = {
  id: string
  title: string
  value?: number
  dealStage?: string
  dealCategory?: string
  pipeline?: string
  dealAgent?: string
  dealAgentMeta?: {
    name?: string
    profileUrl?: string
  }
  createdAt?: string
  leadName?: string
  contactEmail?: string
  contactPhone?: string
  expectedCloseDate?: string
  nextFollowUp?: string
  dealWatcher?: string
  priority?: string | number | null
  tags?: string
}

type PriorityItem = {
  id: number
  status: string
  color?: string
  dealId?: number | null
  isGlobal?: boolean
}

const BASE_URL = "https://chat.swiftandgo.in"

// Sample local image paths you uploaded (kept as fallbacks)
const sampleDesktopImage = "/mnt/data/Screenshot 2025-11-21 122016.png"
const sampleMobileImage = "/mnt/data/Screenshot 2025-11-21 122307.png"

export default function DealsPage() {
  const [token, setToken] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    setToken(t)
  }, [])

  const authFetcher = async (url: string) => {
    if (!token) throw new Error("No access token found. Please log in.")
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Failed to fetch ${url} - ${res.status} ${text}`)
    }
    return res.json()
  }

  // deals (existing logic preserved; endpoint kept as your relative /api/deals/get)
  const { data: deals = [], error: dealsError, isLoading: dealsLoading, mutate: mutateDeals } = useSWR(
    token ? "/api/deals/get" : null,
    authFetcher
  )

  // priorities from backend (global list)
  const { data: priorities = [] as PriorityItem[] } = useSWR(
    token ? `${BASE_URL}/deals/admin/priorities` : null,
    authFetcher
  )

  // create a map for quick lookup by status or id
  const priorityByStatus = useMemo(() => {
    const m = new Map<string, PriorityItem>()
    for (const p of (priorities || [])) {
      if (p.status) m.set(String(p.status).toLowerCase(), p)
    }
    return m
  }, [priorities])

  const priorityById = useMemo(() => {
    const m = new Map<number, PriorityItem>()
    for (const p of (priorities || [])) {
      m.set(p.id, p)
    }
    return m
  }, [priorities])

  const stages = useMemo(() => {
    const s = new Set<string>()
    for (const d of deals as Deal[]) {
      if (d.dealStage) s.add(d.dealStage)
    }
    return Array.from(s.values()).sort()
  }, [deals])

  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (deals as Deal[]).filter((d) => {
      const matchesStage =
        stageFilter === "all" || (String(d.dealStage || "").toLowerCase() === stageFilter.toLowerCase())
      const hay = [
        d.title,
        d.dealAgentMeta?.name,
        d.dealAgent,
        d.dealCategory,
        d.pipeline,
        d.id,
        d.leadName,
        d.contactEmail,
        d.contactPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const matchesQuery = q.length === 0 || hay.includes(q)
      return matchesStage && matchesQuery
    })
  }, [deals, query, stageFilter])

  if (dealsLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-lg font-semibold">Loading deals...</div>
  }

  if (dealsError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lg font-semibold text-destructive">
        {(dealsError as Error).message || "Failed to load deals. Please try again later."}
      </div>
    )
  }

  // safe normalization for priority strings
  const normalizePriorityString = (p?: unknown) => {
    if (p === null || p === undefined) return "low"
    if (typeof p === "string") return p.toLowerCase()
    try {
      return String(p).toLowerCase()
    } catch {
      return "low"
    }
  }

  // get color for priority: prefer backend color if available, else fallbacks
  const getPriorityColor = (p?: unknown) => {
    // if p is an id number, try lookup
    if (typeof p === "number") {
      const item = priorityById.get(p)
      if (item?.color) return item.color
      if (item?.status) return (priorityByStatus.get(item.status.toLowerCase())?.color) || "#34D399"
    }

    const s = normalizePriorityString(p)
    const item = priorityByStatus.get(s)
    if (item?.color) return item.color
    // fallback palette
    switch (s) {
      case "high":
        return "#ef4444" // red-500
      case "medium":
        return "#f59e0b" // yellow-400
      default:
        return "#10b981" // green-500
    }
  }

  // when user changes priority from the select
  const handlePriorityChange = async (dealId: string, newPriorityStatusOrId: string | number) => {
    if (!token) return
    try {
      // find priority id if user selected by status string
      let priorityIdToSend: number | null = null
      if (typeof newPriorityStatusOrId === "number") {
        priorityIdToSend = newPriorityStatusOrId
      } else {
        // try to find priority id by status string (case-insensitive)
        const statusKey = String(newPriorityStatusOrId).toLowerCase()
        const found = priorityByStatus.get(statusKey)
        if (found) priorityIdToSend = found.id
      }

      // If still null, try to find by matching status text directly in priorities list
      if (priorityIdToSend === null) {
        const found = (priorities || []).find(
          (p: PriorityItem) => p.status && String(p.status).toLowerCase() === String(newPriorityStatusOrId).toLowerCase()
        )
        if (found) priorityIdToSend = found.id
      }

      // Best-effort: if we have an id, send it. Otherwise attempt sending status string as fallback.
      const url = `${BASE_URL}/deals/${dealId}/priority`
      const body = priorityIdToSend !== null ? { priorityId: priorityIdToSend } : { status: String(newPriorityStatusOrId) }

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

     
      

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        console.error("Failed to update priority:", res.status, txt)
        return
      }

      // revalidate deals to pick up updated priority
      await mutateDeals()
    } catch (err) {
      console.error("Error updating priority:", err)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-pretty text-3xl font-bold">Deals</h1>
        <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by deal, lead, agent, category, pipeline, or ID"
              aria-label="Search deals"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full md:w-48" aria-label="Filter by stage">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild>
            <Link href="/deals/create">+ Add Deal</Link>
          </Button>
        </div>
      </div>

      {/* view toggle */}
      <div className="mb-4 flex justify-end">
        <Tabs className="w-auto" defaultValue="table">
          <TabsList>
            <TabsTrigger value="table" asChild>
              <Link href="/deals/get" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
              </Link>
            </TabsTrigger>
            <TabsTrigger value="kanban" asChild>
              <Link href="/deals/stages" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Deal Name</TableHead>
              <TableHead>Lead Name</TableHead>
              <TableHead>Contact Details</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Close Date</TableHead>
              <TableHead>Next Follow Up</TableHead>
              <TableHead>Deal Agent</TableHead>
              <TableHead>Deal Watcher</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Priority Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredDeals.map((deal: Deal) => {
              // compute priority display value (can be id or status)
              const priorityValue =
                deal.priority ?? // could be string like "Low" or id like 3
                (typeof deal.priority === "undefined" ? "Low" : deal.priority)

              // color from priorities list if matching status or id
              const color = getPriorityColor(priorityValue)

              return (
                <TableRow key={deal.id} className="align-top">
                  {/* Deal Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                        {/* use img tag to avoid next/image config issues with local paths */}
                        <img
                          src={(deal.dealAgentMeta?.profileUrl as string) || sampleDesktopImage}
                          alt={deal.dealAgentMeta?.name || deal.dealAgent || "agent"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/deals/get/${deal.id}`} className="line-clamp-1 font-medium hover:underline">
                          {deal.title || "—"}
                        </Link>
                        <div className="text-xs text-muted-foreground">ID: {deal.id}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Lead Name */}
                  <TableCell>{deal.leadName || "—"}</TableCell>

                  {/* Contact Details */}
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{deal.contactEmail || "—"}</div>
                    <div>{deal.contactPhone || "—"}</div>
                  </TableCell>

                  {/* Value */}
                  <TableCell className="whitespace-nowrap">
                    {typeof deal.value === "number" ? `$${deal.value.toLocaleString()}` : "—"}
                  </TableCell>

                  {/* Close Date */}
                  <TableCell>{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "—"}</TableCell>

                  {/* Next Follow Up */}
                  <TableCell>{deal.nextFollowUp ? new Date(deal.nextFollowUp).toLocaleDateString() : "—"}</TableCell>

                  {/* Deal Agent */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={(deal.dealAgentMeta?.profileUrl as string) || sampleMobileImage}
                          alt={deal.dealAgentMeta?.name || deal.dealAgent || "agent"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm">{deal.dealAgentMeta?.name || deal.dealAgent || "—"}</div>
                        <div className="text-xs text-muted-foreground">Team Lead</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Deal Watcher */}
                  <TableCell>{deal.dealWatcher || "—"}</TableCell>

                  {/* Stage (compact select) */}
                  <TableCell>
                    <Select
                      value={deal.dealStage || "Qualified"}
                      onValueChange={() => {
                        /* UI-only for stage here to preserve logic (no server update was requested).
                           If you want stage to persist, I can add a PATCH call. */
                      }}
                    >
                      <SelectTrigger className="w-36" aria-label="Deal stage">
                        <SelectValue placeholder={deal.dealStage || "Stage"} />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.length ? (
                          stages.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Win">Win</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Priority Status (dot + select, persists via PUT) */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <div className="flex-1">
                        <Select
                          value={
                            // if priority is an id present in priorityById, use id; else use status string fallback
                            typeof priorityValue === "number" && priorityById.get(priorityValue)
                              ? String(priorityValue)
                              : (typeof priorityValue === "string" ? priorityValue : String(priorityValue ?? "Low"))
                          }
                          onValueChange={(val) => {
                            // if the value is a numeric id string, send as number
                            const asNumber = Number(val)
                            const toSend = !Number.isNaN(asNumber) && priorityById.get(asNumber) ? asNumber : val
                            handlePriorityChange(deal.id, toSend)
                          }}
                        >
                          <SelectTrigger className="w-32 text-sm py-1" aria-label="Priority status">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* populate from backend priorities if available, otherwise sensible defaults */}
                            {(priorities && priorities.length > 0
                              ? priorities
                              : [
                                  { id: 3, status: "Low", color: "#10b981" },
                                  { id: 4, status: "Medium", color: "#f59e0b" },
                                  { id: 1, status: "High", color: "#ef4444" },
                                ]
                            ).map((p: PriorityItem) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                <div className="flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span>{p.status}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TableCell>

                  {/* Tags */}
                  <TableCell className="text-sm text-muted-foreground">{deal.tags || "—"}</TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/deals/get/${deal.id}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/deals/create/${deal.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            console.log("Delete clicked for", deal.id)
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}

            {filteredDeals.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-sm text-muted-foreground">
                  No deals found. Adjust your filters or search terms.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <Link href="/" className="underline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
