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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken'); // Get token from localStorage
        if (!accessToken) {
          setError('Access token not found');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/hr/department', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch departments');
        }

        const data: Department[] = await res.json();
        setDepartments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (loading) return <p>Loading departments...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Departments</h1>
      <ul className="space-y-2">
        {departments.map((dept) => (
          <li key={dept.id} className="p-2 border rounded">
            <strong>{dept.departmentName}</strong>
            {dept.parentDepartmentName && (
              <span className="text-gray-500"> (Parent: {dept.parentDepartmentName})</span>
            )}
            <div className="text-sm text-gray-400">Created at: {dept.createAt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
