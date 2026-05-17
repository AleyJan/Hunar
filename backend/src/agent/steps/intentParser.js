// ============================================================
// HUNAR Agent Step 1 — src/agent/steps/intentParser.js
// NLP intent understanding using Groq AI (llama-3.1-8b-instant)
// ============================================================

const Groq = require("groq-sdk");
const { detectLanguage, detectUrgency, extractService, getClarifyingQuestion } = require("../../utils/languageUtils");
const { MIN_CONFIDENCE } = require("../../config/constants");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are HUNAR's multilingual service request parser for Pakistan. 
You understand Urdu, Roman Urdu, English, and mixed/code-switched language including misspellings and slang.

Extract information and return ONLY a valid JSON object. No markdown, no code blocks, no explanation.

Return exactly this shape:
{
  "service": "one of: ac_repair, plumbing, electrical, carpentry, painting, cleaning, tutoring, appliance_repair, shifting, pest_control, mechanics",
  "sector": "Islamabad sector like G-13 or F-10, or null if not mentioned",
  "urgency": "high or medium or low",
  "preferredTime": "tomorrow morning, today evening, ASAP, or null",
  "budgetSensitivity": "price_sensitive or normal or premium",
  "confidence": 0.0 to 1.0,
  "detectedLanguage": "english or roman_urdu or urdu or mixed",
  "correctedMessage": "cleaned version of the message",
  "jobComplexity": "basic or intermediate or complex",
  "multipleServices": false
}

Rules:
- High urgency signals: bilkul kaam nahi, urgent, jaldi, abhi, emergency, band ho gaya
- Price sensitive signals: sasta, budget nahi, mehnga mat, affordable, kam paise mein
- Always extract sector even if written as G13 or g-13 or G 13 — normalize to G-13 format
- If user mentions 2+ services set multipleServices to true
- Complexity: basic = cleaning/painting, intermediate = repair, complex = installation/overhaul
- Confidence above 0.85 if service AND sector both found
- Confidence 0.65-0.84 if only service found but no sector
- Confidence below 0.65 if neither found clearly
- Return ONLY the JSON object, nothing else`;

const intentParser = async (message, context = {}) => {
  const startTime = Date.now();

  // Local pre-processing as backup
  const language = detectLanguage(message);
  const localUrgency = detectUrgency(message);
  const localService = extractService(message);

  let parsed = {};
  let confidence = 0;
  let usedFallback = false;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const text = completion.choices[0].message.content.trim();

    // Strip markdown code blocks if model adds them
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    parsed = JSON.parse(cleaned);
    confidence = parsed.confidence || 0;

  } catch (err) {
    // Fallback to local parsing if Groq fails
    console.warn("⚠️  Groq API failed, using local parser:", err.message);
    usedFallback = true;
    parsed = {
      service: localService,
      sector: context.userSector || null,
      urgency: localUrgency,
      preferredTime: null,
      budgetSensitivity: "normal",
      confidence: localService ? 0.65 : 0.4,
      detectedLanguage: language,
      correctedMessage: message,
      jobComplexity: "basic",
      multipleServices: false,
    };
    confidence = parsed.confidence;
  }

  // Confidence check — ask clarifying question if too low
  const needsClarification = confidence < (MIN_CONFIDENCE || 0.7);
  let clarifyingQuestion = null;

  if (needsClarification) {
    const missingField = !parsed.service ? "service"
      : !parsed.sector ? "location"
        : "time";
    clarifyingQuestion = getClarifyingQuestion(
      parsed.detectedLanguage || language,
      missingField
    );
  }

  // Reasoning trace — saved for judge review
  const trace = {
    step: "INTENT_UNDERSTANDING",
    input: { message, context },
    reasoning:
      `Detected language: ${parsed.detectedLanguage || language}. ` +
      `Local service extraction: ${localService || "none"}. ` +
      `Urgency signals: ${localUrgency}. ` +
      `Groq confidence: ${confidence}. ` +
      (needsClarification
        ? `Confidence below threshold. Clarification required.`
        : `Confidence above threshold. Proceeding to provider matching.`),
    decision: needsClarification
      ? `Ask clarifying question: "${clarifyingQuestion}"`
      : `Parsed intent. Service: ${parsed.service}, Sector: ${parsed.sector}, Urgency: ${parsed.urgency}`,
    confidence,
    fallback_considered: usedFallback
      ? "Groq API failed — used local keyword parser"
      : "Groq API used successfully — no fallback needed",
    output: parsed,
    durationMs: Date.now() - startTime,
  };

  return { parsed, trace, needsClarification, clarifyingQuestion };
};

module.exports = intentParser;