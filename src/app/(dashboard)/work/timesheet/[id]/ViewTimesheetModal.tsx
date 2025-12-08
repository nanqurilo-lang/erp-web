// "use client";

// import React, { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { X } from "lucide-react";

// const MAIN = process.env.NEXT_PUBLIC_MAIN || "https://6jnqmj85-80.inc1.devtunnels.ms";

// type EmployeeItem = {
//   employeeId: string;
//   name: string;
//   profileUrl?: string | null;
//   designation?: string | null;
//   department?: string | null;
// };

// type Timesheet = {
//   id: number;
//   projectId?: number;
//   projectShortCode?: string;
//   taskId?: number;
//   employeeId?: string;
//   employees?: EmployeeItem[];
//   startDate?: string;
//   startTime?: string;
//   endDate?: string;
//   endTime?: string;
//   memo?: string;
//   durationHours?: number;
//   createdBy?: string;
//   createdAt?: string;
// };

// function formatDateTime(dateISO?: string, time?: string) {
//   if (!dateISO) return "";
//   try {
//     const combined = time ? `${dateISO}T${time}` : `${dateISO}T00:00:00`;
//     const d = new Date(combined);
//     if (Number.isNaN(d.getTime())) return `${dateISO} ${time ?? ""}`;
//     const dd = String(d.getDate()).padStart(2, "0");
//     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     const yyyy = d.getFullYear();
//     let hours = d.getHours();
//     const minutes = String(d.getMinutes()).padStart(2, "0");
//     const ampm = hours >= 12 ? "PM" : "AM";
//     hours = hours % 12;
//     if (hours === 0) hours = 12;
//     return `${dd}/${mm}/${yyyy} ${hours}:${minutes} ${ampm}`;
//   } catch {
//     return `${dateISO} ${time ?? ""}`;
//   }
// }

// export default function ViewTimesheet({ id, onClose }: { id: number; onClose: () => void }) {
//   const [local, setLocal] = useState<Timesheet | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;

//     const doFetch = async () => {
//       setLoading(true);
//       try {
//         const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//         const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
//         headers["Accept"] = "application/json";

//         // first try: GET (original behaviour)
//         const getRes = await fetch(`${MAIN}/timesheets/${id}`, {
//           method: "GET",
//           headers,
//           cache: "no-store",
//         });

//         if (getRes.ok) {
//           const data = await getRes.json();
//           if (!mounted) return;
//           setLocal(data);
//           return;
//         }

//         // If GET failed, read text for diagnostics
//         const txt = await getRes.text().catch(() => "");
//         console.error("Fetch timesheet failed", getRes.status, txt);

//         // Detect the specific server message you reported and try a POST fallback.
//         // Many servers that only accept POST will return that message; this retries using POST.
//         if (getRes.status === 500 && typeof txt === "string" && txt.includes("Request method 'GET' is not supported")) {
//           try {
//             // POST fallback to the same URL. If your API expects a JSON body like { id }, change accordingly.
//             const postHeaders = { ...headers, "Content-Type": "application/json" };
//             const postRes = await fetch(`${MAIN}/timesheets/${id}`, {
//               method: "POST",
//               headers: postHeaders,
//               body: JSON.stringify({}), // empty body — adapt if your API expects { id } or form data
//               cache: "no-store",
//             });

//             if (!postRes.ok) {
//               const postTxt = await postRes.text().catch(() => "");
//               console.error("POST fallback failed", postRes.status, postTxt);
//               if (mounted) alert("Failed to load timesheet");
//               return;
//             }

//             const data = await postRes.json();
//             if (!mounted) return;
//             setLocal(data);
//             return;
//           } catch (postErr) {
//             console.error("POST fallback threw", postErr);
//             if (mounted) alert("Failed to load timesheet");
//             return;
//           }
//         }

//         // For other errors, show a generic failure
//         if (mounted) {
//           alert("Failed to load timesheet");
//         }
//       } catch (err) {
//         console.error("Load timesheet error", err);
//         if (mounted) alert("Failed to load timesheet");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     doFetch();

//     return () => {
//       mounted = false;
//     };
//   }, [id]);

//   if (loading || !local) {
//     return (
//       <div className="fixed inset-0 z-[12000] flex items-center justify-center px-4">
//         <div className="fixed inset-0 bg-black/40" onClick={onClose} />
//         <div className="relative w-full max-w-4xl bg-white rounded-lg p-6 z-10">Loading...</div>
//       </div>
//     );
//   }

//   const employee = local.employees && local.employees.length > 0 ? local.employees[0] : undefined;
//   const avatar = employee?.profileUrl ?? "/_next/static/media/avatar-placeholder.7b9f2b3a.jpg";

//   return (
//     <div className="fixed inset-0 z-[12000] flex items-start justify-center pt-12 px-4 overflow-y-auto">
//       <div className="fixed inset-0 bg-black/40" onClick={onClose} />
//       <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-y-auto z-10">
//         <div className="flex items-center justify-between p-4 border-b">
//           <h3 className="text-lg font-semibold">Timesheet</h3>
//           <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
//         </div>

//         <div className="p-6 grid grid-cols-12 gap-6">
//           <div className="col-span-8 bg-white rounded-xl border p-6">
//             <h4 className="text-base font-medium mb-4">TimeLog Details</h4>

//             <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
//               <div className="flex justify-between">
//                 <div className="text-gray-500">Start Time</div>
//                 <div className="font-medium">{formatDateTime(local.startDate, local.startTime) || "—"}</div>
//               </div>
//               <div className="flex justify-between">
//                 <div className="text-gray-500">End Time</div>
//                 <div className="font-medium">{formatDateTime(local.endDate, local.endTime) || "—"}</div>
//               </div>

//               <div className="flex justify-between">
//                 <div className="text-gray-500">Total Hours</div>
//                 <div className="font-medium">{local.durationHours ?? 0}h</div>
//               </div>

//               <div className="flex justify-between">
//                 <div className="text-gray-500">Memo</div>
//                 <div className="font-medium">{local.memo ?? "—"}</div>
//               </div>

//               <div className="flex justify-between">
//                 <div className="text-gray-500">Project</div>
//                 <div className="font-medium">{local.projectShortCode ?? "—"}</div>
//               </div>

//               <div className="flex justify-between">
//                 <div className="text-gray-500">Task</div>
//                 <div className="font-medium">{local.taskId ? `Task ${local.taskId}` : "—"}</div>
//               </div>

//               <div className="col-span-2">
//                 <div className="text-gray-500">Employee</div>
//                 <div className="mt-2 flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full overflow-hidden">
//                     <img src={avatar} alt={employee?.name ?? "employee"} className="w-full h-full object-cover" />
//                   </div>
//                   <div>
//                     <div className="text-sm font-medium">{employee?.name ?? local.employeeId ?? "—"}</div>
//                     <div className="text-xs text-gray-400">{employee?.designation ?? employee?.department ?? ""}</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="col-span-4 bg-white rounded-xl border p-4">
//             <h5 className="text-sm font-medium mb-3">History</h5>
//             <div className="text-sm text-gray-600 space-y-3">
//               <div className="flex justify-between">
//                 <div className="text-gray-500">Start Time</div>
//                 <div className="font-medium">{formatDateTime(local.startDate, local.startTime) || "—"}</div>
//               </div>
//               <div className="flex justify-between">
//                 <div className="text-gray-500">Task</div>
//                 <div className="font-medium">{local.taskId ? `Task ${local.taskId}` : "—"}</div>
//               </div>
//               <div className="flex justify-between">
//                 <div className="text-gray-500">End Time</div>
//                 <div className="font-medium">{formatDateTime(local.endDate, local.endTime) || "—"}</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="p-6 flex justify-end">
//           <Button variant="outline" onClick={onClose}>Close</Button>
//         </div>
//       </div>
//     </div>
//   );
// }
