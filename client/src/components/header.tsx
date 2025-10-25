import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type User } from "@shared/schema";
import logoUrl from "@assets/transparent GDS social avatar logo color (1)_1760659313459.png";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const typedUser = user as User | undefined;
  
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
            <Link href="/products" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/products" ? "text-foreground" : "text-muted-foreground"}`}>
              Products
            </Link>
            <Link href="/documents" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/documents" ? "text-foreground" : "text-muted-foreground"}`}>
              Resources
            </Link>
            <Link href="/warranties" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/warranties" ? "text-foreground" : "text-muted-foreground"}`}>
              Warranties
            </Link>
            <Link href="/contact" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/contact" ? "text-foreground" : "text-muted-foreground"}`}>
              Contact
            </Link>
            {isAuthenticated && (
              <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-foreground" : "text-muted-foreground"}`}>
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {!isLoading && (
              <>
                {isAuthenticated && typedUser ? (
                  <div className="hidden md:flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={typedUser.profileImageUrl || undefined} alt={typedUser.firstName || "User"} style={{ objectFit: 'cover' }} />
                      <AvatarFallback>{typedUser.firstName?.[0] || typedUser.email?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = "/api/logout"}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = "/api/login"}
                    className="hidden md:flex"
                    data-testid="button-login"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </>
            )}
            
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
            <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-products">
                Products
              </Button>
            </Link>
            <Link href="/documents" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-documents">
                Resources
              </Button>
            </Link>
            <Link href="/warranties" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-warranties">
                Warranties
              </Button>
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-contact">
                Contact
              </Button>
            </Link>
            {isAuthenticated && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-admin">
                  Admin
                </Button>
              </Link>
            )}
            <Link href="/quote" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-mobile-quote">
                Get Quote
              </Button>
            </Link>
            
            {!isLoading && (
              <>
                {isAuthenticated && typedUser ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 mt-2 border-t">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={typedUser.profileImageUrl || undefined} alt={typedUser.firstName || "User"} style={{ objectFit: 'cover' }} />
                        <AvatarFallback>{typedUser.firstName?.[0] || typedUser.email?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{typedUser.firstName || typedUser.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.location.href = "/api/logout";
                      }}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start mt-2 border-t pt-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = "/api/login";
                    }}
                    data-testid="button-mobile-login"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
