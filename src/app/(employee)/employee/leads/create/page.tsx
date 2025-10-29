"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

type LeadFormData = {
  name: string;
  email: string;
  clientCategory: string;
  leadSource: string;
  leadOwner: string;
  addedBy: string;
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
};

export default function LeadCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    clientCategory: "",
    leadSource: "",
    leadOwner: "",
    addedBy: "",
    autoConvertToClient: false,
    companyName: "",
    officialWebsite: "",
    mobileNumber: "",
    officePhone: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    companyAddress: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fetch logged-in employee profile and auto-fill IDs
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);

        const data = await res.json();
        console.log("Profile API Response:", data);

        const employeeId = data.employeeId;

        if (employeeId) {
          setFormData((prev) => ({
            ...prev,
            leadOwner: employeeId,
            addedBy: employeeId,
          }));
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError("Failed to load employee profile. Please try again.");
      }
    };

    fetchProfile();
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

    if (!formData.name || !formData.email || !formData.companyName) {
      setError("Name, email, and company name are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token found. Please log in.");

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
          errorData.details || errorData.error || "Failed to create lead."
        );
      }

      await response.json();
      router.push(`/employee/leads/get`);
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
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Create New Lead
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter details to create a new lead.
            </p>
          </div>
        </div>
      </header>

      <Card className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="grid gap-6">
          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          {/* Lead Information */}
          <div>
            <h2 className="text-lg font-semibold">Lead Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <InputField
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <InputField
                label="Client Category"
                name="clientCategory"
                value={formData.clientCategory}
                onChange={handleInputChange}
              />
              <InputField
                label="Lead Source"
                name="leadSource"
                value={formData.leadSource}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company Name *"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
              <InputField
                label="Official Website"
                name="officialWebsite"
                value={formData.officialWebsite}
                onChange={handleInputChange}
              />
              <InputField
                label="Mobile Number"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
              />
              <InputField
                label="Office Phone"
                name="officePhone"
                value={formData.officePhone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h2 className="text-lg font-semibold">Address Information</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
              <InputField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              />
              <InputField
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
              />
              <InputField
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              />
              <InputField
                label="Company Address"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Hidden auto-filled fields */}
          <input type="hidden" name="leadOwner" value={formData.leadOwner} />
          <input type="hidden" name="addedBy" value={formData.addedBy} />

          {/* Auto Convert Option */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="autoConvertToClient"
              checked={formData.autoConvertToClient}
              onCheckedChange={handleCheckboxChange}
            />
            <label
              htmlFor="autoConvertToClient"
              className="text-sm text-muted-foreground"
            >
              Auto Convert to Client
            </label>
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

// ✅ Helper Component
function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: any) {
  return (
    <div>
      <label htmlFor={name} className="text-sm text-muted-foreground">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        aria-required={required}
      />
    </div>
  );
}
