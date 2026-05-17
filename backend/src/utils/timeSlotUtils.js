// ============================================================
// HUNAR Util — src/utils/timeSlotUtils.js
// Slot conflict detection + travel buffer helpers
// ============================================================

/**
 * Check if a requested time slot conflicts with existing bookings.
 * A conflict exists if the new slot falls within an existing slot + its buffer.
 *
 * @param {Date}   requestedTime  - Desired slot start time
 * @param {number} durationMin    - Expected service duration (minutes)
 * @param {Array}  existingBookings - From getBookings()
 * @param {number} bufferMin      - Travel buffer to add after each job
 * @returns {{ hasConflict: boolean, conflictingBooking?: Object }}
 */
const checkSlotConflict = (requestedTime, durationMin = 60, existingBookings = [], bufferMin = 0) => {
  const reqStart = new Date(requestedTime).getTime();
  const reqEnd   = reqStart + (durationMin + bufferMin) * 60 * 1000;

  for (const booking of existingBookings) {
    const bookedStart = new Date(booking.scheduledAt).getTime();
    const bookedEnd   = bookedStart + (60 + (booking.travelBufferMinutes || 0)) * 60 * 1000;

    // Overlap check
    if (reqStart < bookedEnd && reqEnd > bookedStart) {
      return { hasConflict: true, conflictingBooking: booking };
    }
  }

  return { hasConflict: false };
};

/**
 * Given a conflicted slot, find the next 3 available slots.
 *
 * @param {Array}  existingBookings - Sorted by scheduledAt ascending
 * @param {number} bufferMin        - Travel buffer per job
 * @param {number} slotDurationMin  - How long each slot is
 * @returns {Array} next 3 available start times (Date objects)
 */
const findNextAvailableSlots = (existingBookings = [], bufferMin = 15, slotDurationMin = 60) => {
  const slots = [];
  let candidate = new Date();

  // Round up to next half hour
  candidate.setMinutes(candidate.getMinutes() < 30 ? 30 : 60, 0, 0);

  while (slots.length < 3) {
    const { hasConflict } = checkSlotConflict(
      candidate,
      slotDurationMin,
      existingBookings,
      bufferMin
    );

    if (!hasConflict) {
      slots.push(new Date(candidate));
    }

    // Advance by 30 minutes
    candidate = new Date(candidate.getTime() + 30 * 60 * 1000);

    // Safety: don't look more than 3 days out
    const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    if (candidate > threeDaysOut) break;
  }

  return slots;
};

/**
 * Add travel buffer minutes to a date
 */
const addTravelBuffer = (date, bufferMinutes) => {
  return new Date(new Date(date).getTime() + bufferMinutes * 60 * 1000);
};

module.exports = { checkSlotConflict, findNextAvailableSlots, addTravelBuffer };
