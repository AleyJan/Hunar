const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    issueType: {
      type: String, enum: ["overcharge", "no_show", "poor_quality", "rude_behavior",
        "cancellation", "overrun", "other"], required: true
    },
    description: { type: String, required: true, maxlength: 1000 },
    resolution: { type: String, enum: ['refund', 'partial_refund', 'compensation', 'warning', 'blacklist', 'escalate_to_human', 'no_action'] },
    resolutionReason: { type: String },
    resolutionAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'under_review', 'resolved', 'escalated'], default: 'open' },
    reasoningTraceId: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);
