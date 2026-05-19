// ============================================================
// HUNAR Tool — src/tools/saveDispute.js
// ============================================================
const Dispute = require("../models/Dispute");

const saveDispute = async ({
  bookingId,
  userId,
  providerId,
  issueType,
  description,
  resolution,
  resolutionReason,
  resolutionAmount,
  refundPercentage,
  aiReasoning,
  status,
}) => {
  const dispute = await Dispute.create({
    bookingId,
    userId,
    providerId,
    issueType,
    description,
    resolution,
    resolutionReason,
    resolutionAmount: resolutionAmount || 0,
    refundPercentage: refundPercentage || 0,
    aiReasoning,
    status: status || 'ai_resolved',
    resolvedAt: new Date(),
  });

  return dispute;
};

module.exports = saveDispute;