// ============================================================
// HUNAR Route — src/routes/match.js
// POST /api/match
// Step 2+3+4: Provider matching + scheduling + pricing
// ============================================================

const express = require("express");
const { protect } = require("../middleware/auth");
const providerMatcher = require("../agent/steps/providerMatcher");
const scheduler       = require("../agent/steps/scheduler");
const pricingEngine   = require("../agent/steps/pricingEngine");
const reasoningLogger = require("../agent/reasoningLogger");

const router = express.Router();

// POST /api/match
router.post("/", protect, async (req, res, next) => {
  try {
    const {
      service,
      sector,
      urgency = "medium",
      preferredTime,
      parsedIntent,
    } = req.body;

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const traceSteps = [];

    // ── Step 2: Match providers ──────────────────────────
    const matchResult = await providerMatcher(service, sector, urgency, req.user._id);
    traceSteps.push(matchResult.trace);

    // ── Step 3: Check scheduling for top provider ────────
    const schedResult = await scheduler(
      matchResult.top3[0]?.providerId,
      preferredTime,
      matchResult.top3[0]?.travelTimeMinutes
    );
    traceSteps.push(schedResult.trace);

    // ── Step 4: Calculate price for top provider ─────────
    const priceResult = await pricingEngine({
      provider:    matchResult.top3[0],
      distanceKm:  matchResult.top3[0]?.distanceKm,
      urgency,
      userId:      req.user._id,
      bookingCount: req.user.bookingCount,
      sector,
    });
    traceSteps.push(priceResult.trace);

    // ── Save reasoning trace ─────────────────────────────
    await reasoningLogger.save({
      requestId,
      userId: req.user._id,
      steps: traceSteps,
      outcome: "booking_created",
    });

    res.json({
      status: "success",
      requestId,
      steps: ["PROVIDER_MATCHING", "SCHEDULING", "DYNAMIC_PRICING"],
      data: {
        top3:          matchResult.top3,
        scheduling:    schedResult.scheduling,
        pricing:       priceResult.pricing,
        reasoningTrace: traceSteps,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
