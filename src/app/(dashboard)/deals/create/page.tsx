"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stage } from "@/types/stages";

export default function CreateDealPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    dealStage: "",
    dealCategory: "",
    pipeline: "",
    description: "",
  });
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }
        const res = await fetch("/api/deals/stages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch stages");
        const data: Stage[] = await res.json();
        setStages(data);
        // Set default dealStage to the first stage's name if available
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, dealStage: data[0].name }));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load stages. Please try again later.");
      } finally {
        setStagesLoading(false);
      }
    };

    fetchStages();
  }, []);

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

      const res = await fetch("/api/deals/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
        }),
      });

      if (!res.ok) throw new Error("Failed to create deal");

      setSuccess("Deal created successfully!");
      setFormData({
        title: "",
        value: "",
        dealStage: stages.length > 0 ? stages[0].name : "",
        dealCategory: "",
        pipeline: "",
        description: "",
      });
      setTimeout(() => router.push("/deals/get"), 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to create deal. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (stagesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
        Loading stages...
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
      <h1 className="text-3xl font-bold mb-6">Create New Deal</h1>

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
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.name}>
                  {stage.name}
                </option>
              ))}
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
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading || stages.length === 0}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
              loading || stages.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating..." : "Create Deal"}
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