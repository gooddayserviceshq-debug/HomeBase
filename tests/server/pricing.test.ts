import { describe, it, expect } from "vitest";
import {
  BASE_RATES,
  CONDITION_MULTIPLIERS,
  SEALER_RATES,
  POLYMERIC_SAND_COST_PER_SQ_FT,
  calculateQuoteTiers,
  calculatePropertyCleaningTotal,
} from "../../server/pricing";

describe("calculateQuoteTiers", () => {
  describe("basic tier price", () => {
    it("poured_concrete + lightly_dirty: cleaning + acrylic sealer", () => {
      const tiers = calculateQuoteTiers(100, "poured_concrete", "lightly_dirty", false);
      // cleaning: 100 * 0.25 * 1.0 = 25; sealer: 100 * 0.75 = 75; total = 100
      expect(tiers.basic.price).toBe(100);
    });

    it("interlocking_pavers + lightly_dirty", () => {
      const tiers = calculateQuoteTiers(200, "interlocking_pavers", "lightly_dirty", false);
      // cleaning: 200 * 0.35 * 1.0 = 70; sealer: 200 * 0.75 = 150; total = 220
      expect(tiers.basic.price).toBe(220);
    });

    it("brick_pavers + heavily_soiled", () => {
      const tiers = calculateQuoteTiers(100, "brick_pavers", "heavily_soiled", false);
      // cleaning: 100 * 0.40 * 1.25 = 50; sealer: 100 * 0.75 = 75; total = 125
      expect(tiers.basic.price).toBe(125);
    });

    it("stamped_concrete + stained_damaged", () => {
      const tiers = calculateQuoteTiers(100, "stamped_concrete", "stained_damaged", false);
      // cleaning: 100 * 0.30 * 1.5 = 45; sealer: 100 * 0.75 = 75; total = 120
      expect(tiers.basic.price).toBe(120);
    });
  });

  describe("recommended tier price", () => {
    it("adds polymeric sand cost when includePolymericSand is true", () => {
      const with_sand = calculateQuoteTiers(100, "poured_concrete", "lightly_dirty", true);
      const without_sand = calculateQuoteTiers(100, "poured_concrete", "lightly_dirty", false);
      // sand: 100 * 0.50 = 50
      expect(with_sand.recommended.price - without_sand.recommended.price).toBe(50);
    });

    it("recommended equals basic when no polymeric sand", () => {
      const tiers = calculateQuoteTiers(100, "poured_concrete", "lightly_dirty", false);
      expect(tiers.recommended.price).toBe(tiers.basic.price);
    });

    it("recommended with sand: cleaning + sand + acrylic sealer", () => {
      const tiers = calculateQuoteTiers(200, "poured_concrete", "lightly_dirty", true);
      // cleaning: 200 * 0.25 * 1.0 = 50; sand: 200 * 0.50 = 100; sealer: 200 * 0.75 = 150; total = 300
      expect(tiers.recommended.price).toBe(300);
    });
  });

  describe("premium tier price", () => {
    it("premium uses penetrating sealer instead of acrylic", () => {
      const tiers = calculateQuoteTiers(100, "poured_concrete", "lightly_dirty", false);
      // cleaning: 25; penetrating: 100 * 1.25 = 125; total = 150
      expect(tiers.premium.price).toBe(150);
    });

    it("premium with sand: cleaning + sand + penetrating sealer", () => {
      const tiers = calculateQuoteTiers(200, "interlocking_pavers", "heavily_soiled", true);
      // cleaning: 200 * 0.35 * 1.25 = 87.5; sand: 200 * 0.50 = 100; penetrating: 200 * 1.25 = 250; total = 437.5
      expect(tiers.premium.price).toBe(437.5);
    });

    it("premium > recommended always", () => {
      const surfaces = ["interlocking_pavers", "poured_concrete", "stamped_concrete", "brick_pavers"] as const;
      const conditions = ["lightly_dirty", "heavily_soiled", "stained_damaged"] as const;
      for (const surface of surfaces) {
        for (const condition of conditions) {
          const tiers = calculateQuoteTiers(100, surface, condition, true);
          expect(tiers.premium.price).toBeGreaterThan(tiers.recommended.price);
        }
      }
    });
  });

  describe("price ordering", () => {
    it("basic ≤ recommended ≤ premium", () => {
      const tiers = calculateQuoteTiers(500, "brick_pavers", "stained_damaged", true);
      expect(tiers.basic.price).toBeLessThanOrEqual(tiers.recommended.price);
      expect(tiers.recommended.price).toBeLessThanOrEqual(tiers.premium.price);
    });
  });

  describe("rounding", () => {
    it("prices are rounded to 2 decimal places", () => {
      // Use values that would produce floating-point imprecision without rounding
      const tiers = calculateQuoteTiers(333, "interlocking_pavers", "heavily_soiled", true);
      const prices = [tiers.basic.price, tiers.recommended.price, tiers.premium.price];
      for (const price of prices) {
        expect(price).toBe(Math.round(price * 100) / 100);
      }
    });

    it("no more than 2 decimal places", () => {
      const tiers = calculateQuoteTiers(333, "stamped_concrete", "stained_damaged", false);
      const prices = [tiers.basic.price, tiers.recommended.price, tiers.premium.price];
      for (const price of prices) {
        const decimals = (price.toString().split(".")[1] ?? "").length;
        expect(decimals).toBeLessThanOrEqual(2);
      }
    });
  });

  describe("constants sanity", () => {
    it("all surface types have base rates", () => {
      const surfaces = ["interlocking_pavers", "poured_concrete", "stamped_concrete", "brick_pavers"] as const;
      for (const s of surfaces) {
        expect(BASE_RATES[s]).toBeGreaterThan(0);
      }
    });

    it("condition multipliers are >= 1", () => {
      for (const m of Object.values(CONDITION_MULTIPLIERS)) {
        expect(m).toBeGreaterThanOrEqual(1);
      }
    });

    it("penetrating sealer costs more than acrylic", () => {
      expect(SEALER_RATES.penetrating).toBeGreaterThan(SEALER_RATES.acrylic);
    });

    it("polymeric sand cost per sq ft is positive", () => {
      expect(POLYMERIC_SAND_COST_PER_SQ_FT).toBeGreaterThan(0);
    });
  });
});

describe("calculatePropertyCleaningTotal", () => {
  const prices = {
    driveway: 300,
    roof: 300,
    siding: 300,
    gutters: 300,
    minimumService: 975,
  };

  it("single service below minimum applies minimum charge", () => {
    const result = calculatePropertyCleaningTotal(
      { driveway: true, roof: false, siding: false, gutters: false, fenceSides: 0, fencePricePerSide: 75 },
      prices
    );
    expect(result.itemizedTotal).toBe(300);
    expect(result.minimumApplied).toBe(true);
    expect(result.finalTotal).toBe(975);
  });

  it("four services exceed minimum, no minimum applied", () => {
    const result = calculatePropertyCleaningTotal(
      { driveway: true, roof: true, siding: true, gutters: true, fenceSides: 0, fencePricePerSide: 75 },
      prices
    );
    expect(result.itemizedTotal).toBe(1200);
    expect(result.minimumApplied).toBe(false);
    expect(result.finalTotal).toBe(1200);
  });

  it("exactly at minimum is not considered minimum-applied", () => {
    const result = calculatePropertyCleaningTotal(
      { driveway: true, roof: true, siding: true, gutters: false, fenceSides: 1, fencePricePerSide: 75 },
      prices
    );
    // 300 + 300 + 300 + 75 = 975
    expect(result.itemizedTotal).toBe(975);
    expect(result.minimumApplied).toBe(false);
    expect(result.finalTotal).toBe(975);
  });

  it("fence pricing: sides × price per side", () => {
    const result = calculatePropertyCleaningTotal(
      { driveway: false, roof: false, siding: false, gutters: false, fenceSides: 4, fencePricePerSide: 150 },
      prices
    );
    expect(result.itemizedTotal).toBe(600);
    expect(result.minimumApplied).toBe(true);
    expect(result.finalTotal).toBe(975);
  });

  it("no services selected: minimum applies", () => {
    const result = calculatePropertyCleaningTotal(
      { driveway: false, roof: false, siding: false, gutters: false, fenceSides: 0, fencePricePerSide: 75 },
      prices
    );
    expect(result.itemizedTotal).toBe(0);
    expect(result.minimumApplied).toBe(true);
    expect(result.finalTotal).toBe(975);
  });

  it("combined services with large fence exceed minimum", () => {
    const result = calculatePropertyCleaningTotal(
      { driveway: true, roof: true, siding: false, gutters: false, fenceSides: 4, fencePricePerSide: 150 },
      prices
    );
    // 300 + 300 + 600 = 1200
    expect(result.itemizedTotal).toBe(1200);
    expect(result.minimumApplied).toBe(false);
    expect(result.finalTotal).toBe(1200);
  });
});
