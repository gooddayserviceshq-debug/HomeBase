import { 
  type QuoteRequest, 
  type InsertQuoteRequest
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
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

  constructor() {
    this.quoteRequests = new Map();
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
