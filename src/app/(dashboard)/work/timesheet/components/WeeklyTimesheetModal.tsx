// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   X,
//   Search,
//   List,
//   CalendarDays,
//   Calendar,
//   Bell,
//   User,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";

// /**
//  * WeeklyTimesheetModal
//  * - Always reads the token from localStorage at request time to avoid race conditions.
//  * - Falls back to authToken prop if localStorage has no value.
//  * - Sends Authorization: Bearer <token> when present.
//  */

// /* ---------------------- CONFIG ---------------------- */
// const DEFAULT_API_BASE = "https://6jnqmj85-80.inc1.devtunnels.ms";
// const ENDPOINT = "/timesheets/weekly";
// const API_TIMEOUT_MS = 15000;
// // Change this if your app stores the token under a different key
// const LOCAL_TOKEN_KEY = "authToken";

// const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thurs", "Fri", "Sat", "Sun"];
// const MONTH_NAMES: string[] = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// /* ---------------------- Types ---------------------- */
// type WeeklyTimesheetModalProps = {
//   open: boolean;
//   onClose: () => void;
//   apiBaseUrl?: string;
//   authToken?: string | null; // fallback if localStorage missing
// };

// type WeekDay = {
//   date: string;
//   month: string;
//   label: string;
//   iso: string;
// };

// type Row = {
//   id: string;
//   taskId: string;
//   taskLabel: string;
//   hours: number[];
// };

// type CreatedLog = {
//   id: number;
//   projectId: number | null;
//   projectShortCode?: string;
//   projectName?: string | null;
//   taskId?: number | null;
//   taskName?: string | null;
//   employeeId?: string;
//   startDate: string; // YYYY-MM-DD
//   durationHours: number;
// };

// /* ---------------------- Component ---------------------- */
// const WeeklyTimesheetModal: React.FC<WeeklyTimesheetModalProps> = ({
//   open,
//   onClose,
//   apiBaseUrl = DEFAULT_API_BASE,
//   authToken = null,
// }) => {
//   const [rows, setRows] = useState<Row[]>([
//     { id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) },
//   ]);
//   const [weekDays, setWeekDays] = useState<WeekDay[]>(() => {
//     const now = new Date();
//     const monday = getMonday(now);
//     return buildWeekDaysFromMonday(monday);
//   });
//   const [weekLabel, setWeekLabel] = useState("25 Aug - 31 Aug");
//   const [loadingFetch, setLoadingFetch] = useState(false);
//   const [loadingSave, setLoadingSave] = useState(false);
//   const [errorFetch, setErrorFetch] = useState<string | null>(null);
//   const [saveResults, setSaveResults] = useState<string | null>(null);

//   if (!open) return null;

//   // fetch on modal open
//   useEffect(() => {
//     fetchWeekly();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* ---------------------- Helpers ---------------------- */

//   // read token directly from localStorage each time (avoid state race)
//   function getEffectiveToken() {
//     try {
//       if (typeof window !== "undefined") {
//         const t = localStorage.getItem(LOCAL_TOKEN_KEY);
//         if (t && t.trim() !== "") return t.trim();
//       }
//     } catch {
//       // ignore localStorage errors and use fallback
//     }
//     return authToken ?? null;
//   }

//   /* ---------------------- Fetch existing week (GET) ---------------------- */
//   async function fetchWeekly() {
//     setLoadingFetch(true);
//     setErrorFetch(null);

//     const url = `${apiBaseUrl}${ENDPOINT}`;
//     const headers: Record<string, string> = { "Content-Type": "application/json" };
//     const effectiveToken = getEffectiveToken();
//     if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

//     const controller = new AbortController();
//     const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

//     try {
      
//     const token = localStorage.getItem("accessToken");
//       const res = await fetch(url, {
//         method: "POST",
//          headers: {
//             "Content-Type": "application/json",
//             Authorization: token ? `Bearer ${token}` : "",
//           },
//       });
//       clearTimeout(timer);

//       if (!res.ok) {
//         if (res.status === 401) {
//           const bodyText = await safeText(res);
//           throw new Error(
//             `Fetch failed (401): ${bodyText || "Unauthorized. Token missing/invalid."}`
//           );
//         }
//         const txt = await safeText(res);
//         throw new Error(`Fetch failed (${res.status}): ${txt || res.statusText}`);
//       }

//       const json = await res.json();
//       const createdLogs: CreatedLog[] = (json.createdLogs || []).map((l: any) => ({
//         id: l.id,
//         projectId: l.projectId,
//         projectShortCode: l.projectShortCode,
//         projectName: l.projectName,
//         taskId: l.taskId,
//         taskName: l.taskName,
//         employeeId: l.employeeId,
//         startDate: l.startDate,
//         durationHours: typeof l.durationHours === "number" ? l.durationHours : Number(l.durationHours) || 0,
//       }));

//       if (!createdLogs.length) {
//         setRows([{ id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) }]);
//         setLoadingFetch(false);
//         return;
//       }

//       const dates = createdLogs.map((c) => new Date(c.startDate));
//       const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
//       const monday = getMonday(minDate);
//       const weekDaysComputed = buildWeekDaysFromMonday(monday);
//       setWeekDays(weekDaysComputed);

//       const startLabel = `${padNum(monday.getDate())} ${shortMonth(monday)}`;
//       const sunday = new Date(monday);
//       sunday.setDate(monday.getDate() + 6);
//       const endLabel = `${padNum(sunday.getDate())} ${shortMonth(sunday)}`;
//       setWeekLabel(`${startLabel} - ${endLabel}`);

//       const map = new Map<string, { taskIdStr: string; taskLabel: string; hours: number[] }>();

//       for (const log of createdLogs) {
//         const key = `${log.taskId ?? "null"}_${log.projectId ?? "null"}`;
//         const taskIdStr = log.taskId ? String(log.taskId) : "";
//         const taskLabel = log.taskName ?? log.projectName ?? `Task ${taskIdStr || log.id}`;

//         if (!map.has(key)) map.set(key, { taskIdStr, taskLabel, hours: Array(7).fill(0) });

//         const d = new Date(log.startDate);
//         const diffDays = dateDiffInDays(monday, d);
//         if (diffDays >= 0 && diffDays < 7) {
//           const bucket = map.get(key)!;
//           bucket.hours[diffDays] = Number(bucket.hours[diffDays]) + Number(log.durationHours || 0);
//         }
//       }

//       const finalRows: Row[] = Array.from(map.entries()).map(([k, v], idx) => ({
//         id: `r-${idx}`,
//         taskId: v.taskIdStr,
//         taskLabel: v.taskLabel,
//         hours: v.hours,
//       }));

//       if (finalRows.length === 0) finalRows.push({ id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) });

//       setRows(finalRows);
//       setLoadingFetch(false);
//     } catch (err: any) {
//       clearTimeout(timer);
//       if (err.name === "AbortError") setErrorFetch("Request timed out.");
//       else setErrorFetch(err?.message || "Fetch failed.");
//       setRows([{ id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) }]);
//       setLoadingFetch(false);
//     }
//   }

//   /* ---------------------- Save (POST) ---------------------- */
//   async function handleSave() {
//     setSaveResults(null);
//     setLoadingSave(true);

//     const rowsToSend = rows.filter((r) => r.taskId && r.taskId.trim() !== "");
//     if (!rowsToSend.length) {
//       setSaveResults("No task selected in any row. Select a task (taskId) before saving.");
//       setLoadingSave(false);
//       return;
//     }

//     const url = `${apiBaseUrl.replace(/\/$/, "")}${ENDPOINT}`;
//     const headers: Record<string, string> = { "Content-Type": "application/json" };
//     const effectiveToken = getEffectiveToken();
//     if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

//     const controller = new AbortController();
//     const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

//     try {
//       for (const row of rowsToSend) {
//         const days = weekDays
//           .map((d, i) => ({ date: d.iso, hours: Number(row.hours[i] ?? 0) }))
//           .filter((x) => typeof x.hours === "number" && !Number.isNaN(x.hours) && x.hours > 0);

//         const payload = {
//           taskId: Number(row.taskId),
//           days: days.map((d) => ({ date: d.date, hours: d.hours })),
//         };

//         if (!payload.days.length) continue;

//         const res = await fetch(url, {
//           method: "POST",
//           headers,
//           body: JSON.stringify(payload),
//           signal: controller.signal,
//           credentials: "include",
//         });

//         if (!res.ok) {
//           if (res.status === 401) {
//             const txt = await safeText(res);
//             throw new Error(`Save failed (401): ${txt || "Unauthorized. Token missing/invalid."}`);
//           }
//           const txt = await safeText(res);
//           throw new Error(`Save failed (${res.status}): ${txt || res.statusText}`);
//         }
//       }

//       clearTimeout(timer);
//       setSaveResults(`Saved ${rowsToSend.length} task(s).`);
//     } catch (err: any) {
//       clearTimeout(timer);
//       if (err.name === "AbortError") setSaveResults("Save request timed out.");
//       else setSaveResults(err?.message || "Save failed.");
//     } finally {
//       setLoadingSave(false);
//     }
//   }

//   /* ---------------------- UI handlers ---------------------- */
//   function handleChangeHour(rowIndex: number, dayIndex: number, value: string) {
//     setRows((prev) =>
//       prev.map((r, i) =>
//         i === rowIndex ? { ...r, hours: r.hours.map((h, j) => (j === dayIndex ? clampNumberFromString(value) : h)) } : r
//       )
//     );
//   }

//   function handleChangeTask(rowIndex: number, taskId: string, taskLabel?: string) {
//     setRows((prev) => prev.map((r, i) => (i === rowIndex ? { ...r, taskId, taskLabel: taskLabel ?? r.taskLabel } : r)));
//   }

//   function addRow() {
//     setRows((prev) => [...prev, { id: `r-${Date.now()}`, taskId: "", taskLabel: "", hours: Array(7).fill(0) }]);
//   }

//   function totalPerDay(dayIndex: number) {
//     return rows.reduce((sum, r) => sum + Number(r.hours[dayIndex] || 0), 0);
//   }

//   /* ---------------------- Render ---------------------- */
//   return (
//     <div
//       className="
//         fixed
//         left-0 top-0 right-0 bottom-0
//         md:left-[260px] md:top-[64px] md:right-0 md:bottom-0
//         bg-white flex flex-col
//         z-[11000] overflow-hidden
//       "
//       aria-modal="true"
//       role="dialog"
//     >
//       {/* Top bar */}
//       <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
//         <h1 className="text-xl font-semibold text-gray-900">Weekly Timesheet</h1>

//         <div className="flex items-center gap-4">
//           <button className="w-9 h-9 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50">
//             <Search className="w-4 h-4 text-gray-600" />
//           </button>

//           <div className="flex items-center rounded-md border border-gray-200 overflow-hidden bg-white">
//             <button className="px-3 h-9 flex items-center justify-center text-gray-600 text-sm hover:bg-gray-50" type="button">
//               <List className="w-4 h-4" />
//             </button>
//             <button className="px-3 h-9 flex items-center justify-center text-white text-sm bg-indigo-500" type="button">
//               <CalendarDays className="w-4 h-4" />
//             </button>
//             <button className="px-3 h-9 flex items-center justify-center text-gray-600 text-sm hover:bg-gray-50" type="button">
//               <Calendar className="w-4 h-4" />
//             </button>
//           </div>

//           <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
//             <Bell className="w-4 h-4 text-gray-700" />
//           </button>
//           <div className="w-9 h-9 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
//             <User className="w-4 h-4 text-gray-700" />
//           </div>

//           <button onClick={onClose} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 ml-1" aria-label="Close weekly timesheet">
//             <X className="w-4 h-4 text-gray-600" />
//           </button>
//         </div>
//       </header>

//       {/* Content */}
//       <div className="flex-1 overflow-auto bg-[#f7f8fc]">
//         <div className="max-w-6xl mx-auto w-full px-6 py-6">
//           <h2 className="text-sm font-medium text-gray-800 mb-4">Add Weekly Timesheet</h2>

//           {/* Week selector */}
//           <div className="flex items-center gap-4 mb-4">
//             <span className="text-sm text-gray-700 w-16">Week</span>
//             <div className="flex items-center border border-gray-200 rounded-md bg-white">
//               <button className="h-9 px-3 border-r border-gray-200 hover:bg-gray-50">
//                 <ChevronLeft className="w-4 h-4 text-gray-600" />
//               </button>
//               <div className="px-4 text-sm text-gray-800 min-w-[160px] text-center">{weekLabel}</div>
//               <button className="h-9 px-3 border-l border-gray-200 hover:bg-gray-50">
//                 <ChevronRight className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>
//           </div>

//           {/* fetch loading / error */}
//           {loadingFetch && <div className="mb-4 text-sm text-gray-600">Loading weekly timesheet…</div>}
//           {errorFetch && (
//             <div className="mb-4 text-sm">
//               <span className="text-red-600">Error: {errorFetch}</span>
//               {errorFetch.includes("401") && (
//                 <div className="text-xs text-gray-600 mt-1">Hint: Token missing/invalid. Ensure localStorage['{LOCAL_TOKEN_KEY}'] is set.</div>
//               )}
//             </div>
//           )}

//           {/* grid */}
//           <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
//             <div className="bg-[#e8f0ff] border-b border-gray-200">
//               <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))]">
//                 <div className="px-4 py-3 text-xs font-medium text-gray-700 flex items-end">Task</div>
//                 {weekDays.map((d) => (
//                   <div key={d.iso} className="px-2 py-2 text-center border-l border-blue-100">
//                     <div className="text-sm font-semibold text-gray-900">{d.date}</div>
//                     <div className="text-[10px] text-gray-600 leading-tight">{d.month}</div>
//                     <div className="text-[10px] text-gray-500">{d.label}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {rows.map((row, rowIndex) => (
//               <div key={row.id} className="border-b border-gray-200 last:border-b-0">
//                 <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))]">
//                   <div className="px-4 py-3 border-r border-gray-200 flex items-center">
//                     <select
//                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white"
//                       value={row.taskId}
//                       onChange={(e) => handleChangeTask(rowIndex, e.target.value, e.target.selectedOptions[0]?.text || "")}
//                     >
//                       <option value="">{row.taskLabel ? row.taskLabel : "Select"}</option>
//                       <option value="1">Task 1 (id:1)</option>
//                       <option value="2">Task 2 (id:2)</option>
//                       <option value="3">Task 3 (id:3)</option>
//                     </select>
//                   </div>

//                   {weekDays.map((d, dayIndex) => (
//                     <div key={`${rowIndex}-${d.iso}`} className="px-2 py-3 border-l border-gray-200 flex items-center justify-center">
//                       <input
//                         type="number"
//                         min={0}
//                         step="0.25"
//                         className="w-14 text-center border border-gray-300 rounded-md text-sm py-1"
//                         value={row.hours[dayIndex] ?? 0}
//                         onChange={(e) => handleChangeHour(rowIndex, dayIndex, e.target.value)}
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}

//             <div className="border-t border-gray-200 bg-white">
//               <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))]">
//                 <div className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">Total</div>
//                 {weekDays.map((d, i) => (
//                   <div key={d.iso} className="px-2 py-3 border-l border-gray-200 text-center text-sm text-gray-700">
//                     {totalPerDay(i)}hrs
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* footer */}
//           <div className="flex items-center justify-between mt-4">
//             <div>
//               <button type="button" onClick={addRow} className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-600 rounded-md text-sm font-medium bg-white hover:bg-blue-50">
//                 + Add More
//               </button>

//               {saveResults && <div className="mt-3 text-sm text-gray-700">{saveResults}</div>}
//             </div>

//             <div>
//               <button
//                 type="button"
//                 onClick={handleSave}
//                 disabled={loadingSave}
//                 className="px-6 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60"
//               >
//                 {loadingSave ? "Saving…" : "Save"}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WeeklyTimesheetModal;

// /* ---------------------- Utilities ---------------------- */

// async function safeText(res: Response) {
//   try {
//     return await res.text();
//   } catch {
//     return null;
//   }
// }

// function isoDate(d: Date) {
//   const y = d.getFullYear();
//   const m = `${d.getMonth() + 1}`.padStart(2, "0");
//   const day = `${d.getDate()}`.padStart(2, "0");
//   return `${y}-${m}-${day}`;
// }

// function padNum(n: number) {
//   return `${n}`.padStart(2, "0");
// }

// function shortMonth(d: Date) {
//   const name = MONTH_NAMES[d.getMonth()];
//   return name.slice(0, 3);
// }

// function getMonday(d: Date) {
//   const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
//   const day = dt.getDay();
//   const diff = (day + 6) % 7;
//   dt.setDate(dt.getDate() - diff);
//   return dt;
// }

// function buildWeekDaysFromMonday(monday: Date): WeekDay[] {
//   const arr: WeekDay[] = [];
//   for (let i = 0; i < 7; i++) {
//     const dd = new Date(monday);
//     dd.setDate(monday.getDate() + i);
//     arr.push({
//       date: `${dd.getDate()}`,
//       month: shortMonth(dd),
//       label: WEEKDAY_LABELS[i],
//       iso: isoDate(dd),
//     });
//   }
//   return arr;
// }

// function dateDiffInDays(a: Date, b: Date) {
//   const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
//   const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
//   return Math.floor((utcB - utcA) / (24 * 60 * 60 * 1000));
// }

// function clampNumberFromString(v: string) {
//   if (v === "") return 0;
//   const n = Number(v);
//   if (Number.isNaN(n)) return 0;
//   return Math.max(0, n);
// }



"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Search,
  List,
  CalendarDays,
  Calendar,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * WeeklyTimesheetModal
 * - Always reads the token from localStorage at request time to avoid race conditions.
 * - Falls back to authToken prop if localStorage has no value.
 * - Sends Authorization: Bearer <token> when present.
 */

/* ---------------------- CONFIG ---------------------- */
const DEFAULT_API_BASE = "https://6jnqmj85-80.inc1.devtunnels.ms";
const ENDPOINT = "/timesheets/weekly";
const API_TIMEOUT_MS = 15000;
// Change this if your app stores the token under a different key
const LOCAL_TOKEN_KEY = "authToken";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const MONTH_NAMES: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ---------------------- Types ---------------------- */
type WeeklyTimesheetModalProps = {
  open: boolean;
  onClose: () => void;
  apiBaseUrl?: string;
  authToken?: string | null; // fallback if localStorage missing
};

type WeekDay = {
  date: string;
  month: string;
  label: string;
  iso: string;
};

type Row = {
  id: string;
  taskId: string;
  taskLabel: string;
  hours: number[];
};

type CreatedLog = {
  id: number;
  projectId: number | null;
  projectShortCode?: string;
  projectName?: string | null;
  taskId?: number | null;
  taskName?: string | null;
  employeeId?: string;
  startDate: string; // YYYY-MM-DD
  durationHours: number;
};

/* ---------------------- Component ---------------------- */
const WeeklyTimesheetModal: React.FC<WeeklyTimesheetModalProps> = ({
  open,
  onClose,
  apiBaseUrl = DEFAULT_API_BASE,
  authToken = null,
}) => {
  const [rows, setRows] = useState<Row[]>([
    { id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) },
  ]);
  const [weekDays, setWeekDays] = useState<WeekDay[]>(() => {
    const now = new Date();
    const monday = getMonday(now);
    return buildWeekDaysFromMonday(monday);
  });
  const [weekLabel, setWeekLabel] = useState("25 Aug - 31 Aug");
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [errorFetch, setErrorFetch] = useState<string | null>(null);
  const [saveResults, setSaveResults] = useState<string | null>(null);

  if (!open) return null;

  // fetch on modal open
  useEffect(() => {
    fetchWeekly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------- Helpers ---------------------- */

  // read token directly from localStorage each time (avoid state race)
  function getEffectiveToken() {
    try {
      if (typeof window !== "undefined") {
        
    const t = localStorage.getItem("accessToken");
        if (t && t.trim() !== "") return t.trim();
      }
    } catch {
      // ignore localStorage errors and use fallback
    }
    return authToken ?? null;
  }

  /* ---------------------- Fetch existing week (POST) ---------------------- */
  async function fetchWeekly() {
    setLoadingFetch(true);
    setErrorFetch(null);

    const base = apiBaseUrl.replace(/\/$/, "");
    const url = `${base}${ENDPOINT}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const effectiveToken = getEffectiveToken();
    if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      // send weekStart (ISO) so backend can return logs for the requested week.
      const payload = { weekStart: weekDays[0]?.iso };

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timer);

      if (!res.ok) {
        if (res.status === 401) {
          const bodyText = await safeText(res);
          throw new Error(
            `Fetch failed (401): ${bodyText || "Unauthorized. Token missing/invalid."}`
          );
        }
        const txt = await safeText(res);
        throw new Error(`Fetch failed (${res.status}): ${txt || res.statusText}`);
      }

      const json = await res.json();
      const createdLogs: CreatedLog[] = (json.createdLogs || []).map((l: any) => ({
        id: l.id,
        projectId: l.projectId,
        projectShortCode: l.projectShortCode,
        projectName: l.projectName,
        taskId: l.taskId,
        taskName: l.taskName,
        employeeId: l.employeeId,
        startDate: l.startDate,
        durationHours:
          typeof l.durationHours === "number" ? l.durationHours : Number(l.durationHours) || 0,
      }));

      if (!createdLogs.length) {
        setRows([{ id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) }]);
        setLoadingFetch(false);
        return;
      }

      const dates = createdLogs.map((c) => new Date(c.startDate));
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const monday = getMonday(minDate);
      const weekDaysComputed = buildWeekDaysFromMonday(monday);
      setWeekDays(weekDaysComputed);

      const startLabel = `${padNum(monday.getDate())} ${shortMonth(monday)}`;
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const endLabel = `${padNum(sunday.getDate())} ${shortMonth(sunday)}`;
      setWeekLabel(`${startLabel} - ${endLabel}`);

      const map = new Map<string, { taskIdStr: string; taskLabel: string; hours: number[] }>();

      for (const log of createdLogs) {
        const key = `${log.taskId ?? "null"}_${log.projectId ?? "null"}`;
        const taskIdStr = log.taskId ? String(log.taskId) : "";
        const taskLabel = log.taskName ?? log.projectName ?? `Task ${taskIdStr || log.id}`;

        if (!map.has(key)) map.set(key, { taskIdStr, taskLabel, hours: Array(7).fill(0) });

        const d = new Date(log.startDate);
        const diffDays = dateDiffInDays(monday, d);
        if (diffDays >= 0 && diffDays < 7) {
          const bucket = map.get(key)!;
          bucket.hours[diffDays] = Number(bucket.hours[diffDays]) + Number(log.durationHours || 0);
        }
      }

      const finalRows: Row[] = Array.from(map.entries()).map(([k, v], idx) => ({
        id: `r-${idx}`,
        taskId: v.taskIdStr,
        taskLabel: v.taskLabel,
        hours: v.hours,
      }));

      if (finalRows.length === 0)
        finalRows.push({ id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) });

      setRows(finalRows);
      setLoadingFetch(false);
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") setErrorFetch("Request timed out.");
      else setErrorFetch(err?.message || "Fetch failed.");
      setRows([{ id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) }]);
      setLoadingFetch(false);
    }
  }

  /* ---------------------- Save (POST) ---------------------- */
  async function handleSave() {
    setSaveResults(null);
    setLoadingSave(true);

    const rowsToSend = rows.filter((r) => r.taskId && r.taskId.trim() !== "");
    if (!rowsToSend.length) {
      setSaveResults("No task selected in any row. Select a task (taskId) before saving.");
      setLoadingSave(false);
      return;
    }

    const base = apiBaseUrl.replace(/\/$/, "");
    const url = `${base}${ENDPOINT}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const effectiveToken = getEffectiveToken();
    if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      for (const row of rowsToSend) {
        const days = weekDays
          .map((d, i) => ({ date: d.iso, hours: Number(row.hours[i] ?? 0) }))
          .filter((x) => typeof x.hours === "number" && !Number.isNaN(x.hours) && x.hours > 0);

        const payload = {
          taskId: Number(row.taskId),
          days: days.map((d) => ({ date: d.date, hours: d.hours })),
        };

        if (!payload.days.length) continue;

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            const txt = await safeText(res);
            throw new Error(`Save failed (401): ${txt || "Unauthorized. Token missing/invalid."}`);
          }
          const txt = await safeText(res);
          throw new Error(`Save failed (${res.status}): ${txt || res.statusText}`);
        }
      }

      clearTimeout(timer);
      setSaveResults(`Saved ${rowsToSend.length} task(s).`);
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") setSaveResults("Save request timed out.");
      else setSaveResults(err?.message || "Save failed.");
    } finally {
      setLoadingSave(false);
    }
  }

  /* ---------------------- UI handlers ---------------------- */
  function handleChangeHour(rowIndex: number, dayIndex: number, value: string) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex ? { ...r, hours: r.hours.map((h, j) => (j === dayIndex ? clampNumberFromString(value) : h)) } : r
      )
    );
  }

  function handleChangeTask(rowIndex: number, taskId: string, taskLabel?: string) {
    setRows((prev) => prev.map((r, i) => (i === rowIndex ? { ...r, taskId, taskLabel: taskLabel ?? r.taskLabel } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: `r-${Date.now()}`, taskId: "", taskLabel: "", hours: Array(7).fill(0) }]);
  }

  function totalPerDay(dayIndex: number) {
    return rows.reduce((sum, r) => sum + Number(r.hours[dayIndex] || 0), 0);
  }

  /* ---------------------- Render ---------------------- */
  return (
    <div
      className="
        fixed
        left-0 top-0 right-0 bottom-0
        md:left-[260px] md:top-[64px] md:right-0 md:bottom-0
        bg-white flex flex-col
        z-[11000] overflow-hidden
      "
      aria-modal="true"
      role="dialog"
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Weekly Timesheet</h1>

        <div className="flex items-center gap-4">
          <button className="w-9 h-9 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <Search className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex items-center rounded-md border border-gray-200 overflow-hidden bg-white">
            <button className="px-3 h-9 flex items-center justify-center text-gray-600 text-sm hover:bg-gray-50" type="button">
              <List className="w-4 h-4" />
            </button>
            <button className="px-3 h-9 flex items-center justify-center text-white text-sm bg-indigo-500" type="button">
              <CalendarDays className="w-4 h-4" />
            </button>
            <button className="px-3 h-9 flex items-center justify-center text-gray-600 text-sm hover:bg-gray-50" type="button">
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <Bell className="w-4 h-4 text-gray-700" />
          </button>
          <div className="w-9 h-9 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-700" />
          </div>

          <button onClick={onClose} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 ml-1" aria-label="Close weekly timesheet">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f7f8fc]">
        <div className="max-w-6xl mx-auto w-full px-6 py-6">
          <h2 className="text-sm font-medium text-gray-800 mb-4">Add Weekly Timesheet</h2>

          {/* Week selector */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-700 w-16">Week</span>
            <div className="flex items-center border border-gray-200 rounded-md bg-white">
              <button className="h-9 px-3 border-r border-gray-200 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-4 text-sm text-gray-800 min-w-[160px] text-center">{weekLabel}</div>
              <button className="h-9 px-3 border-l border-gray-200 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* fetch loading / error */}
          {loadingFetch && <div className="mb-4 text-sm text-gray-600">Loading weekly timesheet…</div>}
          {errorFetch && (
            <div className="mb-4 text-sm">
              <span className="text-red-600">Error: {errorFetch}</span>
              {errorFetch.includes("401") && (
                <div className="text-xs text-gray-600 mt-1">Hint: Token missing/invalid. Ensure localStorage['{LOCAL_TOKEN_KEY}'] is set.</div>
              )}
            </div>
          )}

          {/* grid */}
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#e8f0ff] border-b border-gray-200">
              <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))]">
                <div className="px-4 py-3 text-xs font-medium text-gray-700 flex items-end">Task</div>
                {weekDays.map((d) => (
                  <div key={d.iso} className="px-2 py-2 text-center border-l border-blue-100">
                    <div className="text-sm font-semibold text-gray-900">{d.date}</div>
                    <div className="text-[10px] text-gray-600 leading-tight">{d.month}</div>
                    <div className="text-[10px] text-gray-500">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {rows.map((row, rowIndex) => (
              <div key={row.id} className="border-b border-gray-200 last:border-b-0">
                <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))]">
                  <div className="px-4 py-3 border-r border-gray-200 flex items-center">
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white"
                      value={row.taskId}
                      onChange={(e) => handleChangeTask(rowIndex, e.target.value, e.target.selectedOptions[0]?.text || "")}
                    >
                      <option value="">{row.taskLabel ? row.taskLabel : "Select"}</option>
                      <option value="1">Task 1 (id:1)</option>
                      <option value="2">Task 2 (id:2)</option>
                      <option value="3">Task 3 (id:3)</option>
                    </select>
                  </div>

                  {weekDays.map((d, dayIndex) => (
                    <div key={`${rowIndex}-${d.iso}`} className="px-2 py-3 border-l border-gray-200 flex items-center justify-center">
                      <input
                        type="number"
                        min={0}
                        step="0.25"
                        className="w-14 text-center border border-gray-300 rounded-md text-sm py-1"
                        value={row.hours[dayIndex] ?? 0}
                        onChange={(e) => handleChangeHour(rowIndex, dayIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 bg-white">
              <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))]">
                <div className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">Total</div>
                {weekDays.map((d, i) => (
                  <div key={d.iso} className="px-2 py-3 border-l border-gray-200 text-center text-sm text-gray-700">
                    {totalPerDay(i)}hrs
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <button type="button" onClick={addRow} className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-600 rounded-md text-sm font-medium bg-white hover:bg-blue-50">
                + Add More
              </button>

              {saveResults && <div className="mt-3 text-sm text-gray-700">{saveResults}</div>}
            </div>

            <div>
              <button
                type="button"
                onClick={handleSave}
                disabled={loadingSave}
                className="px-6 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {loadingSave ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTimesheetModal;

/* ---------------------- Utilities ---------------------- */

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function padNum(n: number) {
  return `${n}`.padStart(2, "0");
}

function shortMonth(d: Date) {
  const name = MONTH_NAMES[d.getMonth()];
  return name.slice(0, 3);
}

function getMonday(d: Date) {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = dt.getDay();
  const diff = (day + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  return dt;
}

function buildWeekDaysFromMonday(monday: Date): WeekDay[] {
  const arr: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    arr.push({
      date: `${dd.getDate()}`,
      month: shortMonth(dd),
      label: WEEKDAY_LABELS[i],
      iso: isoDate(dd),
    });
  }
  return arr;
}

function dateDiffInDays(a: Date, b: Date) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcB - utcA) / (24 * 60 * 60 * 1000));
}

function clampNumberFromString(v: string) {
  if (v === "") return 0;
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n);
}
