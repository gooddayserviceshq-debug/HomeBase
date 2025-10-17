import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { 
  Home as HomeIcon, 
  Building2, 
  Fence, 
  Droplet,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calculator
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Service, QuoteResponse, InsertBooking, InsertCustomer } from "@shared/schema";
import { useLocation } from "wouter";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  squareFootage: z.number().min(1, "Square footage is required").max(100000),
  specialInstructions: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function Book() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      squareFootage: 0,
      specialInstructions: "",
    },
  });

  const squareFootage = form.watch("squareFootage");

  const getQuoteMutation = useMutation({
    mutationFn: async (data: { serviceId: string; squareFootage: number }) => {
      const response = await apiRequest("POST", "/api/quotes", data);
      return await response.json() as QuoteResponse;
    },
    onSuccess: (data) => {
      setQuote(data);
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: { customer: InsertCustomer; booking: Omit<InsertBooking, 'customerId'> }) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return await response.json() as { bookingId: string };
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setLocation("/customer");
    },
  });

  const serviceIcons = {
    "House Siding": HomeIcon,
    "Driveway": Building2,
    "Deck & Patio": Fence,
    "Roof Cleaning": Droplet,
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setQuote(null);
    form.setValue("squareFootage", 0);
    setStep(2);
  };

  const handleCalculateQuote = () => {
    if (selectedService && squareFootage > 0) {
      getQuoteMutation.mutate({
        serviceId: selectedService.id,
        squareFootage,
      });
    }
  };

  const handleContinueToSchedule = () => {
    if (quote) {
      setStep(3);
    }
  };

  const handleContinueToDetails = () => {
    if (selectedDate && selectedTime) {
      setStep(4);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!selectedService || !quote || !selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':');
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(parseInt(hours), parseInt(minutes));

    const customer: InsertCustomer = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };

    const booking: Omit<InsertBooking, 'customerId'> = {
      serviceId: selectedService.id,
      squareFootage: data.squareFootage,
      totalPrice: quote.totalPrice.toString(),
      scheduledDate,
      status: "scheduled",
      specialInstructions: data.specialInstructions || null,
    };

    createBookingMutation.mutate({ customer, booking });
  };

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", 
    "13:00", "14:00", "15:00", "16:00"
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Book Your Service</h1>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step > num ? <CheckCircle2 className="h-5 w-5" /> : num}
                </div>
                {num < 4 && <div className={`w-12 h-0.5 ${step > num ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Service</span>
            <span>Quote</span>
            <span>Schedule</span>
            <span>Details</span>
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Select Your Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => {
                const Icon = serviceIcons[service.name as keyof typeof serviceIcons] || Droplet;
                return (
                  <Card 
                    key={service.id} 
                    className="hover-elevate cursor-pointer transition-all"
                    onClick={() => handleServiceSelect(service)}
                    data-testid={`card-service-${service.id}`}
                  >
                    <CardContent className="p-6">
                      <Icon className="h-12 w-12 text-primary mb-3" />
                      <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                      <p className="text-2xl font-bold text-primary mb-2">
                        Starting at ${service.basePrice}
                      </p>
                      <p className="text-muted-foreground text-sm mb-3">{service.description}</p>
                      <Badge variant="secondary">${service.pricePerSqFt}/sq ft</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && selectedService && (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setStep(1)} 
              className="mb-4"
              data-testid="button-back-to-services"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Services
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  Calculate Your Quote
                </CardTitle>
                <CardDescription>
                  Get an instant price estimate for {selectedService.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="squareFootage">Square Footage</Label>
                  <Input
                    id="squareFootage"
                    type="number"
                    placeholder="Enter area in square feet"
                    {...form.register("squareFootage", { valueAsNumber: true })}
                    data-testid="input-square-footage"
                  />
                  {form.formState.errors.squareFootage && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.squareFootage.message}
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleCalculateQuote}
                  disabled={!squareFootage || squareFootage <= 0}
                  className="w-full"
                  data-testid="button-calculate-quote"
                >
                  Calculate Quote
                </Button>

                {quote && quote.basePrice !== undefined && (
                  <div className="bg-primary/5 rounded-lg p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span className="font-semibold">${Number(quote.basePrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Area Charge ({squareFootage} sq ft):</span>
                      <span className="font-semibold">${Number(quote.areaPrice).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Price:</span>
                      <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
                        ${Number(quote.totalPrice).toFixed(2)}
                      </span>
                    </div>
                    <Button 
                      onClick={handleContinueToSchedule}
                      className="w-full mt-4"
                      data-testid="button-continue-schedule"
                    >
                      Continue to Schedule <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setStep(2)} 
              className="mb-4"
              data-testid="button-back-to-quote"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quote
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>
                  Choose your preferred appointment date and time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    className="rounded-md border"
                    data-testid="calendar-booking"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <Label>Select Time</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="w-full"
                          data-testid={`button-time-${time}`}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDate && selectedTime && (
                  <Button 
                    onClick={handleContinueToDetails}
                    className="w-full"
                    data-testid="button-continue-details"
                  >
                    Continue to Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setStep(3)} 
              className="mb-4"
              data-testid="button-back-to-schedule"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Schedule
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
                <CardDescription>
                  Enter your contact information to complete the booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Address</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="min-h-32"
                              placeholder="Any special requirements or notes for our team..."
                              data-testid="input-instructions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {quote && quote.totalPrice !== undefined && selectedDate && selectedTime && (
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold">Booking Summary</h4>
                        <p className="text-sm text-muted-foreground">
                          Service: {selectedService?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Date: {selectedDate.toLocaleDateString()} at {selectedTime}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Area: {squareFootage} sq ft
                        </p>
                        <p className="text-lg font-bold text-primary">
                          Total: ${Number(quote.totalPrice).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createBookingMutation.isPending}
                      data-testid="button-confirm-booking"
                    >
                      {createBookingMutation.isPending ? "Confirming..." : "Confirm Booking"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
