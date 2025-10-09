"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Deal } from "@/types/deals";

export default function EditDealPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    dealStage: "OPEN",
    dealCategory: "",
    pipeline: "",
    dealAgent: "",
    dealWatchers: "",
    expectedCloseDate: "",
    dealContact: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }
        const res = await fetch(`/api/deals/get/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch deal");
        const data: Deal = await res.json();
        setFormData({
          title: data.title,
          value: data.value.toString(),
          dealStage: data.dealStage,
          dealCategory: data.dealCategory,
          pipeline: data.pipeline,
         
          dealAgent: data.dealAgent || "",
          dealWatchers: data.dealWatchers?.join(", ") || "",
          expectedCloseDate: data.expectedCloseDate
            ? new Date(data.expectedCloseDate).toISOString().split("T")[0]
            : "",
          dealContact: data.dealContact || "",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load deal details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found. Please log in.");
        return;
      }

      const res = await fetch(`/api/deals/create/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          dealWatchers: formData.dealWatchers
            ? formData.dealWatchers.split(",").map((w) => w.trim())
            : [],
        }),
      });

      if (!res.ok) throw new Error("Failed to update deal");

      setSuccess("Deal updated successfully!");
      setTimeout(() => router.push("/deals/get"), 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to update deal. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
        Loading deal details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Deal</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-2xl shadow-sm">
        {error && (
          <div className="mb-4 text-red-600 text-sm font-semibold">{error}</div>
        )}
        {success && (
          <div className="mb-4 text-green-600 text-sm font-semibold">{success}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value ($)
            </label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Stage
            </label>
            <select
              name="dealStage"
              value={formData.dealStage}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="OPEN">Open</option>
              <option value="WIN">Win</option>
              <option value="LOSS">Loss</option>
              <option value="Generated">Generated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              name="dealCategory"
              value={formData.dealCategory}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pipeline
            </label>
            <input
              type="text"
              name="pipeline"
              value={formData.pipeline}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Agent
            </label>
            <input
              type="text"
              name="dealAgent"
              value={formData.dealAgent}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Watchers (comma-separated)
            </label>
            <input
              type="text"
              name="dealWatchers"
              value={formData.dealWatchers}
              onChange={handleChange}
              placeholder="e.g., EMP-010, EMP-011"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Close Date
            </label>
            <input
              type="date"
              name="expectedCloseDate"
              value={formData.expectedCloseDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Contact
            </label>
            <input
              type="text"
              name="dealContact"
              value={formData.dealContact}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Updating..." : "Update Deal"}
          </button>
          <Link href="/deals/get" className="px-4 py-2 text-blue-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-4">
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}