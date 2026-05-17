// ============================================================
// HUNAR — src/config/constants.js
// All pricing constants, scoring weights, sector data
// ============================================================

// ── Dynamic Pricing ─────────────────────────────────────────
const DISTANCE_RATE_PER_KM = 50; // Rs per km

const URGENCY_PREMIUM = {
  high: 200,
  medium: 100,
  low: 0,
};

const COMPLEXITY_MULTIPLIER = {
  basic: 1.0,
  intermediate: 1.2,
  complex: 1.5,
};

const LOYALTY_DISCOUNT = 100;       // Rs — applied if bookingCount >= 3
const LOYALTY_THRESHOLD = 3;        // Minimum bookings to qualify
const SURGE_THRESHOLD = 5;          // Bookings in same sector in last 2 hours
const SURGE_MULTIPLIER = 1.2;
const BOOKING_HOLD_MINUTES = 10;    // Payment failure hold window
const REMINDER_BEFORE_MIN = 30;     // Pre-booking reminder offset

// ── Provider Scoring Weights (total = 1.0) ──────────────────
const SCORING_WEIGHTS = {
  distanceTravelTime:  0.25,
  ratingScore:         0.20,
  onTimeReliability:   0.15,
  skillSpecialization: 0.15,
  priceFit:            0.10,
  reviewRecency:       0.10,
  cancellationRisk:    0.05,
};

// ── Confidence Threshold ────────────────────────────────────
const MIN_CONFIDENCE = 0.7; // Below this → ask clarifying question

// ── Workload Flag ────────────────────────────────────────────
const MAX_DAILY_BOOKINGS = 3; // Flag provider if >= this

// ── Dispute Resolutions ──────────────────────────────────────
const RESOLUTION_TYPES = [
  "refund",
  "partial_refund",
  "compensation",
  "warning",
  "blacklist",
  "escalate_to_human",
];

// ── Booking Status Flow ──────────────────────────────────────
const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
];

// ── Islamabad Sector Proximity Table (km estimates) ──────────
// Used as Google Maps API fallback
const SECTOR_DISTANCES = {
  "G-13": { "G-13": 0, "G-12": 2, "G-11": 4, "G-10": 5, "G-9": 7, "G-8": 9, "F-10": 8, "F-11": 6, "I-8": 6, "I-9": 8 },
  "G-12": { "G-13": 2, "G-12": 0, "G-11": 2, "G-10": 4, "G-9": 6, "G-8": 8, "F-10": 7, "F-11": 5, "I-8": 5, "I-9": 7 },
  "G-11": { "G-13": 4, "G-12": 2, "G-11": 0, "G-10": 2, "G-9": 4, "G-8": 6, "F-10": 6, "F-11": 4, "I-8": 5, "I-9": 6 },
  "G-10": { "G-13": 5, "G-12": 4, "G-11": 2, "G-10": 0, "G-9": 2, "G-8": 4, "F-10": 5, "F-11": 3, "I-8": 5, "I-9": 5 },
  "G-9":  { "G-13": 7, "G-12": 6, "G-11": 4, "G-10": 2, "G-9": 0, "G-8": 2, "F-10": 4, "F-11": 3, "I-8": 5, "I-9": 4 },
  "F-10": { "G-13": 8, "G-12": 7, "G-11": 6, "G-10": 5, "G-9": 4, "G-8": 3, "F-10": 0, "F-11": 2, "I-8": 7, "I-9": 6 },
  "F-11": { "G-13": 6, "G-12": 5, "G-11": 4, "G-10": 3, "G-9": 3, "G-8": 2, "F-10": 2, "F-11": 0, "I-8": 6, "I-9": 5 },
  "I-8":  { "G-13": 6, "G-12": 5, "G-11": 5, "G-10": 5, "G-9": 5, "G-8": 5, "F-10": 7, "F-11": 6, "I-8": 0, "I-9": 2 },
  "I-9":  { "G-13": 8, "G-12": 7, "G-11": 6, "G-10": 5, "G-9": 4, "G-8": 4, "F-10": 6, "F-11": 5, "I-8": 2, "I-9": 0 },
};

// ── Supported Services ───────────────────────────────────────
const SERVICES = [
  "ac_repair",
  "plumbing",
  "electrical",
  "carpentry",
  "painting",
  "cleaning",
  "tutoring",
  "appliance_repair",
  "shifting",
  "pest_control",
];

module.exports = {
  DISTANCE_RATE_PER_KM,
  URGENCY_PREMIUM,
  COMPLEXITY_MULTIPLIER,
  LOYALTY_DISCOUNT,
  LOYALTY_THRESHOLD,
  SURGE_THRESHOLD,
  SURGE_MULTIPLIER,
  BOOKING_HOLD_MINUTES,
  REMINDER_BEFORE_MIN,
  SCORING_WEIGHTS,
  MIN_CONFIDENCE,
  MAX_DAILY_BOOKINGS,
  RESOLUTION_TYPES,
  BOOKING_STATUSES,
  SECTOR_DISTANCES,
  SERVICES,
};
