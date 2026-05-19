import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../constants/theme';
import { ActivityIndicator, View } from 'react-native';

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
            <Tab.Screen name="My Bookings" component={TrackingScreen} />
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

export default function AppNavigator() {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {token ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
}