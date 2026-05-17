const getProviders = require("../../tools/getProviders");
const getDistance = require("../../tools/getDistance");
const Groq = require("groq-sdk");
const {
  SCORING_WEIGHTS,
  MAX_DAILY_BOOKINGS,
} = require("../../config/constants");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Pure math scoring — Groq then interprets and re-ranks
const scoreProvider = (provider, distanceKm, travelTimeMin) => {
  const distScore = Math.max(0, 100 - travelTimeMin * 2);
  const ratingScore = (provider.rating / 5) * 100;
  const onTimeScore = provider.onTimeRate;
  const specScore = 70; // base — Groq will adjust
  const priceFit = Math.max(0, 100 - ((provider.hourlyRate - 300) / 1700) * 100);
  const recency = Math.min(provider.reviewCount * 2, 100);
  const cancelScore = Math.max(0, 100 - provider.cancellationRate * 100);

  const total =
    distScore * SCORING_WEIGHTS.distanceTravelTime +
    ratingScore * SCORING_WEIGHTS.ratingScore +
    onTimeScore * SCORING_WEIGHTS.onTimeReliability +
    specScore * SCORING_WEIGHTS.skillSpecialization +
    priceFit * SCORING_WEIGHTS.priceFit +
    recency * SCORING_WEIGHTS.reviewRecency +
    cancelScore * SCORING_WEIGHTS.cancellationRisk;

  return Math.round(total * 10) / 10;
};

const classifyComplexity = (service, urgency) => {
  const complex = ["electrical", "ac_repair", "shifting"];
  const basic = ["cleaning", "pest_control", "painting"];
  if (complex.includes(service) && urgency === "high") return "complex";
  if (basic.includes(service)) return "basic";
  return "intermediate";
};

const providerMatcher = async (service, sector, urgency = "medium", userId) => {
  const startTime = Date.now();

  // ── Step 1: Get providers from DB ──────────────────────
  const { inSector, nearby } = await getProviders(service, sector);
  const allProviders = [...inSector, ...nearby];

  if (allProviders.length === 0) {
    return {
      top3: [],
      trace: {
        step: "PROVIDER_MATCHING",
        input: { service, sector, urgency },
        reasoning: `No providers found for "${service}" in "${sector}" or nearby sectors.`,
        decision: "Fallback: suggest alternate time slots.",
        confidence: 0,
        fallback_considered: "Expanded to city-wide — still 0 results.",
        output: { top3: [], fallback: true },
        durationMs: Date.now() - startTime,
      },
      fallback: true,
    };
  }

  const complexity = classifyComplexity(service, urgency);

  // ── Step 2: Score each provider with math ──────────────
  const scored = await Promise.all(
    allProviders.map(async (provider) => {
      const dist = await getDistance(`${sector}, Islamabad`, `${provider.sector}, Islamabad`);
      const score = scoreProvider(provider, dist.distanceKm, dist.travelTimeMinutes);
      return {
        providerId: provider._id,
        name: provider.name,
        phone: provider.phone,
        sector: provider.sector,
        rating: provider.rating,
        hourlyRate: provider.hourlyRate,
        onTimeRate: provider.onTimeRate,
        cancellationRate: provider.cancellationRate,
        reviewCount: provider.reviewCount,
        experienceYears: provider.experienceYears,
        certifications: provider.certifications,
        distanceKm: dist.distanceKm,
        travelTimeMinutes: dist.travelTimeMinutes,
        distanceSource: dist.source,
        score,
        complexity,
        workloadFlagged: provider.workloadToday >= (MAX_DAILY_BOOKINGS || 5),
      };
    })
  );

  scored.sort((a, b) => b.score - a.score);
  const top5 = scored.slice(0, 5);

  // ── Step 3: Groq AI reasons and re-ranks top 5 ─────────
  const providersText = top5.map((p, i) =>
    `${i + 1}. ${p.name} | Score: ${p.score} | Distance: ${p.distanceKm}km | ` +
    `Rating: ${p.rating}/5 | OnTime: ${p.onTimeRate}% | ` +
    `CancelRate: ${p.cancellationRate * 100}% | Rate: Rs${p.hourlyRate}/hr | ` +
    `Experience: ${p.experienceYears}yrs | Certifications: ${p.certifications?.join(", ") || "none"} | ` +
    `Workload: ${p.workloadFlagged ? "HIGH" : "normal"}`
  ).join("\n");

  const groqPrompt = `You are HUNAR's provider selection AI for Pakistan home services.

Service requested: ${service}
Location: ${sector}, Islamabad  
Urgency: ${urgency}
Job complexity: ${complexity}

Available providers (pre-scored by algorithm):
${providersText}

Your job: Re-rank these providers and select the best TOP 3 for this specific job.
Consider:
1. For HIGH urgency — reliability and on-time rate matter more than price
2. For complex jobs — experience years and certifications matter
3. High cancellation rate is a RED FLAG for urgent jobs
4. Workload HIGH means provider may be too busy — penalize for urgent jobs
5. Balance distance vs quality — closer is not always better

Return ONLY valid JSON, no markdown:
{
  "rankedTop3": [
    {
      "rank": 1,
      "providerName": "name exactly as given",
      "reason": "2-3 sentence explanation why this provider is best for this job",
      "riskFlag": "none or low or medium or high",
      "recommendationScore": 0-100
    }
  ],
  "overallReasoning": "paragraph explaining the matching decision",
  "complexityAssessment": "why this job is basic/intermediate/complex",
  "urgencyConsiderations": "how urgency affected your ranking"
}`;

  let aiRanking;
  let groqFailed = false;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: groqPrompt }],
      temperature: 0.2,
      max_tokens: 800,
    });

    const text = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    aiRanking = JSON.parse(text);

  } catch (err) {
    console.warn("⚠️ Groq matching failed, using math scores:", err.message);
    groqFailed = true;
    aiRanking = {
      rankedTop3: top5.slice(0, 3).map((p, i) => ({
        rank: i + 1,
        providerName: p.name,
        reason: `Score ${p.score} — ${p.distanceKm}km away, rating ${p.rating}`,
        riskFlag: p.cancellationRate > 0.1 ? "medium" : "none",
        recommendationScore: p.score,
      })),
      overallReasoning: "Fallback math scoring used — Groq unavailable",
      complexityAssessment: complexity,
      urgencyConsiderations: urgency,
    };
  }

  // ── Step 4: Map Groq rankings back to full provider data ─
  const top3 = aiRanking.rankedTop3.map((ranked) => {
    const providerData = top5.find(
      (p) => p.name.toLowerCase() === ranked.providerName.toLowerCase()
    ) || top5[ranked.rank - 1];

    return {
      ...providerData,
      aiRank: ranked.rank,
      aiReason: ranked.reason,
      riskFlag: ranked.riskFlag,
      aiScore: ranked.recommendationScore,
    };
  }).filter(Boolean);

  const trace = {
    step: "PROVIDER_MATCHING",
    input: { service, sector, urgency, complexity },
    reasoning: aiRanking.overallReasoning,
    decision: `Top provider: ${top3[0]?.name} — ${top3[0]?.aiReason}`,
    confidence: groqFailed ? 0.7 : 0.95,
    fallback_considered: top3[1]
      ? `${top3[1].name} considered: ${top3[1].aiReason}`
      : "Only 1 provider available",
    urgencyConsiderations: aiRanking.urgencyConsiderations,
    complexityAssessment: aiRanking.complexityAssessment,
    groqUsed: !groqFailed,
    output: { top3, complexity },
    durationMs: Date.now() - startTime,
  };

  return { top3, trace, complexity };
};

module.exports = providerMatcher;