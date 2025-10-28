"use client"

import Link from "next/link"
import type { Stage } from "@/types/stages"
import type { Deal } from "@/types/deals"
import { ArrowRight, DollarSign, User, Calendar, Tag } from "lucide-react"

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

function DealCard({ deal }: { deal: Deal }) {
  return (
    <Link href={`/deals/get/${deal.id}`}>
      <div className="group rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="p-4 flex flex-col gap-3">
          {/* Header with title and category badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {deal.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{deal.id}</p>
            </div>
            {deal.dealCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                <Tag className="w-3 h-3" />
                {deal.dealCategory}
              </span>
            )}
          </div>

          {/* Deal value - prominent display */}
          <div className="flex items-baseline gap-2 py-2 border-t border-b border-border/50">
            <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-lg font-bold text-foreground">{deal.value.toLocaleString()}</span>
          </div>

          {/* Deal metadata in a compact grid */}
          <div className="space-y-2 text-sm">
            {deal.pipeline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span className="truncate">{deal.pipeline}</span>
              </div>
            )}
            {(deal.dealAgentMeta?.name || deal.dealAgent) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{deal.dealAgentMeta?.name || deal.dealAgent}</span>
              </div>
            )}
            {deal.createdAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">{new Date(deal.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* CTA with arrow icon */}
          <div className="flex items-center gap-2 text-primary text-sm font-medium pt-2 group-hover:gap-3 transition-all">
            View Details
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
