const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },

    issueType: {
      type: String,
      enum: ["overcharge", "no_show", "poor_quality", "rude_behavior", "cancellation", "overrun", "other"],
      required: true,
    },
    description: { type: String, required: true, maxlength: 1000 },

    // AI resolution
    resolution: {
      type: String,
      enum: ['refund', 'partial_refund', 'compensation', 'warning', 'blacklist', 'escalate_to_human', 'no_action'],
    },
    resolutionReason: { type: String },
    resolutionAmount: { type: Number, default: 0 },
    refundPercentage: { type: Number, default: 0 },
    aiReasoning: { type: String },

    // Provider response
    providerResponse: { type: String, enum: ['accepted', 'rejected'], default: null },
    providerResponseAt: { type: Date },
    providerNote: { type: String },

    // Human resolution details
    humanResolutionStatus: { type: String, enum: ['pending', 'resolved', null], default: null },
    humanResolutionDetails: { type: String },

    // Status flow: open → ai_resolved → provider_accepted/provider_rejected → human_review/closed
    status: {
      type: String,
      enum: ['open', 'ai_resolved', 'provider_accepted', 'provider_rejected', 'human_review', 'closed'],
      default: 'open',
    },

    resolvedAt: { type: Date },
    reasoningTraceId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);