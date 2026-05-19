# HUNAR Mobile App — React Native Frontend UI/UX Plan
> **AI-Powered Informal Service Economy Platform**  
> *Islamabad Sector-Based On-Demand Marketplace with a 7-Step Agentic Backend*

---

## 1. Design Aesthetics & Visual Tokens

To make HUNAR look extremely premium and state-of-the-art, we avoid generic styles. Instead, we use an **emerald, slate, and gold color scheme** inspired by Islamabad’s lush greenery and Margalla Hills, balanced with high-contrast UI cards, sleek micro-animations, and dynamic visual states.

### A. Color Palette (HSL & Hex)
```javascript
export const THEME = {
  colors: {
    // Primary - Rich Margalla Green (Emerald)
    primary: '#0B6623',
    primaryLight: '#E8F5E9',
    primaryDark: '#053E14',
    
    // Secondary - Margalla Ridge Gold (Warm Accent)
    accent: '#D4AF37',
    accentLight: '#FCF8E3',
    
    // Neutral Dark - Deep Slate/Charcoal (Modern Text & Backgrounds)
    textDark: '#1A252C',
    textMuted: '#64748B',
    bgLight: '#F8FAFC',
    bgCard: '#FFFFFF',
    border: '#E2E8F0',
    
    // Semantic Colors
    urgencyHigh: '#EF4444',     // High Urgency (AC repair band ho gaya)
    urgencyMedium: '#F59E0B',   // Medium Urgency
    urgencyLow: '#3B82F6',      // Low Urgency
    success: '#10B981',
    info: '#0EA5E9',
  },
  shadows: {
    premium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    float: {
      shadowColor: '#0B6623',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    }
  }
};
```

### B. Typography Config (English, Roman Urdu & Urdu Script)
* Since Roman Urdu and Urdu script contain words with larger vertical bounds or different glyph patterns, we use custom line-height factors to prevent clipping.
* **Primary Fonts**: We suggest using `Outfit` or `Inter` for headers, and `Noto Sans Arabic` or `Jameel Noori Nastaliq` for deep Urdu script integrations.

---

## 2. Directory Layout & Architecture

Here is the proposed, modular folder structure for the Expo React Native app under `/mobile`:

```
mobile/
├── src/
│   ├── assets/               # Local icons, illustrations, sound files
│   ├── components/           # Reusable atomic UI elements
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── ReasoningTraceBox.js  <-- Displays AI's decision reasoning
│   │   ├── DynamicInvoice.js     <-- Breakdown of math pricing
│   │   └── AgentChatBubble.js    <-- Dual language chat container
│   ├── context/              # Global state provider (Auth, Active Booking)
│   │   └── AuthContext.js
│   ├── navigation/           # React Navigation configurations
│   │   ├── AppNavigator.js
│   │   ├── AuthStack.js
│   │   ├── ClientTabs.js
│   │   └── ProviderStack.js
│   ├── screens/              # Core page templates
│   │   ├── common/           # Shared views (Login, Signup, Profile)
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── client/           # Client-specific pages
│   │   │   ├── AIRequestHub.js   <-- Voice/Text AI Input Screen
│   │   │   ├── MatchingScreen.js  <-- Provider Match + AI Re-ranking list
│   │   │   ├── TrackingScreen.js  <-- Live Status Tracking + Checklist
│   │   │   └── DisputeScreen.js   <-- AI Dispute Mediation Panel
│   │   └── provider/         # Provider-specific pages
│   │       ├── ProviderDashboard.js
│   │       └── ActiveJobScreen.js
│   └── services/             # Axios and LocalStorage APIs
│       ├── api.js            # Core Axios instances
│       └── auth.js           # Login / JWT helper storage
├── App.js                    # Entrypoint
└── app.json                  # Expo configs
```

---

## 3. High-Fidelity React Native Component Blueprints

Below are visual code structures for the core components that handle the agentic workflow returned by the HUNAR backend. 

### A. Component 1: `ReasoningTraceBox.js`
*This component displays the Groq AI's "thought process" and re-ranking reasons. In a hackathon, showing this to the judges visually inside the app is a massive differentiator!*

```javascript
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReasoningTraceBox({ trace }) {
  const [expanded, setExpanded] = useState(false);

  if (!trace) return null;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb-outline" size={20} color={THEME.colors.accent} />
          <Text style={styles.headerTitle}>AI Agent Reasoning Trace</Text>
        </View>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={18} 
          color={THEME.colors.textMuted} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: THEME.colors.primaryLight }]}>
              <Text style={styles.badgeText}>Confidence: {(trace.confidence * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Step: {trace.step}</Text>
            </View>
          </View>
          
          <Text style={styles.reasoningText}>
            {trace.reasoning}
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.decisionRow}>
            <Text style={styles.decisionLabel}>Decision Outcome:</Text>
            <Text style={styles.decisionValue}>{trace.decision}</Text>
          </View>
          
          {trace.fallback_considered && (
            <View style={styles.fallbackContainer}>
              <Text style={styles.fallbackText}>
                <Text style={{ fontWeight: 'bold' }}>Fallback Check: </Text>
                {trace.fallback_considered}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B', // Dark charcoal slate for contrast
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
    ...THEME.shadows.premium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  reasoningText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  decisionRow: {
    backgroundColor: 'rgba(11, 102, 35, 0.2)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.primary,
  },
  decisionLabel: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  decisionValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  fallbackContainer: {
    marginTop: 10,
  },
  fallbackText: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
  }
});
```

---

### B. Component 2: `AgentChatBubble.js`
*Handles natural language responses, low-confidence clarifying queries (confidence < 0.7), and provides styled Urdu/English dialogue indicators.*

```javascript
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { THEME } from '../constants/theme';

export default function AgentChatBubble({ message, isUser, isClarification, onSelectOption }) {
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image 
            source={require('../assets/hunar_agent_avatar.png')} 
            style={styles.avatar} 
          />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAgent,
        isClarification && styles.bubbleClarify
      ]}>
        {!isUser && (
          <Text style={styles.agentTag}>HUNAR AI Assistant</Text>
        )}
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
          {message}
        </Text>
        
        {isClarification && (
          <View style={styles.clarifyBadge}>
            <Text style={styles.clarifyBadgeText}>Needs Clarifying Information</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  rowUser: {
    alignSelf: 'flex-end',
  },
  rowAgent: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primaryLight,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    ...THEME.shadows.premium,
  },
  bubbleUser: {
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleAgent: {
    backgroundColor: THEME.colors.bgCard,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  bubbleClarify: {
    borderColor: THEME.colors.urgencyMedium,
    borderWidth: 1.5,
    backgroundColor: '#FFFBEB', // soft warm warning tint
  },
  agentTag: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFF',
  },
  textAgent: {
    color: THEME.colors.textDark,
  },
  clarifyBadge: {
    backgroundColor: THEME.colors.urgencyMedium,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clarifyBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
```

---

### C. Component 3: `DynamicInvoice.js`
*Displays the transparent formula-based pricing breakdown calculated by step 4 of the backend.*

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DynamicInvoice({ pricing }) {
  if (!pricing) return null;

  const {
    baseRate,
    distanceFee,
    urgencyPremium,
    complexityMultiplier,
    loyaltyDiscount,
    surgeMultiplier,
    total,
    distanceKm
  } = pricing;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hunar Verified Price Quote</Text>
      
      {/* Rate items */}
      <View style={styles.row}>
        <Text style={styles.label}>Base Service Rate (Hourly)</Text>
        <Text style={styles.value}>Rs. {baseRate}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Google Maps Travel Fee</Text>
          <Text style={styles.subtext}>({distanceKm?.toFixed(1)} km @ Rs. 50/km)</Text>
        </View>
        <Text style={styles.value}>Rs. {distanceFee}</Text>
      </View>

      {urgencyPremium > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: THEME.colors.urgencyHigh }]}>Urgency Premium (Urgent Match)</Text>
          <Text style={[styles.value, { color: THEME.colors.urgencyHigh }]}>+ Rs. {urgencyPremium}</Text>
        </View>
      )}

      {loyaltyDiscount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: THEME.colors.success }]}>Loyalty Discount (3+ bookings)</Text>
          <Text style={[styles.value, { color: THEME.colors.success }]}>- Rs. {loyaltyDiscount}</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* Multipliers */}
      {complexityMultiplier > 1 && (
        <View style={styles.rowSub}>
          <Text style={styles.subtext}>Complexity Factor: </Text>
          <Text style={styles.subValue}>x {complexityMultiplier} (Complex Task)</Text>
        </View>
      )}

      {surgeMultiplier > 1 && (
        <View style={styles.rowSub}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="thunderstorm-outline" size={14} color={THEME.colors.urgencyMedium} style={{ marginRight: 4 }} />
            <Text style={[styles.subtext, { color: THEME.colors.urgencyMedium }]}>Sector Surge Applied: </Text>
          </View>
          <Text style={[styles.subValue, { color: THEME.colors.urgencyMedium, fontWeight: '700' }]}>x {surgeMultiplier}</Text>
        </View>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Estimated Price</Text>
        <Text style={styles.totalValue}>Rs. {Math.round(total)}</Text>
      </View>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={THEME.colors.primary} />
        <Text style={styles.infoText}>
          HUNAR enforces standard, non-negotiable prices. Providers cannot overcharge you.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.premium,
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textDark,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: 'column',
  },
  label: {
    color: THEME.colors.textDark,
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textDark,
  },
  subtext: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 10,
  },
  rowSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  subValue: {
    fontSize: 12,
    color: THEME.colors.textDark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: THEME.colors.primary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textDark,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  infoText: {
    color: THEME.colors.primaryDark,
    fontSize: 11,
    marginLeft: 8,
    flex: 1,
  }
});
```

---

## 4. Main Screens Flow & Interactive Layouts

### 📱 Screen A: `AIRequestHub.js` (The Conversational Assistant)
This is the **home page** of the app. Rather than filling out exhaustive forms, the user sees a premium voice/text command screen.
1. **Header**: Beautiful welcome banner, user profile indicator, and current active location (e.g. Islamabad Sector: **G-11**).
2. **Conversation Thread**: Displays previous requests in standard chat bubbles.
3. **Voice/Text Box**: 
   - A pulsing microphone icon (uses Expo-AV for sound) for speech.
   - A modern input field in Roman Urdu or English.
   - Subtitles below like *"Try: AC kharab hai subah G-11 mein electrician chahiye"* to guide users.
4. **Pulsing Agent Status**: If the agent is processing a message, it shows a stunning, glowing AI icon with text: **"HUNAR AI is reasoning about your intent..."**

---

### 🔍 Screen B: `MatchingScreen.js` (Provider Matcher)
Once `POST /api/match` succeeds, the client is taken here:
1. **AI Intent Summary**: Beautiful cards containing the parsed variables (Service, Sector, Urgency, job Complexity).
2. **Reasoning trace toggle**: Includes the `ReasoningTraceBox` (detailed above) explaining why it chose this provider ranking.
3. **Top Providers Horizontal / Vertical list**: 
   - **Provider Card**: Shows provider’s photo, name, rating (e.g. `4.9 (42 reviews)`), distance in travel minutes (`~12 mins away`), specific certifications (e.g., `AC Specialist`), and on-time rate (`97%`).
   - Clicking a provider expands to show their custom **Roman Urdu bio** ("AC aur Fridge repair ka expert...") and verification badge.
4. **Invoice Breakdown**: Embeds `DynamicInvoice` at the bottom for instant transparency.
5. **Confirm CTA**: Large, gorgeous glowing Green button to execute booking (`POST /api/book`).

---

### 📍 Screen C: `TrackingScreen.js` (Live Status & AI Quality Loop)
Tracks the booking status automatically:
1. **Interactive Simulated Map**: 
   - Shows the user's location and the provider's location.
   - If the status is `en_route`, the provider icon dynamically moves along G-11/G-13 routes towards the client.
2. **Dynamic Progress Timeline**:
   - Displays 5 dots matching the status: `Confirmed` -> `En Route` -> `Arrived` -> `In Progress` -> `Completed`.
3. **Step 6 Quality Loop Checklist**: 
   - When the status changes to `completed`, the provider's mandatory closing checklist slides up:
     - `[x] Job Completed`
     - `[x] Work area swept & cleaned`
     - `[x] Customer signature verification`
     - `[x] Cash/EasyPaisa payment received`
     - `[x] Receipt generated`
4. **AI Quality Loop Trace**: Displays an agent box showing the Reputation Score adjustment based on this job's completion stats.

---

### ⚖️ Screen D: `DisputeScreen.js` (AI Dispute Mediator)
If a user is unsatisfied (e.g. provider arrived late or tried to overcharge), they can open a Dispute.
1. **Dispute Input Form**: Dropdown of issues (`price_mismatch`, `late_arrival`, `poor_quality`, `incomplete_work`) and detail descriptions.
2. **Groq AI Mediator Portal**: 
   - An animated process loader: **"AI Mediator checking server logs, booking rates, and provider cancellation risk..."**
   - Renders a chat bubble containing the **Step 7 Dispute Resolution Reasoning** from Groq.
   - Renders the official decision card:
     - **Decision**: e.g., *"Partial refund of Rs. 300 approved, provider issued reputation warning."*
     - **Reason**: Explaining exactly why (the trace retrieved from Step 7).

---

## 5. React Navigation Architecture

Our app has two roles (Client and Provider). A global Auth Context tracks roles and loads the appropriate Navigation tree.

```javascript
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Screen imports
import WelcomeScreen from '../screens/common/WelcomeScreen';
import LoginScreen from '../screens/common/LoginScreen';
import RegisterScreen from '../screens/common/RegisterScreen';

import AIRequestHub from '../screens/client/AIRequestHub';
import MatchingScreen from '../screens/client/MatchingScreen';
import TrackingScreen from '../screens/client/TrackingScreen';
import DisputeScreen from '../screens/client/DisputeScreen';

import ProviderDashboard from '../screens/provider/ProviderDashboard';
import ActiveJobScreen from '../screens/provider/ActiveJobScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigation
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Client Bottom Tabs Navigation
function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'AI Assistant') iconName = 'chatbubble-ellipses';
          else if (route.name === 'My Bookings') iconName = 'list-outline';
          else if (route.name === 'Disputes') iconName = 'shield-half';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: { height: 60, paddingBottom: 8 },
        headerStyle: { backgroundColor: THEME.colors.primary },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="AI Assistant" component={AIRequestHub} />
      <Tab.Screen name="My Bookings" component={TrackingScreen} />
      <Tab.Screen name="Disputes" component={DisputeScreen} />
    </Tab.Navigator>
  );
}

// Provider Dashboard Stack
function ProviderStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME.colors.primaryDark },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={ProviderDashboard} 
        options={{ title: 'Hunar Provider Portal' }} 
      />
      <Stack.Screen 
        name="ActiveJob" 
        component={ActiveJobScreen} 
        options={{ title: 'Active Job Details' }} 
      />
    </Stack.Navigator>
  );
}

// Master App Navigator
export default function AppNavigator() {
  const { userToken, isProvider } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userToken ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : isProvider ? (
          <Stack.Screen name="ProviderFlow" component={ProviderStack} />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ClientFlow" component={ClientTabs} />
            <Stack.Screen name="Matching" component={MatchingScreen} />
          </Stack.Navigator>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 6. API Service Integration Layer

To match the backend JWT protection, configure an API client in `src/services/api.js` using `axios`. It automatically injects the stored token and provides functional bindings for your backend routes.

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL configuration (railway backend IP/domain or localhost)
const API_URL = 'http://192.168.1.6:5000/api'; // Replace with backend host IP

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to load JWT from storage
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const serviceAPI = {
  // Step 1: Parse Urdu/Roman Urdu string
  parseRequest: (message, userSector) => api.post('/parse-request', { message, userSector }),
  
  // Step 2,3,4: Provider match ranking, schedules & pricing
  matchProviders: (matchData) => api.post('/match', matchData),
  
  // Step 5: Confirm booking
  bookProvider: (bookingPayload) => api.post('/book', bookingPayload),
  
  // Step 6: Quality loop & Live updates
  getTracking: (bookingId) => api.get(`/tracking/${bookingId}`),
  updateTracking: (bookingId, status) => api.patch(`/tracking/${bookingId}`, { status }),
  submitFeedback: (bookingId, feedbackData) => api.post(`/feedback/${bookingId}`, feedbackData),
  
  // Step 7: Dispute mediation
  raiseDispute: (disputeData) => api.post('/dispute', disputeData),
  getDispute: (disputeId) => api.get(`/dispute/${disputeId}`),
};

export default api;
```

---

## 7. Polishing & Micro-Animations

To provide a breathtaking, world-class mobile user experience, we plan to implement these three touchpoints:

1. **Micro-haptics / Sound**:
   - Successful parsing triggers a double soft haptic buzz (`Haptics.notificationAsync` from `expo-haptics`).
   - A high-urgency parse highlights the screen border in glowing red with a subtle warning sound to mimic the critical priority.
2. **Pulsing Loader Animations**:
   - Integrate `lottie-react-native` or standard `Animated` loops on the `AIRequestHub` screen during parsing to visually show AI reasoning waves (expanding circles of light emerald).
3. **Islamabad Proximity Visualizer**:
   - Visual badges for distance calculation. For example, if travel is in the same sector (G-11 to G-11), render a green badge: **"Neighbor Sector Match (No Travel Fee)"**.

---

### Verification and Launch Checklist
- [ ] Connect `api.js` to your hosted Railway backend.
- [ ] Test the NLP parsing by typing: *"AC kharab ho gaya hai, urgent service chahiye G-11"* and ensure the response contains confidence scores.
- [ ] Render the reasoning traces explicitly to make the agentic AI transparent.
