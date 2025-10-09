"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Deal } from "@/types/deals";

interface DealDetail extends Deal {
  // Add any additional fields that might be returned by the detail endpoint
  description?: string;
  notes?: string;
  attachments?: any[];
  // Add other fields as needed based on your API response
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params?.id as string;
  
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const data: DealDetail = await res.json();
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
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold text-red-600">
        {error || "Deal not found"}
        <Link href="/deals/get" className="ml-4 text-blue-600 hover:underline">
          Back to Deals
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link 
            href="/deals/get" 
            className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-2"
          >
            ← Back to Deals
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{deal.title}</h1>
          <p className="text-sm text-gray-500">Deal ID: {deal.id}</p>
        </div>
        
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            deal.dealStage.toUpperCase() === "WIN"
              ? "bg-green-100 text-green-800"
              : deal.dealStage.toUpperCase() === "LOST"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {deal.dealStage}
        </span>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Main Deal Info */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Deal Overview</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {deal.dealAgentMeta?.profileUrl ? (
                  <Image
                    src={deal.dealAgentMeta.profileUrl}
                    alt={deal.dealAgentMeta.name || "Agent"}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">A</span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{deal.dealAgentMeta?.name || deal.dealAgent}</p>
                  <p className="text-sm text-gray-500">Assigned Agent</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Value:</span>
                  <p className="text-2xl font-bold text-green-600">
                    ${deal.value.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <p className="capitalize">{deal.dealCategory}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Pipeline:</span>
                  <p>{deal.pipeline}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p>{new Date(deal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details - extend based on your API response */}
          {deal.description && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{deal.description}</p>
            </div>
          )}

          {deal.notes && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>

        {/* Metadata & Timeline */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Deal Metadata</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Pipeline Stage:</span> {deal.pipeline}</p>
              <p><span className="font-medium">Deal Category:</span> {deal.dealCategory}</p>
              <p><span className="font-medium">Created At:</span> {new Date(deal.createdAt).toLocaleString()}</p>
              {/* Add updatedAt if available */}
              {/* <p><span className="font-medium">Last Updated:</span> {new Date(deal.updatedAt).toLocaleString()}</p> */}
            </div>
          </div>

          {/* Timeline/History - implement if your API provides this */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Activity</h3>
            <div className="text-sm text-gray-500">
              <p>No recent activity to display</p>
              {/* You can extend this section with actual activity feed if available */}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        <div className="flex gap-4">
          {/* Add action buttons based on your requirements */}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Update Stage
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
            Add Note
          </button>
          {/* Add more actions as needed */}
        </div>
      </div>
    </div>
  );
}