import { describe, it, expect } from "vitest";
import {
  quoteCalculationSchema,
  propertyCleaningCalculationSchema,
  insertCustomerInquirySchema,
  cleaningServicePrices,
} from "../../shared/schema";

describe("quoteCalculationSchema", () => {
  const validPayload = {
    serviceType: "driveway_restoration",
    surfaceType: "interlocking_pavers",
    length: 20,
    width: 10,
    condition: "lightly_dirty",
    includeSealer: true,
    includePolymericSand: false,
  } as const;

  it("accepts a valid payload", () => {
    expect(() => quoteCalculationSchema.parse(validPayload)).not.toThrow();
  });

  it("rejects invalid surfaceType", () => {
    expect(() =>
      quoteCalculationSchema.parse({ ...validPayload, surfaceType: "gravel" })
    ).toThrow();
  });

  it("rejects invalid condition", () => {
    expect(() =>
      quoteCalculationSchema.parse({ ...validPayload, condition: "perfect" })
    ).toThrow();
  });

  it("rejects length of 0", () => {
    expect(() =>
      quoteCalculationSchema.parse({ ...validPayload, length: 0 })
    ).toThrow();
  });

  it("rejects length above 500", () => {
    expect(() =>
      quoteCalculationSchema.parse({ ...validPayload, length: 501 })
    ).toThrow();
  });

  it("rejects width of 0", () => {
    expect(() =>
      quoteCalculationSchema.parse({ ...validPayload, width: 0 })
    ).toThrow();
  });

  it("accepts all valid surface types", () => {
    const surfaces = ["interlocking_pavers", "poured_concrete", "stamped_concrete", "brick_pavers"] as const;
    for (const surfaceType of surfaces) {
      expect(() => quoteCalculationSchema.parse({ ...validPayload, surfaceType })).not.toThrow();
    }
  });

  it("accepts all valid conditions", () => {
    const conditions = ["lightly_dirty", "heavily_soiled", "stained_damaged"] as const;
    for (const condition of conditions) {
      expect(() => quoteCalculationSchema.parse({ ...validPayload, condition })).not.toThrow();
    }
  });

  it("accepts all valid service types", () => {
    const serviceTypes = [
      "driveway_restoration",
      "patio_restoration",
      "walkway_restoration",
      "pool_deck_restoration",
    ] as const;
    for (const serviceType of serviceTypes) {
      expect(() => quoteCalculationSchema.parse({ ...validPayload, serviceType })).not.toThrow();
    }
  });
});

describe("propertyCleaningCalculationSchema", () => {
  const validPayload = {
    driveway: true,
    roof: false,
    siding: false,
    gutters: false,
    fenceSides: 0,
    fencePricePerSide: 75,
  };

  it("accepts a valid payload", () => {
    expect(() => propertyCleaningCalculationSchema.parse(validPayload)).not.toThrow();
  });

  it("defaults all booleans to false when omitted", () => {
    const result = propertyCleaningCalculationSchema.parse({});
    expect(result.driveway).toBe(false);
    expect(result.roof).toBe(false);
    expect(result.siding).toBe(false);
    expect(result.gutters).toBe(false);
  });

  it("defaults fenceSides to 0 when omitted", () => {
    const result = propertyCleaningCalculationSchema.parse({});
    expect(result.fenceSides).toBe(0);
  });

  it("rejects fenceSides below 0", () => {
    expect(() =>
      propertyCleaningCalculationSchema.parse({ ...validPayload, fenceSides: -1 })
    ).toThrow();
  });

  it("rejects fenceSides above 4", () => {
    expect(() =>
      propertyCleaningCalculationSchema.parse({ ...validPayload, fenceSides: 5 })
    ).toThrow();
  });

  it("rejects fencePricePerSide below 75", () => {
    expect(() =>
      propertyCleaningCalculationSchema.parse({ ...validPayload, fencePricePerSide: 50 })
    ).toThrow();
  });

  it("rejects fencePricePerSide above 150", () => {
    expect(() =>
      propertyCleaningCalculationSchema.parse({ ...validPayload, fencePricePerSide: 200 })
    ).toThrow();
  });

  it("accepts max fenceSides of 4", () => {
    expect(() =>
      propertyCleaningCalculationSchema.parse({ ...validPayload, fenceSides: 4 })
    ).not.toThrow();
  });

  it("accepts fencePricePerSide of 75 and 150", () => {
    for (const price of [75, 150]) {
      expect(() =>
        propertyCleaningCalculationSchema.parse({ ...validPayload, fencePricePerSide: price })
      ).not.toThrow();
    }
  });
});

describe("insertCustomerInquirySchema", () => {
  const validPayload = {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "6155551234",
    inquiryType: "quote",
    subject: "Driveway cleaning",
    message: "I need a quote for my driveway.",
  } as const;

  it("accepts a valid payload", () => {
    expect(() => insertCustomerInquirySchema.parse(validPayload)).not.toThrow();
  });

  it("does NOT reject invalid email — email is a plain text column with no format validation", () => {
    // Gap: email format is not enforced at the schema level; validation must happen in the route handler
    expect(() =>
      insertCustomerInquirySchema.parse({ ...validPayload, email: "not-an-email" })
    ).not.toThrow();
  });

  it("rejects invalid inquiryType", () => {
    expect(() =>
      insertCustomerInquirySchema.parse({ ...validPayload, inquiryType: "complaint" })
    ).toThrow();
  });

  it("accepts all valid inquiry types", () => {
    for (const inquiryType of ["quote", "support", "general", "other"] as const) {
      expect(() =>
        insertCustomerInquirySchema.parse({ ...validPayload, inquiryType })
      ).not.toThrow();
    }
  });
});

describe("cleaningServicePrices", () => {
  it("minimum service charge is greater than any single service", () => {
    const singles = [
      cleaningServicePrices.driveway,
      cleaningServicePrices.roof,
      cleaningServicePrices.siding,
      cleaningServicePrices.gutters,
    ];
    for (const price of singles) {
      expect(cleaningServicePrices.minimumService).toBeGreaterThan(price);
    }
  });

  it("fence large price is greater than fence small price", () => {
    expect(cleaningServicePrices.fenceLarge).toBeGreaterThan(cleaningServicePrices.fenceSmall);
  });

  it("all prices are positive", () => {
    for (const price of Object.values(cleaningServicePrices)) {
      expect(price).toBeGreaterThan(0);
    }
  });
});
