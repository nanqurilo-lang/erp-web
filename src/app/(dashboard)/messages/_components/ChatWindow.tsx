"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import ChatInput from "./ChatInput"

interface Message {
  id: number
  chatRoomId: string
  senderId: string
  receiverId: string
  content: string
  messageType: "TEXT" | "FILE"
  fileAttachment: { fileName: string; fileUrl: string } | null
  status: string
  createdAt: string
  deletedForCurrentUser: boolean
  senderDetails: {
    employeeId: string
    name: string
    profileUrl: string | null
    designation: string | null
    department: string | null
  }
  receiverDetails: {
    employeeId: string
    name: string
    profileUrl: string | null
    designation: string | null
    department: string | null
  }
}

interface ChatWindowProps {
  chatRoomId: string
  employeeid: string
  receiverId: string
}

const fetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(url, { headers, cache: "no-store" })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || "Failed to fetch")
  }
  return res.json()
}

export default function ChatWindow({ chatRoomId, employeeid, receiverId }: ChatWindowProps) {
  const [currentUserId, setCurrentUserId] = useState(employeeid || "")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!employeeid) {
      const fromLS = localStorage.getItem("employeeId")
      if (fromLS) setCurrentUserId(fromLS)
    }
  }, [employeeid])

  const { data, error, isLoading, mutate } = useSWR<Message[]>(
    receiverId ? `/api/chats/history/${receiverId}` : null,
    fetcher,
    { revalidateOnFocus: true }
  )

  const messages = data || []

  // receiver details: prefer explicit receiver info from messages, fallback to first message sender
  const receiverDetails =
    messages.length > 0
      ? messages.find((m) => m.receiverDetails.employeeId === receiverId)?.receiverDetails ||
        messages[0]?.senderDetails
      : null

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Optimistic update when new message sent
  const handleMessageSent = (newMessage: Message) => {
    mutate((prev) => (prev ? [...prev, newMessage] : [newMessage]), false)
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  if (isLoading) return <p className="text-center text-muted-foreground">Loading chat...</p>
  if (error) return <p className="text-center text-destructive">{(error as Error).message}</p>

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-white">
      {/* Header: rounded card-like, avatar as rounded square, name + two small lines */}
      {receiverDetails && (
        <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-border">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
            <Image
              src={receiverDetails.profileUrl || "/placeholder.svg?height=64&width=64&query=User%20avatar"}
              alt={receiverDetails.name}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight">{receiverDetails.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{receiverDetails.designation || "No designation"}</p>
            <p className="text-sm text-muted-foreground">{receiverDetails.department || "No department"}</p>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[rgba(250,250,250,0.8)]">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId

          if (msg.deletedForCurrentUser) {
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {!isMine && (
                  <Image
                    src={msg.senderDetails.profileUrl || "/placeholder.svg?height=32&width=32&query=User%20avatar"}
                    alt={msg.senderDetails.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <div className="px-3 py-2 rounded-xl max-w-xs bg-muted italic text-muted-foreground">
                  This message was deleted
                </div>
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isMine ? "justify-end" : "justify-start"}`}
            >
              {!isMine && (
                <Image
                  src={msg.senderDetails.profileUrl || "/placeholder.svg?height=32&width=32&query=User%20avatar"}
                  alt={msg.senderDetails.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}

              <div
                className={`px-4 py-3 rounded-2xl max-w-[75%] break-words ${
                  isMine ? "bg-primary text-primary-foreground" : "bg-white border border-border text-foreground"
                }`}
              >
                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                {msg.fileAttachment && (
                  <a
                    href={msg.fileAttachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 inline-block underline break-all ${isMine ? "text-primary-foreground" : "text-foreground"}`}
                  >
                    📎 {msg.fileAttachment.fileName}
                  </a>
                )}
                <div className={`text-[11px] mt-1 ${isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input (kept identical in behavior) */}
      <ChatInput
        chatRoomId={chatRoomId}
        senderId={currentUserId}
        receiverId={receiverId}
        onMessageSent={handleMessageSent}
      />
    </div>
  )
}
