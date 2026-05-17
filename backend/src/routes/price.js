// ============================================================
// HUNAR Route — src/routes/price.js
// POST /api/price
// Step 4: Dynamic pricing calculator (standalone)
// ============================================================

const express = require("express");
const { protect } = require("../middleware/auth");
const pricingEngine = require("../agent/steps/pricingEngine");

const router = express.Router();

// POST /api/price
router.post("/", protect, async (req, res, next) => {
  try {
    const { providerId, distanceKm, urgency, sector } = req.body;

    if (!providerId || distanceKm == null || !urgency) {
      return res.status(400).json({
        status: "error",
        message: "providerId, distanceKm, and urgency are required",
      });
    }

    const result = await pricingEngine({
      provider:    { providerId },
      distanceKm,
      urgency,
      userId:      req.user._id,
      bookingCount: req.user.bookingCount,
      sector,
    });

    res.json({
      status: "success",
      step: "DYNAMIC_PRICING",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
