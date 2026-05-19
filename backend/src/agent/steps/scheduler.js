const getBookings = require("../../tools/getBookings");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const scheduler = async ({ providerId, requestedTime, travelBufferMinutes = 15, sector }) => {
  const startTime = Date.now();

  if (!providerId || !requestedTime) {
    return {
      available: false,
      reason: "Missing providerId or requestedTime",
      waitlist: null,
      trace: {
        step: "SCHEDULING",
        reasoning: "Missing input — cannot check slot",
        decision: "Skip scheduling check",
        confidence: 0,
        durationMs: 0,
      },
    };
  }

  // ── Step 1: Get existing bookings for this provider ─────
  const requestedDate = new Date(requestedTime);
  const date = requestedDate.toISOString().split("T")[0];
  const { bookings } = await getBookings(providerId, date);

  // ── Step 2: Build context for Groq ─────────────────────
  const existingSlots = bookings.map((b) => ({
    time: b.scheduledAt,
    duration: "60 minutes",
    status: b.status,
  }));

  const groqPrompt = `You are HUNAR's scheduling AI for a Pakistani home services app.

Provider has these existing bookings on ${date}:
${existingSlots.length === 0
      ? "No existing bookings — provider is fully free"
      : existingSlots.map((s) => `- ${s.time} (${s.duration}, status: ${s.status})`).join("\n")}

New booking requested for: ${requestedTime}
Travel buffer needed: ${travelBufferMinutes} minutes between jobs
User sector: ${sector}

Determine:
1. Is the requested slot available? (check for conflicts including travel buffer)
2. If not available, suggest 3 alternative slots on the same day
3. Consider realistic working hours: 8:00 AM to 8:00 PM only
4. If the provider is fully booked for the entire day, set alternativeSlots to empty array

Return ONLY valid JSON, no markdown:
{
  "isAvailable": true or false,
  "conflictReason": "why slot is taken or null if available",
  "alternativeSlots": ["HH:MM", "HH:MM", "HH:MM"] or [],
  "travelBufferApplied": true or false,
  "reasoning": "step by step explanation of your decision",
  "recommendation": "brief advice for the user",
  "fullyBooked": true or false
}`;

  let aiDecision;
  let groqFailed = false;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: groqPrompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const text = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    aiDecision = JSON.parse(text);

  } catch (err) {
    console.warn("⚠️ Groq scheduling failed, using rule check:", err.message);
    groqFailed = true;

    const reqTime = new Date(requestedTime).getTime();
    const hasConflict = existingSlots.some((s) => {
      const slotTime = new Date(s.time).getTime();
      return Math.abs(reqTime - slotTime) < (60 + travelBufferMinutes) * 60000;
    });

    aiDecision = {
      isAvailable: !hasConflict,
      conflictReason: hasConflict ? "Slot conflicts with existing booking" : null,
      alternativeSlots: hasConflict ? ["10:00", "14:00", "16:00"] : [],
      travelBufferApplied: true,
      reasoning: "Fallback rule check — Groq unavailable",
      recommendation: hasConflict ? "Please select an alternative slot" : "Slot is available",
      fullyBooked: false,
    };
  }

  // ── Waitlist logic — offered when provider is fully booked ─
  const allSlotsTaken = !aiDecision.isAvailable &&
    (aiDecision.alternativeSlots.length === 0 || aiDecision.fullyBooked);

  const waitlist = allSlotsTaken ? {
    offered: true,
    message: "Sab slots full hain. Kya aap waitlist mein add hona chahte hain? Jab slot available ho, aapko notify karenge.",
    estimatedWait: "2-4 ghante",
    autoNotify: true,
  } : null;

  const trace = {
    step: "SCHEDULING",
    input: { providerId, requestedTime, travelBufferMinutes, date },
    reasoning: aiDecision.reasoning,
    decision: aiDecision.isAvailable
      ? `Slot ${requestedTime} is AVAILABLE`
      : allSlotsTaken
        ? `Provider fully booked — waitlist offered`
        : `Slot TAKEN — alternatives: ${aiDecision.alternativeSlots.join(", ")}`,
    confidence: groqFailed ? 0.7 : 0.95,
    fallback_considered: allSlotsTaken
      ? "All slots taken — waitlist offered as fallback"
      : aiDecision.alternativeSlots.length > 0
        ? `Alternatives suggested: ${aiDecision.alternativeSlots.join(", ")}`
        : "No fallback needed — slot available",
    groqUsed: !groqFailed,
    output: aiDecision,
    durationMs: Date.now() - startTime,
  };

  return {
    available: aiDecision.isAvailable,
    conflictReason: aiDecision.conflictReason,
    alternativeSlots: aiDecision.alternativeSlots,
    recommendation: aiDecision.recommendation,
    waitlist,
    trace,
  };
};

module.exports = scheduler;