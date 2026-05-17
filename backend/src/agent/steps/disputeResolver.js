const Booking = require("../../models/Booking");
const Provider = require("../../models/Provider");
const saveDispute = require("../../tools/saveDispute");
const sendNotification = require("../../tools/sendNotification");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const disputeResolver = async ({ bookingId, userId, issueType, description }) => {
  const startTime = Date.now();

  const booking = await Booking.findOne({ bookingId })
    .populate("providerId")
    .populate("userId", "name phone bookingCount");

  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }

  const provider = booking.providerId;
  const agreedPrice = booking.pricing?.totalAmount;

  // ── Groq AI reasons about the dispute ──────────────────
  const prompt = `You are HUNAR's dispute resolution AI for a Pakistani home services app.

Dispute details:
- Issue type: ${issueType}
- User description: ${description}
- Agreed price: Rs ${agreedPrice}
- Provider name: ${provider.name}
- Provider rating: ${provider.rating}/5
- Provider cancellation rate: ${provider.cancellationRate * 100}%
- Provider review count: ${provider.reviewCount}
- Service: ${booking.serviceType}

Reason through this dispute step by step like a fair mediator.
Consider: Was price agreed upfront? Does provider history support the complaint? Is this a pattern?

Return ONLY a single line of valid JSON with no newlines inside string values:
{"resolution":"refund or partial_refund or compensation or warning or escalate_to_human or no_action","resolutionAmount":0,"resolutionReason":"your reason here","actionMessage":"message for user","providerFlag":false,"reasoning":"your step by step thinking"}`;

  let aiDecision;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 400,
    });

    let text = completion.choices[0].message.content.trim();

    // Strip markdown code blocks
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Remove all control characters except space
    text = text.replace(/[\x00-\x1F\x7F]/g, " ");

    // Collapse multiple spaces
    text = text.replace(/\s+/g, " ");

    // Extract JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Groq response");

    aiDecision = JSON.parse(jsonMatch[0]);

  } catch (err) {
    console.warn("⚠️ Groq dispute failed, using rules:", err.message);
    aiDecision = {
      resolution: issueType === "no_show" ? "refund" : "escalate_to_human",
      resolutionAmount: issueType === "no_show" ? agreedPrice : 0,
      resolutionReason: "Fallback rule applied — Groq unavailable",
      actionMessage: "Aapka dispute review ho raha hai",
      providerFlag: false,
      reasoning: "Groq API unavailable — fallback rules used",
    };
  }

  // ── Save dispute to MongoDB ─────────────────────────────
  const dispute = await saveDispute({
    bookingId,
    userId,
    providerId: provider._id,
    issueType,
    description,
    resolution: aiDecision.resolution,
    resolutionReason: aiDecision.resolutionReason,
    resolutionAmount: aiDecision.resolutionAmount,
    status: aiDecision.resolution === "escalate_to_human" ? "escalated" : "resolved",
    resolvedAt: new Date(),
  });

  // ── Notify user ─────────────────────────────────────────
  await sendNotification(userId, aiDecision.actionMessage, {
    bookingId,
    type: "dispute_resolved",
  });

  const trace = {
    step: "DISPUTE_RESOLUTION",
    input: { bookingId, issueType, description },
    reasoning: aiDecision.reasoning,
    decision: `Resolution: ${aiDecision.resolution} | Amount: Rs ${aiDecision.resolutionAmount}`,
    confidence: aiDecision.resolution === "escalate_to_human" ? 0.6 : 0.9,
    fallback_considered: "Rule-based fallback armed if Groq fails",
    output: {
      disputeId: dispute._id,
      resolution: aiDecision.resolution,
      resolutionAmount: aiDecision.resolutionAmount,
      providerFlag: aiDecision.providerFlag,
    },
    durationMs: Date.now() - startTime,
  };

  return {
    dispute,
    resolution: aiDecision.resolution,
    resolutionAmount: aiDecision.resolutionAmount,
    resolutionReason: aiDecision.resolutionReason,
    actionMessage: aiDecision.actionMessage,
    trace,
  };
};

module.exports = disputeResolver;