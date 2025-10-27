"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

type Employee = {
  employeeId: string;
  name: string;
};

type Deal = {
  title: string;
  pipeline: string;
  dealStage: string;
  dealCategory: string;
  value: number;
  expectedCloseDate: string;
  dealAgent: string;
  dealWatchers: string[];
};

type EmployeeFormData = {
  name: string;
  email: string;
  clientCategory: string;
  leadSource: string;
  leadOwner: string;
  addedBy: string;
  createDeal: boolean;
  autoConvertToClient: boolean;
  companyName: string;
  officialWebsite: string;
  mobileNumber: string;
  officePhone: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  companyAddress: string;
  deal?: Deal;
};

export default function EmployeeCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "Subodh",
    email: "Subodh@example.com",
    clientCategory: "Premium",
    leadSource: "Referral",
    leadOwner: "EMP-010",
    addedBy: "EMP-010",
    createDeal: false,
    autoConvertToClient: false,
    companyName: "Global Corporation Ltd.",
    officialWebsite: "https://www.globalcorp.com",
    mobileNumber: "+44-20-7046-0990",
    officePhone: "+44-20-7940-0190",
    city: "London",
    state: "England",
    postalCode: "SW1A 1AA",
    country: "United Kingdom",
    companyAddress: "1 Parliament Square, Westminster",
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
        setEmployees(data.content);
      } catch (err) {
        console.error(err);
        setError("Failed to load employees. Please try again.");
      }
    };
    fetchEmployees();
  }, []);

  // Input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("deal.")) {
      const dealField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        deal: { ...prev.deal!, [dealField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      autoConvertToClient: checked,
      createDeal: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.name || !formData.email || !formData.companyName) {
      setError("Name, email, and company name are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token found. Please log in.");

      console.log("Submitting payload:", formData); // For debugging

      const response = await fetch("/api/leads/employee/create", {
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
        throw new Error(
          errorData.details || errorData.error || "Failed to create employee."
        );
      }

      await response.json();
      router.push(`/leads/admin/get`);
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
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Create New Employee
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter details to create a new employee.
            </p>
          </div>
        </div>
      </header>

      <Card className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="grid gap-6">
          {error && <div className="text-destructive text-sm text-center">{error}</div>}

          {/* Employee Information */}
          <div>
            <h2 className="text-lg font-semibold">Employee Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
              <InputField label="Email" name="email" value={formData.email} onChange={handleInputChange} required type="email" />
              <InputField label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} />
              <InputField label="Office Phone" name="officePhone" value={formData.officePhone} onChange={handleInputChange} />
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleInputChange} required />
              <InputField label="Official Website" name="officialWebsite" value={formData.officialWebsite} onChange={handleInputChange} />
              <InputField label="Client Category" name="clientCategory" value={formData.clientCategory} onChange={handleInputChange} />
              <InputField label="Lead Source" name="leadSource" value={formData.leadSource} onChange={handleInputChange} />
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold">Location</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Company Address" name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} />
              <InputField label="City" name="city" value={formData.city} onChange={handleInputChange} />
              <InputField label="State" name="state" value={formData.state} onChange={handleInputChange} />
              <InputField label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />
              <InputField label="Country" name="country" value={formData.country} onChange={handleInputChange} />
            </div>
          </div>

          {/* Assignment */}
          <div>
            <h2 className="text-lg font-semibold">Assignment</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Lead Owner</label>
                <select
                  name="leadOwner"
                  value={formData.leadOwner}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="">Select Lead Owner</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Added By</label>
                <select
                  name="addedBy"
                  value={formData.addedBy}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="">Select Added By</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <h2 className="text-lg font-semibold">Options</h2>
            <div className="mt-4 flex items-center gap-2">
              <Checkbox
                id="autoConvertToClient"
                checked={formData.autoConvertToClient}
                onCheckedChange={handleCheckboxChange}
              />
              <label htmlFor="autoConvertToClient" className="text-sm text-muted-foreground">
                Auto Convert to Client (also creates deal)
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}

// Small reusable field component
function InputField({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: any;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm text-muted-foreground">
        {label} {required && "*"}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        required={required}
      />
    </div>
  );
}
