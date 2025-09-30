"use client"

import useSWR from "swr"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import React from "react"

interface Employee {
  employeeId: string
  name: string
  email: string
  profilePictureUrl: string | null
  role: string
  active: boolean
  departmentName: string | null
  designationName: string | null
}

interface Promotion {
  id: number
  employeeId: string
  employeeName: string
  oldDepartmentId: number
  oldDepartmentName: string
  newDepartmentId: number
  newDepartmentName: string
  oldDesignationId: number
  oldDesignationName: string
  newDesignationId: number
  newDesignationName: string
  isPromotion: boolean
  sendNotification: boolean
  createdAt: string
  remarks: string | null
}

const fetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  if (!token) {
    const err = new Error("No access token found")
    ;(err as any).status = 401
    throw err
  }
  const res = await fetch(url, { 
    headers: { Authorization: `Bearer ${token}` }, 
    cache: "no-store" 
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to load data")
  }
  return res.json()
}

export default function PromotionsTab({ params }: { params: { id: string } }) {
  const id = params?.id

  const { data: employee, error: empError } = useSWR<Employee>(
    id ? `/api/hr/employee/${id}` : null, 
    fetcher, 
    {
      revalidateOnFocus: false,
    }
  )

  const { data: promotions, error: promError, isLoading } = useSWR<Promotion[]>(
    id ? `/api/hr/employee/${id}/promotions` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const tabs = [
    { id: "profile", label: "Profile", href: `/hr/employee/${id}` },
    { id: "emergency", label: "Emergency Contact", href: `/hr/employee/${id}/emergency-contacts` },
    { id: "promotions", label: "Promotions", href: `/hr/employee/${id}/promotions` },
  ]

  return (
    <main className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/hr/employee/${id}`} className="text-sm text-primary underline">
          ← Back to Profile
        </Link>
        <Link 
          href={`/hr/employee/${id}/promotions/add`} 
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Promotion
        </Link>
      </div>
      
      {empError ? (
        <div role="alert" className="text-sm text-destructive mb-4">
          Failed to load employee data
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
              {employee?.profilePictureUrl ? (
                <img
                  src={employee.profilePictureUrl || "/placeholder.svg"}
                  alt={`${employee.name} avatar`}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <img src="/employee-avatar.png" alt="Employee avatar" className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{employee?.name ?? `Employee ${id}`}</h1>
              <div className="text-muted-foreground">{employee?.email ?? ""}</div>
              <div className="text-xs text-muted-foreground">{id}</div>
            </div>
          </div>
          {employee && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                {employee.role?.replace(/^ROLE_/, "")}
              </span>
              {employee.active ? (
                <span className="inline-flex items-center rounded-full bg-green-600/15 px-2 py-1 text-xs text-green-700 dark:text-green-400">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-1 text-xs text-destructive-foreground">
                  Inactive
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <nav className="mb-6 flex items-center gap-4" aria-label="Employee detail tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`text-sm underline-offset-4 hover:underline ${tab.id === "promotions" ? "font-medium" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {isLoading ? (
        <div className="text-sm opacity-80">Loading promotions…</div>
      ) : promError ? (
        <div role="alert" className="text-sm text-destructive">
          {promError instanceof Error ? promError.message : "Failed to load promotions"}
        </div>
      ) : !promotions || promotions.length === 0 ? (
        <div className="text-sm opacity-80">No promotions found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">From</th>
                <th className="px-4 py-3 text-left font-medium">To</th>
                <th className="px-4 py-3 text-left font-medium">Remarks</th>
                <th className="px-4 py-3 text-left font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => {
                const d = new Date(p.createdAt)
                const dateStr = isNaN(d.getTime()) ? p.createdAt : d.toLocaleString()
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 align-top">{dateStr}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium">{p.oldDepartmentName || "N/A"}</span>
                        <span className="text-muted-foreground">{p.oldDesignationName || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium">{p.newDepartmentName || "N/A"}</span>
                        <span className="text-muted-foreground">{p.newDesignationName || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {p.remarks ? p.remarks : <span className="opacity-60">—</span>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={p.isPromotion ? "default" : "secondary"}>
                          {p.isPromotion ? "Promotion" : "Change"}
                        </Badge>
                        <Badge variant={p.sendNotification ? "default" : "secondary"}>
                          {p.sendNotification ? "Notified" : "No Notification"}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}