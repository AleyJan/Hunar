// ============================================================
// HUNAR Route — src/routes/providers.js
// GET /api/providers
// GET /api/providers/:id
// GET /api/providers/:id/optimization
// ============================================================
const express = require("express");
const Provider = require("../models/Provider");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");
const router = express.Router();

// GET /api/providers
router.get("/", protect, async (req, res, next) => {
  try {
    const { service, sector, page = 1, limit = 10 } = req.query;
    const filter = { isAvailable: true };
    if (service) filter.services = { $regex: new RegExp(service, "i") };
    if (sector) filter.sector = sector;

    const providers = await Provider.find(filter)
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Provider.countDocuments(filter);

    res.json({
      status: "success",
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: providers,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/providers/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider)
      return res.status(404).json({ status: "error", message: "Provider not found" });
    res.json({ status: "success", data: provider });
  } catch (err) {
    next(err);
  }
});

// GET /api/providers/:id/optimization — provider-side workload + demand forecasting
router.get("/:id/optimization", protect, async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider)
      return res.status(404).json({ status: "error", message: "Provider not found" });

    // Get bookings from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentBookings = await Booking.find({
      providerId: req.params.id,
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get bookings from last 30 days for revenue
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyBookings = await Booking.find({
      providerId: req.params.id,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate peak demand hour from recent bookings
    const hourCounts = {};
    recentBookings.forEach((b) => {
      const hour = new Date(b.scheduledAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakHourEntry ? `${peakHourEntry[0]}:00` : "09:00";

    // Calculate earnings
    const weeklyRevenue = recentBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    const providerWeekly = Math.round(weeklyRevenue * 0.90);
    const providerMonthly = Math.round(monthlyRevenue * 0.90);

    // Workload status
    const workloadStatus = provider.workloadToday >= 5 ? "HIGH — consider closing new slots"
      : provider.workloadToday >= 3 ? "MODERATE — you have capacity"
        : "LOW — accept more bookings";

    // Demand forecasting — check which sectors have most bookings
    const sectorCounts = {};
    recentBookings.forEach((b) => {
      sectorCounts[b.sector] = (sectorCounts[b.sector] || 0) + 1;
    });
    const highDemandSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];

    res.json({
      status: "success",
      data: {
        providerName: provider.name,
        sector: provider.sector,
        currentRating: provider.rating,
        reviewCount: provider.reviewCount,
        workloadToday: provider.workloadToday,
        workloadStatus,

        earnings: {
          thisWeek: `Rs ${providerWeekly}`,
          thisMonth: `Rs ${providerMonthly}`,
          platformFeeNote: "10% platform fee deducted from each booking",
          fairEarningNote: "You receive 90% of every booking value",
        },

        demandForecast: {
          weeklyBookings: recentBookings.length,
          peakDemandHour: peakHour,
          highDemandSector: highDemandSector ? highDemandSector[0] : provider.sector,
          forecast: recentBookings.length > 3
            ? `High demand detected — ${recentBookings.length} bookings this week`
            : "Normal demand — keep your slots open to attract more customers",
        },

        recommendedSlots: ["09:00", "11:00", "14:00", "16:00"],
        tips: [
          "Keep your on-time rate above 90% to rank higher in search results",
          "Respond quickly to booking requests to avoid cancellations",
          `Peak demand is around ${peakHour} — make sure you are available`,
          "Complete your profile with certifications to attract complex jobs",
        ],

        agentTrace: {
          step: "PROVIDER_SIDE_OPTIMIZATION",
          reasoning: `Analyzed ${recentBookings.length} bookings in last 7 days. Peak hour: ${peakHour}. Workload today: ${provider.workloadToday}.`,
          decision: workloadStatus,
          confidence: 0.85,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;