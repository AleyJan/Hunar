// ============================================================
// HUNAR Agent Step 4 — src/agent/steps/pricingEngine.js
// Dynamic pricing formula with full itemized breakdown
// ============================================================

const Booking = require("../../models/Booking");
const Provider = require("../../models/Provider");
const {
  DISTANCE_RATE_PER_KM,
  URGENCY_PREMIUM,
  COMPLEXITY_MULTIPLIER,
  LOYALTY_DISCOUNT,
  LOYALTY_THRESHOLD,
  SURGE_THRESHOLD,
  SURGE_MULTIPLIER,
} = require("../../config/constants");

/**
 * Check if surge pricing applies in a sector (>5 bookings last 2 hours).
 */
const isSurge = async (sector) => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const recentCount = await Booking.countDocuments({
    sector,
    createdAt: { $gte: twoHoursAgo },
    status:    { $nin: ["cancelled"] },
  });
  return recentCount > SURGE_THRESHOLD;
};

/**
 * Step 4: Calculate dynamic price.
 *
 * Formula:
 *   total = (baseRate + distanceFee + urgencyPremium - loyaltyDiscount)
 *           * complexityMultiplier * surgeMultiplier
 *
 * @param {Object} params - { provider, distanceKm, urgency, userId, bookingCount, sector, complexity }
 * @returns {Object} { pricing, trace }
 */
const pricingEngine = async ({
  provider,
  distanceKm = 0,
  urgency = "medium",
  bookingCount = 0,
  sector,
  complexity = "basic",
}) => {
  const startTime = Date.now();

  // Fetch provider's hourly rate from DB if not already available
  let baseRate = provider?.hourlyRate;
  if (!baseRate && provider?.providerId) {
    const dbProvider = await Provider.findById(provider.providerId).select("hourlyRate");
    baseRate = dbProvider?.hourlyRate || 500;
  }
  baseRate = baseRate || 500;

  const distanceFee       = Math.round(distanceKm * DISTANCE_RATE_PER_KM);
  const urgencyPremium    = URGENCY_PREMIUM[urgency]  || 0;
  const complexityMult    = COMPLEXITY_MULTIPLIER[complexity] || 1.0;
  const loyaltyDiscount   = bookingCount >= LOYALTY_THRESHOLD ? LOYALTY_DISCOUNT : 0;
  const surgeApplies      = sector ? await isSurge(sector) : false;
  const surgeMult         = surgeApplies ? SURGE_MULTIPLIER : 1.0;

  const subtotal  = baseRate + distanceFee + urgencyPremium - loyaltyDiscount;
  const total     = Math.round(subtotal * complexityMult * surgeMult);

  const pricing = {
    baseRate,
    distanceFee,
    urgencyPremium,
    loyaltyDiscount,
    complexityMultiplier: complexityMult,
    surgeMultiplier:      surgeMult,
    subtotal,
    totalAmount:          total,
    currency:             "PKR",
  };

  const reasoning =
    `baseRate=Rs${baseRate} | distanceFee=${distanceKm}km×50=Rs${distanceFee} | ` +
    `urgencyPremium=${urgency}→Rs${urgencyPremium} | ` +
    `loyaltyDiscount=${bookingCount >= LOYALTY_THRESHOLD ? "APPLIED" : "NOT APPLICABLE (< 3 bookings)"}→Rs${loyaltyDiscount} | ` +
    `complexityMult=${complexity}→×${complexityMult} | ` +
    `surge=${surgeApplies ? "ACTIVE" : "none"}→×${surgeMult} | ` +
    `TOTAL=(${baseRate}+${distanceFee}+${urgencyPremium}-${loyaltyDiscount})×${complexityMult}×${surgeMult}=Rs${total}`;

  const trace = {
    step: "DYNAMIC_PRICING",
    input: { baseRate, distanceKm, urgency, bookingCount, sector, complexity },
    reasoning,
    decision: `Total price: Rs ${total} PKR`,
    confidence: 1.0,
    fallback_considered: "No fallback — formula is deterministic",
    output: pricing,
    durationMs: Date.now() - startTime,
  };

  return { pricing, trace };
};

module.exports = pricingEngine;
