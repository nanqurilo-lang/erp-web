"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";

interface Props {
    status: string;
    onView: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    onDelete: () => void;
    loading?: boolean;
}

export default function LeaveActionMenu({
    status,
    onView,
    onApprove,
    onReject,
    onDelete,
    loading,
}: Props) {
    const [open, setOpen] = useState(false);


    return (
        <div className="relative">
            <button
                onClick={() => setOpen((s) => !s)}
                className="p-2 rounded hover:bg-gray-100"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                    <button
                        onClick={() => {

                            setOpen(false);
                            onView();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        View
                    </button>

                    {status === "PENDING" && (
                        <>
                            <button
                                disabled={loading}
                                onClick={() => {
                                    setOpen(false);
                                    onApprove?.();
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-green-600"
                            >
                                Approve
                            </button>

                            <button
                                disabled={loading}
                                onClick={() => {
                                    setOpen(false);
                                    onReject?.();
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                            >
                                Reject
                            </button>
                        </>
                    )}

                    <div className="border-t my-1" />

                    <button
                        onClick={() => {
                            setOpen(false);
                            onDelete();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
