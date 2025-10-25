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

export const storage = new MemStorage();
