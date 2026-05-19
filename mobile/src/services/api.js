import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
// For local testing use your laptop IP
// For production use Railway URL
const API_URL = 'http://192.168.1.6:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Auto attach JWT token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('user_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
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
    parseRequest: (message, userSector) => api.post('/parse-request', { message, userSector }),
    matchProviders: (matchData) => api.post('/match', matchData),
    bookProvider: (bookingPayload) => api.post('/book', bookingPayload),
    getPrice: (priceData) => api.post('/price', priceData),
    getTracking: (bookingId) => api.get(`/tracking/${bookingId}`),
    updateTracking: (bookingId, status) => api.patch(`/tracking/${bookingId}`, { status }),
    submitFeedback: (bookingId, data) => api.post(`/feedback/${bookingId}`, data),
    raiseDispute: (disputeData) => api.post('/dispute', disputeData),
};

export default api;