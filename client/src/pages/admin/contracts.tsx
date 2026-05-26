import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Plus,
  FileText,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Send,
  X,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Contract } from "@shared/schema";

const SERVICE_TYPE_OPTIONS = [
  { id: "pressure_washing", label: "Pressure Washing" },
  { id: "driveway_cleaning", label: "Driveway Cleaning" },
  { id: "roof_washing", label: "Roof Washing" },
  { id: "house_washing", label: "House / Siding Washing" },
  { id: "gutter_cleaning", label: "Gutter Cleaning" },
  { id: "deck_fence_cleaning", label: "Deck & Fence Cleaning" },
  { id: "paver_restoration", label: "Paver Restoration" },
  { id: "fleet_washing", label: "Fleet / Vehicle Washing" },
  { id: "construction_cleanup", label: "New Construction Cleanup" },
  { id: "heavy_equipment_washing", label: "Heavy Equipment Washing" },
  { id: "industrial_cleaning", label: "Industrial / Warehouse Cleaning" },
  { id: "parking_garage", label: "Parking Garage / Lot" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  signed: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
};

const contractFormSchema = z.object({
  clientName: z.string().min(1, "Client name required"),
  clientEmail: z.string().email("Valid email required"),
  clientPhone: z.string().min(7, "Phone required"),
  clientCompany: z.string().optional(),
  serviceAddress: z.string().min(1, "Service address required"),
  serviceTypes: z.array(z.string()).min(1, "Select at least one service"),
  contractType: z.enum(["one_time", "recurring"]),
  frequency: z.enum(["one_time", "weekly", "biweekly", "monthly", "quarterly"]),
  rate: z.coerce.number().min(1, "Rate required"),
  rateUnit: z.enum(["per_visit", "per_month", "per_sqft", "per_hour"]),
  paymentDue: z.enum(["upon_completion", "net_7", "net_14", "net_30"]),
  lateFeePercent: z.coerce.number().min(0).max(50).default(5),
  cancellationNoticeDays: z.coerce.number().min(1).max(30).default(2),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().optional(),
  status: z.enum(["draft", "sent", "signed", "active", "completed", "cancelled"]).default("draft"),
  notes: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

async function apiRequest(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

function generateContractText(c: ContractFormValues & { contractNumber?: string }): string {
  const today = format(new Date(), "MMMM d, yyyy");
  const startFmt = c.startDate ? format(new Date(c.startDate), "MMMM d, yyyy") : "___________";
  const endFmt = c.endDate ? format(new Date(c.endDate), "MMMM d, yyyy") : "ongoing";
  const services = c.serviceTypes
    .map((s) => SERVICE_TYPE_OPTIONS.find((o) => o.id === s)?.label ?? s)
    .join(", ");
  const rateLabel = {
    per_visit: "per visit",
    per_month: "per month",
    per_sqft: "per sq ft",
    per_hour: "per hour",
  }[c.rateUnit] ?? c.rateUnit;
  const paymentLabel = {
    upon_completion: "upon completion of each service",
    net_7: "within 7 days of invoice",
    net_14: "within 14 days of invoice",
    net_30: "within 30 days of invoice",
  }[c.paymentDue] ?? c.paymentDue;
  const freqLabel = {
    one_time: "one-time service",
    weekly: "weekly",
    biweekly: "bi-weekly",
    monthly: "monthly",
    quarterly: "quarterly",
  }[c.frequency] ?? c.frequency;

  return `GOOD DAY SERVICES — PRESSURE WASHING SERVICE AGREEMENT
Contract No.: ${c.contractNumber ?? "DRAFT"}
Date: ${today}

This Pressure Washing Service Agreement ("Agreement") is entered into between:

Contractor: Good Day Services ("GDS")
Client: ${c.clientName}${c.clientCompany ? ` / ${c.clientCompany}` : ""}
Service Address: ${c.serviceAddress}
Client Email: ${c.clientEmail}  |  Phone: ${c.clientPhone}

1. SCOPE OF SERVICES
GDS agrees to perform the following services: ${services}
Schedule: ${freqLabel.charAt(0).toUpperCase() + freqLabel.slice(1)}
Term: ${startFmt} through ${endFmt}

2. PAYMENT TERMS
Rate: $${c.rate} ${rateLabel}
Payment Due: ${paymentLabel.charAt(0).toUpperCase() + paymentLabel.slice(1)}
Late Fee: ${c.lateFeePercent}% added per month on outstanding balances

3. CANCELLATION POLICY
Client must provide at least ${c.cancellationNoticeDays} business day(s) notice to cancel or reschedule. Cancellations with less notice will be charged the full service fee for that visit. A Lock-Out Fee equal to the full service price applies if GDS cannot access the premises upon arrival.

4. CLIENT RESPONSIBILITIES
- Provide safe, clear, and unobstructed access to all service areas.
- Secure all pets and remove vehicles from service areas prior to arrival.
- Inform GDS of any pre-existing damage, fragile items, or hazardous conditions.
- Secure all valuables. GDS shall not be liable for unsecured items.
- Disarm alarm systems and ensure water supply is accessible.

5. LIMITATION OF LIABILITY
GDS is not liable for pre-existing damage. Any alleged damage caused by GDS must be reported in writing within 24 hours of service completion. GDS's total liability is limited to the lesser of (a) the cost of repair, (b) the item's depreciated value, or (c) the total fees paid by Client in the preceding 30 days.

6. INDEMNIFICATION
Client agrees to defend, indemnify, and hold harmless Good Day Services and its owners, employees, and agents from any claims, liabilities, losses, or expenses (including attorney's fees) arising from Client's breach of this Agreement or any hazardous conditions at the Premises.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Tennessee.

8. TERMINATION
Either party may terminate this Agreement with ${c.cancellationNoticeDays} business days' written notice (email acceptable).
${c.notes ? `\n9. ADDITIONAL NOTES\n${c.notes}` : ""}

SIGNATURES

Good Day Services:
Signature: _________________________  Date: _______________
Printed Name: Blake McConnell
Title: Owner

Client:
Signature: _________________________  Date: _______________
Printed Name: ${c.clientName}

---
DISCLAIMER: This template is a starting point and does not constitute legal advice. Have a qualified attorney review before use.`;
}

export default function AdminContracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: () => apiRequest("GET", "/api/contracts"),
  });

  const createMutation = useMutation({
    mutationFn: (data: ContractFormValues) => apiRequest("POST", "/api/contracts", {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setShowForm(false);
      toast({ title: "Contract created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractFormValues> }) =>
      apiRequest("PATCH", `/api/contracts/${id}`, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setEditingContract(null);
      setShowForm(false);
      toast({ title: "Contract updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/contracts/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/contracts"] }),
  });

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      contractType: "one_time",
      frequency: "one_time",
      rateUnit: "per_visit",
      paymentDue: "upon_completion",
      lateFeePercent: 5,
      cancellationNoticeDays: 2,
      serviceTypes: [],
      status: "draft",
    },
  });

  function openCreate() {
    form.reset({
      contractType: "one_time",
      frequency: "one_time",
      rateUnit: "per_visit",
      paymentDue: "upon_completion",
      lateFeePercent: 5,
      cancellationNoticeDays: 2,
      serviceTypes: [],
      status: "draft",
    });
    setEditingContract(null);
    setShowForm(true);
  }

  function openEdit(c: Contract) {
    form.reset({
      clientName: c.clientName,
      clientEmail: c.clientEmail,
      clientPhone: c.clientPhone,
      clientCompany: c.clientCompany ?? "",
      serviceAddress: c.serviceAddress,
      serviceTypes: (c.serviceTypes as string[]) ?? [],
      contractType: c.contractType as any,
      frequency: c.frequency as any,
      rate: Number(c.rate),
      rateUnit: c.rateUnit as any,
      paymentDue: c.paymentDue as any,
      lateFeePercent: c.lateFeePercent,
      cancellationNoticeDays: c.cancellationNoticeDays,
      startDate: c.startDate ? format(new Date(c.startDate), "yyyy-MM-dd") : "",
      endDate: c.endDate ? format(new Date(c.endDate), "yyyy-MM-dd") : "",
      status: c.status as any,
      notes: c.notes ?? "",
    });
    setEditingContract(c);
    setShowForm(true);
  }

  function onSubmit(values: ContractFormValues) {
    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  function printContract(c: Contract) {
    const text = generateContractText({
      clientName: c.clientName,
      clientEmail: c.clientEmail,
      clientPhone: c.clientPhone,
      clientCompany: c.clientCompany ?? undefined,
      serviceAddress: c.serviceAddress,
      serviceTypes: c.serviceTypes as string[],
      contractType: c.contractType as any,
      frequency: c.frequency as any,
      rate: Number(c.rate),
      rateUnit: c.rateUnit as any,
      paymentDue: c.paymentDue as any,
      lateFeePercent: c.lateFeePercent,
      cancellationNoticeDays: c.cancellationNoticeDays,
      startDate: format(new Date(c.startDate), "yyyy-MM-dd"),
      endDate: c.endDate ? format(new Date(c.endDate), "yyyy-MM-dd") : undefined,
      notes: c.notes ?? undefined,
      contractNumber: c.contractNumber,
    });

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Contract ${c.contractNumber}</title>
      <style>body{font-family:monospace;white-space:pre-wrap;padding:40px;max-width:800px;margin:0 auto;font-size:13px}</style>
      </head><body>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body></html>`);
    win.document.close();
    win.print();
  }

  const filtered = statusFilter === "all" ? contracts : contracts.filter((c) => c.status === statusFilter);

  const serviceTypeValues = form.watch("serviceTypes") ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commercial Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">Pressure washing service agreements for commercial clients</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Contract
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "draft", "sent", "signed", "active", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span className="ml-1 text-xs opacity-75">
                ({contracts.filter((c) => c.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading contracts...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No contracts found.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Create your first contract
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.contractNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{c.clientName}</div>
                    {c.clientCompany && <div className="text-xs text-gray-500">{c.clientCompany}</div>}
                    <div className="text-xs text-gray-400">{c.clientEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(c.serviceTypes as string[]).slice(0, 2).map((s) => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          {SERVICE_TYPE_OPTIONS.find((o) => o.id === s)?.label ?? s}
                        </span>
                      ))}
                      {(c.serviceTypes as string[]).length > 2 && (
                        <span className="text-xs text-gray-400">+{(c.serviceTypes as string[]).length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    ${Number(c.rate).toLocaleString()}{" "}
                    <span className="text-xs text-gray-500">{c.rateUnit.replace("_", " ")}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(c.startDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? ""}`}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="View" onClick={() => setViewingContract(c)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Print" onClick={() => printContract(c)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                      {c.status === "draft" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Mark Sent"
                          onClick={() => statusMutation.mutate({ id: c.id, status: "sent" })}
                        >
                          <Send className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      {c.status === "sent" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Mark Signed"
                          onClick={() => statusMutation.mutate({ id: c.id, status: "signed" })}
                        >
                          <CheckCircle className="w-4 h-4 text-purple-500" />
                        </Button>
                      )}
                      {c.status === "signed" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Mark Active"
                          onClick={() => statusMutation.mutate({ id: c.id, status: "active" })}
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete"
                        onClick={() => {
                          if (confirm("Delete this contract?")) deleteMutation.mutate(c.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingContract(null); }}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContract ? "Edit Contract" : "New Commercial Contract"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Client Name *</Label>
                <Input {...form.register("clientName")} placeholder="John Smith" />
                {form.formState.errors.clientName && (
                  <p className="text-xs text-red-500">{form.formState.errors.clientName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Company (optional)</Label>
                <Input {...form.register("clientCompany")} placeholder="ACME Corp" />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input {...form.register("clientEmail")} type="email" placeholder="john@example.com" />
                {form.formState.errors.clientEmail && (
                  <p className="text-xs text-red-500">{form.formState.errors.clientEmail.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input {...form.register("clientPhone")} placeholder="(615) 555-0100" />
                {form.formState.errors.clientPhone && (
                  <p className="text-xs text-red-500">{form.formState.errors.clientPhone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Service Address *</Label>
              <Input {...form.register("serviceAddress")} placeholder="123 Main St, Murfreesboro, TN 37130" />
              {form.formState.errors.serviceAddress && (
                <p className="text-xs text-red-500">{form.formState.errors.serviceAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Services *</Label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPE_OPTIONS.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Checkbox
                      id={opt.id}
                      checked={serviceTypeValues.includes(opt.id)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("serviceTypes") ?? [];
                        form.setValue(
                          "serviceTypes",
                          checked ? [...current, opt.id] : current.filter((s) => s !== opt.id),
                          { shouldValidate: true }
                        );
                      }}
                    />
                    <label htmlFor={opt.id} className="text-sm cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
              {form.formState.errors.serviceTypes && (
                <p className="text-xs text-red-500">{form.formState.errors.serviceTypes.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Contract Type</Label>
                <Select
                  value={form.watch("contractType")}
                  onValueChange={(v) => form.setValue("contractType", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Frequency</Label>
                <Select
                  value={form.watch("frequency")}
                  onValueChange={(v) => form.setValue("frequency", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Rate ($) *</Label>
                <Input {...form.register("rate")} type="number" min="0" step="0.01" placeholder="350" />
                {form.formState.errors.rate && (
                  <p className="text-xs text-red-500">{form.formState.errors.rate.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Rate Unit</Label>
                <Select
                  value={form.watch("rateUnit")}
                  onValueChange={(v) => form.setValue("rateUnit", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_visit">Per Visit</SelectItem>
                    <SelectItem value="per_month">Per Month</SelectItem>
                    <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                    <SelectItem value="per_hour">Per Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Payment Due</Label>
                <Select
                  value={form.watch("paymentDue")}
                  onValueChange={(v) => form.setValue("paymentDue", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upon_completion">Upon Completion</SelectItem>
                    <SelectItem value="net_7">Net 7</SelectItem>
                    <SelectItem value="net_14">Net 14</SelectItem>
                    <SelectItem value="net_30">Net 30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Late Fee (%)</Label>
                <Input {...form.register("lateFeePercent")} type="number" min="0" max="50" />
              </div>
              <div className="space-y-1">
                <Label>Cancellation Notice (days)</Label>
                <Input {...form.register("cancellationNoticeDays")} type="number" min="1" max="30" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Start Date *</Label>
                <Input {...form.register("startDate")} type="date" />
                {form.formState.errors.startDate && (
                  <p className="text-xs text-red-500">{form.formState.errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>End Date (optional)</Label>
                <Input {...form.register("endDate")} type="date" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} placeholder="Special instructions, scope exclusions, etc." rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingContract(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingContract ? "Save Changes" : "Create Contract"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Contract Dialog */}
      {viewingContract && (
        <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Contract {viewingContract.contractNumber}</span>
                <Button size="sm" variant="outline" onClick={() => printContract(viewingContract)}>
                  <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
              </DialogTitle>
            </DialogHeader>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded border overflow-x-auto">
              {generateContractText({
                clientName: viewingContract.clientName,
                clientEmail: viewingContract.clientEmail,
                clientPhone: viewingContract.clientPhone,
                clientCompany: viewingContract.clientCompany ?? undefined,
                serviceAddress: viewingContract.serviceAddress,
                serviceTypes: viewingContract.serviceTypes as string[],
                contractType: viewingContract.contractType as any,
                frequency: viewingContract.frequency as any,
                rate: Number(viewingContract.rate),
                rateUnit: viewingContract.rateUnit as any,
                paymentDue: viewingContract.paymentDue as any,
                lateFeePercent: viewingContract.lateFeePercent,
                cancellationNoticeDays: viewingContract.cancellationNoticeDays,
                startDate: format(new Date(viewingContract.startDate), "yyyy-MM-dd"),
                endDate: viewingContract.endDate ? format(new Date(viewingContract.endDate), "yyyy-MM-dd") : undefined,
                notes: viewingContract.notes ?? undefined,
                contractNumber: viewingContract.contractNumber,
              })}
            </pre>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingContract(null)}>Close</Button>
              <Button onClick={() => { setViewingContract(null); openEdit(viewingContract); }}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
