"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

type EmployeeMeta = {
  employeeId?: string;
  name?: string;
  designation?: string | null;
  department?: string | null;
  profileUrl?: string | null;
};

type Lead = {
  id: number;
  name?: string;
  email?: string;
  clientCategory?: string;
  leadSource?: string;
  leadOwner?: string;
  addedBy?: string;
  leadOwnerMeta?: EmployeeMeta;
  addedByMeta?: EmployeeMeta;
  createDeal?: boolean;
  autoConvertToClient?: boolean;
  companyName?: string;
  mobileNumber?: string;
  city?: string;
  country?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: unknown[];
  deals?: unknown[];
  officePhone?: string;
  officialWebsite?: string;
  postalCode?: string;
  companyAddress?: string;
};

type Followup = {
  id: number;
  nextDate?: string;
  startTime?: string;
  remarks?: string;
  sendReminder?: boolean;
  reminderSent?: boolean;
  createdAt?: string;
};

type Deal = {
  id: number;
  title?: string;
  value?: number;
  dealStage?: string;
  dealAgent?: string;
  dealWatchers?: string[];
  leadId?: number;
  leadName?: string;
  leadMobile?: string;
  pipeline?: string;
  dealCategory?: string;
  closeDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  followups?: Followup[];
  tags?: string[];
  comments?: unknown[];
  assignedEmployeesMeta?: EmployeeMeta[];
  dealAgentMeta?: EmployeeMeta;
  dealWatchersMeta?: EmployeeMeta[];
};

type DealCategory = { id: number; categoryName: string };

const BASE = "https://chat.swiftandgo.in"; // change if needed
const CREATE_URL = `${BASE}/deals`; // adjust if your create endpoint differs
const EMP_API = `${BASE}/employee/all?page=0&size=20`;
const CAT_API = `${BASE}/deals/dealCategory`;

const fetcher = async (url: string) => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) throw new Error("No access token found. Please log in.");

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let message = "Failed to load data.";
    try {
      const json = await res.json();
      message = json?.message || json?.error || message;
    } catch {
      message = (await res.text()) || message;
    }
    throw new Error(message);
  }
  return res.json();
};

function fmt(v?: string | null) {
  return v && v !== "null" ? v : "--";
}
function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleString() : "--";
}
function fmtShortDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString() : "--";
}
function fmtCurrency(n?: number | null) {
  if (n == null || isNaN(Number(n))) return "--";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ---------------- EditModal (unchanged) ---------------- */
// ... (keep the same EditModal component as before) ...
// For brevity in this message, assume EditModal component is unchanged from your existing file.
// (In your project paste the same EditModal code as before)

/* ---------------- Deal View Modal (UPDATED: clickable email/call + file upload) ---------------- */
function DealViewModal({ deal, lead, onClose }: { deal: Deal; lead?: Lead | null; onClose: () => void }) {
  const [files, setFiles] = useState<{ name: string; url?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    // Optionally load existing files for the deal if backend supports /deals/{id}/files GET
    const loadFiles = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${BASE}/deals/${deal.id}/files`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = await res.json();
        // expect json to be array of { name, url } or adapt based on your API
        if (Array.isArray(json)) setFiles(json);
      } catch (err) {
        // ignore silently
      }
    };
    loadFiles();
  }, [deal.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError("Select a file first.");
      return;
    }
    setFileError(null);
    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const fd = new FormData();
      fd.append("file", selectedFile);

      // endpoint: POST /deals/{dealId}/files  (adjust if your backend uses different path)
      const res = await fetch(`${BASE}/deals/${deal.id}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      // JSON may contain uploaded file info (name/url)
      const uploaded = (json && (json.name || json.url)) ? { name: json.name || selectedFile.name, url: json.url } : { name: selectedFile.name };
      setFiles((s) => [uploaded, ...s]);
      setSelectedFile(null);
      (document.getElementById("deal-file-input") as HTMLInputElement | null)?.value && ((document.getElementById("deal-file-input") as HTMLInputElement).value = "");
    } catch (err: any) {
      setFileError(err?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const leadEmail = lead?.email ?? "";
  const leadPhone = lead?.mobileNumber ?? deal.leadMobile ?? "";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-8">
        <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg border overflow-auto" style={{ maxHeight: "92vh" }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Deal {deal.id ?? ""}</h3>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Deal Information */}
            <div className="lg:col-span-2 rounded-lg border p-4">
              <h4 className="font-medium mb-2">Deal Information</h4>
              <div className="text-sm text-muted-foreground mb-4">
                {deal.pipeline ?? "Default Pipeline"} → {deal.dealStage ?? "--"}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Deal Name</div>
                  <div className="font-medium">{deal.title ?? `Deal ${deal.id}`}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Lead Contact</div>
                  <div>{deal.leadName ?? "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div>{leadEmail ? <a className="text-sky-600 underline" href={`mailto:${leadEmail}`}>{leadEmail}</a> : "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Company Name</div>
                  <div>{deal.assignedEmployeesMeta && deal.assignedEmployeesMeta.length ? deal.assignedEmployeesMeta[0].department ?? "--" : "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Category</div>
                  <div>{deal.dealCategory ?? "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Agent</div>
                  <div>{deal.dealAgentMeta?.name ?? deal.dealAgent ?? "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Watcher</div>
                  <div>{deal.dealWatchersMeta && deal.dealWatchersMeta.length ? deal.dealWatchersMeta[0].name : "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Close Date</div>
                  <div>{deal.closeDate ? fmtShortDate(deal.closeDate) : "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Value</div>
                  <div>{fmtCurrency(deal.value ?? 0)}</div>
                </div>
              </div>
            </div>

            {/* Right: Lead Contact Details (email/call clickable) */}
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3">Lead Contact Details</h4>
              <div className="text-sm grid gap-2">
                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div>{deal.leadName ?? "--"}</div>
                </div>

                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div>
                    {leadEmail ? (
                      <a className="text-sky-600 underline" href={`mailto:${leadEmail}`} target="_blank" rel="noreferrer">
                        {leadEmail}
                      </a>
                    ) : (
                      "--"
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Mobile</div>
                  <div>
                    {leadPhone ? (
                      <a className="text-sky-600 underline" href={`tel:${leadPhone}`}>
                        {leadPhone}
                      </a>
                    ) : (
                      "--"
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Company Name</div>
                  <div>{deal.assignedEmployeesMeta && deal.assignedEmployeesMeta.length ? deal.assignedEmployeesMeta[0].department ?? "--" : "--"}</div>
                </div>

                <div className="mt-3 flex gap-2">
                  {/* clickable email / call buttons */}
                  <a href={leadEmail ? `mailto:${leadEmail}` : "#"} className="px-3 py-2 border rounded text-sm inline-flex items-center gap-2" target="_blank" rel="noreferrer">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a3 3 0 003.22 0L21 8" />
                    </svg>
                    Email
                  </a>
                  <a href={leadPhone ? `tel:${leadPhone}` : "#"} className="px-3 py-2 border rounded text-sm inline-flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M22 16.92V21a1 1 0 01-1.11 1A19.86 19.86 0 013 5.11 1 1 0 014 4h4.09a1 1 0 01.95.68 12.05 12.05 0 00.7 2.28 1 1 0 01-.24 1.02L8.91 10.9" />
                    </svg>
                    Call
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom tabs: Files + Follow Up etc. - Files area includes upload */}
            <div className="lg:col-span-3 mt-4 rounded-lg border p-4">
              <div className="flex gap-6 border-b pb-3 text-sm">
                <button className="pb-2 border-b-2 border-sky-600 text-sky-600 font-medium">Files</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Follow Up</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">People</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Notes</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Comments</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Tags</button>
              </div>

              <div className="mt-4 text-sm">
                <div className="mb-4">
                  <label className="block text-xs text-muted-foreground mb-2">Upload File</label>
                  <div className="flex items-center gap-3">
                    <input id="deal-file-input" type="file" onChange={handleFileChange} className="text-sm" />
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className={`px-3 py-2 rounded bg-blue-600 text-white ${uploading ? "opacity-60" : "hover:bg-blue-700"}`}
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                    {fileError && <div className="text-destructive text-xs">{fileError}</div>}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2">Files</h5>
                  {files.length === 0 ? (
                    <div className="text-muted-foreground">No files uploaded.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {files.map((f, i) => (
                        <li key={i}>
                          {f.url ? <a href={f.url} className="text-sky-600 underline" target="_blank" rel="noreferrer">{f.name}</a> : f.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4">Follow ups / files listing area — replicate your existing UI here as needed.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Deal Category Modal (unchanged) ---------------- */
// ... keep DealCategoryModal as provided earlier ...

/* ---------------- AddDealModal (unchanged majorly) ---------------- */
// ... keep AddDealModal as provided earlier ...

/* ---------------- Main Page Component (UPDATED to pass lead to view modal) ---------------- */

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<Lead>(`/api/leads/admin/get/${params.id}`, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const [activeTab, setActiveTab] = useState<"profile" | "deals" | "notes">("profile");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [editOpen, setEditOpen] = useState(false);

  const { data: dealsData, error: dealsError, isLoading: dealsLoading, mutate: mutateDeals } = useSWR<Deal[]>(
    activeTab === "deals" ? `${BASE}/deals/lead/${params.id}` : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: empResp } = useSWR(EMP_API, fetcher, { refreshInterval: 0 });
  const employees: EmployeeMeta[] = (empResp && Array.isArray(empResp.content) ? empResp.content.map((e: any) => ({
    employeeId: e.employeeId,
    name: e.name,
    designation: e.designationName ?? null,
    department: e.departmentName ?? null,
    profileUrl: e.profilePictureUrl ?? null,
  })) : []);

  const [addDealOpen, setAddDealOpen] = useState(false);

  // NEW: pass lead to view modal
  const [viewDeal, setViewDeal] = useState<Deal | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      const t = e.target as Node;
      if (menuOpen && !menuRef.current.contains(t)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const goEdit = () => {
    setMenuOpen(false);
    router.push(`/leads/admin/edit/${params.id}`);
  };

  const convertToClient = async () => {
    setMenuOpen(false);
    if (!confirm("Convert this lead to client?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(`${BASE}/leads/${params.id}/convert`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Converted to client.");
      await mutate();
      router.push("/leads");
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err));
    }
  };

  const remove = async () => {
    setMenuOpen(false);
    if (!confirm("Delete this lead?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(`${BASE}/leads/${params.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Deleted.");
      router.push("/leads");
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err));
    }
  };

  const handleCreatedDeal = async (created: Deal) => {
    if (mutateDeals) {
      mutateDeals((curr: Deal[] | undefined) => (curr ? [created, ...curr] : [created]), false);
    }
  };

  const agents = employees;
  const watchers = employees;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">{data?.name ?? "—"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Detailed information about the selected lead.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b bg-white rounded-t">
          <nav className="flex items-center gap-6 px-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-3 text-sm ${activeTab === "profile" ? "border-b-2 border-sky-600 text-sky-600" : "text-muted-foreground"}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("deals")}
              className={`py-3 text-sm ${activeTab === "deals" ? "border-b-2 border-sky-600 text-sky-600" : "text-muted-foreground"}`}
            >
              Deals
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-3 text-sm ${activeTab === "notes" ? "border-b-2 border-sky-600 text-sky-600" : "text-muted-foreground"}`}
            >
              Notes
            </button>
          </nav>
        </div>

        {/* Card with Profile Information or Deals */}
        <Card className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading lead details…</div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-destructive">Failed to load lead details.</p>
              <p className="text-sm text-muted-foreground mt-2">{(error as Error)?.message}</p>
              <div className="mt-4">
                <Button variant="ghost" onClick={() => router.back()}>
                  Back to Leads
                </Button>
              </div>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-muted-foreground">No lead found.</div>
          ) : (
            <div>
              {/* header row with title + actions menu */}
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-lg font-semibold">{activeTab === "profile" ? "Profile Information" : activeTab === "deals" ? "Deals" : "Notes"}</h3>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((s) => !s)}
                    className="p-2 rounded hover:bg-slate-100"
                    aria-label="More actions"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg z-30">
                      <ul className="py-1">
                        <li>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setEditOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm"
                          >
                            Edit
                          </button>
                        </li>

                        <li>
                          <button
                            onClick={convertToClient}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm"
                          >
                            Change to Client
                          </button>
                        </li>

                        <li>
                          <button
                            onClick={remove}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-destructive"
                          >
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

             {activeTab === "profile" && (
  <>
    {/* information grid */}
    <div className="rounded-lg border p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <dl className="hidden md:block md:col-span-1 space-y-4 text-sm text-muted-foreground">
          <dt>Name</dt>
          <dt>Email</dt>
          <dt>Lead Owner</dt>
          <dt>Source</dt>
          <dt>Company Name</dt>
          <dt>Website</dt>
          <dt>Mobile</dt>
          <dt>Office Phone Number</dt>
          <dt>City</dt>
          <dt>State</dt>
          <dt>Country</dt>
          <dt>Postal Code</dt>
          <dt>Address</dt>
        </dl>

        <div className="md:col-span-2">
          <div className="grid gap-y-3">
            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Name</div>
              <div className="text-sm">{fmt(data?.name)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Email</div>
              <div className="text-sm">{fmt(data?.email)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Lead Owner</div>
              <div className="text-sm">{data?.leadOwnerMeta?.name ?? data?.leadOwner ?? "--"}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Source</div>
              <div className="text-sm">{fmt(data?.leadSource)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Company Name</div>
              <div className="text-sm">{fmt(data?.companyName)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Website</div>
              <div className="text-sm">{fmt((data as any)?.officialWebsite)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Mobile</div>
              <div className="text-sm">{fmt(data?.mobileNumber)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Office Phone Number</div>
              <div className="text-sm">{fmt(data?.officePhone)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">City</div>
              <div className="text-sm">{fmt(data?.city)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">State</div>
              <div className="text-sm">{fmt(data?.state)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Country</div>
              <div className="text-sm">{fmt(data?.country)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Postal Code</div>
              <div className="text-sm">{fmt(data?.postalCode)}</div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-48 md:hidden text-sm text-muted-foreground">Address</div>
              <div className="text-sm">{fmt(data?.companyAddress)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* footer small details */}
    <div className="mt-6 text-sm text-muted-foreground grid md:grid-cols-2 gap-2">
      <div>Created: {fmtDate(data?.createdAt)}</div>
      <div className="text-right">
        Status: <Badge variant="secondary">{data?.status ?? "--"}</Badge>
      </div>
    </div>
  </>
)}


              {activeTab === "deals" && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Open inline modal instead of redirect */}
                      <Button onClick={() => setAddDealOpen(true)}>+ Add Deal</Button>
                      <div>
                        <label className="text-sm text-muted-foreground mr-2">Pipeline</label>
                        <select className="border rounded p-2 text-sm">
                          <option>{data?.deals && (data as any).deals?.length ? data?.deals : data?.pipeline ?? "Default Pipeline"}</option>
                          <option>Sales</option>
                          <option>Default Pipeline</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">Result per page - 8</div>
                  </div>

                  <div className="rounded-lg border overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-sky-50 text-left">
                        <tr>
                          <th className="px-4 py-2">Deal Name</th>
                          <th className="px-4 py-2">Lead Name</th>
                          <th className="px-4 py-2">Contact Details</th>
                          <th className="px-4 py-2">Value</th>
                          <th className="px-4 py-2">Close Date</th>
                          <th className="px-4 py-2">Follow Up</th>
                          <th className="px-4 py-2">Deal Agent</th>
                          <th className="px-4 py-2">Deal Watcher</th>
                          <th className="px-4 py-2">Stage</th>
                          <th className="px-4 py-2">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {dealsLoading ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">Loading deals…</td>
                          </tr>
                        ) : dealsError ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-6 text-center text-destructive">Failed to load deals: {(dealsError as Error)?.message}</td>
                          </tr>
                        ) : !dealsData || dealsData.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">No deals found for this lead.</td>
                          </tr>
                        ) : (
                          dealsData.map((d) => (
                            <tr key={d.id} className="border-t">
                              <td className="px-4 py-3">
                                <div className="font-medium">{d.title ?? `Deal ${d.id}`}</div>
                                <div className="text-muted-foreground text-xs">{d.dealCategory ?? "--"}</div>
                              </td>

                              <td className="px-4 py-3">{d.leadName ?? data?.name ?? "--"}</td>

                              <td className="px-4 py-3">
                                <div className="text-xs">{fmt(d.leadMobile as any)}</div>
                                <div className="text-muted-foreground text-xs">{(data?.email as string) ?? "--"}</div>
                              </td>

                              <td className="px-4 py-3">{fmtCurrency(d.value ?? 0)}</td>

                              <td className="px-4 py-3">{d.closeDate ? fmtShortDate(d.closeDate) : d.updatedAt ? fmtShortDate(d.updatedAt) : "--"}</td>

                              <td className="px-4 py-3">
                                {d.followups && d.followups.length > 0 ? (
                                  <div className="text-sm">{fmtShortDate(d.followups[0].nextDate)}</div>
                                ) : (
                                  <div className="text-muted-foreground">------</div>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <div className="text-sm">{d.dealAgentMeta?.name ?? d.dealAgent ?? "--"}</div>
                                <div className="text-muted-foreground text-xs">{d.dealAgentMeta?.designation ?? ""}</div>
                              </td>

                              <td className="px-4 py-3">
                                {d.dealWatchersMeta && d.dealWatchersMeta.length > 0 ? (
                                  <div>
                                    <div className="text-sm">{d.dealWatchersMeta[0].name}</div>
                                    <div className="text-muted-foreground text-xs">{d.dealWatchersMeta[0].designation}</div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">--</div>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <select defaultValue={d.dealStage} className="border rounded p-1 text-sm">
                                  <option>{d.dealStage ?? "Generated"}</option>
                                  <option>Generated</option>
                                  <option>Qualified</option>
                                  <option>Proposal</option>
                                  <option>Won</option>
                                  <option>Lost</option>
                                </select>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {/* open modal with both deal + lead */}
                                  <button
                                    onClick={() => {
                                      setViewDeal(d);
                                      setViewLead(data ?? null);
                                    }}
                                    className="text-sm px-2 py-1 border rounded hover:bg-slate-50"
                                  >
                                    View
                                  </button>

                                  <button
                                    onClick={async () => {
                                      if (!confirm("Delete this deal?")) return;
                                      try {
                                        const token = localStorage.getItem("accessToken");
                                        if (!token) throw new Error("No access token.");
                                        const res = await fetch(`${BASE}/deals/${d.id}`, {
                                          method: "DELETE",
                                          headers: { Authorization: `Bearer ${token}` },
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        alert("Deal deleted.");
                                        await mutateDeals();
                                      } catch (err: any) {
                                        alert("Error: " + (err?.message ?? err));
                                      }
                                    }}
                                    className="text-sm px-2 py-1 border rounded text-destructive hover:bg-slate-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* pagination / footer */}
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div>Page 1 of 1</div>
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1" disabled>‹</button>
                      <button className="px-2 py-1" disabled>›</button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "notes" && (
                <div className="py-8 text-center text-muted-foreground">Notes coming soon.</div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      {editOpen && data && (
        <EditModal
          lead={data}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            setEditOpen(false);
            await mutate(); // refresh SWR data
          }}
        />
      )}

      {/* Add Deal Modal */}
      {addDealOpen && data && (
        <AddDealModal
          lead={data}
          onClose={() => setAddDealOpen(false)}
          onCreated={handleCreatedDeal}
          possibleAgents={agents}
          possibleWatchers={watchers}
        />
      )}

      {/* Deal View Modal (pass lead for email/call and files) */}
      {viewDeal && (
        <DealViewModal
          deal={viewDeal}
          lead={viewLead}
          onClose={() => {
            setViewDeal(null);
            setViewLead(null);
          }}
        />
      )}
    </main>
  );
}
