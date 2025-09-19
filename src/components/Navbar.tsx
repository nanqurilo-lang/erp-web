// src/components/Navbar.tsx
"use client";

import { usePathname } from "next/navigation";

const pathToTitle: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/deals": "Deals",
  "/client": "Client",
  "/work/project": "Project",
  "/work/task": "Task",
  "/work/timesheet": "Timesheet",
  "/work/roadmap": "Project Roadmap",
  "/hr/attendance": "Attendance",
  "/hr/leave": "Leave",
  "/hr/holiday": "Holiday",
  "/hr/appreciation": "Appreciation",
  "/message": "Message",
  "/settings": "Settings",
};

export default function Navbar() {
  const pathname = usePathname();
  const pageTitle = pathToTitle[pathname] ?? "Qurilo"; // fallback

  return (
    <nav className="w-full bg-white shadow px-6 py-3 flex justify-between">
      <h1 className="text-2xl font-semibold">{pageTitle}</h1>

      {/* Right-side actions (optional) */}
      <div className="flex gap-4">
        {/* Example placeholder */}
        <span className="text-gray-600">User</span>
      </div>
    </nav>
  );
}
