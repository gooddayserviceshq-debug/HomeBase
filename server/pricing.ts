import type { QuoteTiers } from "@shared/schema";

export const BASE_RATES = {
  interlocking_pavers: 0.35,
  poured_concrete: 0.25,
  stamped_concrete: 0.30,
  brick_pavers: 0.40,
} as const;

export const CONDITION_MULTIPLIERS = {
  lightly_dirty: 1.0,
  heavily_soiled: 1.25,
  stained_damaged: 1.5,
} as const;

export const SEALER_RATES = {
  acrylic: 0.75,
  penetrating: 1.25,
} as const;

export const POLYMERIC_SAND_COST_PER_SQ_FT = 0.50;

export function calculateQuoteTiers(
  squareFootage: number,
  surfaceType: keyof typeof BASE_RATES,
  condition: keyof typeof CONDITION_MULTIPLIERS,
  includePolymericSand: boolean
): QuoteTiers {
  const baseRate = BASE_RATES[surfaceType];
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition];

  const cleaningCost = squareFootage * baseRate * conditionMultiplier;

  const basicPrice = cleaningCost + squareFootage * SEALER_RATES.acrylic;

  const sandCost = includePolymericSand ? squareFootage * POLYMERIC_SAND_COST_PER_SQ_FT : 0;
  const recommendedPrice = cleaningCost + sandCost + squareFootage * SEALER_RATES.acrylic;

  const premiumPrice = cleaningCost + sandCost + squareFootage * SEALER_RATES.penetrating;

  return {
    basic: {
      name: "Basic Restoration",
      description: "Professional cleaning and protection for immediate aesthetic improvement",
      features: [
        "Professional pressure washing of all surfaces",
        "Spot treatment of oil and organic stains",
        "Application of high-quality Acrylic Sealer",
        "Color enhancement and stain resistance",
      ],
      price: Math.round(basicPrice * 100) / 100,
    },
    recommended: {
      name: "Recommended Restoration",
      description: "Complete restoration addressing stability and long-term health of your pavers",
      features: [
        "Everything in Basic package",
        "Full removal of old joint material",
        "Installation of new Polymeric Sand",
        "Locks pavers, prevents weeds, stabilizes surface",
        "Acrylic Sealer for protection",
      ],
      price: Math.round(recommendedPrice * 100) / 100,
    },
    premium: {
      name: "Premium Protection",
      description: "Ultimate protection against harsh elements with minimal future maintenance",
      features: [
        "Everything in Recommended package",
        "Upgrade to Penetrating Siloxane/Silane Sealer",
        "Superior freeze-thaw protection",
        "5-7+ year protection lifespan",
        "Maximum resistance to de-icing salts",
      ],
      price: Math.round(premiumPrice * 100) / 100,
    },
  };
}

export function calculatePropertyCleaningTotal(services: {
  driveway: boolean;
  roof: boolean;
  siding: boolean;
  gutters: boolean;
  fenceSides: number;
  fencePricePerSide: number;
}, prices: {
  driveway: number;
  roof: number;
  siding: number;
  gutters: number;
  minimumService: number;
}): { itemizedTotal: number; minimumApplied: boolean; finalTotal: number } {
  let itemizedTotal = 0;
  if (services.driveway) itemizedTotal += prices.driveway;
  if (services.roof) itemizedTotal += prices.roof;
  if (services.siding) itemizedTotal += prices.siding;
  if (services.gutters) itemizedTotal += prices.gutters;
  if (services.fenceSides > 0) {
    itemizedTotal += services.fencePricePerSide * services.fenceSides;
  }
  const minimumApplied = itemizedTotal < prices.minimumService;
  const finalTotal = Math.max(itemizedTotal, prices.minimumService);
  return { itemizedTotal, minimumApplied, finalTotal };
}
