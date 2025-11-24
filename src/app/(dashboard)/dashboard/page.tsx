"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Employee { employeeId: string; name: string; departmentName: string; designationName: string; profilePictureUrl?: string; }

const MAIN = process.env.NEXT_PUBLIC_MAIN || "https://chat.swiftandgo.in";
const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY || MAIN;

const PROFILE_URL = `${MAIN}/employee/me`;
const ACTIVITIES_URL = (date: string) => `${MAIN}/employee/attendance/clock/activities?date=${date}`;
const PROJECT_COUNTS_URL = `${MAIN}/api/projects/counts`;
const TASK_COUNTS_URL = `${MAIN}/api/projects/tasks/status/counts`;
const DEAL_STATS_URL = `${MAIN}/deals/stats`;
const FOLLOWUPS_URL = `${MAIN}/deals/followups/summary`;

const CLOCK_IN_URL = `${GATEWAY}/employee/attendance/clock/in`;
const CLOCK_OUT_URL = `${GATEWAY}/employee/attendance/clock/out`;

export default function Dashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState("");
  const [showClockModal, setShowClockModal] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [form, setForm] = useState({ clockInLocation: "Office Gate A", clockInWorkingFrom: "Office" });
  const fetchedRef = useRef(false);
  const fetchedCountsRef = useRef(false);

  const timelogData = { duration: "4hrs", progress: 50 };
  const tasks = [
    { id: "RTA-40", name: "Planning", status: "To do", dueDate: "02/08/2025", priority: "Medium" },
    { id: "RTA-41", name: "Testing", status: "Doing", dueDate: "02/08/2025", priority: "High" },
    { id: "RTA-42", name: "Testing", status: "Incomplete", dueDate: "02/08/2025", priority: "Low" },
  ];

  const [projectCounts, setProjectCounts] = useState({ pending: 0, overdue: 0 });
  const [taskCounts, setTaskCounts] = useState({ pending: 0, overdue: 0 });
  const [dealCounts, setDealCounts] = useState({ totalDeals: 0, convertedDeals: 0 });
  const [followUpSummary, setFollowUpSummary] = useState({ pending: 0, upcoming: 0 });

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No token");
        const r = await fetch(PROFILE_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error("profile fetch failed");
        const d = await r.json();
        setEmployee({ employeeId: d.employeeId, name: d.name, departmentName: d.departmentName, designationName: d.designationName, profilePictureUrl: d.profilePictureUrl });
      } catch (e) { console.warn(e); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (fetchedCountsRef.current) return;
    fetchedCountsRef.current = true;
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [pRes, tRes, dRes, fRes] = await Promise.all([
          fetch(PROJECT_COUNTS_URL, { headers }),
          fetch(TASK_COUNTS_URL, { headers }),
          fetch(DEAL_STATS_URL, { headers }),
          fetch(FOLLOWUPS_URL, { headers }),
        ]);
        if (pRes.ok) { const p = await pRes.json(); setProjectCounts({ pending: p.pendingCount ?? 0, overdue: p.overdueCount ?? 0 }); }
        if (tRes.ok) { const t = await tRes.json(); setTaskCounts({ pending: t.pendingCount ?? 0, overdue: t.overdueCount ?? 0 }); }
        if (dRes.ok) { const d = await dRes.json(); setDealCounts({ totalDeals: d.totalDeals ?? 0, convertedDeals: d.convertedDeals ?? 0 }); }
        // <-- IMPORTANT: map followups response keys (pendingCount/upcomingCount)
        if (fRes.ok) { const f = await fRes.json(); setFollowUpSummary({ pending: f.pendingCount ?? 0, upcoming: f.upcomingCount ?? 0 }); }
      } catch (e) { console.warn("summary fetch failed", e); }
    })();
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
    tick(); const id = setInterval(tick, 1000);

    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const r = await fetch(ACTIVITIES_URL(new Date().toISOString().slice(0, 10)), { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const d = await r.json(); setActivities(Array.isArray(d) ? d : []);
        setIsClockedIn((d || []).some((a:any) => (a.type === "IN" || a.clockInTime) && !a.clockOutTime));
      } catch (e) { console.warn(e); }
    })();

    return () => clearInterval(id);
  }, []);

  const hhmmss = (date = new Date()) => date.toTimeString().slice(0, 8);

  const handleClockIn = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token");
      const body = { clockInTime: hhmmss(new Date()), clockInLocation: form.clockInLocation, clockInWorkingFrom: form.clockInWorkingFrom };
      const r = await fetch(CLOCK_IN_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Clock in failed");
      setShowClockModal(false); setIsClockedIn(true);
      const act = await fetch(ACTIVITIES_URL(new Date().toISOString().slice(0,10)), { headers: { Authorization: `Bearer ${token}` } });
      if (act.ok) { const dd = await act.json(); setActivities(Array.isArray(dd) ? dd : []); }
    } catch (e) { alert(String(e)); }
  };

  const handleClockOut = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token");
      const body = { clockOutTime: hhmmss(new Date()), clockOutLocation: form.clockInLocation, clockOutWorkingFrom: form.clockInWorkingFrom };
      const r = await fetch(CLOCK_OUT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Clock out failed");
      setIsClockedIn(false);
      const act = await fetch(ACTIVITIES_URL(new Date().toISOString().slice(0,10)), { headers: { Authorization: `Bearer ${token}` } });
      if (act.ok) { const dd = await act.json(); setActivities(Array.isArray(dd) ? dd : []); }
    } catch (e) { alert(String(e)); }
  };

  if (loading) return <div className="flex justify-center items-center h-[220px]">Loading…</div>;
  if (!employee) return <div className="p-6 text-muted-foreground">No profile</div>;

  const SummaryCard = ({ title, a, aLabel, aColor, b, bLabel, bColor }:
    { title: string; a: number | string; aLabel?: string; aColor?: string; b?: number | string; bLabel?: string; bColor?: string }) => (
    <Card className="border-0 shadow-sm bg-white">
      <div className="p-4">
        <div className="text-sm text-muted-foreground mb-2">{title}</div>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${aColor ?? "text-primary"}`}>{a}</div>
            {aLabel && <div className="text-xs text-muted-foreground mt-1">{aLabel}</div>}
          </div>
          {b !== undefined && (
            <div className="text-right">
              <div className={`text-lg font-semibold ${bColor ?? "text-destructive"}`}>{b}</div>
              {bLabel && <div className="text-xs text-muted-foreground mt-1">{bLabel}</div>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-screen-xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome {employee.name}</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">{now}</div>
          {!isClockedIn ? <Button onClick={() => setShowClockModal(true)}><Clock className="mr-2 h-4 w-4" />Clock In</Button> : <Button onClick={handleClockOut} variant="destructive"><Clock className="mr-2 h-4 w-4" />Clock Out</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-lg border p-4 flex gap-4 items-center bg-white shadow-sm">
            <div className="h-16 w-16 rounded-full overflow-hidden border">
              {employee.profilePictureUrl ? <img src={employee.profilePictureUrl} alt={employee.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">No Img</div>}
            </div>
            <div>
              <div className="font-medium text-base">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.designationName} · {employee.departmentName}</div>
              <div className="text-xs text-muted-foreground mt-1">Employee Code - {employee.employeeId}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard title="Projects" a={projectCounts.pending.toString().padStart(2,'0')} aLabel="Pending" aColor="text-blue-600" b={projectCounts.overdue.toString().padStart(2,'0')} bLabel="Overdue" bColor="text-red-500" />
          <SummaryCard title="Tasks" a={taskCounts.pending.toString().padStart(2,'0')} aLabel="Pending" aColor="text-blue-600" b={taskCounts.overdue.toString().padStart(2,'0')} bLabel="Overdue" bColor="text-red-500" />
          <SummaryCard title="Follow Ups" a={followUpSummary.pending.toString().padStart(2,'0')} aLabel="Pending" aColor="text-blue-600" b={followUpSummary.upcoming.toString().padStart(2,'0')} bLabel="Upcoming" bColor="text-green-600" />
          <SummaryCard title="Deals" a={dealCounts.totalDeals.toString().padStart(2,'0')} aLabel="Total Deals" aColor="text-blue-600" b={dealCounts.convertedDeals.toString().padStart(2,'0')} bLabel="Converted Deals" bColor="text-green-600" />
        </div>
      </div>

      {/* tasks left, timelogs right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-2 text-lg">My Tasks</div>
              <div className="mt-4 border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50"><tr><th className="p-3 text-left">Task #</th><th className="p-3 text-left">Task Name</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Due Date</th></tr></thead>
                  <tbody>{tasks.map((t,i)=>(<tr key={i} className="border-t"><td className="p-3">{t.id}</td><td className="p-3">{t.name}</td><td className="p-3"><Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">{t.status}</Badge></td><td className="p-3">{t.dueDate}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-primary" />Week Timelogs</div>
              <div className="flex justify-center gap-3 mt-4 text-sm">{["Mo","Tu","We","Th","Fr","Sa","Su"].map((d,ix)=>(<div key={d} className={`w-8 h-8 rounded-full flex items-center justify-center ${ix===0 ? "bg-primary text-white":"bg-muted text-muted-foreground"}`}>{d}</div>))}</div>
              <div className="mt-4"><div className="w-full bg-muted h-3 rounded overflow-hidden relative"><div className="h-full bg-primary" style={{width: '65%'}} /></div><div className="text-xs text-muted-foreground mt-2">Duration: {timelogData.duration}</div></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Appreciations */}
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <div className="p-4 text-lg font-medium">Appreciations</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50"><tr><th className="p-3 text-left">Given To</th><th className="p-3 text-left">Award Name</th><th className="p-3 text-left">Given On</th><th className="p-3 text-left">Action</th></tr></thead>
              <tbody>{[{name:"Riya Sharma",role:"Trainee",award:"Top SDE",date:"20/08/2025"},{name:"Jack Smith",role:"Trainee",award:"Top Tester",date:"20/08/2025"}].map((r,i)=>(<tr key={i} className="border-b"><td className="p-3 flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-muted" /><div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.role}</div></div></td><td className="p-3">{r.award}</td><td className="p-3">{r.date}</td><td className="p-3">•••</td></tr>))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
