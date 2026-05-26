import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isAfter, parseISO } from "date-fns";
import {
  Plus, Phone, Mail, MapPin, DollarSign, TrendingUp,
  Target, Zap, Star, Users, ArrowRight, Pencil, Trash2,
  AlertCircle, CheckCircle2, Clock, XCircle, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

// ─── Constants ───────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "new",       label: "New",       color: "bg-blue-500",   light: "bg-blue-50 border-blue-200",   text: "text-blue-700"   },
  { key: "contacted", label: "Contacted", color: "bg-yellow-500", light: "bg-yellow-50 border-yellow-200", text: "text-yellow-700" },
  { key: "quoted",    label: "Quoted",    color: "bg-purple-500", light: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  { key: "booked",    label: "Booked",    color: "bg-indigo-500", light: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  { key: "won",       label: "Won",       color: "bg-green-500",  light: "bg-green-50 border-green-200",   text: "text-green-700"  },
  { key: "lost",      label: "Lost",      color: "bg-red-400",    light: "bg-red-50 border-red-200",       text: "text-red-600"    },
];

const SOURCE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  google_maps:      { label: "Google Maps",      emoji: "🗺️", color: "bg-green-100 text-green-700" },
  facebook:         { label: "Facebook",         emoji: "📘", color: "bg-blue-100 text-blue-700" },
  tiktok:           { label: "TikTok",           emoji: "🎵", color: "bg-pink-100 text-pink-700" },
  referral:         { label: "Referral",         emoji: "🤝", color: "bg-orange-100 text-orange-700" },
  website:          { label: "Website",          emoji: "🌐", color: "bg-slate-100 text-slate-700" },
  direct:           { label: "Direct",           emoji: "📞", color: "bg-gray-100 text-gray-700" },
  commercial_quote: { label: "Commercial Quote", emoji: "🏗️", color: "bg-yellow-100 text-yellow-700" },
  other:            { label: "Other",            emoji: "💬", color: "bg-gray-100 text-gray-600" },
};

const SERVICE_LABELS: Record<string, string> = {
  driveway: "Driveway Cleaning",
  roof: "Roof Washing",
  house_wash: "House / Soft Wash",
  gutters: "Gutter Cleaning",
  paver_restoration: "Paver Restoration",
  construction_cleanup: "Construction Cleanup",
  fleet: "Fleet Washing",
  equipment: "Heavy Equipment",
  bundle: "Property Bundle",
  other: "Other",
};

const REVENUE_TARGET_5K = 5000;
const REVENUE_TARGET_10K = 10000;

// ─── Strategy playbook ───────────────────────────────────────────────────────

// ─── Rutherford County prospect tiers ────────────────────────────────────────

const RC_PROSPECTS = [
  {
    tier: 1, tierLabel: "Industrial / Manufacturing", color: "border-orange-300 bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    why: "Highest per-job value. Topre = $9,200. These companies have dirty facilities, large equipment, and big maintenance budgets.",
    companies: [
      { name: "Nissan Smyrna Plant", address: "983 Nissan Dr, Smyrna 37167", phone: "Get intro via Topre's Ed", service: "Facility + Equipment", est: "$10,000–$20,000", action: "Ask Topre's Ed for an intro to their facilities contact" },
      { name: "Bridgestone Americas", address: "La Vergne 37086", phone: "Find via switchboard", service: "Heavy Equipment + Parking", est: "$5,000–$12,000", action: "Call main line, ask for Facilities or Maintenance Manager" },
      { name: "Schneider Electric", address: "Smyrna 37167", phone: "Find via switchboard", service: "Facility Exterior", est: "$3,000–$6,000", action: "900 employees, large campus. Call facilities dept." },
      { name: "General Mills", address: "Murfreesboro 37129", phone: "Find via switchboard", service: "Industrial Cleaning", est: "$4,000–$8,000", action: "Food plant = high sanitation standards = premium rates" },
    ],
  },
  {
    tier: 2, tierLabel: "Property Management", color: "border-blue-300 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    why: "One contract = recurring monthly revenue. MMC alone could be $2,400/mo across their apartment portfolio.",
    companies: [
      { name: "MMC Properties", address: "Murfreesboro 37130", phone: "615-849-9006", service: "Apartment Exteriors", est: "$600–$2,400/mo", action: "Call 615-849-9006 today — ask for property manager" },
      { name: "Real Property Management", address: "Murfreesboro + surrounding", phone: "615-900-4067", service: "Portfolio Exterior Washing", est: "$500–$3,000/mo", action: "Call 615-900-4067, pitch quarterly contract" },
      { name: "Stones River Property Mgmt", address: "Murfreesboro", phone: "Via website", service: "Seasonal Cleaning Packages", est: "$1,000–$2,000/season", action: "Largest Middle TN PM — submit quote request via website" },
      { name: "Cedar Management Group (HOA)", address: "Murfreesboro", phone: "Via website", service: "HOA Common Areas", est: "$500–$1,500/property", action: "HOAs pay for driveway + sidewalk + entrance washing" },
    ],
  },
  {
    tier: 3, tierLabel: "General Contractors", color: "border-green-300 bg-green-50",
    badge: "bg-green-100 text-green-700",
    why: "Post-construction cleanup is a one-call-close. Reference the $9,200 Topre job as your proof.",
    companies: [
      { name: "Dow Smith Company", address: "Smyrna 37167", phone: "dowsmith.com", service: "Post-Construction Cleanup", est: "$2,000–$8,000/job", action: "Active design-build in Smyrna. Closest GC to Topre job." },
      { name: "Wright Construction", address: "Murfreesboro 37130", phone: "wrightconstruction.us", service: "Post-Construction Cleanup", est: "$1,500–$5,000/job", action: "50 years local — they value reliable vendors. Walk in." },
      { name: "Pinnacle Building Services", address: "Murfreesboro 37130", phone: "Via website", service: "Post-Roof Cleanup", est: "$800–$2,000/job", action: "150+ commercial roofs. Partner for debris cleanup after installs." },
    ],
  },
  {
    tier: 4, tierLabel: "Fleet & Trucking", color: "border-purple-300 bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    why: "Monthly contracts. GFC Cartage has a phone number — call them first.",
    companies: [
      { name: "GFC Cartage LLC", address: "291 11th Ave, Smyrna 37167", phone: "615-462-7905", service: "Fleet Washing", est: "$600–$1,500/mo", action: "CALL NOW — 615-462-7905. 19 years in business, Smyrna." },
      { name: "IKE Transportation", address: "Murfreesboro 37130", phone: "iketrans.com", service: "Flatbed Fleet Washing", est: "$800–$2,000/mo", action: "Flatbeds get filthy. Monthly wash contract." },
      { name: "Somerset Logistics", address: "Murfreesboro 37130", phone: "somersetlogistics.com", service: "Fleet + Referrals", est: "$500–$1,000/mo", action: "Veteran-owned — lead with that. Referral network potential." },
    ],
  },
  {
    tier: 5, tierLabel: "Auto Dealerships", color: "border-gray-300 bg-gray-50",
    badge: "bg-gray-100 text-gray-700",
    why: "Lower value per job but quick to close. Walk in with a demo offer.",
    companies: [
      { name: "Murfreesboro Hyundai", address: "Murfreesboro 37129", phone: "Walk in", service: "Lot + Vehicle Washing", est: "$400–$800/mo", action: "Walk in Tuesday AM, offer free demo wash on their dirtiest car" },
      { name: "Speedway Motors", address: "Murfreesboro 37130", phone: "Walk in", service: "Lot Washing", est: "$300–$600/mo", action: "A+ BBB, 20 years — independent = faster decisions" },
    ],
  },
];

const STRATEGY_PLAYS = [
  {
    priority: 1,
    icon: "🗺️",
    title: "Optimize Google Business Profile",
    why: "Your GBP generates leads at $0 cost with 50% close rate — best ROI you have.",
    actions: [
      "Post a before/after photo every week",
      "Ask every won client for a Google review same day",
      "Reply to all reviews within 24 hours",
      "Update your services list to include fleet & construction cleanup",
    ],
    revenue: "$300–$1,200 per lead added",
    effort: "Low",
  },
  {
    priority: 2,
    icon: "🤝",
    title: "Activate the Referral Engine",
    why: "Smith, Jones, Taylor, and Topre have already paid you. Each has a network.",
    actions: [
      "Text every won client: 'Know anyone with a dirty driveway? $50 off their first job if you refer.'",
      "Leave 3 door hangers on neighbors of every completed job",
      "Offer a free gutter cleaning to a realtor who sends 3 referrals",
    ],
    revenue: "$300–$700 per referral",
    effort: "Low",
  },
  {
    priority: 3,
    icon: "🏗️",
    title: "Land One Commercial Job",
    why: "Topre America = $9,200. One commercial job equals your entire residential target.",
    actions: [
      "Call general contractors in Rutherford County — ask if they need post-build cleanup",
      "Email the 3 largest construction sites currently active in Smyrna/Murfreesboro",
      "Send a quote to the fleet manager at any logistics company near I-24",
      "Contact property managers of apartment complexes for recurring exterior washing",
    ],
    revenue: "$1,500–$9,200 per job",
    effort: "Medium",
  },
  {
    priority: 4,
    icon: "💰",
    title: "Upsell Every Active Quote",
    why: "You have 2 quoted leads sitting open. Converting + upselling them gets to $5K fast.",
    actions: [
      "Follow up on the paver restoration quote ($1,200) — offer to add soft wash for $300 more",
      "Follow up on the roof wash quote ($450) — bundle with gutters for $675",
      "Call every 'new' lead same day — first-call close rate drops 80% after 24 hours",
    ],
    revenue: "$450–$1,500 from existing pipeline",
    effort: "Low",
  },
  {
    priority: 5,
    icon: "📱",
    title: "TikTok Organic Content",
    why: "TikTok drives 67% close rate — highest of any paid channel. Organic costs $0.",
    actions: [
      "Film a time-lapse of a dirty driveway going clean — post 3× per week",
      "Show before/after of every job completed",
      "Create a '5 things that destroy your driveway' education video",
    ],
    revenue: "Reduces cost-per-lead from $87 to $0",
    effort: "Medium",
  },
];

// ─── Form schema ─────────────────────────────────────────────────────────────

const leadFormSchema = z.object({
  source: z.string().min(1, "Source required"),
  name: z.string().min(1, "Name required"),
  phone: z.string().min(7, "Phone required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  zip: z.string().optional(),
  serviceInterest: z.string().min(1, "Service required"),
  estimatedValue: z.coerce.number().min(0).optional(),
  status: z.string().min(1),
  assignedTo: z.string().optional(),
  quotedAmount: z.coerce.number().min(0).optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  referredBy: z.string().optional(),
  adSpend: z.coerce.number().min(0).optional(),
  lostReason: z.string().optional(),
});
type LeadForm = z.infer<typeof leadFormSchema>;

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Request failed");
  if (res.status === 204) return null;
  return res.json();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLeads() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState<"pipeline" | "list" | "strategy">("pipeline");
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: () => api("GET", "/api/leads"),
  });

  const createMutation = useMutation({
    mutationFn: (d: LeadForm) => api("POST", "/api/leads", toPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); setShowForm(false); toast({ title: "Lead added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadForm> }) => api("PATCH", `/api/leads/${id}`, toPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); setShowForm(false); setEditingLead(null); toast({ title: "Lead updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api("DELETE", `/api/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); toast({ title: "Lead deleted" }); },
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api("PATCH", `/api/leads/${id}`, { status, ...(status === "won" ? { wonAt: new Date() } : {}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/leads"] }),
  });

  function toPayload(d: Partial<LeadForm>) {
    return {
      ...d,
      email: d.email || undefined,
      estimatedValue: d.estimatedValue || undefined,
      quotedAmount: d.quotedAmount || undefined,
      adSpend: d.adSpend || undefined,
      followUpDate: d.followUpDate ? new Date(d.followUpDate) : undefined,
    };
  }

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { source: "google_maps", status: "new", serviceInterest: "house_wash" },
  });

  function openCreate() {
    form.reset({ source: "google_maps", status: "new", serviceInterest: "house_wash" });
    setEditingLead(null);
    setShowForm(true);
  }

  function openEdit(l: Lead) {
    form.reset({
      source: l.source,
      name: l.name,
      phone: l.phone,
      email: l.email ?? "",
      address: l.address ?? "",
      zip: l.zip ?? "",
      serviceInterest: l.serviceInterest,
      estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : undefined,
      status: l.status,
      assignedTo: l.assignedTo ?? "",
      quotedAmount: l.quotedAmount ? Number(l.quotedAmount) : undefined,
      followUpDate: l.followUpDate ? format(new Date(l.followUpDate), "yyyy-MM-dd") : "",
      notes: l.notes ?? "",
      referredBy: l.referredBy ?? "",
      adSpend: l.adSpend ? Number(l.adSpend) : undefined,
      lostReason: l.lostReason ?? "",
    });
    setEditingLead(l);
    setShowForm(true);
  }

  function onSubmit(values: LeadForm) {
    if (editingLead) updateMutation.mutate({ id: editingLead.id, data: values });
    else createMutation.mutate(values);
  }

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    const wonLeads = leads.filter((l) => l.status === "won");
    const wonRevenue = wonLeads.reduce((s, l) => s + (l.quotedAmount ? Number(l.quotedAmount) : 0), 0);
    const pipelineValue = leads
      .filter((l) => ["quoted", "booked", "contacted", "new"].includes(l.status))
      .reduce((s, l) => s + (l.estimatedValue ? Number(l.estimatedValue) : 0), 0);
    const totalAdSpend = leads.reduce((s, l) => s + (l.adSpend ? Number(l.adSpend) : 0), 0);
    const conversionRate = leads.length ? Math.round((wonLeads.length / leads.length) * 100) : 0;

    const bySource: Record<string, { leads: number; won: number; revenue: number; spend: number }> = {};
    leads.forEach((l) => {
      if (!bySource[l.source]) bySource[l.source] = { leads: 0, won: 0, revenue: 0, spend: 0 };
      bySource[l.source].leads++;
      if (l.status === "won") {
        bySource[l.source].won++;
        bySource[l.source].revenue += l.quotedAmount ? Number(l.quotedAmount) : 0;
      }
      bySource[l.source].spend += l.adSpend ? Number(l.adSpend) : 0;
    });

    const overdueFollowUps = leads.filter(
      (l) => l.followUpDate && isAfter(new Date(), new Date(l.followUpDate)) && !["won", "lost"].includes(l.status)
    );

    return { wonRevenue, pipelineValue, totalAdSpend, conversionRate, bySource, overdueFollowUps };
  }, [leads]);

  const filteredLeads = sourceFilter === "all" ? leads : leads.filter((l) => l.source === sourceFilter);

  const progress5k = Math.min(100, (metrics.wonRevenue / REVENUE_TARGET_5K) * 100);
  const progress10k = Math.min(100, (metrics.wonRevenue / REVENUE_TARGET_10K) * 100);
  const needed5k = Math.max(0, REVENUE_TARGET_5K - metrics.wonRevenue);
  const needed10k = Math.max(0, REVENUE_TARGET_10K - metrics.wonRevenue);

  // ── Pipeline board ──
  const byStage = (stage: string) => filteredLeads.filter((l) => l.status === stage);
  const stageValue = (stage: string) =>
    byStage(stage).reduce((s, l) => s + (l.estimatedValue ? Number(l.estimatedValue) : 0), 0);

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Pipeline &amp; Growth Strategy</h1>
          <p className="text-sm text-muted-foreground">Track leads → hit $5K then $10K</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex border rounded-lg overflow-hidden">
            {(["pipeline", "list", "strategy"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Revenue Target Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { label: "$5K Target", progress: progress5k, needed: needed5k, color: "bg-blue-500" },
          { label: "$10K Target", progress: progress10k, needed: needed10k, color: "bg-green-500" },
        ].map(({ label, progress, needed, color }) => (
          <Card key={label} className="relative overflow-hidden">
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm font-bold text-primary">${metrics.wonRevenue.toLocaleString()} won</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div className={`${color} h-3 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{progress.toFixed(0)}% there</span>
                <span>{needed > 0 ? `$${needed.toLocaleString()} to go` : "🎉 Hit!"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pipeline Value", value: `$${metrics.pipelineValue.toLocaleString()}`, icon: <Target className="w-4 h-4" />, color: "text-purple-600" },
          { label: "Conversion Rate", value: `${metrics.conversionRate}%`, icon: <TrendingUp className="w-4 h-4" />, color: "text-green-600" },
          { label: "Total Ad Spend", value: `$${metrics.totalAdSpend.toLocaleString()}`, icon: <DollarSign className="w-4 h-4" />, color: "text-orange-600" },
          { label: "Overdue Follow-ups", value: String(metrics.overdueFollowUps.length), icon: <AlertCircle className="w-4 h-4" />, color: metrics.overdueFollowUps.length > 0 ? "text-red-600" : "text-gray-500" },
        ].map(({ label, value, icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-3 pb-3">
              <div className={`flex items-center gap-1.5 mb-0.5 ${color}`}>{icon}<span className="text-xs font-medium">{label}</span></div>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Source filter */}
      {view !== "strategy" && (
        <div className="flex gap-2 flex-wrap mb-4">
          {["all", ...Object.keys(SOURCE_CONFIG)].map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${sourceFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              {s === "all" ? "All Sources" : `${SOURCE_CONFIG[s]?.emoji} ${SOURCE_CONFIG[s]?.label}`}
              {s !== "all" && (
                <span className="ml-1 opacity-60">({leads.filter((l) => l.source === s).length})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── PIPELINE VIEW ── */}
      {view === "pipeline" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = byStage(stage.key);
              return (
                <div key={stage.key} className="w-64 shrink-0">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${stage.light} border-b-2 ${stage.light.split(" ")[1]}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className={`text-sm font-semibold ${stage.text}`}>{stage.label}</span>
                      <span className="text-xs bg-white/70 rounded-full px-1.5">{stageLeads.length}</span>
                    </div>
                    {stageValue(stage.key) > 0 && (
                      <span className="text-xs font-medium text-muted-foreground">${stageValue(stage.key).toLocaleString()}</span>
                    )}
                  </div>
                  <div className={`min-h-32 p-2 rounded-b-lg border ${stage.light.split(" ")[1]} border-t-0 bg-muted/20 space-y-2`}>
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onEdit={openEdit} onDelete={(id) => deleteMutation.mutate(id)} onStage={(id, s) => stageMutation.mutate({ id, status: s })} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div className="space-y-2">
          {isLoading && <p className="text-center py-8 text-muted-foreground">Loading...</p>}
          {filteredLeads.map((lead) => {
            const src = SOURCE_CONFIG[lead.source];
            const stage = PIPELINE_STAGES.find((s) => s.key === lead.status);
            const overdue = lead.followUpDate && isAfter(new Date(), new Date(lead.followUpDate)) && !["won","lost"].includes(lead.status);
            return (
              <div key={lead.id} className={`flex items-start justify-between p-4 rounded-lg border gap-3 ${overdue ? "border-red-200 bg-red-50/30" : "bg-white"}`}>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{lead.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${src?.color ?? "bg-gray-100 text-gray-600"}`}>{src?.emoji} {src?.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stage?.light ?? ""} ${stage?.text ?? ""} border ${stage?.light.split(" ")[1] ?? ""}`}>{stage?.label}</span>
                    {overdue && <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />Follow-up overdue</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                    {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                    {lead.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.address}</span>}
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span>{SERVICE_LABELS[lead.serviceInterest] ?? lead.serviceInterest}</span>
                    {lead.estimatedValue && <span className="text-primary font-medium">Est. ${Number(lead.estimatedValue).toLocaleString()}</span>}
                    {lead.quotedAmount && <span className="text-green-700 font-medium">Quoted ${Number(lead.quotedAmount).toLocaleString()}</span>}
                    {lead.followUpDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Follow up {format(new Date(lead.followUpDate), "MMM d")}</span>}
                  </div>
                  {lead.notes && <p className="text-xs text-muted-foreground italic truncate">{lead.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(lead)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this lead?")) deleteMutation.mutate(lead.id); }}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                </div>
              </div>
            );
          })}
          {filteredLeads.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No leads found.</p>
            </div>
          )}
        </div>
      )}

      {/* ── STRATEGY VIEW ── */}
      {view === "strategy" && (
        <div className="space-y-6">
          {/* Source performance table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" />Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="pb-2 pr-4">Source</th>
                      <th className="pb-2 pr-4 text-right">Leads</th>
                      <th className="pb-2 pr-4 text-right">Won</th>
                      <th className="pb-2 pr-4 text-right">Close %</th>
                      <th className="pb-2 pr-4 text-right">Revenue</th>
                      <th className="pb-2 pr-4 text-right">Ad Spend</th>
                      <th className="pb-2 text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.bySource)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .map(([src, data]) => {
                        const cfg = SOURCE_CONFIG[src];
                        const closeRate = data.leads ? Math.round((data.won / data.leads) * 100) : 0;
                        const roi = data.spend > 0 ? ((data.revenue - data.spend) / data.spend * 100).toFixed(0) : "∞";
                        return (
                          <tr key={src} className="border-b last:border-0">
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${cfg?.color ?? "bg-gray-100"}`}>{cfg?.emoji} {cfg?.label ?? src}</span>
                            </td>
                            <td className="py-2 pr-4 text-right">{data.leads}</td>
                            <td className="py-2 pr-4 text-right">{data.won}</td>
                            <td className="py-2 pr-4 text-right">
                              <span className={closeRate >= 50 ? "text-green-600 font-bold" : closeRate >= 30 ? "text-yellow-600" : "text-red-500"}>{closeRate}%</span>
                            </td>
                            <td className="py-2 pr-4 text-right font-medium">${data.revenue.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right text-muted-foreground">${data.spend.toLocaleString()}</td>
                            <td className="py-2 text-right">
                              <span className={roi === "∞" || Number(roi) > 300 ? "text-green-600 font-bold" : ""}>{typeof roi === "string" ? roi : `${roi}%`}</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                ✅ Google Maps has infinite ROI and 50%+ close rate — it's your best channel. Double down there first.
              </p>
            </CardContent>
          </Card>

          {/* Rutherford County Prospects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Rutherford County Prospects — Searched &amp; Ranked</h2>
              <span className="text-xs text-muted-foreground">17 companies found across 5 categories · All added to pipeline</span>
            </div>
            {RC_PROSPECTS.map((tier) => (
              <Card key={tier.tier} className={`border-2 ${tier.color}`}>
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tier.badge}`}>Tier {tier.tier}</span>
                    <CardTitle className="text-sm">{tier.tierLabel}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{tier.why}</p>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="pb-1.5 pr-3 font-medium">Company</th>
                          <th className="pb-1.5 pr-3 font-medium">Phone / Contact</th>
                          <th className="pb-1.5 pr-3 font-medium">Service</th>
                          <th className="pb-1.5 pr-3 font-medium">Est. Value</th>
                          <th className="pb-1.5 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tier.companies.map((c, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1.5 pr-3 font-semibold">{c.name}</td>
                            <td className="py-1.5 pr-3 text-muted-foreground">{c.phone}</td>
                            <td className="py-1.5 pr-3">{c.service}</td>
                            <td className="py-1.5 pr-3 font-medium text-primary">{c.est}</td>
                            <td className="py-1.5 text-muted-foreground leading-snug">{c.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gap to target */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" />Path to $5K–$10K</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold">To hit $5K</p>
                  <p className="text-muted-foreground">Need ${needed5k.toLocaleString()} more. That's:</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li>• {Math.ceil(needed5k / 700)} property bundle jobs @ $700 each, or</li>
                    <li>• 1 construction cleanup @ $2K + {Math.ceil(Math.max(0, needed5k - 2000) / 400)} residential jobs, or</li>
                    <li>• Convert your 2 open quoted leads ($1,650) + 3 new GBP leads</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">To hit $10K</p>
                  <p className="text-muted-foreground">Need ${needed10k.toLocaleString()} more. That's:</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li>• 1 Topre-sized commercial job ($9,200), or</li>
                    <li>• 1 fleet account (10 trucks/mo = $950/mo) + {Math.ceil(Math.max(0, needed10k - 950) / 450)} residential, or</li>
                    <li>• 15 standard residential jobs @ $650 avg bundle price</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy plays */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Playbook — Ranked by Impact vs. Effort</h2>
            {STRATEGY_PLAYS.map((play) => (
              <Card key={play.priority} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl shrink-0 mt-0.5">{play.icon}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <span className="text-xs text-muted-foreground mr-2">#{play.priority}</span>
                          <span className="font-semibold">{play.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{play.effort} Effort</Badge>
                          <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">{play.revenue}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">{play.why}</p>
                      <ul className="space-y-1">
                        {play.actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Add/Edit Lead Dialog ── */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditingLead(null); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingLead ? "Edit Lead" : "Add Lead"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input {...form.register("name")} placeholder="John Smith" />
                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input {...form.register("phone")} placeholder="(615) 555-0100" />
                {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input {...form.register("email")} type="email" placeholder="optional" />
              </div>
              <div className="space-y-1">
                <Label>ZIP Code</Label>
                <Input {...form.register("zip")} placeholder="37130" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Address</Label>
                <Input {...form.register("address")} placeholder="123 Main St, Murfreesboro, TN" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Source *</Label>
                <Select value={form.watch("source")} onValueChange={(v) => form.setValue("source", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Service *</Label>
                <Select value={form.watch("serviceInterest")} onValueChange={(v) => form.setValue("serviceInterest", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estimated Value ($)</Label>
                <Input {...form.register("estimatedValue")} type="number" min="0" step="10" placeholder="500" />
              </div>
              <div className="space-y-1">
                <Label>Quoted Amount ($)</Label>
                <Input {...form.register("quotedAmount")} type="number" min="0" step="10" placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Ad Spend ($)</Label>
                <Input {...form.register("adSpend")} type="number" min="0" step="0.01" placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Follow-up Date</Label>
                <Input {...form.register("followUpDate")} type="date" min={today} />
              </div>
              <div className="space-y-1">
                <Label>Assigned To</Label>
                <Input {...form.register("assignedTo")} placeholder="Blake" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Referred By</Label>
              <Input {...form.register("referredBy")} placeholder="Who referred this lead?" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} rows={2} placeholder="Context, special requirements..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingLead(null); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingLead ? "Save" : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Lead Card (pipeline view) ────────────────────────────────────────────────

function LeadCard({ lead, onEdit, onDelete, onStage }: {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onDelete: (id: string) => void;
  onStage: (id: string, status: string) => void;
}) {
  const src = SOURCE_CONFIG[lead.source];
  const overdue = lead.followUpDate && isAfter(new Date(), new Date(lead.followUpDate)) && !["won","lost"].includes(lead.status);

  const nextStage = PIPELINE_STAGES.find((_, i, arr) => {
    const cur = arr.findIndex((s) => s.key === lead.status);
    return i === cur + 1;
  });

  return (
    <div className={`bg-white rounded-lg border p-2.5 text-sm shadow-sm ${overdue ? "border-red-300" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="font-medium text-sm leading-tight truncate">{lead.name}</div>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={() => onEdit(lead)} className="p-0.5 hover:text-primary"><Pencil className="w-3 h-3" /></button>
          <button onClick={() => { if (confirm("Delete?")) onDelete(lead.id); }} className="p-0.5 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{SERVICE_LABELS[lead.serviceInterest] ?? lead.serviceInterest}</p>
      {lead.estimatedValue && (
        <p className="text-xs font-semibold text-primary mt-0.5">Est. ${Number(lead.estimatedValue).toLocaleString()}</p>
      )}
      <div className="flex items-center justify-between mt-1.5 gap-1">
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${src?.color ?? "bg-gray-100 text-gray-600"}`}>{src?.emoji} {src?.label}</span>
        {nextStage && !["won","lost"].includes(lead.status) && (
          <button
            onClick={() => onStage(lead.id, nextStage.key)}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5"
          >
            → {nextStage.label}
          </button>
        )}
      </div>
      {overdue && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />Follow-up overdue
        </p>
      )}
      {lead.followUpDate && !overdue && (
        <p className="text-xs text-muted-foreground mt-1">Follow up {format(new Date(lead.followUpDate), "MMM d")}</p>
      )}
    </div>
  );
}
