import type React from "react"
import ChatRoomsList from "./_components/ChatRoomsList"

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen md:h-[calc(100vh-0rem)] flex flex-col md:flex-row">
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-card">
        {/* Header: compact rounded search box (matches provided image) */}
        <div className="p-4 border-b border-border">
          <div className="w-full">
            <label htmlFor="chat-search" className="sr-only">Search a contact</label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
              </svg>

              <input
                id="chat-search"
                type="text"
                placeholder="Search a contact"
                className="w-full rounded-full border border-gray-200 px-10 py-2 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0"
                aria-label="Search a contact"
              />
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-4rem)] md:h-screen overflow-y-auto">
          <ChatRoomsList />
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-background">{children}</main>
    </div>
  )
}
