import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Clock, Award, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-primary/10 to-background py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge variant="secondary" className="mb-4">
            Murfreesboro's Paver Restoration Specialists
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" data-testid="text-hero-title">
            Restore & Protect Your<br />Hardscape Investment
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional paver and concrete restoration services that go beyond cleaning. 
            We repair, stabilize, and protect your driveways, patios, and walkways for lasting beauty.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/quote">
              <Button size="lg" className="gap-2" data-testid="button-get-quote">
                Get Instant Quote
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#services">
              <Button size="lg" variant="outline" data-testid="button-view-services">
                View Services
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're not just another pressure washing company. We're restoration specialists.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="card-feature-specialist">
              <CardHeader>
                <Award className="h-12 w-12 text-primary mb-2" />
                <CardTitle className="text-xl">Restoration Specialists</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Expert in structural repair, polymeric sand application, and advanced protective coatings
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-transparent">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-2" />
                <CardTitle className="text-xl">Transparent Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get instant, accurate quotes with our tiered pricing system. No surprises.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-quality">
              <CardHeader>
                <CheckCircle2 className="h-12 w-12 text-primary mb-2" />
                <CardTitle className="text-xl">Quality Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Professional-grade polymeric sand and premium sealers for long-lasting protection
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-service">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-2" />
                <CardTitle className="text-xl">Fast Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Quick turnaround times without compromising on quality or attention to detail
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive restoration solutions for all your hardscape needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover-elevate transition-all" data-testid="card-service-cleaning">
              <CardHeader>
                <CardTitle className="text-2xl">Professional Cleaning</CardTitle>
                <CardDescription>Remove years of grime, stains, and organic growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>High-pressure washing with professional equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Specialized treatment for oil and rust stains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Eco-friendly cleaning solutions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all" data-testid="card-service-structural">
              <CardHeader>
                <CardTitle className="text-2xl">Structural Repair</CardTitle>
                <CardDescription>Address the root causes of cracking and instability</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Polymeric sand joint restoration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Paver stabilization and locking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Weed and ant prevention</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all" data-testid="card-service-sealing">
              <CardHeader>
                <CardTitle className="text-2xl">Protective Sealing</CardTitle>
                <CardDescription>Guard against future damage and extend lifespan</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Acrylic sealers for color enhancement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Penetrating sealers for freeze-thaw protection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Protection from de-icing salts and UV damage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all" data-testid="card-service-replacement">
              <CardHeader>
                <CardTitle className="text-2xl">Paver Replacement</CardTitle>
                <CardDescription>Replace damaged pavers for a complete restoration</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Source and install matching pavers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Repair severely damaged or crumbling surfaces</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Seamless integration with existing hardscape</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Restore Your Pavers?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get an instant, transparent quote in seconds. No obligation, no pressure.
          </p>
          <Link href="/quote">
            <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-quote">
              Get Your Free Quote Now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
