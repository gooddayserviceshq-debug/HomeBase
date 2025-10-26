import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart,
  FileText, MapPin, Clock, AlertCircle, CheckCircle,
  ChevronRight, Calendar, Activity, Target, Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

interface KeyMetrics {
  totalQuotes: number;
  totalCustomers: number;
  totalRevenue: number;
  avgQuoteValue: number;
  conversionRate: number;
  activeWarranties: number;
  pendingInquiries: number;
  repeatCustomerRate: string;
}

interface Analytics {
  keyMetrics: KeyMetrics;
  serviceBreakdown: {
    paverRestoration: number;
    propertyCleaning: number;
    products: number;
    warranties: number;
  };
  monthlyTrends: {
    quotes: Array<{ month: string; count: number }>;
    revenue: Array<{ month: string; amount: number }>;
  };
  geographicDistribution: Array<{ city: string; count: number }>;
  recentActivity: Array<{
    type: string;
    date: string;
    value: string | number;
    customer: string;
  }>;
  quoteAnalytics: {
    restoration: { total: number; recent: number; avgValue: number };
    cleaning: { total: number; recent: number; avgValue: number };
  };
}

// Chart colors
const COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CEODashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const typedUser = user as User | undefined;
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "Please log in to access the CEO dashboard",
        variant: "destructive"
      });
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/ceo/analytics"],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-center">Failed to load analytics data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { keyMetrics } = analytics;
  const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Prepare data for service breakdown pie chart
  const serviceData = [
    { name: 'Paver Restoration', value: analytics.serviceBreakdown.paverRestoration },
    { name: 'Property Cleaning', value: analytics.serviceBreakdown.propertyCleaning },
    { name: 'Products', value: analytics.serviceBreakdown.products },
    { name: 'Active Warranties', value: analytics.serviceBreakdown.warranties },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            CEO Dashboard
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              Welcome, {typedUser?.firstName || 'CEO'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              Admin Panel
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(keyMetrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1 text-green-600" />
                Estimated from quotes + orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keyMetrics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {keyMetrics.repeatCustomerRate}% repeat rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keyMetrics.totalQuotes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg value: {formatCurrency(keyMetrics.avgQuoteValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keyMetrics.conversionRate}%</div>
              <Progress value={keyMetrics.conversionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full max-w-[600px] grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthlyTrends.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="amount" stroke="#1e40af" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Breakdown</CardTitle>
                  <CardDescription>Distribution of services</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={serviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Top cities by service requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.geographicDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quote Volume Trend</CardTitle>
                  <CardDescription>Monthly quote submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyTrends.quotes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#1e40af" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quote Analytics</CardTitle>
                  <CardDescription>Performance by service type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Paver Restoration</h4>
                    <div className="space-y-1 text-sm">
                      <p>Total Quotes: <span className="font-bold">{analytics.quoteAnalytics.restoration.total}</span></p>
                      <p>Recent (30 days): <span className="font-bold">{analytics.quoteAnalytics.restoration.recent}</span></p>
                      <p>Average Value: <span className="font-bold">{formatCurrency(analytics.quoteAnalytics.restoration.avgValue)}</span></p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Property Cleaning</h4>
                    <div className="space-y-1 text-sm">
                      <p>Total Quotes: <span className="font-bold">{analytics.quoteAnalytics.cleaning.total}</span></p>
                      <p>Recent (30 days): <span className="font-bold">{analytics.quoteAnalytics.cleaning.recent}</span></p>
                      <p>Average Value: <span className="font-bold">{formatCurrency(analytics.quoteAnalytics.cleaning.avgValue)}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pending Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{keyMetrics.pendingInquiries}</span>
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Active Warranties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{keyMetrics.activeWarranties}</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Total Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{keyMetrics.totalQuotes}</span>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Customers</span>
                    <span className="font-bold">{keyMetrics.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Repeat Rate</span>
                    <span className="font-bold">{keyMetrics.repeatCustomerRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Quote Value</span>
                    <span className="font-bold">{formatCurrency(keyMetrics.avgQuoteValue)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Top Service Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.geographicDistribution.slice(0, 5).map((city, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{city.city}</span>
                        </div>
                        <Badge variant="secondary">{city.count} requests</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Last 7 days of customer interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${
                            activity.type === 'order' ? 'bg-green-600' :
                            activity.type === 'inquiry' ? 'bg-orange-600' :
                            'bg-blue-600'
                          }`} />
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {activity.type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.customer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {typeof activity.value === 'number' ? formatCurrency(activity.value) : activity.value}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin")}>
                <Activity className="h-5 w-5" />
                <span className="text-xs">View Admin Panel</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/quotes")}>
                <FileText className="h-5 w-5" />
                <span className="text-xs">Manage Quotes</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => window.location.href = "/api/customers/export"}>
                <Users className="h-5 w-5" />
                <span className="text-xs">Export Customers</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/contact")}>
                <AlertCircle className="h-5 w-5" />
                <span className="text-xs">View Inquiries</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}