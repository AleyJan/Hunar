// ============================================================
// HUNAR Route — src/routes/book.js
// ============================================================
const express = require("express");
const { protect } = require("../middleware/auth");
const bookingSimulator = require("../agent/steps/bookingSimulator");
const providerMatcher = require("../agent/steps/providerMatcher");
const Booking = require("../models/Booking");

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

// GET /api/book/my-bookings — MUST be before /:id
router.get("/my-bookings", protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("providerId", "name phone sector rating")
      .sort({ createdAt: -1 });
    res.json({ status: "success", total: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
});

// POST /api/book/payment-confirm — MUST be before /:id
router.post("/payment-confirm", protect, async (req, res, next) => {
  try {
    const { bookingId, paymentMethod = "jazzcash" } = req.body;
    if (!bookingId)
      return res.status(400).json({ status: "error", message: "bookingId is required" });

    const booking = await Booking.findOne({ bookingId });
    if (!booking)
      return res.status(404).json({ status: "error", message: "Booking not found" });

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

// GET /api/book/slots/:providerId/:date — MUST be before /:id
router.get("/slots/:providerId/:date", protect, async (req, res, next) => {
  try {
    const date = req.params.date; // e.g. "2026-05-21"

    // Get active bookings for this provider
    const activeBookings = await Booking.find({
      providerId: req.params.providerId,
      status: { $in: ["pending", "confirmed", "en_route", "arrived", "in_progress"] },
    }).select("scheduledAt");

    // Convert UTC time to Pakistan time (UTC+5)
    const bookedSlots = activeBookings.map(b => {
      const d = new Date(b.scheduledAt);
      const pkTime = new Date(d.getTime() + 5 * 60 * 60 * 1000);
      return `${String(pkTime.getUTCHours()).padStart(2, '0')}:${String(pkTime.getUTCMinutes()).padStart(2, '0')}`;
    });

    // Get rejected/cancelled bookings for this provider
    const rejectedBookings = await Booking.find({
      providerId: req.params.providerId,
      status: "provider_cancelled",
    }).select("scheduledAt rejectedSlots suggestedSlots providerUnavailableToday");

    let rejectedSlots = [];
    let suggestedSlots = [];
    let unavailableToday = false;

    for (const b of rejectedBookings) {
      // Convert booking date to PK time for comparison
      const d = new Date(b.scheduledAt);
      const pkTime = new Date(d.getTime() + 5 * 60 * 60 * 1000);
      const bookingDate = pkTime.toISOString().split('T')[0];

      if (bookingDate === date) {
        if (b.providerUnavailableToday) {
          unavailableToday = true;
          rejectedSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        } else if (b.rejectedSlots?.length > 0) {
          rejectedSlots = [...rejectedSlots, ...b.rejectedSlots];
        }
        if (b.suggestedSlots?.length > 0) {
          suggestedSlots = [...suggestedSlots, ...b.suggestedSlots];
        }
      }
    }

    // Remove duplicates and filter
    const uniqueBooked = [...new Set(bookedSlots)];
    const uniqueRejected = [...new Set(rejectedSlots)];
    const uniqueSuggested = [...new Set(suggestedSlots)]
      .filter(s => !uniqueBooked.includes(s) && !uniqueRejected.includes(s));

    res.json({
      status: "success",
      bookedSlots: uniqueBooked,
      rejectedSlots: uniqueRejected,
      suggestedSlots: uniqueSuggested,
      providerUnavailableToday: unavailableToday,
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

// PATCH /api/book/:id/provider-cancel
router.patch("/:id/provider-cancel", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { status: "provider_cancelled" },
      { new: true }
    );
    if (!booking)
      return res.status(404).json({ status: "error", message: "Booking not found" });

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
  } catch (err) {
    next(err);
  }
});

module.exports = router;