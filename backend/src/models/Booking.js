const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },

    serviceType: { type: String, required: true },
    sector: { type: String, required: true },

    scheduledAt: { type: Date, required: true },
    travelBufferMinutes: { type: Number, default: 0 },

    complexity: { type: String, enum: ["basic", "intermediate", "complex"], default: "basic" },
    urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },

    pricing: {
      baseRate: Number,
      distanceFee: Number,
      urgencyPremium: Number,
      loyaltyDiscount: Number,
      complexityMultiplier: Number,
      surgeMultiplier: Number,
      totalAmount: Number,
    },

    status: {
      type: String,
      enum: [
        "pending", "confirmed", "en_route", "arrived",
        "in_progress", "completed", "cancelled",
        "provider_cancelled", "disputed",
      ],
      default: "pending",
    },

    reasoningTraceId: { type: String },
    photos: { type: [String], default: [] },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },

    confirmedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },

    // Provider rejection fields
    rejectedSlots: { type: [String], default: [] },
    suggestedSlots: { type: [String], default: [] },
    providerUnavailableToday: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ providerId: 1, scheduledAt: 1 });
bookingSchema.index({ sector: 1, createdAt: -1 });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);