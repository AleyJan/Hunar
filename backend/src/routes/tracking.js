// ============================================================
// HUNAR Route — src/routes/tracking.js
// ============================================================
const express = require("express");
const { protect } = require("../middleware/auth");
const Booking = require("../models/Booking");
const qualityLoop = require("../agent/steps/qualityLoop");

const router = express.Router();

const VALID_STATUSES = ["en_route", "arrived", "in_progress", "completed"];

// Faster progression for demo — 1-2 minutes per step
const getAutoStatus = (confirmedAt) => {
  const secondsElapsed = (Date.now() - new Date(confirmedAt).getTime()) / 1000;
  if (secondsElapsed < 15) return { status: "confirmed", message: "Booking confirmed — provider will be assigned shortly" };
  if (secondsElapsed < 30) return { status: "en_route", message: "Provider is on the way to your location" };
  if (secondsElapsed < 45) return { status: "arrived", message: "Provider has arrived at your location" };
  if (secondsElapsed < 60) return { status: "in_progress", message: "Service is currently in progress" };
  return { status: "completed", message: "Service has been completed successfully" };
};

// GET /api/tracking/:bookingId
router.get("/:bookingId", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate("providerId", "name phone sector lat lng")
      .select("status scheduledAt sector serviceType providerId createdAt confirmedAt");

    if (!booking)
      return res.status(404).json({ status: "error", message: "Booking not found" });

    // Pending — hold tracking
    if (booking.status === "pending") {
      return res.json({
        status: "success",
        data: {
          bookingId: req.params.bookingId,
          currentStatus: "pending",
          statusMessage: "Provider ne abhi accept nahi kiya",
          eta: "Awaiting provider confirmation",
          provider: booking.providerId,
          serviceType: booking.serviceType,
          completionChecklist: null,
          agentTrace: {
            step: "SERVICE_QUALITY_LOOP",
            reasoning: "Booking is pending provider acceptance",
            decision: "Hold tracking until provider accepts",
            confidence: 1.0,
          },
        },
      });
    }

    // Auto-progress based on time since confirmation
    const autoStatus = getAutoStatus(booking.confirmedAt || booking.createdAt);

    // Update status in DB if progressed
    if (autoStatus.status !== booking.status && VALID_STATUSES.includes(autoStatus.status)) {
      booking.status = autoStatus.status;
      if (autoStatus.status === "completed") booking.completedAt = new Date();
      await booking.save();
    }

    const currentStatus = autoStatus.status;

    let completionChecklist = null;
    if (currentStatus === "completed") {
      completionChecklist = {
        jobCompleted: true,
        areaCleanedUp: true,
        customerSatisfactionConfirmed: true,
        paymentCollected: true,
        receiptIssued: true,
        photoEvidencePlaceholder: "https://hunar-uploads.s3.amazonaws.com/evidence/placeholder.jpg",
        checklistCompletedAt: new Date(),
        nextStep: "Please rate your experience to help future users",
      };
    }

    const providerLocation = currentStatus === "en_route"
      ? { lat: booking.providerId?.lat || 33.69, lng: booking.providerId?.lng || 73.05, moving: true }
      : null;

    const etaMap = {
      confirmed: "Confirming provider...",
      en_route: "~12 minutes away",
      arrived: "Provider is here",
      in_progress: "Service in progress",
      completed: "Done ✅",
    };

    const trace = {
      step: "SERVICE_QUALITY_LOOP",
      reasoning: `Booking ${req.params.bookingId} status: ${currentStatus}. ${autoStatus.message}.`,
      decision: currentStatus === "completed"
        ? "Service complete — checklist generated, feedback requested"
        : `Status progressed to ${currentStatus}`,
      confidence: 1.0,
    };

    res.json({
      status: "success",
      data: {
        bookingId: req.params.bookingId,
        currentStatus,
        statusMessage: autoStatus.message,
        eta: etaMap[currentStatus],
        scheduledAt: booking.scheduledAt,
        confirmedAt: booking.confirmedAt,
        provider: booking.providerId,
        serviceType: booking.serviceType,
        providerLocation,
        completionChecklist,
        agentTrace: trace,
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