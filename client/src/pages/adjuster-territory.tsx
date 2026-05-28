import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, MapPin, FileText, BarChart3, Plus, Edit, Trash2,
  AlertTriangle, UserCheck, Shield,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Adjuster, Territory, AdjusterClaim } from "@shared/schema";

// ─── TN Counties ─────────────────────────────────────────────────────────────

const TN_COUNTIES = [
  "Anderson","Bedford","Benton","Bledsoe","Blount","Bradley","Campbell",
  "Cannon","Carroll","Carter","Cheatham","Chester","Claiborne","Clay",
  "Cocke","Coffee","Crockett","Cumberland","Davidson","Decatur","DeKalb",
  "Dickson","Dyer","Fayette","Fentress","Franklin","Gibson","Giles",
  "Grainger","Greene","Grundy","Hamblen","Hamilton","Hancock","Hardeman",
  "Hardin","Hawkins","Haywood","Henderson","Henry","Hickman","Houston",
  "Humphreys","Jackson","Jefferson","Johnson","Knox","Lake","Lauderdale",
  "Lawrence","Lewis","Lincoln","Loudon","McMinn","McNairy","Macon",
  "Madison","Marion","Marshall","Maury","Meigs","Monroe","Montgomery",
  "Moore","Morgan","Obion","Overton","Perry","Pickett","Polk","Putnam",
  "Rhea","Roane","Robertson","Rutherford","Scott","Sequatchie","Sevier",
  "Shelby","Smith","Stewart","Sullivan","Sumner","Tipton","Trousdale",
  "Unicoi","Union","Van Buren","Warren","Washington","Wayne","Weakley",
  "White","Williamson","Wilson",
] as const;

// ─── Extended API types ───────────────────────────────────────────────────────

type AdjusterWithRelations = Adjuster & { claimCount: number; territory: Territory | null };
type TerritoryWithAdjuster = Territory & { adjuster: Adjuster | null };
type ClaimWithRelations = AdjusterClaim & { adjuster: Adjuster | null; territory: Territory | null };
type AdjusterStat = {
  adjusterId: string;
  adjusterName: string;
  territory: string | null;
  openClaims: number;
  maxCaseload: number;
  status: string;
};

// ─── Color helpers ────────────────────────────────────────────────────────────

function adjStatusClass(status: string) {
  if (status === "active") return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  if (status === "on_leave") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
}

function claimStatusClass(status: string) {
  const map: Record<string, string> = {
    unassigned: "bg-red-100 text-red-700",
    assigned: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    inspection_scheduled: "bg-cyan-100 text-cyan-700",
    pending_estimate: "bg-orange-100 text-orange-700",
    pending_approval: "bg-yellow-100 text-yellow-700",
    settled: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function priorityClass(priority: string) {
  const map: Record<string, string> = {
    urgent: "bg-red-600 text-white",
    high: "bg-orange-100 text-orange-700",
    standard: "bg-blue-100 text-blue-700",
    low: "bg-gray-100 text-gray-600",
  };
  return map[priority] ?? "bg-gray-100 text-gray-600";
}

function priorityBorderClass(priority: string) {
  if (priority === "urgent") return "border-l-4 border-l-red-500";
  if (priority === "high") return "border-l-4 border-l-orange-400";
  return "";
}

// ─── Form Schemas ─────────────────────────────────────────────────────────────

const adjusterFormSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone required"),
  licenseNumber: z.string().min(1, "License number required"),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
  certifications: z.string().default(""),
  maxCaseload: z.coerce.number().min(1).max(200).default(30),
  notes: z.string().optional(),
});
type AdjusterFormData = z.infer<typeof adjusterFormSchema>;

const territoryFormSchema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().min(1, "Required"),
  counties: z.array(z.string()).min(1, "Select at least one county"),
  zipCodes: z.string().default(""),
  adjusterId: z.string().optional(),
  priority: z.enum(["high", "standard", "low"]).default("standard"),
  notes: z.string().optional(),
});
type TerritoryFormData = z.infer<typeof territoryFormSchema>;

const claimFormSchema = z.object({
  claimNumber: z.string().min(1, "Required"),
  policyHolderName: z.string().min(1, "Required"),
  policyHolderPhone: z.string().min(7, "Required"),
  incidentDate: z.string().min(1, "Required"),
  incidentAddress: z.string().min(1, "Required"),
  county: z.string().min(1, "Required"),
  zipCode: z.string().optional(),
  vehicleMake: z.string().min(1, "Required"),
  vehicleModel: z.string().min(1, "Required"),
  vehicleYear: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  vehicleVin: z.string().optional(),
  damageType: z.enum(["collision","comprehensive","liability","uninsured_motorist","other"]),
  estimatedDamage: z.string().optional(),
  status: z.enum(["unassigned","assigned","in_progress","inspection_scheduled","pending_estimate","pending_approval","settled","closed"]).default("unassigned"),
  priority: z.enum(["urgent","high","standard","low"]).default("standard"),
  adjusterId: z.string().optional(),
  territoryId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});
type ClaimFormData = z.infer<typeof claimFormSchema>;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdjusterTerritory() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [adjusterDialog, setAdjusterDialog] = useState(false);
  const [territoryDialog, setTerritoryDialog] = useState(false);
  const [claimDialog, setClaimDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [countySearch, setCountySearch] = useState("");

  const [editingAdjuster, setEditingAdjuster] = useState<AdjusterWithRelations | null>(null);
  const [editingTerritory, setEditingTerritory] = useState<TerritoryWithAdjuster | null>(null);
  const [editingClaim, setEditingClaim] = useState<ClaimWithRelations | null>(null);
  const [assigningClaim, setAssigningClaim] = useState<ClaimWithRelations | null>(null);
  const [assignAdjusterId, setAssignAdjusterId] = useState("");

  const [claimFilters, setClaimFilters] = useState({ status: "", adjusterId: "", priority: "" });

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: adjusters = [] } = useQuery<AdjusterWithRelations[]>({
    queryKey: ["/api/adjusters"],
    queryFn: () => fetch("/api/adjusters", { credentials: "include" }).then(r => r.json()),
  });

  const { data: territories = [] } = useQuery<TerritoryWithAdjuster[]>({
    queryKey: ["/api/territories"],
    queryFn: () => fetch("/api/territories", { credentials: "include" }).then(r => r.json()),
  });

  const { data: claims = [] } = useQuery<ClaimWithRelations[]>({
    queryKey: ["/api/adjuster-claims", claimFilters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (claimFilters.status) p.set("status", claimFilters.status);
      if (claimFilters.adjusterId) p.set("adjusterId", claimFilters.adjusterId);
      if (claimFilters.priority) p.set("priority", claimFilters.priority);
      return fetch(`/api/adjuster-claims?${p}`, { credentials: "include" }).then(r => r.json());
    },
  });

  const { data: stats = [] } = useQuery<AdjusterStat[]>({
    queryKey: ["/api/adjuster-stats"],
    queryFn: () => fetch("/api/adjuster-stats", { credentials: "include" }).then(r => r.json()),
  });

  // ─── Adjuster mutations ─────────────────────────────────────────────────────

  const adjusterForm = useForm<AdjusterFormData>({ resolver: zodResolver(adjusterFormSchema) });

  const adjusterMutation = useMutation({
    mutationFn: async (data: AdjusterFormData) => {
      const payload = {
        ...data,
        certifications: data.certifications
          ? data.certifications.split(",").map(s => s.trim()).filter(Boolean)
          : [],
      };
      if (editingAdjuster) {
        return apiRequest("PATCH", `/api/adjusters/${editingAdjuster.id}`, payload).then(r => r.json());
      }
      return apiRequest("POST", "/api/adjusters", payload).then(r => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/adjusters"] });
      qc.invalidateQueries({ queryKey: ["/api/adjuster-stats"] });
      setAdjusterDialog(false);
      setEditingAdjuster(null);
      toast({ title: editingAdjuster ? "Adjuster updated" : "Adjuster created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteAdjusterMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/adjusters/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/adjusters"] });
      qc.invalidateQueries({ queryKey: ["/api/adjuster-stats"] });
      toast({ title: "Adjuster removed" });
    },
  });

  // ─── Territory mutations ────────────────────────────────────────────────────

  const territoryForm = useForm<TerritoryFormData>({
    resolver: zodResolver(territoryFormSchema),
    defaultValues: { counties: [], zipCodes: "", priority: "standard" },
  });

  const territoryMutation = useMutation({
    mutationFn: async (data: TerritoryFormData) => {
      const payload = {
        ...data,
        zipCodes: data.zipCodes ? data.zipCodes.split(",").map(s => s.trim()).filter(Boolean) : [],
        adjusterId: data.adjusterId || undefined,
      };
      if (editingTerritory) {
        return apiRequest("PATCH", `/api/territories/${editingTerritory.id}`, payload).then(r => r.json());
      }
      return apiRequest("POST", "/api/territories", payload).then(r => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/territories"] });
      qc.invalidateQueries({ queryKey: ["/api/adjusters"] });
      setTerritoryDialog(false);
      setEditingTerritory(null);
      toast({ title: editingTerritory ? "Territory updated" : "Territory created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTerritoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/territories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/territories"] });
      toast({ title: "Territory removed" });
    },
  });

  // ─── Claim mutations ────────────────────────────────────────────────────────

  const claimForm = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: { status: "unassigned", priority: "standard" },
  });

  const claimMutation = useMutation({
    mutationFn: async (data: ClaimFormData) => {
      const payload = {
        claimNumber: data.claimNumber,
        policyHolderName: data.policyHolderName,
        policyHolderPhone: data.policyHolderPhone,
        incidentDate: data.incidentDate,
        incidentAddress: data.incidentAddress,
        county: data.county,
        zipCode: data.zipCode || undefined,
        vehicleInfo: { make: data.vehicleMake, model: data.vehicleModel, year: data.vehicleYear, vin: data.vehicleVin },
        damageType: data.damageType,
        estimatedDamage: data.estimatedDamage || undefined,
        status: data.status,
        priority: data.priority,
        adjusterId: data.adjusterId || undefined,
        territoryId: data.territoryId || undefined,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
      };
      if (editingClaim) {
        return apiRequest("PATCH", `/api/adjuster-claims/${editingClaim.id}`, payload).then(r => r.json());
      }
      return apiRequest("POST", "/api/adjuster-claims", payload).then(r => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/adjuster-claims"] });
      qc.invalidateQueries({ queryKey: ["/api/adjuster-stats"] });
      qc.invalidateQueries({ queryKey: ["/api/adjusters"] });
      setClaimDialog(false);
      setEditingClaim(null);
      toast({ title: editingClaim ? "Claim updated" : "Claim created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteClaimMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/adjuster-claims/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/adjuster-claims"] });
      qc.invalidateQueries({ queryKey: ["/api/adjuster-stats"] });
      toast({ title: "Claim removed" });
    },
  });

  const assignClaimMutation = useMutation({
    mutationFn: ({ claimId, adjusterId }: { claimId: string; adjusterId: string }) =>
      apiRequest("PATCH", `/api/adjuster-claims/${claimId}/assign`, { adjusterId }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/adjuster-claims"] });
      qc.invalidateQueries({ queryKey: ["/api/adjuster-stats"] });
      qc.invalidateQueries({ queryKey: ["/api/adjusters"] });
      setAssignDialog(false);
      setAssigningClaim(null);
      setAssignAdjusterId("");
      toast({ title: "Claim assigned" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

  function openNewAdjuster() {
    setEditingAdjuster(null);
    adjusterForm.reset({ firstName: "", lastName: "", email: "", phone: "", licenseNumber: "", status: "active", certifications: "", maxCaseload: 30, notes: "" });
    setAdjusterDialog(true);
  }

  function openEditAdjuster(adj: AdjusterWithRelations) {
    setEditingAdjuster(adj);
    adjusterForm.reset({
      firstName: adj.firstName,
      lastName: adj.lastName,
      email: adj.email,
      phone: adj.phone,
      licenseNumber: adj.licenseNumber,
      status: adj.status as "active" | "inactive" | "on_leave",
      certifications: (adj.certifications as string[]).join(", "),
      maxCaseload: adj.maxCaseload,
      notes: adj.notes ?? "",
    });
    setAdjusterDialog(true);
  }

  function openNewTerritory() {
    setEditingTerritory(null);
    territoryForm.reset({ name: "", code: "", counties: [], zipCodes: "", priority: "standard", notes: "" });
    setCountySearch("");
    setTerritoryDialog(true);
  }

  function openEditTerritory(t: TerritoryWithAdjuster) {
    setEditingTerritory(t);
    territoryForm.reset({
      name: t.name,
      code: t.code,
      counties: t.counties as string[],
      zipCodes: (t.zipCodes as string[]).join(", "),
      adjusterId: t.adjusterId ?? "",
      priority: t.priority as "high" | "standard" | "low",
      notes: t.notes ?? "",
    });
    setCountySearch("");
    setTerritoryDialog(true);
  }

  function openNewClaim() {
    setEditingClaim(null);
    claimForm.reset({ claimNumber: "", policyHolderName: "", policyHolderPhone: "", incidentDate: "", incidentAddress: "", county: "", zipCode: "", vehicleMake: "", vehicleModel: "", vehicleYear: new Date().getFullYear(), vehicleVin: "", damageType: "collision", estimatedDamage: "", status: "unassigned", priority: "standard", dueDate: "", notes: "" });
    setClaimDialog(true);
  }

  function openEditClaim(c: ClaimWithRelations) {
    setEditingClaim(c);
    const vi = c.vehicleInfo as { make: string; model: string; year: number; vin?: string };
    claimForm.reset({
      claimNumber: c.claimNumber,
      policyHolderName: c.policyHolderName,
      policyHolderPhone: c.policyHolderPhone,
      incidentDate: c.incidentDate,
      incidentAddress: c.incidentAddress,
      county: c.county,
      zipCode: c.zipCode ?? "",
      vehicleMake: vi.make,
      vehicleModel: vi.model,
      vehicleYear: vi.year,
      vehicleVin: vi.vin ?? "",
      damageType: c.damageType as ClaimFormData["damageType"],
      estimatedDamage: c.estimatedDamage ?? "",
      status: c.status as ClaimFormData["status"],
      priority: c.priority as ClaimFormData["priority"],
      adjusterId: c.adjusterId ?? "",
      territoryId: c.territoryId ?? "",
      dueDate: c.dueDate ?? "",
      notes: c.notes ?? "",
    });
    setClaimDialog(true);
  }

  // ─── Derived stats ──────────────────────────────────────────────────────────

  const allClaims = useQuery<ClaimWithRelations[]>({
    queryKey: ["/api/adjuster-claims", {}],
    queryFn: () => fetch("/api/adjuster-claims", { credentials: "include" }).then(r => r.json()),
  });

  const openStatuses = ["unassigned","assigned","in_progress","inspection_scheduled","pending_estimate","pending_approval"];
  const totalOpen = (allClaims.data ?? []).filter(c => openStatuses.includes(c.status)).length;
  const unassigned = (allClaims.data ?? []).filter(c => c.status === "unassigned").length;
  const coveredTerritories = territories.filter(t => t.adjusterId).length;
  const urgentClaims = (allClaims.data ?? []).filter(c => (c.priority === "urgent" || c.priority === "high") && openStatuses.includes(c.status)).slice(0, 8);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Adjuster Territory Management</h1>
          <p className="text-sm text-muted-foreground">Tennessee Auto Claims — Erie Insurance</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="territories" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Territories
          </TabsTrigger>
          <TabsTrigger value="adjusters" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Adjusters
          </TabsTrigger>
          <TabsTrigger value="claims" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Claims
          </TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{adjusters.length}</p>
                    <p className="text-sm text-muted-foreground">Total Adjusters</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalOpen}</p>
                    <p className="text-sm text-muted-foreground">Open Claims</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{unassigned}</p>
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{coveredTerritories} / {territories.length}</p>
                    <p className="text-sm text-muted-foreground">Territories Covered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" /> Adjuster Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No adjusters yet. Add adjusters to see workload.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adjuster</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Open Claims</TableHead>
                      <TableHead className="w-40">Capacity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map(stat => {
                      const pct = Math.min((stat.openClaims / stat.maxCaseload) * 100, 100);
                      const overCap = stat.openClaims >= stat.maxCaseload;
                      return (
                        <TableRow key={stat.adjusterId}>
                          <TableCell className="font-medium">{stat.adjusterName}</TableCell>
                          <TableCell className="text-muted-foreground">{stat.territory ?? "—"}</TableCell>
                          <TableCell>
                            <Badge className={adjStatusClass(stat.status)}>{stat.status.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={overCap ? "text-red-600 font-semibold" : ""}>{stat.openClaims} / {stat.maxCaseload}</span>
                          </TableCell>
                          <TableCell>
                            <Progress value={pct} className={overCap ? "[&>div]:bg-red-500" : ""} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" /> Urgent &amp; High Priority Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentClaims.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No urgent or high priority open claims.</p>
              ) : (
                <div className="space-y-2">
                  {urgentClaims.map(c => (
                    <div key={c.id} className={`flex items-center justify-between rounded-lg border p-3 ${priorityBorderClass(c.priority)}`}>
                      <div>
                        <span className="font-mono text-sm font-semibold">{c.claimNumber}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-sm">{c.policyHolderName}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{c.county} County</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={priorityClass(c.priority)}>{c.priority}</Badge>
                        <Badge className={claimStatusClass(c.status)}>{c.status.replace(/_/g, " ")}</Badge>
                        {c.adjuster ? (
                          <span className="text-xs text-muted-foreground">{c.adjuster.firstName} {c.adjuster.lastName}</span>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 text-xs">Unassigned</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Territories Tab ── */}
        <TabsContent value="territories">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Territory Management — Tennessee</h2>
            <Button onClick={openNewTerritory}>
              <Plus className="h-4 w-4 mr-2" /> Add Territory
            </Button>
          </div>
          {territories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No territories defined yet. Click "Add Territory" to create your first territory.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {territories.map(t => (
                <Card key={t.id} className={t.priority === "high" ? "border-orange-300" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <Badge className={t.priority === "high" ? "bg-orange-100 text-orange-700" : t.priority === "low" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}>
                        {t.priority}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{t.code}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>{(t.counties as string[]).length}</strong> counties · <strong>{(t.zipCodes as string[]).length}</strong> ZIP codes
                    </p>
                    <p className="text-sm mb-1">
                      <span className="text-muted-foreground">Adjuster: </span>
                      {t.adjuster ? (
                        <span className="font-medium">{t.adjuster.firstName} {t.adjuster.lastName}</span>
                      ) : (
                        <span className="text-red-500 font-medium">Unassigned</span>
                      )}
                    </p>
                    {(t.counties as string[]).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {(t.counties as string[]).join(", ")}
                      </p>
                    )}
                    {t.notes && <p className="text-xs text-muted-foreground mt-1 italic">{t.notes}</p>}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => openEditTerritory(t)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => deleteTerritoryMutation.mutate(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Adjusters Tab ── */}
        <TabsContent value="adjusters">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Field Adjusters</h2>
            <Button onClick={openNewAdjuster}>
              <Plus className="h-4 w-4 mr-2" /> Add Adjuster
            </Button>
          </div>
          {adjusters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No adjusters yet. Click "Add Adjuster" to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {adjusters.map(adj => {
                const pct = Math.min((adj.claimCount / adj.maxCaseload) * 100, 100);
                const overCap = adj.claimCount >= adj.maxCaseload;
                return (
                  <Card key={adj.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{adj.firstName} {adj.lastName}</CardTitle>
                        <Badge className={adjStatusClass(adj.status)}>{adj.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{adj.email}</p>
                      <p className="text-xs text-muted-foreground">{adj.phone} · Lic: {adj.licenseNumber}</p>
                    </CardHeader>
                    <CardContent>
                      {(adj.certifications as string[]).length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-2">
                          {(adj.certifications as string[]).map(c => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Territory: </span>
                        {adj.territory ? <span className="font-medium">{adj.territory.name}</span> : <span className="text-muted-foreground">Unassigned</span>}
                      </p>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Caseload</span>
                        <span className={overCap ? "text-red-600 font-semibold" : ""}>{adj.claimCount} / {adj.maxCaseload}</span>
                      </div>
                      <Progress value={pct} className={overCap ? "[&>div]:bg-red-500" : ""} />
                      {adj.notes && <p className="text-xs text-muted-foreground mt-2 italic">{adj.notes}</p>}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => openEditAdjuster(adj)}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => deleteAdjusterMutation.mutate(adj.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Claims Tab ── */}
        <TabsContent value="claims">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <Select value={claimFilters.status || "all"} onValueChange={v => setClaimFilters(f => ({ ...f, status: v === "all" ? "" : v }))}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
                <SelectItem value="pending_estimate">Pending Estimate</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={claimFilters.adjusterId || "all"} onValueChange={v => setClaimFilters(f => ({ ...f, adjusterId: v === "all" ? "" : v }))}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Adjusters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Adjusters</SelectItem>
                {adjusters.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.firstName} {a.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={claimFilters.priority || "all"} onValueChange={v => setClaimFilters(f => ({ ...f, priority: v === "all" ? "" : v }))}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {(claimFilters.status || claimFilters.adjusterId || claimFilters.priority) && (
              <Button variant="outline" size="sm" onClick={() => setClaimFilters({ status: "", adjusterId: "", priority: "" })}>
                Clear Filters
              </Button>
            )}

            <Button className="ml-auto" onClick={openNewClaim}>
              <Plus className="h-4 w-4 mr-2" /> New Claim
            </Button>
          </div>

          {claims.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No claims found. Adjust filters or click "New Claim" to add one.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <TableHead>Policyholder</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>ZIP</TableHead>
                      <TableHead>Damage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Adjuster</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs font-semibold">{c.claimNumber}</TableCell>
                        <TableCell className="text-sm">{c.policyHolderName}</TableCell>
                        <TableCell className="text-sm">{c.county}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.zipCode ?? "—"}</TableCell>
                        <TableCell className="text-sm capitalize">{c.damageType.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <Badge className={`${claimStatusClass(c.status)} text-xs whitespace-nowrap`}>
                            {c.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${priorityClass(c.priority)} text-xs`}>{c.priority}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.adjuster ? `${c.adjuster.firstName} ${c.adjuster.lastName}` : <span className="text-red-500 text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.dueDate ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => { setAssigningClaim(c); setAssignAdjusterId(c.adjusterId ?? ""); setAssignDialog(true); }}>
                              Assign
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditClaim(c)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => deleteClaimMutation.mutate(c.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Adjuster Dialog ── */}
      <Dialog open={adjusterDialog} onOpenChange={setAdjusterDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAdjuster ? "Edit Adjuster" : "Add Adjuster"}</DialogTitle>
          </DialogHeader>
          <Form {...adjusterForm}>
            <form onSubmit={adjusterForm.handleSubmit(d => adjusterMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={adjusterForm.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={adjusterForm.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={adjusterForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={adjusterForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={adjusterForm.control} name="licenseNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>License #</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={adjusterForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={adjusterForm.control} name="maxCaseload" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Caseload</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={adjusterForm.control} name="certifications" render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications (comma-separated)</FormLabel>
                  <FormControl><Input placeholder="AIC, CPCU, ARM" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={adjusterForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAdjusterDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={adjusterMutation.isPending}>
                  {adjusterMutation.isPending ? "Saving..." : editingAdjuster ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Territory Dialog ── */}
      <Dialog open={territoryDialog} onOpenChange={setTerritoryDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTerritory ? "Edit Territory" : "Add Territory"}</DialogTitle>
          </DialogHeader>
          <Form {...territoryForm}>
            <form onSubmit={territoryForm.handleSubmit(d => territoryMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={territoryForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Territory Name</FormLabel>
                    <FormControl><Input placeholder="Middle Tennessee" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={territoryForm.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl><Input placeholder="TN-MIDDLE" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={territoryForm.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={territoryForm.control} name="adjusterId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Adjuster</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {adjusters.filter(a => a.status === "active").map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.firstName} {a.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={territoryForm.control} name="counties" render={({ field }) => (
                <FormItem>
                  <FormLabel>Counties ({field.value?.length ?? 0} selected)</FormLabel>
                  <Input
                    placeholder="Search counties..."
                    value={countySearch}
                    onChange={e => setCountySearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="border rounded-md p-2 h-48 overflow-y-auto grid grid-cols-2 gap-1">
                    {TN_COUNTIES
                      .filter(c => c.toLowerCase().includes(countySearch.toLowerCase()))
                      .map(county => (
                        <div key={county} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted">
                          <Checkbox
                            id={`county-${county}`}
                            checked={(field.value ?? []).includes(county)}
                            onCheckedChange={checked => {
                              const current = field.value ?? [];
                              field.onChange(checked ? [...current, county] : current.filter(c => c !== county));
                            }}
                          />
                          <label htmlFor={`county-${county}`} className="text-sm cursor-pointer">{county}</label>
                        </div>
                      ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={territoryForm.control} name="zipCodes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Codes (comma-separated, optional)</FormLabel>
                  <FormControl><Input placeholder="37201, 37203, 37205" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={territoryForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTerritoryDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={territoryMutation.isPending}>
                  {territoryMutation.isPending ? "Saving..." : editingTerritory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Claim Dialog ── */}
      <Dialog open={claimDialog} onOpenChange={setClaimDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClaim ? "Edit Claim" : "New Claim"}</DialogTitle>
          </DialogHeader>
          <Form {...claimForm}>
            <form onSubmit={claimForm.handleSubmit(d => claimMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={claimForm.control} name="claimNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim Number</FormLabel>
                    <FormControl><Input placeholder="ERIE-2024-001234" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="incidentDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={claimForm.control} name="policyHolderName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policyholder Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="policyHolderPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policyholder Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={claimForm.control} name="incidentAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-3 gap-3">
                <FormField control={claimForm.control} name="county" render={({ field }) => (
                  <FormItem>
                    <FormLabel>County</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-60">
                        {TN_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="zipCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl><Input placeholder="37201" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="damageType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Damage Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="collision">Collision</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        <SelectItem value="liability">Liability</SelectItem>
                        <SelectItem value="uninsured_motorist">Uninsured Motorist</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Vehicle Information</p>
              <div className="grid grid-cols-4 gap-3">
                <FormField control={claimForm.control} name="vehicleYear" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="vehicleMake" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl><Input placeholder="Toyota" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="vehicleModel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl><Input placeholder="Camry" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="vehicleVin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN (optional)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={claimForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
                        <SelectItem value="pending_estimate">Pending Estimate</SelectItem>
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="estimatedDamage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Damage ($)</FormLabel>
                    <FormControl><Input placeholder="5000.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={claimForm.control} name="adjusterId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjuster</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {adjusters.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.firstName} {a.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="territoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Territory</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {territories.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={claimForm.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={claimForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setClaimDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={claimMutation.isPending}>
                  {claimMutation.isPending ? "Saving..." : editingClaim ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Assign Dialog ── */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Claim</DialogTitle>
          </DialogHeader>
          {assigningClaim && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Claim <span className="font-mono font-semibold">{assigningClaim.claimNumber}</span> — {assigningClaim.policyHolderName}
              </p>
              <div>
                <label className="text-sm font-medium mb-1 block">Select Adjuster</label>
                <Select value={assignAdjusterId} onValueChange={setAssignAdjusterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose adjuster..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adjusters.filter(a => a.status === "active").map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.firstName} {a.lastName}
                        <span className="ml-2 text-xs text-muted-foreground">({a.claimCount}/{a.maxCaseload})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialog(false); setAssigningClaim(null); }}>Cancel</Button>
            <Button
              disabled={!assignAdjusterId || assignClaimMutation.isPending}
              onClick={() => assigningClaim && assignClaimMutation.mutate({ claimId: assigningClaim.id, adjusterId: assignAdjusterId })}
            >
              {assignClaimMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
