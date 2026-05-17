// ============================================================
// HUNAR Util — src/utils/bookingIdGenerator.js
// Generates unique IDs in BK-YYYY-XXXXX format
// ============================================================

const Booking = require("../models/Booking");

const generateBookingId = async () => {
  const year = new Date().getFullYear();

  // Count existing bookings this year to get the sequence number
  const count = await Booking.countDocuments({
    bookingId: { $regex: `^BK-${year}-` },
  });

  const seq = String(count + 1).padStart(5, "0"); // e.g. "00142"
  return `BK-${year}-${seq}`;
};

module.exports = { generateBookingId };
