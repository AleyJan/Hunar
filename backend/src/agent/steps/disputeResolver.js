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

  if (!booking)
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });

  const provider = booking.providerId;
  const agreedPrice = booking.pricing?.totalAmount || 0;

  // ── Groq AI analyzes dispute ─────────────────────────────
  const prompt = `You are HUNAR's dispute resolution AI for a Pakistani home services platform.

Dispute details:
- Issue type: ${issueType}
- User description: ${description}
- Agreed price: Rs ${agreedPrice}
- Provider: ${provider.name} | Rating: ${provider.rating}/5 | Reviews: ${provider.reviewCount}
- Cancellation rate: ${(provider.cancellationRate * 100).toFixed(0)}%
- Service: ${booking.serviceType} | Complexity: ${booking.complexity}
- Booking status: ${booking.status}

Your job: Act as a fair mediator. Analyze the dispute step by step.

Rules:
- no_show → always full refund (100%)
- overcharge → partial refund if price was agreed upfront, else escalate
- poor_quality → partial refund based on severity (20-80%)
- rude_behavior → warning + small compensation (10-20%)
- cancellation by provider → full refund
- other → escalate to human if unclear

Return ONLY valid JSON, no markdown, no newlines inside strings:
{"resolution":"refund or partial_refund or compensation or warning or escalate_to_human or no_action","refundPercentage":0,"resolutionAmount":0,"resolutionReason":"brief reason","actionMessage":"message for user in Roman Urdu","providerFlag":false,"reasoning":"step by step thinking"}`;

  let aiDecision;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    let text = completion.choices[0].message.content.trim();
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    text = text.replace(/[\x00-\x1F\x7F]/g, " ").replace(/\s+/g, " ");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Groq response");
    aiDecision = JSON.parse(jsonMatch[0]);

    // Calculate resolution amount from percentage if not set
    if (!aiDecision.resolutionAmount && aiDecision.refundPercentage) {
      aiDecision.resolutionAmount = Math.round(agreedPrice * aiDecision.refundPercentage / 100);
    }
  } catch (err) {
    console.warn("⚠️ Groq dispute failed, using rules:", err.message);
    const fallbackAmount = issueType === "no_show" ? agreedPrice : Math.round(agreedPrice * 0.5);
    aiDecision = {
      resolution: issueType === "no_show" ? "refund" : "escalate_to_human",
      refundPercentage: issueType === "no_show" ? 100 : 50,
      resolutionAmount: fallbackAmount,
      resolutionReason: "Fallback rule applied — Groq unavailable",
      actionMessage: "Aapka dispute review ho raha hai. Hum jald jawab denge.",
      providerFlag: false,
      reasoning: "Groq API unavailable — fallback rules used",
    };
  }

  // ── Save dispute ─────────────────────────────────────────
  const dispute = await saveDispute({
    bookingId,
    userId,
    providerId: provider._id,
    issueType,
    description,
    resolution: aiDecision.resolution,
    resolutionReason: aiDecision.resolutionReason,
    resolutionAmount: aiDecision.resolutionAmount,
    refundPercentage: aiDecision.refundPercentage || 0,
    aiReasoning: aiDecision.reasoning,
    status: aiDecision.resolution === "escalate_to_human" ? "human_review" : "ai_resolved",
  });

  // ── Notify user ──────────────────────────────────────────
  await sendNotification(userId, aiDecision.actionMessage, {
    bookingId,
    type: "dispute_resolved",
  });

  // ── Notify provider ──────────────────────────────────────
  const providerMsg = `⚠️ HUNAR Dispute Notice\nBooking: ${bookingId}\nIssue: ${issueType}\nAI Resolution: ${aiDecision.resolution}\nRefund: Rs ${aiDecision.resolutionAmount}\nPlease respond in the app within 24 hours.`;
  await sendNotification(provider._id, providerMsg, {
    bookingId,
    type: "dispute_filed",
  });

  const trace = {
    step: "DISPUTE_RESOLUTION",
    input: { bookingId, issueType, description },
    reasoning: aiDecision.reasoning,
    decision: `Resolution: ${aiDecision.resolution} | Refund: ${aiDecision.refundPercentage}% = Rs ${aiDecision.resolutionAmount}`,
    confidence: aiDecision.resolution === "escalate_to_human" ? 0.6 : 0.9,
    fallback_considered: "Rule-based fallback armed if Groq fails",
    output: {
      disputeId: dispute._id,
      resolution: aiDecision.resolution,
      refundPercentage: aiDecision.refundPercentage,
      resolutionAmount: aiDecision.resolutionAmount,
      providerFlag: aiDecision.providerFlag,
    },
    durationMs: Date.now() - startTime,
  };

  return {
    dispute,
    resolution: aiDecision.resolution,
    refundPercentage: aiDecision.refundPercentage,
    resolutionAmount: aiDecision.resolutionAmount,
    resolutionReason: aiDecision.resolutionReason,
    actionMessage: aiDecision.actionMessage,
    trace,
  };
};

module.exports = disputeResolver;