import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { quoteCalculationSchema, type QuoteCalculation, type QuoteResponse, insertQuoteRequestSchema, type InsertQuoteRequest } from "@shared/schema";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

const SERVICE_TYPES = [
  { value: "driveway_restoration", label: "Driveway Restoration" },
  { value: "patio_restoration", label: "Patio Restoration" },
  { value: "walkway_restoration", label: "Walkway Restoration" },
  { value: "pool_deck_restoration", label: "Pool Deck Restoration" },
];

const SURFACE_TYPES = [
  { value: "interlocking_pavers", label: "Interlocking Pavers" },
  { value: "poured_concrete", label: "Poured Concrete" },
  { value: "stamped_concrete", label: "Stamped Concrete" },
  { value: "brick_pavers", label: "Brick Pavers" },
];

const CONDITIONS = [
  { value: "lightly_dirty", label: "Lightly Dirty", description: "General grime, minimal stains" },
  { value: "heavily_soiled", label: "Heavily Soiled", description: "Significant mold, mildew, or deep-set dirt" },
  { value: "stained_damaged", label: "Stained & Damaged", description: "Visible oil/rust stains, cracks, or flaking" },
];

export default function Quote() {
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [contactInfo, setContactInfo] = useState<InsertQuoteRequest | null>(null);
  const { toast } = useToast();

  const form = useForm<QuoteCalculation>({
    resolver: zodResolver(quoteCalculationSchema),
    defaultValues: {
      serviceType: "driveway_restoration",
      surfaceType: "interlocking_pavers",
      length: 30,
      width: 60,
      condition: "lightly_dirty",
      includeSealer: true,
      includePolymericSand: false,
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: QuoteCalculation) => {
      const response = await apiRequest("POST", "/api/calculate-quote", data);
      return await response.json() as QuoteResponse;
    },
    onSuccess: (data) => {
      setQuoteResult(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calculate quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const requestQuoteMutation = useMutation({
    mutationFn: async (data: InsertQuoteRequest) => {
      const response = await apiRequest("POST", "/api/quote-requests", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Received!",
        description: "We'll contact you within 24 hours to discuss your project.",
      });
      setContactInfo(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onCalculate = (data: QuoteCalculation) => {
    calculateMutation.mutate(data);
  };

  const handleRequestQuote = (tier: "basic" | "recommended" | "premium") => {
    const formData = form.getValues();
    setContactInfo({
      name: "",
      email: "",
      phone: "",
      address: "",
      serviceType: formData.serviceType,
      surfaceType: formData.surfaceType,
      length: formData.length,
      width: formData.width,
      condition: formData.condition,
      includeSealer: formData.includeSealer,
      includePolymericSand: formData.includePolymericSand,
    });
  };

  const submitContactInfo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (contactInfo) {
      requestQuoteMutation.mutate(contactInfo);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-page-title">
            Get Your Instant Quote
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional paver restoration with transparent, tiered pricing. 
            Get your estimate in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card data-testid="card-quote-form">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Tell us about your restoration project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCalculate)} className="space-y-6">
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
                              {SERVICE_TYPES.map((service) => (
                                <SelectItem key={service.value} value={service.value}>
                                  {service.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="surfaceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surface Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-surface-type">
                                <SelectValue placeholder="Select surface type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SURFACE_TYPES.map((surface) => (
                                <SelectItem key={surface.value} value={surface.value}>
                                  {surface.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (ft)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-length"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (ft)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-width"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("length") && form.watch("width") && (
                      <div className="p-4 bg-accent rounded-md">
                        <p className="text-sm font-medium">
                          Total Area: <span className="text-lg font-bold" data-testid="text-total-area">
                            {form.watch("length") * form.watch("width")} sq ft
                          </span>
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surface Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-condition">
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CONDITIONS.map((condition) => (
                                <SelectItem key={condition.value} value={condition.value}>
                                  <div>
                                    <div>{condition.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {condition.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormLabel>Add-On Services</FormLabel>
                      
                      <FormField
                        control={form.control}
                        name="includePolymericSand"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-polymeric-sand"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-semibold">
                                Polymeric Sand Application
                              </FormLabel>
                              <FormDescription>
                                Locks pavers together, prevents weeds, and stabilizes the entire surface
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={calculateMutation.isPending}
                      data-testid="button-calculate-quote"
                    >
                      {calculateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Calculate My Quote
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div>
            {quoteResult ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Your Quote Options</h2>
                
                <Card className="border-2" data-testid="card-tier-basic">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{quoteResult.tiers.basic.name}</CardTitle>
                      <Badge variant="secondary">Good</Badge>
                    </div>
                    <CardDescription>{quoteResult.tiers.basic.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-primary" data-testid="text-price-basic">
                        ${quoteResult.tiers.basic.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${(quoteResult.tiers.basic.price / quoteResult.squareFootage).toFixed(2)}/sq ft
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {quoteResult.tiers.basic.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleRequestQuote("basic")}
                      data-testid="button-request-basic"
                    >
                      Request This Quote
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary" data-testid="card-tier-recommended">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{quoteResult.tiers.recommended.name}</CardTitle>
                      <Badge variant="default" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Recommended
                      </Badge>
                    </div>
                    <CardDescription>{quoteResult.tiers.recommended.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-primary" data-testid="text-price-recommended">
                        ${quoteResult.tiers.recommended.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${(quoteResult.tiers.recommended.price / quoteResult.squareFootage).toFixed(2)}/sq ft
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {quoteResult.tiers.recommended.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full"
                      onClick={() => handleRequestQuote("recommended")}
                      data-testid="button-request-recommended"
                    >
                      Request This Quote
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2" data-testid="card-tier-premium">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{quoteResult.tiers.premium.name}</CardTitle>
                      <Badge variant="secondary">Best</Badge>
                    </div>
                    <CardDescription>{quoteResult.tiers.premium.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-primary" data-testid="text-price-premium">
                        ${quoteResult.tiers.premium.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${(quoteResult.tiers.premium.price / quoteResult.squareFootage).toFixed(2)}/sq ft
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {quoteResult.tiers.premium.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleRequestQuote("premium")}
                      data-testid="button-request-premium"
                    >
                      Request This Quote
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    Fill out the form to see your quote options
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {contactInfo && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Enter your details to receive your official quote
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitContactInfo} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    required
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    data-testid="input-contact-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    required
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    data-testid="input-contact-email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    required
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    data-testid="input-contact-phone"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Property Address</label>
                  <Input
                    required
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                    data-testid="input-contact-address"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setContactInfo(null)}
                    data-testid="button-cancel-contact"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={requestQuoteMutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    {requestQuoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
