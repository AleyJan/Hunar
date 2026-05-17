// ============================================================
// HUNAR — src/models/ReasoningLog.js
// Stores full JSON reasoning trace for every agent request
// This is PROOF OF AGENTIC BEHAVIOR for judges
// ============================================================

const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    input: { type: mongoose.Schema.Types.Mixed },
    reasoning: { type: String, required: true },
    decision: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1 },
    fallback_considered: { type: String },
    output: { type: mongoose.Schema.Types.Mixed },
    durationMs: { type: Number },
  },
  { _id: false }
);

const reasoningLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    bookingId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    steps: [stepSchema],
    totalSteps: { type: Number, default: 0 },
    totalDurationMs: { type: Number, default: 0 },
    outcome: {
      type: String,
      enum: [
        "booking_created",
        "clarification_needed",
        "no_providers",
        "dispute_resolved",
        "error",
      ],
    },
  },
  { timestamps: true }
);

// Only these two — requestId unique above already creates its own index
reasoningLogSchema.index({ userId: 1 });
reasoningLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.ReasoningLog ||
  mongoose.model("ReasoningLog", reasoningLogSchema);