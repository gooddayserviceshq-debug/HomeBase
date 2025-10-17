import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleReviewGenerator } from "@/components/google-review-generator";
import { 
  Calendar,
  Clock,
  MapPin,
  FileText,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Booking, Customer, Service } from "@shared/schema";

type BookingWithDetails = Booking & {
  customer: Customer;
  service: Service;
};

export default function CustomerDashboard() {
  const [customerEmail, setCustomerEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/customer", searchEmail],
    enabled: !!searchEmail,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEmail(customerEmail);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-chart-2 text-white";
      case "in-progress":
        return "bg-chart-3 text-white";
      case "scheduled":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const upcomingBookings = bookings.filter(b => 
    b.status === "scheduled" && new Date(b.scheduledDate) >= new Date()
  );
  
  const pastBookings = bookings.filter(b => 
    b.status === "completed" || new Date(b.scheduledDate) < new Date()
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Appointments</h1>
          <p className="text-muted-foreground">View and manage your pressure washing services</p>
        </div>

        {!searchEmail ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Your Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="email">Enter your email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    data-testid="input-customer-email"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-view-appointments">
                  View My Appointments
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">
                Showing appointments for: <span className="font-semibold text-foreground">{searchEmail}</span>
              </p>
              <Button 
                variant="outline" 
                onClick={() => { setSearchEmail(""); setCustomerEmail(""); }}
                data-testid="button-change-email"
              >
                Change Email
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Quick Actions</h2>
              <Button asChild data-testid="button-book-new">
                <Link href="/book">
                  <Plus className="h-4 w-4 mr-2" />
                  Book New Service
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your appointments...</p>
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any appointments yet.
                  </p>
                  <Button asChild data-testid="button-book-first">
                    <Link href="/book">Book Your First Service</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {upcomingBookings.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Upcoming Appointments</h3>
                    <div className="grid gap-4">
                      {upcomingBookings.map((booking) => (
                        <Card key={booking.id} className="hover-elevate" data-testid={`card-booking-${booking.id}`}>
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-xl font-semibold">{booking.service.name}</h4>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{booking.customer.address}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>{booking.squareFootage} sq ft</span>
                                  </div>
                                </div>
                                {booking.specialInstructions && (
                                  <p className="mt-3 text-sm bg-muted p-3 rounded-md">
                                    <span className="font-semibold">Special Instructions:</span> {booking.specialInstructions}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary" data-testid={`text-price-${booking.id}`}>
                                  ${parseFloat(booking.totalPrice).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {pastBookings.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Service History</h3>
                    <div className="grid gap-4">
                      {pastBookings.map((booking) => (
                        <Card key={booking.id} className="opacity-75" data-testid={`card-past-booking-${booking.id}`}>
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-lg font-semibold">{booking.service.name}</h4>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                                  <p>{booking.customer.address}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-lg font-semibold">
                                  ${parseFloat(booking.totalPrice).toFixed(2)}
                                </p>
                                <Button variant="outline" size="sm" asChild data-testid={`button-book-again-${booking.id}`}>
                                  <Link href="/book">Book Again</Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {pastBookings.length > 0 && (
                  <div className="mt-8">
                    <GoogleReviewGenerator variant="card" />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
