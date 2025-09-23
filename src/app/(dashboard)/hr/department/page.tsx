'use client';

import { useEffect, useState } from 'react';

interface Department {
  id: number;
  departmentName: string;
  parentDepartmentId: number | null;
  parentDepartmentName: string | null;
  createAt: string;
}

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [parentDepartmentId, setParentDepartmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update Department State
  const [updateId, setUpdateId] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateParentId, setUpdateParentId] = useState<number | null>(null);

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Fetch all departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        if (!accessToken) throw new Error('Access token not found');

        const res = await fetch('/api/hr/department', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch departments');

        const data: Department[] = await res.json();
        setDepartments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, [accessToken]);

  // Search department by ID
  const handleSearch = async () => {
    try {
      if (!accessToken) throw new Error('Access token not found');
      if (!searchId) return setSearchResult(null);

      const res = await fetch(`/api/hr/department/${searchId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Department not found');
      }

      const data: Department = await res.json();
      setSearchResult(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSearchResult(null);
    }
  };

  // Create a new department
  const handleCreate = async () => {
    try {
      if (!accessToken) throw new Error('Access token not found');
      if (!departmentName) return setError('Department name is required');

      const res = await fetch('/api/hr/department', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentName, parentDepartmentId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create department');
      }

      const data: Department = await res.json();
      setDepartments((prev) => [...prev, data]);
      setDepartmentName('');
      setParentDepartmentId(null);
      setSuccess(`Department "${data.departmentName}" created successfully`);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    }
  };

  // Update existing department
  const handleUpdate = async () => {
    try {
      if (!accessToken) throw new Error('Access token not found');
      if (!updateId) return setError('Department ID is required for update');
      if (!updateName) return setError('Department name is required');

      const res = await fetch(`/api/hr/department/${updateId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName: updateName, parentDepartmentId: updateParentId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update department');
      }

      const data: Department = await res.json();
      setDepartments((prev) =>
        prev.map((dept) => (dept.id === data.id ? data : dept))
      );
      setUpdateId('');
      setUpdateName('');
      setUpdateParentId(null);
      setSuccess(`Department "${data.departmentName}" updated successfully`);
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    }
  };
  const handleDelete = async (id: number) => {
    try {
      if (!accessToken) throw new Error('Access token not found');
  
      const res = await fetch(`/api/hr/department/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete department');
      }
  
      const data = await res.json();
      if (data.status === 'success') {
        setDepartments((prev) => prev.filter((dept) => dept.id !== id));
        setSuccess(`Department deleted successfully`);
        setError('');
      }
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    }
  };
  
  if (loading) return <p>Loading departments...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Departments</h1>

      {/* Search Department */}
      <div className="mb-4 flex gap-2">
        <input
          type="number"
          placeholder="Enter Department ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {searchResult && (
        <div className="mb-4 p-2 border rounded bg-gray-50">
          <strong>{searchResult.departmentName}</strong>
          {searchResult.parentDepartmentName && (
            <span className="text-gray-500"> (Parent: {searchResult.parentDepartmentName})</span>
          )}
          <div className="text-sm text-gray-400">Created at: {searchResult.createAt}</div>
        </div>
      )}

      {/* Create Department Form */}
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Create New Department</h2>
        <input
          type="text"
          placeholder="Department Name"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          className="border p-2 rounded mb-2 w-full"
        />
        <select
          value={parentDepartmentId ?? ''}
          onChange={(e) => setParentDepartmentId(Number(e.target.value) || null)}
          className="border p-2 rounded mb-2 w-full"
        >
          <option value="">No Parent</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.departmentName}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreate}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Create Department
        </button>
      </div>

      {/* Update Department Form */}
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Update Department</h2>
        <input
          type="number"
          placeholder="Department ID"
          value={updateId}
          onChange={(e) => setUpdateId(e.target.value)}
          className="border p-2 rounded mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Department Name"
          value={updateName}
          onChange={(e) => setUpdateName(e.target.value)}
          className="border p-2 rounded mb-2 w-full"
        />
        <select
          value={updateParentId ?? ''}
          onChange={(e) => setUpdateParentId(Number(e.target.value) || null)}
          className="border p-2 rounded mb-2 w-full"
        >
          <option value="">No Parent</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.departmentName}
            </option>
          ))}
        </select>
        <button
          onClick={handleUpdate}
          className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
        >
          Update Department
        </button>
      </div>

      {success && <p className="text-green-500 mb-2">{success}</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}

      {/* Departments List */}
    {/* Departments List with Delete Button */}
<ul className="space-y-2">
  {departments.map((dept) => (
    <li key={dept.id} className="p-2 border rounded flex justify-between items-center">
      <div>
        <strong>{dept.departmentName}</strong>
        {dept.parentDepartmentName && (
          <span className="text-gray-500"> (Parent: {dept.parentDepartmentName})</span>
        )}
        <div className="text-sm text-gray-400">Created at: {dept.createAt}</div>
      </div>
      <button
        onClick={() => handleDelete(dept.id)}
        className="bg-red-500 text-white p-1 px-2 rounded hover:bg-red-600"
      >
        Delete
      </button>
    </li>
  ))}
</ul>

    </div>
  );
}
