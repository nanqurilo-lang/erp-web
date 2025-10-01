import { type NextRequest, NextResponse } from "next/server"

const API_URL = "https://6jnqmj85-8080.inc1.devtunnels.ms/employee/appreciations"

// Helper to normalize Authorization header
function formatAuthHeader(token: string | null) {
    if (!token) return ""
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`
  }

export async function GET(request: NextRequest) {
    try {
      // Get the authorization token from the incoming request
      const token = request.headers.get("authorization")
  
      // Fetch data from the external API
      const res = await fetch(API_URL, {
        headers: {
          Authorization: token || "",
        },
        cache: "no-store", // Disable caching for fresh data
      })
  
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch appreciations" }, { status: res.status })
      }
  
      const data = await res.json()
  
      return NextResponse.json(data)
    } catch (error) {
      console.error("Error fetching appreciations:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  export async function POST(request: NextRequest) {
    try {
      const token = request.headers.get("authorization")
      const body = await request.json()
  
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: formatAuthHeader(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
  
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to create appreciation" }))
        return NextResponse.json(errorData, { status: res.status })
      }
  
      const data = await res.json()
      return NextResponse.json(data, { status: 201 })
    } catch (error) {
      console.error("Error creating appreciation:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }