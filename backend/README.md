# HUNAR — AI-Powered Informal Service Economy Platform

> Built for the Google Antigravity Hackathon  
> Developed By: Ali Jan 
> Tech Stack: Node.js + Express + MongoDB Atlas + Groq LLM   
> Built using: Google Antigravity IDE

---

## What is HUNAR?

HUNAR connects users in Pakistan with skilled local service providers — plumbers, electricians, AC technicians, tutors, beauticians, mechanics, and other home service professionals.

The problem it solves: right now people find these workers through WhatsApp, phone calls, and word of mouth. This causes poor matching, unpredictable pricing, no accountability, and no follow-up. HUNAR automates the entire service lifecycle using AI.

A user types in any language — Urdu, Roman Urdu, English, or mixed — like:

> "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai"

The system understands this, finds the best provider, generates a transparent price, books the slot, tracks the provider, collects feedback, and handles disputes — all automatically through a 7-step agentic orchestrator.

---

## Architecture Overview

```
React Native Mobile App (APK)
         |
         | HTTP requests
         v
Express.js REST API (server.js)
         |
         v
Agent Orchestrator (orchestrator.js)
    |
    |-- Step 1: intentParser.js       → Groq LLM (language understanding)
    |-- Step 2: providerMatcher.js    → Math scoring + Groq LLM (re-ranking)
    |-- Step 3: scheduler.js          → Groq LLM (slot conflict reasoning)
    |-- Step 4: pricingEngine.js      → Deterministic formula (with trace)
    |-- Step 5: bookingSimulator.js   → MongoDB write + SMS simulation
    |-- Step 6: qualityLoop.js        → Reputation formula + feedback
    |-- Step 7: disputeResolver.js    → Groq LLM (mediation reasoning)
         |
         v
reasoningLogger.js → Saves full JSON trace to MongoDB ReasoningLog collection
```

---

## Where Math Works vs Where Groq AI Works

This is the most important thing to understand about HUNAR's design.

### Math (Deterministic Formula) — Steps 4, partial Step 2

**Dynamic Pricing (Step 4)** is pure math. Every component is calculated exactly:

```
baseRate       = provider's hourly rate (from database)
distanceFee    = distanceKm × Rs 50
urgencyPremium = high: Rs 200 | medium: Rs 100 | low: Rs 0
complexityMult = complex: 1.5x | intermediate: 1.2x | basic: 1.0x
loyaltyDiscount= Rs 100 off if user has 3+ previous bookings
surgeMultiplier= 1.2x if more than 5 bookings in same sector in last 2 hours
total          = (baseRate + distanceFee + urgencyPremium - loyaltyDiscount)
                 × complexityMult × surgeMultiplier
```

Why math here? Pricing must be transparent, fair, and reproducible. The user sees the exact breakdown. Groq could vary — a formula never does.

**Provider pre-scoring (Step 2, first half)** is also math:

```
Score = (distance × 25%) + (rating × 20%) + (onTime × 15%)
      + (skillMatch × 15%) + (priceFit × 10%)
      + (reviewRecency × 10%) + (cancelRisk × 5%)
```

This gives every provider a raw number out of 100.

---

### Groq LLM (AI Reasoning) — Steps 1, 2 re-rank, 3, 7

**Step 1 — Intent Understanding:** Groq reads the user's raw message in any language and extracts structured data. It handles misspellings, slang, Roman Urdu, code-switching. Math cannot do this — only a language model can understand "AC bilkul kaam nahi" means high-urgency AC repair.

**Step 2 — Provider Re-ranking:** After math scores the providers, Groq receives the top 5 with their scores and reasons about which is truly best for THIS specific job. For example:

- Math might score Provider B higher because they are closer
- Groq re-ranks Provider A to #1 because for a HIGH urgency COMPLEX job, reliability (97% on-time, 2% cancel rate) matters more than proximity

Groq explains every decision in plain English. This is what judges see in the reasoning trace.

**Step 3 — Scheduling:** Groq receives the provider's existing bookings for the day and reasons about whether the requested slot is available, accounting for travel-time buffers between jobs. It suggests 3 alternative slots if the requested one is taken. Math cannot reason about "does this slot work given the provider's previous job ends at 8:30 in G-11 and this new job is in G-13?"

**Step 7 — Dispute Resolution:** Groq acts as a fair mediator. It reads the complaint, the provider's history, the agreed price, and the cancellation rate pattern, then decides on a resolution — refund, partial refund, compensation, warning, blacklist, or human escalation — with a step-by-step explanation of its reasoning.

---

## Provider Dataset Schema

Each provider in MongoDB has these fields:

| Field | Type | Description |
|---|---|---|
| name | String | Provider's full name |
| phone | String | Pakistani format (03XXXXXXXXX) |
| services | String[] | Skills e.g. ["AC Repair", "Electrical"] |
| sector | String | Home sector e.g. "G-11" |
| lat / lng | Number | GPS coordinates |
| rating | Number | Average rating 1.0–5.0 |
| reviewCount | Number | Total reviews submitted |
| onTimeRate | Number | % of jobs completed on time |
| cancellationRate | Number | Historical cancel rate 0.0–1.0 |
| hourlyRate | Number | Base rate in PKR |
| experienceYears | Number | Years of experience |
| certifications | String[] | e.g. ["AC Specialist", "Master Plumber"] |
| jobComplexity | String | basic / intermediate / complex |
| isAvailable | Boolean | Currently accepting bookings |
| workloadToday | Number | Bookings accepted today |
| slots | String[] | Available time slots |
| verified | Boolean | Verified by HUNAR team |
| bio | String | Self description in Roman Urdu |

---

## Provider Matching Factors (7)

| Factor | Weight | How It's Calculated |
|---|---|---|
| Distance / Travel Time | 25% | Google Maps Distance Matrix API — real travel minutes |
| Rating Score | 20% | (rating / 5) × 100 |
| On-Time Reliability | 15% | Provider's historical on-time percentage |
| Skill Specialization | 15% | 100 if exact skill match, 60 if partial |
| Price Fit | 10% | Higher score for lower rates when user is budget-sensitive |
| Review Recency | 10% | More recent reviews weighted higher |
| Cancellation Risk | 5% | (1 - cancellationRate) × 100 |

After math scoring, Groq LLM re-ranks the top 5 providers based on job context — urgency, complexity, and workload — and provides a written reason for each ranking decision.

---

## Antigravity Workflow

The entire backend was built using Google Antigravity IDE. Antigravity's AI agents generated each component based on structured prompts describing the exact requirements, API contracts, and expected behavior.

The orchestrator (`src/agent/orchestrator.js`) controls the agentic workflow:

1. Receives raw user message from the mobile app
2. Calls intentParser → gets structured JSON from Groq
3. If confidence < 0.7 → returns clarifying question, stops
4. Calls providerMatcher → math scores + Groq re-ranks
5. If no providers → returns fallback with alternate time suggestions
6. Calls scheduler → Groq checks slot availability
7. Calls pricingEngine → formula calculates price with full breakdown
8. Saves full reasoning trace to MongoDB via reasoningLogger
9. Returns top 3 providers + pricing + scheduling + trace to app

Every step produces a `reasoningTrace` object:

```json
{
  "step": "PROVIDER_MATCHING",
  "input": { "service": "ac_repair", "sector": "G-13", "urgency": "high" },
  "reasoning": "For this urgent complex AC repair job, I prioritized providers with high on-time rates and low cancellation rates...",
  "decision": "Top provider: Ahmad Karimi — 97% on-time, 2% cancel rate, AC Specialist",
  "confidence": 0.95,
  "fallback_considered": "Asif Nawaz ranked #2 because...",
  "groqUsed": true,
  "durationMs": 2147
}
```

These traces are saved to the `ReasoningLog` collection in MongoDB and returned in every API response — this is the proof of agentic behavior required by the hackathon.

---

## APIs and Tools Used

### Real APIs (live external calls)

| API | Provider | Used For |
|---|---|---|
| Groq LLM (llama-3.1-8b-instant) | Groq Cloud | NLP parsing, provider re-ranking, scheduling, dispute resolution |
| Google Maps Distance Matrix | Google Cloud | Real travel time and distance between user and provider |
| MongoDB Atlas | MongoDB | Storing users, providers, bookings, disputes, reasoning logs |

### Self-Hosted Simulated APIs (deployed on Railway)

| Endpoint | What it simulates |
|---|---|
| GET /api/providers | Provider registry — returns providers from MongoDB |
| POST /api/notify | SMS/WhatsApp notification — logs to console, saves to DB |
| Booking status updates | Simulates en-route → arrived → completed progression |

Note: The provider data lives in MongoDB Atlas (not in a local file). It was seeded once via `seed.js` and is now served as a real HTTP API. This satisfies the requirement that mock data must not be a local file — it is a hosted API endpoint.

---

## Fallback Handling

| Failure Scenario | Detection | HUNAR's Response |
|---|---|---|
| No provider found | Empty query result | Suggest 3 alternate time slots, expand to adjacent sectors |
| Google Maps API failure | HTTP 403 / timeout | Use sector proximity table (pre-calculated Islamabad distances) |
| Low confidence parse (< 0.7) | Confidence score check | Return clarifying question in detected language, never guess |
| Groq API failure | SDK exception | Fall back to rule-based logic for matching / dispute |
| Provider cancels | Status change webhook | Auto re-run Step 2 matching, return new top 3 to user |
| Two users book same slot | 409 Conflict from /book | Return next 3 available slots for that provider |

---

## Cost and Latency Analysis

| Component | Latency | Cost |
|---|---|---|
| Groq NLP parsing | ~500ms | Free tier |
| Groq provider re-ranking | ~2000ms | Free tier |
| Groq dispute resolution | ~1000ms | Free tier |
| Google Maps Distance Matrix | ~300ms per call | $5 per 1000 calls |
| MongoDB query | ~50–100ms | Free tier (512MB) |
| Total request latency | ~3–5 seconds | ~$0.005 per booking |

---

## Stress Test Scenarios and Responses

| Scenario | What HUNAR does |
|---|---|
| No provider available | Returns empty matches + 3 alternate time suggestions + Groq explains why |
| Provider cancels after confirmation | PATCH /book/:id/provider-cancel → auto re-runs matching → returns new top 3 |
| Misspelled or mixed language input | Groq corrects it, confidence score shown, clarifying question if needed |
| Two users request same provider at same time | First POST /book wins, second gets 409 with next available slots |
| Customer disputes price after service | POST /dispute → Groq mediates → resolution with full reasoning trace |
| High cancellation rate provider | Groq penalizes in re-ranking for urgent jobs, flags as "medium risk" |

---

## Assumptions

- Provider profiles are pre-seeded to simulate a real provider registry. In production, providers would self-register through an onboarding flow.
- SMS and WhatsApp notifications are simulated via console logs and saved to the Notification collection. Twilio integration would replace this in production.
- Payment processing is not implemented. The pricing engine calculates the quote; actual payment would use a Pakistani payment gateway (JazzCash, EasyPaisa) in production.
- The surge multiplier is calculated based on booking count in the last 2 hours per sector in the MongoDB database.
- Google Maps API quota: if exceeded, the system automatically falls back to a pre-calculated Islamabad sector distance table with no degradation in matching quality.

---

## Limitations

- Groq's llama-3.1-8b-instant model occasionally returns malformed JSON — the system handles this with a regex-based JSON extractor and falls back to rule-based logic if parsing fails.
- Real-time tracking uses time-based status progression (0–3 min = confirmed, 3–7 min = en-route, etc.) rather than actual GPS. Production would use provider's phone GPS.
- Provider availability slots are static in the database. A production system would integrate a real-time calendar.
- No OTP verification for phone number during signup. Production would use a Pakistani SMS gateway for OTP.

---

## API Endpoint Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | None | Create user account |
| POST | /api/auth/login | None | Login, returns JWT token |
| GET | /api/auth/me | JWT | Get current user profile |
| POST | /api/parse-request | JWT | NLP parse user message via Groq |
| GET | /api/providers | JWT | Get all providers (filterable) |
| POST | /api/match | JWT | Match + rank providers via Groq |
| POST | /api/price | JWT | Calculate dynamic price |
| POST | /api/book | JWT | Confirm booking |
| GET | /api/book/:id | JWT | Get booking details |
| PATCH | /api/book/:id/cancel | JWT | User cancels booking |
| PATCH | /api/book/:id/provider-cancel | JWT | Provider cancels → auto re-match |
| GET | /api/tracking/:bookingId | JWT | Get live tracking status |
| POST | /api/feedback/:bookingId | JWT | Submit rating and review |
| POST | /api/dispute | JWT | Raise dispute → Groq mediates |
| GET | /api/dispute/my-disputes | JWT | Fetch active disputes (client/provider) |
| PATCH | /api/dispute/:id/provider-respond | JWT | Provider responds (Accept/Reject AI resolution) |
| PATCH | /api/dispute/:id/admin-resolve | JWT | Mock resolve human-referred dispute |
| GET | /api/health | None | Health check |

---

## Environment Variables Required

```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_...
GOOGLE_MAPS_API_KEY=AIza...
ADMIN_API_KEY=your_admin_key
```

---

## Baseline Comparison

| Feature | Traditional Approach | HUNAR |
|---|---|---|
| Service discovery | WhatsApp groups, phone calls | AI-powered matching in seconds |
| Provider selection | Based on who you know | 7-factor algorithm + Groq reasoning |
| Pricing | Negotiated verbally | Transparent formula, full breakdown |
| Booking confirmation | Verbal agreement | MongoDB record + simulated SMS |
| Dispute resolution | No system | Groq AI mediates fairly |
| Language support | Depends on person | Urdu, Roman Urdu, English, mixed |
| Accountability | None | Rating system, reputation score |

---

## Privacy Note

- User phone numbers are stored in MongoDB Atlas with restricted access.
- Passwords are hashed using bcryptjs with 12 salt rounds — never stored in plain text.
- JWT tokens expire after 7 days.
- Provider phone numbers are visible to users only after booking is confirmed.
- Reasoning logs contain no personally identifiable information beyond userId (MongoDB ObjectId).
- In production, all data would be encrypted at rest using MongoDB Atlas encryption.

---

*HUNAR v1.0 | Built with Google Antigravity | Hackathon Submission 2026*
