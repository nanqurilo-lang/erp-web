"use client"

import type React from "react"

import { useState } from "react"

export default function NewClientPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [country, setCountry] = useState("")
  const [gender, setGender] = useState("")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [language, setLanguage] = useState("")
  const [receiveEmail, setReceiveEmail] = useState(false)
  const [skype, setSkype] = useState("")
  const [linkedIn, setLinkedIn] = useState("")
  const [twitter, setTwitter] = useState("")
  const [facebook, setFacebook] = useState("")

  // Company fields
  const [companyName, setCompanyName] = useState("")
  const [website, setWebsite] = useState("")
  const [officePhone, setOfficePhone] = useState("")
  const [taxName, setTaxName] = useState("")
  const [gstVatNo, setGstVatNo] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")

  // Files
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)

  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const clientData = {
      name,
      email,
      mobile,
      country,
      gender,
      category,
      subCategory,
      language,
      receiveEmail,
      skype,
      linkedIn,
      twitter,
      facebook,
      company: {
        companyName,
        website,
        officePhone,
        taxName,
        gstVatNo,
        address,
        city,
        state,
        postalCode,
        shippingAddress,
      },
    }

    const formData = new FormData()
    formData.append("client", JSON.stringify(clientData))
    if (profilePictureFile) formData.append("profilePicture", profilePictureFile)
    if (companyLogoFile) formData.append("companyLogo", companyLogoFile)

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Request failed")

      setMessage("✅ Client created successfully!")
      console.log("✅ Client Response:", data)
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-2xl font-semibold mb-6 text-center">Create New Client</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Sub Category"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Skype"
              value={skype}
              onChange={(e) => setSkype(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="LinkedIn"
              value={linkedIn}
              onChange={(e) => setLinkedIn(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Facebook"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <label className="flex items-center gap-2 mt-4">
            <input type="checkbox" checked={receiveEmail} onChange={(e) => setReceiveEmail(e.target.checked)} />
            <span>Receive Email Notifications</span>
          </label>
        </div>

        {/* Company Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Company Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="url"
              placeholder="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Office Phone"
              value={officePhone}
              onChange={(e) => setOfficePhone(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Tax Name (e.g., GST)"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="GST/VAT Number"
              value={gstVatNo}
              onChange={(e) => setGstVatNo(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Shipping Address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* File Uploads */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Uploads</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePictureFile(e.target.files?.[0] || null)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCompanyLogoFile(e.target.files?.[0] || null)}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Create Client
        </button>
      </form>

      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  )
}
