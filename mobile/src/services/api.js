import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'https://hunar-ai-ten.vercel.app/api';

const API_URL = 'http://192.168.1.7:5000/api/';


const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

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
    getBookedSlots: (providerId, date) => api.get(`/book/slots/${providerId}/${date}`),
    addBookingPhoto: (bookingId, photoUrl) => api.patch(`/book/${bookingId}/add-photo`, { photoUrl }),
};

export const providerAPI = {
    getBookings: () => api.get('/provider/bookings'),
    acceptBooking: (bookingId) => api.patch(`/provider/bookings/${bookingId}/accept`),
    rejectBooking: (bookingId, payload) => api.patch(`/provider/bookings/${bookingId}/reject`, payload),
    getNotifications: () => api.get('/provider/notifications'),
};

export const userNotificationAPI = {
    getNotifications: () => api.get('/provider/user/notifications'),
};

export default api;