// Referenced from Replit Auth blueprint: javascript_log_in_with_replit
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { 
  quoteCalculationSchema,
  insertQuoteRequestSchema,
  type QuoteResponse,
  type QuoteTiers
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
        quoteData.includePolymericSand
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

  const httpServer = createServer(app);
  return httpServer;
}
