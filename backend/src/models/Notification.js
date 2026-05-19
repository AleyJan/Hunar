// ============================================================
// HUNAR — src/models/Notification.js
// ============================================================

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
    bookingId: { type: String },
    type: {
      type: String,
      enum: [
        "booking_confirmed",
        "provider_en_route",
        "provider_arrived",
        "service_completed",
        "booking_cancelled",
        "reminder",
        "dispute_resolved",
        "dispute_filed",
        "rating_request",
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ["sms", "whatsapp", "push", "simulated"],
      default: "simulated",
    },
    message: { type: String, required: true },
    phone: { type: String },
    status: {
      type: String,
      enum: ["sent", "failed", "simulated"],
      default: "simulated",
    },
    sentAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
