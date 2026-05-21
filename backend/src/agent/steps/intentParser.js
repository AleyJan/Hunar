// ============================================================
// HUNAR Agent Step 1 — src/agent/steps/intentParser.js
// Multilingual intent parsing with budget + city validation
// ============================================================
const Groq = require("groq-sdk");
const { detectLanguage, detectUrgency, extractService, getClarifyingQuestion } = require("../../utils/languageUtils");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Valid Islamabad sectors
const VALID_ISLAMABAD_SECTORS = new Set([
  "B-17", "B-18",
  "C-14", "C-15", "C-16",
  "D-11", "D-12", "D-13", "D-14", "D-15", "D-16", "D-17",
  "E-7", "E-8", "E-9", "E-10", "E-11", "E-12", "E-16", "E-17", "E-18",
  "F-5", "F-6", "F-7", "F-8", "F-9", "F-10", "F-11", "F-12", "F-14", "F-15", "F-16", "F-17",
  "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12", "G-13", "G-14", "G-15", "G-16", "G-17",
  "H-8", "H-9", "H-10", "H-11", "H-12", "H-13", "H-14", "H-15", "H-16", "H-17",
  "I-8", "I-9", "I-10", "I-11", "I-12", "I-14", "I-15", "I-16", "I-18",
]);

// Minimum base rates per service (Rs.)
const MIN_SERVICE_RATES = {
  ac_repair: 800,
  plumbing: 600,
  electrical: 700,
  carpentry: 700,
  painting: 600,
  cleaning: 500,
  tutoring: 500,
  appliance_repair: 600,
  shifting: 1000,
  pest_control: 800,
  mechanics: 700,
};

// Service display names
const SERVICE_NAMES = {
  ac_repair: "AC Repair",
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  cleaning: "Cleaning",
  tutoring: "Tutoring",
  appliance_repair: "Appliance Repair",
  shifting: "Shifting",
  pest_control: "Pest Control",
  mechanics: "Mechanics",
};

// Normalize sector format: "i 8", "G13", "g 13" → "I-8", "G-13"
const normalizeSectors = (msg) => {
  return msg.replace(/\b([A-Za-z])\s*-?\s*(\d{1,2})\b/g, (match, letter, num) => {
    const normalized = `${letter.toUpperCase()}-${num}`;
    return VALID_ISLAMABAD_SECTORS.has(normalized) ? normalized : match;
  });
};

// Extract budget amount from message
const extractBudget = (message) => {
  const msg = message.toLowerCase();
  const patterns = [
    /(?:rs\.?|rupees?|ruppee?s?|pkr)[\s.]*([\d,]+)/i,
    /([\d,]+)[\s.]*(?:rs\.?|rupees?|ruppee?s?|pkr)/i,
    /(?:budget|limit|sirf|only|bas)[\s.]*(?:rs\.?|rupees?)?[\s.]*([\d,]+)/i,
    /([\d,]+)[\s.]*(?:ka budget|se kam|se zyada)/i,
  ];
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ''));
      if (num > 200 && num < 100000) return num;
    }
  }
  return null;
};

// Check if message mentions non-Islamabad city
const detectOtherCity = (message) => {
  const msg = message.toLowerCase();
  const otherCities = [
    'lahore', 'karachi', 'peshawar', 'quetta', 'multan', 'faisalabad',
    'rawalpindi', 'pindi', 'murree', 'abbottabad', 'mansehra', 'swat',
    'hyderabad', 'sukkur', 'larkana', 'sialkot', 'gujranwala', 'bahawalpur',
    'sargodha', 'sahiwal', 'dera', 'mardan', 'nowshera', 'attock',
    'taxila', 'wah', 'haripur', 'kohat', 'bannu', 'tank',
  ];
  return otherCities.find(city => msg.includes(city)) || null;
};

// Budget response
const getBudgetResponse = (language, budget, service, minRate) => {
  const serviceName = SERVICE_NAMES[service] || service;
  if (language === 'roman_urdu' || language === 'mixed') {
    return `Hum samajhte hain aapka budget limited hai, lekin ${serviceName} ki minimum starting price Rs. ${minRate} se shuru hoti hai. Yeh qualified aur verified professionals ki minimum cost hai. Kya aap Rs. ${minRate} ya usse thoda zyada mein service chahte hain?`;
  }
  return `We understand your budget is limited, but ${serviceName} starts from a minimum of Rs. ${minRate} with our verified professionals. Would you like to proceed with Rs. ${minRate} or slightly above?`;
};

// City rejection response
const getCityResponse = (language, city) => {
  if (language === 'roman_urdu' || language === 'mixed') {
    return `Abhi HUNAR sirf Islamabad mein available hai. ${city ? `"${city}" mein` : 'Is shehar mein'} hum service provide nahi karte. Kya aap Islamabad ke kisi sector mein service chahte hain?`;
  }
  return `HUNAR currently operates only in Islamabad. We don't serve ${city || 'that city'} yet. Are you looking for a service in Islamabad?`;
};

// Invalid sector response
const getInvalidSectorResponse = (language, sector) => {
  if (language === 'roman_urdu' || language === 'mixed') {
    return `"${sector}" Islamabad ka valid sector nahi lagta. HUNAR G, F, H, I, E, D sectors mein available hai. Apna correct sector batayein, jaise G-13, F-10, etc.`;
  }
  return `"${sector}" doesn't appear to be a valid Islamabad sector. HUNAR covers G, F, H, I, E, D sectors. Please share your correct sector like G-13, F-10, etc.`;
};

const SYSTEM_PROMPT = `You are HUNAR's multilingual service request parser for Pakistan.
You understand Urdu, Roman Urdu, English, and mixed/code-switched language including misspellings and slang.

Extract information and return ONLY a valid JSON object. No markdown, no code blocks, no explanation.

Return exactly this shape:
{
  "service": "one of: ac_repair, plumbing, electrical, carpentry, painting, cleaning, tutoring, appliance_repair, shifting, pest_control, mechanics or null",
  "sector": "Islamabad sector like G-13 or F-10 in exact format, or null if not mentioned",
  "urgency": "high or medium or low",
  "preferredTime": "ASAP",
  "budgetSensitivity": "price_sensitive or normal or premium",
  "budgetAmount": null,
  "confidence": 0.0 to 1.0,
  "detectedLanguage": "english or roman_urdu or urdu or mixed",
  "correctedMessage": "cleaned version of the message",
  "jobComplexity": "basic or intermediate or complex",
  "multipleServices": false
}

Rules:
- High urgency signals: bilkul kaam nahi, urgent, jaldi, abhi, emergency, band ho gaya
- Price sensitive signals: sasta, budget nahi, mehnga mat, affordable, kam paise mein, sirf X rupees
- Extract sector ONLY if it is an Islamabad sector (G-13, F-10, H-8, I-9, E-7 etc)
- If user mentions a city name like Lahore, Karachi, Peshawar — set sector to null
- Always normalize sector format: G13 → G-13, g-13 → G-13, G 13 → G-13, i 8 → I-8
- If user mentions 2+ services set multipleServices to true
- Complexity: basic = cleaning/painting, intermediate = repair, complex = installation/overhaul
- Confidence 0.95 if service AND sector both found
- Confidence 0.60 if service found but no sector
- Confidence 0.40 if neither service nor sector found
- preferredTime is ALWAYS set to "ASAP"
- NEVER ask about time under any circumstances`;

const intentParser = async (message, context = {}) => {
  const startTime = Date.now();

  // Normalize sector format FIRST — before any processing
  const normalizedMessage = normalizeSectors(message);

  const language = detectLanguage(normalizedMessage);
  const localUrgency = detectUrgency(normalizedMessage);
  const localService = extractService(normalizedMessage);
  const userBudget = extractBudget(normalizedMessage);
  const otherCity = detectOtherCity(normalizedMessage);

  let parsed = {};
  let confidence = 0;
  let usedFallback = false;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: normalizedMessage },
      ],
      temperature: 0.1,
      max_tokens: 400,
    });

    const text = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    parsed = JSON.parse(text);
    confidence = parsed.confidence || 0;

    if (!parsed.preferredTime) parsed.preferredTime = "ASAP";

  } catch (err) {
    console.warn("⚠️ Groq API failed, using local parser:", err.message);
    usedFallback = true;
    parsed = {
      service: localService,
      sector: null,
      urgency: localUrgency,
      preferredTime: "ASAP",
      budgetSensitivity: userBudget ? "price_sensitive" : "normal",
      budgetAmount: userBudget,
      confidence: localService ? 0.6 : 0.4,
      detectedLanguage: language,
      correctedMessage: normalizedMessage,
      jobComplexity: "basic",
      multipleServices: false,
    };
    confidence = parsed.confidence;
  }

  // Merge locally extracted budget if Groq missed it
  if (!parsed.budgetAmount && userBudget) parsed.budgetAmount = userBudget;
  if (userBudget) parsed.budgetSensitivity = "price_sensitive";

  // ── Validation 1: Other city check ─────────────────────
  if (otherCity) {
    const response = getCityResponse(language, otherCity);
    return {
      parsed: { ...parsed, sector: null },
      trace: { step: "INTENT_UNDERSTANDING", reasoning: `User mentioned non-Islamabad city: ${otherCity}`, confidence: 0 },
      needsClarification: true,
      clarifyingQuestion: response,
      blocked: "city",
    };
  }

  // ── Validation 2: Invalid sector check ─────────────────
  if (parsed.sector) {
    const normalizedSector = parsed.sector.toUpperCase().trim();
    if (!VALID_ISLAMABAD_SECTORS.has(normalizedSector)) {
      const response = getInvalidSectorResponse(language, parsed.sector);
      return {
        parsed: { ...parsed, sector: null },
        trace: { step: "INTENT_UNDERSTANDING", reasoning: `Invalid sector: ${parsed.sector}`, confidence: 0 },
        needsClarification: true,
        clarifyingQuestion: response,
        blocked: "sector",
      };
    }
    parsed.sector = normalizedSector;
  }

  // ── Validation 3: Budget too low check ─────────────────
  const budgetToCheck = parsed.budgetAmount || userBudget;
  if (budgetToCheck && parsed.service) {
    const minRate = MIN_SERVICE_RATES[parsed.service];
    if (minRate && budgetToCheck < minRate) {
      const response = getBudgetResponse(language, budgetToCheck, parsed.service, minRate);
      return {
        parsed,
        trace: { step: "INTENT_UNDERSTANDING", reasoning: `Budget Rs.${budgetToCheck} below minimum Rs.${minRate} for ${parsed.service}`, confidence: 0.9 },
        needsClarification: true,
        clarifyingQuestion: response,
        blocked: "budget",
      };
    }
  }

  // ── Validation 4: Missing service or sector ─────────────
  const needsClarification = !parsed.service || !parsed.sector;
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
    input: { message: normalizedMessage, context },
    reasoning:
      `Detected language: ${parsed.detectedLanguage || language}. ` +
      `Service: ${parsed.service || "none"}. ` +
      `Sector: ${parsed.sector || "none"}. ` +
      `Budget: ${budgetToCheck ? `Rs.${budgetToCheck}` : "not specified"}. ` +
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