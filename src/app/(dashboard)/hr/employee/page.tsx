"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  gender: string;
  birthday: string;
  bloodGroup: string;
  joiningDate: string;
  language: string;
  country: string;
  mobile: string;
  address: string;
  about: string;
  departmentId: number | null;
  departmentName: string | null;
  designationId: number | null;
  designationName: string | null;
  reportingToId: string | null;
  reportingToName: string | null;
  role: string;
  loginAllowed: boolean;
  receiveEmailNotification: boolean;
  hourlyRate: number;
  slackMemberId: string;
  skills: string[];
  probationEndDate: string | null;
  noticePeriodStartDate: string | null;
  noticePeriodEndDate: string | null;
  employmentType: string;
  maritalStatus: string;
  businessAddress: string;
  officeShift: string;
  active: boolean;
  createdAt: string;
}

type LeadFormData = {
  name: string;
  email: string;
  mobileNumber: string;
  clientCategory: string;
  leadSource: string;
  leadOwner: string;
  addedBy: string;
  autoConvertToClient: boolean;
  companyName: string;
  city: string;
  country: string;
};

export default function LeadCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    mobileNumber: "",
    clientCategory: "",
    leadSource: "",
    leadOwner: "",
    addedBy: "",
    autoConvertToClient: false,
    companyName: "",
    city: "",
    country: "",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }

        const res = await fetch("/api/hr/employee", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        setEmployees(data.content); // assuming API returns { content: Employee[] }
      } catch (err) {
        console.error(err);
        setError("Failed to load employees. Please try again.");
      }
    };
    fetchEmployees();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, autoConvertToClient: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Basic validation
    if (!formData.name || !formData.email || !formData.companyName) {
      setError("Name, email, and company name are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found. Please log in.");
      }

      const response = await fetch("/api/leads/admin/get", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to create lead.");
      }

      const data = await response.json();
      router.push(`/leads/admin/get`); // Redirect to the new lead's detail page
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back to leads list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-balance">
              Create New Lead
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Enter details to create a new lead.</p>
          </div>
        </div>
      </header>
      <Card className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="grid gap-6">
          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}
          <div>
            <h2 className="text-lg font-semibold">Lead Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-sm text-muted-foreground">Name *</label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter lead name"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm text-muted-foreground">Email *</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="mobileNumber" className="text-sm text-muted-foreground">Mobile Number</label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className="text-sm text-muted-foreground">Company Name *</label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="clientCategory" className="text-sm text-muted-foreground">Client Category</label>
                <Input
                  id="clientCategory"
                  name="clientCategory"
                  value={formData.clientCategory}
                  onChange={handleInputChange}
                  placeholder="Enter client category"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Location</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="text-sm text-muted-foreground">City</label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label htmlFor="country" className="text-sm text-muted-foreground">Country</label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Assignment</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="leadOwner" className="text-sm text-muted-foreground">Lead Owner</label>
                <select
                  id="leadOwner"
                  name="leadOwner"
                  value={formData.leadOwner}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="" disabled>
                    Select Lead Owner
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.name} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="addedBy" className="text-sm text-muted-foreground">Added By</label>
                <select
                  id="addedBy"
                  name="addedBy"
                  value={formData.addedBy}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="" disabled>
                    Select Added By
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.name} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Source and Options</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="leadSource" className="text-sm text-muted-foreground">Lead Source</label>
                <Input
                  id="leadSource"
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={handleInputChange}
                  placeholder="Enter lead source"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="autoConvertToClient"
                  checked={formData.autoConvertToClient}
                  onCheckedChange={handleCheckboxChange}
                />
                <label htmlFor="autoConvertToClient" className="text-sm text-muted-foreground">
                  Auto Convert to Client
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}