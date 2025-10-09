"use client"

import Link from "next/link"
import Image from "next/image"
import type { Stage } from "@/types/stages"
import type { Deal } from "@/types/deals"

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
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter((deal) => deal.dealStage === stage.name)
          return (
            <div
              key={stage.id}
              className="min-w-[300px] max-w-[360px] flex-shrink-0 border border-border rounded-xl bg-background"
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{stage.name}</h2>
                <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
              </div>
              <div className="p-3 flex flex-col gap-3">
                {stageDeals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{"No deals in this stage."}</p>
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
    <div className="rounded-lg border border-border bg-card shadow-sm hover:shadow transition">
      <div className="p-3 flex items-center gap-3">
        {deal.dealAgentMeta?.profileUrl ? (
          <Image
            src={deal.dealAgentMeta.profileUrl || "/placeholder.svg"}
            alt={deal.dealAgentMeta.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted" />
        )}
        <div className="min-w-0">
          <h3 className="font-medium text-foreground truncate">{deal.title}</h3>
          <p className="text-xs text-muted-foreground">
            {"ID: "}
            {deal.id}
          </p>
        </div>
      </div>
      <div className="px-3 pb-3 text-sm text-foreground/90">
        <p>
          <span className="font-medium">{"Value: "}</span>
          {"$"}
          {deal.value.toLocaleString()}
        </p>
        <p>
          <span className="font-medium">{"Category: "}</span>
          {deal.dealCategory}
        </p>
        <p>
          <span className="font-medium">{"Pipeline: "}</span>
          {deal.pipeline}
        </p>
        <p>
          <span className="font-medium">{"Agent: "}</span>
          {deal.dealAgentMeta?.name || deal.dealAgent}
        </p>
        <p>
          <span className="font-medium">{"Created: "}</span>
          {new Date(deal.createdAt).toLocaleDateString()}
        </p>
        <Link href={`/deals/get/${deal.id}`} className="text-blue-600 underline text-sm">
          {"View Details"}
        </Link>
      </div>
    </div>
  )
}
