const express = require("express");
const { protect } = require("../middleware/auth");
const disputeResolver = require("../agent/steps/disputeResolver");
const Dispute = require("../models/Dispute");
const Booking = require("../models/Booking");
const sendNotification = require("../tools/sendNotification");

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

// GET /api/dispute/my-disputes — user's or provider's disputes
router.get("/my-disputes", protect, async (req, res, next) => {
  try {
    const query = req.user.role === "provider"
      ? { providerId: req.user._id }
      : { userId: req.user._id };

    const disputes = await Dispute.find(query)
      .populate("userId", "name phone")
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

    const updateFields = {
      providerResponse: response,
      providerResponseAt: new Date(),
      providerNote: note,
      status: response === 'accepted' ? 'provider_accepted' : 'human_review',
    };

    if (response === 'rejected') {
      updateFields.humanResolutionStatus = 'pending';
    }

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate("providerId", "name");

    if (!dispute)
      return res.status(404).json({ status: "error", message: "Dispute not found" });

    // Send notification to the user about provider's action
    const userMsg = response === 'accepted'
      ? `✅ Dispute Update: Provider ${dispute.providerId?.name || ''} has accepted the AI resolution. Your refund of Rs. ${dispute.resolutionAmount} is confirmed!`
      : `⚠️ Dispute Update: Provider ${dispute.providerId?.name || ''} rejected the AI decision. Your dispute has been referred to HUNAR Human Review.`;

    await sendNotification(dispute.userId, userMsg, {
      bookingId: dispute.bookingId,
      type: "dispute_updated",
    });

    res.json({
      status: "success",
      message: response === 'accepted'
        ? "Resolution accepted — dispute resolved"
        : "Resolution rejected — escalated to human review",
      data: dispute,
    });
  } catch (err) { next(err); }
});

// PATCH /api/dispute/:id/admin-resolve — Admin/Human resolve human review dispute (Hackathon feature)
router.patch("/:id/admin-resolve", protect, async (req, res, next) => {
  try {
    const { resolutionDetails, refundAmount } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute)
      return res.status(404).json({ status: "error", message: "Dispute not found" });

    dispute.status = 'closed';
    dispute.humanResolutionStatus = 'resolved';
    dispute.humanResolutionDetails = resolutionDetails || "Resolved by human manager.";
    if (refundAmount !== undefined) {
      dispute.resolutionAmount = refundAmount;
    }
    dispute.resolvedAt = new Date();

    await dispute.save();

    // Notify User
    const userMsg = `👨‍💼 Dispute Resolved by Human: ${dispute.humanResolutionDetails}. Final Refund: Rs. ${dispute.resolutionAmount}.`;
    await sendNotification(dispute.userId, userMsg, {
      bookingId: dispute.bookingId,
      type: "dispute_resolved",
    });

    // Notify Provider
    const providerMsg = `👨‍💼 Dispute Final Decision: ${dispute.humanResolutionDetails}. Refund Amount: Rs. ${dispute.resolutionAmount}.`;
    await sendNotification(dispute.providerId, providerMsg, {
      bookingId: dispute.bookingId,
      type: "dispute_resolved",
    });

    res.json({
      status: "success",
      message: "Dispute successfully resolved by Human Manager",
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