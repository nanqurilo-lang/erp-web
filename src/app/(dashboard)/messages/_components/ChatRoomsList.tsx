"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface ChatRoom {
  id: string
  participant1Id: string
  participant2Id: string
  participant1Details: {
    employeeId: string
    name: string
    profileUrl: string | null
    designation: string | null
    department: string | null
  }
  participant2Details: {
    employeeId: string
    name: string
    profileUrl: string | null
    designation: string | null
    department: string | null
  }
  lastMessage?: {
    content: string | null
    messageType: "TEXT" | "FILE"
    fileAttachment?: {
      fileName: string
      fileUrl: string
    } | null
    createdAt: string
  }
  unreadCount: number
}

interface CurrentUser {
  employeeId: string
}

export default function ChatRoomsList() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pathname = usePathname()
  const selectedIdFromPath = pathname?.split("/").pop() ?? ""

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) throw new Error("No access token found")

        const headers: HeadersInit = { Authorization: `Bearer ${token}` }

        const [profileRes, roomsRes] = await Promise.all([
          fetch("/api/profile", { headers }),
          fetch("/api/chats/rooms", { headers, cache: "no-store" })
        ])

        if (!profileRes.ok) throw new Error("Failed to fetch profile")
        if (!roomsRes.ok) throw new Error("Failed to fetch chat rooms")

        const profileData = await profileRes.json()
        setCurrentUser({ employeeId: profileData.employeeId })

        const roomsData = await roomsRes.json()
        setRooms(roomsData)
      } catch (err: any) {
        setError(err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p className="text-center text-muted-foreground">Loading chats...</p>
  if (error) return <p className="text-center text-destructive">{error}</p>
  if (!currentUser) return <p className="text-center text-muted-foreground">Unable to load user profile.</p>

  const formatRelative = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    const hr = Math.floor(min / 60)
    const day = Math.floor(hr / 24)
    if (day >= 1) return `${day}d ago`
    if (hr >= 1) return `${hr}h ago`
    if (min >= 1) return `${min}m ago`
    return "just now"
  }

  return (
    <aside className="w-full max-w-[340px] p-4">
      {/* Chat List */}
      <div className="space-y-3">
        {rooms.map((room) => {
          const partner =
            room.participant1Details.employeeId === currentUser.employeeId
              ? room.participant2Details
              : room.participant1Details

          const isSelected = partner.employeeId === selectedIdFromPath

          const lastText =
            room.lastMessage?.messageType === "FILE"
              ? `📎 ${room.lastMessage.fileAttachment?.fileName ?? "Attachment"}`
              : room.lastMessage?.content ?? "No messages yet"

          return (
            <Link
              key={room.id}
              href={`/messages/${partner.employeeId}`}
              className="block"
              aria-label={`Open chat with ${partner.name}`}
            >
              <div
                className={
                  "flex items-center gap-3 p-3 rounded-2xl border " +
                  (isSelected
                    ? "bg-blue-100 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 hover:shadow-sm")
                }
              >
                <div className="flex-none">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src={partner.profileUrl || "/placeholder.svg?height=48&width=48&query=User%20avatar"}
                      alt={partner.name}
                      width={48}
                      height={48}
                      className="object-cover rounded-full"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">{partner.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 truncate">{lastText}</p>
                    </div>

                    <div className="flex flex-col items-end ml-3">
                      <span className="text-xs text-gray-400">{formatRelative(room.lastMessage?.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
