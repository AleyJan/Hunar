const Groq = require("groq-sdk");
const { detectLanguage, detectUrgency, extractService, getClarifyingQuestion } = require("../../utils/languageUtils");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are HUNAR's multilingual service request parser for Pakistan. 
You understand Urdu, Roman Urdu, English, and mixed/code-switched language including misspellings and slang.

Extract information and return ONLY a valid JSON object. No markdown, no code blocks, no explanation.

Return exactly this shape:
{
  "service": "one of: ac_repair, plumbing, electrical, carpentry, painting, cleaning, tutoring, appliance_repair, shifting, pest_control, mechanics",
  "sector": "Islamabad sector like G-13 or F-10, or null if not mentioned",
  "urgency": "high or medium or low",
  "preferredTime": "ASAP",
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
- Confidence 0.95 if service AND sector both found
- Confidence 0.75 if service found but no sector — this is SUFFICIENT to proceed
- Confidence 0.50 if neither service nor sector found
- preferredTime is ALWAYS set to "ASAP" — never null, never ask user for time
- NEVER ask about time under any circumstances
- Only ask ONE clarifying question maximum — only about service OR sector, never time
- I8 and I-8 are the same sector — normalize all variants`;

const intentParser = async (message, context = {}) => {
  const startTime = Date.now();

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

    const text = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    parsed = JSON.parse(text);
    confidence = parsed.confidence || 0;

    // Always default time to ASAP — never leave null
    if (!parsed.preferredTime) parsed.preferredTime = "ASAP";

    // Use user's saved sector if AI couldn't extract one
    if (!parsed.sector && context.userSector) {
      parsed.sector = context.userSector;
      // Boost confidence since we now have sector
      if (parsed.service && confidence < 0.75) {
        parsed.confidence = 0.75;
        confidence = 0.75;
      }
    }

  } catch (err) {
    console.warn("⚠️  Groq API failed, using local parser:", err.message);
    usedFallback = true;
    parsed = {
      service: localService,
      sector: context.userSector || null,
      urgency: localUrgency,
      preferredTime: "ASAP",
      budgetSensitivity: "normal",
      confidence: localService ? 0.75 : 0.4,
      detectedLanguage: language,
      correctedMessage: message,
      jobComplexity: "basic",
      multipleServices: false,
    };
    confidence = parsed.confidence;
  }

  // Only ask clarifying question if BOTH service and sector are missing
  // Never ask about time
  const needsClarification = !parsed.service || (!parsed.sector && !context.userSector && confidence < 0.6);
  let clarifyingQuestion = null;

  if (needsClarification) {
    const missingField = !parsed.service ? "service" : "location";
    clarifyingQuestion = getClarifyingQuestion(
      parsed.detectedLanguage || language,
      missingField
    );
  }

  const trace = {
    step: "INTENT_UNDERSTANDING",
    input: { message, context },
    reasoning:
      `Detected language: ${parsed.detectedLanguage || language}. ` +
      `Service: ${parsed.service || "none"}. ` +
      `Sector: ${parsed.sector || "none"}. ` +
      `Groq confidence: ${confidence}. ` +
      (needsClarification
        ? `Clarification needed — missing ${!parsed.service ? "service" : "location"}.`
        : `Proceeding to provider matching.`),
    decision: needsClarification
      ? `Ask clarifying question: "${clarifyingQuestion}"`
      : `Intent parsed. Service: ${parsed.service}, Sector: ${parsed.sector}, Urgency: ${parsed.urgency}`,
    confidence,
    fallback_considered: usedFallback
      ? "Groq API failed — used local keyword parser"
      : "Groq API used — no fallback needed",
    output: parsed,
    durationMs: Date.now() - startTime,
  };

  return { parsed, trace, needsClarification, clarifyingQuestion };
};

module.exports = intentParser;