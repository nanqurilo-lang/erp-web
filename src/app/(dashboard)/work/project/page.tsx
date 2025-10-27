"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Project {
  id: number;
  shortCode: string;
  name: string;
  startDate: string;
  deadline: string;
  client?: {
    name: string;
    profilePictureUrl?: string;
  };
  currency: string;
  budget: number;
  assignedEmployees?: {
    employeeId: string;
    name: string;
    profileUrl?: string;
    designation?: string;
  }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const getProjects = async (accessToken: string) => {
    try {
      const res = await fetch("/api/work/project", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    setToken(savedToken);

    if (savedToken) {
      getProjects(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <p className="p-4">Loading Projects...</p>;
  if (!token) return <p className="p-4 text-red-500">Unauthorized! Token not found.</p>;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-semibold mb-4">All Projects</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
            <Link href={`/work/project/${project.id}`}>
          <div key={project.id} className="border p-4 rounded shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-2">
              {project.client?.profilePictureUrl && (
                <img
                  src={project.client.profilePictureUrl}
                  alt="client"
                  className="w-10 h-10 object-cover rounded-full"
                />
              )}
              <div>
                <h2 className="text-lg font-bold">{project.name}</h2>
                <p className="text-sm text-gray-600">
                  Client: {project.client?.name || "N/A"}
                </p>
              </div>
            </div>

            <p><strong>Code:</strong> {project.shortCode}</p>
            <p><strong>Budget:</strong> {project.currency} {project.budget}</p>
            <p><strong>Start:</strong> {project.startDate}</p>
            <p><strong>Deadline:</strong> {project.deadline || "No Deadline"}</p>

            <div className="mt-2">
              <p className="font-semibold">Assigned Employees:</p>
              <ul className="list-disc ml-6 text-sm">
                {project.assignedEmployees?.map((emp) => (
                  <li key={emp.employeeId}>
                    {emp.name} {emp.designation && `- ${emp.designation}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
