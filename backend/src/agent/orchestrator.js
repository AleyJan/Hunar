// ============================================================
// HUNAR Agent — src/agent/orchestrator.js
// Master controller — chains all 7 agent steps
// This is the brain of the HUNAR agentic system
// ============================================================

const intentParser = require("./steps/intentParser");
const providerMatcher = require("./steps/providerMatcher");
const scheduler = require("./steps/scheduler");
const pricingEngine = require("./steps/pricingEngine");
const bookingSimulator = require("./steps/bookingSimulator");
const qualityLoop = require("./steps/qualityLoop");
const disputeResolver = require("./steps/disputeResolver");
const reasoningLogger = require("./reasoningLogger");

/**
 * Full agentic orchestration — runs all 7 steps in sequence.
 * Each step feeds into the next. All traces are collected and saved.
 *
 * @param {Object} params
 * @param {string} params.message       - Raw user message
 * @param {Object} params.user          - Authenticated user object
 * @param {string} params.preferredTime - Optional ISO datetime
 * @returns {Object} Full agent response with traces
 */
const orchestrate = async ({ message, user, preferredTime }) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const allTraces = [];
  const startTime = Date.now();

  console.log(`\n🤖 [ORCHESTRATOR] Starting agentic workflow | requestId: ${requestId}`);

  // ── STEP 1: Intent Understanding ─────────────────────────
  console.log("→ Step 1: Intent Understanding");
  const intentResult = await intentParser(message, { userSector: user.sector });
  allTraces.push(intentResult.trace);

  // If low confidence, stop and ask for clarification
  if (intentResult.needsClarification) {
    await reasoningLogger.save({
      requestId, userId: user._id, steps: allTraces, outcome: "clarification_needed",
    });
    return {
      requestId,
      outcome: "clarification_needed",
      clarifyingQuestion: intentResult.clarifyingQuestion,
      reasoningTrace: allTraces,
    };
  }

  const { service, sector, urgency, complexity } = intentResult.parsed;
  const resolvedSector = sector || user.sector;

  // ── STEP 2: Provider Matching ─────────────────────────────
  console.log("→ Step 2: Provider Matching");
  const matchResult = await providerMatcher(service, resolvedSector, urgency, user._id);
  allTraces.push(matchResult.trace);

  if (!matchResult.top3 || matchResult.top3.length === 0) {
    await reasoningLogger.save({
      requestId, userId: user._id, steps: allTraces, outcome: "no_providers",
    });
    return {
      requestId,
      outcome: "no_providers",
      message: "No providers found. Try a different time or area.",
      reasoningTrace: allTraces,
    };
  }

  const topProvider = matchResult.top3[0];

  // ── STEP 3: Scheduling ────────────────────────────────────
  console.log("→ Step 3: Scheduling");
  const schedResult = await scheduler({
    providerId: topProvider.providerId,
    requestedTime: preferredTime || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    travelBufferMinutes: topProvider.travelTimeMinutes || 15,
    sector: resolvedSector,
  });
  allTraces.push(schedResult.trace);

  // ── STEP 4: Dynamic Pricing ───────────────────────────────
  console.log("→ Step 4: Dynamic Pricing");
  const priceResult = await pricingEngine({
    provider: topProvider,
    distanceKm: topProvider.distanceKm,
    urgency,
    bookingCount: user.bookingCount,
    sector: resolvedSector,
    complexity: matchResult.complexity,
  });
  allTraces.push(priceResult.trace);

  // ── Save trace so far ─────────────────────────────────────
  await reasoningLogger.save({
    requestId,
    userId: user._id,
    steps: allTraces,
    outcome: "booking_created",
  });

  console.log(`✅ [ORCHESTRATOR] Completed in ${Date.now() - startTime}ms | requestId: ${requestId}`);

  return {
    requestId,
    outcome: "ready_to_confirm",
    parsed: intentResult.parsed,
    top3Providers: matchResult.top3,
    scheduling: schedResult.scheduling,
    pricing: priceResult.pricing,
    complexity: matchResult.complexity,
    reasoningTrace: allTraces,
  };
};

module.exports = { orchestrate, qualityLoop, disputeResolver };
