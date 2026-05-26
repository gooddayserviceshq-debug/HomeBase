import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Building2,
  Truck,
  HardHat,
  Wrench,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Calculator,
  Phone,
  ArrowRight,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// ─── Pricing constants (based on GDS Topre America invoice: $0.184/sqft) ────

const CONSTRUCTION_CLEANUP_RATES: Record<string, { label: string; rate: number; description: string }> = {
  residential_post_construction: {
    label: "Residential Post-Construction",
    rate: 0.15,
    description: "New home construction dust, debris, concrete residue",
  },
  commercial_interior: {
    label: "Commercial Interior Cleanup",
    rate: 0.18,
    description: "Commercial build-out, warehouse, office interior",
  },
  industrial_structural: {
    label: "Industrial / Structural",
    rate: 0.22,
    description: "I-beams, trusses, purlins, elevated structural elements",
  },
  heavy_industrial: {
    label: "Heavy Industrial / Exterior",
    rate: 0.25,
    description: "Full exterior cladding, concrete panels, heavy debris",
  },
};

const FLEET_RATES: Record<string, { label: string; rate: number }> = {
  pickup_suv: { label: "Pickup Truck / SUV / Cargo Van", rate: 55 },
  box_truck: { label: "Box Truck / Sprinter (up to 26ft)", rate: 95 },
  semi_cab: { label: "Semi Cab (no trailer)", rate: 135 },
  semi_full: { label: "Semi Cab + Trailer (full rig)", rate: 210 },
  rv_bus: { label: "RV / Bus / Coach", rate: 185 },
};

const EQUIPMENT_RATES: Record<string, { label: string; rate: number; description: string }> = {
  small: {
    label: "Small Equipment",
    rate: 135,
    description: "Skid steer, mini excavator, compact track loader, forklift",
  },
  medium: {
    label: "Medium Equipment",
    rate: 195,
    description: "Backhoe, mid-size excavator, motor grader, telehandler",
  },
  large: {
    label: "Large Equipment",
    rate: 295,
    description: "Large excavator, bulldozer, large dozer, wheel loader",
  },
  xlarge: {
    label: "Extra-Large Equipment",
    rate: 375,
    description: "Crane, large articulating dump truck, dragline, scraper",
  },
};

const FLEET_DISCOUNT = { monthly: 0.12, quarterly: 0.07, annual: 0.15 };

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceCategory = "construction_cleanup" | "fleet_washing" | "heavy_equipment";

interface LineItem {
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface ConstructionDetails {
  cleanupType: keyof typeof CONSTRUCTION_CLEANUP_RATES;
  squareFootage: number;
  requiresLift: boolean;
  floors: number;
  additionalServices: string[];
}

interface FleetDetails {
  vehicles: { type: keyof typeof FLEET_RATES; qty: number }[];
  frequency: "one_time" | "monthly" | "quarterly" | "annual";
  onSiteWash: boolean;
}

interface EquipmentDetails {
  units: { size: keyof typeof EQUIPMENT_RATES; qty: number }[];
  degrease: boolean;
  onSite: boolean;
}

// ─── Contact form schema ──────────────────────────────────────────────────────

const contactSchema = z.object({
  contactName: z.string().min(1, "Name required"),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().min(7, "Phone required"),
  companyName: z.string().optional(),
  siteAddress: z.string().min(1, "Site address required"),
  notes: z.string().optional(),
});
type ContactForm = z.infer<typeof contactSchema>;

// ─── Calculation helpers ──────────────────────────────────────────────────────

function calcConstruction(d: ConstructionDetails): LineItem[] {
  const info = CONSTRUCTION_CLEANUP_RATES[d.cleanupType];
  const sqft = d.squareFootage;
  const baseTotal = sqft * info.rate;
  const items: LineItem[] = [
    { label: `${info.label} (${sqft.toLocaleString()} sq ft × $${info.rate}/sq ft)`, qty: 1, unitPrice: baseTotal, total: baseTotal },
  ];
  if (d.requiresLift) {
    const liftFee = sqft * 0.04;
    items.push({ label: "Aerial Lift / Scissor Lift Surcharge ($0.04/sq ft)", qty: 1, unitPrice: liftFee, total: liftFee });
  }
  if (d.floors > 1) {
    const floorFee = (d.floors - 1) * sqft * 0.01;
    items.push({ label: `Multi-Story Surcharge (${d.floors} floors, $0.01/sq ft/floor)`, qty: 1, unitPrice: floorFee, total: floorFee });
  }
  if (d.additionalServices.includes("concrete_washout")) {
    const cwFee = Math.max(350, sqft * 0.005);
    items.push({ label: "Concrete Washout Area Cleaning", qty: 1, unitPrice: cwFee, total: cwFee });
  }
  if (d.additionalServices.includes("graffiti_removal")) {
    items.push({ label: "Graffiti Removal", qty: 1, unitPrice: 450, total: 450 });
  }
  if (d.additionalServices.includes("dumpster_pad")) {
    items.push({ label: "Dumpster Pad / Staging Area Cleaning", qty: 1, unitPrice: 275, total: 275 });
  }
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  if (subtotal < 500) {
    const diff = 500 - subtotal;
    items.push({ label: "Minimum Service Fee Adjustment", qty: 1, unitPrice: diff, total: diff });
  }
  return items;
}

function calcFleet(d: FleetDetails): LineItem[] {
  const items: LineItem[] = [];
  for (const v of d.vehicles) {
    if (v.qty === 0) continue;
    const rate = FLEET_RATES[v.type];
    items.push({ label: rate.label, qty: v.qty, unitPrice: rate.rate, total: v.qty * rate.rate });
  }
  if (d.onSiteWash && items.length > 0) {
    const mobileFee = 75;
    items.push({ label: "On-Site Mobile Wash Setup Fee", qty: 1, unitPrice: mobileFee, total: mobileFee });
  }
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discount = FLEET_DISCOUNT[d.frequency] ?? 0;
  if (discount > 0 && subtotal > 0) {
    const discountAmt = -(subtotal * discount);
    items.push({ label: `${d.frequency.charAt(0).toUpperCase() + d.frequency.slice(1)} Contract Discount (${(discount * 100).toFixed(0)}%)`, qty: 1, unitPrice: discountAmt, total: discountAmt });
  }
  return items;
}

function calcEquipment(d: EquipmentDetails): LineItem[] {
  const items: LineItem[] = [];
  for (const u of d.units) {
    if (u.qty === 0) continue;
    const rate = EQUIPMENT_RATES[u.size];
    items.push({ label: `${rate.label} Wash`, qty: u.qty, unitPrice: rate.rate, total: u.qty * rate.rate });
  }
  if (d.degrease) {
    const unitCount = d.units.reduce((s, u) => s + u.qty, 0);
    const degFee = unitCount * 45;
    items.push({ label: "Heavy Degreasing Treatment (per unit)", qty: unitCount, unitPrice: 45, total: degFee });
  }
  if (d.onSite) {
    items.push({ label: "On-Site Mobile Wash Setup Fee", qty: 1, unitPrice: 95, total: 95 });
  }
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  if (subtotal < 300 && subtotal > 0) {
    const diff = 300 - subtotal;
    items.push({ label: "Minimum Service Fee Adjustment", qty: 1, unitPrice: diff, total: diff });
  }
  return items;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommercialQuote() {
  const { toast } = useToast();
  const [step, setStep] = useState<"category" | "configure" | "contact" | "submitted">("category");
  const [category, setCategory] = useState<ServiceCategory | null>(null);

  // Construction state
  const [cleanupType, setCleanupType] = useState<keyof typeof CONSTRUCTION_CLEANUP_RATES>("commercial_interior");
  const [sqft, setSqft] = useState<number>(5000);
  const [requiresLift, setRequiresLift] = useState(false);
  const [floors, setFloors] = useState(1);
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);

  // Fleet state
  const [fleetVehicles, setFleetVehicles] = useState<{ type: keyof typeof FLEET_RATES; qty: number }[]>(
    Object.keys(FLEET_RATES).map((k) => ({ type: k as keyof typeof FLEET_RATES, qty: 0 }))
  );
  const [fleetFreq, setFleetFreq] = useState<FleetDetails["frequency"]>("one_time");
  const [fleetOnSite, setFleetOnSite] = useState(true);

  // Equipment state
  const [equipUnits, setEquipUnits] = useState<{ size: keyof typeof EQUIPMENT_RATES; qty: number }[]>(
    Object.keys(EQUIPMENT_RATES).map((k) => ({ size: k as keyof typeof EQUIPMENT_RATES, qty: 0 }))
  );
  const [degrease, setDegrease] = useState(false);
  const [equipOnSite, setEquipOnSite] = useState(true);

  const form = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  // ── Computed line items ──
  const lineItems: LineItem[] = (() => {
    if (category === "construction_cleanup") {
      return calcConstruction({ cleanupType, squareFootage: sqft, requiresLift, floors, additionalServices });
    }
    if (category === "fleet_washing") {
      return calcFleet({ vehicles: fleetVehicles, frequency: fleetFreq, onSiteWash: fleetOnSite });
    }
    if (category === "heavy_equipment") {
      return calcEquipment({ units: equipUnits, degrease, onSite: equipOnSite });
    }
    return [];
  })();

  const total = lineItems.reduce((s, i) => s + i.total, 0);
  const hasItems = total > 0;

  const submitMutation = useMutation({
    mutationFn: async (values: ContactForm) => {
      const serviceDetails: Record<string, unknown> = category === "construction_cleanup"
        ? { cleanupType, squareFootage: sqft, requiresLift, floors, additionalServices }
        : category === "fleet_washing"
        ? { vehicles: fleetVehicles.filter((v) => v.qty > 0), frequency: fleetFreq, onSiteWash: fleetOnSite }
        : { units: equipUnits.filter((u) => u.qty > 0), degrease, onSite: equipOnSite };

      const res = await fetch("/api/commercial-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          serviceCategory: category,
          serviceDetails,
          lineItems,
          estimatedTotal: total.toFixed(2),
          status: "new",
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      return res.json();
    },
    onSuccess: () => setStep("submitted"),
    onError: () => toast({ title: "Submission failed", description: "Please try again or call us.", variant: "destructive" }),
  });

  function toggleAdditional(key: string) {
    setAdditionalServices((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  function setVehicleQty(type: keyof typeof FLEET_RATES, qty: number) {
    setFleetVehicles((prev) => prev.map((v) => (v.type === type ? { ...v, qty } : v)));
  }

  function setEquipQty(size: keyof typeof EQUIPMENT_RATES, qty: number) {
    setEquipUnits((prev) => prev.map((u) => (u.size === size ? { ...u, qty } : u)));
  }

  // ── Submitted state ──
  if (step === "submitted") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 py-20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold">Quote Request Received!</h1>
          <p className="text-muted-foreground text-lg">
            We'll review your project details and reach out within 1 business day with a firm quote.
          </p>
          <div className="bg-muted/40 rounded-xl p-6 text-left space-y-2">
            <p className="font-semibold">Estimated Total: <span className="text-2xl text-primary">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></p>
            <p className="text-sm text-muted-foreground">This is an instant estimate. Final price may vary based on on-site conditions.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Questions? Call us at{" "}
            <a href="tel:6153909779" className="text-primary font-semibold hover:underline">615-390-9779</a>
          </p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Commercial &amp; Specialty Services</Badge>
          <h1 className="text-4xl font-bold mb-3">Commercial Quote Calculator</h1>
          <p className="text-muted-foreground text-lg">
            Instant estimates for construction cleanup, fleet washing, and heavy equipment — based on real GDS project pricing.
          </p>
        </div>

        {/* Step: Category Selection */}
        {step === "category" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                key: "construction_cleanup" as ServiceCategory,
                icon: <HardHat className="w-8 h-8" />,
                title: "New Construction Cleanup",
                badge: "High Value",
                badgeColor: "default" as const,
                description: "Post-construction pressure washing for residential, commercial, and industrial projects — dust, concrete, structural elements.",
                highlights: ["Per sq ft pricing", "Lift surcharge available", "Minimum $500"],
                example: "50,000 sq ft industrial → ~$9,200",
              },
              {
                key: "fleet_washing" as ServiceCategory,
                icon: <Truck className="w-8 h-8" />,
                title: "Fleet & Vehicle Washing",
                badge: "Recurring Revenue",
                badgeColor: "secondary" as const,
                description: "Commercial fleet accounts for pickup trucks, box trucks, semi rigs, and specialty vehicles. Monthly contracts available.",
                highlights: ["Per-vehicle pricing", "On-site mobile wash", "Contract discounts up to 15%"],
                example: "10 box trucks monthly → ~$950/mo",
              },
              {
                key: "heavy_equipment" as ServiceCategory,
                icon: <Wrench className="w-8 h-8" />,
                title: "Heavy Equipment Washing",
                badge: "Specialty",
                badgeColor: "outline" as const,
                description: "Excavators, bulldozers, skid steers, forklifts and more. Degreasing treatments available for heavily soiled equipment.",
                highlights: ["4 size tiers", "Degreasing add-on", "On-site service"],
                example: "5 excavators w/ degrease → ~$1,700",
              },
            ].map(({ key, icon, title, badge, badgeColor, description, highlights, example }) => (
              <Card
                key={key}
                className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary"
                onClick={() => { setCategory(key); setStep("configure"); }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-primary">{icon}</div>
                    <Badge variant={badgeColor}>{badge}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {h}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground italic border-t pt-2">e.g. {example}</p>
                  <Button className="w-full" size="sm">
                    Get Instant Estimate <ArrowRight className="ml-1 w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Other / custom */}
            <Card className="md:col-span-3 bg-muted/30 border-dashed">
              <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Building2 className="w-8 h-8 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-semibold">Other Commercial or Specialty Project?</p>
                    <p className="text-sm text-muted-foreground">Parking garages, dumpster pads, grease traps, solar panels, boat docks, and more.</p>
                  </div>
                </div>
                <a href="tel:6153909779">
                  <Button variant="outline" className="shrink-0">
                    <Phone className="mr-2 w-4 h-4" /> Call for Custom Quote
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && category && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Configuration panel */}
            <div className="lg:col-span-3 space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setStep("category")} className="mb-0">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              {/* ── Construction Cleanup ── */}
              {category === "construction_cleanup" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HardHat className="w-5 h-5" /> Construction Cleanup Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-1.5">
                      <Label>Cleanup Type</Label>
                      <Select value={cleanupType} onValueChange={(v) => setCleanupType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONSTRUCTION_CLEANUP_RATES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v.label} — ${v.rate}/sq ft
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{CONSTRUCTION_CLEANUP_RATES[cleanupType].description}</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Total Square Footage</Label>
                      <Input
                        type="number"
                        min={500}
                        step={500}
                        value={sqft}
                        onChange={(e) => setSqft(Number(e.target.value))}
                        placeholder="10000"
                      />
                      <p className="text-xs text-muted-foreground">Entire cleanable area of the project</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Number of Floors / Levels</Label>
                      <Input type="number" min={1} max={20} value={floors} onChange={(e) => setFloors(Number(e.target.value))} />
                    </div>

                    <div className="space-y-3">
                      <Label>Add-Ons</Label>
                      {[
                        { key: "lift_required", label: "Aerial / Scissor Lift Required (+$0.04/sq ft)", state: requiresLift, setter: setRequiresLift, isCheckbox: true },
                      ].map(({ key, label, state, setter }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" checked={state as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} className="w-4 h-4 accent-primary" />
                          <span className="text-sm group-hover:text-primary transition-colors">{label}</span>
                        </label>
                      ))}
                      {[
                        { key: "concrete_washout", label: "Concrete Washout Area Cleaning (+$350 min)" },
                        { key: "graffiti_removal", label: "Graffiti Removal (+$450)" },
                        { key: "dumpster_pad", label: "Dumpster Pad / Staging Area (+$275)" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={additionalServices.includes(key)}
                            onChange={() => toggleAdditional(key)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">{label}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Fleet Washing ── */}
              {category === "fleet_washing" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Fleet Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      <Label>Vehicle Count by Type</Label>
                      {fleetVehicles.map((v) => (
                        <div key={v.type} className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{FLEET_RATES[v.type].label}</p>
                            <p className="text-xs text-muted-foreground">${FLEET_RATES[v.type].rate}/vehicle</p>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            value={v.qty}
                            onChange={(e) => setVehicleQty(v.type, Number(e.target.value))}
                            className="w-20 text-center"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Service Frequency</Label>
                      <Select value={fleetFreq} onValueChange={(v) => setFleetFreq(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">One-Time Wash</SelectItem>
                          <SelectItem value="monthly">Monthly Contract (12% off)</SelectItem>
                          <SelectItem value="quarterly">Quarterly Contract (7% off)</SelectItem>
                          <SelectItem value="annual">Annual Contract (15% off)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={fleetOnSite} onChange={(e) => setFleetOnSite(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm">On-site mobile wash (we come to your lot, +$75 setup)</span>
                    </label>
                  </CardContent>
                </Card>
              )}

              {/* ── Heavy Equipment ── */}
              {category === "heavy_equipment" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" /> Equipment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      <Label>Unit Count by Size</Label>
                      {equipUnits.map((u) => (
                        <div key={u.size} className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{EQUIPMENT_RATES[u.size].label}</p>
                            <p className="text-xs text-muted-foreground">{EQUIPMENT_RATES[u.size].description}</p>
                            <p className="text-xs text-primary font-medium">${EQUIPMENT_RATES[u.size].rate}/unit</p>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={50}
                            value={u.qty}
                            onChange={(e) => setEquipQty(u.size, Number(e.target.value))}
                            className="w-20 text-center shrink-0"
                          />
                        </div>
                      ))}
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={degrease} onChange={(e) => setDegrease(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm">Heavy degreasing treatment (+$45/unit) — recommended for machines used with hydraulic fluid, grease, or oil</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={equipOnSite} onChange={(e) => setEquipOnSite(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm">On-site service at your yard/jobsite (+$95 setup fee)</span>
                    </label>
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!hasItems}
                onClick={() => setStep("contact")}
              >
                Continue to Submit Quote <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
              {!hasItems && (
                <p className="text-center text-sm text-muted-foreground">Enter your project details above to see your estimate.</p>
              )}
            </div>

            {/* Price breakdown panel */}
            <div className="lg:col-span-2">
              <div className="sticky top-6 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="w-4 h-4" /> Instant Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lineItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Fill in the details to see your estimate</p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {lineItems.map((item, i) => (
                            <div key={i} className="flex justify-between gap-2 text-sm">
                              <span className="text-muted-foreground flex-1 leading-snug">{item.label}</span>
                              <span className={`font-medium shrink-0 ${item.total < 0 ? "text-green-600" : ""}`}>
                                {item.total < 0 ? "-" : ""}${Math.abs(item.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-3 flex justify-between items-center">
                          <span className="font-semibold">Estimated Total</span>
                          <span className="text-2xl font-bold text-primary">
                            ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Estimate only. Final price confirmed after on-site assessment.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="py-4 text-sm space-y-1">
                    <p className="font-semibold">Why GDS Commercial?</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>✓ Fully insured, licensed operators</li>
                      <li>✓ 2-man crews, fast turnaround</li>
                      <li>✓ Net-30 invoicing available</li>
                      <li>✓ Based in Murfreesboro, TN</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step: Contact */}
        {step === "contact" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Button variant="ghost" size="sm" onClick={() => setStep("configure")} className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Configure
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle>Your Contact Information</CardTitle>
                  <CardDescription>We'll send your quote to this email and follow up within 1 business day.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit((v) => submitMutation.mutate(v))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Your Name *</Label>
                        <Input {...form.register("contactName")} placeholder="Blake Smith" />
                        {form.formState.errors.contactName && <p className="text-xs text-red-500">{form.formState.errors.contactName.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Company (optional)</Label>
                        <Input {...form.register("companyName")} placeholder="Acme Construction" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email *</Label>
                        <Input {...form.register("contactEmail")} type="email" placeholder="you@company.com" />
                        {form.formState.errors.contactEmail && <p className="text-xs text-red-500">{form.formState.errors.contactEmail.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone *</Label>
                        <Input {...form.register("contactPhone")} placeholder="(615) 555-0100" />
                        {form.formState.errors.contactPhone && <p className="text-xs text-red-500">{form.formState.errors.contactPhone.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Site / Project Address *</Label>
                      <Input {...form.register("siteAddress")} placeholder="7735 Florence Road, Smyrna, TN 37167" />
                      {form.formState.errors.siteAddress && <p className="text-xs text-red-500">{form.formState.errors.siteAddress.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Additional Notes</Label>
                      <Textarea {...form.register("notes")} placeholder="Project timeline, access details, special requirements..." rows={3} />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? "Submitting..." : "Submit Quote Request"}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quote Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lineItems.map((item, i) => (
                      <div key={i} className="flex justify-between gap-2 text-sm">
                        <span className="text-muted-foreground flex-1 leading-snug">{item.label}</span>
                        <span className={`font-medium shrink-0 ${item.total < 0 ? "text-green-600" : ""}`}>
                          {item.total < 0 ? "-" : ""}${Math.abs(item.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-semibold">Estimated Total</span>
                      <span className="text-xl font-bold text-primary">
                        ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
