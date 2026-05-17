// ============================================================
// HUNAR Agent — src/agent/reasoningLogger.js
// Persists full JSON reasoning trace to MongoDB
// ============================================================

const ReasoningLog = require("../models/ReasoningLog");

const reasoningLogger = {
  /**
   * Save a full multi-step reasoning trace to DB.
   * @param {Object} params - { requestId, bookingId, userId, steps, outcome }
   */
  save: async ({ requestId, bookingId, userId, steps = [], outcome = "booking_created" }) => {
    const totalDurationMs = steps.reduce((sum, s) => sum + (s.durationMs || 0), 0);

    const log = await ReasoningLog.create({
      requestId,
      bookingId,
      userId,
      steps,
      totalSteps: steps.length,
      totalDurationMs,
      outcome,
    });

    console.log(`\n📝 [REASONING LOG SAVED] requestId: ${requestId} | steps: ${steps.length} | outcome: ${outcome}`);
    return log;
  },

  /**
   * Fetch a reasoning log by requestId.
   */
  get: async (requestId) => {
    return ReasoningLog.findOne({ requestId });
  },
};

module.exports = reasoningLogger;
