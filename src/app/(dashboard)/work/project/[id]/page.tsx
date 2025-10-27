"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Project {
  id: number;
  shortCode: string;
  name: string;
  startDate: string;
  deadline: string;
  summary?: string;
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

export default function ProjectDetailsPage() {
  const params = useParams();
  const { id } = params;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const getProjectDetails = async (accessToken: string) => {
    try {
      const res = await fetch(`/api/work/project/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch project details");

      const data = await res.json();
      setProject(data);
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      getProjectDetails(token);
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) return <p className="p-4">Loading project...</p>;
  if (!project) return <p className="p-4 text-red-600">Project not found</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
      <p className="text-gray-600 mb-4">{project.summary}</p>

      <div className="flex items-center gap-3 mb-4">
        {project.client?.profilePictureUrl && (
          <img
            src={project.client.profilePictureUrl}
            alt="client"
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <p className="font-semibold">{project.client?.name}</p>
          <p className="text-sm text-gray-500">Client</p>
        </div>
      </div>

      <p><strong>Project Code:</strong> {project.shortCode}</p>
      <p><strong>Budget:</strong> {project.currency} {project.budget}</p>
      <p><strong>Start Date:</strong> {project.startDate}</p>
      <p><strong>Deadline:</strong> {project.deadline || "No Deadline"}</p>

      <div className="mt-5">
        <p className="font-semibold mb-2">Assigned Employees:</p>
        <ul className="list-disc ml-6 text-sm">
          {project.assignedEmployees?.map((emp) => (
            <li key={emp.employeeId}>
              {emp.name} {emp.designation && `- ${emp.designation}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
