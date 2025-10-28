"use client"

import type React from "react"
import { useState } from "react"
import { Camera, Building2, User, Mail, Phone, Globe, AlertCircle, CheckCircle, X, ArrowRight } from "lucide-react"

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

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>("")
  const [logoPreview, setLogoPreview] = useState<string>("")

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format"
    if (!mobile.trim()) newErrors.mobile = "Mobile is required"
    if (!country.trim()) newErrors.country = "Country is required"
    if (!companyName.trim()) newErrors.companyName = "Company name is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePictureFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setProfilePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCompanyLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const clearMessage = () => {
    setMessage("")
    setMessageType("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessage()

    if (!validateForm()) {
      setMessage("Please fix the errors before submitting")
      setMessageType("error")
      return
    }

    setIsSubmitting(true)

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
      const token = sessionStorage.getItem("accessToken") || ""
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || "Request failed")

      setMessage("Client created successfully!")
      setMessageType("success")

      setTimeout(() => {
        resetForm()
      }, 2000)
    } catch (err: any) {
      setMessage(err.message || "Failed to create client")
      setMessageType("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setMobile("")
    setCountry("")
    setGender("")
    setCategory("")
    setSubCategory("")
    setLanguage("")
    setReceiveEmail(false)
    setSkype("")
    setLinkedIn("")
    setTwitter("")
    setFacebook("")
    setCompanyName("")
    setWebsite("")
    setOfficePhone("")
    setTaxName("")
    setGstVatNo("")
    setAddress("")
    setCity("")
    setState("")
    setPostalCode("")
    setShippingAddress("")
    setProfilePictureFile(null)
    setCompanyLogoFile(null)
    setProfilePreview("")
    setLogoPreview("")
    setErrors({})
    clearMessage()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Create New Client</h1>
              <p className="text-slate-600 mt-1">Add a new client to your database with complete information</p>
            </div>
          </div>
        </div>

        {/* Alert Message */}
        {message && (
          <div
            className={`mb-8 p-4 rounded-xl flex items-start gap-3 border backdrop-blur-sm transition-all ${
              messageType === "success" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <p
              className={`flex-1 text-sm font-medium ${messageType === "success" ? "text-emerald-800" : "text-red-800"}`}
            >
              {message}
            </p>
            <button onClick={clearMessage} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Basic details about the client</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors({ ...errors, name: "" })
                    }}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                      errors.name
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.name && <p className="text-red-600 text-xs mt-2 font-medium">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors({ ...errors, email: "" })
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                        errors.email
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-xs mt-2 font-medium">{errors.email}</p>}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value)
                        if (errors.mobile) setErrors({ ...errors, mobile: "" })
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                        errors.mobile
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {errors.mobile && <p className="text-red-600 text-xs mt-2 font-medium">{errors.mobile}</p>}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="United States"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value)
                        if (errors.country) setErrors({ ...errors, country: "" })
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                        errors.country
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {errors.country && <p className="text-red-600 text-xs mt-2 font-medium">{errors.country}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Language</label>
                  <input
                    type="text"
                    placeholder="English"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Category</label>
                  <input
                    type="text"
                    placeholder="Premium"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Sub Category</label>
                  <input
                    type="text"
                    placeholder="VIP"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Skype */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Skype</label>
                  <input
                    type="text"
                    placeholder="john.skype"
                    value={skype}
                    onChange={(e) => setSkype(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">LinkedIn</label>
                  <input
                    type="text"
                    placeholder="linkedin.com/in/johndoe"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Twitter</label>
                  <input
                    type="text"
                    placeholder="@johndoe"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Facebook</label>
                  <input
                    type="text"
                    placeholder="facebook.com/johndoe"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Notifications Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-lg hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={receiveEmail}
                  onChange={(e) => setReceiveEmail(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-2 border-slate-300 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                />
                <span className="text-slate-700 font-medium group-hover:text-slate-900 transition">
                  Receive Email Notifications
                </span>
              </label>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Company Details</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Information about the client's company</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Corporation"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value)
                      if (errors.companyName) setErrors({ ...errors, companyName: "" })
                    }}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                      errors.companyName
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.companyName && <p className="text-red-600 text-xs mt-2 font-medium">{errors.companyName}</p>}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Website</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Office Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Office Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={officePhone}
                    onChange={(e) => setOfficePhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Tax Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Tax Name</label>
                  <input
                    type="text"
                    placeholder="GST, VAT, etc."
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* GST/VAT Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">GST/VAT Number</label>
                  <input
                    type="text"
                    placeholder="123456789"
                    value={gstVatNo}
                    onChange={(e) => setGstVatNo(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                  <input
                    type="text"
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">State</label>
                  <input
                    type="text"
                    placeholder="NY"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Postal Code</label>
                  <input
                    type="text"
                    placeholder="10001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Address</label>
                  <input
                    type="text"
                    placeholder="123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>

                {/* Shipping Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Shipping Address</label>
                  <input
                    type="text"
                    placeholder="456 Shipping Lane"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Uploads Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Media & Uploads</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Profile picture and company logo</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">Profile Picture</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="profile-upload"
                    />
                    <label htmlFor="profile-upload" className="cursor-pointer block">
                      {profilePreview ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={profilePreview || "/placeholder.svg"}
                            alt="Profile"
                            className="w-32 h-32 object-cover rounded-full mx-auto mb-4 ring-4 ring-blue-100"
                          />
                          <p className="text-sm text-slate-600 font-medium">Click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="p-3 bg-slate-100 rounded-lg mb-3 group-hover:bg-blue-100 transition">
                            <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition" />
                          </div>
                          <p className="text-sm font-medium text-slate-700">Click to upload</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Company Logo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">Company Logo</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCompanyLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer block">
                      {logoPreview ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={logoPreview || "/placeholder.svg"}
                            alt="Logo"
                            className="w-32 h-32 object-contain mx-auto mb-4"
                          />
                          <p className="text-sm text-slate-600 font-medium">Click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="p-3 bg-slate-100 rounded-lg mb-3 group-hover:bg-blue-100 transition">
                            <Building2 className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition" />
                          </div>
                          <p className="text-sm font-medium text-slate-700">Click to upload</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Client
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-8 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold hover:bg-slate-200 transition-all border border-slate-200"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
