// ============================================================
// HUNAR — src/models/Provider.js
// ============================================================

const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,

    },
    services: {
      type: [String],
      required: true,
      // e.g. ["ac_repair", "electrical"]
    },
    specialization: {
      type: String, // Primary skill for matching
      required: false,
    },
    sector: { type: String, required: true },  // Home base sector e.g. "G-13"
    city: { type: String, default: "Islamabad" },

    // ── Reputation ──────────────────────────────────────────
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 100, min: 0, max: 100 }, // percentage
    cancellationRate: { type: Number, default: 0, min: 0, max: 100 },

    // ── Pricing ─────────────────────────────────────────────
    hourlyRate: { type: Number, required: true }, // Base Rs per hour

    // ── Experience ──────────────────────────────────────────
    experienceYears: { type: Number, default: 0 },
    certifications: { type: [String], default: [] },

    // ── Availability ────────────────────────────────────────
    isAvailable: { type: Boolean, default: true },
    workloadToday: { type: Number, default: 0 }, // Reset daily

    // ── Calendar: booked time slots ─────────────────────────
    calendar: [
      {
        date: String,         // "2025-07-20"
        slots: [
          {
            startTime: String,  // "09:00"
            endTime: String,    // "11:00"
            bookingId: String,
          },
        ],
      },
    ],

    // ── Review Recency ──────────────────────────────────────
    lastReviewDate: { type: Date },

    isActive: { type: Boolean, default: true },
    password: { type: String, select: false },
    riskFlag: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },

  },
  { timestamps: true }
);

// Index for fast geospatial queries by sector and service
providerSchema.index({ sector: 1, services: 1 });
providerSchema.index({ rating: -1 });

module.exports = mongoose.model("Provider", providerSchema);
