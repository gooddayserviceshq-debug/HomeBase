import { 
  type Service, 
  type InsertService,
  type Customer,
  type InsertCustomer,
  type Booking,
  type InsertBooking
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByCustomerEmail(email: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
}

export class MemStorage implements IStorage {
  private services: Map<string, Service>;
  private customers: Map<string, Customer>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.services = new Map();
    this.customers = new Map();
    this.bookings = new Map();
    
    this.seedServices();
  }

  private seedServices() {
    const defaultServices: InsertService[] = [
      {
        name: "House Siding",
        description: "Restore your home's exterior to pristine condition with our gentle yet effective cleaning.",
        basePrice: "199",
        pricePerSqFt: "0.15",
        icon: "home"
      },
      {
        name: "Driveway",
        description: "Remove oil stains, dirt, and grime for a fresh, clean driveway appearance.",
        basePrice: "149",
        pricePerSqFt: "0.12",
        icon: "building"
      },
      {
        name: "Deck & Patio",
        description: "Revitalize your outdoor living spaces with professional deck and patio cleaning.",
        basePrice: "179",
        pricePerSqFt: "0.18",
        icon: "fence"
      },
      {
        name: "Roof Cleaning",
        description: "Safe, effective roof cleaning that extends the life of your shingles.",
        basePrice: "299",
        pricePerSqFt: "0.20",
        icon: "droplet"
      }
    ];

    defaultServices.forEach(service => {
      const id = randomUUID();
      this.services.set(id, { ...service, id });
    });
  }

  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const existingCustomer = await this.getCustomerByEmail(insertCustomer.email);
    if (existingCustomer) {
      return existingCustomer;
    }

    const id = randomUUID();
    const customer: Customer = { 
      ...insertCustomer, 
      id,
      createdAt: new Date()
    };
    this.customers.set(id, customer);
    return customer;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByCustomerEmail(email: string): Promise<Booking[]> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer) return [];

    return Array.from(this.bookings.values())
      .filter(booking => booking.customerId === customer.id)
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id,
      createdAt: new Date()
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
}

export const storage = new MemStorage();
