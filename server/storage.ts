import { 
  type QuoteRequest, 
  type InsertQuoteRequest,
  type User,
  type UpsertUser,
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
}

export class MemStorage implements IStorage {
  private quoteRequests: Map<string, QuoteRequest>;
  private users: Map<string, User>;

  constructor() {
    this.quoteRequests = new Map();
    this.users = new Map();
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
      createdAt: new Date()
    };
    this.quoteRequests.set(id, quoteRequest);
    return quoteRequest;
  }
}

export const storage = new MemStorage();
