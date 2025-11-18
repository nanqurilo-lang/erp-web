"use client";

import useSWR from "swr";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EmployeeMeta = {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  profileUrl?: string;
};

type Lead = {
  id: number;
  name: string;
  email: string;
  companyName?: string;
  mobileNumber?: string;
  city?: string;
  country?: string;
  status?: string;
  leadOwner?: string;
  addedBy?: string;
  leadOwnerMeta?: EmployeeMeta;
  addedByMeta?: EmployeeMeta;
  createdAt?: string;
  updatedAt?: string;
};

const fetcher = async (url: string) => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("No access token found. Please log in.");
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let errorMessage = "Failed to load leads.";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = (await res.text()) || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
};

function OwnerCell({ meta, fallback }: { meta?: EmployeeMeta; fallback?: string | undefined }) {
  const src = meta?.profileUrl || "/placeholder.svg?height=32&width=32&query=profile-avatar";
  return (
    <div className="flex items-center gap-3">
      <img
        src={src}
        alt={meta?.name ? `Profile photo of ${meta.name}` : "Profile avatar"}
        className="h-8 w-8 rounded-full object-cover border"
        crossOrigin="anonymous"
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{meta?.name || fallback || "—"}</span>
        <span className="text-xs text-muted-foreground">{meta?.designation || "—"}</span>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<Lead[]>("/api/leads/admin/get", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // UI state
  const [query, setQuery] = useState("");
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Filters state (drawer)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateFilterOn, setDateFilterOn] = useState<"created" | "updated">("created");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedLeadOwner, setSelectedLeadOwner] = useState<string>("All");
  const [selectedAddedBy, setSelectedAddedBy] = useState<string>("All");

  const leads = data || [];

  // Build dropdown options from fetched leads
  const leadOwners = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.leadOwner) s.add(l.leadOwner);
      if (l.leadOwnerMeta?.name) s.add(l.leadOwnerMeta.name);
    });
    return ["All", ...Array.from(s).sort()];
  }, [leads]);

  const addedByOptions = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.addedBy) s.add(l.addedBy);
      if (l.addedByMeta?.name) s.add(l.addedByMeta.name);
    });
    return ["All", ...Array.from(s).sort()];
  }, [leads]);

  // utility to parse dates safely
  const parseDate = (s?: string) => {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  // Combined filtering: search + filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (leads || []).filter((l) => {
      // search
      if (q) {
        const fields = [
          l.name,
          l.email,
          l.companyName,
          l.city,
          l.country,
          l.status,
          l.leadOwner,
          l.addedBy,
          l.mobileNumber,
        ];
        const matchSearch = fields.some((f) => !!f && f.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      // lead owner filter
      if (selectedLeadOwner !== "All") {
        const ownerName = l.leadOwnerMeta?.name || l.leadOwner || "";
        if (ownerName !== selectedLeadOwner) return false;
      }

      // added by filter
      if (selectedAddedBy !== "All") {
        const addedByName = l.addedByMeta?.name || l.addedBy || "";
        if (addedByName !== selectedAddedBy) return false;
      }

      // date filter
      if (startDate || endDate) {
        const target = dateFilterOn === "created" ? l.createdAt : l.updatedAt;
        const parsed = parseDate(target);
        if (!parsed) return false;

        if (startDate) {
          const sDate = parseDate(startDate);
          if (!sDate) return false;
          // include day: set time to 0:00:00 UTC for compare
          if (parsed < sDate) return false;
        }
        if (endDate) {
          const eDate = parseDate(endDate);
          if (!eDate) return false;
          // include entire endDate day: push to end of day
          eDate.setHours(23, 59, 59, 999);
          if (parsed > eDate) return false;
        }
      }

      return true;
    });
  }, [leads, query, selectedLeadOwner, selectedAddedBy, startDate, endDate, dateFilterOn]);

  // Action handlers
  const handleView = useCallback(
    (id: number) => {
      setOpenMenuFor(null);
      router.push(`/leads/admin/get/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: number) => {
      setOpenMenuFor(null);
      router.push(`/leads/admin/edit/${id}`);
    },
    [router]
  );

  const handleChangeToClient = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to convert this lead to a client?")) return;
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`/api/leads/admin/${id}/convert`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to convert lead");
        }
        alert("Lead converted to client.");
        setOpenMenuFor(null);
        await mutate();
      } catch (err: any) {
        alert("Error: " + (err?.message || err));
      }
    },
    [mutate]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`/api/leads/admin/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to delete lead");
        }
        await mutate((current) => (current ? current.filter((l) => l.id !== id) : current), { revalidate: true });
        setOpenMenuFor(null);
        alert("Lead deleted.");
      } catch (err: any) {
        alert("Error: " + (err?.message || err));
      }
    },
    [mutate]
  );

  // outside click & ESC for menu
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenuFor(null);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenuFor(null);
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // drawer refs for outside click
  const drawerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(t)) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [drawerOpen]);

  const applyFilters = () => {
    setDrawerOpen(false);
    // filter is already reactive; closing drawer is enough
  };

  const clearFilters = () => {
    setDateFilterOn("created");
    setStartDate("");
    setEndDate("");
    setSelectedLeadOwner("All");
    setSelectedAddedBy("All");
    // don't need to call mutate; filters are client-side
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      {/* header */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Duration</div>
            <div className="text-sm text-muted-foreground underline">Start Date to End Date</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-slate-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M6 12h12M10 18h4" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      <Card className="p-4 md:p-6">
        {/* controls: add left, search top-right */}
        <div className="flex items-start md:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <Link href="/leads/admin/create" className="inline-block">
              <button className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-sky-700">
                + Add Lead
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search leads"
                className="border-0 p-0 focus:ring-0"
              />
            </div>
            <Button variant="secondary" onClick={() => mutate()}>
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading leads…</div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-destructive">Failed to load leads.</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            <Button className="mt-4" onClick={() => mutate()}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">No leads found.</div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.No.</TableHead>
                    <TableHead className="min-w-[220px]">Lead Name</TableHead>
                    <TableHead>Contact Details</TableHead>
                    <TableHead>Lead Owner</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((lead, idx) => (
                    <TableRow key={lead.id}>
                      <TableCell>{idx + 1}</TableCell>

                      <TableCell>
                        <Link href={`/leads/admin/get/${lead.id}`} className="block">
                          <div className="flex flex-col">
                            <span className="font-medium">{lead.name}</span>
                            <span className="text-xs text-muted-foreground">{lead.companyName || "—"}</span>
                          </div>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{lead.email || "—"}</span>
                          <span className="text-xs text-muted-foreground">{lead.mobileNumber || "—"}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <OwnerCell meta={lead.leadOwnerMeta} fallback={lead.leadOwner} />
                      </TableCell>

                      <TableCell>
                        <OwnerCell meta={lead.addedByMeta} fallback={lead.addedBy} />
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">
                          {lead.createdAt
                            ? new Date(lead.createdAt).toLocaleDateString(undefined, {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell className="relative text-right">
                        <div ref={menuRef} className="inline-block">
                          <button
                            onClick={() => setOpenMenuFor((prev) => (prev === lead.id ? null : lead.id))}
                            aria-label="Open actions"
                            className="inline-flex items-center rounded-full p-2 hover:bg-slate-100"
                          >
                            <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="19" cy="12" r="1.5" />
                            </svg>
                          </button>

                          {/* menu with icons - matches screenshot style */}
                          {openMenuFor === lead.id && (
                            <div className="absolute right-0 z-30 mt-2 w-56 rounded-md bg-white shadow-lg border">
                              <ul className="py-1">
                                <li>
                                  <button
                                    onClick={() => handleView(lead.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                                  >
                                    <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                                      <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                                    </svg>
                                    View
                                  </button>
                                </li>

                                <li>
                                  <button
                                    onClick={() => handleEdit(lead.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                                  >
                                    <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6L20 10M3 21h6l11-11a2 2 0 00-2-2L7 19v2z" />
                                    </svg>
                                    Edit
                                  </button>
                                </li>

                                <li>
                                  <button
                                    onClick={() => handleChangeToClient(lead.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                                  >
                                    <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 11c2.21 0 4-1.79 4-4S14.21 3 12 3 8 4.79 8 7s1.79 4 4 4z" />
                                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
                                    </svg>
                                    Change to Client
                                  </button>
                                </li>

                                <li>
                                  <button
                                    onClick={() => handleDelete(lead.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-slate-50"
                                  >
                                    <svg className="w-5 h-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2" />
                                    </svg>
                                    Delete
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
              <div>Result per page - 8</div>
              <div>Page 1 of 1</div>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded hover:bg-slate-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-2 rounded hover:bg-slate-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Right-side Filters Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/20" />

          <aside
            ref={drawerRef}
            className="absolute right-0 top-0 h-full w-80 bg-white border-l shadow-lg p-6 overflow-auto"
            role="dialog"
            aria-label="Filters"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-1 rounded hover:bg-slate-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Date Filter On</label>
                <select
                  value={dateFilterOn}
                  onChange={(e) => setDateFilterOn(e.target.value as "created" | "updated")}
                  className="block w-full rounded-md border px-3 py-2"
                >
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Lead Owner</label>
                <select
                  value={selectedLeadOwner}
                  onChange={(e) => setSelectedLeadOwner(e.target.value)}
                  className="block w-full rounded-md border px-3 py-2"
                >
                  {leadOwners.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Added by</label>
                <select
                  value={selectedAddedBy}
                  onChange={(e) => setSelectedAddedBy(e.target.value)}
                  className="block w-full rounded-md border px-3 py-2"
                >
                  {addedByOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button onClick={clearFilters} className="rounded-md px-4 py-2 border">
                  Clear
                </button>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={applyFilters}>Apply</Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
