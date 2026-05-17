// ============================================================
// HUNAR Agent Step 5 — src/agent/steps/bookingSimulator.js
// Booking confirmation, ID generation, notifications
// ============================================================

const saveBooking = require("../../tools/saveBooking");
const sendNotification = require("../../tools/sendNotification");
const { checkSlotConflict } = require("../../utils/timeSlotUtils");
const getBookings = require("../../tools/getBookings");
const Provider = require("../../models/Provider");
const User = require("../../models/User");

const bookingSimulator = async (data) => {
  const startTime = Date.now();
  const {
    userId, providerId, serviceType, sector,
    scheduledAt, travelBufferMinutes = 0,
    complexity = "basic", urgency = "medium",
    pricing, reasoningTraceId,
  } = data;

  // ── Parse scheduledAt safely ──────────────────────────────
  let scheduledDate;

  if (!scheduledAt) {
    // Default to tomorrow 09:00 if nothing provided
    scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    scheduledDate.setHours(9, 0, 0, 0);

  } else if (typeof scheduledAt === "string" && scheduledAt.includes("T")) {
    // Full ISO string — e.g. "2026-05-17T09:00:00.000Z"
    scheduledDate = new Date(scheduledAt);

  } else if (typeof scheduledAt === "string" && scheduledAt.includes(":")) {
    // Time only — e.g. "09:00" — assume tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = scheduledAt.split(":");
    tomorrow.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    scheduledDate = tomorrow;

  } else {
    scheduledDate = new Date(scheduledAt);
  }

  // Validate the date
  if (isNaN(scheduledDate.getTime())) {
    throw Object.assign(
      new Error("Invalid scheduledAt — use ISO format like 2026-05-17T09:00:00.000Z or time like 09:00"),
      { statusCode: 400 }
    );
  }

  const scheduledAtISO = scheduledDate.toISOString();
  const date = scheduledAtISO.split("T")[0];

  // ── Final conflict check ──────────────────────────────────
  const { bookings } = await getBookings(providerId, date);
  const { hasConflict, nextAvailableSlots } = checkSlotConflict(
    scheduledAtISO, 60, bookings, travelBufferMinutes
  );

  if (hasConflict) {
    throw Object.assign(
      new Error("Slot conflict detected — please re-select time"),
      { statusCode: 409, nextAvailableSlots }
    );
  }

  // ── Save booking to MongoDB ───────────────────────────────
  const booking = await saveBooking({
    userId, providerId, serviceType, sector,
    scheduledAt: scheduledAtISO,
    travelBufferMinutes, complexity, urgency,
    pricing, reasoningTraceId,
  });

  // ── Fetch user + provider for notifications ───────────────
  const [user, provider] = await Promise.all([
    User.findById(userId).select("name phone"),
    Provider.findById(providerId).select("name phone"),
  ]);

  // ── Simulate SMS/WhatsApp confirmations ───────────────────
  const formattedTime = scheduledDate.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const userMsg =
    `✅ HUNAR Booking Confirmed!\n` +
    `ID: ${booking.bookingId}\n` +
    `Service: ${serviceType}\n` +
    `Provider: ${provider?.name || "TBD"}\n` +
    `Phone: ${provider?.phone || "TBD"}\n` +
    `Time: ${formattedTime}\n` +
    `Total: Rs ${pricing?.totalAmount || 0}`;

  const providerMsg =
    `📋 New HUNAR Job!\n` +
    `ID: ${booking.bookingId}\n` +
    `Service: ${serviceType}\n` +
    `Sector: ${sector}\n` +
    `Time: ${formattedTime}\n` +
    `Customer: ${user?.name || "Unknown"}\n` +
    `Customer Phone: ${user?.phone || "N/A"}`;

  const [userNotif, providerNotif] = await Promise.all([
    sendNotification(userId, userMsg, {
      bookingId: booking.bookingId,
      phone: user?.phone,
      type: "booking_confirmed",
    }),
    sendNotification(providerId, providerMsg, {
      bookingId: booking.bookingId,
      phone: provider?.phone,
      type: "booking_confirmed",
    }),
  ]);

  // ── Log reminder (would use job queue in production) ──────
  console.log(
    `⏰ [REMINDER SCHEDULED] Booking ${booking.bookingId} — ` +
    `reminder 30 min before ${formattedTime}`
  );

  // ── Reasoning trace ───────────────────────────────────────
  const trace = {
    step: "BOOKING_CONFIRMED",
    input: { userId, providerId, serviceType, scheduledAt: scheduledAtISO, pricing },
    reasoning:
      `Final conflict check passed for slot ${formattedTime}. ` +
      `Booking ${booking.bookingId} saved to MongoDB. ` +
      `User ${user?.name} notified at ${user?.phone}. ` +
      `Provider ${provider?.name} notified at ${provider?.phone}. ` +
      `Reminder scheduled 30 minutes before slot.`,
    decision: `Booking ${booking.bookingId} confirmed — all parties notified.`,
    confidence: 1.0,
    fallback_considered: "No slot conflict on final check — no fallback needed.",
    output: {
      bookingId: booking.bookingId,
      status: booking.status,
      scheduledAt: scheduledAtISO,
      provider: provider?.name,
      totalAmount: pricing?.totalAmount,
    },
    durationMs: Date.now() - startTime,
  };

  return {
    booking,
    smsSimulation: {
      userMessage: userMsg,
      providerMessage: providerMsg,
    },
    notifications: [userNotif, providerNotif],
    trace,
  };
};

module.exports = bookingSimulator;