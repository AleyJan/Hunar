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
    const result = await bookingSimulator({ ...req.body, userId: req.user._id });
    res.status(201).json({ status: "success", step: "BOOKING_CONFIRMED", data: result });
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
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/book/slots/:providerId/:date — MUST be before /:id
// date format: "2026-05-21"
router.get("/slots/:providerId/:date", protect, async (req, res, next) => {
  try {
    const { providerId, date } = req.params; // date = "2026-05-21"

    // Build start/end of the requested date in UTC
    // Pakistan is UTC+5, so "2026-05-21 00:00 PKT" = "2026-05-20 19:00 UTC"
    // We store scheduledAt in UTC, so convert date boundaries to UTC
    const dateStartPKT = new Date(`${date}T00:00:00+05:00`); // midnight PKT
    const dateEndPKT = new Date(`${date}T23:59:59+05:00`); // end of day PKT

    // ── Active bookings for THIS DATE ONLY ─────────────────
    const activeBookings = await Booking.find({
      providerId,
      status: { $in: ["pending", "confirmed", "en_route", "arrived", "in_progress"] },
      scheduledAt: { $gte: dateStartPKT, $lte: dateEndPKT },
    }).select("scheduledAt");

    // Convert UTC scheduledAt → PKT hour:minute string
    const bookedSlots = activeBookings.map(b => {
      const d = new Date(b.scheduledAt);
      const pkMs = d.getTime() + 5 * 60 * 60 * 1000;
      const pkDate = new Date(pkMs);
      return `${String(pkDate.getUTCHours()).padStart(2, '0')}:${String(pkDate.getUTCMinutes()).padStart(2, '0')}`;
    });

    // ── Rejected/cancelled bookings for THIS DATE ONLY ──────
    const rejectedBookings = await Booking.find({
      providerId,
      status: "provider_cancelled",
      scheduledAt: { $gte: dateStartPKT, $lte: dateEndPKT },
    }).select("scheduledAt rejectedSlots suggestedSlots providerUnavailableToday");

    let rejectedSlots = [];
    let suggestedSlots = [];
    let unavailableToday = false;

    for (const b of rejectedBookings) {
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
      .populate("userId", "name phone sector")
      .populate("providerId", "name phone rating sector");
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
      booking.serviceType, booking.sector, booking.urgency, booking.userId
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

// PATCH /api/book/:id/add-photo
router.patch("/:id/add-photo", protect, async (req, res, next) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl)
      return res.status(400).json({ status: "error", message: "photoUrl required" });

    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { $push: { photos: photoUrl } },
      { new: true }
    );
    if (!booking)
      return res.status(404).json({ status: "error", message: "Booking not found" });

    res.json({ status: "success", data: { photos: booking.photos } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
