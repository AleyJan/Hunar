// ============================================================
// HUNAR Route — src/routes/match.js
// POST /api/match
// Step 2+3+4: Provider matching + scheduling + pricing
// ============================================================
const express = require("express");
const { protect } = require("../middleware/auth");
const providerMatcher = require("../agent/steps/providerMatcher");
const scheduler = require("../agent/steps/scheduler");
const pricingEngine = require("../agent/steps/pricingEngine");
const reasoningLogger = require("../agent/reasoningLogger");

const router = express.Router();

router.post("/", protect, async (req, res, next) => {
  try {
    const {
      service,
      location,   // frontend sends "location" not "sector"
      sector,     // some calls send "sector"
      urgency = "medium",
      preferredTime,
      userId,
      multipleServices,
    } = req.body;

    // Normalize sector — accept either field name
    const resolvedSector = sector || location || req.user.sector || "G-13";

    // Clean service — handle comma-separated or array
    let resolvedService = service || "ac_repair";
    if (typeof resolvedService === "string" && resolvedService.includes(",")) {
      resolvedService = resolvedService.split(",")[0].trim();
    } else if (Array.isArray(resolvedService)) {
      resolvedService = resolvedService[0];
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const traceSteps = [];

    // ── Step 2: Match providers ──────────────────────────────
    const matchResult = await providerMatcher(
      resolvedService,
      resolvedSector,
      urgency,
      req.user._id
    );
    traceSteps.push(matchResult.trace);

    // If no providers found return early
    if (!matchResult.top3 || matchResult.top3.length === 0) {
      return res.json({
        status: "success",
        requestId,
        steps: ["PROVIDER_MATCHING"],
        data: {
          top3: [],
          scheduling: null,
          pricing: null,
          reasoningTrace: traceSteps,
        },
      });
    }

    const topProvider = matchResult.top3[0];

    // ── Step 3: Check scheduling ─────────────────────────────
    const schedResult = await scheduler({
      providerId: topProvider.providerId,
      requestedTime: preferredTime || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      travelBufferMinutes: topProvider.travelTimeMinutes || 15,
      sector: resolvedSector,
    });
    traceSteps.push(schedResult.trace);

    // ── Step 4: Calculate price ──────────────────────────────
    const priceResult = await pricingEngine({
      provider: topProvider,
      distanceKm: topProvider.distanceKm,
      urgency,
      userId: req.user._id,
      bookingCount: req.user.bookingCount,
      sector: resolvedSector,
      complexity: matchResult.complexity,
    });
    traceSteps.push(priceResult.trace);

    // ── Save reasoning trace ─────────────────────────────────
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
        top3: matchResult.top3,
        scheduling: schedResult,
        pricing: priceResult.pricing,
        reasoningTrace: traceSteps,
      },
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;