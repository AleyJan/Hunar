import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DUMMY_USER,
  DUMMY_PARSED,
  DUMMY_MULTI,
  DUMMY_PROVIDERS,
  DUMMY_PRICE,
  DUMMY_BOOKING,
  DUMMY_TRACKING_STEPS
} from './dummyData';

// -----------------------------------------------------------------------------
// AXIOS INSTANCE CONFIGURATION
// -----------------------------------------------------------------------------

const apiClient = axios.create({
  baseURL: 'https://hunar-api.railway.app/api',
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Error reading token from AsyncStorage:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("401 Unauthorized globally intercepted. Token likely expired.");
    }
    return Promise.reject(error);
  }
);

// -----------------------------------------------------------------------------
// AUTH FUNCTIONS
// -----------------------------------------------------------------------------

export const authSignup = async (name, email, password) => {
  try {
    // PHASE 1 — remove this line when Ali's backend is ready
    return DUMMY_USER;

    // PHASE 2
    // const response = await apiClient.post('/auth/signup', { name, email, password });
    // return response.data;
  } catch (error) {
    throw error; // Re-throw to allow component to show Alert
  }
};

export const authLogin = async (email, password) => {
  try {
    // PHASE 1 — remove this line when Ali's backend is ready
    return DUMMY_USER;

    // PHASE 2
    // const response = await apiClient.post('/auth/login', { email, password });
    // return response.data;
  } catch (error) {
    throw error;
  }
};

// -----------------------------------------------------------------------------
// PARSING
// -----------------------------------------------------------------------------

export const parseRequest = async (message, userId) => {
  try {
    if (!message) throw new Error("Message is required to parse a request.");

    // PHASE 1 — remove this line when Ali's backend is ready
    const lowerMessage = message.toLowerCase();
    // Simulate detecting multi-skills based on connectors
    const isMultiSkill = lowerMessage.includes(' and ') || lowerMessage.includes(' aur ') || lowerMessage.includes('&');
    return isMultiSkill ? DUMMY_MULTI : DUMMY_PARSED;

    // PHASE 2
    // const response = await apiClient.post('/parse-request', { message, userId });
    // return response.data; // Expected shape matches DUMMY_PARSED or DUMMY_MULTI
  } catch (error) {
    throw error;
  }
};

// -----------------------------------------------------------------------------
// MATCHING
// -----------------------------------------------------------------------------

export const getMatches = async (service, location, urgency, budgetSensitive, multiSkill = false) => {
  try {
    if (!service || !location) throw new Error("Service and location are mandatory for matching.");

    // PHASE 1 — remove this line when Ali's backend is ready
    return { matches: DUMMY_PROVIDERS };

    // PHASE 2
    // const response = await apiClient.post('/match', { service, location, urgency, budgetSensitive, multiSkill });
    // return response.data;
  } catch (error) {
    throw error;
  }
};

// -----------------------------------------------------------------------------
// BOOKING
// -----------------------------------------------------------------------------

export const getPrice = async (providerId, service, urgency, distanceKm, userId) => {
  try {
    if (!providerId) throw new Error("Provider ID is required to calculate price.");

    // PHASE 1 — remove this line when Ali's backend is ready
    return DUMMY_PRICE;

    // PHASE 2
    // const response = await apiClient.post('/price', { providerId, service, urgency, distanceKm, userId });
    // return response.data;
  } catch (error) {
    throw error;
  }
};

export const confirmBook = async (providerId, userId, service, slot, totalPrice, userLocation) => {
  try {
    if (!providerId || !slot) throw new Error("Provider and time slot are required to confirm booking.");

    // PHASE 1 — remove this line when Ali's backend is ready
    return DUMMY_BOOKING;

    // PHASE 2
    // const response = await apiClient.post('/book', { providerId, userId, service, slot, totalPrice, userLocation });
    // return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTracking = async (bookingId) => {
  try {
    if (!bookingId) throw new Error("Booking ID is required to track status.");

    // PHASE 1 — remove this line when Ali's backend is ready
    return DUMMY_TRACKING_STEPS[0];

    // PHASE 2
    // const response = await apiClient.get(`/tracking/${bookingId}`);
    // return response.data;
  } catch (error) {
    throw error;
  }
};

// -----------------------------------------------------------------------------
// FEEDBACK & DISPUTES
// -----------------------------------------------------------------------------

export const submitFeedback = async (bookingId, rating, review, userId) => {
  try {
    if (!bookingId || !rating) throw new Error("Booking ID and rating are required.");

    // PHASE 1 — remove this line when Ali's backend is ready
    return { success: true, newProviderRating: 4.8, message: "Shukriya! Feedback submit ho gaya." };

    // PHASE 2
    // const response = await apiClient.post('/feedback', { bookingId, rating, review, userId });
    // return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitDispute = async (bookingId, issueType, description, userId) => {
  try {
    if (!bookingId || !issueType) throw new Error("Booking ID and issue type are required.");

    // PHASE 1 — remove this line when Ali's backend is ready
    return { 
      resolution: "partial_refund", 
      explanation: "Price overcharge detected", 
      actionMessage: "Aapko Rs 200 wapas mil jayenge 24 ghante mein.", 
      providerFlag: true 
    };

    // PHASE 2
    // const response = await apiClient.post('/dispute', { bookingId, issueType, description, userId });
    // return response.data;
  } catch (error) {
    throw error;
  }
};
