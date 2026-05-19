// ============================================================
// HUNAR Tool — src/tools/saveBooking.js
// Write confirmed booking to MongoDB
// ============================================================

const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const User = require("../models/User");
const { generateBookingId } = require("../utils/bookingIdGenerator");

/**
 * @param {Object} bookingData - All booking fields
 * @returns {Object} saved booking document
 */
const saveBooking = async (bookingData) => {
  console.log("💾 saveBooking received:", JSON.stringify(bookingData, null, 2));
  // Generate unique ID in BK-YYYY-XXXXX format
  const bookingId = await generateBookingId();

  const booking = await Booking.create({
    bookingId,
    ...bookingData,
    status: "confirmed",
    confirmedAt: new Date(),
  });

  // Increment provider workload counter
  await Provider.findByIdAndUpdate(bookingData.providerId, {
    $inc: { workloadToday: 1 },
  });

  // Increment user booking count (for loyalty tracking)
  await User.findByIdAndUpdate(bookingData.userId, {
    $inc: { bookingCount: 1 },
  });

  return booking;
};

module.exports = saveBooking;
