// ============================================================
// HUNAR Route — src/routes/dispute.js
// POST /api/dispute       — Raise a dispute (Step 7)
// GET  /api/dispute/:id   — Get dispute details
// ============================================================

const express = require("express");
const { protect } = require("../middleware/auth");
const disputeResolver = require("../agent/steps/disputeResolver");
const Dispute = require("../models/Dispute");

const router = express.Router();

// POST /api/dispute
router.post("/", protect, async (req, res, next) => {
  try {
    const { bookingId, issueType, description } = req.body;

    if (!bookingId || !issueType || !description) {
      return res.status(400).json({
        status: "error",
        message: "bookingId, issueType, and description are required",
      });
    }

    const result = await disputeResolver({
      bookingId,
      userId:      req.user._id,
      issueType,
      description,
    });

    res.status(201).json({
      status: "success",
      step: "DISPUTE_RESOLUTION",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dispute/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("userId", "name phone")
      .populate("providerId", "name phone rating");

    if (!dispute)
      return res.status(404).json({ status: "error", message: "Dispute not found" });

    res.json({ status: "success", data: dispute });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
