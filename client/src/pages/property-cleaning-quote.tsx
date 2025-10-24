import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Home, Droplets, Building, Wrench, Trees, CheckCircle2, Calculator, AlertCircle } from "lucide-react";
import { z } from "zod";

const propertyCleaningFormSchema = z.object({
  // Services
  driveway: z.boolean().default(false),
  roof: z.boolean().default(false),
  siding: z.boolean().default(false),
  gutters: z.boolean().default(false),
  fenceSides: z.number().min(0).max(4).default(0),
  fencePricePerSide: z.number().min(75).max(150).default(75),
  
  // Customer Info
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().min(10, "Please enter a valid phone number"),
  propertyAddress: z.string().min(10, "Please enter your complete property address"),
  additionalNotes: z.string().optional(),
});

type PropertyCleaningForm = z.infer<typeof propertyCleaningFormSchema>;

interface CalculationResult {
  breakdown: Array<{ service: string; price: number }>;
  itemizedTotal: number;
  minimumServiceCharge: number;
  minimumApplied: boolean;
  finalTotal: number;
}

export default function PropertyCleaningQuote() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<PropertyCleaningForm>({
    resolver: zodResolver(propertyCleaningFormSchema),
    defaultValues: {
      driveway: false,
      roof: false,
      siding: false,
      gutters: false,
      fenceSides: 0,
      fencePricePerSide: 75,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      propertyAddress: "",
      additionalNotes: "",
    },
  });

  const watchedValues = form.watch(["driveway", "roof", "siding", "gutters", "fenceSides", "fencePricePerSide"]);

  // Auto-calculate when services change
  useEffect(() => {
    const [driveway, roof, siding, gutters, fenceSides, fencePricePerSide] = watchedValues;
    
    if (driveway || roof || siding || gutters || fenceSides > 0) {
      calculateMutation.mutate({
        driveway,
        roof,
        siding,
        gutters,
        fenceSides,
        fencePricePerSide,
      });
    } else {
      setCalculationResult(null);
    }
  }, watchedValues);

  const calculateMutation = useMutation({
    mutationFn: async (data: { 
      driveway: boolean;
      roof: boolean;
      siding: boolean;
      gutters: boolean;
      fenceSides: number;
      fencePricePerSide: number;
    }) => {
      const response = await apiRequest("POST", "/api/property-cleaning/calculate", data);
      return await response.json() as CalculationResult;
    },
    onSuccess: (data) => {
      setCalculationResult(data);
    },
    onError: () => {
      toast({
        title: "Calculation Error",
        description: "Failed to calculate quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: PropertyCleaningForm) => {
      const { customerName, customerEmail, customerPhone, propertyAddress, additionalNotes, ...services } = data;
      
      const response = await apiRequest("POST", "/api/property-cleaning/submit", {
        customerInfo: {
          customerName,
          customerEmail,
          customerPhone,
          propertyAddress,
          additionalNotes,
        },
        services,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your service.",
      });
      form.reset();
      setShowContactForm(false);
      setCalculationResult(null);
    },
    onError: () => {
      toast({
        title: "Submission Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PropertyCleaningForm) => {
    submitMutation.mutate(data);
  };

  const hasSelectedServices = watchedValues.some(v => v === true || (typeof v === "number" && v > 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Complete Property Cleaning Quote</h1>
          <p className="text-lg text-muted-foreground">
            Professional cleaning for every surface - $975 minimum service charge
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Select Cleaning Services
            </CardTitle>
            <CardDescription>
              Choose the surfaces you'd like us to clean. Prices are fixed per surface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Surface Services */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="driveway"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-driveway"
                          />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="flex items-center justify-between cursor-pointer">
                            <span className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              Driveway Cleaning
                            </span>
                            <Badge variant="secondary">$300</Badge>
                          </FormLabel>
                          <FormDescription>
                            Complete pressure washing of driveway surface
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roof"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-roof"
                          />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="flex items-center justify-between cursor-pointer">
                            <span className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Roof Cleaning
                            </span>
                            <Badge variant="secondary">$300</Badge>
                          </FormLabel>
                          <FormDescription>
                            Safe, soft-wash cleaning for all roof types
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siding"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-siding"
                          />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="flex items-center justify-between cursor-pointer">
                            <span className="flex items-center gap-2">
                              <Wrench className="h-4 w-4" />
                              House Siding
                            </span>
                            <Badge variant="secondary">$300</Badge>
                          </FormLabel>
                          <FormDescription>
                            Full exterior siding cleaning
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gutters"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-gutters"
                          />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="flex items-center justify-between cursor-pointer">
                            <span className="flex items-center gap-2">
                              <Droplets className="h-4 w-4" />
                              Gutters Cleaning
                            </span>
                            <Badge variant="secondary">$300</Badge>
                          </FormLabel>
                          <FormDescription>
                            Clean and flush all gutters and downspouts
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fence Cleaning */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trees className="h-4 w-4" />
                      Fence Cleaning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fenceSides"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Fence Sides</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              className="flex flex-wrap gap-2"
                            >
                              {[0, 1, 2, 3, 4].map((num) => (
                                <div key={num} className="flex items-center">
                                  <RadioGroupItem value={num.toString()} id={`fence-${num}`} />
                                  <label
                                    htmlFor={`fence-${num}`}
                                    className="ml-2 cursor-pointer"
                                  >
                                    {num === 0 ? "None" : `${num} ${num === 1 ? "side" : "sides"}`}
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("fenceSides") > 0 && (
                      <FormField
                        control={form.control}
                        name="fencePricePerSide"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fence Size</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value.toString()}
                                onValueChange={(value) => field.onChange(parseInt(value))}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="75" id="fence-small" />
                                  <label htmlFor="fence-small" className="cursor-pointer flex items-center gap-2">
                                    Small/Standard Fence
                                    <Badge variant="secondary">$75 per side</Badge>
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="150" id="fence-large" />
                                  <label htmlFor="fence-large" className="cursor-pointer flex items-center gap-2">
                                    Large/Privacy Fence
                                    <Badge variant="secondary">$150 per side</Badge>
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Quote Summary */}
                {calculationResult && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle>Quote Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {calculationResult.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.service}</span>
                          <span className="font-semibold">${item.price}</span>
                        </div>
                      ))}
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between text-muted-foreground">
                        <span>Itemized Total:</span>
                        <span>${calculationResult.itemizedTotal.toFixed(2)}</span>
                      </div>
                      
                      {calculationResult.minimumApplied && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Minimum service charge of ${calculationResult.minimumServiceCharge} applied
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex justify-between text-xl font-bold pt-2 border-t">
                        <span>Total Quote:</span>
                        <span className="text-primary">${calculationResult.finalTotal.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contact Form */}
                {hasSelectedServices && (
                  <>
                    {!showContactForm && (
                      <div className="text-center">
                        <Button
                          type="button"
                          size="lg"
                          onClick={() => setShowContactForm(true)}
                          data-testid="button-proceed-contact"
                        >
                          Proceed to Contact Information
                        </Button>
                      </div>
                    )}

                    {showContactForm && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Contact Information</CardTitle>
                          <CardDescription>
                            Please provide your details so we can schedule your service
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="customerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="John Doe" data-testid="input-name" />
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
                                    <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
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
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="(615) 555-0100" data-testid="input-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="propertyAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Property Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="123 Main St, Murfreesboro, TN 37130" data-testid="input-address" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="additionalNotes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Any special instructions or access notes..."
                                    rows={3}
                                    data-testid="textarea-notes"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            size="lg" 
                            className="w-full"
                            disabled={submitMutation.isPending}
                            data-testid="button-submit-quote"
                          >
                            {submitMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Submit Quote Request
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}