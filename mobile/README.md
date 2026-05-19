# HUNAR Mobile App — React Native Frontend

> AI-Powered Informal Service Economy Platform  
> Built with Expo SDK 54 + React Native  
> Connects to HUNAR Agentic Backend (Node.js + Groq AI + MongoDB)

---

## What is this?

HUNAR mobile app is the client-facing interface for the HUNAR platform. Users type their service request in **any language** — Roman Urdu, Urdu, English, or mixed — and the app communicates with a 7-step AI orchestrator backend to find, match, book, track, and resolve disputes with local service providers in Islamabad.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 54) |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| State Management | React Context API (AuthContext) |
| HTTP Client | Axios with JWT interceptor |
| Storage | AsyncStorage (session persistence) |
| Icons | @expo/vector-icons (Ionicons) |
| UI Language | Roman Urdu + English |
| Testing Device | iPhone via Expo Go |

---

## Folder Structure

```
mobile/
├── App.js                          # Entry point — wraps with AuthProvider
├── src/
│   ├── constants/
│   │   └── theme.js                # Design system — colors, shadows, spacing
│   ├── context/
│   │   └── AuthContext.js          # JWT auth — login, register, logout, session persistence
│   ├── navigation/
│   │   └── AppNavigator.js         # Stack + Tab navigation — auth vs app flow
│   ├── services/
│   │   └── api.js                  # Axios client — auto injects JWT, all API calls
│   ├── components/
│   │   ├── ReasoningTraceBox.js    # Expandable AI reasoning trace display (dark theme)
│   │   ├── DynamicInvoice.js       # Itemized price breakdown with fairness note
│   │   └── AgentChatBubble.js      # Chat bubbles — user (green) / AI (white) / clarification (amber)
│   └── screens/
│       ├── common/
│       │   ├── WelcomeScreen.js    # Landing screen — dark green, HUNAR branding
│       │   ├── LoginScreen.js      # Phone + password login
│       │   └── RegisterScreen.js  # Name/phone/password + sector picker
│       └── client/
│           ├── AIRequestHub.js         # Main chat screen — AI intent parsing
│           ├── MatchingScreen.js       # Provider cards with AI scores and reasoning
│           ├── BookingScreen.js        # Provider details, slot picker, price breakdown
│           ├── BookingConfirmedScreen.js # Success screen with booking details
│           ├── TrackingDetailScreen.js  # Live tracking with simulated map + progress steps
│           ├── FeedbackScreen.js        # Star rating + dispute submission
│           ├── TrackingScreen.js        # My Bookings tab placeholder
│           └── DisputeScreen.js         # Disputes tab placeholder
```

---

## Design System

HUNAR uses an **Emerald + Gold** color scheme inspired by Islamabad's Margalla Hills.

```javascript
colors: {
  primary:       '#0B6623',  // Margalla Green — buttons, headers, active states
  primaryLight:  '#E8F5E9',  // Light green — backgrounds, chips
  primaryDark:   '#053E14',  // Dark green — header bars, welcome screen
  accent:        '#D4AF37',  // Margalla Gold — highlights, CTA buttons
  textDark:      '#1A252C',  // Main text
  textMuted:     '#64748B',  // Secondary text
  urgencyHigh:   '#EF4444',  // Red — high urgency jobs
  urgencyMedium: '#F59E0B',  // Amber — medium urgency, clarification badges
  success:       '#10B981',  // Green — completed steps, checkmarks
}
```

---

## Screen Flow

```
WelcomeScreen
    ├── RegisterScreen → (auto login) → AIRequestHub
    └── LoginScreen    → (auto login) → AIRequestHub

AIRequestHub (Chat)
    └── MatchingScreen (Provider List)
            └── BookingScreen (Slot Picker + Price)
                    └── BookingConfirmedScreen (Success)
                            └── TrackingDetailScreen (Live Status)
                                    └── FeedbackScreen (Rating + Dispute)

Bottom Tabs:
    ├── AI Assistant → AIRequestHub
    ├── My Bookings  → TrackingScreen (placeholder)
    └── Disputes     → DisputeScreen (placeholder)
```

---

## Key Components

### ReasoningTraceBox
The most important component for the hackathon. Shows the Groq AI's step-by-step reasoning to judges:
- Expandable dark card (collapsed by default)
- Shows: Confidence %, Step name, Full reasoning text, Decision outcome, Fallback considered
- Appears on MatchingScreen after providers are loaded

### AgentChatBubble
Handles all chat message types:
- **Green bubble** = user message
- **White bubble** = AI response
- **Amber bubble** = needs clarification (confidence < threshold)

### DynamicInvoice
Shows transparent pricing breakdown:
- Base rate, travel fee, urgency premium, loyalty discount
- Complexity multiplier, surge multiplier
- Total with green border
- Info box: "HUNAR enforces standard prices"

---

## AI Chat Flow

The chat screen sends user messages to the backend intent parser:

```
User types: "AC bilkul kaam nahi kar raha G-13 mein"
    ↓
POST /api/parse-request → Groq LLM
    ↓
Returns: { service: "ac_repair", sector: "G-13", urgency: "high", confidence: 0.95 }
    ↓
App shows summary + navigates to MatchingScreen
    ↓
POST /api/match → 7-factor scoring + Groq re-ranking
    ↓
Shows 3 providers with AI scores and reasoning
```

**Context Memory:** Each clarifying answer is appended to the original message and resent to the AI, so the conversation history is maintained until a high-confidence parse is achieved.

**Quick Chips:** Pre-built prompts with full context (service + sector) that skip clarification entirely.

---

## Multi-Service Detection

When user requests 2+ services (e.g. "electrician aur plumber dono chahiye"):
- Backend returns `multipleServices: true` with comma-separated services
- App extracts first service for matching
- Shows banner: "Multiple services detected — showing providers for [service1 + service2]"

---

## Navigation Architecture

```javascript
// Logged out
AuthStack: Welcome → Login → Register

// Logged in
AppStack:
  ClientTabs (bottom tabs):
    - AI Assistant (AIRequestHub)
    - My Bookings  (TrackingScreen)
    - Disputes     (DisputeScreen)
  + Matching (pushed from chat)
  + Booking (pushed from matching)
  + BookingConfirmed (pushed from booking)
  + Tracking (pushed from confirmed)
  + Feedback (pushed from tracking)
```

---

## API Integration

All API calls are in `src/services/api.js`. The Axios interceptor automatically attaches the JWT token to every request:

```javascript
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

| Method | Endpoint | Used In |
|---|---|---|
| POST | /auth/login | LoginScreen |
| POST | /auth/register | RegisterScreen |
| POST | /parse-request | AIRequestHub |
| POST | /match | MatchingScreen |
| POST | /price | BookingScreen |
| POST | /book | BookingScreen |
| GET | /tracking/:id | TrackingDetailScreen |
| POST | /feedback/:id | FeedbackScreen |
| POST | /dispute | FeedbackScreen |

---

## Session Management

User session persists across app restarts using AsyncStorage:

```javascript
// On login/register
await AsyncStorage.setItem('user_token', token);
await AsyncStorage.setItem('user_data', JSON.stringify(user));

// On app start — AuthContext loads saved session
const savedToken = await AsyncStorage.getItem('user_token');
```

---

## Running the App

**Prerequisites:**
- Node.js 18+
- Expo Go app on your phone (iOS or Android)
- HUNAR backend running on your local network

**Setup:**

```bash
cd mobile
npm install --legacy-peer-deps
```

**Start:**

```bash
npx expo start
```

Scan the QR code with your phone camera (iOS) or Expo Go app (Android).

**Important:** Phone and laptop must be on the same WiFi network.

---

## Environment Configuration

Update the API base URL in `src/services/api.js`:

```javascript
// Local development
const API_URL = 'http://192.168.1.6:5000/api';  // your laptop IP

// Production (after Railway deployment)
const API_URL = 'https://your-app.railway.app/api';
```

---

## Tracking Screen

The tracking screen uses **time-based simulation** for the demo:

| Time Elapsed | Status |
|---|---|
| 0–8 seconds | Booking Confirmed |
| 8–20 seconds | Provider En Route |
| 20–35 seconds | Provider Arrived |
| 35–50 seconds | Service In Progress |
| 50+ seconds | Service Completed |

When completed, the **Service Completion Checklist** appears with:
- Job Completed ✓
- Area Cleaned Up ✓
- Customer Satisfaction Confirmed ✓
- Payment Collected ✓
- Receipt Issued ✓
- Photo Evidence Placeholder

---

## Feedback and Dispute

After service completion:

**Feedback:**
- 1–5 star rating with Roman Urdu labels
- Optional written review
- Submits to `POST /api/feedback/:bookingId`
- Updates provider reputation score

**Dispute:**
- 6 issue types: Overcharge, Poor Quality, No Show, Late Arrival, Work Overrun, Other
- Description text field
- Submits to `POST /api/dispute`
- Groq AI mediates and returns resolution with full reasoning trace
- Resolution types: refund, partial_refund, compensation, warning, blacklist, escalate_to_human

---

## Build APK for Android

When ready to submit:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

This generates a downloadable APK from Expo's build servers.

---

## Known Limitations

- **Maps:** Tracking screen uses a simulated grid map. Real GPS tracking requires a development build (not Expo Go compatible).
- **SMS/WhatsApp:** Notifications are simulated — shown as previews in the app. Real delivery would use Twilio in production.
- **My Bookings tab:** Currently a placeholder. Would show booking history in production.
- **Disputes tab:** Currently a placeholder. Disputes are raised from the Feedback screen.
- **Photo upload:** Camera capture for job evidence is a placeholder. Would use `expo-image-picker` in production.

---

## Assumptions

- Users are in Islamabad (G-sector and F-sector areas)
- Phone number is the primary identifier (Pakistani format: 03XXXXXXXXX)
- Session persists until explicit logout
- Backend must be running and reachable on the same network during development

---

*HUNAR Mobile v1.0 | Built with Expo + React Native | Hackathon Submission 2026*