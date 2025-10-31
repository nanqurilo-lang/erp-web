import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtext?: string
  variant?: "default" | "accent" | "warning"
}

export function StatCard({ title, value, icon: Icon, subtext, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-gradient-to-br from-(--color-primary-light) to-white border-(--color-primary)/20",
    accent: "bg-gradient-to-br from-(--color-accent-light) to-white border-(--color-accent)/20",
    warning: "bg-gradient-to-br from-orange-100 to-white border-orange-200",
  }

  return (
    <Card className={`border ${variantStyles[variant]} card-hover`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-(--color-muted) mb-2">{title}</p>
            <p className="text-3xl font-bold text-(--color-foreground)">{value}</p>
            {subtext && <p className="text-xs text-(--color-muted) mt-2">{subtext}</p>}
          </div>
          <div className="ml-4 p-3 bg-white/50 rounded-lg border border-(--color-border)">
            <Icon className="w-5 h-5 text-(--color-primary)" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
