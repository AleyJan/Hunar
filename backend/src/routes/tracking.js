// ============================================================
// HUNAR Route — src/routes/tracking.js
// GET   /api/tracking/:bookingId  — Get current status
// PATCH /api/tracking/:bookingId  — Update status (provider side)
// ============================================================

const express = require("express");
const { protect } = require("../middleware/auth");
const Booking = require("../models/Booking");
const qualityLoop = require("../agent/steps/qualityLoop");

const router = express.Router();

const VALID_STATUSES = ["en_route", "arrived", "in_progress", "completed"];

// GET /api/tracking/:bookingId
router.get("/:bookingId", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate("providerId", "name phone sector")
      .select("status scheduledAt sector serviceType providerId");

    if (!booking)
      return res.status(404).json({ status: "error", message: "Booking not found" });

    res.json({
      status: "success",
      data: {
        bookingId:    req.params.bookingId,
        currentStatus: booking.status,
        scheduledAt:  booking.scheduledAt,
        provider:     booking.providerId,
        serviceType:  booking.serviceType,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tracking/:bookingId
router.patch("/:bookingId", protect, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const result = await qualityLoop.updateStatus(req.params.bookingId, status, req.user._id);

    res.json({ status: "success", step: "SERVICE_QUALITY_LOOP", data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
