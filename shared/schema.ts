import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quoteRequests = pgTable("quote_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  serviceType: text("service_type").notNull(),
  surfaceType: text("surface_type").notNull(),
  length: integer("length").notNull(),
  width: integer("width").notNull(),
  squareFootage: integer("square_footage").notNull(),
  condition: text("condition").notNull(),
  includeSealer: boolean("include_sealer").notNull().default(false),
  includePolymericSand: boolean("include_polymeric_sand").notNull().default(false),
  basicTierPrice: decimal("basic_tier_price", { precision: 10, scale: 2 }).notNull(),
  recommendedTierPrice: decimal("recommended_tier_price", { precision: 10, scale: 2 }).notNull(),
  premiumTierPrice: decimal("premium_tier_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({ 
  id: true, 
  createdAt: true,
  squareFootage: true,
  basicTierPrice: true,
  recommendedTierPrice: true,
  premiumTierPrice: true,
});

export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;

export const quoteCalculationSchema = z.object({
  serviceType: z.enum(["driveway_restoration", "patio_restoration", "walkway_restoration", "pool_deck_restoration"]),
  surfaceType: z.enum(["interlocking_pavers", "poured_concrete", "stamped_concrete", "brick_pavers"]),
  length: z.number().min(1).max(500),
  width: z.number().min(1).max(500),
  condition: z.enum(["lightly_dirty", "heavily_soiled", "stained_damaged"]),
  includeSealer: z.boolean(),
  includePolymericSand: z.boolean(),
});

export type QuoteCalculation = z.infer<typeof quoteCalculationSchema>;

export type QuoteTiers = {
  basic: {
    name: string;
    description: string;
    features: string[];
    price: number;
  };
  recommended: {
    name: string;
    description: string;
    features: string[];
    price: number;
  };
  premium: {
    name: string;
    description: string;
    features: string[];
    price: number;
  };
};

export type QuoteResponse = {
  squareFootage: number;
  tiers: QuoteTiers;
};
