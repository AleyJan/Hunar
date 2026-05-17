# HUNAR Backend — Full Architecture Plan
> AI-Powered Service Booking Platform (Pakistan)
> Stack: Node.js + Express + MongoDB Atlas + Claude AI + Google Maps

---

## 1. DIRECTORY STRUCTURE

```
backend/
├── src/
│   ├── agent/                        # Core agentic AI orchestrator
│   │   ├── orchestrator.js           # Main agent controller (all 7 steps)
│   │   ├── steps/
│   │   │   ├── intentParser.js       # Step 1: NLP + language detection
│   │   │   ├── providerMatcher.js    # Step 2: Multi-factor scoring
│   │   │   ├── scheduler.js          # Step 3: Scheduling intelligence
│   │   │   ├── pricingEngine.js      # Step 4: Dynamic pricing formula
│   │   │   ├── bookingSimulator.js   # Step 5: Booking + notifications
│   │   │   ├── qualityLoop.js        # Step 6: Status updates + rating
│   │   │   └── disputeResolver.js    # Step 7: Dispute + escalation
│   │   └── reasoningLogger.js        # Saves JSON trace logs per request
│   │
│   ├── tools/                        # Agent tool integrations
│   │   ├── getProviders.js           # MongoDB query: filter by service+sector
│   │   ├── getDistance.js            # Google Maps Distance Matrix API
│   │   ├── getBookings.js            # Fetch provider calendar slots
│   │   ├── saveBooking.js            # Write confirmed booking to MongoDB
│   │   ├── updateProviderRating.js   # Reputation score formula
│   │   ├── saveDispute.js            # Log dispute to MongoDB
│   │   └── sendNotification.js       # SMS/WhatsApp simulation
│   │
│   ├── models/                       # Mongoose schemas
│   │   ├── User.js
│   │   ├── Provider.js
│   │   ├── Booking.js
│   │   ├── Dispute.js
│   │   ├── ReasoningLog.js
│   │   └── Notification.js
│   │
│   ├── routes/                       # Express route handlers
│   │   ├── bookingRoutes.js          # POST /api/booking/request
│   │   ├── providerRoutes.js         # GET  /api/providers
│   │   ├── userRoutes.js             # POST /api/users/register|login
│   │   ├── disputeRoutes.js          # POST /api/disputes
│   │   ├── serviceRoutes.js          # GET  /api/services
│   │   └── adminRoutes.js            # GET  /api/admin/logs|stats
│   │
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification
│   │   ├── rateLimiter.js            # Express-rate-limit
│   │   ├── errorHandler.js           # Global error handler
│   │   ├── requestLogger.js          # Morgan + request ID injection
│   │   └── validateRequest.js        # Joi schema validation
│   │
│   ├── config/
│   │   ├── db.js                     # MongoDB Atlas connection
│   │   ├── claude.js                 # Anthropic SDK init
│   │   ├── maps.js                   # Google Maps client init
│   │   └── constants.js             # Pricing constants, sector table, etc.
│   │
│   ├── utils/
│   │   ├── bookingIdGenerator.js     # BK-YYYY-XXXXX format
│   │   ├── sectorProximityTable.js   # Fallback distance map (Islamabad sectors)
│   │   ├── languageUtils.js          # Urdu/Roman Urdu helpers
│   │   └── timeSlotUtils.js          # Travel buffer + slot conflict helpers
│   │
│   └── app.js                        # Express app setup
│
├── server.js                         # Entry point
├── .env.example                      # Environment variable template
├── .gitignore
└── package.json
```

---

## 2. MONGOOSE DATA MODELS

### User
```
_id, name, phone, email (optional), city, sector,
bookingCount, loyaltyTier, createdAt
```

### Provider
```
_id, name, phone, services[], sector, city,
rating, reviewCount, onTimeRate, cancellationRate,
hourlyRate, experienceYears, certifications[],
isAvailable, calendar[], workloadToday (count),
createdAt, lastActive
```

### Booking
```
_id, bookingId (BK-YYYY-XXXXX), userId, providerId,
serviceType, sector, scheduledAt, travelBufferMinutes,
status (pending|confirmed|en_route|completed|cancelled|disputed),
complexity (basic|intermediate|complex),
urgency (low|medium|high),
pricing { baseRate, distanceFee, urgencyPremium,
          loyaltyDiscount, surgeMultiplier,
          complexityMultiplier, totalAmount },
reasoningTraceId, confirmedAt, completedAt,
photos[], rating, review, createdAt
```

### Dispute
```
_id, bookingId, userId, providerId,
issueType (overcharge|no_show|poor_quality|other),
description, resolution (refund|partial_refund|
             compensation|warning|blacklist|escalate_to_human),
resolutionReason, status (open|resolved|escalated),
reasoningTraceId, createdAt, resolvedAt
```

### ReasoningLog
```
_id, requestId, bookingId (optional),
steps[] { step, input, reasoning, decision,
          confidence, fallback_considered, output },
totalSteps, createdAt
```

---

## 3. API ROUTES

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | /api/booking/request | orchestrator | Main agent entry — runs all 7 steps |
| POST | /api/booking/confirm | bookingSimulator | User confirms → Step 5 executes |
| GET | /api/booking/:id | - | Fetch booking + trace by ID |
| PATCH | /api/booking/:id/status | qualityLoop | En-route / arrived / complete |
| POST | /api/booking/:id/rate | qualityLoop | Submit rating → update reputation |
| POST | /api/disputes | disputeResolver | Raise a dispute → Step 7 |
| GET | /api/providers | getProviders | Browse providers by service/sector |
| POST | /api/users/register | userRoutes | Register new user |
| POST | /api/users/login | userRoutes | JWT login |
| GET | /api/admin/logs | adminRoutes | View reasoning traces (admin) |
| GET | /api/admin/stats | adminRoutes | Booking stats, surge alerts |

---

## 4. AGENT ORCHESTRATOR FLOW

```
POST /api/booking/request
        │
        ▼
  [orchestrator.js]
        │
        ├──▶ Step 1: intentParser.js
        │         └─ Claude API: detect language, extract intent
        │         └─ confidence check → clarify if < 0.7
        │
        ├──▶ Step 2: providerMatcher.js
        │         └─ getProviders(service, sector)
        │         └─ getDistance(userSector, providerSector) × N providers
        │         └─ Score all 7 factors → rank top 3
        │
        ├──▶ Step 3: scheduler.js
        │         └─ getBookings(providerId, date)
        │         └─ Check conflicts → add travel buffer
        │         └─ Find 3 alternate slots if blocked
        │
        ├──▶ Step 4: pricingEngine.js
        │         └─ Apply full formula → return itemized price
        │
        └──▶ reasoningLogger.js
                  └─ Save full JSON trace to ReasoningLog collection
                  └─ Return trace + top 3 providers + price to app
```

---

## 5. DYNAMIC PRICING FORMULA (Constants)

```js
// src/config/constants.js
DISTANCE_RATE_PER_KM  = 50        // Rs
URGENCY_PREMIUM       = { high: 200, medium: 100, low: 0 }
COMPLEXITY_MULTIPLIER = { basic: 1.0, intermediate: 1.2, complex: 1.5 }
LOYALTY_DISCOUNT      = 100        // Rs (if bookingCount >= 3)
SURGE_THRESHOLD       = 5          // bookings in same sector in last 2 hours
SURGE_MULTIPLIER      = 1.2
BOOKING_HOLD_MINUTES  = 10         // Payment failure hold
REMINDER_BEFORE_MIN   = 30         // Pre-booking reminder
```

---

## 6. PROVIDER SCORING WEIGHTS

```js
SCORING_WEIGHTS = {
  distanceTravelTime:      0.25,
  ratingScore:             0.20,
  onTimeReliability:       0.15,
  skillSpecialization:     0.15,
  priceFit:                0.10,
  reviewRecency:           0.10,
  cancellationRisk:        0.05,
}
// Max possible score: 100
```

---

## 7. SECTOR PROXIMITY FALLBACK TABLE (Islamabad)

Used when Google Maps API fails:

```js
// Estimated distances in KM between Islamabad sectors
SECTOR_DISTANCES = {
  "G-13": { "G-11": 4, "G-10": 5, "G-9": 7, "I-8": 6, "F-10": 8 },
  "G-11": { "G-13": 4, "G-10": 2, "G-9": 4, "I-8": 5, "F-10": 6 },
  // ... full matrix
}
```

---

## 8. ENVIRONMENT VARIABLES (.env.example)

```
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/hunar

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# Twilio (SMS simulation)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1...

# Admin
ADMIN_API_KEY=hunar_admin_secret
```

---

## 9. NPM DEPENDENCIES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "@googlemaps/google-maps-services-js": "^3.3.42",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "uuid": "^9.0.1",
    "date-fns": "^3.0.6",
    "twilio": "^4.19.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 10. REASONING TRACE — SAMPLE OUTPUT

```json
{
  "requestId": "req_abc123",
  "steps": [
    {
      "step": "INTENT_UNDERSTANDING",
      "input": { "message": "AC bilkul kaam nahi kar raha G-13 mein" },
      "reasoning": "Detected Roman Urdu. 'bilkul kaam nahi' = completely non-functional. Service = AC Repair. Location = G-13. Urgency = HIGH. No time specified = ASAP.",
      "decision": "Extracted intent with 0.92 confidence. Proceeding to provider matching.",
      "confidence": 0.92,
      "fallback_considered": "Confidence above 0.7, no clarification needed.",
      "output": {
        "service": "ac_repair",
        "sector": "G-13",
        "urgency": "high",
        "preferredTime": "ASAP",
        "language": "roman_urdu"
      }
    },
    {
      "step": "PROVIDER_MATCHING",
      "input": { "service": "ac_repair", "sector": "G-13" },
      "reasoning": "Found 5 providers in G-13 area. Provider A (Hassan AC) scores 91: rating 4.8, 3km away, 97% on-time, AC specialist. Provider B scores 78: closer at 1.5km but 14% cancellation rate is risky for HIGH urgency. Provider C scores 74: good rating but generalist, not AC specialist.",
      "decision": "Top 3: Hassan AC (91), CoolFix Pro (78), AirTech (74)",
      "confidence": 0.94,
      "fallback_considered": "All providers available, no fallback needed.",
      "output": { "top3": ["hassan_ac", "coolfix_pro", "airtech"] }
    },
    {
      "step": "DYNAMIC_PRICING",
      "input": { "provider": "hassan_ac", "distanceKm": 3 },
      "reasoning": "baseRate=800, distanceFee=3*50=150, urgencyPremium=200(high), loyaltyDiscount=0(first booking), surgeMult=1.0(only 2 bookings G-13 last 2h), complexityMult=1.2(intermediate). total=(800+150+200-0)*1.2*1.0=1380",
      "decision": "Total: Rs 1,380",
      "confidence": 1.0,
      "fallback_considered": "N/A",
      "output": { "totalAmount": 1380, "breakdown": { "baseRate": 800, "distanceFee": 150, "urgencyPremium": 200, "loyaltyDiscount": 0, "complexityMultiplier": 1.2, "surgeMultiplier": 1.0 } }
    }
  ]
}
```

---

## 11. FALLBACK HANDLING TABLE

| Failure | Detection | Action |
|---------|-----------|--------|
| No providers found | Empty query result | Suggest 3 alternate time slots + expand to adjacent sectors |
| Google Maps API down | HTTP error / timeout | Use `sectorProximityTable.js` estimated distances |
| Low confidence parse (< 0.7) | Score check | Return clarifying question in detected language, never guess |
| Payment failure | Payment gateway error | Hold booking 10 min → retry → release slot if failed |
| Provider cancels | Status webhook | Auto re-run Step 2 matching → notify user immediately |

---

## 12. DEPLOYMENT (Railway.app)

```
Build Command:    npm install
Start Command:    node server.js
Health Check:     GET /api/health
Environment:      Set all .env vars in Railway dashboard
MongoDB:          Atlas free tier → upgrade as needed
```

---

## 13. IMPLEMENTATION PHASES

### Phase 1 — Foundation (Day 1)
- [ ] Initialize project, install dependencies
- [ ] MongoDB connection + all 6 Mongoose models
- [ ] JWT auth middleware (register/login)
- [ ] Basic Express app + error handler

### Phase 2 — Tools Layer (Day 2)
- [ ] `getProviders.js` — MongoDB query with filters
- [ ] `getDistance.js` — Google Maps + fallback table
- [ ] `getBookings.js` — Provider calendar query
- [ ] `saveBooking.js` — Write with conflict check
- [ ] `sendNotification.js` — Twilio/simulation
- [ ] `updateProviderRating.js` — Reputation formula
- [ ] `saveDispute.js` — Dispute logging

### Phase 3 — Agent Steps (Day 3-4)
- [ ] `intentParser.js` — Claude API integration
- [ ] `providerMatcher.js` — 7-factor scoring engine
- [ ] `scheduler.js` — Slot + travel buffer logic
- [ ] `pricingEngine.js` — Full formula implementation
- [ ] `bookingSimulator.js` — Booking ID + save + notify
- [ ] `qualityLoop.js` — Status updates + rating
- [ ] `disputeResolver.js` — Mediation logic

### Phase 4 — Orchestrator + API (Day 5)
- [ ] `orchestrator.js` — Chain all 7 steps
- [ ] `reasoningLogger.js` — JSON trace persistence
- [ ] All Express routes wired
- [ ] End-to-end test with sample bookings

### Phase 5 — Polish + Deploy (Day 6)
- [ ] Rate limiting + Helmet security
- [ ] Input validation (Joi)
- [ ] Admin dashboard routes
- [ ] Deploy to Railway
- [ ] Seed database with test providers

---

*Plan Version: 1.0 | Created: 2026-05-16 | Engineer: Ali*
