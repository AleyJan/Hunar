// ============================================================
// HUNAR Util — src/utils/languageUtils.js
// Urdu / Roman Urdu / English detection helpers
// ============================================================

// Common Roman Urdu service keywords mapped to service types
const SERVICE_KEYWORDS = {
  ac_repair:        ["ac", "a.c", "air condition", "cooling", "thanda", "tha", "ac theek", "ac kharab"],
  plumbing:         ["plumber", "pipe", "pani", "leakage", "nal", "naali", "tap", "flush"],
  electrical:       ["bijli", "light", "electric", "wiring", "short circuit", "voltage", "mcb", "socket"],
  carpentry:        ["carpenter", "darwaza", "darwazah", "door", "wood", "lakri", "almari"],
  painting:         ["paint", "rang", "wall", "deewar"],
  cleaning:         ["cleaning", "safai", "saaf", "deep clean"],
  tutoring:         ["tutor", "teacher", "ustaz", "padhai", "maths", "english", "science"],
  appliance_repair: ["washing machine", "fridge", "microwave", "oven", "machine", "kharab"],
  shifting:         ["shifting", "move", "samaan", "furniture", "ghar shift"],
  pest_control:     ["pest", "daant", "chuha", "mice", "cockroach", "spray"],
};

// Urgency signal words
const URGENCY_HIGH_WORDS = [
  "abhi", "jaldi", "urgent", "asap", "emergency", "bilkul kaam nahi",
  "kharab ho gaya", "band ho gaya", "foran", "turant",
];
const URGENCY_MEDIUM_WORDS = ["aaj", "today", "jitna jaldi", "soon", "evening", "dopahar"];
const URGENCY_LOW_WORDS    = ["kal", "tomorrow", "is hafte", "next week", "kisi din"];

/**
 * Detect language of user message.
 * @param {string} text
 * @returns {"urdu"|"roman_urdu"|"english"|"mixed"}
 */
const detectLanguage = (text) => {
  // Urdu Unicode range
  const urduPattern = /[\u0600-\u06FF]/;
  const hasUrdu     = urduPattern.test(text);
  const hasEnglish  = /[a-zA-Z]{3,}/.test(text);

  if (hasUrdu && hasEnglish) return "mixed";
  if (hasUrdu) return "urdu";

  // Roman Urdu heuristic: common words
  const romanUrduWords = ["kaam", "theek", "nahi", "hai", "mein", "kar", "raha", "bilkul", "abhi", "jaldi", "acha"];
  const lowerText = text.toLowerCase();
  const hasRomanUrdu = romanUrduWords.some((word) => lowerText.includes(word));

  if (hasRomanUrdu) return "roman_urdu";
  return "english";
};

/**
 * Detect urgency from user message text.
 * @param {string} text
 * @returns {"high"|"medium"|"low"}
 */
const detectUrgency = (text) => {
  const lower = text.toLowerCase();
  if (URGENCY_HIGH_WORDS.some((w) => lower.includes(w)))   return "high";
  if (URGENCY_MEDIUM_WORDS.some((w) => lower.includes(w))) return "medium";
  if (URGENCY_LOW_WORDS.some((w) => lower.includes(w)))    return "low";
  return "medium"; // Default
};

/**
 * Attempt to extract service type from message.
 * @param {string} text
 * @returns {string|null} service type key or null
 */
const extractService = (text) => {
  const lower = text.toLowerCase();
  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return service;
  }
  return null;
};

/**
 * Generate a clarifying question in the detected language.
 * @param {string} language
 * @param {string} missingField - "service"|"location"|"time"
 * @returns {string}
 */
const getClarifyingQuestion = (language, missingField) => {
  const questions = {
    service: {
      english:    "What type of service do you need? (e.g., AC repair, plumbing, electrical)",
      roman_urdu: "Aap ko konsi service chahiye? (maslan: AC, plumber, bijli)",
      urdu:       "آپ کو کونسی سروس چاہیے؟ (مثلاً: AC، پلمبر، بجلی)",
      mixed:      "Aap ko konsi service chahiye? (e.g., AC repair, plumbing)",
    },
    location: {
      english:    "What is your sector or area in Islamabad?",
      roman_urdu: "Aap ka sector ya area kya hai? (maslan: G-13, F-10)",
      urdu:       "آپ کا سیکٹر یا علاقہ کیا ہے؟",
      mixed:      "Aap ka sector kya hai? (e.g., G-13, F-10)",
    },
    time: {
      english:    "When do you need the service? Today, tomorrow, or a specific time?",
      roman_urdu: "Service kab chahiye? Aaj, kal, ya koi specific time?",
      urdu:       "سروس کب چاہیے؟ آج، کل، یا کوئی مخصوص وقت؟",
      mixed:      "Service kab chahiye? Today, tomorrow, ya specific time?",
    },
  };

  return questions[missingField]?.[language] || questions[missingField]?.english;
};

module.exports = {
  detectLanguage,
  detectUrgency,
  extractService,
  getClarifyingQuestion,
  SERVICE_KEYWORDS,
};
