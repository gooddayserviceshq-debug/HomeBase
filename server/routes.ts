// Referenced from Replit Auth blueprint: javascript_log_in_with_replit
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
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
      if (sendEmail) {
        await sendEmail({
          to: "admin@gooddayservices.com",
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
      
      res.json({
        totalRevenue,
        totalOrders: orders.length,
        pendingOrders,
        totalCustomers: new Set(orders.map(o => o.email)).size,
        newCustomersThisMonth: 0, // Placeholder
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
