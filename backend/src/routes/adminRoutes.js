// ============================================================
// HUNAR Route — src/routes/adminRoutes.js
// Admin endpoints: logs, stats, CSV export
// ============================================================
const express = require("express");
const { protect } = require("../middleware/auth");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const User = require("../models/User");
const ReasoningLog = require("../models/ReasoningLog");

const router = express.Router();

// GET /api/admin/export-bookings — CSV spreadsheet export
router.get("/export-bookings", protect, async (req, res, next) => {
    try {
        const bookings = await Booking.find({})
            .populate("userId", "name phone")
            .populate("providerId", "name phone");

        const rows = bookings.map(b => [
            b.bookingId,
            b.userId?.name || "Unknown",
            b.userId?.phone || "N/A",
            b.providerId?.name || "Unknown",
            b.providerId?.phone || "N/A",
            b.serviceType,
            b.sector,
            b.scheduledAt,
            b.urgency,
            b.complexity,
            b.pricing?.totalAmount || 0,
            b.status,
            b.rating || "Not rated",
            b.createdAt,
        ].join(",")).join("\n");

        const header = "BookingID,User,UserPhone,Provider,ProviderPhone,Service,Sector,ScheduledAt,Urgency,Complexity,Amount(PKR),Status,Rating,CreatedAt\n";

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=hunar-bookings.csv");
        res.send(header + rows);

    } catch (err) {
        next(err);
    }
});

// GET /api/admin/stats — platform statistics
router.get("/stats", protect, async (req, res, next) => {
    try {
        const [
            totalBookings,
            confirmedBookings,
            completedBookings,
            disputedBookings,
            totalUsers,
            totalProviders,
            totalRevenue,
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: "confirmed" }),
            Booking.countDocuments({ status: "completed" }),
            Booking.countDocuments({ status: "disputed" }),
            User.countDocuments(),
            Provider.countDocuments(),
            Booking.aggregate([
                { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
            ]),
        ]);

        res.json({
            status: "success",
            data: {
                bookings: {
                    total: totalBookings,
                    confirmed: confirmedBookings,
                    completed: completedBookings,
                    disputed: disputedBookings,
                },
                users: totalUsers,
                providers: totalProviders,
                revenue: {
                    totalPKR: totalRevenue[0]?.total || 0,
                    platformEarnings: Math.round((totalRevenue[0]?.total || 0) * 0.10),
                    providerEarnings: Math.round((totalRevenue[0]?.total || 0) * 0.90),
                },
            },
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/logs — reasoning traces
router.get("/logs", protect, async (req, res, next) => {
    try {
        const logs = await ReasoningLog.find({})
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            status: "success",
            total: logs.length,
            data: logs,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;