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
    console.log("📦 Book route body:", JSON.stringify(req.body));
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


// POST /api/book/payment-confirm — Simulate payment with 10% failure rate
router.post("/payment-confirm", protect, async (req, res, next) => {
  try {
    const { bookingId, paymentMethod = "jazzcash" } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        status: "error",
        message: "bookingId is required",
      });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        status: "error",
        message: "Booking not found",
      });
    }

    // Simulate 10% payment failure rate
    const paymentFailed = Math.random() < 0.1;

    if (paymentFailed) {
      return res.status(402).json({
        status: "error",
        message: "Payment failed — booking held for 10 minutes. Please retry.",
        bookingId,
        holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        retryAllowed: true,
        agentTrace: {
          step: "PAYMENT_CONFIRMATION",
          reasoning: "Payment gateway returned failure. Booking placed on 10-minute hold.",
          decision: "Retry payment within 10 minutes or slot will be released",
          confidence: 0.0,
        },
      });
    }

    // Payment success
    booking.status = "confirmed";
    await booking.save();

    res.json({
      status: "success",
      message: "Payment confirmed successfully",
      data: {
        bookingId,
        paymentMethod,
        amountPaid: booking.pricing?.totalAmount,
        paidAt: new Date(),
        receipt: `HUNAR-RCPT-${Date.now()}`,
        agentTrace: {
          step: "PAYMENT_CONFIRMATION",
          reasoning: `Payment of Rs ${booking.pricing?.totalAmount} received via ${paymentMethod}. Booking confirmed.`,
          decision: "Payment successful — booking status updated to confirmed",
          confidence: 1.0,
        },
      },
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
