import ChatRoomsList from "./_components/ChatRoomsList";


export default function MessagesIndexPage() {
  return (
    <main className="max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-semibold mb-4 text-foreground text-balance">Messages</h1>
      <ChatRoomsList />
    </main>
  )
}
