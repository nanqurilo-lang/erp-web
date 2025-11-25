"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText, StickyNote, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const API_BASE = "https://chat.swiftandgo.in"

interface Company {
  companyName: string
  city?: string
  state?: string
}

interface Client {
  id: string
  name: string
  clientId: string
  profilePictureUrl?: string | null
  email: string
  mobile?: string | null
  country?: string | null
  category?: string | null
  subCategory?: string | null
  company?: Company | null
  companyLogoUrl?: string | null
  status: "ACTIVE" | "INACTIVE" | string
  addedBy: string
  createdAt?: string | null
}

interface Project {
  id: string
  code?: string
  name?: string
  members?: { id: string; name: string; avatarUrl?: string | null }[]
  startDate?: string | null
  deadline?: string | null
  client?: { id: string; name: string; avatarUrl?: string | null }
  progressPercent?: number
  status?: string
}

interface Invoice {
  id: number | string
  invoiceNumber?: string
  invoiceDate?: string
  currency?: string
  project?: { projectName?: string; projectCode?: string }
  total?: number
  unpaidAmount?: number
  status?: string
  createdAt?: string
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // stats
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [totalEarning, setTotalEarning] = useState<number | null>(null)
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState<number | null>(null)
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState<number | null>(null)

  // projects
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  // invoices
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)

  // tabs
  const [activeTab, setActiveTab] = useState<"profile" | "projects" | "invoices" | string>("profile")

  // placeholder avatar
  const placeholderImg = "/mnt/data/Screenshot 2025-11-25 124734.png"

  // ---------- client fetch ----------
  async function fetchClient() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      })
      if (!res.ok) throw new Error("Failed to fetch client details")
      const data = await res.json()
      setClient(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // safe text parser (handles stringified JSON responses)
  const safeParseText = (text: string) => {
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      try {
        const t = text.trim()
        if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
          return JSON.parse(t.slice(1, -1))
        }
      } catch {}
      return null
    }
  }

  // ---------- stats fetch ----------
  async function fetchClientStats(clientId: string) {
    const headers = { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` }

    try {
      const res = await fetch(`${API_BASE}/api/projects/client/${clientId}/stats`, { headers })
      const text = await res.text()
      const parsed = safeParseText(text) ?? (res.ok ? JSON.parse(text || "{}") : null)
      const obj =
        parsed && typeof parsed === "object" && (parsed.projectCount !== undefined || parsed.totalEarning !== undefined)
          ? parsed
          : parsed && typeof parsed === "object" && parsed["Response Body"]
          ? safeParseText(parsed["Response Body"])
          : parsed

      setProjectCount(Number(obj?.projectCount ?? 0))
      setTotalEarning(Number(obj?.totalEarning ?? 0))
    } catch {
      setProjectCount(0)
      setTotalEarning(0)
    }

    try {
      const res2 = await fetch(`${API_BASE}/api/invoices/client/${clientId}/stats/unpaid`, { headers })
      const text2 = await res2.text()
      const parsed2 = safeParseText(text2) ?? (res2.ok ? JSON.parse(text2 || "{}") : null)
      const obj2 =
        parsed2 && typeof parsed2 === "object" && (parsed2.unpaidInvoiceCount !== undefined || parsed2.totalUnpaidAmount !== undefined)
          ? parsed2
          : parsed2 && typeof parsed2 === "object" && parsed2["Response Body"]
          ? safeParseText(parsed2["Response Body"])
          : parsed2

      setUnpaidInvoiceCount(Number(obj2?.unpaidInvoiceCount ?? 0))
      setTotalUnpaidAmount(Number(obj2?.totalUnpaidAmount ?? 0))
    } catch {
      setUnpaidInvoiceCount(0)
      setTotalUnpaidAmount(0)
    }
  }

  // ---------- projects fetch (called when Projects tab activated) ----------
  async function fetchProjectsForClient(clientId: string) {
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      // use the full API URL you provided
      const res = await fetch(`${API_BASE}/api/projects/client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      })
      const text = await res.text()
      const parsed = safeParseText(text) ?? (res.ok ? JSON.parse(text || "[]") : null)

      let list: any[] = []
      if (Array.isArray(parsed)) list = parsed
      else if (parsed && Array.isArray(parsed.projects)) list = parsed.projects
      else if (parsed && Array.isArray(parsed.data)) list = parsed.data
      else if (parsed && parsed.ResponseBody) {
        const inner = safeParseText(parsed.ResponseBody)
        if (Array.isArray(inner)) list = inner
      }

      const mapped: Project[] = list.map((p: any) => ({
        id: p.id ?? p.projectId ?? p._id ?? String(Math.random()),
        code: p.shortCode ?? p.code ?? p.projectCode ?? p.project_code ?? p.id,
        name: p.name ?? p.projectName ?? p.title ?? "Project Name",
        members:
          Array.isArray(p.assignedEmployees) && p.assignedEmployees.length
            ? p.assignedEmployees.map((m: any) => ({ id: m.employeeId ?? m.id, name: m.name ?? m.fullName, avatarUrl: m.profileUrl ?? m.profilePictureUrl }))
            : Array.isArray(p.members)
            ? p.members
            : [],
        startDate: p.startDate ?? p.start_date ?? p.start,
        deadline: p.deadline ?? p.endDate ?? p.end_date,
        client: p.client ?? (p.clientId ? { id: p.clientId, name: client?.name, avatarUrl: client?.profilePictureUrl } : undefined),
        progressPercent: typeof p.progressPercent === "number" ? p.progressPercent : typeof p.progress === "number" ? p.progress : p.progress ?? 0,
        status: p.projectStatus ?? p.status ?? p.projectStatus ?? "In Progress",
      }))
      setProjects(mapped)
    } catch (err: any) {
      setProjectsError(err?.message ?? "Failed to fetch projects")
      setProjects([])
    } finally {
      setProjectsLoading(false)
    }
  }

  // ---------- invoices fetch (called when Invoices tab activated) ----------
  async function fetchInvoicesForClient(clientId: string) {
    setInvoicesLoading(true)
    setInvoicesError(null)
    try {
      const res = await fetch(`${API_BASE}/api/invoices/client/${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      })
      const text = await res.text()
      const parsed = safeParseText(text) ?? (res.ok ? JSON.parse(text || "[]") : null)

      let list: any[] = []
      if (Array.isArray(parsed)) list = parsed
      else if (parsed && Array.isArray(parsed.invoices)) list = parsed.invoices
      else if (parsed && Array.isArray(parsed.data)) list = parsed.data
      else if (parsed && parsed.ResponseBody) {
        const inner = safeParseText(parsed.ResponseBody)
        if (Array.isArray(inner)) list = inner
      }

      const mapped: Invoice[] = list.map((inv: any) => ({
        id: inv.id ?? inv.invoiceId,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        currency: inv.currency,
        project: inv.project ?? { projectName: inv.projectName, projectCode: inv.projectCode },
        total: typeof inv.total === "number" ? inv.total : Number(inv.total ?? 0),
        unpaidAmount: typeof inv.unpaidAmount === "number" ? inv.unpaidAmount : Number(inv.unpaidAmount ?? 0),
        status: inv.status,
        createdAt: inv.createdAt,
      }))
      setInvoices(mapped)
    } catch (err: any) {
      setInvoicesError(err?.message ?? "Failed to fetch invoices")
      setInvoices([])
    } finally {
      setInvoicesLoading(false)
    }
  }

  // initial fetch: client and stats
  useEffect(() => {
    if (id) fetchClient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (client?.clientId) fetchClientStats(client.clientId)
  }, [client])

  // when user activates Projects tab, load projects
  useEffect(() => {
    if (activeTab === "projects" && client?.clientId) {
      fetchProjectsForClient(client.clientId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, client])

  // when user activates Invoices tab, load invoices
  useEffect(() => {
    if (activeTab === "invoices" && client?.clientId) {
      fetchInvoicesForClient(client.clientId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, client])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error || "Client not found"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/clients">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clients
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Row helper for profile info
  const Row = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex items-start gap-6 py-2 border-b border-transparent last:border-b-0">
      <div className="w-40 text-sm text-slate-600">{label}</div>
      <div className="text-sm text-slate-800">{value ?? "—"}</div>
    </div>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">Client ID: {client.clientId}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/clients">
              <Button variant="ghost" className="hidden sm:inline-flex items-center gap-2">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Clients 
              </Button>
            </Link>
            <Link href={`/clients/${id}/documents`}>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </Button>
            </Link>
            <Link href={`/clients/${id}/notes`}>
              <Button variant="outline" className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Notes
              </Button>
            </Link>
          </div>
        </div>

        {/* Interactive tabs */}
        <div className="mt-6 border-b">
          <nav className="flex gap-6 text-sm text-slate-600">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-3 ${activeTab === "profile" ? "border-b-2 border-primary text-primary font-medium" : ""}`}
            >
              Profile
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-3 ${activeTab === "projects" ? "border-b-2 border-primary text-primary font-medium" : ""}`}
            >
              Projects
            </button>

            <button
              onClick={() => setActiveTab("invoices")}
              className={`pb-3 ${activeTab === "invoices" ? "border-b-2 border-primary text-primary font-medium" : ""}`}
            >
              Invoices
            </button>

            <button className="pb-3">Credit Notes</button>
            <button className="pb-3">Payments</button>
            <button className="pb-3">Documents</button>
            <button className="pb-3">Notes</button>
          </nav>
        </div>
      </div>

      {/* Top summary - ONLY show when profile tab is active */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="col-span-1">
            <Card>
              <CardContent className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={client.profilePictureUrl || placeholderImg} alt={client.name} />
                  <AvatarFallback>
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.company?.companyName ?? ""}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <div className="text-sm text-slate-600">Total Projects</div>
                <div className="text-2xl font-semibold text-blue-600 mt-2">{projectCount ?? "—"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="text-sm text-slate-600">Total Earnings</div>
                <div className="text-2xl font-semibold text-blue-600 mt-2">
                  {totalEarning !== null ? totalEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="text-sm text-slate-600">Due Invoices</div>
                <div className="text-2xl font-semibold text-blue-600 mt-2">{unpaidInvoiceCount ?? "—"}</div>
                {totalUnpaidAmount !== null && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {totalUnpaidAmount.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main area - show either Profile view or Projects view or Invoices (profile is default) */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Details about client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-0">
                  <Row label="Name" value={client.name} />
                  <Row label="Email" value={client.email} />
                  <Row label="Gender" value={"—"} />
                  <Row label="Company Name" value={client.company?.companyName ?? "—"} />
                  <Row label="Company Logo" value={client.companyLogoUrl ? "Uploaded" : "—"} />
                  <Row label="Mobile" value={client.mobile ?? "—"} />
                  <Row label="Office Phone No." value={"—"} />
                  <Row label="Official Website" value={"—"} />
                  <Row label="GST/VAT No." value={"—"} />
                  <Row label="Address" value={"—"} />
                  <Row label="State" value={client.company?.state ?? "—"} />
                  <Row label="Country" value={client.country ?? "India"} />
                  <Row label="Postal Code" value={"—"} />
                  <Row label="Language" value={"English"} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-blue-500/90" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-green-600/90" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <Link href={`/projects/new?clientId=${client.clientId}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">+ Add Project</Button>
                  </Link>
                </div>
                <div className="w-64">
                  <input placeholder="Search" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-left text-xs">
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Project Name</th>
                      <th className="px-4 py-3">Members</th>
                      <th className="px-4 py-3">Start Date</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8">Loading projects...</td>
                      </tr>
                    ) : projectsError ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-red-600">{projectsError}</td>
                      </tr>
                    ) : projects.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8">No projects found</td>
                      </tr>
                    ) : (
                      projects.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-4 py-3">{p.code ?? "—"}</td>
                          <td className="px-4 py-3">{p.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex -space-x-2 items-center">
                              {p.members && p.members.slice(0, 3).map((m, i) => (
                                <div key={m.id || i} className="w-7 h-7 rounded-full ring-2 ring-white overflow-hidden">
                                  <img src={m.avatarUrl || placeholderImg} alt={m.name} className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {p.members && p.members.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs ring-2 ring-white">
                                  +{p.members.length - 3}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">{p.deadline ? new Date(p.deadline).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden">
                                <img src={p.client?.avatarUrl || placeholderImg} alt={p.client?.name || client.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">{p.client?.name ?? client.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-3 bg-green-200 rounded" style={{ position: "relative" }}>
                                <div className="h-3 bg-green-500 rounded" style={{ width: `${p.progressPercent ?? 0}%` }} />
                              </div>
                              <div className="text-xs text-muted-foreground">{p.progressPercent ?? 0}%</div>
                            </div>
                            <div className="mt-2 text-xs">
                              <Badge variant="secondary">{p.status ?? "In Progress"}</Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => (window.location.href = `/projects/${p.id}`)}>View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => (window.location.href = `/projects/${p.id}/edit`)}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { if (confirm("Delete project?")) { /* delete logic if needed */ } }} className="text-destructive">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "invoices" && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <Button onClick={() => activeTab === "invoices" && client?.clientId && fetchInvoicesForClient(client.clientId)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Refresh
                  </Button>
                </div>
                <div className="w-64">
                  <input placeholder="Search invoice number or project" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-left text-xs">
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Currency</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Unpaid</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8">Loading invoices...</td>
                      </tr>
                    ) : invoicesError ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-red-600">{invoicesError}</td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8">No invoices found</td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="border-t">
                          <td className="px-4 py-3">{inv.invoiceNumber ?? "—"}</td>
                          <td className="px-4 py-3">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">{inv.project?.projectName ?? inv.project?.projectCode ?? "—"}</td>
                          <td className="px-4 py-3">{inv.currency ?? "—"}</td>
                          <td className="px-4 py-3">{typeof inv.total === "number" ? inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
                          <td className="px-4 py-3">{typeof inv.unpaidAmount === "number" ? inv.unpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">{inv.status ?? "—"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => (window.location.href = `/invoices/${inv.id}`)}>View</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
