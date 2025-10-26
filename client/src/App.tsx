import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Home from "@/pages/home";
import Quote from "@/pages/quote";
import QuoteSelector from "@/pages/quote-selector";
import PropertyCleaningQuote from "@/pages/property-cleaning-quote";
import Products from "@/pages/products";
import Checkout from "@/pages/checkout";
import Documents from "@/pages/documents";
import Warranties from "@/pages/warranties";
import Contact from "@/pages/Contact";
import AdminDashboard from "@/pages/admin/dashboard";
import CEODashboard from "@/pages/ceo-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quote" component={QuoteSelector} />
      <Route path="/quote/restoration" component={Quote} />
      <Route path="/property-cleaning" component={PropertyCleaningQuote} />
      <Route path="/products" component={Products} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/documents" component={Documents} />
      <Route path="/warranties" component={Warranties} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/ceo-dashboard" component={CEODashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
