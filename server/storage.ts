import {
  type QuoteRequest,
  type InsertQuoteRequest,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Warranty,
  type InsertWarranty,
  type Document,
  type InsertDocument,
  type PropertyCleaningQuote,
  type InsertPropertyCleaningQuote,
  type CustomerInquiry,
  type InsertCustomerInquiry,
  type Service,
  type InsertService,
  type Customer,
  type InsertCustomer,
  type Booking,
  type InsertBooking,
  type Expense,
  type InsertExpense,
  type TaxSummary,
  type InsertTaxSummary,
  type InventoryItem,
  type InsertInventoryItem,
  type JobPosting,
  type InsertJobPosting,
  type JobApplication,
  type InsertJobApplication,
  type SocialPost,
  type InsertSocialPost,
  type GbpReview,
  type InsertGbpReview,
  users as usersTable,
  quoteRequests as quoteRequestsTable,
  categories as categoriesTable,
  products as productsTable,
  cartItems as cartItemsTable,
  orders as ordersTable,
  orderItems as orderItemsTable,
  warranties as warrantiesTable,
  documents as documentsTable,
  propertyCleaningQuotes as propertyCleaningQuotesTable,
  customerInquiries as customerInquiriesTable,
  services as servicesTable,
  customers as customersTable,
  bookings as bookingsTable,
  expenses as expensesTable,
  taxSummaries as taxSummariesTable,
  inventoryItems as inventoryItemsTable,
  jobPostings as jobPostingsTable,
  jobApplications as jobApplicationsTable,
  socialPosts as socialPostsTable,
  gbpReviews as gbpReviewsTable,
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { randomUUID } from "crypto";

// Referenced from Replit Auth blueprint: javascript_log_in_with_replit
export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Quote operations
  getQuoteRequests(): Promise<QuoteRequest[]>;
  getQuoteRequest(id: string): Promise<QuoteRequest | undefined>;
  createQuoteRequest(quoteRequest: InsertQuoteRequest, calculatedData: {
    squareFootage: number;
    basicTierPrice: string;
    recommendedTierPrice: string;
    premiumTierPrice: string;
  }): Promise<QuoteRequest>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Product operations
  getProducts(categoryId?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Cart operations
  getCartItems(userId?: string, sessionId?: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId?: string, sessionId?: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrders(userId?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Warranty operations
  createWarranty(warranty: InsertWarranty): Promise<Warranty>;
  getWarranties(userId?: string): Promise<Warranty[]>;
  getWarranty(id: string): Promise<Warranty | undefined>;
  
  // Document operations
  getDocuments(category?: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Property Cleaning Quote operations
  getPropertyCleaningQuotes(): Promise<PropertyCleaningQuote[]>;
  getPropertyCleaningQuote(id: string): Promise<PropertyCleaningQuote | undefined>;
  createPropertyCleaningQuote(quote: InsertPropertyCleaningQuote, calculatedData: {
    itemizedTotal: string;
    minimumApplied: boolean;
    finalTotal: string;
  }): Promise<PropertyCleaningQuote>;

  // Customer Inquiry operations
  getCustomerInquiries(): Promise<CustomerInquiry[]>;
  getCustomerInquiry(id: string): Promise<CustomerInquiry | undefined>;
  createCustomerInquiry(inquiry: InsertCustomerInquiry): Promise<CustomerInquiry>;

  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;

  // Customer (booking) operations
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  // Booking operations
  getBookings(): Promise<(Booking & { customer: Customer; service: Service })[]>;
  getBookingsByEmail(email: string): Promise<(Booking & { customer: Customer; service: Service })[]>;
  createBooking(customerData: InsertCustomer, bookingData: Omit<InsertBooking, "customerId">): Promise<{ booking: Booking; bookingNumber: string }>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;

  // Expense operations
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<void>;

  // Tax Summary operations
  getTaxSummaries(): Promise<TaxSummary[]>;
  upsertTaxSummary(summary: InsertTaxSummary): Promise<TaxSummary>;

  // Inventory operations
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  updateInventoryQuantity(id: string, delta: number): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<void>;

  // Job Posting operations
  getJobPostings(includeAll?: boolean): Promise<JobPosting[]>;
  getJobPosting(id: string): Promise<JobPosting | undefined>;
  createJobPosting(posting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: string, posting: Partial<InsertJobPosting>): Promise<JobPosting | undefined>;

  // Job Application operations
  getJobApplications(jobId?: string): Promise<JobApplication[]>;
  getJobApplication(id: string): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplicationStatus(id: string, status: string, notes?: string): Promise<JobApplication | undefined>;

  // Social Post operations
  getSocialPosts(): Promise<SocialPost[]>;
  getSocialPost(id: string): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: string, post: Partial<InsertSocialPost>): Promise<SocialPost | undefined>;
  deleteSocialPost(id: string): Promise<void>;

  // GBP Review operations
  getGbpReviews(): Promise<GbpReview[]>;
  getGbpReview(id: string): Promise<GbpReview | undefined>;
  createGbpReview(review: InsertGbpReview): Promise<GbpReview>;
  updateGbpReviewReply(id: string, replyText: string): Promise<GbpReview | undefined>;
}

export class MemStorage implements IStorage {
  private quoteRequests: Map<string, QuoteRequest>;
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private products: Map<string, Product>;
  private cartItems: Map<string, CartItem>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private warranties: Map<string, Warranty>;
  private documents: Map<string, Document>;
  private propertyCleaningQuotes: Map<string, PropertyCleaningQuote>;
  private customerInquiries: Map<string, CustomerInquiry>;
  private services: Map<string, Service>;
  private bookingCustomers: Map<string, Customer>;
  private bookings: Map<string, Booking>;
  private expensesMap: Map<string, Expense>;
  private taxSummariesMap: Map<string, TaxSummary>;
  private inventoryItemsMap: Map<string, InventoryItem>;
  private jobPostingsMap: Map<string, JobPosting>;
  private jobApplicationsMap: Map<string, JobApplication>;
  private socialPostsMap: Map<string, SocialPost>;
  private gbpReviewsMap: Map<string, GbpReview>;

  constructor() {
    this.quoteRequests = new Map();
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.warranties = new Map();
    this.documents = new Map();
    this.propertyCleaningQuotes = new Map();
    this.customerInquiries = new Map();
    this.services = new Map();
    this.bookingCustomers = new Map();
    this.bookings = new Map();
    this.expensesMap = new Map();
    this.taxSummariesMap = new Map();
    this.inventoryItemsMap = new Map();
    this.jobPostingsMap = new Map();
    this.jobApplicationsMap = new Map();
    this.socialPostsMap = new Map();
    this.gbpReviewsMap = new Map();

    // Initialize with sample products
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample categories
    const categories = [
      {
        id: "cat-sealers",
        name: "Sealers & Coatings",
        slug: "sealers-coatings",
        description: "Professional-grade sealers for lasting protection",
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-cleaners",
        name: "Cleaners",
        slug: "cleaners",
        description: "Industrial-strength cleaning solutions",
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-sand",
        name: "Polymeric Sand",
        slug: "polymeric-sand",
        description: "Premium joint sand for paver stability",
        displayOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-tools",
        name: "Tools & Equipment",
        slug: "tools-equipment",
        description: "Professional tools for application",
        displayOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    categories.forEach(cat => this.categories.set(cat.id, cat));
    
    // Sample products
    const products = [
      {
        id: "prod-acrylic-sealer",
        categoryId: "cat-sealers",
        name: "GDS Premium Acrylic Sealer",
        slug: "gds-premium-acrylic-sealer",
        description: "Our signature acrylic sealer provides superior color enhancement and stain protection for all paver types. Water-based formula with UV resistance.",
        shortDescription: "Premium water-based acrylic sealer with UV protection",
        price: "89.99",
        compareAtPrice: "119.99",
        sku: "GDS-AS-001",
        stockQuantity: 45,
        lowStockThreshold: 10,
        imageUrl: null,
        additionalImages: [],
        specifications: {
          "Coverage": "150-200 sq ft per gallon",
          "Finish": "Wet-look gloss",
          "Dry Time": "2-4 hours",
          "Recoat Time": "24 hours",
          "VOC Content": "< 100 g/L",
        } as Record<string, string>,
        featured: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-penetrating-sealer",
        categoryId: "cat-sealers",
        name: "GDS Penetrating Siloxane Sealer",
        slug: "gds-penetrating-siloxane-sealer",
        description: "Professional-grade penetrating sealer with siloxane/silane technology. Provides invisible protection against freeze-thaw damage and de-icing salts.",
        shortDescription: "Invisible penetrating sealer for maximum protection",
        price: "149.99",
        compareAtPrice: "189.99",
        sku: "GDS-PS-001",
        stockQuantity: 32,
        lowStockThreshold: 5,
        imageUrl: null,
        additionalImages: [],
        specifications: {
          "Coverage": "100-150 sq ft per gallon",
          "Finish": "Natural/Invisible",
          "Protection": "5-7 years",
          "Penetration": "Up to 4mm",
          "VOC Content": "< 400 g/L",
        } as Record<string, string>,
        featured: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-power-clean",
        categoryId: "cat-cleaners",
        name: "GDS PowerClean Concentrate",
        slug: "gds-powerclean-concentrate",
        description: "Industrial-strength cleaner concentrate for removing oil stains, organic growth, and years of buildup. Safe for all hardscape surfaces.",
        shortDescription: "Concentrated cleaner for tough stains",
        price: "34.99",
        compareAtPrice: "44.99",
        sku: "GDS-PC-001",
        stockQuantity: 78,
        lowStockThreshold: 15,
        imageUrl: null,
        additionalImages: [],
        specifications: {
          "Dilution": "1:10 for heavy cleaning",
          "Coverage": "500 sq ft per gallon (diluted)",
          "pH Level": "12.5",
          "Biodegradable": "Yes",
        } as Record<string, string>,
        featured: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-polymeric-sand",
        categoryId: "cat-sand",
        name: "GDS ProLock Polymeric Sand",
        slug: "gds-prolock-polymeric-sand",
        description: "Premium polymeric sand with advanced polymer technology. Locks pavers in place while preventing weed growth and insect infestation.",
        shortDescription: "Advanced polymeric sand for joint stabilization",
        price: "28.99",
        compareAtPrice: "36.99",
        sku: "GDS-PS-001",
        stockQuantity: 124,
        lowStockThreshold: 20,
        imageUrl: null,
        additionalImages: [],
        specifications: {
          "Bag Size": "50 lbs",
          "Coverage": "50-75 sq ft per bag",
          "Joint Width": "1/8\" to 1\"",
          "Set Time": "24 hours",
          "Color": "Gray",
        } as Record<string, string>,
        featured: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-app-kit",
        categoryId: "cat-tools",
        name: "GDS Professional Application Kit",
        slug: "gds-professional-application-kit",
        description: "Complete kit for professional sealer application. Includes premium roller, extension pole, tray, and protective gear.",
        shortDescription: "Complete sealer application kit",
        price: "89.99",
        compareAtPrice: "119.99",
        sku: "GDS-AK-001",
        stockQuantity: 18,
        lowStockThreshold: 5,
        imageUrl: null,
        additionalImages: [],
        specifications: {
          "Roller Width": "18 inches",
          "Pole Length": "4-8 ft adjustable",
          "Material": "Professional-grade microfiber",
          "Includes": "Roller, pole, tray, gloves, safety glasses",
        } as Record<string, string>,
        featured: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    products.forEach(prod => this.products.set(prod.id, prod as Product));
    
    // Sample documents
    const documents = [
      {
        id: "doc-maintenance-guide",
        title: "Paver Maintenance Guide",
        slug: "paver-maintenance-guide",
        category: "guide",
        description: "Complete guide to maintaining your pavers year-round",
        fileUrl: null,
        content: "# Paver Maintenance Guide\n\n## Spring Maintenance\n- Inspect for winter damage\n- Clean debris from joints\n- Apply fresh polymeric sand if needed\n\n## Summer Care\n- Regular cleaning schedule\n- Stain removal techniques\n- Sealer inspection\n\n## Fall Preparation\n- Deep cleaning before winter\n- Joint sand inspection\n- Sealer application timing\n\n## Winter Protection\n- De-icing salt alternatives\n- Snow removal best practices\n- Freeze-thaw protection",
        productId: null,
        public: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "doc-warranty-terms",
        title: "Warranty Terms & Conditions",
        slug: "warranty-terms-conditions",
        category: "warranty",
        description: "Standard warranty terms for all GDS services",
        fileUrl: null,
        content: "# Warranty Terms & Conditions\n\n## Coverage Period\n- Basic Service: 2 years\n- Recommended Service: 3 years\n- Premium Service: 5 years\n\n## What's Covered\n- Sealer performance\n- Color retention\n- Joint sand stability\n\n## Exclusions\n- Physical damage\n- Improper maintenance\n- Natural disasters",
        productId: null,
        public: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    documents.forEach(doc => this.documents.set(doc.id, doc as Document));

    // Sample services for booking system
    const bookingServices: Service[] = [
      {
        id: "svc-house-siding",
        name: "House Siding",
        description: "Professional soft wash cleaning for vinyl, wood, and fiber cement siding.",
        basePrice: "150.00",
        pricePerSqFt: "0.1000",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "svc-driveway",
        name: "Driveway",
        description: "High-pressure cleaning for concrete, asphalt, and paver driveways.",
        basePrice: "100.00",
        pricePerSqFt: "0.1200",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "svc-deck-patio",
        name: "Deck & Patio",
        description: "Thorough cleaning for wood decks, composite decking, and paver patios.",
        basePrice: "125.00",
        pricePerSqFt: "0.1500",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "svc-roof-cleaning",
        name: "Roof Cleaning",
        description: "Safe soft wash treatment to remove algae, moss, and stains without damaging shingles.",
        basePrice: "200.00",
        pricePerSqFt: "0.2500",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    bookingServices.forEach(s => this.services.set(s.id, s));
  }

  // User operations - Referenced from Replit Auth blueprint
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const now = new Date();
    
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: existingUser?.createdAt ?? now,
      updatedAt: now,
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getQuoteRequests(): Promise<QuoteRequest[]> {
    return Array.from(this.quoteRequests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest | undefined> {
    return this.quoteRequests.get(id);
  }

  async createQuoteRequest(
    insertQuoteRequest: InsertQuoteRequest, 
    calculatedData: {
      squareFootage: number;
      basicTierPrice: string;
      recommendedTierPrice: string;
      premiumTierPrice: string;
    }
  ): Promise<QuoteRequest> {
    const id = randomUUID();
    const quoteRequest: QuoteRequest = { 
      ...insertQuoteRequest,
      ...calculatedData,
      id,
      createdAt: new Date(),
      includeSealer: insertQuoteRequest.includeSealer ?? false,
      includePolymericSand: insertQuoteRequest.includePolymericSand ?? false,
    };
    this.quoteRequests.set(id, quoteRequest);
    return quoteRequest;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const now = new Date();
    const newCategory: Category = {
      ...category,
      id,
      displayOrder: category.displayOrder ?? 0,
      description: category.description ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Product operations
  async getProducts(categoryId?: string): Promise<Product[]> {
    let products = Array.from(this.products.values());
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }
    return products.filter(p => p.active);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.slug === slug);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const now = new Date();
    const newProduct: Product = {
      ...product,
      id,
      categoryId: product.categoryId ?? null,
      description: product.description ?? null,
      shortDescription: product.shortDescription ?? null,
      compareAtPrice: product.compareAtPrice ?? null,
      sku: product.sku ?? null,
      imageUrl: product.imageUrl ?? null,
      additionalImages: (product.additionalImages ?? []) as string[],
      specifications: product.specifications ?? {},
      featured: product.featured ?? false,
      active: product.active ?? true,
      stockQuantity: product.stockQuantity ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = {
      ...existing,
      ...product,
      additionalImages: product.additionalImages 
        ? (product.additionalImages as string[])
        : existing.additionalImages,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  // Cart operations
  async getCartItems(userId?: string, sessionId?: string): Promise<(CartItem & { product: Product })[]> {
    const items = Array.from(this.cartItems.values())
      .filter(item => {
        if (userId) return item.userId === userId;
        if (sessionId) return item.sessionId === sessionId;
        return false;
      });
    
    return items.map(item => {
      const product = this.products.get(item.productId)!;
      return { ...item, product };
    }).filter(item => item.product);
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    const now = new Date();
    const newItem: CartItem = {
      ...item,
      id,
      userId: item.userId ?? null,
      sessionId: item.sessionId ?? null,
      quantity: item.quantity ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    this.cartItems.set(id, newItem);
    return newItem;
  }

  async updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;
    
    const updated: CartItem = {
      ...item,
      quantity,
      updatedAt: new Date(),
    };
    this.cartItems.set(id, updated);
    return updated;
  }

  async removeFromCart(id: string): Promise<void> {
    this.cartItems.delete(id);
  }

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const items = Array.from(this.cartItems.entries())
      .filter(([_, item]) => {
        if (userId) return item.userId === userId;
        if (sessionId) return item.sessionId === sessionId;
        return false;
      });
    
    items.forEach(([id]) => this.cartItems.delete(id));
  }

  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const orderId = randomUUID();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const now = new Date();
    
    const newOrder: Order = {
      ...order,
      id: orderId,
      orderNumber,
      userId: order.userId ?? null,
      phone: order.phone ?? null,
      billingAddress: order.billingAddress ?? null,
      stripePaymentIntentId: order.stripePaymentIntentId ?? null,
      trackingNumber: order.trackingNumber ?? null,
      notes: order.notes ?? null,
      status: order.status ?? "pending",
      tax: order.tax ?? "0",
      shipping: order.shipping ?? "0",
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(orderId, newOrder);
    
    // Create order items
    items.forEach(item => {
      const itemId = randomUUID();
      const newItem: OrderItem = {
        ...item,
        id: itemId,
        orderId,
        createdAt: now,
      };
      this.orderItems.set(itemId, newItem);
    });
    
    return newOrder;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    if (userId) {
      orders = orders.filter(o => o.userId === userId);
    }
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated: Order = {
      ...order,
      status,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  // Warranty operations
  async createWarranty(warranty: InsertWarranty): Promise<Warranty> {
    const id = randomUUID();
    const warrantyNumber = `WAR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const now = new Date();
    
    const newWarranty: Warranty = {
      ...warranty,
      id,
      warrantyNumber,
      userId: warranty.userId ?? null,
      orderId: warranty.orderId ?? null,
      productId: warranty.productId ?? null,
      customerPhone: warranty.customerPhone ?? null,
      notes: warranty.notes ?? null,
      status: warranty.status ?? "active",
      createdAt: now,
      updatedAt: now,
    };
    this.warranties.set(id, newWarranty);
    return newWarranty;
  }

  async getWarranties(userId?: string): Promise<Warranty[]> {
    let warranties = Array.from(this.warranties.values());
    if (userId) {
      warranties = warranties.filter(w => w.userId === userId);
    }
    return warranties.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getWarranty(id: string): Promise<Warranty | undefined> {
    return this.warranties.get(id);
  }

  // Document operations
  async getDocuments(category?: string): Promise<Document[]> {
    let documents = Array.from(this.documents.values());
    if (category) {
      documents = documents.filter(d => d.category === category);
    }
    return documents
      .filter(d => d.public)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    
    const newDocument: Document = {
      ...document,
      id,
      description: document.description ?? null,
      fileUrl: document.fileUrl ?? null,
      content: document.content ?? null,
      productId: document.productId ?? null,
      public: document.public ?? false,
      displayOrder: document.displayOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  // Property Cleaning Quote operations
  async getPropertyCleaningQuotes(): Promise<PropertyCleaningQuote[]> {
    const quotes = Array.from(this.propertyCleaningQuotes.values());
    return quotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPropertyCleaningQuote(id: string): Promise<PropertyCleaningQuote | undefined> {
    return this.propertyCleaningQuotes.get(id);
  }

  async createPropertyCleaningQuote(
    quote: InsertPropertyCleaningQuote,
    calculatedData: {
      itemizedTotal: string;
      minimumApplied: boolean;
      finalTotal: string;
    }
  ): Promise<PropertyCleaningQuote> {
    const id = randomUUID();
    const now = new Date();
    
    const newQuote: PropertyCleaningQuote = {
      ...quote,
      id,
      driveway: quote.driveway ?? false,
      roof: quote.roof ?? false,
      siding: quote.siding ?? false,
      gutters: quote.gutters ?? false,
      fenceSides: quote.fenceSides ?? 0,
      fencePricePerSide: String(quote.fencePricePerSide ?? 75),
      itemizedTotal: calculatedData.itemizedTotal,
      minimumApplied: calculatedData.minimumApplied,
      finalTotal: calculatedData.finalTotal,
      additionalNotes: quote.additionalNotes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.propertyCleaningQuotes.set(id, newQuote);
    return newQuote;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values()).filter(s => s.active);
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  // Customer (booking) operations
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.bookingCustomers.values()).find(c => c.email === email);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const now = new Date();
    const newCustomer: Customer = { ...customer, id, createdAt: now, updatedAt: now };
    this.bookingCustomers.set(id, newCustomer);
    return newCustomer;
  }

  // Booking operations
  async getBookings(): Promise<(Booking & { customer: Customer; service: Service })[]> {
    return Array.from(this.bookings.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(booking => {
        const customer = this.bookingCustomers.get(booking.customerId)!;
        const service = this.services.get(booking.serviceId)!;
        return { ...booking, customer, service };
      })
      .filter(b => b.customer && b.service);
  }

  async getBookingsByEmail(email: string): Promise<(Booking & { customer: Customer; service: Service })[]> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer) return [];
    return Array.from(this.bookings.values())
      .filter(b => b.customerId === customer.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(booking => {
        const service = this.services.get(booking.serviceId)!;
        return { ...booking, customer, service };
      })
      .filter(b => b.service);
  }

  async createBooking(
    customerData: InsertCustomer,
    bookingData: Omit<InsertBooking, "customerId">,
  ): Promise<{ booking: Booking; bookingNumber: string }> {
    let customer = await this.getCustomerByEmail(customerData.email);
    if (!customer) {
      customer = await this.createCustomer(customerData);
    } else {
      // Update existing customer details
      const updated: Customer = { ...customer, ...customerData, updatedAt: new Date() };
      this.bookingCustomers.set(customer.id, updated);
      customer = updated;
    }

    const id = randomUUID();
    const bookingNumber = `BKG-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const now = new Date();
    const newBooking: Booking = {
      ...bookingData,
      id,
      bookingNumber,
      customerId: customer.id,
      status: bookingData.status ?? "scheduled",
      specialInstructions: bookingData.specialInstructions ?? null,
      scheduledDate: new Date(bookingData.scheduledDate),
      createdAt: now,
      updatedAt: now,
    };
    this.bookings.set(id, newBooking);
    return { booking: newBooking, bookingNumber };
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    const updated: Booking = { ...booking, status, updatedAt: new Date() };
    this.bookings.set(id, updated);
    return updated;
  }

  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expensesMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getExpense(id: string): Promise<Expense | undefined> { return this.expensesMap.get(id); }
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const newExpense: Expense = { ...expense, id, description: expense.description ?? null, mileage: expense.mileage ?? null, taxDeductible: expense.taxDeductible ?? true, createdAt: new Date() };
    this.expensesMap.set(id, newExpense);
    return newExpense;
  }
  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expensesMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...expense };
    this.expensesMap.set(id, updated);
    return updated;
  }
  async deleteExpense(id: string): Promise<void> { this.expensesMap.delete(id); }

  // Tax Summary operations
  async getTaxSummaries(): Promise<TaxSummary[]> {
    return Array.from(this.taxSummariesMap.values()).sort((a, b) => b.year - a.year || b.quarter - a.quarter);
  }
  async upsertTaxSummary(summary: InsertTaxSummary): Promise<TaxSummary> {
    const existing = Array.from(this.taxSummariesMap.values()).find(s => s.year === summary.year && s.quarter === summary.quarter);
    const id = existing?.id ?? randomUUID();
    const newSummary: TaxSummary = { ...summary, id, totalRevenue: summary.totalRevenue ?? "0", totalExpenses: summary.totalExpenses ?? "0", taxableIncome: summary.taxableIncome ?? "0", estimatedTax: summary.estimatedTax ?? "0", createdAt: existing?.createdAt ?? new Date() };
    this.taxSummariesMap.set(id, newSummary);
    return newSummary;
  }

  // Inventory operations
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItemsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> { return this.inventoryItemsMap.get(id); }
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const newItem: InventoryItem = { ...item, id, vendor: item.vendor ?? null, notes: item.notes ?? null, quantityOnHand: item.quantityOnHand ?? "0", reorderPoint: item.reorderPoint ?? "0", costPerUnit: item.costPerUnit ?? "0", updatedAt: new Date() };
    this.inventoryItemsMap.set(id, newItem);
    return newItem;
  }
  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existing = this.inventoryItemsMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item, updatedAt: new Date() };
    this.inventoryItemsMap.set(id, updated);
    return updated;
  }
  async updateInventoryQuantity(id: string, delta: number): Promise<InventoryItem | undefined> {
    const existing = this.inventoryItemsMap.get(id);
    if (!existing) return undefined;
    const newQty = Math.max(0, parseFloat(existing.quantityOnHand) + delta);
    const updated = { ...existing, quantityOnHand: newQty.toFixed(2), updatedAt: new Date() };
    this.inventoryItemsMap.set(id, updated);
    return updated;
  }
  async deleteInventoryItem(id: string): Promise<void> { this.inventoryItemsMap.delete(id); }

  // Job Posting operations
  async getJobPostings(includeAll = false): Promise<JobPosting[]> {
    let postings = Array.from(this.jobPostingsMap.values());
    if (!includeAll) postings = postings.filter(p => p.status === "open");
    return postings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getJobPosting(id: string): Promise<JobPosting | undefined> { return this.jobPostingsMap.get(id); }
  async createJobPosting(posting: InsertJobPosting): Promise<JobPosting> {
    const id = randomUUID();
    const newPosting: JobPosting = { ...posting, id, status: posting.status ?? "open", createdAt: new Date() };
    this.jobPostingsMap.set(id, newPosting);
    return newPosting;
  }
  async updateJobPosting(id: string, posting: Partial<InsertJobPosting>): Promise<JobPosting | undefined> {
    const existing = this.jobPostingsMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...posting };
    this.jobPostingsMap.set(id, updated);
    return updated;
  }

  // Job Application operations
  async getJobApplications(jobId?: string): Promise<JobApplication[]> {
    let apps = Array.from(this.jobApplicationsMap.values());
    if (jobId) apps = apps.filter(a => a.jobId === jobId);
    return apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }
  async getJobApplication(id: string): Promise<JobApplication | undefined> { return this.jobApplicationsMap.get(id); }
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const id = randomUUID();
    const newApp: JobApplication = { ...application, id, status: application.status ?? "new", notes: application.notes ?? null, appliedAt: new Date() };
    this.jobApplicationsMap.set(id, newApp);
    return newApp;
  }
  async updateJobApplicationStatus(id: string, status: string, notes?: string): Promise<JobApplication | undefined> {
    const existing = this.jobApplicationsMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status: status as JobApplication["status"], notes: notes ?? existing.notes };
    this.jobApplicationsMap.set(id, updated);
    return updated;
  }

  // Social Post operations
  async getSocialPosts(): Promise<SocialPost[]> {
    return Array.from(this.socialPostsMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getSocialPost(id: string): Promise<SocialPost | undefined> { return this.socialPostsMap.get(id); }
  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const id = randomUUID();
    const newPost: SocialPost = { ...post, id, mediaUrl: post.mediaUrl ?? null, scheduledAt: post.scheduledAt ?? null, status: post.status ?? "draft", hashtags: (post.hashtags ?? null) as string[] | null, createdAt: new Date() };
    this.socialPostsMap.set(id, newPost);
    return newPost;
  }
  async updateSocialPost(id: string, post: Partial<InsertSocialPost>): Promise<SocialPost | undefined> {
    const existing = this.socialPostsMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...post };
    this.socialPostsMap.set(id, updated);
    return updated;
  }
  async deleteSocialPost(id: string): Promise<void> { this.socialPostsMap.delete(id); }

  // GBP Review operations
  async getGbpReviews(): Promise<GbpReview[]> {
    return Array.from(this.gbpReviewsMap.values()).sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
  }
  async getGbpReview(id: string): Promise<GbpReview | undefined> { return this.gbpReviewsMap.get(id); }
  async createGbpReview(review: InsertGbpReview): Promise<GbpReview> {
    const id = randomUUID();
    const newReview: GbpReview = { ...review, id, replied: review.replied ?? false, comment: review.comment ?? null, replyText: review.replyText ?? null, googleReviewId: review.googleReviewId ?? null };
    this.gbpReviewsMap.set(id, newReview);
    return newReview;
  }
  async updateGbpReviewReply(id: string, replyText: string): Promise<GbpReview | undefined> {
    const existing = this.gbpReviewsMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, replied: true, replyText };
    this.gbpReviewsMap.set(id, updated);
    return updated;
  }

  // Customer Inquiry operations
  async getCustomerInquiries(): Promise<CustomerInquiry[]> {
    const inquiries = Array.from(this.customerInquiries.values());
    return inquiries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCustomerInquiry(id: string): Promise<CustomerInquiry | undefined> {
    return this.customerInquiries.get(id);
  }

  async createCustomerInquiry(inquiry: InsertCustomerInquiry): Promise<CustomerInquiry> {
    const id = randomUUID();
    const now = new Date();
    
    const newInquiry: CustomerInquiry = {
      ...inquiry,
      id,
      inquiryType: inquiry.inquiryType as "quote" | "support" | "general" | "other",
      status: "new",
      subject: inquiry.subject ?? "",
      createdAt: now,
      updatedAt: now,
    };
    
    this.customerInquiries.set(id, newInquiry);
    return newInquiry;
  }
}

// ── DatabaseStorage ──────────────────────────────────────────────────────────

type DB = NonNullable<typeof db>;

export class DatabaseStorage implements IStorage {
  constructor(private db: DB) {}

  // ── Seed helpers ────────────────────────────────────────────────────────────

  async seed() {
    // Only seed if services table is empty
    const existing = await this.db.select().from(servicesTable).limit(1);
    if (existing.length > 0) return;

    console.log("[DB] Seeding initial data...");

    // Categories
    await this.db.insert(categoriesTable).values([
      { id: "cat-sealers", name: "Sealers & Coatings", slug: "sealers-coatings", description: "Professional-grade sealers for lasting protection", displayOrder: 1 },
      { id: "cat-cleaners", name: "Cleaners", slug: "cleaners", description: "Industrial-strength cleaning solutions", displayOrder: 2 },
      { id: "cat-sand", name: "Polymeric Sand", slug: "polymeric-sand", description: "Premium joint sand for paver stability", displayOrder: 3 },
      { id: "cat-tools", name: "Tools & Equipment", slug: "tools-equipment", description: "Professional tools for application", displayOrder: 4 },
    ]).onConflictDoNothing();

    // Products
    await this.db.insert(productsTable).values([
      { id: "prod-acrylic-sealer", categoryId: "cat-sealers", name: "GDS Premium Acrylic Sealer", slug: "gds-premium-acrylic-sealer", description: "Our signature acrylic sealer provides superior color enhancement and stain protection for all paver types.", shortDescription: "Premium water-based acrylic sealer with UV protection", price: "89.99", compareAtPrice: "119.99", sku: "GDS-AS-001", stockQuantity: 45, lowStockThreshold: 10, featured: true, active: true, specifications: { "Coverage": "150-200 sq ft per gallon", "Finish": "Wet-look gloss", "Dry Time": "2-4 hours" } },
      { id: "prod-penetrating-sealer", categoryId: "cat-sealers", name: "GDS Penetrating Siloxane Sealer", slug: "gds-penetrating-siloxane-sealer", description: "Professional-grade penetrating sealer with siloxane/silane technology.", shortDescription: "Invisible penetrating sealer for maximum protection", price: "149.99", compareAtPrice: "189.99", sku: "GDS-PS-001", stockQuantity: 32, lowStockThreshold: 5, featured: true, active: true, specifications: { "Coverage": "100-150 sq ft per gallon", "Finish": "Natural/Invisible", "Protection": "5-7 years" } },
      { id: "prod-power-clean", categoryId: "cat-cleaners", name: "GDS PowerClean Concentrate", slug: "gds-powerclean-concentrate", description: "Industrial-strength cleaner concentrate for removing oil stains, organic growth, and years of buildup.", shortDescription: "Concentrated cleaner for tough stains", price: "34.99", compareAtPrice: "44.99", sku: "GDS-PC-001", stockQuantity: 78, lowStockThreshold: 15, featured: false, active: true, specifications: { "Dilution": "1:10 for heavy cleaning", "pH Level": "12.5", "Biodegradable": "Yes" } },
      { id: "prod-polymeric-sand", categoryId: "cat-sand", name: "GDS ProLock Polymeric Sand", slug: "gds-prolock-polymeric-sand", description: "Premium polymeric sand with advanced polymer technology.", shortDescription: "Advanced polymeric sand for joint stabilization", price: "28.99", compareAtPrice: "36.99", sku: "GDS-PP-001", stockQuantity: 124, lowStockThreshold: 20, featured: false, active: true, specifications: { "Bag Size": "50 lbs", "Coverage": "50-75 sq ft per bag", "Color": "Gray" } },
      { id: "prod-app-kit", categoryId: "cat-tools", name: "GDS Professional Application Kit", slug: "gds-professional-application-kit", description: "Complete kit for professional sealer application.", shortDescription: "Complete sealer application kit", price: "89.99", compareAtPrice: "119.99", sku: "GDS-AK-001", stockQuantity: 18, lowStockThreshold: 5, featured: false, active: true, specifications: { "Roller Width": "18 inches", "Pole Length": "4-8 ft adjustable" } },
    ]).onConflictDoNothing();

    // Documents
    await this.db.insert(documentsTable).values([
      { id: "doc-maintenance", title: "Paver Maintenance Guide", slug: "paver-maintenance-guide", category: "guide", description: "Complete guide to maintaining your pavers after restoration", content: "Regular maintenance extends the life of your paver restoration. Clean annually, reapply sealer every 2-3 years.", public: true, displayOrder: 1 },
      { id: "doc-warranty", title: "Standard Warranty Terms", slug: "standard-warranty-terms", category: "warranty", description: "Standard warranty terms for all GDS services", content: "Good Day Pressure Washing warrants all restoration work against defects in materials and workmanship.", public: true, displayOrder: 2 },
    ]).onConflictDoNothing();

    // Booking services
    await this.db.insert(servicesTable).values([
      { id: "svc-house-siding", name: "House Siding", description: "Professional soft wash cleaning for vinyl, wood, and fiber cement siding.", basePrice: "150.00", pricePerSqFt: "0.1000", active: true },
      { id: "svc-driveway", name: "Driveway", description: "High-pressure cleaning for concrete, asphalt, and paver driveways.", basePrice: "100.00", pricePerSqFt: "0.1200", active: true },
      { id: "svc-deck-patio", name: "Deck & Patio", description: "Thorough cleaning for wood decks, composite decking, and paver patios.", basePrice: "125.00", pricePerSqFt: "0.1500", active: true },
      { id: "svc-roof-cleaning", name: "Roof Cleaning", description: "Safe soft wash treatment to remove algae, moss, and stains without damaging shingles.", basePrice: "200.00", pricePerSqFt: "0.2500", active: true },
    ]).onConflictDoNothing();

    console.log("[DB] Seed complete.");
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const rows = await this.db.select().from(usersTable).where(eq(usersTable.id, id));
    return rows[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const rows = await this.db.insert(usersTable).values({
      ...userData,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: usersTable.id,
      set: { email: userData.email, firstName: userData.firstName, lastName: userData.lastName, profileImageUrl: userData.profileImageUrl, updatedAt: new Date() },
    }).returning();
    return rows[0];
  }

  // ── Quote Requests ───────────────────────────────────────────────────────────

  async getQuoteRequests(): Promise<QuoteRequest[]> {
    return this.db.select().from(quoteRequestsTable).orderBy(desc(quoteRequestsTable.createdAt));
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest | undefined> {
    const rows = await this.db.select().from(quoteRequestsTable).where(eq(quoteRequestsTable.id, id));
    return rows[0];
  }

  async createQuoteRequest(insertData: InsertQuoteRequest, calc: { squareFootage: number; basicTierPrice: string; recommendedTierPrice: string; premiumTierPrice: string }): Promise<QuoteRequest> {
    const rows = await this.db.insert(quoteRequestsTable).values({ ...insertData, ...calc }).returning();
    return rows[0];
  }

  // ── Categories ───────────────────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    return this.db.select().from(categoriesTable).orderBy(asc(categoriesTable.displayOrder));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const rows = await this.db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    return rows[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const rows = await this.db.insert(categoriesTable).values(category).returning();
    return rows[0];
  }

  // ── Products ─────────────────────────────────────────────────────────────────

  async getProducts(categoryId?: string): Promise<Product[]> {
    const q = this.db.select().from(productsTable).where(eq(productsTable.active, true));
    if (categoryId) {
      return this.db.select().from(productsTable).where(eq(productsTable.categoryId, categoryId));
    }
    return q;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const rows = await this.db.select().from(productsTable).where(eq(productsTable.id, id));
    return rows[0];
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const rows = await this.db.select().from(productsTable).where(eq(productsTable.slug, slug));
    return rows[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const rows = await this.db.insert(productsTable).values(product as any).returning();
    return rows[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const rows = await this.db.update(productsTable).set({ ...(product as any), updatedAt: new Date() }).where(eq(productsTable.id, id)).returning();
    return rows[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.delete(productsTable).where(eq(productsTable.id, id));
  }

  // ── Cart ─────────────────────────────────────────────────────────────────────

  async getCartItems(userId?: string, sessionId?: string): Promise<(CartItem & { product: Product })[]> {
    const condition = userId
      ? eq(cartItemsTable.userId, userId)
      : eq(cartItemsTable.sessionId, sessionId!);
    const rows = await this.db
      .select({ cartItem: cartItemsTable, product: productsTable })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(condition);
    return rows.map(r => ({ ...r.cartItem, product: r.product }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const rows = await this.db.insert(cartItemsTable).values(item).returning();
    return rows[0];
  }

  async updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined> {
    const rows = await this.db.update(cartItemsTable).set({ quantity, updatedAt: new Date() }).where(eq(cartItemsTable.id, id)).returning();
    return rows[0];
  }

  async removeFromCart(id: string): Promise<void> {
    await this.db.delete(cartItemsTable).where(eq(cartItemsTable.id, id));
  }

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const condition = userId
      ? eq(cartItemsTable.userId, userId)
      : eq(cartItemsTable.sessionId, sessionId!);
    await this.db.delete(cartItemsTable).where(condition);
  }

  // ── Orders ───────────────────────────────────────────────────────────────────

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const rows = await this.db.insert(ordersTable).values({ ...order, orderNumber }).returning();
    const newOrder = rows[0];
    if (items.length > 0) {
      await this.db.insert(orderItemsTable).values(items.map(i => ({ ...i, orderId: newOrder.id })));
    }
    return newOrder;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    if (userId) {
      return this.db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
    }
    return this.db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const rows = await this.db.select().from(ordersTable).where(eq(ordersTable.id, id));
    return rows[0];
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const rows = await this.db.update(ordersTable).set({ status, updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
    return rows[0];
  }

  // ── Warranties ───────────────────────────────────────────────────────────────

  async createWarranty(warranty: InsertWarranty): Promise<Warranty> {
    const warrantyNumber = `WAR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const rows = await this.db.insert(warrantiesTable).values({ ...warranty, warrantyNumber }).returning();
    return rows[0];
  }

  async getWarranties(userId?: string): Promise<Warranty[]> {
    if (userId) {
      return this.db.select().from(warrantiesTable).where(eq(warrantiesTable.userId, userId)).orderBy(desc(warrantiesTable.createdAt));
    }
    return this.db.select().from(warrantiesTable).orderBy(desc(warrantiesTable.createdAt));
  }

  async getWarranty(id: string): Promise<Warranty | undefined> {
    const rows = await this.db.select().from(warrantiesTable).where(eq(warrantiesTable.id, id));
    return rows[0];
  }

  // ── Documents ────────────────────────────────────────────────────────────────

  async getDocuments(category?: string): Promise<Document[]> {
    if (category) {
      return this.db.select().from(documentsTable).where(eq(documentsTable.category, category)).orderBy(asc(documentsTable.displayOrder));
    }
    return this.db.select().from(documentsTable).where(eq(documentsTable.public, true)).orderBy(asc(documentsTable.displayOrder));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const rows = await this.db.select().from(documentsTable).where(eq(documentsTable.id, id));
    return rows[0];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const rows = await this.db.insert(documentsTable).values(document).returning();
    return rows[0];
  }

  // ── Property Cleaning Quotes ─────────────────────────────────────────────────

  async getPropertyCleaningQuotes(): Promise<PropertyCleaningQuote[]> {
    return this.db.select().from(propertyCleaningQuotesTable).orderBy(desc(propertyCleaningQuotesTable.createdAt));
  }

  async getPropertyCleaningQuote(id: string): Promise<PropertyCleaningQuote | undefined> {
    const rows = await this.db.select().from(propertyCleaningQuotesTable).where(eq(propertyCleaningQuotesTable.id, id));
    return rows[0];
  }

  async createPropertyCleaningQuote(quote: InsertPropertyCleaningQuote, calc: { itemizedTotal: string; minimumApplied: boolean; finalTotal: string }): Promise<PropertyCleaningQuote> {
    const rows = await this.db.insert(propertyCleaningQuotesTable).values({ ...quote, ...calc }).returning();
    return rows[0];
  }

  // ── Customer Inquiries ───────────────────────────────────────────────────────

  async getCustomerInquiries(): Promise<CustomerInquiry[]> {
    return this.db.select().from(customerInquiriesTable).orderBy(desc(customerInquiriesTable.createdAt));
  }

  async getCustomerInquiry(id: string): Promise<CustomerInquiry | undefined> {
    const rows = await this.db.select().from(customerInquiriesTable).where(eq(customerInquiriesTable.id, id));
    return rows[0];
  }

  async createCustomerInquiry(inquiry: InsertCustomerInquiry): Promise<CustomerInquiry> {
    const rows = await this.db.insert(customerInquiriesTable).values({ ...inquiry, status: "new" }).returning();
    return rows[0];
  }

  // ── Services ─────────────────────────────────────────────────────────────────

  async getServices(): Promise<Service[]> {
    return this.db.select().from(servicesTable).where(eq(servicesTable.active, true));
  }

  async getService(id: string): Promise<Service | undefined> {
    const rows = await this.db.select().from(servicesTable).where(eq(servicesTable.id, id));
    return rows[0];
  }

  // ── Customers ────────────────────────────────────────────────────────────────

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const rows = await this.db.select().from(customersTable).where(eq(customersTable.email, email));
    return rows[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const rows = await this.db.insert(customersTable).values(customer).returning();
    return rows[0];
  }

  // ── Bookings ─────────────────────────────────────────────────────────────────

  async getBookings(): Promise<(Booking & { customer: Customer; service: Service })[]> {
    const rows = await this.db
      .select({ booking: bookingsTable, customer: customersTable, service: servicesTable })
      .from(bookingsTable)
      .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
      .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
      .orderBy(desc(bookingsTable.createdAt));
    return rows.map(r => ({ ...r.booking, customer: r.customer, service: r.service }));
  }

  async getBookingsByEmail(email: string): Promise<(Booking & { customer: Customer; service: Service })[]> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer) return [];
    const rows = await this.db
      .select({ booking: bookingsTable, customer: customersTable, service: servicesTable })
      .from(bookingsTable)
      .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
      .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
      .where(eq(bookingsTable.customerId, customer.id))
      .orderBy(desc(bookingsTable.createdAt));
    return rows.map(r => ({ ...r.booking, customer: r.customer, service: r.service }));
  }

  async createBooking(customerData: InsertCustomer, bookingData: Omit<InsertBooking, "customerId">): Promise<{ booking: Booking; bookingNumber: string }> {
    let customer = await this.getCustomerByEmail(customerData.email);
    if (!customer) {
      customer = await this.createCustomer(customerData);
    } else {
      const updated = await this.db.update(customersTable).set({ ...customerData, updatedAt: new Date() }).where(eq(customersTable.id, customer.id)).returning();
      customer = updated[0];
    }
    const bookingNumber = `BKG-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const rows = await this.db.insert(bookingsTable).values({ ...bookingData, customerId: customer.id, bookingNumber, status: bookingData.status ?? "scheduled" }).returning();
    return { booking: rows[0], bookingNumber };
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const rows = await this.db.update(bookingsTable).set({ status, updatedAt: new Date() }).where(eq(bookingsTable.id, id)).returning();
    return rows[0];
  }

  // ── Expenses ─────────────────────────────────────────────────────────────────

  async getExpenses(): Promise<Expense[]> {
    return this.db.select().from(expensesTable).orderBy(desc(expensesTable.date));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const rows = await this.db.select().from(expensesTable).where(eq(expensesTable.id, id));
    return rows[0];
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const rows = await this.db.insert(expensesTable).values(expense).returning();
    return rows[0];
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const rows = await this.db.update(expensesTable).set(expense as any).where(eq(expensesTable.id, id)).returning();
    return rows[0];
  }

  async deleteExpense(id: string): Promise<void> {
    await this.db.delete(expensesTable).where(eq(expensesTable.id, id));
  }

  // ── Tax Summaries ─────────────────────────────────────────────────────────────

  async getTaxSummaries(): Promise<TaxSummary[]> {
    return this.db.select().from(taxSummariesTable).orderBy(desc(taxSummariesTable.year), desc(taxSummariesTable.quarter));
  }

  async upsertTaxSummary(summary: InsertTaxSummary): Promise<TaxSummary> {
    const rows = await this.db.insert(taxSummariesTable).values(summary).onConflictDoNothing().returning();
    if (rows.length > 0) return rows[0];
    const existing = await this.db.select().from(taxSummariesTable)
      .where(eq(taxSummariesTable.year, summary.year));
    return existing[0];
  }

  // ── Inventory Items ───────────────────────────────────────────────────────────

  async getInventoryItems(): Promise<InventoryItem[]> {
    return this.db.select().from(inventoryItemsTable).orderBy(asc(inventoryItemsTable.name));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const rows = await this.db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, id));
    return rows[0];
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const rows = await this.db.insert(inventoryItemsTable).values(item).returning();
    return rows[0];
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const rows = await this.db.update(inventoryItemsTable).set({ ...(item as any), updatedAt: new Date() }).where(eq(inventoryItemsTable.id, id)).returning();
    return rows[0];
  }

  async updateInventoryQuantity(id: string, delta: number): Promise<InventoryItem | undefined> {
    const existing = await this.getInventoryItem(id);
    if (!existing) return undefined;
    const newQty = Math.max(0, parseFloat(existing.quantityOnHand) + delta);
    const rows = await this.db.update(inventoryItemsTable).set({ quantityOnHand: newQty.toFixed(2), updatedAt: new Date() }).where(eq(inventoryItemsTable.id, id)).returning();
    return rows[0];
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await this.db.delete(inventoryItemsTable).where(eq(inventoryItemsTable.id, id));
  }

  // ── Job Postings ──────────────────────────────────────────────────────────────

  async getJobPostings(includeAll = false): Promise<JobPosting[]> {
    if (includeAll) {
      return this.db.select().from(jobPostingsTable).orderBy(desc(jobPostingsTable.createdAt));
    }
    return this.db.select().from(jobPostingsTable).where(eq(jobPostingsTable.status, "open")).orderBy(desc(jobPostingsTable.createdAt));
  }

  async getJobPosting(id: string): Promise<JobPosting | undefined> {
    const rows = await this.db.select().from(jobPostingsTable).where(eq(jobPostingsTable.id, id));
    return rows[0];
  }

  async createJobPosting(posting: InsertJobPosting): Promise<JobPosting> {
    const rows = await this.db.insert(jobPostingsTable).values(posting).returning();
    return rows[0];
  }

  async updateJobPosting(id: string, posting: Partial<InsertJobPosting>): Promise<JobPosting | undefined> {
    const rows = await this.db.update(jobPostingsTable).set(posting as any).where(eq(jobPostingsTable.id, id)).returning();
    return rows[0];
  }

  // ── Job Applications ──────────────────────────────────────────────────────────

  async getJobApplications(jobId?: string): Promise<JobApplication[]> {
    if (jobId) {
      return this.db.select().from(jobApplicationsTable).where(eq(jobApplicationsTable.jobId, jobId)).orderBy(desc(jobApplicationsTable.appliedAt));
    }
    return this.db.select().from(jobApplicationsTable).orderBy(desc(jobApplicationsTable.appliedAt));
  }

  async getJobApplication(id: string): Promise<JobApplication | undefined> {
    const rows = await this.db.select().from(jobApplicationsTable).where(eq(jobApplicationsTable.id, id));
    return rows[0];
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const rows = await this.db.insert(jobApplicationsTable).values(application).returning();
    return rows[0];
  }

  async updateJobApplicationStatus(id: string, status: string, notes?: string): Promise<JobApplication | undefined> {
    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;
    const rows = await this.db.update(jobApplicationsTable).set(updateData).where(eq(jobApplicationsTable.id, id)).returning();
    return rows[0];
  }

  // ── Social Posts ──────────────────────────────────────────────────────────────

  async getSocialPosts(): Promise<SocialPost[]> {
    return this.db.select().from(socialPostsTable).orderBy(desc(socialPostsTable.createdAt));
  }

  async getSocialPost(id: string): Promise<SocialPost | undefined> {
    const rows = await this.db.select().from(socialPostsTable).where(eq(socialPostsTable.id, id));
    return rows[0];
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const rows = await this.db.insert(socialPostsTable).values(post as any).returning();
    return rows[0];
  }

  async updateSocialPost(id: string, post: Partial<InsertSocialPost>): Promise<SocialPost | undefined> {
    const rows = await this.db.update(socialPostsTable).set(post as any).where(eq(socialPostsTable.id, id)).returning();
    return rows[0];
  }

  async deleteSocialPost(id: string): Promise<void> {
    await this.db.delete(socialPostsTable).where(eq(socialPostsTable.id, id));
  }

  // ── GBP Reviews ───────────────────────────────────────────────────────────────

  async getGbpReviews(): Promise<GbpReview[]> {
    return this.db.select().from(gbpReviewsTable).orderBy(desc(gbpReviewsTable.reviewDate));
  }

  async getGbpReview(id: string): Promise<GbpReview | undefined> {
    const rows = await this.db.select().from(gbpReviewsTable).where(eq(gbpReviewsTable.id, id));
    return rows[0];
  }

  async createGbpReview(review: InsertGbpReview): Promise<GbpReview> {
    const rows = await this.db.insert(gbpReviewsTable).values(review).returning();
    return rows[0];
  }

  async updateGbpReviewReply(id: string, replyText: string): Promise<GbpReview | undefined> {
    const rows = await this.db.update(gbpReviewsTable).set({ replied: true, replyText }).where(eq(gbpReviewsTable.id, id)).returning();
    return rows[0];
  }
}

// ── Export ────────────────────────────────────────────────────────────────────

async function initStorage(): Promise<IStorage> {
  if (db) {
    const store = new DatabaseStorage(db);
    await store.seed();
    return store;
  }
  return new MemStorage();
}

// Synchronous export for backwards compatibility — resolves on first use
let _storage: IStorage = new MemStorage();
initStorage().then(s => { _storage = s; }).catch(err => console.error("[storage] init error:", err));

export const storage: IStorage = new Proxy({} as IStorage, {
  get(_target, prop) {
    return (_storage as any)[prop].bind(_storage);
  },
});

