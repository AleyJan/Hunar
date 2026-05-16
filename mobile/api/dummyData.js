// Used in Auth and Profile Screens
export const DUMMY_USER = {
  userId: "USR-8X9PL",
  name: "Noman Ahmed",
  email: "noman.ahmed@example.pk",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_token_123"
};

// Used in AI Match Results Screen (Single Service test)
export const DUMMY_PARSED = {
  services: ["Electrician"],
  location: "G-11/2",
  time: "Today, anytime",
  urgency: "high",
  budgetSensitive: false,
  confidence: 0.94,
  clarifyQuestion: null,
  rawLanguage: "urdu"
};

// Used in AI Match Results Screen (Multi-Service test or modal)
export const DUMMY_MULTI = {
  services: ["AC Repair", "Plumbing"],
  location: "F-8 Markaz",
  time: "Tomorrow morning",
  urgency: "medium",
  budgetSensitive: true,
  confidence: 0.91,
  clarifyQuestion: null,
  rawLanguage: "roman_urdu"
};

// Used in Provider Selection Screen
export const DUMMY_PROVIDERS = [
  {
    id: "PRV-101",
    name: "Kamran Khan",
    avatar: "KK",
    skills: ["Electrician", "AC Repair"],
    sector: "F-6",
    distanceKm: 8.5,
    travelMins: 25,
    rate: 1800,
    rating: 4.8,
    reviewCount: 142,
    onTimeScore: 98,
    cancelRate: 2,
    score: 95,
    risk: "low",
    slots: ["10:00 AM", "02:00 PM"],
    reason: "Best matching skills and highest rating, though slightly farther away.",
    verified: true
  },
  {
    id: "PRV-102",
    name: "Bilal Tariq",
    avatar: "BT",
    skills: ["Electrician", "UPS Repair"],
    sector: "G-11",
    distanceKm: 1.2,
    travelMins: 5,
    rate: 1200,
    rating: 4.1,
    reviewCount: 38,
    onTimeScore: 85,
    cancelRate: 8,
    score: 82,
    risk: "medium",
    slots: ["09:00 AM", "11:30 AM", "04:00 PM"],
    reason: "Very close to your location and cheaper, but has a lower on-time score.",
    verified: false
  },
  {
    id: "PRV-103",
    name: "Shahid Ali",
    avatar: "SA",
    skills: ["Plumbing", "Electrician"],
    sector: "I-8",
    distanceKm: 5.0,
    travelMins: 15,
    rate: 1500,
    rating: 4.5,
    reviewCount: 89,
    onTimeScore: 92,
    cancelRate: 4,
    score: 88,
    risk: "low",
    slots: ["12:00 PM", "03:00 PM", "06:00 PM"],
    reason: "Balanced option with reliable ratings and acceptable distance.",
    verified: true
  }
];

// Used in Confirmation / Checkout Screen
export const DUMMY_PRICE = {
  baseRate: 1500,
  distanceFee: 200,
  urgencyPremium: 300,
  loyaltyDiscount: 100,
  surgeMultiplier: 1.0,
  total: 1900,
  breakdown: "Base (1500 PKR) + Distance Fee (200 PKR) + Urgency (300 PKR) - Discount (100 PKR)",
  alternative: {
    providerId: "PRV-102",
    name: "Bilal Tariq",
    total: 1400
  }
};

// Used in Booking Success/History Screens
export const DUMMY_BOOKING = {
  bookingId: "BK-2025-00142",
  status: "confirmed",
  providerName: "Kamran Khan",
  slot: "02:00 PM",
  totalPrice: 1900,
  smsSimulation: "Aap ki booking BK-2025-00142 confirm ho gayi hai. Kamran Khan 02:00 PM tak pohnch jayenge.",
  estimatedArrival: "02:15 PM"
};

// Used in Active Booking / Tracking Screen
export const DUMMY_TRACKING_STEPS = [
  { status: "confirmed", message: "Booking confirm ho gai hai", eta: null },
  { status: "en_route", message: "Provider raste mein hai", eta: "15 mins" },
  { status: "arrived", message: "Provider pohnch gaya hai", eta: "Arrived" },
  { status: "in_progress", message: "Kaam shuru ho gaya hai", eta: "In Progress" },
  { status: "completed", message: "Kaam mukammal ho gaya hai, baraye meherbani rating dein.", eta: null }
];
