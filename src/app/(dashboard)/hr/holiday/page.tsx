"use client";

import { useEffect, useState } from "react";

interface Holiday {
  id: number;
  date: string;
  day: string;
  occasion: string;
  isDefaultWeekly: boolean;
  isActive: boolean;
}

export default function HolidayPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [search, setSearch] = useState("");

  const fetchHolidays = async (filter = false) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken")
      if (!token) {
        setError("No token found in localStorage");
        setLoading(false);
        return;
      }

      const url = filter
        ? `/api/hr/holidays/month?year=${year}&month=${month}`
        : `/api/hr/holidays`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch holidays");
      }

      const data: Holiday[] = await res.json();
      setHolidays(data);
      setFilteredHolidays(data); // reset filtered list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load all holidays initially
  useEffect(() => {
    fetchHolidays();
  }, []);

  // Client-side search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredHolidays(holidays);
    } else {
      const lowerSearch = search.toLowerCase();
      setFilteredHolidays(
        holidays.filter((h) => h.occasion.toLowerCase().includes(lowerSearch))
      );
    }
  }, [search, holidays]);

  if (loading) return <p className="p-4">Loading holidays...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Holiday List</h1>

      {/* Filter Form */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 rounded w-24"
          placeholder="Year"
        />
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchHolidays(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Filter
        </button>
        <button
          onClick={() => fetchHolidays(false)}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Reset
        </button>

        {/* Search Box */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by occasion..."
          className="border p-2 rounded flex-1 min-w-[200px]"
        />
      </div>

      {/* Table */}
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Day</th>
            <th className="border p-2">Occasion</th>
            <th className="border p-2">Weekly</th>
          </tr>
        </thead>
        <tbody>
          {filteredHolidays.length > 0 ? (
            filteredHolidays.map((holiday) => (
              <tr key={holiday.id} className="text-center">
                <td className="border p-2">{holiday.date}</td>
                <td className="border p-2">{holiday.day}</td>
                <td className="border p-2">{holiday.occasion}</td>
                <td className="border p-2">
                  {holiday.isDefaultWeekly ? "Yes" : "No"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No holidays found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
