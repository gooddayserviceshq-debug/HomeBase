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
  type Contract,
  type InsertContract,
  type UpdateContract,
  type CommercialServiceQuote,
  type InsertCommercialServiceQuote,
  type Lead,
  type InsertLead,
  type UpdateLead,
} from "@shared/schema";
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

  // Contract operations
  getContracts(): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: UpdateContract): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<void>;

  // Lead CRM operations
  getLeads(status?: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: UpdateLead): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<void>;

  // Commercial service quote operations
  getCommercialServiceQuotes(): Promise<CommercialServiceQuote[]>;
  getCommercialServiceQuote(id: string): Promise<CommercialServiceQuote | undefined>;
  createCommercialServiceQuote(quote: InsertCommercialServiceQuote): Promise<CommercialServiceQuote>;
  updateCommercialServiceQuoteStatus(id: string, status: string): Promise<CommercialServiceQuote | undefined>;
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
  private contracts: Map<string, Contract>;
  private commercialServiceQuotes: Map<string, CommercialServiceQuote>;
  private leads: Map<string, Lead>;

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
    this.contracts = new Map();
    this.commercialServiceQuotes = new Map();
    this.leads = new Map();
    this.seedLeads();

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

  // Contract operations
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const id = randomUUID();
    const now = new Date();
    const count = this.contracts.size + 1;
    const contractNumber = `GDS-C-${String(count).padStart(4, "0")}`;

    const newContract: Contract = {
      ...contract,
      id,
      contractNumber,
      clientCompany: contract.clientCompany ?? null,
      endDate: contract.endDate ? new Date(contract.endDate) : null,
      notes: contract.notes ?? null,
      signedAt: contract.signedAt ? new Date(contract.signedAt) : null,
      serviceTypes: (contract.serviceTypes ?? []) as string[],
      rate: String(contract.rate),
      lateFeePercent: contract.lateFeePercent ?? 5,
      cancellationNoticeDays: contract.cancellationNoticeDays ?? 2,
      status: contract.status ?? "draft",
      contractType: contract.contractType ?? "one_time",
      frequency: contract.frequency ?? "one_time",
      rateUnit: contract.rateUnit ?? "per_visit",
      paymentDue: contract.paymentDue ?? "upon_completion",
      startDate: new Date(contract.startDate),
      createdAt: now,
      updatedAt: now,
    };

    this.contracts.set(id, newContract);
    return newContract;
  }

  async updateContract(id: string, updates: UpdateContract): Promise<Contract | undefined> {
    const existing = this.contracts.get(id);
    if (!existing) return undefined;
    const updated: Contract = {
      ...existing,
      ...updates,
      startDate: updates.startDate ? new Date(updates.startDate) : existing.startDate,
      endDate: updates.endDate ? new Date(updates.endDate) : existing.endDate,
      signedAt: updates.signedAt ? new Date(updates.signedAt) : existing.signedAt,
      rate: updates.rate !== undefined ? String(updates.rate) : existing.rate,
      serviceTypes: (updates.serviceTypes ?? existing.serviceTypes) as string[],
      updatedAt: new Date(),
    };
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: string): Promise<void> {
    this.contracts.delete(id);
  }

  // Commercial service quote operations
  async getCommercialServiceQuotes(): Promise<CommercialServiceQuote[]> {
    return Array.from(this.commercialServiceQuotes.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getCommercialServiceQuote(id: string): Promise<CommercialServiceQuote | undefined> {
    return this.commercialServiceQuotes.get(id);
  }

  async createCommercialServiceQuote(quote: InsertCommercialServiceQuote): Promise<CommercialServiceQuote> {
    const id = randomUUID();
    const now = new Date();
    const count = this.commercialServiceQuotes.size + 1;
    const quoteNumber = `GDS-CSQ-${String(count).padStart(4, "0")}`;

    const newQuote: CommercialServiceQuote = {
      ...quote,
      id,
      quoteNumber,
      companyName: quote.companyName ?? null,
      notes: quote.notes ?? null,
      estimatedTotal: String(quote.estimatedTotal),
      serviceDetails: (quote.serviceDetails ?? {}) as Record<string, unknown>,
      lineItems: (quote.lineItems ?? []) as { label: string; qty: number; unitPrice: number; total: number }[],
      status: quote.status ?? "new",
      createdAt: now,
      updatedAt: now,
    };

    this.commercialServiceQuotes.set(id, newQuote);
    return newQuote;
  }

  // Lead CRM
  private seedLeads() {
    const seed: Lead[] = [
      {
        id: "lead-001", leadId: "GDS-L-0001",
        date: new Date("2025-09-30"), source: "facebook",
        name: "Facebook Lead 1", phone: "615-555-0101", email: null, address: "Murfreesboro, TN", zip: "37130",
        serviceInterest: "house_wash", estimatedValue: "400", status: "lost",
        assignedTo: "Blake", quotedAmount: null, followUpDate: null, notes: "Did not respond after follow-up",
        referredBy: null, adSpend: "30", wonAt: null, lostReason: "No response",
        createdAt: new Date("2025-09-30"), updatedAt: new Date("2025-09-30"),
      },
      {
        id: "lead-002", leadId: "GDS-L-0002",
        date: new Date("2025-09-30"), source: "facebook",
        name: "Facebook Lead 2", phone: "615-555-0102", email: null, address: "Smyrna, TN", zip: "37167",
        serviceInterest: "driveway", estimatedValue: "300", status: "won",
        assignedTo: "Blake", quotedAmount: "300", followUpDate: null, notes: "Smith Family — quick close",
        referredBy: null, adSpend: "30", wonAt: new Date("2025-10-01"), lostReason: null,
        createdAt: new Date("2025-09-30"), updatedAt: new Date("2025-10-01"),
      },
      {
        id: "lead-003", leadId: "GDS-L-0003",
        date: new Date("2025-10-01"), source: "tiktok",
        name: "TikTok Lead 1", phone: "615-555-0103", email: null, address: "Lavergne, TN", zip: "37086",
        serviceInterest: "roof", estimatedValue: "450", status: "won",
        assignedTo: "Blake", quotedAmount: "450", followUpDate: null, notes: "Jones Residence — roof wash",
        referredBy: null, adSpend: "87.50", wonAt: new Date("2025-10-02"), lostReason: null,
        createdAt: new Date("2025-10-01"), updatedAt: new Date("2025-10-02"),
      },
      {
        id: "lead-004", leadId: "GDS-L-0004",
        date: new Date("2025-10-01"), source: "tiktok",
        name: "TikTok Lead 2", phone: "615-555-0104", email: null, address: "Murfreesboro, TN", zip: "37129",
        serviceInterest: "house_wash", estimatedValue: "400", status: "won",
        assignedTo: "Blake", quotedAmount: "400", followUpDate: null, notes: "Taylor Home — house wash",
        referredBy: null, adSpend: "87.50", wonAt: new Date("2025-10-03"), lostReason: null,
        createdAt: new Date("2025-10-01"), updatedAt: new Date("2025-10-03"),
      },
      {
        id: "lead-005", leadId: "GDS-L-0005",
        date: new Date("2025-10-02"), source: "google_maps",
        name: "Google Maps Lead 1", phone: "615-555-0105", email: null, address: "Murfreesboro, TN", zip: "37130",
        serviceInterest: "driveway", estimatedValue: "300", status: "won",
        assignedTo: "Blake", quotedAmount: "300", followUpDate: null, notes: "Organic GBP inquiry",
        referredBy: null, adSpend: "0", wonAt: new Date("2025-10-02"), lostReason: null,
        createdAt: new Date("2025-10-02"), updatedAt: new Date("2025-10-02"),
      },
      {
        id: "lead-006", leadId: "GDS-L-0006",
        date: new Date("2025-10-02"), source: "google_maps",
        name: "Google Maps Lead 2", phone: "615-555-0106", email: null, address: "Smyrna, TN", zip: "37167",
        serviceInterest: "bundle", estimatedValue: "700", status: "won",
        assignedTo: "Blake", quotedAmount: "700", followUpDate: null, notes: "Driveway + soft wash bundle",
        referredBy: null, adSpend: "0", wonAt: new Date("2025-10-02"), lostReason: null,
        createdAt: new Date("2025-10-02"), updatedAt: new Date("2025-10-02"),
      },
      {
        id: "lead-007", leadId: "GDS-L-0007",
        date: new Date("2025-10-02"), source: "google_maps",
        name: "Google Maps Lead 3", phone: "615-555-0107", email: null, address: "Murfreesboro, TN", zip: "37128",
        serviceInterest: "gutters", estimatedValue: "300", status: "won",
        assignedTo: "Blake", quotedAmount: "300", followUpDate: null, notes: "Gutters + driveway",
        referredBy: null, adSpend: "0", wonAt: new Date("2025-10-02"), lostReason: null,
        createdAt: new Date("2025-10-02"), updatedAt: new Date("2025-10-02"),
      },
      {
        id: "lead-008", leadId: "GDS-L-0008",
        date: new Date("2025-10-02"), source: "google_maps",
        name: "Google Maps Lead 4", phone: "615-555-0108", email: null, address: "Lavergne, TN", zip: "37086",
        serviceInterest: "house_wash", estimatedValue: "400", status: "won",
        assignedTo: "Blake", quotedAmount: "400", followUpDate: null, notes: "Called same day, booked",
        referredBy: null, adSpend: "0", wonAt: new Date("2025-10-03"), lostReason: null,
        createdAt: new Date("2025-10-02"), updatedAt: new Date("2025-10-03"),
      },
      {
        id: "lead-009", leadId: "GDS-L-0009",
        date: new Date("2025-10-02"), source: "google_maps",
        name: "Google Maps Lead 5", phone: "615-555-0109", email: null, address: "Smyrna, TN", zip: "37167",
        serviceInterest: "roof", estimatedValue: "450", status: "quoted",
        assignedTo: "Blake", quotedAmount: "450", followUpDate: new Date("2026-05-30"), notes: "Quoted, awaiting decision",
        referredBy: null, adSpend: "0", wonAt: null, lostReason: null,
        createdAt: new Date("2025-10-02"), updatedAt: new Date("2025-10-02"),
      },
      {
        id: "lead-010", leadId: "GDS-L-0010",
        date: new Date("2025-10-05"), source: "referral",
        name: "Referral from Smith Family", phone: "615-555-0110", email: "neighbor@example.com", address: "Murfreesboro, TN", zip: "37130",
        serviceInterest: "paver_restoration", estimatedValue: "1200", status: "quoted",
        assignedTo: "Blake", quotedAmount: "1200", followUpDate: new Date("2026-05-28"), notes: "Referred by Smith Family job. Large paver driveway.",
        referredBy: "Smith Family (lead-002)", adSpend: "0", wonAt: null, lostReason: null,
        createdAt: new Date("2025-10-05"), updatedAt: new Date("2025-10-05"),
      },
      {
        id: "lead-011", leadId: "GDS-L-0011",
        date: new Date("2026-05-20"), source: "commercial_quote",
        name: "Ed (Superintendent)", phone: "615-555-0200", email: "ed@topreamerica.com", address: "7735 Florence Road, Smyrna, TN 37167", zip: "37167",
        serviceInterest: "construction_cleanup", estimatedValue: "9200", status: "won",
        assignedTo: "Blake", quotedAmount: "9200", followUpDate: null, notes: "Topre America Corp — 50,000 sq ft I-beams, trusses, purlins. 2-man crew + lift.",
        referredBy: null, adSpend: "0", wonAt: new Date("2026-05-20"), lostReason: null,
        createdAt: new Date("2026-05-20"), updatedAt: new Date("2026-05-20"),
      },
      {
        id: "lead-012", leadId: "GDS-L-0012",
        date: new Date("2026-05-24"), source: "direct",
        name: "New Prospect", phone: "615-555-0201", email: null, address: "Murfreesboro, TN", zip: "37130",
        serviceInterest: "fleet", estimatedValue: "950", status: "new",
        assignedTo: null, quotedAmount: null, followUpDate: new Date("2026-05-27"), notes: "10 box trucks, monthly contract inquiry",
        referredBy: null, adSpend: "0", wonAt: null, lostReason: null,
        createdAt: new Date("2026-05-24"), updatedAt: new Date("2026-05-24"),
      },
    ];
    seed.forEach((l) => this.leads.set(l.id, l));
  }

  async getLeads(status?: string): Promise<Lead[]> {
    const all = Array.from(this.leads.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return status ? all.filter((l) => l.status === status) : all;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const count = this.leads.size + 1;
    const now = new Date();
    const newLead: Lead = {
      ...lead,
      id,
      leadId: `GDS-L-${String(count).padStart(4, "0")}`,
      date: lead.date ? new Date(lead.date) : now,
      email: lead.email ?? null,
      address: lead.address ?? null,
      zip: lead.zip ?? null,
      estimatedValue: lead.estimatedValue ? String(lead.estimatedValue) : null,
      assignedTo: lead.assignedTo ?? null,
      quotedAmount: lead.quotedAmount ? String(lead.quotedAmount) : null,
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate) : null,
      notes: lead.notes ?? null,
      referredBy: lead.referredBy ?? null,
      adSpend: lead.adSpend ? String(lead.adSpend) : null,
      wonAt: lead.wonAt ? new Date(lead.wonAt) : null,
      lostReason: lead.lostReason ?? null,
      status: lead.status ?? "new",
      createdAt: now,
      updatedAt: now,
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateLead(id: string, updates: UpdateLead): Promise<Lead | undefined> {
    const existing = this.leads.get(id);
    if (!existing) return undefined;
    const updated: Lead = {
      ...existing,
      ...updates,
      date: updates.date ? new Date(updates.date) : existing.date,
      followUpDate: updates.followUpDate ? new Date(updates.followUpDate) : existing.followUpDate,
      wonAt: updates.wonAt ? new Date(updates.wonAt) : existing.wonAt,
      estimatedValue: updates.estimatedValue !== undefined ? (updates.estimatedValue ? String(updates.estimatedValue) : null) : existing.estimatedValue,
      quotedAmount: updates.quotedAmount !== undefined ? (updates.quotedAmount ? String(updates.quotedAmount) : null) : existing.quotedAmount,
      adSpend: updates.adSpend !== undefined ? (updates.adSpend ? String(updates.adSpend) : null) : existing.adSpend,
      updatedAt: new Date(),
    };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<void> {
    this.leads.delete(id);
  }

  async updateCommercialServiceQuoteStatus(id: string, status: string): Promise<CommercialServiceQuote | undefined> {
    const existing = this.commercialServiceQuotes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status, updatedAt: new Date() };
    this.commercialServiceQuotes.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
