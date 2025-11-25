"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText, StickyNote } from "lucide-react"

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

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats from APIs
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [totalEarning, setTotalEarning] = useState<number | null>(null)
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState<number | null>(null)
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState<number | null>(null)

  // placeholder avatar using uploaded screenshot path (kept per your assets)
  const placeholderImg = "/mnt/data/Screenshot 2025-11-25 124734.png"

  async function fetchClient() {
    setLoading(true)
    try {
      const response = await fetch(`/api/clients/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch client details")
      }
      const data = await response.json()
      setClient(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // helper to parse responses which may be direct JSON or a JSON string payload
  async function parseJsonResponse(res: Response) {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      // fallback: if text is empty or not JSON, try res.json (should rarely be needed)
      try {
        // @ts-ignore
        return await res.json()
      } catch {
        return null
      }
    }
  }

  // fetch stats for projects and unpaid invoices for this client
  async function fetchClientStats(clientId: string) {
    const auth = { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` }

    // Projects stats
    try {
      const res = await fetch(`/api/projects/client/${clientId}/stats`, { headers: auth })
      if (res.ok) {
        const parsed = await parseJsonResponse(res)
        // parsed may be { projectCount, totalEarning } or other structure — handle safely
        if (parsed && typeof parsed === "object") {
          // if the API returned nested "Response Body" string, parsed might already be the inner object
          const obj =
            typeof parsed.projectCount !== "undefined" || typeof parsed.totalEarning !== "undefined"
              ? parsed
              : typeof parsed.ResponseBody === "string"
              ? JSON.parse(parsed.ResponseBody)
              : parsed
          setProjectCount(Number(obj.projectCount ?? 0))
          setTotalEarning(Number(obj.totalEarning ?? 0))
        }
      } else {
        // non-fatal; keep values null/zero
        setProjectCount(0)
        setTotalEarning(0)
      }
    } catch {
      setProjectCount(0)
      setTotalEarning(0)
    }

    // Unpaid invoices stats
    try {
      const res2 = await fetch(`/api/invoices/client/${clientId}/stats/unpaid`, { headers: auth })
      if (res2.ok) {
        const parsed2 = await parseJsonResponse(res2)
        if (parsed2 && typeof parsed2 === "object") {
          const obj2 =
            typeof parsed2.unpaidInvoiceCount !== "undefined" || typeof parsed2.totalUnpaidAmount !== "undefined"
              ? parsed2
              : typeof parsed2.ResponseBody === "string"
              ? JSON.parse(parsed2.ResponseBody)
              : parsed2
          setUnpaidInvoiceCount(Number(obj2.unpaidInvoiceCount ?? 0))
          setTotalUnpaidAmount(Number(obj2.totalUnpaidAmount ?? 0))
        }
      } else {
        setUnpaidInvoiceCount(0)
        setTotalUnpaidAmount(0)
      }
    } catch {
      setUnpaidInvoiceCount(0)
      setTotalUnpaidAmount(0)
    }
  }

  useEffect(() => {
    if (id) fetchClient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // when client is loaded, fetch stats using client.clientId (do not change other logic)
  useEffect(() => {
    if (client?.clientId) {
      fetchClientStats(client.clientId)
    }
  }, [client])

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

  // small helper to render label/value rows used in Profile Information
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

        {/* Tabs (visual only) */}
        <div className="mt-6 border-b">
          <nav className="flex gap-6 text-sm text-slate-600">
            <button className="pb-3 border-b-2 border-primary text-primary font-medium">Profile</button>
            <button className="pb-3">Projects</button>
            <button className="pb-3">Invoices</button>
            <button className="pb-3">Credit Notes</button>
            <button className="pb-3">Payments</button>
            <button className="pb-3">Documents</button>
            <button className="pb-3">Notes</button>
          </nav>
        </div>
      </div>

      {/* Top summary row: avatar card + 3 stat cards (now populated from APIs) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Avatar card */}
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

        {/* Stat cards (span remaining columns) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="text-sm text-slate-600">Total Projects</div>
              <div className="text-2xl font-semibold text-blue-600 mt-2">
                {projectCount !== null ? projectCount : "—"}
              </div>
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
              <div className="text-2xl font-semibold text-blue-600 mt-2">
                {unpaidInvoiceCount !== null ? unpaidInvoiceCount : "—"}
              </div>
              {totalUnpaidAmount !== null && (
                <div className="text-xs text-muted-foreground mt-1">
                  {totalUnpaidAmount.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main content: left profile info (wide) and right charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Information (span 2) */}
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

        {/* Right column: Projects + Invoices cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder chart area — visual only */}
              <div className="h-40 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-blue-500/90" />
                <div className="ml-4 text-sm">
                  <div className="text-xs text-slate-600">Finished</div>
                  <div className="text-xs text-slate-600">To Do</div>
                  <div className="text-xs text-slate-600">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder invoice chart */}
              <div className="h-40 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-green-600/90" />
                <div className="ml-4 text-sm">
                  <div className="text-xs text-slate-600">Paid</div>
                  <div className="text-xs text-slate-600">Credit Note</div>
                  <div className="text-xs text-slate-600">Unpaid</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
