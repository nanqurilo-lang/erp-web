// app/(your-folder)/TimesheetPage.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  Edit2,
  Trash2,
  Grid,
  Calendar,
  List,
  X,
} from "lucide-react";

const MAIN = process.env.NEXT_PUBLIC_MAIN || "https://6jnqmj85-80.inc1.devtunnels.ms";

type EmployeeItem = {
  employeeId: string;
  name: string;
  profileUrl?: string | null;
  designation?: string | null;
  department?: string | null;
};

type Timesheet = {
  id: number;
  projectId?: number;
  projectShortCode?: string;
  taskId?: number;
  employeeId?: string;
  employees?: EmployeeItem[];
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  memo?: string;
  durationHours?: number;
  createdBy?: string;
  createdAt?: string;
};

export default function TimesheetPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("All");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");

  const [showFilters, setShowFilters] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 9;

  type ViewMode = "table" | "list" | "calendar" | "weekly";
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // ====== Log Time drawer state (expanded form) ======
  const [showLogModal, setShowLogModal] = useState(false);
  const [logProjectShortCode, setLogProjectShortCode] = useState("");
  const [logTaskId, setLogTaskId] = useState<string>(""); // string to allow empty
  const [logEmployeeId, setLogEmployeeId] = useState("");
  const [logStartDate, setLogStartDate] = useState("");
  const [logStartTime, setLogStartTime] = useState("");
  const [logEndDate, setLogEndDate] = useState("");
  const [logEndTime, setLogEndTime] = useState("");
  const [logMemo, setLogMemo] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [computedHours, setComputedHours] = useState<number>(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTimesheetId, setEditTimesheetId] = useState<number | null>(null);

  // ====== Projects loaded from API for project dropdown ======
  const [projectOptions, setProjectOptions] = useState<string[]>(["--"]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // derive selects from loaded timesheets (simple approach) for tasks/employees
  const taskOptions = useMemo(() => {
    const s = new Set<number>();
    timesheets.forEach((t) => {
      if (typeof t.taskId === "number") s.add(t.taskId);
    });
    // map to strings
    return ["--", ...Array.from(s).map((n) => String(n))];
  }, [timesheets]);

  const employeeOptions = useMemo(() => {
    const s = new Set<string>();
    timesheets.forEach((t) => t.employees?.forEach((e) => e?.employeeId && s.add(e.employeeId)));
    return ["--", ...Array.from(s)];
  }, [timesheets]);

  const departmentOptions = useMemo(() => {
    const s = new Set<string>();
    timesheets.forEach((t) => t.employees?.forEach((e) => e?.department && s.add(e.department)));
    return ["All", ...Array.from(s)];
  }, [timesheets]);

  // helper to format datetime nicely
  function formatDateTime(dateISO?: string, time?: string) {
    if (!dateISO) return "";
    try {
      const combined = time ? `${dateISO}T${time}` : `${dateISO}T00:00:00`;
      const d = new Date(combined);
      if (Number.isNaN(d.getTime())) return `${dateISO} ${time ?? ""}`;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${dd}/${mm}/${yyyy} ${hours}:${minutes} ${ampm}`;
    } catch {
      return `${dateISO} ${time ?? ""}`;
    }
  }

  // compute duration in hours whenever start/end fields change
  useEffect(() => {
    if (!logStartDate || !logStartTime) {
      setComputedHours(0);
      return;
    }
    try {
      const start = new Date(`${logStartDate}T${logStartTime}`);
      const end = (logEndDate && logEndTime) ? new Date(`${logEndDate}T${logEndTime}`) : null;
      if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        setComputedHours(0);
        return;
      }
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      // round to 2 decimals
      setComputedHours(Math.round(hours * 100) / 100);
    } catch {
      setComputedHours(0);
    }
  }, [logStartDate, logStartTime, logEndDate, logEndTime]);

  // ====== load timesheets similar to previous implementation ======
  const loadTimesheets = useCallback(
    async (accessToken?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const resolvedToken = accessToken || token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
          search: searchQuery || "",
          employee: filterEmployee !== "all" ? filterEmployee : "",
          department: filterDepartment !== "all" ? filterDepartment : "",
        });
        const url = `${MAIN}/timesheets?${params.toString()}`;
        const res = await fetch(url, {
          method: "GET",
          headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}`, Accept: "application/json" } : { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 401) {
          try { localStorage.removeItem("accessToken"); } catch {}
          setToken(null);
          setTimesheets([]);
          setTotalPages(1);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("timesheets fetch failed", res.status, txt);
          throw new Error(`Failed to load timesheets (${res.status})`);
        }
        const data = await res.json();
        let items: Timesheet[] = [];
        if (Array.isArray(data)) {
          items = data;
          setTotalPages(Math.max(1, Math.ceil((data.length || 0) / itemsPerPage)));
        } else {
          items = Array.isArray(data.items) ? data.items : [];
          setTotalPages(data.totalPages ?? Math.max(1, Math.ceil((data.total ?? items.length) / itemsPerPage)));
        }
        setTimesheets(items);
      } catch (err: any) {
        console.error("loadTimesheets error", err);
        setError(String(err?.message ?? err));
        setTimesheets([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, searchQuery, filterEmployee, filterDepartment, token]
  );

  // ====== load projects for Project dropdown (from API) ======
  const loadProjects = useCallback(
    async (accessToken?: string | null) => {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        const resolvedToken = accessToken || token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
        // API path provided by you: /projects/AllProject
        const url = `${MAIN}/projects/AllProject`;
        const res = await fetch(url, {
          method: "GET",
          headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}`, Accept: "application/json" } : { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 401) {
          // clear token client-side
          try { localStorage.removeItem("accessToken"); } catch {}
          setToken(null);
          setProjectOptions(["--"]);
          setProjectsLoading(false);
          return;
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("projects fetch failed", res.status, txt);
          throw new Error(`Failed to load projects (${res.status})`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          // use shortCode; ensure unique and include "--" placeholder
          const codes = Array.from(new Set(data.map((p: any) => (p?.shortCode ?? "").toString()).filter(Boolean)));
          setProjectOptions(["--", ...codes]);
        } else {
          console.warn("unexpected projects response", data);
          setProjectOptions(["--"]);
        }
      } catch (err: any) {
        console.error("loadProjects error", err);
        setProjectsError(String(err?.message ?? err));
        setProjectOptions(["--"]);
      } finally {
        setProjectsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery((prev) => {
        if (prev !== searchInput) {
          setCurrentPage(1);
          return searchInput;
        }
        return prev;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("accessToken");
      setToken(saved);
      loadTimesheets(saved);
      loadProjects(saved); // load projects on initial mount too
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) {
      loadTimesheets(token);
      loadProjects(token);
    } else {
      loadTimesheets(null);
      loadProjects(null);
    }
  }, [loadTimesheets, loadProjects, token, currentPage, searchQuery, filterEmployee, filterDepartment]);

  // ====== create timesheet uses the new fields ======
  const createTimesheet = async () => {
    // require project, task, employee, start date/time
    if (!logProjectShortCode || logProjectShortCode === "--") return alert("Project required");
    if (!logTaskId || logTaskId === "--") return alert("Task required");
    if (!logEmployeeId || logEmployeeId === "--") return alert("Employee required");
    if (!logStartDate || !logStartTime) return alert("Start date/time required");

    setLogSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("projectShortCode", logProjectShortCode);
      fd.append("taskId", String(logTaskId));
      fd.append("employeeId", logEmployeeId);
      fd.append("startDate", logStartDate);
      fd.append("startTime", logStartTime);
      fd.append("endDate", logEndDate || "");
      fd.append("endTime", logEndTime || "");
      fd.append("memo", logMemo || "");
      // optionally send computed hours
      fd.append("durationHours", String(computedHours ?? 0));

      const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

      const res = await fetch(`${MAIN}/timesheets`, {
        method: "POST",
        body: fd,
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("create timesheet failed", res.status, text);
        throw new Error("Failed to create timesheet");
      }
      await loadTimesheets(token ?? null);
      setShowLogModal(false);
      // reset log form
      setLogProjectShortCode("");
      setLogTaskId("");
      setLogEmployeeId("");
      setLogStartDate("");
      setLogStartTime("");
      setLogEndDate("");
      setLogEndTime("");
      setLogMemo("");
      setComputedHours(0);
    } catch (err) {
      console.error("createTimesheet error", err);
      alert("Failed to create timesheet");
    } finally {
      setLogSubmitting(false);
    }
  };

  const openEdit = (id: number) => {
    setEditTimesheetId(id);
    setShowEditModal(true);
  };

  const deleteTimesheet = async (id: number) => {
    if (!confirm("Delete this timesheet entry?")) return;
    const prev = timesheets.slice();
    setTimesheets((t) => t.filter((x) => x.id !== id));
    try {
      const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      const res = await fetch(`${MAIN}/timesheets/${id}`, {
        method: "DELETE",
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      console.error("deleteTimesheet error", err);
      setTimesheets(prev);
      alert("Failed to delete timesheet");
    }
  };

  // -- simple EditModal omitted for brevity (same as before) --
  function EditModal({ id, onClose }: { id: number; onClose: () => void }) {
    const [local, setLocal] = useState<Timesheet | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
          const res = await fetch(`${MAIN}/timesheets/${id}`, {
            headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
            cache: "no-store",
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("Fetch timesheet failed", res.status, txt);
            alert("Failed to load timesheet");
            return;
          }
          const data = await res.json();
          if (!mounted) return;
          setLocal(data);
        } catch (err) {
          console.error("Load timesheet error", err);
          alert("Failed to load timesheet");
        }
      })();
      return () => { mounted = false; };
    }, [id]);

    const handleSave = async () => {
      if (!local) return;
      setSaving(true);
      try {
        const fd = new FormData();
        fd.append("projectShortCode", local.projectShortCode ?? "");
        fd.append("employeeId", local.employeeId ?? "");
        fd.append("startDate", local.startDate ?? "");
        fd.append("startTime", local.startTime ?? "");
        fd.append("endDate", local.endDate ?? "");
        fd.append("endTime", local.endTime ?? "");
        fd.append("memo", local.memo ?? "");

        const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
        const res = await fetch(`${MAIN}/timesheets/${id}`, {
          method: "PUT",
          body: fd,
          headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("Update timesheet failed", res.status, txt);
          throw new Error("Update failed");
        }
        await loadTimesheets(token ?? null);
        onClose();
      } catch (err) {
        console.error("handleSave error", err);
        alert("Failed to update");
      } finally {
        setSaving(false);
      }
    };

    if (!local)
      return (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <div className="relative w-full max-w-2xl bg-white rounded-lg p-6 z-10">Loading...</div>
        </div>
      );

    return (
      <div className="fixed inset-0 z-[12000] flex items-start justify-center pt-12 px-4 overflow-y-auto">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-y-auto z-10">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Edit Timesheet</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Project Short Code</label>
                <Input value={local.projectShortCode ?? ""} onChange={(e) => setLocal({ ...local, projectShortCode: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Employee Id</label>
                <Input value={local.employeeId ?? ""} onChange={(e) => setLocal({ ...local, employeeId: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Start Date</label>
                <Input type="date" value={local.startDate ?? ""} onChange={(e) => setLocal({ ...local, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Start Time</label>
                <Input type="time" value={local.startTime ?? ""} onChange={(e) => setLocal({ ...local, startTime: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">End Date</label>
                <Input type="date" value={local.endDate ?? ""} onChange={(e) => setLocal({ ...local, endDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600">End Time</label>
                <Input type="time" value={local.endTime ?? ""} onChange={(e) => setLocal({ ...local, endTime: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Memo</label>
              <textarea rows={3} value={local.memo ?? ""} onChange={(e) => setLocal({ ...local, memo: e.target.value })} className="w-full p-2 border rounded" />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button className="bg-blue-600 text-white" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // filtered list for display (same as before)
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return timesheets.filter((t) => {
      if (employeeFilter !== "All") {
        const has = (t.employees ?? []).some((e) => e.name === employeeFilter);
        if (!has) return false;
      }
      if (departmentFilter !== "All") {
        const has = (t.employees ?? []).some((e) => e.department === departmentFilter);
        if (!has) return false;
      }
      if (!q) return true;
      if (String(t.projectShortCode ?? "").toLowerCase().includes(q)) return true;
      if (String(t.memo ?? "").toLowerCase().includes(q)) return true;
      const empMatch = (t.employees ?? []).some((e) => (e.name ?? "").toLowerCase().includes(q) || (e.designation ?? "").toLowerCase().includes(q));
      if (empMatch) return true;
      return false;
    });
  }, [timesheets, searchQuery, employeeFilter, departmentFilter]);

  // small row rendering (kept simple)
  const TimesheetRow: React.FC<{ t: Timesheet }> = ({ t }) => {
    const employee = t.employees && t.employees.length > 0 ? t.employees[0] : undefined;
    const avatar = employee?.profileUrl ?? "/_next/static/media/avatar-placeholder.7b9f2b3a.jpg";
    return (
      <tr key={t.id} className="even:bg-white odd:bg-white border-t">
        <td className="py-4 px-4 text-sm text-gray-700 border-r align-top">{t.projectShortCode ?? "—"}</td>
        <td className="py-4 px-4 border-r align-top">
          <div className="text-sm font-medium">Task Name</div>
          <div className="text-xs text-gray-400 mt-1">{t.memo ?? ""}</div>
        </td>
        <td className="py-4 px-4 border-r align-top">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src={avatar} alt={employee?.name ?? "employee"} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-sm text-gray-800">{employee?.name ?? t.employeeId ?? "—"}</div>
              <div className="text-xs text-gray-400">{employee?.designation ?? employee?.department ?? ""}</div>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 border-r align-top text-sm text-gray-600">{formatDateTime(t.startDate, t.startTime)}</td>
        <td className="py-4 px-4 border-r align-top text-sm text-gray-600">{formatDateTime(t.endDate, t.endTime)}</td>
        <td className="py-4 px-4 border-r align-top text-sm text-gray-700">{t.durationHours ?? 0}h</td>
        <td className="py-4 px-4 align-top text-right">
          <div className="inline-flex items-center">
            <button className="p-1 rounded hover:bg-gray-100" onClick={() => openEdit(t.id)} title="Edit"><Edit2 className="h-4 w-4 text-gray-600" /></button>
            <button className="p-1 rounded hover:bg-gray-100 ml-2" onClick={() => deleteTimesheet(t.id)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button>
          </div>
        </td>
      </tr>
    );
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full">
        <div className="max-w-[1180px] mx-auto ">
          {/* top filters bar */}
          <div className="bg-white rounded-lg border p-3 mb-4 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Duration</span>
              <Input placeholder="Start Date to End Date" className="w-64" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Employee</span>
              <Select value={employeeFilter} onValueChange={(v) => setEmployeeFilter(v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {employeeOptions.slice(1).map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                <Search className="w-4 h-4" /> Filters
              </button>
            </div>
          </div>

          {/* Log Time + search + view icons row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button className="bg-blue-600 text-white" onClick={() => setShowLogModal(true)}>+ Log Time</Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border rounded px-2 py-1 bg-white">
                <Search className="w-4 h-4 text-gray-400" />
                <Input placeholder="Search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setSearchQuery(searchInput); setCurrentPage(1); } }} className="border-0 bg-transparent focus-visible:ring-0" />
              </div>

              <div className="flex items-center bg-white border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("list")} className={`px-3 py-2 hover:bg-gray-50 ${viewMode === "list" ? "bg-gray-100" : ""}`} title="List view"><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("table")} className={`px-3 py-2 hover:bg-gray-50 ${viewMode === "table" ? "bg-violet-600 text-white" : ""}`} title="Table view"><Grid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("weekly")} className={`px-3 py-2 hover:bg-gray-50 ${viewMode === "weekly" ? "bg-gray-100" : ""}`} title="Weekly calendar"><Calendar className="w-4 h-4" /></button>
              </div>

              <button onClick={() => setViewMode("calendar")} className={`w-10 h-10 rounded bg-white border flex items-center justify-center ${viewMode === "calendar" ? "ring-2 ring-indigo-300" : ""}`} title="Open calendar view"><Calendar className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>

          {/* Table container */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="p-0">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b bg-blue-50">
                    <th className="py-3 px-4 w-28 border-r">Code</th>
                    <th className="py-3 px-4 border-r">Task</th>
                    <th className="py-3 px-4 w-48 border-r">Employee</th>
                    <th className="py-3 px-4 w-40 border-r">Start Time</th>
                    <th className="py-3 px-4 w-40 border-r">End Time</th>
                    <th className="py-3 px-4 w-28 border-r">Total Hours</th>
                    <th className="py-3 px-4 w-16">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">Loading...</td>
                    </tr>
                  )}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">{error ? `Error: ${error}` : "No timesheets found"}</td>
                    </tr>
                  )}

                  {!loading && filtered.map((t) => (
                    <TimesheetRow key={t.id} t={t} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
              <div>Result per page - {filtered.length}</div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded hover:bg-gray-100" onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1}><ChevronLeft /></button>
                <div>Page {currentPage} of {totalPages}</div>
                <button className="p-2 rounded hover:bg-gray-100" onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}><ChevronRight /></button>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 mt-4">* Data loaded from your API endpoint.</div>
        </div>
      </main>

      {/* filters drawer (same as before) */}
      <div aria-hidden={!showFilters} onClick={() => setShowFilters(false)} className={`fixed inset-0 transition-opacity duration-300 z-[9990] ${showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
      <aside aria-hidden={!showFilters} className={`fixed right-0 top-0 h-full w-[360px] bg-white shadow-xl transform transition-transform duration-300 z-[9999] ${showFilters ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2"><Search className="w-5 h-5" /><h3 className="font-semibold">Filters</h3></div>
          <button onClick={() => setShowFilters(false)} className="p-2 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4 overflow-auto h-[calc(100%-140px)]">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Employee</label>
            <Select value={filterEmployee} onValueChange={(v) => setFilterEmployee(v)}>
              <SelectTrigger className="w-full rounded border px-3 py-2"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {employeeOptions.slice(1).map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Department</label>
            <Select value={filterDepartment} onValueChange={(v) => setFilterDepartment(v)}>
              <SelectTrigger className="w-full rounded border px-3 py-2"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {departmentOptions.slice(1).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => { setFilterEmployee("all"); setFilterDepartment("all"); setShowFilters(false); }}>Reset</Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowFilters(false)}>Close</Button>
            <Button className="bg-blue-600 text-white" onClick={() => { setShowFilters(false); setCurrentPage(1); loadTimesheets(token ?? null); }}>Apply</Button>
          </div>
        </div>
      </aside>

      {/* ======= Log Time drawer (right-side sliding panel, max-width 80%) ======= */}
      {/* Backdrop */}
      <div
        aria-hidden={!showLogModal}
        onClick={() => setShowLogModal(false)}
        className={`fixed inset-0 z-[10000] transition-opacity duration-300 ${showLogModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      />

      {/* Drawer panel */}
      <aside
        aria-hidden={!showLogModal}
        className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-[10010] transform transition-transform duration-300 flex flex-col ${showLogModal ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        style={{ width: "100%", maxWidth: "84%" }} // max-width ~80% as requested
      >
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Log Time</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLogModal(false)} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* content */}
        <div className="p-6 overflow-auto flex-1">
          <div className="rounded-lg border p-6">
            <h4 className="text-sm font-medium mb-4">TimeLog Details</h4>

            <div className="grid grid-cols-3 gap-4">
              {/* Project - now loaded from API */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">Project *</label>
                <Select value={logProjectShortCode || "--"} onValueChange={(v) => setLogProjectShortCode(v === "--" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent>
                    {/* show loading / error as items if needed */}
                    {projectsLoading && <SelectItem value="--">Loading...</SelectItem>}
                    {projectsError && <SelectItem value="--">Error loading projects</SelectItem>}
                    {projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Task */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">Task *</label>
                <Select value={logTaskId || "--"} onValueChange={(v) => setLogTaskId(v === "--" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent>
                    {taskOptions.map((t) => <SelectItem key={t} value={t}>{t === "--" ? "--" : `Task ${t}`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">Employee *</label>
                <Select value={logEmployeeId || "--"} onValueChange={(v) => setLogEmployeeId(v === "--" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent>
                    {employeeOptions.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">Start Date *</label>
                <Input type="date" value={logStartDate} onChange={(e) => setLogStartDate(e.target.value)} />
              </div>

              {/* Start Time */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">Start Time *</label>
                <Input type="time" value={logStartTime} onChange={(e) => setLogStartTime(e.target.value)} />
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">End Date</label>
                <Input type="date" value={logEndDate} onChange={(e) => setLogEndDate(e.target.value)} />
              </div>

              {/* End Time */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">End Time</label>
                <Input type="time" value={logEndTime} onChange={(e) => setLogEndTime(e.target.value)} />
              </div>

              {/* spacer to keep grid layout like image */}
              <div className="col-span-2" />

              {/* Total Hours display */}
              <div className="flex items-center justify-end">
                <div className="text-sm text-gray-600 mr-3">Total Hours</div>
                <div className="text-blue-600 font-semibold">{computedHours ?? 0}h</div>
              </div>

              {/* Memo full width */}
              <div className="col-span-3">
                <label className="text-xs text-gray-600 mb-2 block">Memo *</label>
                <Input value={logMemo} onChange={(e) => setLogMemo(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* footer actions - fixed to bottom of drawer */}
        <div className="p-4 border-t flex items-center justify-center gap-6">
          <Button variant="outline" onClick={() => setShowLogModal(false)}>Cancel</Button>
          <Button className="bg-blue-600 text-white" onClick={createTimesheet} disabled={logSubmitting}>{logSubmitting ? "Saving..." : "Save"}</Button>
        </div>
      </aside>

      {/* Edit modal */}
      {showEditModal && editTimesheetId != null && (
        <EditModal id={editTimesheetId} onClose={() => { setShowEditModal(false); setEditTimesheetId(null); }} />
      )}
    </div>
  );
}
