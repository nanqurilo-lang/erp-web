// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
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
//   taskId?: number | string;
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

// export default function EditTimesheet({ id, onClose }: { id: number; onClose: () => void }) {
//   const [local, setLocal] = useState<Timesheet | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [projects, setProjects] = useState<string[]>(["--"]);
//   const [projectsLoading, setProjectsLoading] = useState(false);
//   const [taskOptions, setTaskOptions] = useState<string[]>(["--"]);
//   const [employeeOptions, setEmployeeOptions] = useState<string[]>(["--"]);
//   const [computedHours, setComputedHours] = useState<number>(0);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//         const res = await fetch(`${MAIN}/timesheets/${id}`, {
//           headers: token ? { Authorization: `Bearer ${token}` } : undefined,
//           cache: "no-store",
//         });
//         if (!res.ok) throw new Error("Failed to load");
//         const data = await res.json();
//         if (!mounted) return;
//         setLocal(data);
//       } catch (err) {
//         console.error("Load timesheet error", err);
//         alert("Failed to load timesheet");
//       }
//     })();

//     return () => {
//       mounted = false;
//     };
//   }, [id]);

//   // load projects (for project select)
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       setProjectsLoading(true);
//       try {
//         const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//         const res = await fetch(`${MAIN}/projects/AllProject`, {
//           headers: token ? { Authorization: `Bearer ${token}` } : undefined,
//           cache: "no-store",
//         });
//         if (!res.ok) throw new Error("Failed to load projects");
//         const data = await res.json();
//         if (!mounted) return;
//         if (Array.isArray(data)) {
//           const codes = Array.from(new Set(data.map((p: any) => (p?.shortCode ?? "").toString()).filter(Boolean)));
//           setProjects(["--", ...codes]);
//         }
//       } catch (err) {
//         console.error("projects load error", err);
//         setProjects(["--"]);
//       } finally {
//         if (mounted) setProjectsLoading(false);
//       }
//     })();
//     return () => { mounted = false; };
//   }, []);

//   // derive task/employee options from loaded local timesheet as fallback
//   useEffect(() => {
//     if (!local) return;
//     const tasks = new Set<string>();
//     const emps = new Set<string>();
//     if (local.taskId) tasks.add(String(local.taskId));
//     (local.employees ?? []).forEach((e) => e?.employeeId && emps.add(e.employeeId));
//     setTaskOptions(["--", ...Array.from(tasks)]);
//     setEmployeeOptions(["--", ...Array.from(emps)]);
//   }, [local]);

//   // compute hours whenever start/end change
//   useEffect(() => {
//     if (!local) {
//       setComputedHours(0);
//       return;
//     }
//     try {
//       if (!local.startDate || !local.startTime) {
//         setComputedHours(0);
//         return;
//       }
//       const start = new Date(`${local.startDate}T${local.startTime}`);
//       const end = local.endDate && local.endTime ? new Date(`${local.endDate}T${local.endTime}`) : null;
//       if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
//         setComputedHours(0);
//         return;
//       }
//       const diffMs = end.getTime() - start.getTime();
//       const hours = diffMs / (1000 * 60 * 60);
//       setComputedHours(Math.round(hours * 100) / 100);
//     } catch {
//       setComputedHours(0);
//     }
//   }, [local?.startDate, local?.startTime, local?.endDate, local?.endTime, local]);

//   const handleSave = async () => {
//     if (!local) return;
//     setSaving(true);
//     try {
//       const fd = new FormData();
//       fd.append("projectShortCode", local.projectShortCode ?? "");
//       fd.append("employeeId", local.employeeId ?? "");
//       fd.append("taskId", String(local.taskId ?? ""));
//       fd.append("startDate", local.startDate ?? "");
//       fd.append("startTime", local.startTime ?? "");
//       fd.append("endDate", local.endDate ?? "");
//       fd.append("endTime", local.endTime ?? "");
//       fd.append("memo", local.memo ?? "");
//       fd.append("durationHours", String(computedHours ?? 0));

//       const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//       const res = await fetch(`${MAIN}/timesheets/${id}`, {
//         method: "PUT",
//         body: fd,
//         headers: token ? { Authorization: `Bearer ${token}` } : undefined,
//       });
//       if (!res.ok) {
//         const txt = await res.text().catch(() => "");
//         console.error("update failed", res.status, txt);
//         throw new Error("Update failed");
//       }
//       // success
//       onClose();
//     } catch (err) {
//       console.error("handleSave error", err);
//       alert("Failed to update");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (!local) {
//     return (
//       <div className="fixed inset-0 z-[12000] flex items-center justify-center px-4">
//         <div className="fixed inset-0 bg-black/40" onClick={onClose} />
//         <div className="relative w-full max-w-4xl bg-white rounded-lg p-6 z-10">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 z-[12000] flex items-start justify-center pt-12 px-4 overflow-y-auto">
//       <div className="fixed inset-0 bg-black/40" onClick={onClose} />
//       <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-y-auto z-10">
//         <div className="flex items-center justify-between p-4 border-b">
//           <h3 className="text-lg font-semibold">Log Time</h3>
//           <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
//         </div>

//         <div className="p-6">
//           <div className="rounded-lg border p-6">
//             <h4 className="text-sm font-medium mb-4">TimeLog Details</h4>

//             <div className="grid grid-cols-3 gap-4">
//               <div>
//                 <label className="text-xs text-gray-600 mb-2 block">Project *</label>
//                 <Select value={local.projectShortCode || "--"} onValueChange={(v) => setLocal({ ...local, projectShortCode: v === "--" ? "" : v })}>
//                   <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
//                   <SelectContent>
//                     {projectsLoading && <SelectItem value="--">Loading...</SelectItem>}
//                     {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600 mb-2 block">Task *</label>
//                 <Select value={String(local.taskId ?? "--")} onValueChange={(v) => setLocal({ ...local, taskId: v === "--" ? "" : v })}>
//                   <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
//                   <SelectContent>
//                     {taskOptions.map((t) => <SelectItem key={t} value={t}>{t === "--" ? "--" : `Task ${t}`}</SelectItem>)}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600 mb-2 block">Employee *</label>
//                 <Select value={local.employeeId || "--"} onValueChange={(v) => setLocal({ ...local, employeeId: v === "--" ? "" : v })}>
//                   <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
//                   <SelectContent>
//                     {employeeOptions.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600 mb-2 block">Start Date *</label>
//                 <Input type="date" value={local.startDate ?? ""} onChange={(e) => setLocal({ ...local, startDate: e.target.value })} />
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600 mb-2 block">Start Time *</label>
//                 <Input type="time" value={local.startTime ?? ""} onChange={(e) => setLocal({ ...local, startTime: e.target.value })} />
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600 mb-2 block">End Date</label>
//                 <Input type="date" value={local.endDate ?? ""} onChange={(e) => setLocal({ ...local, endDate: e.target.value })} />
//               </div>

//               <div>
//                 <label className="text-xs text-gray-600 mb-2 block">End Time</label>
//                 <Input type="time" value={local.endTime ?? ""} onChange={(e) => setLocal({ ...local, endTime: e.target.value })} />
//               </div>

//               <div className="col-span-2" />

//               <div className="flex items-center justify-end">
//                 <div className="text-sm text-gray-600 mr-3">Total Hours</div>
//                 <div className="text-blue-600 font-semibold">{computedHours ?? 0}h</div>
//               </div>

//               <div className="col-span-3">
//                 <label className="text-xs text-gray-600 mb-2 block">Memo *</label>
//                 <Input value={local.memo ?? ""} onChange={(e) => setLocal({ ...local, memo: e.target.value })} />
//               </div>
//             </div>
//           </div>

//           <div className="mt-8 flex items-center justify-center gap-6">
//             <Button variant="outline" onClick={onClose}>Cancel</Button>
//             <Button className="bg-blue-600 text-white" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
