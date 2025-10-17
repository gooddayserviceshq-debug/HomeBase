import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  quoteSchema, 
  insertBookingSchema, 
  insertCustomerSchema,
  type QuoteResponse,
  type Service,
  type Booking,
  type Customer
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/services", async (_req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const { serviceId, squareFootage } = quoteSchema.parse(req.body);
      
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      const basePrice = parseFloat(service.basePrice);
      const pricePerSqFt = parseFloat(service.pricePerSqFt);
      const areaPrice = squareFootage * pricePerSqFt;
      const totalPrice = basePrice + areaPrice;

      const quote: QuoteResponse = {
        basePrice,
        areaPrice,
        totalPrice,
        service,
      };

      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to calculate quote" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const { customer: customerData, booking: bookingData } = req.body;

      const validatedCustomer = insertCustomerSchema.parse(customerData);
      const validatedBooking = insertBookingSchema.omit({ customerId: true }).parse(bookingData);

      const customer = await storage.createCustomer(validatedCustomer);

      const booking = await storage.createBooking({
        ...validatedBooking,
        customerId: customer.id,
      });

      res.json({ bookingId: booking.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid booking data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", async (_req, res) => {
    try {
      const bookings = await storage.getBookings();
      
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const customer = await storage.getCustomer(booking.customerId);
          const service = await storage.getService(booking.serviceId);
          
          return {
            ...booking,
            customer,
            service,
          };
        })
      );

      res.json(bookingsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/customer/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const bookings = await storage.getBookingsByCustomerEmail(email);
      
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const customer = await storage.getCustomer(booking.customerId);
          const service = await storage.getService(booking.serviceId);
          
          return {
            ...booking,
            customer,
            service,
          };
        })
      );

      res.json(bookingsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer bookings" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || typeof status !== "string") {
        return res.status(400).json({ error: "Status is required" });
      }

      const validStatuses = ["scheduled", "in-progress", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const updatedBooking = await storage.updateBookingStatus(id, status);
      
      if (!updatedBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking status" });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const bookings = await storage.getBookings();
      
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => 
        b.status === "scheduled" || b.status === "in-progress"
      ).length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const completedThisWeek = bookings.filter(b => 
        b.status === "completed" && new Date(b.createdAt) >= oneWeekAgo
      ).length;

      const totalRevenue = bookings
        .filter(b => b.status === "completed")
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

      res.json({
        totalBookings,
        pendingBookings,
        completedThisWeek,
        totalRevenue,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
