
"use client"

import type React from "react"
import { useRef, useState } from "react"

export default function ChatInput({
  chatRoomId,
  senderId,
  receiverId,
  onMessageSent,
}: {
  chatRoomId: string
  senderId: string
  receiverId: string
  onMessageSent?: (message: any) => void
}) {
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // BASE_URL for file uploads (from your message)
  const BASE_URL = "https://6jnqmj85-80.inc1.devtunnels.ms"

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message && !file) return

    try {
      setLoading(true)

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

      // If there's a file, upload it first to the upload endpoint and get back metadata
      let uploadedFileMeta: any = null
      if (file) {
        try {
          const uploadForm = new FormData()
          uploadForm.append("file", file)

          const uploadRes = await fetch(`${BASE_URL}/api/chat/files/upload`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: uploadForm,
          })

          // Read upload response robustly
          const uploadText = await uploadRes.text()
          let uploadData: any
          try {
            uploadData = uploadText ? JSON.parse(uploadText) : null
          } catch {
            uploadData = uploadText
          }

          if (!uploadRes.ok) {
            console.error("File upload failed:", uploadData)
            const messageFromServer =
              typeof uploadData === "object" && uploadData !== null
                ? uploadData.error || uploadData.message
                : String(uploadData || "")
            throw new Error(messageFromServer || "File upload failed")
          }

          uploadedFileMeta = uploadData
        } catch (uploadErr) {
          console.error("Error uploading file:", uploadErr)
          throw uploadErr
        }
      }

      // Now send the chat message. If we uploaded a file, include the returned metadata.
      const formData = new FormData()
      formData.append("chatRoomId", chatRoomId)
      formData.append("senderId", senderId)
      formData.append("receiverId", receiverId)
      formData.append("content", message)
      formData.append("messageType", file ? "FILE" : "TEXT")
      formData.append("status", "SENT")

      // If we have uploadedFileMeta, include it as a JSON string under fileAttachment.
      // This keeps the contract flexible — backend can read JSON or the fields it expects.
      if (uploadedFileMeta) {
        formData.append("fileAttachment", JSON.stringify(uploadedFileMeta))
      }

      const res = await fetch("/api/chats/send", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      // Parse response robustly (API may return JSON or plain text on errors)
      const rawText = await res.text()
      let data: any
      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch {
        data = rawText
      }

      if (!res.ok) {
        console.error("Send message error details:", data)
        const messageFromServer =
          typeof data === "object" && data !== null ? data.error || data.message : String(data || "")
        throw new Error(messageFromServer || "Failed to send message")
      }

      onMessageSent?.(data) // notify parent
      setMessage("")
      setFile(null)

      // Clear native file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Send message error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSendMessage}
      className="flex items-center gap-4 px-6 py-4 border-t border-gray-200 bg-white"
    >
      {/* Upload file button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="chat-file-input"
        />
        <label
          htmlFor="chat-file-input"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 border border-primary text-primary hover:bg-primary/5 cursor-pointer select-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.172 6.172a4 4 0 105.656 5.656L21 13.828a6 6 0 10-8.485-8.486L9.172 8.686" />
          </svg>
          <span className="text-sm">Upload File</span>
        </label>
        {/* show selected file name (small) */}
        {file ? <span className="text-xs text-gray-500 truncate max-w-[120px]">{file.name}</span> : null}
      </div>

      {/* Message input */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message here"
        className="flex-1 rounded-md border border-gray-200 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />

      {/* Send button */}
      <button
        type="submit"
        disabled={loading}
        className="ml-auto inline-flex items-center justify-center px-5 py-2 rounded-md bg-primary text-white text-sm disabled:opacity-60 hover:brightness-95"
      >
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  )
}




