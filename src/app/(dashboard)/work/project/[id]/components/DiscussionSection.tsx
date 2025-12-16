// "use client";

// export default function DiscussionSection({ projectId }: { projectId: number }) {
//     return (
//         <div>
//             <h3 className="text-lg font-medium mb-4">Discussion</h3>
//             <div className="border rounded-md p-4 text-gray-400 text-center">
//                 Team discussion will appear here
//             </div>
//         </div>
//     );
// }



"use client";

import React, { useEffect, useState } from "react";
import { Plus, Settings, Trash2, X } from "lucide-react";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://6jnqmj85-80.inc1.devtunnels.ms";

/* ================= TYPES ================= */
type DiscussionCategory = {
  id: number;
  categoryName: string;
  colorCode: string;
};

/* ================= COMPONENT ================= */
export default function DiscussionSection({ projectId }: { projectId: number }) {
  const [categories, setCategories] = useState<DiscussionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [form, setForm] = useState({
    categoryName: "",
    colorCode: "",
  });

  /* ================= LOAD CATEGORIES ================= */
  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/api/projects/discussion-categories`
      );
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* ================= CREATE CATEGORY ================= */
  const createCategory = async () => {
    if (!form.categoryName || !form.colorCode) return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/projects/discussion-categories`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();
      setCategories((prev) => [...prev, data]);

      setForm({ categoryName: "", colorCode: "" });
      setShowCategoryModal(false);
    } catch (err) {
      console.error("Create category failed", err);
    }
  };

  return (
    <div>
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Discussion</h3>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm">
            <Plus size={16} />
            New Discussion
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 border border-blue-500 text-blue-600 px-3 py-1.5 rounded text-sm"
          >
            <Settings size={16} />
            Discussion Category
          </button>
        </div>
      </div>

      {/* ================= CATEGORY FILTER ================= */}
      <div className="mb-4">
        <label className="text-sm text-gray-600 block mb-1">Category</label>
        {/* <select className="border rounded px-3 py-2 text-sm w-48">
          <option>All</option>
          {categories.map((c) => (
            <option key={c.id}>{c.categoryName}</option>
          ))}
        </select> */}




<select className="border rounded px-3 py-2 text-sm w-48">
  <option key="all" value="all">
    All
  </option>

  {categories.map((c) => (
    <option key={c.id} value={c.id}>
      {c.categoryName}
    </option>
  ))}
</select>


      </div>

      {/* ================= DISCUSSION LIST (STATIC UI) ================= */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border rounded-md px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div>
                <p className="font-medium text-sm">
                  Title of the discussion
                </p>
                <p className="text-xs text-gray-500">
                  replied at 31/10/2025 | 12:02 PM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-500">💬 3</span>

              <span className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                General
              </span>

              <Trash2 size={16} className="text-red-500 cursor-pointer" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= CATEGORY MODAL ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] p-5">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Discussion Category</h4>
              <X
                className="cursor-pointer"
                onClick={() => setShowCategoryModal(false)}
              />
            </div>

            {/* TABLE */}
            <div className="border rounded mb-4">
              <div className="grid grid-cols-12 bg-blue-50 px-3 py-2 text-sm font-medium">
                <div className="col-span-1">#</div>
                <div className="col-span-8">Category Name</div>
                <div className="col-span-3 text-right">Action</div>
              </div>

              {loading ? (
                <p className="p-3 text-sm text-gray-500">Loading...</p>
              ) : (
                categories.map((c, idx) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-12 px-3 py-2 border-t text-sm"
                  >
                    <div className="col-span-1">{idx + 1}</div>
                    <div className="col-span-8 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: c.colorCode }}
                      />
                      {c.categoryName}
                    </div>
                    <div className="col-span-3 text-right">
                      <Trash2
                        size={16}
                        className="text-red-500 inline cursor-pointer"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* FORM */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm block mb-1">
                  Category Name *
                </label>
                <input
                  value={form.categoryName}
                  onChange={(e) =>
                    setForm({ ...form, categoryName: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-full text-sm"
                />
              </div>

              <div>
                <label className="text-sm block mb-1">
                  Color Code *
                </label>
                <input
                  value={form.colorCode}
                  onChange={(e) =>
                    setForm({ ...form, colorCode: e.target.value })
                  }
                  placeholder="#3498db"
                  className="border rounded px-3 py-2 w-full text-sm"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="border px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
