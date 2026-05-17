// ============================================================
// HUNAR Tool — src/tools/getBookings.js
// Fetch provider's booked calendar slots for a specific date
// ============================================================

const Booking = require("../models/Booking");

/**
 * @param {string} providerId - MongoDB ObjectId string
 * @param {string} date       - "YYYY-MM-DD"
 * @returns {Array} existing bookings for that day
 */
const getBookings = async (providerId, date) => {
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay   = new Date(`${date}T23:59:59.999Z`);

  const bookings = await Booking.find({
    providerId,
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ["cancelled", "disputed"] },
  })
    .select("scheduledAt travelBufferMinutes status bookingId")
    .sort({ scheduledAt: 1 });

  return {
    providerId,
    date,
    bookings,
    count: bookings.length,
  };
};

module.exports = getBookings;
