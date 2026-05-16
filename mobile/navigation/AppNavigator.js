import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Nabil's Screen Shell Imports
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ChatScreen from '../screens/ChatScreen';
import ProvidersScreen from '../screens/ProvidersScreen';
import PricingScreen from '../screens/PricingScreen';
import BookingConfirmedScreen from '../screens/BookingConfirmedScreen';
import TrackingScreen from '../screens/TrackingScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

// -----------------------------------------------------------------------------
// SCREEN NAME CONSTANTS
// -----------------------------------------------------------------------------
export const SCREENS = {
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  CHAT: 'Chat',
  PROVIDERS: 'Providers',
  PRICING: 'Pricing',
  BOOKING_CONFIRMED: 'BookingConfirmed',
  TRACKING: 'Tracking',
  FEEDBACK: 'Feedback',
};

const ACCENT_COLOR = '#6c63ff';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { currentUser, isLoading } = useAuth();

  // ---------------------------------------------------------------------------
  // APP STARTUP CHECK
  // Shows a loading spinner while AsyncStorage is being read in AuthContext
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* --------------------------------------------------------------------
            AUTH STACK
            Shown ONLY when no user is logged in (currentUser is null)
            -------------------------------------------------------------------- */}
        {currentUser === null ? (
          <>
            <Stack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
            <Stack.Screen name={SCREENS.SIGNUP} component={SignupScreen} />
          </>
        ) : (
          
        /* --------------------------------------------------------------------
            APP STACK
            Shown ONLY when a user is logged in. CHAT is the home/initial screen.
            -------------------------------------------------------------------- */
          <>
            <Stack.Screen name={SCREENS.CHAT} component={ChatScreen} />
            <Stack.Screen name={SCREENS.PROVIDERS} component={ProvidersScreen} />
            <Stack.Screen name={SCREENS.PRICING} component={PricingScreen} />
            <Stack.Screen name={SCREENS.BOOKING_CONFIRMED} component={BookingConfirmedScreen} />
            <Stack.Screen name={SCREENS.TRACKING} component={TrackingScreen} />
            <Stack.Screen name={SCREENS.FEEDBACK} component={FeedbackScreen} />
          </>
        )}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f8fc', // Match design system BACKGROUND color
  },
});
