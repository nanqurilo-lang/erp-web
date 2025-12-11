
"use client"

import { useState, useRef, useEffect } from "react"
import type { Stage } from "@/types/stages"
import type { Deal } from "@/types/deals"
import { Calendar, Tag, Phone } from "lucide-react"

type Filters = {
  pipeline?: string
  category?: string
}

export default function KanbanBoard({
  stages,
  deals,
  search,
  filters,
}: {
  stages: Stage[]
  deals: Deal[]
  search: string
  filters: Filters
}) {
  const normalizedSearch = search.trim().toLowerCase()

  const filteredDeals = deals.filter((d) => {
    if (filters.pipeline && d.pipeline !== filters.pipeline) return false
    if (filters.category && d.dealCategory !== filters.category) return false
    if (normalizedSearch) {
      const hay =
        `${d.title} ${d.id} ${d.dealCategory ?? ""} ${d.pipeline ?? ""} ${d.dealAgentMeta?.name ?? d.dealAgent ?? ""}`.toLowerCase()
      if (!hay.includes(normalizedSearch)) return false
    }
    return true
  })

  return (
    <div className="relative w-full">
      <div className="flex gap-6 overflow-x-auto pb-4 px-1">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter((deal) => deal.dealStage === stage.name)
          return (
            <div key={stage.id} className="min-w-[340px] max-w-[380px] flex-shrink-0 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <h2 className="text-sm font-semibold text-foreground">{stage.name}</h2>
                </div>
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {stageDeals.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1 bg-muted/30 rounded-xl p-3 min-h-[400px]">
                {stageDeals.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-sm text-muted-foreground">No deals in this stage</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------- helpers ------------------- */

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/* ------------------- DealCard ------------------- */

function DealCard({ deal }: { deal: Deal }) {
  // Accessors / fallbacks
  const leadName =
    (deal as any).leadName ||
    (deal as any).contactName ||
    deal.dealAgentMeta?.name ||
    deal.dealAgent ||
    "Unknown"

  const dealName = deal.title ?? "Deal"

  const tags: string[] = Array.isArray((deal as any).tags)
    ? (deal as any).tags
    : (deal as any).tags
    ? String((deal as any).tags)
        .split(",")
        .map((s: string) => s.trim())
    : []

  const nextFollowupRaw = (deal as any).nextFollowupDate ?? (deal as any).nextFollowup ?? (deal as any).next_followup
  const nextFollowup = nextFollowupRaw ? new Date(nextFollowupRaw) : null

  const contact =
    (deal as any).contactPhone ||
    (deal as any).phone ||
    (deal as any).contact ||
    (deal as any).mobile ||
    ""

  const watchers = Array.isArray((deal as any).watchers)
    ? (deal as any).watchers
    : Array.isArray((deal as any).dealWatchers)
    ? (deal as any).dealWatchers
    : []

  // Priority parsing & local state
  const rawPriority = (deal as any).priority
  const parsePriorities = (raw: any) => {
    if (!raw) return [] as Array<{ name: string; color?: string }>
    if (Array.isArray(raw)) {
      return raw.map((p: any) => (typeof p === "string" ? { name: p, color: undefined } : { name: p?.name ?? String(p), color: p?.color }))
    }
    if (typeof raw === "object") {
      return [{ name: raw.name ?? String(raw), color: raw.color }]
    }
    return [{ name: String(raw), color: undefined }]
  }

  const [priorities, setPriorities] = useState<Array<{ name: string; color?: string }>>(parsePriorities(rawPriority))

  // dynamic palette per-card (so new priorities are added to popover list)
  const [palette, setPalette] = useState<Array<{ name: string; color: string }>>(() => [
    { name: "Medium", color: "#FBBF24" },
    { name: "High", color: "#F97316" },
    { name: "Low", color: "#15803D" },
  ])

  // popover / modal states + refs
  const [openPopover, setOpenPopover] = useState(false)
  const popRef = useRef<HTMLDivElement | null>(null)

  const [openModal, setOpenModal] = useState(false)
  const [modalPriorityName, setModalPriorityName] = useState("")
  const [modalPriorityColor, setModalPriorityColor] = useState("#000000")

  // close popover on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!openPopover) return
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpenPopover(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [openPopover])

  // palette selection sets single priority
  const togglePriority = (p: { name: string; color?: string }) => {
    setPriorities([{ name: p.name, color: p.color }])
  }

  // When user clicks add trigger in popover -> open modal
  const onOpenAddModal = () => {
    setModalPriorityName("")
    setModalPriorityColor("#000000")
    setOpenModal(true)
  }

  // Note: PER YOUR REQUEST, clicking the colored circle now opens the POPOVER (list),
  // not the modal. Modal only opens from the popover Add button.
  const onOpenPriorityList = () => {
    setOpenPopover(true)
  }

  const onSaveModal = () => {
    if (!modalPriorityName.trim()) return
    const name = modalPriorityName.trim()
    const color = modalPriorityColor || "#000000"

    // add to palette if not exists (case-insensitive)
    const exists = palette.some((x) => x.name.toLowerCase() === name.toLowerCase())
    if (!exists) {
      setPalette((prev) => [...prev, { name, color }])
    } else {
      // update color if changed
      setPalette((prev) => prev.map((x) => (x.name.toLowerCase() === name.toLowerCase() ? { ...x, color } : x)))
    }

    // set as current priority
    setPriorities([{ name, color }])

    setOpenModal(false)
    setOpenPopover(false)
  }

  const onCancelModal = () => {
    setOpenModal(false)
  }

  return (
    <div className="group rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-default">
      <div className="p-4 flex flex-col gap-3 relative">
        {/* top-right priority */}
        <div className="absolute right-3 top-3">
          <div>
            {priorities.length === 0 ? (
              <button
                type="button"
                onClick={() => setOpenPopover((s) => !s)}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium"
                aria-expanded={openPopover}
                aria-label="Toggle priority popover"
              >
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-sm font-medium text-blue-600 bg-white/60">
                  <span className="text-[14px]">＋</span>
                  <span className="text-xs">Add priority</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenPriorityList} // show list (not modal)
                className="h-6 w-6 rounded-full flex items-center justify-center"
                aria-label="Open priority list"
                title={priorities.map((p) => p.name).join(", ")}
              >
                <div
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ backgroundColor: priorities[0].color ?? "rgba(59,130,246,0.9)" }}
                />
              </button>
            )}
          </div>

          {/* popover with dynamic palette + Add trigger */}
          {openPopover && (
            <div
              ref={popRef}
              className="mt-2 w-44 rounded-lg bg-white border border-border shadow-lg p-3 text-sm z-50"
              role="dialog"
              aria-modal="false"
            >
              <div className="flex flex-col gap-2">
                {palette.map((pp) => (
                  <button
                    key={pp.name}
                    type="button"
                    onClick={() => togglePriority({ name: pp.name, color: pp.color })}
                    className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/20 text-left"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pp.color }} />
                    <span className="font-medium" style={{ color: pp.color }}>
                      {pp.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border/60 my-2" />

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={onOpenAddModal} // opens modal FROM the list
                    className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-600 text-white"
                    title="Add"
                  >
                    ＋
                  </button>
                  <div className="text-sm text-muted-foreground">Add</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lead name & Deal name */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{leadName}</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{dealName}</div>
          </div>
        </div>

        {/* tags pills */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.slice(0, 3).map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Contact + Next followup */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            {contact ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{contact}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">—</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {nextFollowup ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{nextFollowup.toLocaleDateString()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>No follow-up</span>
              </div>
            )}
          </div>
        </div>

        {/* watchers + plus button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {watchers && watchers.length > 0 ? (
                watchers.slice(0, 4).map((w: any, i: number) => {
                  const img = w?.profilePictureUrl || w?.avatar || w?.avatarUrl
                  const name = w?.name || w?.displayName || String(w)
                  return img ? (
                    <img
                      key={i}
                      src={img}
                      alt={name}
                      title={name}
                      className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div
                      key={i}
                      title={name}
                      className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm"
                    >
                      {initials(name)}
                    </div>
                  )
                })
              ) : (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                  {initials(leadName)}
                </div>
              )}

              {watchers && watchers.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-muted/80 flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                  +{watchers.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* plus icon button (visual only) */}
          <div>
            <button
              type="button"
              onClick={() => {
                /* visual only — no behavior changed per request */
              }}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center bg-white text-blue-600 shadow-sm"
              title="Add watcher"
            >
              ＋
            </button>
          </div>
        </div>

        {/* details label kept as non-clickable per request (no navigation) */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium pt-2">Details removed</div>
      </div>

      {/* ---------- Modal (Add / Edit Priority) ---------- */}
      {openModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Priority modal">
          <div className="absolute inset-0 bg-black/40" onClick={onCancelModal} />

          <div className="relative z-10 w-[320px] bg-white rounded-lg shadow-lg border border-border p-4">
            <h3 className="text-lg font-semibold mb-3">Add</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Priority Status *</label>
                <input type="text" value={modalPriorityName} onChange={(e) => setModalPriorityName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Color Code *</label>
                <input type="text" value={modalPriorityColor} onChange={(e) => setModalPriorityColor(e.target.value)} placeholder="eg #000000" className="w-full px-3 py-2 rounded-md border border-border text-sm" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button type="button" onClick={onCancelModal} className="px-4 py-2 rounded-md border border-border text-sm font-medium">
                Cancel
              </button>
              <button type="button" onClick={onSaveModal} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



