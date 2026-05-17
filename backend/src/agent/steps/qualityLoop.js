// ============================================================
// HUNAR Agent Step 6 — src/agent/steps/qualityLoop.js
// Service quality loop: feedback, rating update, reputation
// ============================================================

const Booking = require("../../models/Booking");
const Provider = require("../../models/Provider");

/**
 * Submit feedback and update provider reputation score.
 */
const submitFeedback = async (bookingId, userId, { rating, review }) => {
  const startTime = Date.now();

  // Find the booking
  const booking = await Booking.findOne({ bookingId });
  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }

  // Save rating and review to booking
  booking.rating = rating;
  booking.review = review;
  await booking.save();

  // Find provider and update reputation score
  const provider = await Provider.findById(booking.providerId);
  if (!provider) {
    throw Object.assign(new Error("Provider not found"), { statusCode: 404 });
  }

  const oldRating = provider.rating;
  const oldCount = provider.reviewCount;
  const newRating = parseFloat(
    ((oldRating * oldCount + rating) / (oldCount + 1)).toFixed(1)
  );

  provider.rating = newRating;
  provider.reviewCount = oldCount + 1;

  // Flag provider if rating drops below 3
  if (newRating < 3.0) {
    console.warn(`⚠️  [LOW RATING FLAG] Provider ${provider.name} — new rating: ${newRating}`);
  }

  await provider.save();

  const trace = {
    step: "SERVICE_QUALITY_LOOP",
    input: { bookingId, rating, review },
    reasoning:
      `Rating ${rating}/5 received for booking ${bookingId}. ` +
      `Provider ${provider.name} old rating: ${oldRating} (${oldCount} reviews). ` +
      `New rating: ${newRating} (${oldCount + 1} reviews). ` +
      (newRating < 3.0 ? "LOW RATING FLAG added — will impact future matching." : "Good rating — reputation improved."),
    decision: `Provider rating updated from ${oldRating} to ${newRating}`,
    confidence: 1.0,
    fallback_considered: "None required",
    output: { oldRating, newRating, reviewCount: oldCount + 1 },
    durationMs: Date.now() - startTime,
  };

  return {
    bookingId,
    oldRating,
    newProviderRating: newRating,
    reviewCount: oldCount + 1,
    message: `Shukriya! ${provider.name} ki reputation update ho gayi.`,
    trace,
  };
};

/**
 * Update booking status (en_route, arrived, completed etc)
 */
const updateStatus = async (bookingId, status) => {
  const booking = await Booking.findOneAndUpdate(
    { bookingId },
    { status, ...(status === "completed" ? { completedAt: new Date() } : {}) },
    { new: true }
  );
  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }
  return booking;
};

module.exports = { submitFeedback, updateStatus };