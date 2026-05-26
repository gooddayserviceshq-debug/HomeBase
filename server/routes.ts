// Referenced from Replit Auth blueprint: javascript_log_in_with_replit
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendEmail, sendBookingConfirmationEmail } from "./sendEmail";
import { createBookingCalendarEvent } from "./calendarService";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const GDS_SYSTEM_PROMPT = `You are the AI receptionist for Good Day Pressure Washing (GDS), a professional outdoor cleaning and restoration company based in the Murfreesboro, Tennessee area. You are friendly, helpful, and knowledgeable about all GDS services.

## About Good Day Pressure Washing
Good Day Pressure Washing specializes in two main service categories:

### 1. Paver & Surface Restoration
We restore driveways, patios, walkways, and pool decks made of:
- Interlocking pavers
- Poured concrete
- Stamped concrete
- Brick pavers

**Service tiers:**
- **Basic Restoration** ($0.25–$0.40/sq ft base + $0.75/sq ft acrylic sealer): Professional pressure washing, stain treatment, acrylic sealer application
- **Recommended Restoration** (Basic + polymeric sand at $0.50/sq ft): Everything in Basic plus full removal of old joint material and installation of new Polymeric Sand to lock pavers, prevent weeds, and stabilize the surface
- **Premium Protection** (Recommended but with penetrating siloxane/silane sealer at $1.25/sq ft): Ultimate protection with 5–7+ year lifespan, superior freeze-thaw protection, maximum resistance to de-icing salts

Surface condition affects pricing:
- Lightly dirty: base rate
- Heavily soiled: 1.25× base rate
- Stained/damaged: 1.5× base rate

### 2. Property Cleaning Services
We clean multiple exterior surfaces in a single visit with a minimum charge of $975:
- **Driveway cleaning**: $0.10–$0.15/sq ft
- **Roof cleaning**: $0.20–$0.30/sq ft (soft wash)
- **House siding**: $0.08–$0.12/sq ft
- **Gutters**: $1.50–$2.00/linear ft
- **Fence cleaning**: $0.75–$1.25/linear ft

### 3. Products & Supplies
GDS also sells professional-grade restoration and cleaning products through our online store.

## How to Help Customers
- **For quotes**: Direct customers to our online quote tools at /quote/restoration (paver restoration) or /property-cleaning (property cleaning)
- **For general inquiries**: Direct to /contact
- **For product purchases**: Direct to /products
- **For existing warranties**: Direct to /warranties

## Tone & Guidelines
- Be warm, professional, and genuinely helpful
- Keep responses concise (2–4 sentences unless more detail is needed)
- Always offer to help customers get a quote or answer follow-up questions
- If asked about pricing, give ballpark ranges but encourage them to use the online quote tool for an accurate estimate
- Do not make up services or prices not listed above
- If a question is outside your knowledge, offer to connect them with the team via /contact`;
import { 
  quoteCalculationSchema,
  insertQuoteRequestSchema,
  propertyCleaningCalculationSchema,
  cleaningServicePrices,
  type QuoteResponse,
  type QuoteTiers,
  insertProductSchema,
} from "@shared/schema";

const BASE_RATES = {
  interlocking_pavers: 0.35,
  poured_concrete: 0.25,
  stamped_concrete: 0.30,
  brick_pavers: 0.40,
};

const CONDITION_MULTIPLIERS = {
  lightly_dirty: 1.0,
  heavily_soiled: 1.25,
  stained_damaged: 1.5,
};

const SEALER_RATES = {
  acrylic: 0.75,
  penetrating: 1.25,
};

const POLYMERIC_SAND_COST_PER_SQ_FT = 0.50;

function calculateQuoteTiers(
  squareFootage: number,
  surfaceType: keyof typeof BASE_RATES,
  condition: keyof typeof CONDITION_MULTIPLIERS,
  includePolymericSand: boolean
): QuoteTiers {
  const baseRate = BASE_RATES[surfaceType];
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition];
  
  const cleaningCost = squareFootage * baseRate * conditionMultiplier;
  
  const basicPrice = cleaningCost + (squareFootage * SEALER_RATES.acrylic);
  
  const sandCost = includePolymericSand ? squareFootage * POLYMERIC_SAND_COST_PER_SQ_FT : 0;
  const recommendedPrice = cleaningCost + sandCost + (squareFootage * SEALER_RATES.acrylic);
  
  const premiumPrice = cleaningCost + sandCost + (squareFootage * SEALER_RATES.penetrating);
  
  return {
    basic: {
      name: "Basic Restoration",
      description: "Professional cleaning and protection for immediate aesthetic improvement",
      features: [
        "Professional pressure washing of all surfaces",
        "Spot treatment of oil and organic stains",
        "Application of high-quality Acrylic Sealer",
        "Color enhancement and stain resistance",
      ],
      price: Math.round(basicPrice * 100) / 100,
    },
    recommended: {
      name: "Recommended Restoration",
      description: "Complete restoration addressing stability and long-term health of your pavers",
      features: [
        "Everything in Basic package",
        "Full removal of old joint material",
        "Installation of new Polymeric Sand",
        "Locks pavers, prevents weeds, stabilizes surface",
        "Acrylic Sealer for protection",
      ],
      price: Math.round(recommendedPrice * 100) / 100,
    },
    premium: {
      name: "Premium Protection",
      description: "Ultimate protection against harsh elements with minimal future maintenance",
      features: [
        "Everything in Recommended package",
        "Upgrade to Penetrating Siloxane/Silane Sealer",
        "Superior freeze-thaw protection",
        "5-7+ year protection lifespan",
        "Maximum resistance to de-icing salts",
      ],
      price: Math.round(premiumPrice * 100) / 100,
    },
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth middleware
  await setupAuth(app);

  // Auth routes - Referenced from Replit Auth blueprint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Defensive check for claims
      if (!req.user?.claims?.sub) {
        console.error("User claims missing from session");
        return res.status(401).json({ message: "Unauthorized - claims missing" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.error(`User not found in storage: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public quote calculation endpoint
  app.post("/api/calculate-quote", async (req, res) => {
    try {
      const data = quoteCalculationSchema.parse(req.body);
      
      const squareFootage = data.length * data.width;
      
      const tiers = calculateQuoteTiers(
        squareFootage,
        data.surfaceType,
        data.condition,
        data.includePolymericSand
      );

      const response: QuoteResponse = {
        squareFootage,
        tiers,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to calculate quote" });
    }
  });

  app.post("/api/quote-requests", async (req, res) => {
    try {
      const quoteData = insertQuoteRequestSchema.parse(req.body);
      
      const squareFootage = quoteData.length * quoteData.width;
      
      const tiers = calculateQuoteTiers(
        squareFootage,
        quoteData.surfaceType as keyof typeof BASE_RATES,
        quoteData.condition as keyof typeof CONDITION_MULTIPLIERS,
        quoteData.includePolymericSand ?? false
      );

      const quoteRequest = await storage.createQuoteRequest(quoteData, {
        squareFootage,
        basicTierPrice: tiers.basic.price.toString(),
        recommendedTierPrice: tiers.recommended.price.toString(),
        premiumTierPrice: tiers.premium.price.toString(),
      });

      res.json({ 
        success: true, 
        quoteId: quoteRequest.id,
        tiers 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save quote request" });
    }
  });

  app.get("/api/quote-requests", async (_req, res) => {
    try {
      const quotes = await storage.getQuoteRequests();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote requests" });
    }
  });

  app.get("/api/quote-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuoteRequest(id);
      
      if (!quote) {
        return res.status(404).json({ error: "Quote request not found" });
      }

      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote request" });
    }
  });

  // Property Cleaning Quote endpoints
  app.post("/api/property-cleaning/calculate", async (req, res) => {
    try {
      const data = propertyCleaningCalculationSchema.parse(req.body);
      
      let itemizedTotal = 0;
      const breakdown = [];
      
      // Calculate itemized costs
      if (data.driveway) {
        itemizedTotal += cleaningServicePrices.driveway;
        breakdown.push({ service: "Driveway Cleaning", price: cleaningServicePrices.driveway });
      }
      if (data.roof) {
        itemizedTotal += cleaningServicePrices.roof;
        breakdown.push({ service: "Roof Cleaning", price: cleaningServicePrices.roof });
      }
      if (data.siding) {
        itemizedTotal += cleaningServicePrices.siding;
        breakdown.push({ service: "House Siding", price: cleaningServicePrices.siding });
      }
      if (data.gutters) {
        itemizedTotal += cleaningServicePrices.gutters;
        breakdown.push({ service: "Gutters Cleaning", price: cleaningServicePrices.gutters });
      }
      if (data.fenceSides > 0) {
        const fencePrice = data.fencePricePerSide * data.fenceSides;
        itemizedTotal += fencePrice;
        breakdown.push({ 
          service: `Fence Cleaning (${data.fenceSides} ${data.fenceSides === 1 ? 'side' : 'sides'})`, 
          price: fencePrice 
        });
      }
      
      // Apply minimum service charge if needed
      const minimumApplied = itemizedTotal < cleaningServicePrices.minimumService;
      const finalTotal = Math.max(itemizedTotal, cleaningServicePrices.minimumService);
      
      res.json({
        breakdown,
        itemizedTotal,
        minimumServiceCharge: cleaningServicePrices.minimumService,
        minimumApplied,
        finalTotal,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid calculation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to calculate property cleaning quote" });
    }
  });

  app.post("/api/property-cleaning/submit", async (req, res) => {
    try {
      const { customerInfo, services } = req.body;
      
      // Validate customer info
      const customerSchema = z.object({
        customerName: z.string().min(2),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(10),
        propertyAddress: z.string().min(10),
        additionalNotes: z.string().optional(),
      });
      
      const validatedCustomer = customerSchema.parse(customerInfo);
      const validatedServices = propertyCleaningCalculationSchema.parse(services);
      
      // Calculate totals
      let itemizedTotal = 0;
      if (validatedServices.driveway) itemizedTotal += cleaningServicePrices.driveway;
      if (validatedServices.roof) itemizedTotal += cleaningServicePrices.roof;
      if (validatedServices.siding) itemizedTotal += cleaningServicePrices.siding;
      if (validatedServices.gutters) itemizedTotal += cleaningServicePrices.gutters;
      if (validatedServices.fenceSides > 0) {
        itemizedTotal += validatedServices.fencePricePerSide * validatedServices.fenceSides;
      }
      
      const minimumApplied = itemizedTotal < cleaningServicePrices.minimumService;
      const finalTotal = Math.max(itemizedTotal, cleaningServicePrices.minimumService);
      
      // Create quote
      const quote = await storage.createPropertyCleaningQuote(
        {
          ...validatedCustomer,
          ...validatedServices,
          fencePricePerSide: String(validatedServices.fencePricePerSide),
        },
        {
          itemizedTotal: itemizedTotal.toFixed(2),
          minimumApplied,
          finalTotal: finalTotal.toFixed(2),
        }
      );
      
      res.json({ success: true, quoteId: quote.id, quote });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit property cleaning quote" });
    }
  });

  app.get("/api/property-cleaning/quotes", async (_req, res) => {
    try {
      const quotes = await storage.getPropertyCleaningQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property cleaning quotes" });
    }
  });

  app.get("/api/property-cleaning/quotes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getPropertyCleaningQuote(id);
      
      if (!quote) {
        return res.status(404).json({ error: "Property cleaning quote not found" });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property cleaning quote" });
    }
  });

  // Email and SMS routes for sending quotes
  app.post("/api/send-quote/email", async (req, res) => {
    try {
      const { quoteId, quoteType, recipientEmail } = req.body;
      
      if (!quoteId || !quoteType || !recipientEmail) {
        return res.status(400).json({ 
          error: "Missing required fields: quoteId, quoteType, recipientEmail" 
        });
      }
      
      const { 
        sendPropertyCleaningQuoteEmail,
        sendRestorationQuoteEmail 
      } = await import("./sendEmail");
      
      if (quoteType === "cleaning") {
        const quote = await storage.getPropertyCleaningQuote(quoteId);
        if (!quote) {
          return res.status(404).json({ error: "Property cleaning quote not found" });
        }
        
        const result = await sendPropertyCleaningQuoteEmail(quote, recipientEmail);
        res.json(result);
      } else if (quoteType === "restoration") {
        const quote = await storage.getQuoteRequest(quoteId);
        if (!quote) {
          return res.status(404).json({ error: "Restoration quote not found" });
        }
        
        const result = await sendRestorationQuoteEmail(quote, recipientEmail);
        res.json(result);
      } else {
        res.status(400).json({ error: "Invalid quote type. Must be 'cleaning' or 'restoration'" });
      }
    } catch (error) {
      console.error("Email send error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/send-quote/sms", async (req, res) => {
    try {
      const { quoteId, quoteType, recipientPhone } = req.body;
      
      if (!quoteId || !quoteType || !recipientPhone) {
        return res.status(400).json({ 
          error: "Missing required fields: quoteId, quoteType, recipientPhone" 
        });
      }
      
      const { 
        sendPropertyCleaningQuoteSMS,
        sendRestorationQuoteSMS 
      } = await import("./sendEmail");
      
      if (quoteType === "cleaning") {
        const quote = await storage.getPropertyCleaningQuote(quoteId);
        if (!quote) {
          return res.status(404).json({ error: "Property cleaning quote not found" });
        }
        
        const result = await sendPropertyCleaningQuoteSMS(quote, recipientPhone);
        res.json(result);
      } else if (quoteType === "restoration") {
        const quote = await storage.getQuoteRequest(quoteId);
        if (!quote) {
          return res.status(404).json({ error: "Restoration quote not found" });
        }
        
        const result = await sendRestorationQuoteSMS(quote, recipientPhone);
        res.json(result);
      } else {
        res.status(400).json({ error: "Invalid quote type. Must be 'cleaning' or 'restoration'" });
      }
    } catch (error) {
      console.error("SMS send error:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const products = await storage.getProducts(categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Category routes
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessionId = req.sessionID;
      const items = await storage.getCartItems(userId, sessionId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessionId = req.sessionID;
      const { productId, quantity = 1 } = req.body;
      
      if (!productId) {
        return res.status(400).json({ error: "Product ID required" });
      }
      
      const item = await storage.addToCart({
        userId,
        sessionId,
        productId,
        quantity,
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (quantity <= 0) {
        await storage.removeFromCart(id);
        res.json({ removed: true });
      } else {
        const item = await storage.updateCartItemQuantity(id, quantity);
        if (!item) {
          return res.status(404).json({ error: "Cart item not found" });
        }
        res.json(item);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const category = req.query.category as string;
      const documents = await storage.getDocuments(category);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { items, ...orderData } = req.body;
      
      const order = await storage.createOrder(
        { ...orderData, userId },
        items
      );
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/cart/clear", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessionId = req.sessionID;
      await storage.clearCart(userId, sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Warranty routes
  app.get("/api/warranties", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const warranties = await storage.getWarranties(userId);
      res.json(warranties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warranties" });
    }
  });

  app.post("/api/warranties", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const warrantyData = req.body;
      
      const warranty = await storage.createWarranty({
        ...warrantyData,
        userId,
      });
      
      res.json(warranty);
    } catch (error) {
      res.status(500).json({ error: "Failed to create warranty" });
    }
  });

  // Customer Inquiry routes
  app.post("/api/contact/inquiries", async (req, res) => {
    try {
      const inquirySchema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        phone: z.string().min(10, "Phone number must be at least 10 digits"),
        inquiryType: z.enum(["quote", "support", "general", "other"]),
        subject: z.string().optional(),
        message: z.string().min(10, "Message must be at least 10 characters"),
      });

      const validatedData = inquirySchema.parse(req.body);
      
      const inquiry = await storage.createCustomerInquiry(validatedData);
      
      // Send email notification to admin (optional)
      try {
        if (sendEmail && process.env.SENDGRID_API_KEY) {
          await sendEmail({
            to: "hello@gooddaypressurewashing.com",
            subject: `New Customer Inquiry: ${validatedData.inquiryType}`,
            text: `
New customer inquiry received:

Name: ${validatedData.name}
Email: ${validatedData.email}
Phone: ${validatedData.phone}
Type: ${validatedData.inquiryType}
Subject: ${validatedData.subject || "N/A"}

Message:
${validatedData.message}
            `,
          });
        }
      } catch (emailError) {
        // Log error but don't fail the inquiry submission
        console.error("Failed to send email notification:", emailError);
      }
      
      res.json({
        success: true,
        message: "Your inquiry has been submitted successfully. We'll respond within 24 hours.",
        inquiryId: inquiry.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid inquiry data", 
          details: error.errors 
        });
      }
      console.error("Failed to submit inquiry:", error);
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  });

  app.get("/api/admin/inquiries", isAuthenticated, async (req: any, res) => {
    try {
      const inquiries = await storage.getCustomerInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // Admin routes - Protected with authentication
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const orders = await storage.getOrders();
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const pendingOrders = orders.filter(o => o.status === "pending").length;

      // Count customers whose first-ever order was placed this calendar month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOrderByEmail = new Map<string, Date>();
      orders.forEach(o => {
        const orderDate = new Date(o.createdAt);
        const existing = firstOrderByEmail.get(o.email);
        if (!existing || orderDate < existing) {
          firstOrderByEmail.set(o.email, orderDate);
        }
      });
      const newCustomersThisMonth = Array.from(firstOrderByEmail.values())
        .filter(date => date >= startOfMonth).length;

      res.json({
        totalRevenue,
        totalOrders: orders.length,
        pendingOrders,
        totalCustomers: new Set(orders.map(o => o.email)).size,
        newCustomersThisMonth,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // CEO Dashboard Analytics
  app.get("/api/ceo/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const [
        restorationQuotes,
        cleaningQuotes,
        inquiries,
        orders,
        warranties,
        products
      ] = await Promise.all([
        storage.getQuoteRequests(),
        storage.getPropertyCleaningQuotes(),
        storage.getCustomerInquiries(),
        storage.getOrders(),
        storage.getWarranties(),
        storage.getProducts()
      ]);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Quote Analytics
      const totalRestorationQuotes = restorationQuotes.length;
      const totalCleaningQuotes = cleaningQuotes.length;
      const totalQuotes = totalRestorationQuotes + totalCleaningQuotes;
      
      const recentRestorationQuotes = restorationQuotes.filter(q => 
        new Date(q.createdAt) >= thirtyDaysAgo
      );
      const recentCleaningQuotes = cleaningQuotes.filter(q => 
        new Date(q.createdAt) >= thirtyDaysAgo
      );

      // Calculate average quote values
      const avgRestorationValue = restorationQuotes.length > 0
        ? restorationQuotes.reduce((sum, q) => {
            const tier = q.selectedTier;
            const price = tier === 'basic' ? parseFloat(q.basicTierPrice) :
                         tier === 'recommended' ? parseFloat(q.recommendedTierPrice) :
                         parseFloat(q.premiumTierPrice);
            return sum + price;
          }, 0) / restorationQuotes.length
        : 0;

      const avgCleaningValue = cleaningQuotes.length > 0
        ? cleaningQuotes.reduce((sum, q) => sum + parseFloat(q.finalTotal), 0) / cleaningQuotes.length
        : 0;

      // Revenue Analytics
      const totalProductRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      // Estimate service revenue from quotes (assuming 30% conversion)
      const estimatedRestorationRevenue = restorationQuotes.reduce((sum, q) => {
        const tier = q.selectedTier;
        const price = tier === 'basic' ? parseFloat(q.basicTierPrice) :
                     tier === 'recommended' ? parseFloat(q.recommendedTierPrice) :
                     parseFloat(q.premiumTierPrice);
        return sum + price;
      }, 0) * 0.3;

      const estimatedCleaningRevenue = cleaningQuotes.reduce((sum, q) => 
        sum + parseFloat(q.finalTotal), 0) * 0.3;

      const totalEstimatedRevenue = totalProductRevenue + estimatedRestorationRevenue + estimatedCleaningRevenue;

      // Customer Analytics
      const uniqueEmails = new Set([
        ...restorationQuotes.map(q => q.email),
        ...cleaningQuotes.map(q => q.customerEmail),
        ...orders.map(o => o.email),
        ...inquiries.map(i => i.email)
      ]);
      const totalCustomers = uniqueEmails.size;

      // Calculate repeat customers (appeared in multiple tables)
      const emailCounts = new Map<string, number>();
      [...restorationQuotes.map(q => q.email),
       ...cleaningQuotes.map(q => q.customerEmail),
       ...orders.map(o => o.email)].forEach(email => {
        emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
      });
      const repeatCustomers = Array.from(emailCounts.values()).filter(count => count > 1).length;

      // Geographic distribution
      const cityDistribution = new Map<string, number>();
      restorationQuotes.forEach(q => {
        const city = extractCity(q.address);
        if (city) cityDistribution.set(city, (cityDistribution.get(city) || 0) + 1);
      });
      cleaningQuotes.forEach(q => {
        const city = extractCity(q.propertyAddress);
        if (city) cityDistribution.set(city, (cityDistribution.get(city) || 0) + 1);
      });

      // Service breakdown
      const serviceBreakdown = {
        paverRestoration: totalRestorationQuotes,
        propertyCleaning: totalCleaningQuotes,
        products: orders.length,
        warranties: warranties.filter(w => w.status === 'active').length
      };

      // Monthly trends
      const monthlyQuotes = new Map<string, number>();
      const monthlyRevenue = new Map<string, number>();
      
      [...restorationQuotes, ...cleaningQuotes].forEach(q => {
        const month = new Date(q.createdAt).toISOString().slice(0, 7);
        monthlyQuotes.set(month, (monthlyQuotes.get(month) || 0) + 1);
      });

      orders.forEach(o => {
        const month = new Date(o.createdAt).toISOString().slice(0, 7);
        monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + parseFloat(o.total));
      });

      // Recent activity
      const recentActivity = [
        ...restorationQuotes.filter(q => new Date(q.createdAt) >= sevenDaysAgo)
          .map(q => ({ type: 'restoration_quote', date: q.createdAt, value: q.selectedTier, customer: q.email })),
        ...cleaningQuotes.filter(q => new Date(q.createdAt) >= sevenDaysAgo)
          .map(q => ({ type: 'cleaning_quote', date: q.createdAt, value: q.finalTotal, customer: q.customerEmail })),
        ...inquiries.filter(i => new Date(i.createdAt) >= sevenDaysAgo)
          .map(i => ({ type: 'inquiry', date: i.createdAt, value: i.inquiryType, customer: i.email })),
        ...orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo)
          .map(o => ({ type: 'order', date: o.createdAt, value: o.total, customer: o.email }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Key metrics
      const keyMetrics = {
        totalQuotes,
        totalCustomers,
        totalRevenue: totalEstimatedRevenue,
        avgQuoteValue: totalQuotes > 0 ? (avgRestorationValue + avgCleaningValue) / 2 : 0,
        conversionRate: 30, // Estimated 30%
        activeWarranties: warranties.filter(w => w.status === 'active').length,
        pendingInquiries: inquiries.filter(i => i.status === 'new').length,
        repeatCustomerRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100).toFixed(1) : '0'
      };

      res.json({
        keyMetrics,
        serviceBreakdown,
        monthlyTrends: {
          quotes: Array.from(monthlyQuotes.entries()).map(([month, count]) => ({ month, count })),
          revenue: Array.from(monthlyRevenue.entries()).map(([month, amount]) => ({ month, amount }))
        },
        geographicDistribution: Array.from(cityDistribution.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([city, count]) => ({ city, count })),
        recentActivity: recentActivity.slice(0, 20),
        quoteAnalytics: {
          restoration: {
            total: totalRestorationQuotes,
            recent: recentRestorationQuotes.length,
            avgValue: avgRestorationValue
          },
          cleaning: {
            total: totalCleaningQuotes,
            recent: recentCleaningQuotes.length,
            avgValue: avgCleaningValue
          }
        }
      });
    } catch (error) {
      console.error("CEO Analytics Error:", error);
      res.status(500).json({ error: "Failed to fetch CEO analytics" });
    }
  });

  // Helper function to extract city from address
  function extractCity(address: string): string | null {
    // Simple extraction - looks for "City, State" pattern
    const match = address.match(/,\s*([^,]+),\s*[A-Z]{2}/i);
    if (match) return match[1].trim();
    
    // Fallback to Murfreesboro if not found
    return "Murfreesboro";
  }

  app.get("/api/admin/orders", isAuthenticated, async (req: any, res) => {
    try {
      const orders = await storage.getOrders();
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => ({
          ...order,
          items: await storage.getOrderItems(order.id),
        }))
      );
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ["pending", "processing", "shipped", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.post("/api/admin/products", isAuthenticated, async (req: any, res) => {
    try {
      // Validate input
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.put("/api/admin/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      // Validate input
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // AI Advertising generator endpoint (streaming)
  app.post("/api/advertising/generate", async (req, res) => {
    const { platform, service, audience, offer, tone } = req.body;

    if (!platform || !service) {
      return res.status(400).json({ error: "platform and service are required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "AI generator not configured" });
    }

    const platformGuides: Record<string, string> = {
      facebook:
        "Facebook/Instagram ad (primary text ≤125 words, headline ≤27 chars, description ≤27 chars). Include relevant emojis. Add 3–5 hashtags at the end.",
      google:
        "Google Search Ad with 3 headlines (≤30 chars each), 2 descriptions (≤90 chars each), and a display URL path.",
      email:
        "Email campaign with a subject line (≤60 chars), preview text (≤90 chars), and body copy (2–3 short paragraphs plus a clear CTA button label).",
      sms:
        "SMS/text message ad (≤160 chars). Clear offer, CTA, and opt-out mention: 'Reply STOP to opt out'.",
      nextdoor:
        "Nextdoor neighborhood post (friendly, local tone, ≤200 words). Mention the Middle Tennessee area. No hard sales language.",
      flyer:
        "Print/digital flyer copy with a bold headline, 3 bullet points of benefits, pricing teaser, and contact CTA.",
    };

    const serviceInfo: Record<string, string> = {
      restoration:
        "Paver & Surface Restoration — deep cleaning, polymeric sand, sealing (Basic/Recommended/Premium tiers). Driveways, patios, walkways, pool decks. Results last 5–7 years.",
      cleaning:
        "Complete Property Cleaning — driveway, roof (soft wash), house siding, gutters, fence. Minimum $975 service charge. One visit covers the whole exterior.",
      products:
        "Professional-grade restoration and cleaning products available in our online store — the same products our crews use.",
      all: "Full-service outdoor cleaning and restoration: paver restoration, property cleaning, and professional products for Middle Tennessee homeowners.",
    };

    const systemPrompt = `You are a professional copywriter for Good Day Pressure Washing (GDS), a pressure washing and paver restoration company in Murfreesboro, Tennessee. Their tagline is "Bringing a Shine to Your Home." Phone: 615-390-9779. Website: gooddaypressurewashing.com.

Write advertising copy that is compelling, benefit-focused, and authentic. Avoid generic AI filler phrases. Use concrete details (sq ft pricing, years of protection, specific surfaces).

Always generate exactly 3 distinct variations labeled **Variation 1**, **Variation 2**, **Variation 3**. Each should take a meaningfully different angle or hook.`;

    const userPrompt = `Generate 3 ad variations for the following campaign:

Platform: ${platformGuides[platform] || platform}
Service: ${serviceInfo[service] || service}
Target Audience: ${audience || "Homeowners in Middle Tennessee"}
Tone: ${tone || "Professional and friendly"}${offer ? `\nSpecial Offer: ${offer}` : ""}

Follow the platform format requirements exactly. Make each variation feel distinct — different opening hook, angle, or emotional appeal.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const anthropic = new Anthropic({ apiKey });
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-7",
        max_tokens: 1500,
        thinking: { type: "adaptive" },
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
    } catch (error: any) {
      res.write(
        `data: ${JSON.stringify({ error: error.message || "Generation failed" })}\n\n`
      );
    } finally {
      res.end();
    }
  });

  // Booking system endpoints
  app.get("/api/services", async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.post("/api/quotes", async (req, res) => {
    const { serviceId, squareFootage } = req.body;
    if (!serviceId || !squareFootage || squareFootage <= 0) {
      return res.status(400).json({ error: "serviceId and squareFootage are required" });
    }
    const service = await storage.getService(serviceId);
    if (!service) return res.status(404).json({ error: "Service not found" });

    const basePrice = parseFloat(service.basePrice);
    const pricePerSqFt = parseFloat(service.pricePerSqFt);
    const areaPrice = squareFootage * pricePerSqFt;
    const totalPrice = basePrice + areaPrice;

    res.json({ totalPrice, basePrice, areaPrice, squareFootage });
  });

  app.post("/api/bookings", async (req, res) => {
    const { customer, booking } = req.body;
    if (!customer || !booking) {
      return res.status(400).json({ error: "customer and booking are required" });
    }
    // Validate service exists before writing
    const service = await storage.getService(booking.serviceId);
    if (!service) {
      return res.status(400).json({ error: "Invalid serviceId" });
    }
    try {
      const result = await storage.createBooking(customer, booking);
      const { booking: saved, bookingNumber } = result;

      // Fire notifications in the background – don't block the response
      Promise.allSettled([
        sendBookingConfirmationEmail({
          customerName: customer.name,
          customerEmail: customer.email,
          bookingNumber,
          serviceName: service.name,
          scheduledDate: new Date(saved.scheduledDate),
          address: customer.address,
          totalPrice: saved.totalPrice,
          specialInstructions: saved.specialInstructions,
        }),
        createBookingCalendarEvent({
          bookingNumber,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          serviceName: service.name,
          address: customer.address,
          scheduledDate: new Date(saved.scheduledDate),
          totalPrice: saved.totalPrice,
          squareFootage: saved.squareFootage,
          specialInstructions: saved.specialInstructions,
        }),
      ]).then((results) => {
        results.forEach((r) => {
          if (r.status === "rejected") console.error("[booking notifications]", r.reason);
        });
      });

      res.json({ bookingId: saved.id, bookingNumber });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create booking" });
    }
  });

  app.get("/api/bookings/customer/:email", async (req, res) => {
    const { email } = req.params;
    const bookings = await storage.getBookingsByEmail(decodeURIComponent(email));
    res.json(bookings);
  });

  app.get("/api/admin/bookings", async (req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.patch("/api/admin/bookings/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });
    const updated = await storage.updateBookingStatus(id, status);
    if (!updated) return res.status(404).json({ error: "Booking not found" });
    res.json(updated);
  });

  // Andromada — Blake's personal AI chief of staff (streaming)
  function buildAndromadaSystemPrompt(context?: string): string {
    const base = `You are Andromada, Blake McConnell's personal AI chief of staff and strategic partner. Blake is the founder and CEO of Good Day Services (GDS) — a pressure washing and paver restoration company in Murfreesboro, Tennessee — and is actively building other ventures alongside it.

You are NOT a cheerleader or a yes-machine. You are the person who keeps Blake honest, connects threads he might miss, and tells him the hard thing when it needs to be said. You make him feel good when he earns it — not by default.

## Your Core Job
1. **Connect the dots** — Blake works across multiple platforms and projects simultaneously: Google Drive for documents and business assets, Claude AI for content and automation, video marketing for one or more companies, HomeBase (this platform) for GDS operations. When he mentions one, you think about how it connects to the others. You surface conflicts, overlaps, and the through-line.
2. **Keep him grounded** — If Blake is spinning up a new initiative before finishing the last one, say it. If a plan sounds good but has a real gap, name the gap. Praise that isn't earned means nothing.
3. **Real strategic value** — Don't just answer the question asked. Answer the question behind it. What does Blake actually need to move forward?

## Honest Advisor Rules
- If Blake is doing three things and only one of them actually matters this week, tell him which one and why
- If an idea is solid, say so and build on it — but don't inflate it
- If an idea has a real problem, name the problem before the encouragement
- If he's been stalled on something in his stack, notice it and bring it up
- Never say "great question" or "absolutely" or "certainly" — that's filler, not value
- Don't be harsh for the sake of it — be honest for the sake of progress

## Blake's Business Ecosystem
**Good Day Services (GDS):**
- Paver & Surface Restoration: driveways, patios, walkways, pool decks. Tiers: Basic (~$0.25–0.40/sq ft + $0.75 acrylic sealer), Recommended (+ polymeric sand $0.50/sq ft), Premium (penetrating siloxane sealer $1.25/sq ft). Condition multipliers: 1.0× lightly dirty, 1.25× heavily soiled, 1.5× stained/damaged.
- Property Cleaning: full exterior — driveway ($300), roof soft wash ($300), siding ($300), gutters ($300), fence ($75–$150/side). $975 minimum.
- Products: professional-grade restoration supplies sold online.
- Territory: Murfreesboro, TN and surrounding Middle Tennessee. Phone: 615-390-9779.

**HomeBase Platform:** TypeScript/React/Express app with Postgres, Drizzle ORM, Claude AI. Manages quotes, bookings, customer inquiries, e-commerce, warranties, admin and CEO dashboards, AI receptionist.

**Other ventures:** Blake is building beyond GDS. When he shares what's in motion, take it seriously and advise on it as a real business.

## Cross-Platform Awareness
Blake's typical tool stack:
- **Google Drive** — contracts, business documents, asset libraries, SOPs, templates
- **Claude AI** — content generation, automation, strategy ideation, ad copy
- **Video Marketing** — social content, brand building for GDS or other companies
- **HomeBase** — GDS operations, customer management, booking, analytics

When Blake mentions progress on one, ask or consider: how does this connect to the others? Is he building in the right order? What's the dependency chain?

## Your Style
- Direct, confident, and warm — not corporate, not casual-lazy
- Short when short is right; deep when depth is needed
- Match his energy but don't just mirror it — sometimes he needs a different gear
- You have a name and a perspective. Use both
- When structuring an idea: core insight → why it matters now → what's the actual next action

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Blake's email: blakemcconnell1215@gmail.com`;

    if (context && context.trim()) {
      return `${base}\n\n## Blake's Active Stack (live context from his tracker)\n${context}\n\nUse this to inform your responses. If something has been stalled, notice it. If he's working on things that should be sequenced differently, bring it up.`;
    }

    return base;
  }

  app.post("/api/andromada/chat", async (req, res) => {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "Andromada not configured" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const anthropic = new Anthropic({ apiKey });
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-7",
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        system: buildAndromadaSystemPrompt(context),
        messages,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
    } catch (error: any) {
      res.write(
        `data: ${JSON.stringify({ error: error.message || "Request failed" })}\n\n`
      );
    } finally {
      res.end();
    }
  });

  // AI Receptionist chat endpoint (streaming)
  app.post("/api/receptionist/chat", async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "AI receptionist not configured" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const anthropic = new Anthropic({ apiKey });
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-7",
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        system: GDS_SYSTEM_PROMPT,
        messages,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
    } catch (error: any) {
      res.write(
        `data: ${JSON.stringify({ error: error.message || "Request failed" })}\n\n`
      );
    } finally {
      res.end();
    }
  });

  // Lead CRM routes
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const leads = await storage.getLeads(status);
      res.json(leads);
    } catch { res.status(500).json({ message: "Failed to fetch leads" }); }
  });

  app.post("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const { insertLeadSchema } = await import("@shared/schema");
      const data = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(data);
      res.status(201).json(lead);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const { updateLeadSchema } = await import("@shared/schema");
      const data = updateLeadSchema.parse(req.body);
      const lead = await storage.updateLead(req.params.id, data);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      res.json(lead);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch { res.status(500).json({ message: "Failed to delete lead" }); }
  });

  // Commercial service quote routes (public submission, admin read)
  app.post("/api/commercial-quotes", async (req, res) => {
    try {
      const { insertCommercialServiceQuoteSchema } = await import("@shared/schema");
      const data = insertCommercialServiceQuoteSchema.parse(req.body);
      const quote = await storage.createCommercialServiceQuote(data);
      res.status(201).json(quote);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to submit quote" });
    }
  });

  app.get("/api/commercial-quotes", isAuthenticated, async (_req, res) => {
    try {
      const quotes = await storage.getCommercialServiceQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commercial quotes" });
    }
  });

  app.patch("/api/commercial-quotes/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: "status required" });
      const quote = await storage.updateCommercialServiceQuoteStatus(req.params.id, status);
      if (!quote) return res.status(404).json({ message: "Quote not found" });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Contract routes
  app.get("/api/contracts", isAuthenticated, async (_req, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const { insertContractSchema } = await import("@shared/schema");
      const data = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(data);
      res.status(201).json(contract);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  app.patch("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const { updateContractSchema } = await import("@shared/schema");
      const data = updateContractSchema.parse(req.body);
      const contract = await storage.updateContract(req.params.id, data);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      res.json(contract);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteContract(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
