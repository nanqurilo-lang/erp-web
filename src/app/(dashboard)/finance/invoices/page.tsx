"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  Download,
  Mail,
  FileText,
  MoreHorizontal,
  DollarSign,
  Search,
  SlidersHorizontal,
  Plus,
  Trash,
  Edit2,
  Upload,
  Copy,
  CheckCircle,
  Bell,
  FilePlus,
  Download as DownloadIcon,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";

/* --------------------------
  Types
---------------------------*/
type Company = { companyName?: string | null; companyLogoUrl?: string | null };
type Client = {
  clientId?: string;
  name?: string | null;
  profilePictureUrl?: string | null;
  companyName?: string | null;
  company?: Company | null;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  country?: string | null;
};
type Project = {
  projectName?: string | null;
  projectCode?: string | null;
  projectId?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  budget?: number | null;
  currency?: string | null;
};
type Invoice = {
  id: number;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  currency?: string | null;
  client?: Client | null;
  project?: Project | null;
  status?: string | null;
  total?: number | null;
  amount?: number | null;
  tax?: number | null;
  discount?: number | null;
  fileUrls?: string[] | null;
  paidAmount?: number | null;
  unpaidAmount?: number | null;
  adjustment?: number | null;
  amountInWords?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

/* --------------------------
  Modal & small components
---------------------------*/
function Modal({ open, title, onClose, children }: { open: boolean; title?: string; onClose: () => void; children: React.ReactNode; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center  overflow-auto px-4 py-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl bg-white rounded shadow-lg overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" onClick={onClose}><span className="sr-only">Close</span>✕</Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-white p-4">{children}</div>;
}

/* --------------------------
  Main Component
---------------------------*/
export default function InvoiceList() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("All");
  const [clientFilter, setClientFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // modal state
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openAddPaymentModal, setOpenAddPaymentModal] = useState(false);
  const [openViewPaymentsModal, setOpenViewPaymentsModal] = useState(false);
  const [openAddReceiptModal, setOpenAddReceiptModal] = useState(false);
  const [openViewReceiptsModal, setOpenViewReceiptsModal] = useState(false);

  // active invoice in context (for actions)
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // form / loading states
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [addingReceipt, setAddingReceipt] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  // forms
  const [createForm, setCreateForm] = useState<any>({
    invoiceNumber: "",
    invoiceDate: "",
    currency: "USD",
    projectId: "",
    projectName: "",
    clientId: "",
    amount: 0,
    tax: 10,
    discount: 0,
    amountInWords: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState<any>({
    invoiceDate: "",
    currency: "",
    amount: 0,
    tax: 0,
    discount: 0,
    amountInWords: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState<any>({
    projectId: "",
    clientId: "",
    currency: "",
    amount: "",
    transactionId: "",
    invoiceId: "",
    paymentGatewayId: 1,
    notes: "",
  });

  const [receiptForm, setReceiptForm] = useState<any>({
    invoiceId: "",
    issueDate: "",
    currency: "",
    sellerCompanyName: "",
    productName: "",
    priceWithOutTax: 0,
    quantity: 1,
    description: "",
  });

  // fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/invoices", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Failed to fetch invoices: ${res.status} ${t}`);
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.invoices ?? [];
      setInvoices(arr);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // derived lists (projects/clients from invoices response)
  const projectList = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach((i) => {
      const v = i.project?.projectName;
      if (v) s.add(v);
    });
    return ["Select Project", ...Array.from(s)];
  }, [invoices]);

  const clientList = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach((i) => {
      const v = i.client?.name;
      if (v) s.add(v);
    });
    return ["Select Client", ...Array.from(s)];
  }, [invoices]);

  const statusList = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach((i) => {
      const v = i.status;
      if (v) s.add(v);
    });
    return ["All", ...Array.from(s)];
  }, [invoices]);

  const safeFormatDate = (d?: string | null) => {
    if (!d) return "--";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status?: string | null) => {
    const s = (status ?? "").toString().toLowerCase();
    if (s === "paid") return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    if (s === "unpaid") return <Badge className="bg-red-100 text-red-800">Unpaid</Badge>;
    if (s.includes("credit")) return <Badge className="bg-yellow-100 text-yellow-800">Credit Note</Badge>;
    if (!s) return <Badge variant="outline">Unknown</Badge>;
    return <Badge>{status}</Badge>;
  };

  // filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // search
      if (search) {
        const s = search.toLowerCase();
        const match =
          (inv.invoiceNumber ?? "").toString().toLowerCase().includes(s) ||
          (inv.project?.projectName ?? "").toString().toLowerCase().includes(s) ||
          (inv.project?.projectCode ?? "").toString().toLowerCase().includes(s) ||
          (inv.client?.name ?? "").toString().toLowerCase().includes(s);
        if (!match) return false;
      }
      if (projectFilter !== "All" && projectFilter !== "Select Project" && (inv.project?.projectName ?? "") !== projectFilter) return false;
      if (clientFilter !== "All" && clientFilter !== "Select Client" && (inv.client?.name ?? "") !== clientFilter) return false;
      if (statusFilter !== "All" && (inv.status ?? "") !== statusFilter) return false;

      if (dateRange.start && dateRange.end) {
        if (!inv.invoiceDate) return false;
        const invDate = new Date(inv.invoiceDate);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        if (Number.isNaN(invDate.getTime())) return false;
        if (invDate < start || invDate > end) return false;
      }

      return true;
    });
  }, [invoices, search, projectFilter, clientFilter, statusFilter, dateRange]);

  /* --------------------------
    Action helpers (APIs)
  ---------------------------*/

  // Create invoice (POST /api/invoices)
  const handleCreateInvoice = async () => {
    setCreating(true);
    try {
      const body = {
        invoiceNumber: createForm.invoiceNumber || undefined,
        invoiceDate: createForm.invoiceDate,
        currency: createForm.currency,
        projectId: createForm.projectId,
        clientId: createForm.clientId,
        amount: Number(createForm.amount || 0),
        tax: Number(createForm.tax || 0),
        discount: Number(createForm.discount || 0),
        amountInWords: createForm.amountInWords,
        notes: createForm.notes,
      };
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Create failed: ${res.status} ${t}`);
      }
      await res.json();
      setOpenCreateModal(false);
      setCreateForm({
        invoiceNumber: "",
        invoiceDate: "",
        currency: "USD",
        projectId: "",
        projectName: "",
        clientId: "",
        amount: 0,
        tax: 10,
        discount: 0,
        amountInWords: "",
        notes: "",
      });
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Create invoice failed");
    } finally {
      setCreating(false);
    }
  };

  // Edit invoice (PUT /api/invoices/{invoiceNumber})
  const handleEditInvoice = async () => {
    if (!activeInvoice?.invoiceNumber) return;
    setEditing(true);
    try {
      const body = {
        invoiceDate: editForm.invoiceDate,
        currency: editForm.currency,
        amount: Number(editForm.amount || 0),
        tax: Number(editForm.tax || 0),
        discount: Number(editForm.discount || 0),
        amountInWords: editForm.amountInWords,
        notes: editForm.notes,
      };
      const res = await fetch(`/api/invoices/${activeInvoice.invoiceNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Update failed: ${res.status} ${t}`);
      }
      await res.json();
      setOpenEditModal(false);
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Update failed");
    } finally {
      setEditing(false);
    }
  };

  // Upload file (POST /api/invoices/{invoiceNumber}/files) FormData field 'file'
  const handleUploadFile = async () => {
    if (!activeInvoice?.invoiceNumber) return;
    if (!fileToUpload) {
      alert("Please choose a file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", fileToUpload);
      const res = await fetch(`/api/invoices/${activeInvoice.invoiceNumber}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
        body: fd,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Upload failed: ${res.status} ${t}`);
      }
      await res.json();
      setOpenUploadModal(false);
      setFileToUpload(null);
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Delete file -> DELETE /api/invoices/{invoiceNumber}/files?fileUrl=...
  const handleDeleteFile = async (fileUrl: string) => {
    if (!activeInvoice?.invoiceNumber) return;
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch(`/api/invoices/${activeInvoice.invoiceNumber}/files?fileUrl=${encodeURIComponent(fileUrl)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Delete file failed: ${res.status} ${t}`);
      }
      await res.json();
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Delete file failed");
    }
  };

  // Add receipt, Add payment, fetch payments, mark as paid, send reminder, delete invoice...
  // (same implementations as previous version; omitted here for brevity but kept below)
  // View payments -> fetch /api/payments/invoice/{invoiceNumber}
  const [paymentsForActive, setPaymentsForActive] = useState<any[]>([]);
  const fetchPaymentsForInvoice = async (invoiceNumber?: string | null) => {
    if (!invoiceNumber) return setPaymentsForActive([]);
    try {
      const res = await fetch(`/api/payments/invoice/${invoiceNumber}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Fetch payments failed: ${res.status} ${t}`);
      }
      const data = await res.json();
      setPaymentsForActive(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setPaymentsForActive([]);
      alert(err?.message || "Failed to load payments");
    }
  };

  const handleAddPayment = async () => {
    setAddingPayment(true);
    try {
      const fd = new FormData();
      fd.append("payment", JSON.stringify(paymentForm));
      if (paymentFile) fd.append("file", paymentFile);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
        body: fd,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Add payment failed: ${res.status} ${t}`);
      }
      await res.json();
      setOpenAddPaymentModal(false);
      setPaymentFile(null);
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Add payment failed");
    } finally {
      setAddingPayment(false);
    }
  };

  const handleAddReceipt = async () => {
    setAddingReceipt(true);
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
        body: JSON.stringify(receiptForm),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Add receipt failed: ${res.status} ${t}`);
      }
      await res.json();
      setOpenAddReceiptModal(false);
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Add receipt failed");
    } finally {
      setAddingReceipt(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!activeInvoice) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/invoices/${activeInvoice.id}/mark-paid`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Mark paid failed: ${res.status} ${t}`);
      }
      await res.json();
      await fetchInvoices();
      setOpenViewModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Mark as paid failed");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleSendPaymentReminder = async () => {
    if (!activeInvoice?.invoiceNumber) return;
    try {
      const res = await fetch(`/api/invoices/${activeInvoice.invoiceNumber}/actions/send-reminder-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Send reminder failed: ${res.status} ${t}`);
      }
      await res.json();
      alert("Reminder sent");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Send reminder failed");
    }
  };

  const handleDeleteInvoice = async (invoiceNumber?: string | null) => {
    if (!invoiceNumber) return;
    if (!confirm("Delete this invoice?")) return;
    setDeletingInvoice(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceNumber}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Delete failed: ${res.status} ${t}`);
      }
      await res.json();
      setActiveInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingInvoice(false);
    }
  };

  const handleCreateDuplicate = (inv: Invoice) => {
    setCreateForm({
      invoiceNumber: "",
      invoiceDate: inv.invoiceDate ?? "",
      currency: inv.currency ?? "USD",
      projectId: inv.project?.projectId ?? "",
      projectName: inv.project?.projectName ?? "",
      clientId: inv.client?.clientId ?? "",
      amount: inv.amount ?? inv.total ?? 0,
      tax: inv.tax ?? 0,
      discount: inv.discount ?? 0,
      amountInWords: inv.amountInWords ?? "",
      notes: inv?.notes ?? "",
    });
    setOpenCreateModal(true);
  };

  // helpful: compute subtotal, tax, discount, total for create modal preview
  const subtotal = Number(createForm.amount || 0);
  const discountAmount = createForm.discount
    ? createForm.discount > 1
      ? Number(createForm.discount) // if user enters absolute value
      : (subtotal * Number(createForm.discount || 0)) / 100
    : 0;
  const taxAmount = ((subtotal - discountAmount) * Number(createForm.tax || 0)) / 100;
  const totalAmount = subtotal - discountAmount + taxAmount;

  // helper to get project budget from invoices list (best-effort)
  const getProjectBudget = (projectName?: string | null) => {
    if (!projectName) return 0;
    const found = invoices.find((i) => i.project?.projectName === projectName && typeof i.project?.budget === "number");
    return found?.project?.budget ?? 0;
  };

  if (loading) return <div className="container mx-auto p-6"><p className="text-center text-gray-600">Loading invoices...</p></div>;
  if (error) return <div className="container mx-auto p-6"><p className="text-center text-red-500">Error: {error}</p></div>;

  return (
    <div className="container mx-auto p-6">
      {/* header - Create button top-left */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              setCreateForm({
                invoiceNumber: "",
                invoiceDate: "",
                currency: "USD",
                projectId: "",
                projectName: "",
                clientId: "",
                amount: 0,
                tax: 10,
                discount: 0,
                amountInWords: "",
                notes: "",
              });
              setOpenCreateModal(true);
            }}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Manage and track all your invoices</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* space for other actions */}
        </div>
      </div>

      {/* filters */}
      <div className="mb-4 border rounded-md bg-white px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border rounded p-2 bg-white">
            <span className="text-sm text-gray-600">Duration</span>
            <input type="date" className="text-xs border rounded px-2 py-1" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} />
            <span className="text-sm text-gray-400">to</span>
            <input type="date" className="text-xs border rounded px-2 py-1" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} />
          </div>

          <Select value={clientFilter} onValueChange={(v) => setClientFilter(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Client" /></SelectTrigger>
            <SelectContent>{clientList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>{projectList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{statusList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
            <Input placeholder="Search invoice / project / client" className="pl-8 w-[260px]" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Button variant="outline" className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
      </div>

      {/* table */}
      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Code</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-500">No invoices found</TableCell></TableRow>
            ) : (
              filteredInvoices.map((inv) => {
                const statusKey = (inv.status ?? "").toString().toUpperCase();
                return (
                  <TableRow key={inv.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{inv.project?.projectCode ?? "N/A"}</TableCell>
                    <TableCell><p className="font-medium">{inv.invoiceNumber ?? "N/A"}</p></TableCell>
                    <TableCell>{inv.project?.projectName ?? "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {inv.client?.company?.companyLogoUrl ? (
                          <Image src={inv.client.company.companyLogoUrl} alt={inv.client.company.companyName ?? "Company"} width={32} height={32} className="rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-600">{inv.client?.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{inv.client?.name ?? "N/A"}</p>
                          <p className="text-xs text-gray-500">{inv.client?.company?.companyName ?? inv.client?.companyName ?? ""}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{inv.currency ? `${inv.currency} ${Number(inv.total ?? 0).toFixed(2)}` : `$ ${Number(inv.total ?? 0).toFixed(2)}`}</TableCell>
                    <TableCell>{safeFormatDate(inv.invoiceDate)}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setOpenViewModal(true); }}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>

                          {statusKey === "UNPAID" && (
                            <>
                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setEditForm({ invoiceDate: inv.invoiceDate ?? "", currency: inv.currency ?? "USD", amount: inv.amount ?? inv.total ?? 0, tax: inv.tax ?? 0, discount: inv.discount ?? 0, amountInWords: inv.amountInWords ?? "", notes: inv.notes ?? "" }); setOpenEditModal(true); }}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); if (confirm("Mark this invoice as paid?")) { handleMarkAsPaid(); } }}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as paid
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setPaymentForm({ ...paymentForm, projectId: inv.project?.projectId ?? "", clientId: inv.client?.clientId ?? "", currency: inv.currency ?? "", amount: inv.unpaidAmount ?? inv.total ?? 0, invoiceId: inv.invoiceNumber ?? "" }); setOpenAddPaymentModal(true); }}>
                                <DollarSign className="mr-2 h-4 w-4" /> Add payment
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); fetchPaymentsForInvoice(inv.invoiceNumber ?? ""); setOpenViewPaymentsModal(true); }}>
                                <FileText className="mr-2 h-4 w-4" /> View payment
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); if (confirm("Send payment reminder?")) handleSendPaymentReminder(); }}>
                                <Bell className="mr-2 h-4 w-4" /> Payment reminder
                              </DropdownMenuItem>
                            </>
                          )}

                          {statusKey === "PAID" && (
                            <>
                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setOpenAddReceiptModal(true); }}>
                                <FilePlus className="mr-2 h-4 w-4" /> Add receipt
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); fetchPaymentsForInvoice(inv.invoiceNumber ?? ""); setOpenViewReceiptsModal(true); }}>
                                <FileText className="mr-2 h-4 w-4" /> View receipt
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setOpenUploadModal(true); }}>
                                <Upload className="mr-2 h-4 w-4" /> Upload file
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); fetchPaymentsForInvoice(inv.invoiceNumber ?? ""); setOpenViewPaymentsModal(true); }}>
                                <FileText className="mr-2 h-4 w-4" /> View payment
                              </DropdownMenuItem>
                            </>
                          )}

                          {statusKey.includes("CREDIT") && (
                            <>
                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setPaymentForm({ ...paymentForm, projectId: inv.project?.projectId ?? "", clientId: inv.client?.clientId ?? "", currency: inv.currency ?? "", amount: inv.unpaidAmount ?? inv.total ?? 0, invoiceId: inv.invoiceNumber ?? "" }); setOpenAddPaymentModal(true); }}>
                                <DollarSign className="mr-2 h-4 w-4" /> Add payment
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setActiveInvoice(inv); fetchPaymentsForInvoice(inv.invoiceNumber ?? ""); setOpenViewPaymentsModal(true); }}>
                                <FileText className="mr-2 h-4 w-4" /> View payment
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleCreateDuplicate(inv)}>
                            <Copy className="mr-2 h-4 w-4" /> Create duplicate
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => { setActiveInvoice(inv); handleDeleteInvoice(inv.invoiceNumber ?? ""); }}>
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* -------------------------
         Create Invoice Modal (NEW UI matching screenshot)
         ------------------------ */}
      <Modal open={openCreateModal} title="Create Invoice" onClose={() => setOpenCreateModal(false)}>
        <div className="space-y-6 ">
          {/* Invoice Details card */}
          <Card>
            <h4 className="text-sm font-medium mb-4">Invoice Details</h4>
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4">
                <label className="text-sm text-gray-600 block mb-1">Invoice Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">INV#</div>
                  <input value={createForm.invoiceNumber} onChange={(e) => setCreateForm((p:any) => ({ ...p, invoiceNumber: e.target.value }))} className="pl-14 border rounded w-full h-10" placeholder="INV#000" />
                </div>
              </div>

              <div className="col-span-4">
                <label className="text-sm text-gray-600 block mb-1">Invoice Date *</label>
                <input type="date" value={createForm.invoiceDate} onChange={(e) => setCreateForm((p:any) => ({ ...p, invoiceDate: e.target.value }))} className="border rounded w-full h-10" />
              </div>

              <div className="col-span-4">
                <label className="text-sm text-gray-600 block mb-1">Currency *</label>
                <select value={createForm.currency} onChange={(e) => setCreateForm((p:any) => ({ ...p, currency: e.target.value }))} className="border rounded w-full h-10">
                  <option>USD $</option>
                  <option>INR ₹</option>
                  <option>EUR €</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Project Details card */}
          <Card>
            <h4 className="text-sm font-medium mb-4">Project Details</h4>

            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4">
                <label className="text-sm text-gray-600 block mb-1">Project *</label>
                <select
                  value={createForm.projectName || "Select Project"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCreateForm((p:any) => ({ ...p, projectName: val }));
                    // try to set projectId if invoice matched
                    const found = invoices.find((inv) => inv.project?.projectName === val);
                    if (found?.project?.projectId) setCreateForm((p:any) => ({ ...p, projectId: found.project?.projectId }));
                    // if project has budget, keep it displayed (we use getProjectBudget)
                  }}
                  className="border rounded w-full h-10"
                >
                  {projectList.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="col-span-4">
                <label className="text-sm text-gray-600 block mb-1">Client *</label>
                <select value={createForm.clientId || "Select Client"} onChange={(e) => setCreateForm((p:any) => ({ ...p, clientId: e.target.value }))} className="border rounded w-full h-10">
                  {clientList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-4">
                <label className="text-sm text-gray-600 block mb-1">Project Budget *</label>
                <div className="flex items-center">
                  <div className="px-3 py-2 bg-gray-100 border rounded-l"> {createForm.currency === "INR" ? "₹" : createForm.currency?.[0] ?? "$"}</div>
                  <input readOnly value={getProjectBudget(createForm.projectName).toLocaleString()} className="border rounded-r w-full h-10 pl-3" />
                </div>
              </div>
            </div>

            {/* Amount / Tax summary row */}
            <div className="mt-4 border rounded overflow-auto flex">
              <div className="flex-1 p-3">
                <div className="text-sm text-gray-600 mb-1">Amount</div>
                <div className="flex gap-3 items-center">
                  <div className="px-3 py-2 bg-gray-50 border rounded">$</div>
                  <input type="number" value={createForm.amount} onChange={(e) => setCreateForm((p:any) => ({ ...p, amount: Number(e.target.value) }))} className="border rounded h-10 w-40 px-2" />
                </div>
              </div>

              <div className="w-56 p-3 border-l">
                <div className="text-sm text-gray-600 mb-1">Tax</div>
                <input type="number" value={createForm.tax} onChange={(e) => setCreateForm((p:any) => ({ ...p, tax: Number(e.target.value) }))} className="border rounded h-10 w-full px-2" />
              </div>

              <div className="w-40 bg-gray-100 p-3 flex flex-col items-center justify-center">
                <div className="text-sm text-gray-500">Amount</div>
                <div className="font-bold text-lg">{(totalAmount).toLocaleString()}</div>
              </div>
            </div>

            {/* Subtotal table small */}
            <div className="mt-4 flex justify-end">
              <div className="w-80 border rounded overflow-hidden">
                <div className="grid grid-cols-3 gap-2 border-b p-2">
                  <div />
                  <div className="text-sm text-gray-500 text-right">Sub Total</div>
                  <div className="text-right font-medium">{subtotal.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b p-2 items-center">
                  <div className="text-sm text-gray-500">Discount</div>
                  <div>
                    <input type="number" value={createForm.discount} onChange={(e) => setCreateForm((p:any) => ({ ...p, discount: Number(e.target.value) }))} className="border rounded px-2 h-8 w-full" />
                  </div>
                  <div className="text-right">{discountAmount.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b p-2 items-center">
                  <div className="text-sm text-gray-500">Tax</div>
                  <div className="text-sm text-gray-500">{createForm.tax} %</div>
                  <div className="text-right">{taxAmount.toFixed(2)}</div>
                </div>

                <div className="p-2 bg-gray-100 grid grid-cols-3 gap-2 items-center">
                  <div />
                  <div className="text-right font-medium">Total</div>
                  <div className="text-right font-bold">{totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>

          </Card>

          {/* Amount in words + Notes */}
          <Card>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <label className="text-sm text-gray-600 block mb-1">Amount in words</label>
                <input value={createForm.amountInWords} onChange={(e) => setCreateForm((p:any) => ({ ...p, amountInWords: e.target.value }))} className="border rounded w-full h-10 px-3" />
              </div>

              <div className="col-span-6">
                <label className="text-sm text-gray-600 block mb-1">Note/ Description for the recipient</label>
                <textarea value={createForm.notes} onChange={(e) => setCreateForm((p:any) => ({ ...p, notes: e.target.value }))} className="border rounded w-full h-28 p-3" />
              </div>
            </div>
          </Card>

          {/* bottom action buttons (centered) */}
          <div className="flex justify-center gap-4 mt-2">
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={creating}>{creating ? "Creating..." : "Save"}</Button>
          </div>

        </div>
      </Modal>

      {/* -------------------------
         View / Edit / Upload / Payments / Receipts modals
         (kept same as earlier implementation)
         ------------------------ */}

      {/* View invoice modal */}
      <Modal open={openViewModal} title={`Invoice ${activeInvoice?.invoiceNumber ?? ""}`} onClose={() => { setOpenViewModal(false); setActiveInvoice(null); }}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h4 className="text-sm font-medium mb-4">Client Details</h4>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{activeInvoice?.client?.name ?? "-"}</div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{activeInvoice?.client?.email ?? "-"}</div>
                <div className="text-sm text-gray-500">Company Name</div>
                <div className="font-medium">{activeInvoice?.client?.company?.companyName ?? activeInvoice?.client?.companyName ?? "-"}</div>
                <div className="text-sm text-gray-500">Mobile</div>
                <div className="font-medium">{activeInvoice?.client?.mobile ?? "-"}</div>
                <div className="text-sm text-gray-500">Address</div>
                <div className="font-medium">{activeInvoice?.client?.address ?? "--"}</div>
                <div className="text-sm text-gray-500">Country</div>
                <div className="font-medium">{activeInvoice?.client?.country ?? "-"}</div>
              </div>
            </Card>

            <Card>
              <h4 className="text-sm font-medium mb-4">Project Details</h4>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="text-sm text-gray-500">Project Name</div>
                <div className="font-medium">{activeInvoice?.project?.projectName ?? "-"}</div>
                <div className="text-sm text-gray-500">Project Code</div>
                <div className="font-medium">{activeInvoice?.project?.projectCode ?? "-"}</div>
                <div className="text-sm text-gray-500">Start Date</div>
                <div className="font-medium">{safeFormatDate(activeInvoice?.project?.startDate ?? activeInvoice?.createdAt)}</div>
                <div className="text-sm text-gray-500">Deadline</div>
                <div className="font-medium">{safeFormatDate(activeInvoice?.project?.deadline)}</div>
                <div className="text-sm text-gray-500">Budget</div>
                <div className="font-medium">{activeInvoice?.project?.currency ?? ""} {Number(activeInvoice?.project?.budget ?? 0).toLocaleString()}</div>
              </div>
            </Card>
          </div>

          <Card>
            <h4 className="text-sm font-medium mb-3">Invoice Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="text-sm text-gray-500">Invoice No.</div>
                <div className="text-sm text-gray-500">Invoice Date</div>
                <div className="text-sm text-gray-500">Currency</div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="text-sm text-gray-500">Tax</div>
                <div className="text-sm text-gray-500">Subtotal</div>
                <div className="text-sm text-gray-500">Discount</div>
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="text-sm text-gray-500">Files</div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="font-medium">{activeInvoice?.invoiceNumber ?? "-"}</div>
                <div className="font-medium">{safeFormatDate(activeInvoice?.invoiceDate)}</div>
                <div className="font-medium">{activeInvoice?.currency ?? "-"}</div>
                <div className="font-medium">{activeInvoice?.currency ?? ""} {Number(activeInvoice?.amount ?? activeInvoice?.total ?? 0).toLocaleString()}</div>
                <div className="font-medium">{activeInvoice?.tax != null ? `${activeInvoice.tax}%` : "-"}</div>
                <div className="font-medium">{activeInvoice?.currency ?? ""} {Number((activeInvoice?.amount ?? 0) + ((activeInvoice?.amount ?? 0) * ((activeInvoice?.tax ?? 0) / 100))).toLocaleString()}</div>
                <div className="font-medium">{activeInvoice?.currency ?? ""} {Number(activeInvoice?.discount ?? 0).toFixed(2)}</div>
                <div className="font-bold">{activeInvoice?.currency ?? ""} {Number(activeInvoice?.total ?? 0).toLocaleString()}</div>
                <div className="flex items-center gap-2">{getStatusBadge(activeInvoice?.status)} <span className="text-sm text-gray-600">{(activeInvoice?.status ?? "").toString().replace("_", " ")}</span></div>

                <div className="flex gap-4 flex-wrap">
                  {(activeInvoice?.fileUrls ?? []).length === 0 && <div className="text-sm text-gray-500">No files attached</div>}
                  {(activeInvoice?.fileUrls ?? []).map((f, idx) => {
                    const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(f ?? "");
                    return (
                      <div key={idx} className="w-40">
                        <div className="relative rounded overflow-hidden border">
                          {isImage ? (
                            <img src={f ?? ""} alt={`file-${idx}`} className="w-full h-24 object-cover" />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-gray-50 text-sm text-gray-600">FILE</div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Button variant="ghost" size="sm" onClick={() => window.open(f, "_blank")}>
                              <DownloadIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm text-gray-500">Notes</div>
              <div className="mt-2 text-sm">{activeInvoice?.notes ?? "No notes"}</div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              {(activeInvoice?.status ?? "").toString().toUpperCase() === "UNPAID" && (
                <>
                  <Button variant="ghost" onClick={() => { setOpenEditModal(true); setEditForm({ invoiceDate: activeInvoice?.invoiceDate ?? "", currency: activeInvoice?.currency ?? "USD", amount: activeInvoice?.amount ?? activeInvoice?.total ?? 0, tax: activeInvoice?.tax ?? 0, discount: activeInvoice?.discount ?? 0, amountInWords: activeInvoice?.amountInWords ?? "", notes: activeInvoice?.notes ?? "" }); }}>
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button onClick={() => { setActiveInvoice(activeInvoice); if (confirm("Mark this invoice as paid?")) handleMarkAsPaid(); }}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as paid
                  </Button>
                </>
              )}

              <Button variant="ghost" onClick={() => { setOpenUploadModal(true); }}>
                <Upload className="mr-2 h-4 w-4" /> Upload file
              </Button>

              <Button onClick={() => { setOpenViewPaymentsModal(true); fetchPaymentsForInvoice(activeInvoice?.invoiceNumber ?? ""); }}>
                <FileText className="mr-2 h-4 w-4" /> View Payment
              </Button>
            </div>
          </Card>
        </div>
      </Modal>

      {/* Edit, Upload, Add Payment, View Payments, Add Receipt, View Receipts modals below (kept same as earlier) */}
      {/* Edit Invoice Modal */}
      <Modal open={openEditModal} title={`Edit ${activeInvoice?.invoiceNumber ?? ""}`} onClose={() => setOpenEditModal(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <div className="text-sm text-gray-600">Invoice Date</div>
              <input type="date" value={editForm.invoiceDate} onChange={(e) => setEditForm((p:any) => ({ ...p, invoiceDate: e.target.value }))} className="border rounded px-2 py-1 w-full" />
            </label>
            <label>
              <div className="text-sm text-gray-600">Currency</div>
              <input value={editForm.currency} onChange={(e) => setEditForm((p:any) => ({ ...p, currency: e.target.value }))} className="border rounded px-2 py-1 w-full" />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input value={editForm.amount} onChange={(e) => setEditForm((p:any) => ({ ...p, amount: e.target.value }))} className="border rounded px-2 py-1" placeholder="Amount" />
            <input value={editForm.tax} onChange={(e) => setEditForm((p:any) => ({ ...p, tax: e.target.value }))} className="border rounded px-2 py-1" placeholder="Tax" />
            <input value={editForm.discount} onChange={(e) => setEditForm((p:any) => ({ ...p, discount: e.target.value }))} className="border rounded px-2 py-1" placeholder="Discount" />
          </div>

          <input value={editForm.amountInWords} onChange={(e) => setEditForm((p:any) => ({ ...p, amountInWords: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="Amount in words" />
          <textarea value={editForm.notes} onChange={(e) => setEditForm((p:any) => ({ ...p, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="Notes" />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpenEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditInvoice} disabled={editing}>{editing ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>

      {/* Upload File Modal */}
      <Modal open={openUploadModal} title={`Upload file for ${activeInvoice?.invoiceNumber ?? ""}`} onClose={() => { setOpenUploadModal(false); setFileToUpload(null); }}>
        <div className="space-y-3">
          <input type="file" onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpenUploadModal(false); setFileToUpload(null); }}>Cancel</Button>
            <Button onClick={handleUploadFile} disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal open={openAddPaymentModal} title={`Add payment for ${activeInvoice?.invoiceNumber ?? ""}`} onClose={() => { setOpenAddPaymentModal(false); setPaymentFile(null); }}>
        <div className="space-y-3">
          <input value={paymentForm.projectId} onChange={(e) => setPaymentForm((p:any) => ({ ...p, projectId: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="projectId" />
          <input value={paymentForm.clientId} onChange={(e) => setPaymentForm((p:any) => ({ ...p, clientId: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="clientId" />
          <input value={paymentForm.currency} onChange={(e) => setPaymentForm((p:any) => ({ ...p, currency: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="currency" />
          <input value={paymentForm.amount} onChange={(e) => setPaymentForm((p:any) => ({ ...p, amount: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="amount" />
          <input value={paymentForm.transactionId} onChange={(e) => setPaymentForm((p:any) => ({ ...p, transactionId: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="transactionId" />
          <input value={paymentForm.invoiceId} onChange={(e) => setPaymentForm((p:any) => ({ ...p, invoiceId: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="invoiceId" />
          <input type="file" onChange={(e) => setPaymentFile(e.target.files ? e.target.files[0] : null)} />
          <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm((p:any) => ({ ...p, notes: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="notes" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpenAddPaymentModal(false); setPaymentFile(null); }}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={addingPayment}>{addingPayment ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>

      {/* View Payments Modal */}
      <Modal open={openViewPaymentsModal} title={`Payments for ${activeInvoice?.invoiceNumber ?? ""}`} onClose={() => { setOpenViewPaymentsModal(false); setPaymentsForActive([]); }}>
        <div className="space-y-3">
          {paymentsForActive.length === 0 ? (
            <div className="text-sm text-gray-500">No payments found</div>
          ) : (
            paymentsForActive.map((p: any) => (
              <div key={p.id} className="border rounded p-3">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{p.currency} {Number(p.amount).toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : ""}</div>
                    <div className="text-sm">{p.note}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { if (p.receiptFileUrl) window.open(p.receiptFileUrl, "_blank"); }}>🔍</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Add Receipt Modal */}
      <Modal open={openAddReceiptModal} title={`Add Receipt for ${activeInvoice?.invoiceNumber ?? ""}`} onClose={() => setOpenAddReceiptModal(false)}>
        <div className="space-y-3">
          <input value={receiptForm.invoiceId} onChange={(e) => setReceiptForm((p:any) => ({ ...p, invoiceId: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="invoiceId" />
          <input value={receiptForm.issueDate} onChange={(e) => setReceiptForm((p:any) => ({ ...p, issueDate: e.target.value }))} className="border rounded px-2 py-1 w-full" type="date" />
          <input value={receiptForm.currency} onChange={(e) => setReceiptForm((p:any) => ({ ...p, currency: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="currency" />
          <input value={receiptForm.productName} onChange={(e) => setReceiptForm((p:any) => ({ ...p, productName: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="productName" />
          <input value={receiptForm.priceWithOutTax} onChange={(e) => setReceiptForm((p:any) => ({ ...p, priceWithOutTax: Number(e.target.value) }))} className="border rounded px-2 py-1 w-full" placeholder="priceWithOutTax" />
          <textarea value={receiptForm.description} onChange={(e) => setReceiptForm((p:any) => ({ ...p, description: e.target.value }))} className="border rounded px-2 py-1 w-full" placeholder="description" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpenAddReceiptModal(false)}>Cancel</Button>
            <Button onClick={handleAddReceipt} disabled={addingReceipt}>{addingReceipt ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>

      {/* View Receipts Modal */}
      <Modal open={openViewReceiptsModal} title={`Receipts for ${activeInvoice?.invoiceNumber ?? ""}`} onClose={() => setOpenViewReceiptsModal(false)}>
        <div className="space-y-3">
          <div className="text-sm text-gray-500">Receipts are available in receipts API. You can open the receipt in a new tab.</div>
          <div className="flex justify-end">
            <Button onClick={() => { if (activeInvoice?.invoiceNumber) router.push(`/invoice/receipt/${activeInvoice.invoiceNumber}`); }}>Open Receipts Page</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
