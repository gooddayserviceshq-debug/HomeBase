import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Clock, Award, ArrowRight, Play, Star, Users, Sparkles, ChevronRight, ChevronLeft, Phone, MapPin, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import BeforeImage from '@assets/stock_images/dirty_stained_weathe_074e60af.jpg';
import AfterImage from '@assets/stock_images/clean_restored_concr_47aaa0e2.jpg';
import PatioImage from '@assets/stock_images/patio_pavers_outdoor_ee2162b8.jpg';
import WalkwayImage from '@assets/stock_images/brick_walkway_pathwa_409e0845.jpg';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [beforeAfterSlider, setBeforeAfterSlider] = useState([50]);
  const [selectedProject, setSelectedProject] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner, Murfreesboro",
      content: "Our driveway looks brand new! The team was professional, on time, and the results exceeded our expectations.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Mike Thompson",
      role: "Property Manager",
      content: "Good Day Services transformed our commercial property's walkways. The polymeric sand made such a difference!",
      rating: 5,
      avatar: "MT"
    },
    {
      name: "Emily Chen",
      role: "Homeowner, Franklin",
      content: "Best investment for our home. The sealing service has kept our pavers looking perfect through winter.",
      rating: 5,
      avatar: "EC"
    }
  ];

  const stats = [
    { value: "500+", label: "Properties Restored" },
    { value: "98%", label: "Customer Satisfaction" },
    { value: "5 Years", label: "Average Protection" },
    { value: "24hr", label: "Quote Response Time" }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Cinematic Hero Section with Parallax */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Video Background Placeholder */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Hero Content */}
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="text-center space-y-8">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-background/80 backdrop-blur-sm border px-4 py-2 rounded-full animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">Trusted by 500+ Homeowners in Middle Tennessee</span>
            </div>

            {/* Main Headline with Animation */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up" data-testid="text-hero-title">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                Outdoor Spaces
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up delay-100">
              Professional paver restoration that brings your driveways, patios, and walkways back to life with lasting protection
            </p>

            {/* CTA Buttons with Hover Effects */}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up delay-200">
              <Link href="/quote">
                <Button size="lg" className="gap-2 group shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105" data-testid="button-get-quote">
                  Get Instant Quote
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Button size="lg" variant="outline" className="gap-2 group backdrop-blur-sm bg-background/50 hover:bg-background/80 transition-all duration-300 transform hover:scale-105" data-testid="button-watch-video">
                <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Our Process
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 pt-8 animate-fade-in-up delay-300">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Avatar key={i} className="border-2 border-background">
                    <AvatarFallback className="bg-primary/10 text-xs">C{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-medium">5.0 Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-8 w-8 text-muted-foreground rotate-90" />
        </div>
      </section>

      {/* Stats Section with Counter Animation */}
      <section className="py-16 px-4 bg-muted/30 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Showcase with Interactive Slider */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1" />
              Proven Results
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold animate-fade-in-up">See the Transformation</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up delay-100">
              Real results from real projects across Middle Tennessee
            </p>
          </div>

          {/* Interactive Before/After Comparison */}
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
            <div className="relative overflow-hidden rounded-xl bg-muted aspect-video">
              {/* Before/After Slider Container */}
              <div className="relative w-full h-full">
                {/* Before Image */}
                <img 
                  src={BeforeImage} 
                  alt="Before restoration" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Before Label */}
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="destructive" className="shadow-lg">Before</Badge>
                </div>
                
                {/* After Image with Clip Path */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - beforeAfterSlider[0]}% 0 0)` }}
                >
                  <img 
                    src={AfterImage} 
                    alt="After restoration" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* After Label */}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-600 shadow-lg">After</Badge>
                  </div>
                </div>
                
                {/* Slider Handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize transition-none"
                  style={{ left: `${beforeAfterSlider[0]}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ChevronLeft className="absolute h-4 w-4 text-muted-foreground -left-[2px]" />
                    <ChevronRight className="absolute h-4 w-4 text-muted-foreground -right-[2px]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Driveway Restoration Project</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Murfreesboro, TN</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">3,500 sq ft surface area</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Completed in 2 days</span>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-2">Drag to compare</p>
                <Slider 
                  value={beforeAfterSlider} 
                  onValueChange={setBeforeAfterSlider}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">95%</p>
                  <p className="text-xs text-muted-foreground">Stain Removal</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">5yr</p>
                  <p className="text-xs text-muted-foreground">Protection</p>
                </Card>
              </div>
            </div>
          </div>

          {/* Project Gallery */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { type: "Driveway", location: "Franklin", size: "2,800 sq ft", image: AfterImage },
              { type: "Patio", location: "Brentwood", size: "1,200 sq ft", image: PatioImage },
              { type: "Walkway", location: "Spring Hill", size: "800 sq ft", image: WalkwayImage }
            ].map((project, index) => (
              <Card key={index} className="overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl" onClick={() => setSelectedProject(index)}>
                <div className="relative aspect-video">
                  <img 
                    src={project.image} 
                    alt={`${project.type} restoration project`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge variant="secondary" className="mb-2">Completed</Badge>
                    <p className="text-sm font-semibold text-white">{project.type} Restoration</p>
                    <p className="text-xs text-white/90">{project.location} • {project.size}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Trusted & Certified</h3>
            <p className="text-muted-foreground">Your satisfaction is guaranteed</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, label: "Licensed & Insured", desc: "Full Coverage" },
              { icon: Award, label: "5-Star Rated", desc: "500+ Reviews" },
              { icon: CheckCircle2, label: "Satisfaction Guaranteed", desc: "100% Promise" },
              { icon: Clock, label: "On-Time Service", desc: "Or It's Free" }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section with Cards */}
      <section id="services" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="animate-fade-in">
              <Shield className="h-3 w-3 mr-1" />
              Comprehensive Solutions
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold animate-fade-in-up">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up delay-100">
              Complete restoration solutions backed by industry expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Deep Cleaning",
                description: "Professional pressure washing that removes years of buildup",
                features: ["Oil stain removal", "Organic growth treatment", "Color restoration"]
              },
              {
                icon: Shield,
                title: "Structural Repair",
                description: "Fix the foundation with polymeric sand and stabilization",
                features: ["Joint restoration", "Paver leveling", "Weed prevention"]
              },
              {
                icon: Award,
                title: "Premium Sealing",
                description: "Long-lasting protection against the elements",
                features: ["UV protection", "Freeze-thaw resistance", "5-7 year lifespan"]
              }
            ].map((service, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer animate-fade-in-up" 
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`card-service-${service.title.toLowerCase().replace(' ', '-')}`}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials with Carousel */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="animate-fade-in">
              <Users className="h-3 w-3 mr-1" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold animate-fade-in-up">What Our Clients Say</h2>
          </div>

          <div className="relative">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className={`transition-all duration-500 ${
                  index === activeTestimonial 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95 absolute inset-0'
                }`}
              >
                <CardContent className="pt-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 transition-all duration-300 rounded-full ${
                    index === activeTestimonial 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-muted-foreground/30'
                  }`}
                  data-testid={`testimonial-indicator-${index}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA with Urgency */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge variant="secondary" className="mb-6 animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            Limited Time: Free Consultation
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">
            Ready to Transform Your Property?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto animate-fade-in-up delay-100">
            Join hundreds of satisfied customers. Get your instant quote in 60 seconds.
          </p>
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up delay-200">
            <Link href="/quote">
              <Button size="lg" variant="secondary" className="gap-2 group shadow-2xl hover:shadow-white/20 transition-all transform hover:scale-105" data-testid="button-cta-quote">
                Get Your Free Quote
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all border-white/20 transform hover:scale-105" data-testid="button-call-now">
              <Phone className="h-5 w-5" />
              Call 615-390-9779
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}