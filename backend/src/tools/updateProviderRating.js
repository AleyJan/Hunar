// ============================================================
// HUNAR Tool — src/tools/updateProviderRating.js
// Weighted average reputation update formula
// ============================================================

const Provider = require("../models/Provider");

/**
 * Formula: newRating = (oldRating * reviewCount + newScore) / (reviewCount + 1)
 *
 * @param {string} providerId - MongoDB ObjectId string
 * @param {number} newScore   - Rating submitted by user (1-5)
 * @returns {Object} updated rating info
 */
const updateProviderRating = async (providerId, newScore) => {
  const provider = await Provider.findById(providerId);
  if (!provider) throw new Error("Provider not found");

  const oldRating    = provider.rating;
  const reviewCount  = provider.reviewCount;

  // Weighted average
  const updatedRating =
    reviewCount === 0
      ? newScore
      : (oldRating * reviewCount + newScore) / (reviewCount + 1);

  const roundedRating = Math.round(updatedRating * 10) / 10; // 1 decimal

  provider.rating      = roundedRating;
  provider.reviewCount = reviewCount + 1;
  provider.lastReviewDate = new Date();
  await provider.save();

  // Flag for review if rating drops below 3
  const flagged = roundedRating < 3;

  return {
    providerId,
    previousRating: oldRating,
    newScore,
    updatedRating: roundedRating,
    totalReviews: reviewCount + 1,
    flagged,
    flagReason: flagged ? "Rating below 3.0 — provider flagged for quality review" : null,
  };
};

module.exports = updateProviderRating;
