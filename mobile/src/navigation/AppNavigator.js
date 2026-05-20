import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../constants/theme';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

import ProviderDashboard from '../screens/provider/ProviderDashboard';
import ProviderJobDetail from '../screens/provider/ProviderJobDetail';
import WelcomeScreen from '../screens/common/WelcomeScreen';
import LoginScreen from '../screens/common/LoginScreen';
import RegisterScreen from '../screens/common/RegisterScreen';
import AIRequestHub from '../screens/client/AIRequestHub';
import MatchingScreen from '../screens/client/MatchingScreen';
import BookingScreen from '../screens/client/BookingScreen';
import BookingConfirmedScreen from '../screens/client/BookingConfirmedScreen';
import TrackingDetailScreen from '../screens/client/TrackingDetailScreen';
import FeedbackScreen from '../screens/client/FeedbackScreen';
import TrackingScreen from '../screens/client/TrackingScreen';
import DisputeScreen from '../screens/client/DisputeScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

function ClientTabs() {
    const [bookingBadge, setBookingBadge] = useState(0);

    useEffect(() => {
        fetchBadge();
        // const interval = setInterval(fetchBadge, 20000);
        // return () => clearInterval(interval);
    }, []);

    const fetchBadge = async () => {
        try {
            const res = await api.get('/book/my-bookings');
            const bookings = res.data.data || [];
            const total = bookings.length;

            const lastSeen = await AsyncStorage.getItem('last_seen_bookings_count');
            const lastCount = lastSeen ? parseInt(lastSeen) : total;
            const badge = Math.max(0, total - lastCount);
            setBookingBadge(badge);
        } catch (err) { }
    };

    const clearBadge = async () => {
        try {
            const res = await api.get('/book/my-bookings');
            const total = (res.data.data || []).length;
            await AsyncStorage.setItem('last_seen_bookings_count', String(total));
            setBookingBadge(0);
        } catch (err) { }
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        'AI Assistant': 'chatbubble-ellipses',
                        'My Bookings': 'list-outline',
                        'Disputes': 'shield-half',
                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: THEME.colors.primary,
                tabBarInactiveTintColor: THEME.colors.textMuted,
                tabBarStyle: { height: 60, paddingBottom: 8 },
            })}
        >
            <Tab.Screen name="AI Assistant" component={AIRequestHub} />
            <Tab.Screen
                name="My Bookings"
                component={TrackingScreen}
                listeners={{ tabPress: clearBadge }}
                options={{
                    tabBarBadge: bookingBadge > 0 ? bookingBadge : undefined,
                    tabBarBadgeStyle: { backgroundColor: THEME.colors.urgencyHigh, fontSize: 10 },
                }}
            />
            <Tab.Screen name="Disputes" component={DisputeScreen} />
        </Tab.Navigator>
    );
}

function AppStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ClientTabs" component={ClientTabs} />
            <Stack.Screen name="Matching" component={MatchingScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} />
            <Stack.Screen name="Tracking" component={TrackingDetailScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
        </Stack.Navigator>
    );
}

function ProviderTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    const icons = {
                        'Bookings': 'calendar-outline',
                        'Disputes': 'shield-half',
                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: THEME.colors.primary,
                tabBarInactiveTintColor: THEME.colors.textMuted,
                tabBarStyle: { height: 60, paddingBottom: 8 },
            })}
        >
            <Tab.Screen name="Bookings" component={ProviderDashboard} />
            <Tab.Screen name="Disputes" component={DisputeScreen} />
        </Tab.Navigator>
    );
}

function ProviderStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProviderTabs" component={ProviderTabs} />
            <Stack.Screen name="ProviderJobDetail" component={ProviderJobDetail} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { token, loading, user } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer key={token ? 'logged-in' : 'logged-out'}>
            {!token ? (
                <AuthStack />
            ) : user?.role === 'provider' ? (
                <ProviderStack />
            ) : (
                <AppStack />
            )}
        </NavigationContainer>
    );
}