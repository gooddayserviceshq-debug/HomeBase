import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Droplet, 
  Home as HomeIcon, 
  Building2, 
  Fence, 
  Check, 
  Calendar, 
  Calculator, 
  CheckCircle2,
  Star
} from "lucide-react";
import heroImage from "@assets/generated_images/Pressure_washed_home_hero_0686183a.png";

export default function Home() {
  const services = [
    {
      icon: HomeIcon,
      name: "House Siding",
      price: 199,
      description: "Restore your home's exterior to pristine condition with our gentle yet effective cleaning."
    },
    {
      icon: Building2,
      name: "Driveway",
      price: 149,
      description: "Remove oil stains, dirt, and grime for a fresh, clean driveway appearance."
    },
    {
      icon: Fence,
      name: "Deck & Patio",
      price: 179,
      description: "Revitalize your outdoor living spaces with professional deck and patio cleaning."
    },
    {
      icon: Droplet,
      name: "Roof Cleaning",
      price: 299,
      description: "Safe, effective roof cleaning that extends the life of your shingles."
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Choose Service",
      description: "Select the service you need from our comprehensive options"
    },
    {
      number: 2,
      title: "Get Instant Quote",
      description: "Enter your property details for an immediate price estimate"
    },
    {
      number: 3,
      title: "Schedule Online",
      description: "Pick a convenient time slot from our available dates"
    },
    {
      number: 4,
      title: "We Deliver Results",
      description: "Our professionals arrive on time and deliver crystal clear results"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      service: "Driveway Cleaning",
      rating: 5,
      comment: "Absolutely amazing work! My driveway looks brand new. The team was professional and thorough."
    },
    {
      name: "Michael Chen",
      service: "House Siding",
      rating: 5,
      comment: "Good Day Services transformed my home's exterior. The difference is night and day. Highly recommend!"
    }
  ];

  return (
    <div className="flex flex-col">
      <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 text-center">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            Trusted by 500+ Homeowners
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Crystal Clear Results, Every Time
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Professional pressure washing services that restore and protect your property's beauty
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-lg px-8" data-testid="button-hero-book">
              <Link href="/book">Get Free Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" data-testid="button-hero-learn">
              <a href="#services">View Services</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive pressure washing solutions for every surface of your property
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover-elevate transition-all" data-testid={`card-service-${index}`}>
                <CardContent className="p-6">
                  <service.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-3">
                    Starting at ${service.price}
                  </p>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <Button asChild variant="outline" className="w-full" data-testid={`button-learn-more-${index}`}>
                    <Link href="/book">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to a cleaner, brighter property
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center" data-testid={`step-${index}`}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
                )}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Why Choose Us</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Satisfaction Guaranteed</h3>
                <p className="text-muted-foreground">
                  100% satisfaction guarantee on all services or we'll make it right
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Licensed & Insured</h3>
                <p className="text-muted-foreground">
                  Fully licensed professionals with comprehensive insurance coverage
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                <p className="text-muted-foreground">
                  Book online 24/7 with same-day and weekend appointments available
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} data-testid={`testimonial-${index}`}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4">"{testimonial.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.service}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Ready for a Fresh Clean?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get an instant quote and schedule your service in minutes
          </p>
          <Button asChild size="lg" className="text-lg px-8" data-testid="button-final-cta">
            <Link href="/book">Book Your Service Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
