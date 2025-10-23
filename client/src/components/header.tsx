import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoUrl from "@assets/transparent GDS social avatar logo color (1)_1760659313459.png";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isHome = location === "/";
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-lg px-2 py-1 -ml-2">
            <img src={logoUrl} alt="Good Day Services Logo" className="h-8 w-8" />
            <span className="font-bold text-lg">Good Day Services</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-foreground" : "text-muted-foreground"}`}>
              Home
            </Link>
            <a href="#services" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Services
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="default" className="hidden md:flex" data-testid="button-get-quote">
              <Link href="/quote">Get Quote</Link>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col gap-1 p-4">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-home">
                Home
              </Button>
            </Link>
            <a href="#services" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-services">
                Services
              </Button>
            </a>
            <Link href="/quote" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-quote">
                Get Quote
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
