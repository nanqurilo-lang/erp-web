import { type NextRequest, NextResponse } from "next/server"

const API_BASE = "https://chat.swiftandgo.in/employee"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {

    const url = `${API_BASE}/${encodeURIComponent(params.id)}`

    const res = await fetch(url, {
      headers: {
        Authorization: request.headers.get("authorization") || "",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
