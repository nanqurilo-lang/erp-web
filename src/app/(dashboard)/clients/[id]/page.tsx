"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Company {
  companyName: string
  city?: string
  state?: string
}

interface Client {
  id: string
  name: string
  clientId: string
  profilePictureUrl?: string
  email: string
  mobile?: string
  country?: string
  category?: string
  subCategory?: string
  company?: Company
  companyLogoUrl?: string
  status: "ACTIVE" | "INACTIVE" | string
  addedBy: string
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (id) {
      fetchClient()
    }
  }, [id])

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/clients">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2">{client.name}</h1>
        <p className="text-muted-foreground">Client ID: {client.clientId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Personal and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={client.profilePictureUrl || "/placeholder.svg"} alt={client.name} />
                  <AvatarFallback>
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.clientId}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              {client.mobile && (
                <div>
                  <p className="text-sm font-medium">Mobile</p>
                  <p className="text-sm text-muted-foreground">{client.mobile}</p>
                </div>
              )}
              {client.country && (
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">{client.country}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge
                  variant={client.status === "ACTIVE" ? "default" : "secondary"}
                  className={client.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {client.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Added By</p>
                <p className="text-sm text-muted-foreground">{client.addedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company and Category Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company & Category</CardTitle>
            <CardDescription>Organization and classification details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.company ? (
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <div className="flex items-center gap-3 mt-1">
                    {client.companyLogoUrl && (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={client.companyLogoUrl || "/placeholder.svg"} alt={client.company.companyName} />
                        <AvatarFallback>{client.company.companyName[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">{client.company.companyName}</p>
                      {(client.company.city || client.company.state) && (
                        <p className="text-sm text-muted-foreground">
                          {client.company.city}
                          {client.company.state ? `, ${client.company.state}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p className="text-sm text-muted-foreground">—</p>
                </div>
              )}
              {client.category && (
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <Badge variant="secondary">{client.category}</Badge>
                </div>
              )}
              {client.subCategory && (
                <div>
                  <p className="text-sm font-medium">Subcategory</p>
                  <p className="text-sm text-muted-foreground">{client.subCategory}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}