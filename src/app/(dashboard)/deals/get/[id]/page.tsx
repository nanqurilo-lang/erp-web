"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Deal } from "@/types/deals";
import DealTags from "../../_components/DealTags";
import CommentForm from "../../_components/comment";

type TabKey = "files" | "followups" | "people" | "notes" | "comments" | "tags";

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params?.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("files");

  useEffect(() => {
    if (!dealId) {
      setError("Deal ID not found");
      setLoading(false);
      return;
    }

    const fetchDeal = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }

        const res = await fetch(`/api/deals/get/${dealId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch deal: ${res.statusText}`);
        }

        const data: Deal = await res.json();
        setDeal(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load deal details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
        Loading deal details...
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-lg font-semibold text-red-600">
        <div>{error || "Deal not found"}</div>
        <Link href="/deals/get" className="mt-4 text-blue-600 hover:underline">
          Back to Deals
        </Link>
      </div>
    );
  }

  // helper to display earliest followup date/time (if you want to expand later)
  const earliestFollowup = (followups?: any[]) => {
    if (!followups || followups.length === 0) return null;
    const valid = followups.filter((f) => f?.nextDate).slice();
    valid.sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
    return valid[0];
  };

  const nextFollow = earliestFollowup(deal.followups);

  // local uploaded image path (developer-provided). Use as decorative top banner fallback or avatar fallback.
  const uploadedScreenshot = "/mnt/data/Screenshot 2025-11-21 135924.png";

  // mailto / tel links (defensive)
  const mailTo = deal.leadEmail ? `mailto:${deal.leadEmail}` : undefined;
  const telTo = deal.leadMobile ? `tel:${deal.leadMobile}` : undefined;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Top thin success bar to match screenshot */}
      <div className="h-1 w-full bg-emerald-500 rounded-t-md mb-4" />

      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/deals/get"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-2"
          >
            ← Back to Deals
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Deal {deal.title || deal.id}</h1>
        </div>

        <button
          onClick={() => window.history.back()}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: Deal Information card */}
        <div>
          <div className="bg-white border rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  <span className="font-medium">Sales Pipeline</span> →{" "}
                  <span className="font-semibold">{deal.dealStage || "—"}</span>
                </div>
                <h2 className="text-lg font-semibold">{deal.title || "—"}</h2>
                <p className="text-xs text-muted-foreground mt-1">ID: {deal.id}</p>
              </div>

              <div className="flex items-start gap-3">
                {/* three-dot action like screenshot */}
                <button className="p-2 rounded-md hover:bg-slate-50">
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <circle cx="5" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Deal Name</span>
                  <span className="text-gray-900">{deal.title || "—"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Lead Contact</span>
                  <span className="text-gray-900">{deal.leadName || "—"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="text-gray-900">{deal.leadEmail || "—"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Company Name</span>
                  <span className="text-gray-900">{deal.leadCompany || "—"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Deal Category</span>
                  <span className="text-gray-900">{deal.dealCategory || "—"}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Deal Agent</span>
                  <span className="text-gray-900">
                    {deal.dealAgentMeta?.name || deal.dealAgent || "—"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Deal Watcher</span>
                  <span className="text-gray-900">
                    {(deal.dealWatchersMeta && deal.dealWatchersMeta.map((d) => d.name).join(", ")) ||
                      (deal.dealWatchers && deal.dealWatchers.join(", ")) ||
                      "—"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Close Date</span>
                  <span className="text-gray-900">
                    {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "—"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Deal Value</span>
                  <span className="text-gray-900">
                    {typeof deal.value === "number" ? `$${deal.value.toLocaleString(undefined)}` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs area (Files / Follow Up / People / Notes / Comments / Tags) */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="border-b -mx-4 px-4">
              <nav className="flex gap-6 text-sm">
                <button
                  onClick={() => setActiveTab("files")}
                  className={`py-3 px-1 ${activeTab === "files" ? "border-b-2 border-violet-500 text-violet-600" : "text-gray-600"}`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveTab("followups")}
                  className={`py-3 px-1 ${activeTab === "followups" ? "border-b-2 border-violet-500 text-violet-600" : "text-gray-600"}`}
                >
                  Follow Up
                </button>
                <button
                  onClick={() => setActiveTab("people")}
                  className={`py-3 px-1 ${activeTab === "people" ? "border-b-2 border-violet-500 text-violet-600" : "text-gray-600"}`}
                >
                  People
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`py-3 px-1 ${activeTab === "notes" ? "border-b-2 border-violet-500 text-violet-600" : "text-gray-600"}`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`py-3 px-1 ${activeTab === "comments" ? "border-b-2 border-violet-500 text-violet-600" : "text-gray-600"}`}
                >
                  Comments
                </button>
                <button
                  onClick={() => setActiveTab("tags")}
                  className={`py-3 px-1 ${activeTab === "tags" ? "border-b-2 border-violet-500 text-violet-600" : "text-gray-600"}`}
                >
                  Tags
                </button>
              </nav>
            </div>

            <div className="p-6 min-h-[180px]">
              {activeTab === "files" && (
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-violet-600 hover:bg-violet-50"
                    onClick={() => {
                      // keep behavior minimal — implement upload flow in your app
                      console.log("Upload file clicked for deal", dealId);
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 4v12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 8l4-4 4 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M20 20H4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Upload File
                  </button>
                  <div className="mt-6 text-sm text-gray-500">
                    {/* placeholder content - your existing file list component can be plugged here */}
                    No files uploaded yet.
                  </div>
                </div>
              )}

              {activeTab === "followups" && (
                <div className="space-y-3 text-sm text-gray-700">
                  {deal.followups && deal.followups.length > 0 ? (
                    deal.followups.map((f: any, i: number) => (
                      <div key={i} className="p-3 border rounded-md">
                        <div className="flex justify-between text-xs text-gray-500">
                          <div>{f.nextDate ? new Date(f.nextDate).toLocaleDateString() : "—"}</div>
                          <div>{f.startTime || "—"}</div>
                        </div>
                        <div className="mt-2 text-sm">{f.remarks || "—"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No follow ups</div>
                  )}
                </div>
              )}

              {activeTab === "people" && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Assigned Employees</h4>
                    <div className="mt-2 text-sm text-gray-700">
                      {(deal.assignedEmployeesMeta && deal.assignedEmployeesMeta.length > 0) ? (
                        deal.assignedEmployeesMeta.map((a: any) => (
                          <div key={a.employeeId} className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                              {a.profileUrl ? (
                                // using <img> instead of next/Image to avoid remote domain config issues in dev
                                <img src={a.profileUrl} alt={a.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N</div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{a.name}</div>
                              <div className="text-xs text-gray-500">{a.designation || a.department || ""}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No people assigned</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="text-sm text-gray-500">
                  {/* plug your notes component here if exists */}
                  No notes yet.
                </div>
              )}

              {activeTab === "comments" && (
                <div>
                  <div className="mb-4">
                    <CommentForm dealId={dealId} />
                  </div>
                  <div className="space-y-3 text-sm">
                    {(deal.comments && deal.comments.length > 0) ? (
                      deal.comments.map((c: any) => (
                        <div key={c.id} className="p-3 border rounded-md">
                          <div className="text-xs text-gray-500">{c.employeeId} • {new Date(c.createdAt).toLocaleString()}</div>
                          <div className="mt-2 text-sm">{c.commentText}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No comments yet.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "tags" && (
                <div>
                  <DealTags dealId={dealId} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Lead Contact Details card */}
        <aside className="space-y-4">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Lead Contact Details</h3>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-900">{deal.leadName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900">{deal.leadEmail || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mobile</span>
                <span className="text-gray-900">{deal.leadMobile || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Company Name</span>
                <span className="text-gray-900">{deal.leadCompany || "—"}</span>
              </div>

              <div className="mt-4 flex gap-3">
                <a
                  href={mailTo ?? "#"}
                  onClick={(e) => {
                    if (!mailTo) e.preventDefault();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-sky-600 hover:bg-sky-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 8l9 6 9-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 19H3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Email
                </a>

                <a
                  href={telTo ?? "#"}
                  onClick={(e) => {
                    if (!telTo) e.preventDefault();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-sky-600 hover:bg-sky-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12.9.36 1.77.72 2.58a2 2 0 0 1-.45 2.11L9.91 9.91a14 14 0 0 0 6 6l1.5-1.5a2 2 0 0 1 2.11-.45c.81.36 1.68.6 2.58.72A2 2 0 0 1 22 16.92z" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Call
                </a>
              </div>
            </div>
          </div>

          {/* Decorative preview or avatar using uploaded screenshot (per developer instruction) */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-100">
              {/* Use <img> to avoid domain config issues; developer path provided will be transformed */}
              <img src={uploadedScreenshot} alt="screenshot preview" className="w-full h-full object-cover" />
            </div>
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">{deal.dealAgentMeta?.name || deal.dealAgent || "Agent"}</div>
              <div className="text-xs">Preview</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
