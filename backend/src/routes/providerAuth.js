const express = require("express");
const { protect } = require("../middleware/auth");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const Notification = require("../models/Notification");
const providerMatcher = require("../agent/steps/providerMatcher");

const router = express.Router();

// GET /api/provider/bookings
router.get("/bookings", protect, async (req, res, next) => {
    try {
        const bookings = await Booking.find({ providerId: req.user._id })
            .populate("userId", "name phone sector")
            .sort({ createdAt: -1 });
        res.json({ status: "success", total: bookings.length, data: bookings });
    } catch (err) { next(err); }
});

// PATCH /api/provider/bookings/:id/accept
router.patch("/bookings/:id/accept", protect, async (req, res, next) => {
    try {
        const booking = await Booking.findOneAndUpdate(
            { bookingId: req.params.id, providerId: req.user._id },
            { status: "confirmed", confirmedAt: new Date() },
            { new: true }
        ).populate("userId", "name phone");

        if (!booking)
            return res.status(404).json({ status: "error", message: "Booking not found" });

        await Notification.create({
            userId: booking.userId._id,
            bookingId: booking.bookingId,
            type: "booking_confirmed",
            channel: "simulated",
            message: `✅ Khushkhabri! Aapki booking confirm ho gayi!\n\nProvider ${req.user.name} ne accept kar liya.\nBooking ID: ${booking.bookingId}\nTime: ${new Date(booking.scheduledAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}`,
            phone: booking.userId.phone,
            status: "simulated",
            sentAt: new Date(),
        });

        res.json({ status: "success", message: "Booking accepted", data: booking });
    } catch (err) { next(err); }
});

// PATCH /api/provider/bookings/:id/reject
router.patch("/bookings/:id/reject", protect, async (req, res, next) => {
    try {
        const { reason, availabilityType, suggestedSlots = [] } = req.body;

        // Get the original booking first to get scheduledAt
        const original = await Booking.findOne({ bookingId: req.params.id });
        if (!original)
            return res.status(404).json({ status: "error", message: "Booking not found" });

        // Calculate rejected slot from booking time
        const bookedHour = new Date(original.scheduledAt);
        const pkTime = new Date(bookedHour.getTime() + 5 * 60 * 60 * 1000);
        const slotStr = `${String(pkTime.getUTCHours()).padStart(2, '0')}:${String(pkTime.getUTCMinutes()).padStart(2, '0')}`;

        const rejectedSlots = availabilityType === 'not_today'
            ? ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
            : [slotStr];

        const booking = await Booking.findOneAndUpdate(
            { bookingId: req.params.id, providerId: req.user._id },
            {
                status: "provider_cancelled",
                cancelledAt: new Date(),
                cancellationReason: reason,
                rejectedSlots,
                suggestedSlots,
                providerUnavailableToday: availabilityType === 'not_today',
            },
            { new: true }
        ).populate("userId", "name phone sector");

        // Find alternative providers using AI matching
        let alternatives = [];
        try {
            const matchResult = await providerMatcher(
                booking.serviceType,
                booking.sector,
                booking.urgency || 'medium',
                booking.userId._id
            );
            alternatives = matchResult.top3?.filter(p =>
                p.providerId.toString() !== req.user._id.toString()
            ).slice(0, 3) || [];
        } catch (err) {
            console.warn('AI matching for alternatives failed:', err.message);
        }

        // Build notification message
        const altText = alternatives.length > 0
            ? `\n\n🤖 HUNAR AI ne yeh best alternatives dhundhe:\n${alternatives.map((p, i) =>
                `${i + 1}. ${p.name} — ⭐${p.rating} — ${p.sector} — Rs${p.hourlyRate}/hr\n   📞 ${p.phone}`
            ).join('\n')}`
            : '\n\nAbhi koi alternative provider available nahi. Kal subah try karein.';

        const suggestedText = suggestedSlots.length > 0
            ? `\n\n✅ Provider ${req.user.name} in slots mein available hai:\n${suggestedSlots.map(s => `• ${s}`).join('\n')}\nApp mein wapas jakar doosra slot select karein.`
            : '';

        const unavailableText = availabilityType === 'not_today'
            ? 'Provider aaj poora din available nahi hai.'
            : 'Provider is waqt ke slot mein available nahi hai.';

        await Notification.create({
            userId: booking.userId._id,
            bookingId: booking.bookingId,
            type: "booking_cancelled",
            channel: "simulated",
            message: `❌ Aapki booking reject ho gayi.\n\n${unavailableText}\nReason: ${reason || 'Not specified'}${suggestedText}${altText}`,
            phone: booking.userId.phone,
            status: "simulated",
            sentAt: new Date(),
        });

        res.json({
            status: "success",
            message: "Booking rejected",
            data: booking,
            alternatives,
            suggestedSlots,
            availabilityType,
        });
    } catch (err) { next(err); }
});

// GET /api/provider/notifications
router.get("/notifications", protect, async (req, res, next) => {
    try {
        const bookings = await Booking.find({
            providerId: req.user._id,
            status: { $in: ["pending", "confirmed"] },
        })
            .populate("userId", "name phone sector")
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ status: "success", data: bookings });
    } catch (err) { next(err); }
});

// GET /api/provider/user/notifications
router.get("/user/notifications", protect, async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ status: "success", data: notifications });
    } catch (err) { next(err); }
});

module.exports = router;