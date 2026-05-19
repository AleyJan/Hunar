const express = require("express");
const { protect } = require("../middleware/auth");
const disputeResolver = require("../agent/steps/disputeResolver");
const Dispute = require("../models/Dispute");
const Booking = require("../models/Booking");

const router = express.Router();

// POST /api/dispute — file a dispute
router.post("/", protect, async (req, res, next) => {
  try {
    const { bookingId, issueType, description } = req.body;
    if (!bookingId || !issueType || !description)
      return res.status(400).json({ status: "error", message: "bookingId, issueType, and description are required" });

    const result = await disputeResolver({ bookingId, userId: req.user._id, issueType, description });

    res.status(201).json({ status: "success", step: "DISPUTE_RESOLUTION", data: result });
  } catch (err) { next(err); }
});

// GET /api/dispute/my-disputes — user's disputes
router.get("/my-disputes", protect, async (req, res, next) => {
  try {
    const disputes = await Dispute.find({ userId: req.user._id })
      .populate("providerId", "name phone rating")
      .sort({ createdAt: -1 });
    res.json({ status: "success", total: disputes.length, data: disputes });
  } catch (err) { next(err); }
});

// PATCH /api/dispute/:id/provider-respond — provider accepts or rejects AI resolution
router.patch("/:id/provider-respond", protect, async (req, res, next) => {
  try {
    const { response, note } = req.body; // response: 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(response))
      return res.status(400).json({ status: "error", message: "response must be 'accepted' or 'rejected'" });

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      {
        providerResponse: response,
        providerResponseAt: new Date(),
        providerNote: note,
        status: response === 'accepted' ? 'provider_accepted' : 'human_review',
      },
      { new: true }
    );

    if (!dispute)
      return res.status(404).json({ status: "error", message: "Dispute not found" });

    res.json({
      status: "success",
      message: response === 'accepted'
        ? "Resolution accepted — dispute closed"
        : "Resolution rejected — escalated to human review",
      data: dispute,
    });
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
});

module.exports = router;