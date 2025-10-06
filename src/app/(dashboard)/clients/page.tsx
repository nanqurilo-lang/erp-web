"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"



// Define interfaces for type safety
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchClients() {
    setLoading(true)
    try {
      const response = await fetch("/api/clients", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch clients")
      }
      const data = await response.json()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Clients</h1>
          <p className="text-muted-foreground">Manage and view all your clients in one place</p>
          <h1 className="text-3xl font-bold">
        <Link href="/clients/new">
        <Button variant="ghost" size="sm">Create New Client
        </Button>
        </Link>
        </h1>
        </div>
       
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients ({clients.length})</CardTitle>
          <CardDescription>A comprehensive list of all registered clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
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
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.clientId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{client.email}</div>
                        <div className="text-sm text-muted-foreground">{client.mobile ?? "—"}</div>
                        {client.country && <div className="text-xs text-muted-foreground">{client.country}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.category ? (
                        <div className="space-y-1">
                          <Badge variant="secondary">{client.category}</Badge>
                          {client.subCategory && (
                            <div className="text-xs text-muted-foreground">{client.subCategory}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.company ? (
                        <div className="flex items-center gap-2">
                          {client.companyLogoUrl && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={client.companyLogoUrl || "/placeholder.svg"}
                                alt={client.company.companyName}
                              />
                              <AvatarFallback className="text-xs">{client.company.companyName[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div className="font-medium text-sm">{client.company.companyName}</div>
                            {client.company.city && (
                              <div className="text-xs text-muted-foreground">
                                {client.company.city}
                                {client.company.state ? `, ${client.company.state}` : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.status === "ACTIVE" ? "default" : "secondary"}
                        className={client.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{client.addedBy}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
