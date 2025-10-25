import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Referenced from Replit Auth blueprint: javascript_log_in_with_replit
// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
  selectedTier: text("selected_tier").notNull(),
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

// E-Commerce Schema
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  sku: text("sku").unique(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  imageUrl: text("image_url"),
  additionalImages: jsonb("additional_images").$type<string[]>(),
  specifications: jsonb("specifications").$type<Record<string, string>>(),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"), // For guest carts
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  shippingAddress: jsonb("shipping_address").$type<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }>().notNull(),
  billingAddress: jsonb("billing_address").$type<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  productName: text("product_name").notNull(),
  productPrice: decimal("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const warranties = pgTable("warranties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warrantyNumber: text("warranty_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  productId: varchar("product_id").references(() => products.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  propertyAddress: jsonb("property_address").$type<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }>().notNull(),
  serviceType: text("service_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  warrantyLength: integer("warranty_length").notNull(), // in months
  status: text("status").notNull().default("active"), // active, expired, claimed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // manual, warranty, guide, spec
  description: text("description"),
  fileUrl: text("file_url"),
  content: text("content"), // For inline content
  productId: varchar("product_id").references(() => products.id),
  public: boolean("public").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertWarrantySchema = createInsertSchema(warranties).omit({
  id: true,
  warrantyNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Warranty = typeof warranties.$inferSelect;
export type InsertWarranty = z.infer<typeof insertWarrantySchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Property Cleaning Quote Schema
export const propertyCleaningQuotes = pgTable("property_cleaning_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  propertyAddress: text("property_address").notNull(),
  
  // Service selections
  driveway: boolean("driveway").notNull().default(false),
  roof: boolean("roof").notNull().default(false),
  siding: boolean("siding").notNull().default(false),
  gutters: boolean("gutters").notNull().default(false),
  fenceSides: integer("fence_sides").notNull().default(0), // 0-4 sides
  fencePricePerSide: decimal("fence_price_per_side", { precision: 10, scale: 2 }).notNull().default("75"), // $75 or $150
  
  // Pricing
  itemizedTotal: decimal("itemized_total", { precision: 10, scale: 2 }).notNull(),
  minimumApplied: boolean("minimum_applied").notNull().default(false),
  finalTotal: decimal("final_total", { precision: 10, scale: 2 }).notNull(),
  
  // Notes
  additionalNotes: text("additional_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Cleaning Service Prices (for reference/configuration)
export const cleaningServicePrices = {
  driveway: 300,
  roof: 300,
  siding: 300,
  gutters: 300,
  fenceSmall: 75,  // Per side for small fence
  fenceLarge: 150, // Per side for large fence
  minimumService: 975,
};

// Insert schema for property cleaning quotes
export const insertPropertyCleaningQuoteSchema = createInsertSchema(propertyCleaningQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  itemizedTotal: true,
  minimumApplied: true,
  finalTotal: true,
});

// Type exports
export type PropertyCleaningQuote = typeof propertyCleaningQuotes.$inferSelect;
export type InsertPropertyCleaningQuote = z.infer<typeof insertPropertyCleaningQuoteSchema>;

// Validation schema for API endpoint
export const propertyCleaningCalculationSchema = z.object({
  driveway: z.boolean().default(false),
  roof: z.boolean().default(false),
  siding: z.boolean().default(false),
  gutters: z.boolean().default(false),
  fenceSides: z.number().min(0).max(4).default(0),
  fencePricePerSide: z.number().min(75).max(150).default(75),
});

export type PropertyCleaningCalculation = z.infer<typeof propertyCleaningCalculationSchema>;

// Customer Inquiry Schema
export const customerInquiries = pgTable("customer_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  inquiryType: text("inquiry_type", { enum: ["quote", "support", "general", "other"] }).notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "in-progress", "resolved"] }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schema for customer inquiries
export const insertCustomerInquirySchema = createInsertSchema(customerInquiries).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type CustomerInquiry = typeof customerInquiries.$inferSelect;
export type InsertCustomerInquiry = z.infer<typeof insertCustomerInquirySchema>;
