import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Navbar from "@/components/Navbar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1">
          {/* ✅ Sticky Navbar */}
          <div className="sticky top-0 z-10 bg-white shadow-sm flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Navbar />
            </div>
          </div>

          {/* ✅ Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
