import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Users, FileText,
  AlertTriangle, CheckCircle, Lightbulb, Target, Send,
  BrainCircuit, ShieldCheck, Activity, RefreshCw, ArrowUpRight,
  Package, Handshake,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface FinancialSummary {
  revenue: {
    totalEstimated: number;
    productRevenue: number;
    estimatedServiceRevenue: number;
    contractRevenue: number;
    recentMonthRevenue: number;
    prevMonthRevenue: number;
    revenueGrowthPct: string;
    monthlyTrend: Array<{ month: string; amount: number }>;
  };
  pipeline: {
    totalQuotes: number;
    restorationQuotes: number;
    cleaningQuotes: number;
    pipelineValue: number;
    recentQuotes30d: number;
    prevQuotes30d: number;
    avgRestorationValue: number;
    avgCleaningValue: number;
    tierBreakdown: { basic: number; recommended: number; premium: number };
    estimatedConversionRate: number;
  };
  customers: { totalUnique: number; pendingInquiries: number };
  contracts: { total: number; active: number; draft: number; totalContractValue: number };
  products: { totalProducts: number; totalOrders: number; avgOrderValue: number; lowStockCount: number };
  warranties: { active: number; expired: number; claimed: number };
  minimumJobSize: number;
}

interface AiAnalysis {
  headline?: string;
  healthScore?: number;
  revenueInsight?: string;
  pricingInsight?: string;
  growthOpportunity?: string;
  riskAlert?: string;
  topRecommendations?: string[];
  cashFlowNote?: string;
}

interface CfoData {
  financialSummary: FinancialSummary;
  aiAnalysis: AiAnalysis;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function HealthMeter({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-600" : score >= 45 ? "text-yellow-600" : "text-red-600";
  const label = score >= 70 ? "Healthy" : score >= 45 ? "Caution" : "Needs Attention";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-5xl font-black ${color}`}>{score}</div>
      <div className="text-sm text-muted-foreground">/ 100</div>
      <Badge variant={score >= 70 ? "default" : score >= 45 ? "secondary" : "destructive"}>
        {label}
      </Badge>
      <Progress value={score} className="w-full mt-1" />
    </div>
  );
}

export default function CFODashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const typedUser = user as User | undefined;
  const { toast } = useToast();

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your CFO Advisor for Good Day Services. I have access to your live business data and can answer financial questions, model scenarios, or highlight risks. What would you like to know?",
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
      toast({ title: "Access Denied", description: "Please log in", variant: "destructive" });
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  const { data, isLoading, refetch, isRefetching } = useQuery<CfoData>({
    queryKey: ["/api/cfo/analysis"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const apiHistory = chatHistory
        .filter(m => m.role !== "assistant" || chatHistory.indexOf(m) > 0)
        .map(m => ({ role: m.role, content: m.content }));
      const res = await apiRequest("POST", "/api/cfo/chat", {
        message,
        conversationHistory: apiHistory,
      });
      return (res as { reply: string }).reply;
    },
    onSuccess: (reply) => {
      setChatHistory(prev => [...prev, { role: "assistant", content: reply }]);
    },
    onError: () => {
      toast({ title: "Chat error", description: "Failed to get a response", variant: "destructive" });
    },
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = () => {
    const msg = chatInput.trim();
    if (!msg || chatMutation.isPending) return;
    setChatHistory(prev => [...prev, { role: "user", content: msg }]);
    setChatInput("");
    chatMutation.mutate(msg);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Generating CFO analysis…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p>Failed to load CFO analysis. Check your AI service configuration.</p>
            <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { financialSummary: fs, aiAnalysis: ai } = data;
  const growthPositive = fs.revenue.revenueGrowthPct !== "N/A" && parseFloat(fs.revenue.revenueGrowthPct) >= 0;
  const tierTotal = fs.pipeline.tierBreakdown.basic + fs.pipeline.tierBreakdown.recommended + fs.pipeline.tierBreakdown.premium;
  const tierData = [
    { name: "Basic", value: fs.pipeline.tierBreakdown.basic },
    { name: "Recommended", value: fs.pipeline.tierBreakdown.recommended },
    { name: "Premium", value: fs.pipeline.tierBreakdown.premium },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6 gap-4">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">CFO Advisor</h1>
          <Badge variant="secondary" className="ml-1">AI-Powered</Badge>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, {typedUser?.firstName || "Advisor"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/ceo-dashboard")}>
              CEO View
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              Admin
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* AI Headline Banner */}
        {ai.headline && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm font-medium">{ai.headline}</p>
            </CardContent>
          </Card>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                Financial Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HealthMeter score={ai.healthScore ?? 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Est. Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(fs.revenue.totalEstimated)}</div>
              <p className="text-xs text-muted-foreground mt-1">All channels combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Pipeline</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(fs.pipeline.pipelineValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">{fs.pipeline.totalQuotes} open quotes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">30-Day Orders</CardTitle>
              {growthPositive
                ? <TrendingUp className="h-4 w-4 text-green-600" />
                : <TrendingDown className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(fs.revenue.recentMonthRevenue)}</div>
              <p className={`text-xs mt-1 ${growthPositive ? "text-green-600" : "text-red-500"}`}>
                {fs.revenue.revenueGrowthPct !== "N/A"
                  ? `${growthPositive ? "+" : ""}${fs.revenue.revenueGrowthPct}% vs prior 30d`
                  : "No prior period data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fs.customers.totalUnique}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {fs.customers.pendingInquiries} pending inquiries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Contracts</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fs.contracts.active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {fs.contracts.draft} drafts pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList className="grid w-full max-w-[500px] grid-cols-4">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="chat">CFO Chat</TabsTrigger>
          </TabsList>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ai.revenueInsight && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Revenue Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{ai.revenueInsight}</p>
                  </CardContent>
                </Card>
              )}

              {ai.pricingInsight && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Pricing Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{ai.pricingInsight}</p>
                  </CardContent>
                </Card>
              )}

              {ai.growthOpportunity && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      Growth Opportunity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{ai.growthOpportunity}</p>
                  </CardContent>
                </Card>
              )}

              {ai.riskAlert && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Risk Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{ai.riskAlert}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recommendations */}
            {ai.topRecommendations && ai.topRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Top CFO Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {ai.topRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Cash Flow Note */}
            {ai.cashFlowNote && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Cash Flow Note
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{ai.cashFlowNote}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Financial Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Estimated contributions by channel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Service Revenue (est.)", value: fs.revenue.estimatedServiceRevenue, total: fs.revenue.totalEstimated },
                  { label: "Product Sales", value: fs.revenue.productRevenue, total: fs.revenue.totalEstimated },
                  { label: "Contract Revenue", value: fs.revenue.contractRevenue, total: fs.revenue.totalEstimated },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{fmt(item.value)}</span>
                    </div>
                    <Progress
                      value={item.total > 0 ? (item.value / item.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Product Revenue</CardTitle>
                <CardDescription>Last 6 months of order revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={fs.revenue.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="amount" stroke="#1e40af" fill="#3b82f6" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{fmt(fs.products.avgOrderValue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{fs.products.totalOrders} total orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Restoration Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{fmt(fs.pipeline.avgRestorationValue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{fs.pipeline.restorationQuotes} quotes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Cleaning Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{fmt(fs.pipeline.avgCleaningValue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{fs.pipeline.cleaningQuotes} quotes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Product Inventory Risk</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{fs.products.lowStockCount}</div>
                    <p className="text-xs text-muted-foreground">products low on stock</p>
                  </div>
                  {fs.products.lowStockCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">Action Needed</Badge>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Warranty Exposure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Active</span>
                    <span className="font-bold text-green-600">{fs.warranties.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expired</span>
                    <span className="font-bold text-muted-foreground">{fs.warranties.expired}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Claimed</span>
                    <span className="font-bold text-orange-600">{fs.warranties.claimed}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quote Tier Preference</CardTitle>
                  <CardDescription>Which tier customers select most</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={tierData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1e40af" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Summary</CardTitle>
                  <CardDescription>Current quote activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Pipeline Value</span>
                    <span className="font-bold text-lg">{fmt(fs.pipeline.pipelineValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estimated at 30% conversion</span>
                    <span className="font-bold text-green-600">
                      {fmt(fs.pipeline.pipelineValue * 0.30)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quotes last 30 days</span>
                    <Badge variant="outline">{fs.pipeline.recentQuotes30d}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quotes prior 30 days</span>
                    <Badge variant="outline">{fs.pipeline.prevQuotes30d}</Badge>
                  </div>
                  {tierTotal > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Tier mix</p>
                      <div className="flex gap-2 flex-wrap">
                        {tierData.map(t => (
                          <Badge key={t.name} variant="secondary">
                            {t.name}: {tierTotal > 0 ? Math.round((t.value / tierTotal) * 100) : 0}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Service Revenue Mix</CardTitle>
                <CardDescription>Restoration vs cleaning pipeline breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Paver Restoration", value: fs.pipeline.avgRestorationValue * fs.pipeline.restorationQuotes, count: fs.pipeline.restorationQuotes },
                  { label: "Property Cleaning", value: fs.pipeline.avgCleaningValue * fs.pipeline.cleaningQuotes, count: fs.pipeline.cleaningQuotes },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label} <span className="text-muted-foreground">({item.count} quotes)</span></span>
                      <span className="font-medium">{fmt(item.value)}</span>
                    </div>
                    <Progress
                      value={fs.pipeline.pipelineValue > 0 ? (item.value / fs.pipeline.pipelineValue) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Minimum Job Floor</CardTitle>
                <CardDescription>Pricing protection metrics</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div>
                  <div className="text-3xl font-bold">{fmt(fs.minimumJobSize)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Minimum property cleaning charge</p>
                </div>
                <div className="text-sm text-muted-foreground max-w-xs">
                  This floor protects margin on small jobs. Ensure all cleaning quotes reflect this minimum.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CFO Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Chat with Your CFO Advisor
                </CardTitle>
                <CardDescription>Ask financial questions, model scenarios, or get strategic guidance</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 pt-4 min-h-0">
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-4">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground animate-pulse">
                          CFO is analyzing…
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                </ScrollArea>

                <div className="flex gap-2 mt-auto">
                  <Input
                    placeholder="Ask your CFO anything…"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    disabled={chatMutation.isPending}
                  />
                  <Button onClick={handleSend} disabled={chatMutation.isPending || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Suggested prompts */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    "What's my estimated revenue this month?",
                    "Should I raise my prices?",
                    "What's my biggest financial risk?",
                    "How can I grow faster?",
                  ].map(prompt => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => { setChatInput(prompt); }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
