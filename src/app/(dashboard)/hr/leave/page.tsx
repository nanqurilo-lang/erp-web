"use client";
import { useEffect, useState } from "react";

interface Leave {
  id: number;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  durationType: string;
  startDate: string | null;
  endDate: string | null;
  singleDate: string | null;
  reason: string;
  status: string;
  rejectionReason: string | null;
  approvedByName: string | null;
  isPaid: boolean;
  approvedAt: string | null;
  rejectedAt: string | null;
  documentUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export default function LeavesList() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Fetch leaves
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch("/api/hr/leave", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setLeaves(data));
  }, []);

  // Approve leave
  const approveLeave = async (leaveId: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setLoadingId(leaveId);

    await fetch(`/api/hr/leave/${leaveId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "APPROVED",
      }),
    });

    // Refresh list after approval
    fetch("/api/hr/leave", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setLeaves(data));

    setLoadingId(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Employee Leaves</h2>
      <ul>
        {leaves.map((leave) => (
          <li
            key={leave.id}
            className="border p-2 mb-2 flex justify-between items-center"
          >
            <div>
              <strong>{leave.employeeName}</strong> ({leave.leaveType}) -{" "}
              {leave.status}
            </div>
            {leave.status !== "APPROVED" && (
              <button
                onClick={() => approveLeave(leave.id)}
                disabled={loadingId === leave.id}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                {loadingId === leave.id ? "Approving..." : "Approve"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
