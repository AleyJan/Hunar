// ============================================================
// HUNAR Route — src/routes/book.js
// POST /api/book        — Confirm and create booking (Step 5)
// GET  /api/book/:id    — Fetch booking by ID
// PATCH /api/book/:id/cancel — Cancel a booking
// ============================================================

const express = require("express");
const { protect } = require("../middleware/auth");
const bookingSimulator = require("../agent/steps/bookingSimulator");
const Booking = require("../models/Booking");
const providerMatcher = require("../agent/steps/providerMatcher");

const router = express.Router();

// POST /api/book
router.post("/", protect, async (req, res, next) => {
  try {
    const result = await bookingSimulator({
      ...req.body,
      userId: req.user._id,
    });

    res.status(201).json({
      status: "success",
      step: "BOOKING_CONFIRMED",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/book/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id })
      .populate("userId", "name phone")
      .populate("providerId", "name phone rating");

    if (!booking)
      return res.status(404).json({ status: "error", message: "Booking not found" });

    res.json({ status: "success", data: booking });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/book/:id/cancel
router.patch("/:id/cancel", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id, userId: req.user._id },
      { status: "cancelled", cancelledAt: new Date(), cancellationReason: req.body.reason },
      { new: true }
    );

    if (!booking)
      return res.status(404).json({ status: "error", message: "Booking not found" });

    res.json({ status: "success", message: "Booking cancelled", data: booking });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/provider-cancel", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { status: "provider_cancelled" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ status: "error", message: "Booking not found" });

    // Auto re-match
    const newMatches = await providerMatcher(
      booking.serviceType,
      booking.sector,
      booking.urgency,
      booking.userId
    );

    res.json({
      status: "success",
      message: "Provider cancelled — new providers found automatically",
      originalBooking: booking,
      newMatches: newMatches.top3,
      agentTrace: newMatches.trace,
    });
  } catch (err) { next(err); }
});

module.exports = router;
