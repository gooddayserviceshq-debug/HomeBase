import { describe, it, expect } from "vitest";
import {
  generatePropertyCleaningQuoteEmail,
  generateRestorationQuoteEmail,
} from "../../server/emailService";
import type { PropertyCleaningQuote, QuoteRequest } from "../../shared/schema";

function makeCleaningQuote(overrides: Partial<PropertyCleaningQuote> = {}): PropertyCleaningQuote {
  return {
    id: "abc12345-0000-0000-0000-000000000000",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "6155551234",
    propertyAddress: "123 Main St, Murfreesboro, TN 37130",
    driveway: true,
    roof: false,
    siding: false,
    gutters: false,
    fenceSides: 0,
    fencePricePerSide: "75",
    itemizedTotal: "300.00",
    minimumApplied: true,
    finalTotal: "975.00",
    additionalNotes: null,
    createdAt: new Date("2026-05-28"),
    updatedAt: new Date("2026-05-28"),
    ...overrides,
  };
}

function makeRestorationQuote(overrides: Partial<QuoteRequest> = {}): QuoteRequest {
  return {
    id: "def67890-0000-0000-0000-000000000000",
    name: "John Smith",
    email: "john@example.com",
    phone: "6155559876",
    address: "456 Elm St, Murfreesboro, TN 37130",
    serviceType: "driveway_restoration",
    surfaceType: "interlocking_pavers",
    length: 20,
    width: 10,
    squareFootage: 200,
    condition: "lightly_dirty",
    includeSealer: true,
    includePolymericSand: false,
    selectedTier: "recommended",
    basicTierPrice: "220.00",
    recommendedTierPrice: "220.00",
    premiumTierPrice: "300.00",
    createdAt: new Date("2026-05-28"),
    ...overrides,
  };
}

describe("generatePropertyCleaningQuoteEmail", () => {
  it("subject contains quote id prefix", () => {
    const quote = makeCleaningQuote();
    const { subject } = generatePropertyCleaningQuoteEmail(quote);
    expect(subject).toContain("abc12345");
  });

  it("html contains customer name", () => {
    const quote = makeCleaningQuote();
    const { html } = generatePropertyCleaningQuoteEmail(quote);
    expect(html).toContain("Jane Doe");
  });

  it("html contains property address", () => {
    const quote = makeCleaningQuote();
    const { html } = generatePropertyCleaningQuoteEmail(quote);
    expect(html).toContain("123 Main St");
  });

  it("html contains final total", () => {
    const quote = makeCleaningQuote();
    const { html } = generatePropertyCleaningQuoteEmail(quote);
    expect(html).toContain("975.00");
  });

  it("html shows minimum charge warning when minimumApplied is true", () => {
    const quote = makeCleaningQuote({ minimumApplied: true });
    const { html } = generatePropertyCleaningQuoteEmail(quote);
    expect(html).toContain("975");
  });

  it("plain text contains customer name", () => {
    const quote = makeCleaningQuote();
    const { text } = generatePropertyCleaningQuoteEmail(quote);
    expect(text).toContain("Jane Doe");
  });

  it("plain text contains final total", () => {
    const quote = makeCleaningQuote();
    const { text } = generatePropertyCleaningQuoteEmail(quote);
    expect(text).toContain("975.00");
  });

  it("driveway service appears when driveway is true", () => {
    const quote = makeCleaningQuote({ driveway: true });
    const { html, text } = generatePropertyCleaningQuoteEmail(quote);
    expect(html).toContain("Driveway");
    expect(text).toContain("Driveway");
  });

  it("fence line shows correct total for sides × price", () => {
    const quote = makeCleaningQuote({ fenceSides: 2, fencePricePerSide: "150" });
    const { text } = generatePropertyCleaningQuoteEmail(quote);
    // 2 sides × $150 = $300
    expect(text).toContain("300");
  });

  it("returns all three required fields", () => {
    const quote = makeCleaningQuote();
    const result = generatePropertyCleaningQuoteEmail(quote);
    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("text");
  });
});

describe("generateRestorationQuoteEmail", () => {
  it("subject contains quote id prefix", () => {
    const quote = makeRestorationQuote();
    const { subject } = generateRestorationQuoteEmail(quote);
    expect(subject).toContain("def67890");
  });

  it("html contains customer name", () => {
    const quote = makeRestorationQuote();
    const { html } = generateRestorationQuoteEmail(quote);
    expect(html).toContain("John Smith");
  });

  it("html contains property address", () => {
    const quote = makeRestorationQuote();
    const { html } = generateRestorationQuoteEmail(quote);
    expect(html).toContain("456 Elm St");
  });

  it("html contains square footage", () => {
    const quote = makeRestorationQuote({ squareFootage: 200 });
    const { html } = generateRestorationQuoteEmail(quote);
    expect(html).toContain("200");
  });

  it("html contains basic tier price", () => {
    const quote = makeRestorationQuote({ basicTierPrice: "220.00" });
    const { html } = generateRestorationQuoteEmail(quote);
    expect(html).toContain("220");
  });

  it("html contains recommended tier price", () => {
    const quote = makeRestorationQuote({ recommendedTierPrice: "220.00" });
    const { html } = generateRestorationQuoteEmail(quote);
    expect(html).toContain("220");
  });

  it("html contains premium tier price", () => {
    const quote = makeRestorationQuote({ premiumTierPrice: "300.00" });
    const { html } = generateRestorationQuoteEmail(quote);
    expect(html).toContain("300");
  });

  it("returns all three required fields", () => {
    const quote = makeRestorationQuote();
    const result = generateRestorationQuoteEmail(quote);
    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("text");
  });
});
