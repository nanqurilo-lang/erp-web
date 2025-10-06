import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]

    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "10"
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    const backendParams = new URLSearchParams({
      page,
      limit,
    })

    if (search) {
      backendParams.append("search", search)
    }

    if (status && status !== "all") {
      backendParams.append("status", status)
    }

    if (category && category !== "all") {
      backendParams.append("category", category)
    }

    const response = await fetch(`https://6jnqmj85-8080.inc1.devtunnels.ms/clients?${backendParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch clients data" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching clients data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const formData = await request.formData()

    // ✅ Extract fields
    const client = formData.get("client")
    const profilePicture = formData.get("profilePicture")
    const companyLogo = formData.get("companyLogo")

    // ✅ Validate
    if (!client) {
      return NextResponse.json({ error: "Missing client data" }, { status: 400 })
    }

    // ✅ Build FormData for forwarding
    const forwardData = new FormData()
    forwardData.append("client", client)
    if (profilePicture) forwardData.append("profilePicture", profilePicture)
    if (companyLogo) forwardData.append("companyLogo", companyLogo)

    // ✅ Forward to backend
    const backendURL = "https://6jnqmj85-8080.inc1.devtunnels.ms/clients"
    const response = await fetch(backendURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: forwardData,
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Update failed" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("POST /api/clients error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
