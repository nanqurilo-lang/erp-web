"use client";

import { useState } from "react";

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // ✅ Convert checkbox booleans to "true"/"false"
    formData.set("noDeadline", form.noDeadline.checked ? "true" : "false");
    formData.set("tasksNeedAdminApproval", form.tasksNeedAdminApproval.checked ? "true" : "false");
    formData.set("allowManualTimeLogs", form.allowManualTimeLogs.checked ? "true" : "false");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMessage("No token found!");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/work/project", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message || data?.message || JSON.stringify(data);

        setMessage(`❌ ${errorMsg}`);
      } else {
        setMessage("✅ Project created successfully!");
        form.reset();
      }
    } catch (error) {
      console.error(error);
      setMessage("Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Create Project</h2>
      {message && <p className="mb-3 text-blue-600">{message}</p>}

      <form onSubmit={handleCreateProject} className="space-y-4">

        <div>
          <label className="block font-medium">Project Name</label>
          <input name="projectName" required className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Short Code</label>
          <input name="shortCode" required className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Start Date</label>
          <input type="date" name="startDate" required className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Deadline</label>
          <input type="date" name="deadline" className="w-full p-2 border rounded" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="noDeadline" />
          <label>No Deadline</label>
        </div>

        <div>
          <label className="block font-medium">Project Category</label>
          <input name="projectCategory" className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Department ID</label>
          <input type="number" name="departmentId" className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Client ID</label>
          <input name="clientId" className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Assigned Employee IDs (comma-separated)</label>
          <input name="assignedEmployeeIds" required type="text" className="w-full p-2 border rounded" placeholder="1,2,3" />
        </div>

        <div>
          <label className="block font-medium">Project Summary</label>
          <textarea name="projectSummary" className="w-full p-2 border rounded" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="tasksNeedAdminApproval" />
          <label>Tasks Need Admin Approval</label>
        </div>

        <div>
          <label className="block font-medium">Currency</label>
          <input name="currency" className="w-full p-2 border rounded" placeholder="USD / INR" />
        </div>

        <div>
          <label className="block font-medium">Project Budget</label>
          <input type="number" name="projectBudget" className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Hours Estimate</label>
          <input type="number" name="hoursEstimate" className="w-full p-2 border rounded" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="allowManualTimeLogs" />
          <label>Allow Manual Time Logs</label>
        </div>

        <div>
          <label className="block font-medium">Attach Company File (optional)</label>
          <input type="file" name="companyFile" className="w-full" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}