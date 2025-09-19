import { Search, Grid3X3, Users, Briefcase, UserCheck, MessageSquare, Settings, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function MessagingApp() {
  const conversations = [
    {
      id: 1,
      name: "Chaitanya Roy",
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do...",
      time: "6h ago",
      avatar: "/man-with-sunglasses-brown-jacket.jpg",
    },
    {
      id: 2,
      name: "Chaitanya Roy",
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do...",
      time: "6h ago",
      avatar: "/man-with-dark-hair-red-shirt.jpg",
    },
    {
      id: 3,
      name: "Chaitanya Roy",
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do...",
      time: "6h ago",
      avatar: "/man-with-dark-hair-red-shirt.jpg",
    },
    {
      id: 4,
      name: "Chaitanya Roy",
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do...",
      time: "6h ago",
      avatar: "/man-with-dark-hair-red-shirt.jpg",
    },
    {
      id: 5,
      name: "Chaitanya Roy",
      message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do...",
      time: "6h ago",
      avatar: "/man-with-dark-hair-red-shirt.jpg",
    },
  ]

  const chatMessages = [
    {
      id: 1,
      sender: "Chaitanya Roy",
      message:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      time: "11:00 AM",
      avatar: "/man-with-sunglasses-brown-jacket.jpg",
    },
    {
      id: 2,
      sender: "Ritik Singh",
      message:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      time: "11:08 AM",
      avatar: "/man-with-light-hair-casual-shirt.jpg",
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar / Messages List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header (Fixed) */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <Avatar className="w-8 h-8">
                <AvatarImage src="/professional-woman-dark-hair.png" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search a contact" className="pl-10 bg-gray-50 border-gray-200 rounded-full" />
          </div>
        </div>

        {/* Scrollable Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                  <AvatarFallback>CR</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">{conversation.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conversation.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/man-with-sunglasses-brown-jacket.jpg" />
              <AvatarFallback>CR</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chaitanya Roy</h2>
              <p className="text-gray-600">Team Lead</p>
              <p className="text-gray-600">Marketing</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Date Header */}
            <div className="text-center">
              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                29-08-2025
              </span>
            </div>

            {/* Messages */}
            {chatMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={message.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {message.sender
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{message.sender}</span>
                    <span className="text-sm text-gray-500">{message.time}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{message.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Input placeholder="Write a message..." className="flex-1 rounded-full border-gray-300" />
            <Button size="sm" className="rounded-full px-6">
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
