import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Calendar, CheckCircle, XCircle, AlertCircle, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Warranty } from "@shared/schema";

const warrantySchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone must be at least 10 digits"),
  propertyAddress: z.object({
    street: z.string().min(5, "Street address required"),
    city: z.string().min(2, "City required"),
    state: z.string().length(2, "State must be 2 characters"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  }),
  serviceType: z.string().min(1, "Service type required"),
  warrantyLength: z.coerce.number().min(12, "Minimum warranty is 12 months"),
});

type WarrantyFormData = z.infer<typeof warrantySchema>;

export default function Warranties() {
  const { isAuthenticated } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const { toast } = useToast();

  // Fetch warranties
  const { data: warranties = [], isLoading } = useQuery<Warranty[]>({
    queryKey: ["/api/warranties"],
    enabled: isAuthenticated,
  });

  const form = useForm<WarrantyFormData>({
    resolver: zodResolver(warrantySchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      propertyAddress: {
        street: "",
        city: "",
        state: "TN",
        zip: "",
      },
      serviceType: "",
      warrantyLength: 24,
    },
  });

  // Register warranty mutation
  const registerWarrantyMutation = useMutation({
    mutationFn: async (data: WarrantyFormData) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + data.warrantyLength);

      const response = await fetch("/api/warranties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to register warranty");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warranties"] });
      toast({
        title: "Warranty Registered",
        description: "The warranty has been successfully registered.",
      });
      setShowRegistration(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WarrantyFormData) => {
    registerWarrantyMutation.mutate(data);
  };

  const activeWarranties = warranties.filter(w => w.status === "active");
  const expiredWarranties = warranties.filter(w => w.status === "expired");

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Sign In Required</h2>
              <p className="text-muted-foreground">
                Please sign in to view and register warranties.
              </p>
              <Button onClick={() => window.location.href = "/api/login"} data-testid="button-signin">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Warranty Management</h1>
          <p className="text-muted-foreground">
            Register and manage service warranties for your customers
          </p>
        </div>
        <Button onClick={() => setShowRegistration(!showRegistration)} data-testid="button-register-warranty">
          <Plus className="w-4 h-4 mr-2" />
          Register Warranty
        </Button>
      </div>

      {showRegistration && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Register New Warranty</CardTitle>
            <CardDescription>
              Create a warranty certificate for completed service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Smith" data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="john@example.com" data-testid="input-customer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" data-testid="input-customer-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service-type">
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="driveway_restoration">Driveway Restoration</SelectItem>
                            <SelectItem value="patio_restoration">Patio Restoration</SelectItem>
                            <SelectItem value="walkway_restoration">Walkway Restoration</SelectItem>
                            <SelectItem value="pool_deck_restoration">Pool Deck Restoration</SelectItem>
                            <SelectItem value="full_property">Full Property Service</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Property Address</h3>
                  <FormField
                    control={form.control}
                    name="propertyAddress.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Main St" data-testid="input-property-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="propertyAddress.city"
                      render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Murfreesboro" data-testid="input-property-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="propertyAddress.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="TN" maxLength={2} data-testid="input-property-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="propertyAddress.zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="37130" data-testid="input-property-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="warrantyLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Period (months)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-warranty-length">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="12">12 Months (1 Year)</SelectItem>
                          <SelectItem value="24">24 Months (2 Years)</SelectItem>
                          <SelectItem value="36">36 Months (3 Years)</SelectItem>
                          <SelectItem value="48">48 Months (4 Years)</SelectItem>
                          <SelectItem value="60">60 Months (5 Years)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={registerWarrantyMutation.isPending}
                  data-testid="button-submit-warranty"
                >
                  {registerWarrantyMutation.isPending ? "Registering..." : "Register Warranty"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({activeWarranties.length})
          </TabsTrigger>
          <TabsTrigger value="expired" data-testid="tab-expired">
            Expired ({expiredWarranties.length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({warranties.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <WarrantyList warranties={activeWarranties} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="expired" className="mt-0">
          <WarrantyList warranties={expiredWarranties} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <WarrantyList warranties={warranties} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WarrantyList({ warranties, isLoading }: { warranties: Warranty[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (warranties.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No warranties found</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {warranties.map((warranty) => {
        const startDate = new Date(warranty.startDate);
        const endDate = new Date(warranty.endDate);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = warranty.status === "expired" || daysRemaining < 0;

        return (
          <Card key={warranty.id} data-testid={`card-warranty-${warranty.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{warranty.customerName}</CardTitle>
                  <CardDescription>
                    {warranty.warrantyNumber}
                  </CardDescription>
                </div>
                <Badge variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                  {warranty.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">Service Type</p>
                  <p className="font-medium">{warranty.serviceType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                
                <div className="text-sm">
                  <p className="text-muted-foreground">Property</p>
                  <p className="font-medium">
                    {warranty.propertyAddress.street}<br />
                    {warranty.propertyAddress.city}, {warranty.propertyAddress.state} {warranty.propertyAddress.zip}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{startDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{endDate.toLocaleDateString()}</p>
                  </div>
                </div>

                {!isExpired && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      {daysRemaining} days remaining
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  data-testid={`button-view-certificate-${warranty.id}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}