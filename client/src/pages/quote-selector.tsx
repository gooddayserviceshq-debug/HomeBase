import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Droplets, Home, Calculator, CheckCircle2 } from "lucide-react";

export default function QuoteSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get Your Free Quote</h1>
          <p className="text-lg text-muted-foreground">
            Choose the service type that best fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Paver Restoration Quote */}
          <Card className="relative hover:shadow-xl transition-shadow">
            <Badge className="absolute -top-3 -right-3" variant="default">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-6 w-6 text-primary" />
                Paver & Surface Restoration
              </CardTitle>
              <CardDescription>
                Professional restoration for driveways, patios, walkways, and pool decks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold">Perfect for:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Interlocking pavers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Stamped & poured concrete
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Brick pavers
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Services include:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Deep cleaning & stain removal</li>
                    <li>• Polymeric sand installation</li>
                    <li>• Professional sealing (5-7 year protection)</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Pricing:</p>
                  <p className="text-lg font-semibold">Based on square footage</p>
                  <p className="text-sm text-muted-foreground">Three service tiers available</p>
                </div>

                <Button asChild className="w-full" size="lg" data-testid="button-paver-quote">
                  <Link href="/quote/restoration">
                    <Calculator className="mr-2 h-4 w-4" />
                    Get Restoration Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Property Cleaning Quote */}
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                Complete Property Cleaning
              </CardTitle>
              <CardDescription>
                Full exterior cleaning service for your entire property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold">Surfaces cleaned:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Driveways
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Roofs & siding
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Gutters & fences
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Fixed pricing:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Driveway: $300</li>
                    <li>• Roof: $300</li>
                    <li>• Siding: $300</li>
                    <li>• Gutters: $300</li>
                    <li>• Fence: $75-150/side</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    $975 Minimum Service Charge
                  </Badge>
                </div>

                <Button asChild className="w-full" size="lg" variant="outline" data-testid="button-cleaning-quote">
                  <Link href="/property-cleaning">
                    <Calculator className="mr-2 h-4 w-4" />
                    Get Cleaning Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Not sure which service you need? Call us at{" "}
            <a href="tel:615-555-0100" className="font-semibold text-primary hover:underline">
              (615) 555-0100
            </a>{" "}
            for a free consultation
          </p>
        </div>
      </div>
    </div>
  );
}