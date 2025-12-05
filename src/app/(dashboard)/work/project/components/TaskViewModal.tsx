// components/TaskViewModal.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Employee = { employeeId: string; name: string; profileUrl?: string | null };
type Label = { id: number; name: string };
type Milestone = { id: number; title: string };

export type TaskForView = {
  id: number;
  title?: string;
  projectId?: number;
  projectName?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  createdOn?: string | null;
  noDueDate?: boolean;
  assignedEmployees?: Employee[] | null;
  assignedEmployeeIds?: string[];
  description?: string | null;
  labels?: Label[];
  milestone?: Milestone | null;
  milestoneId?: number | null;
  priority?: string | null;
  isPrivate?: boolean;
  timeEstimateMinutes?: number | null;
  isDependent?: boolean;
  attachments?: { name?: string; url?: string }[] | null;
  taskStage?: { id?: number; name?: string } | null;
  hoursLoggedMinutes?: number | null;
  // optional: subtasks could be added later
};

export default function TaskViewModal({
  open,
  task,
  onClose,
  onMarkComplete,
}: {
  open: boolean;
  task: TaskForView | null;
  onClose: () => void;
  onMarkComplete?: (taskId: number) => void;
}) {
  // ---------- hooks (all at top; never conditional) ----------
  const [tab, setTab] = useState<"files" | "subtask" | "timesheet" | "notes">(
    "files"
  );
  const [isVisible, setIsVisible] = useState(false);

  // left card menu (3-dot at top-right of big left card)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  // reminder confirmation modal
  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false);
  const reminderModalRef = useRef<HTMLDivElement | null>(null);

  // file upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Subtask UI state (for placeholder UI)
  const [subtaskDone, setSubtaskDone] = useState(false);
  const [subtaskMenuOpen, setSubtaskMenuOpen] = useState(false);
  const subtaskMenuRef = useRef<HTMLDivElement | null>(null);
  const subtaskMenuBtnRef = useRef<HTMLButtonElement | null>(null);

  // Add Subtask modal state + form fields
  const [addSubtaskOpen, setAddSubtaskOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDesc, setNewSubtaskDesc] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  // View / Edit subtask modal states
  const [viewSubtaskOpen, setViewSubtaskOpen] = useState(false);
  const [editSubtaskOpen, setEditSubtaskOpen] = useState(false);

  // edit form fields (prefilled when edit opens)
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [editSubtaskDesc, setEditSubtaskDesc] = useState("");
  const [editTitleError, setEditTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setIsVisible(true);
    else {
      setIsVisible(false);
      setMenuOpen(false);
      setReminderConfirmOpen(false);
      setSubtaskMenuOpen(false);
      setAddSubtaskOpen(false);
      setViewSubtaskOpen(false);
      setEditSubtaskOpen(false);
    }
  }, [open]);

  // close menus / modals on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // left-card menu
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }

      // subtask row menu
      if (
        subtaskMenuOpen &&
        subtaskMenuRef.current &&
        !subtaskMenuRef.current.contains(e.target as Node) &&
        subtaskMenuBtnRef.current &&
        !subtaskMenuBtnRef.current.contains(e.target as Node)
      ) {
        setSubtaskMenuOpen(false);
      }

      // reminder modal
      if (
        reminderConfirmOpen &&
        reminderModalRef.current &&
        !reminderModalRef.current.contains(e.target as Node)
      ) {
        setReminderConfirmOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSubtaskMenuOpen(false);
        setReminderConfirmOpen(false);
        setAddSubtaskOpen(false);
        setViewSubtaskOpen(false);
        setEditSubtaskOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen, subtaskMenuOpen, reminderConfirmOpen]);

  const priorityDot = useMemo(() => {
    const priority = (task?.priority || "").toLowerCase();
    switch (priority) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-400";
      case "high":
        return "bg-orange-500";
      case "urgent":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  }, [task?.priority]);
  // ---------- end hooks ----------

  if (!open || !task) return null;

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "--");
  const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString() : "--");
  const minsToHuman = (mins?: number | null) => {
    if (mins === null || mins === undefined) return "--";
    const h = Math.floor((mins || 0) / 60);
    const m = (mins || 0) % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  // Placeholder actions (kept same behavior as before)
  const sendReminderAction = () => {
    alert("Reminder sent to assigned employees");
  };
  const handleSendReminderMenu = () => {
    setMenuOpen(false);
    setReminderConfirmOpen(true);
  };
  const handleEditTask = () => {
    setMenuOpen(false);
    alert("Edit Task clicked");
  };
  const handlePinTask = () => {
    setMenuOpen(false);
    alert("Pin Task clicked");
  };
  const handleCopyTaskLink = () => {
    setMenuOpen(false);
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/tasks/${task.id}`;
    try {
      navigator.clipboard?.writeText(link);
      alert("Task link copied to clipboard");
    } catch {
      alert("Task link: " + link);
    }
  };
  const handleConfirmYes = () => {
    sendReminderAction();
    setReminderConfirmOpen(false);
  };
  const handleConfirmCancel = () => {
    setReminderConfirmOpen(false);
  };

  // file upload UI (UI-only)
  const onUploadClick = () => fileInputRef.current?.click();
  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    alert(
      `${files.length} file(s) selected. Integrate your upload handler to actually send files to server.`
    );
    e.currentTarget.value = "";
  };

  // Subtask UI handlers (minimal; keep functionality same otherwise)
  const onToggleSubtaskDone = () => {
    setSubtaskDone((s) => !s);
  };

  // Subtask menu actions: View, Edit, Delete (UI-only)
  const onSubtaskView = () => {
    setSubtaskMenuOpen(false);
    // set view modal content: for placeholder we have a single subtask title/desc
    setViewSubtaskOpen(true);
  };
  const onSubtaskEdit = () => {
    setSubtaskMenuOpen(false);
    // prefill edit form with current placeholder values
    setEditSubtaskTitle("Title of the sub task");
    setEditSubtaskDesc("");
    setEditTitleError(null);
    setEditSubtaskOpen(true);
  };
  const onSubtaskDelete = () => {
    setSubtaskMenuOpen(false);
    if (confirm("Delete subtask? This is UI-only.")) {
      alert("Subtask deleted (UI-only). Integrate API to persist.");
    }
  };

  // Add Subtask form handlers
  const openAddSubtask = () => {
    setNewSubtaskTitle("");
    setNewSubtaskDesc("");
    setTitleError(null);
    setAddSubtaskOpen(true);
  };
  const onCancelAddSubtask = () => {
    setAddSubtaskOpen(false);
    setTitleError(null);
  };
  const onSaveAddSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      setTitleError("Title is required");
      return;
    }
    // UI-only save: prompt/alert and close. Integrate with API to persist.
    alert(`Subtask "${newSubtaskTitle}" created (UI-only). Integrate API to persist.`);
    setAddSubtaskOpen(false);
  };

  // Edit Subtask handlers (Update button)
  const onCancelEditSubtask = () => {
    setEditSubtaskOpen(false);
    setEditTitleError(null);
  };
  const onUpdateSubtask = () => {
    if (!editSubtaskTitle.trim()) {
      setEditTitleError("Title is required");
      return;
    }
    // UI-only update: alert and close. Integrate API to persist.
    alert(`Subtask updated to "${editSubtaskTitle}" (UI-only). Integrate API to persist.`);
    setEditSubtaskOpen(false);
  };

  // helper: derive friendly filename (kept from earlier)
  const friendlyNameFromUrl = (url?: string) => {
    if (!url) return "attachment";
    try {
      const last = url.split("/").pop() || url;
      return decodeURIComponent(last.split("?")[0]);
    } catch {
      return url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/0">
      <div
        className={[
          "relative h-full w-[83vw] max-w-[83vw] bg-white shadow-xl border-l",
          "transform transition-transform duration-300",
          isVisible ? "translate-x-0" : "translate-x-full",
          "flex flex-col",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <div className="text-sm text-gray-500">
              Task #
              {task.projectId ? `RTA-${String(task.id).padStart(2, "0")}` : `RTA-${String(task.id)}`}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div className="text-lg font-semibold">{task.title ?? "Task Name"}</div>
            </div>
          </div>

          {/* Close */}
          <button aria-label="close" onClick={onClose} className="p-2 rounded hover:bg-gray-100" title="Close">
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left big card */}
            <div className="lg:col-span-2 bg-white border rounded-lg p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <button
                    onClick={() => task.id && onMarkComplete?.(task.id)}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 text-sm"
                  >
                    Mark As Complete
                  </button>
                </div>

                <div className="flex items-center gap-2 relative">
                  {/* 3-dot menu */}
                  <button ref={menuBtnRef} onClick={() => setMenuOpen((s) => !s)} className="p-2 rounded hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor">
                      <circle cx="5" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div ref={menuRef} className="absolute right-10 top-10 w-48 bg-white border rounded-lg shadow-md p-2 z-50">
                      <button onClick={handleSendReminderMenu} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        🔔 Send Reminder
                      </button>
                      <button onClick={handleEditTask} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        ✏️ Edit Task
                      </button>
                      <button onClick={handlePinTask} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        📌 Pin Task
                      </button>
                      <button onClick={handleCopyTaskLink} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                        🔗 Copy Task Link
                      </button>
                    </div>
                  )}

                  {/* placeholder to preserve layout */}
                  <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" />
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6 text-sm">
                <div className="text-gray-500">Project</div>
                <div className="font-medium">{task.projectName ?? `Project ${task.projectId ?? "--"}`}</div>

                <div className="text-gray-500">Priority</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${priorityDot}`} />
                  <span className="font-medium">{task.priority ?? "Low"}</span>
                </div>

                <div className="text-gray-500">Assigned to</div>
                <div className="font-medium">
                  {task.assignedEmployees && task.assignedEmployees.length
                    ? task.assignedEmployees.map((a) => a.name).join(", ")
                    : task.assignedEmployeeIds && task.assignedEmployeeIds.length
                    ? task.assignedEmployeeIds.join(", ")
                    : "--"}
                </div>

                <div className="text-gray-500">Project Code</div>
                <div className="font-medium">RTA-{String(task.id).padStart(2, "0")}</div>

                <div className="text-gray-500">Milestones</div>
                <div className="font-medium">{task.milestone?.title ?? "----"}</div>

                <div className="text-gray-500">Label</div>
                <div className="font-medium">{task.labels && task.labels.length ? task.labels.map((l) => l.name).join(", ") : "--"}</div>

                <div className="text-gray-500">Task Category</div>
                <div className="font-medium">--</div>

                <div className="text-gray-500">Description</div>
                <div className="font-medium whitespace-pre-wrap">{task.description ?? "--"}</div>
              </div>
            </div>

            {/* Right small card */}
            <div className="bg-white border rounded-lg p-5">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <div className="font-medium">{task.taskStage?.name ?? "Doing"}</div>
              </div>

              <div className="mt-4 text-sm">
                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Created On</div>
                  <div className="font-medium">{fmtDateTime(task.createdOn)}</div>
                </div>

                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Start Date</div>
                  <div className="font-medium">{fmtDate(task.startDate)}</div>
                </div>

                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Due Date</div>
                  <div className="font-medium">{task.noDueDate ? "--" : fmtDate(task.dueDate)}</div>
                </div>

                <div className="flex justify-between py-2">
                  <div className="text-gray-500">Hours Logged</div>
                  <div className="font-medium">{minsToHuman(task.hoursLoggedMinutes ?? null)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs area */}
          <div className="px-6 pb-6">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setTab("files")}
                    className={`pb-2 ${tab === "files" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setTab("subtask")}
                    className={`pb-2 ${tab === "subtask" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Sub Task
                  </button>
                  <button
                    onClick={() => setTab("timesheet")}
                    className={`pb-2 ${tab === "timesheet" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Timesheet
                  </button>
                  <button
                    onClick={() => setTab("notes")}
                    className={`pb-2 ${tab === "notes" ? "border-b-2 border-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Notes
                  </button>
                </div>

                {/* Removed right upload button (kept blank to match UI) */}
                <div />
              </div>

              {/* Content area */}
              <div className="mt-4 border rounded-lg p-4 bg-white h-60 overflow-auto">
                {/* Hidden file input (for Files tab) */}
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked} multiple />

                {/* ----- FILES TAB ----- */}
                {tab === "files" && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onUploadClick}
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                        aria-label="Upload File"
                        title="Upload File"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-600 text-blue-600 text-xs">+</span>
                        <span>Upload File</span>
                      </button>
                    </div>

                    <div className="mt-3 flex-1 overflow-auto">
                      {task.attachments && task.attachments.length ? (
                        <ul className="space-y-2 text-sm">
                          {task.attachments.map((a, i) => {
                            const displayName = a.name ?? friendlyNameFromUrl(a.url);
                            return (
                              <li key={i} className="flex items-center justify-between">
                                <div className="truncate max-w-[80%]">{displayName}</div>
                                <div className="text-xs text-gray-500">
                                  {a.url ? (
                                    <a href={a.url} target="_blank" rel="noreferrer" className="underline">
                                      Download
                                    </a>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-gray-500">{/* intentionally minimal empty state */}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ----- SUBTASK TAB (UI matching your screenshot) ----- */}
                {tab === "subtask" && (
                  <div className="h-full flex flex-col">
                    {/* Add a Sub Task */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={openAddSubtask}
                        className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                        aria-label="Add a Sub Task"
                        title="Add a Sub Task"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-600 text-blue-600 text-xs">+</span>
                        <span>Add a Sub Task</span>
                      </button>
                    </div>

                    {/* Subtask list (single example row to match screenshot) */}
                    <div className="mt-4 flex-1 overflow-auto">
                      <ul className="space-y-3">
                        <li className="flex items-center justify-between pr-2">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={subtaskDone}
                                onChange={onToggleSubtaskDone}
                                className="w-4 h-4 rounded border-gray-300"
                                aria-label="toggle subtask done"
                              />
                              <span className={`text-sm ${subtaskDone ? "line-through text-gray-400" : "text-gray-700"}`}>
                                Title of the sub task
                              </span>
                            </label>
                          </div>

                          {/* three-dot for subtask actions */}
                          <div className="relative">
                            <button
                              ref={subtaskMenuBtnRef}
                              onClick={() => setSubtaskMenuOpen((s) => !s)}
                              className="p-2 rounded hover:bg-gray-100"
                              aria-label="subtask menu"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor">
                                <circle cx="5" cy="12" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>

                            {subtaskMenuOpen && (
                              <div ref={subtaskMenuRef} className="absolute right-0 top-8 w-40 bg-white border rounded-lg shadow-md p-1 z-50">
                                <button onClick={onSubtaskView} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7z" stroke="currentColor" strokeWidth="1.2"/></svg>
                                  View
                                </button>
                                <button onClick={onSubtaskEdit} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M3 21l3-1 11-11 2 2-11 11-1 3H3z" stroke="currentColor" strokeWidth="1.2"/></svg>
                                  Edit
                                </button>
                                <button onClick={onSubtaskDelete} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 text-red-600">
                                  <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.2"/></svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* ----- TIMESHEET & NOTES placeholders ----- */}
                {tab === "timesheet" && <div className="text-gray-500">Timesheet (placeholder)</div>}
                {tab === "notes" && <div className="text-gray-500">Notes (placeholder)</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder confirmation modal */}
      {reminderConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div ref={reminderModalRef} role="dialog" aria-modal="true" className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold">Are You Sure?</h3>
              <p className="mt-3 text-sm text-gray-500">You want to send reminder to the assigned employees.</p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={handleConfirmCancel} className="px-6 py-2 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmYes} className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700">Yes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subtask modal (matches provided image) */}
      {addSubtaskOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={newSubtaskTitle}
                onChange={(e) => {
                  setNewSubtaskTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter subtask title"
                autoFocus
              />
              {titleError && <div className="mt-1 text-xs text-red-600">{titleError}</div>}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newSubtaskDesc}
                onChange={(e) => setNewSubtaskDesc(e.target.value)}
                className="mt-2 w-full min-h-[90px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter description (optional)"
              />
            </div>

            {/* Buttons: Cancel (outlined) + Save (filled) */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={onCancelAddSubtask}
                className="px-6 py-2 rounded-full border border-blue-600 text-blue-600 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onSaveAddSubtask}
                className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Subtask modal (read-only, matches second image) */}
      {viewSubtaskOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Subtask Details</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="text-gray-500">Title</div>
              <div className="font-medium">Title of the sub task</div>

              <div className="text-gray-500">Description</div>
              <div className="font-medium">{/* placeholder desc */}
                --
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewSubtaskOpen(false)}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subtask modal (matches third image: Title required, Description, Cancel + Update) */}
      {editSubtaskOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={editSubtaskTitle}
                onChange={(e) => {
                  setEditSubtaskTitle(e.target.value);
                  if (editTitleError) setEditTitleError(null);
                }}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter subtask title"
                autoFocus
              />
              {editTitleError && <div className="mt-1 text-xs text-red-600">{editTitleError}</div>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={editSubtaskDesc}
                onChange={(e) => setEditSubtaskDesc(e.target.value)}
                className="mt-2 w-full min-h-[90px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={onCancelEditSubtask}
                className="px-6 py-2 rounded-full border border-blue-600 text-blue-600 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onUpdateSubtask}
                className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
