import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Import Screens
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ChatScreen from '../screens/ChatScreen';
import MatchingScreen from '../screens/MatchingScreen';
import TrackingScreen from '../screens/TrackingScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import DisputeScreen from '../screens/DisputeScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1f3a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1f3a', // Deep Blue theme
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false, // Removes the bottom border of the header
        contentStyle: { backgroundColor: '#1a1f3a' }
      }}
    >
      {currentUser === null ? (
        /* Auth Flow */
        <>
          <Stack.Screen 
            name="SignIn" 
            component={SignInScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen} 
            options={{ headerShown: false }} 
          />
        </>
      ) : (
        /* Main App Flow */
        <>
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ 
          title: 'Hunar Chat',
          headerBackVisible: false, // Prevent going back to login naturally
        }} 
      />
      <Stack.Screen 
        name="Matching" 
        component={MatchingScreen} 
        options={{ title: 'Finding Provider' }} 
      />
      <Stack.Screen 
        name="Tracking" 
        component={TrackingScreen} 
        options={{ title: 'Live Tracking' }} 
      />
      <Stack.Screen 
        name="Feedback" 
        component={FeedbackScreen} 
        options={{ title: 'Rate Service' }} 
      />
        <Stack.Screen 
          name="Dispute" 
          component={DisputeScreen} 
          options={{ title: 'Resolution Center' }} 
        />
        </>
      )}
    </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
