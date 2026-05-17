// ============================================================
// HUNAR Route — src/routes/feedback.js
// POST /api/feedback/:bookingId — Submit rating + review
// ============================================================

const express = require("express");
const { protect } = require("../middleware/auth");
const qualityLoop = require("../agent/steps/qualityLoop");

const router = express.Router();

// POST /api/feedback/:bookingId
router.post("/:bookingId", protect, async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: "error",
        message: "Rating must be a number between 1 and 5",
      });
    }

    const result = await qualityLoop.submitFeedback(
      req.params.bookingId,
      req.user._id,
      { rating, review }
    );

    res.json({
      status: "success",
      step: "SERVICE_QUALITY_LOOP",
      message: "Feedback submitted and provider reputation updated",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
