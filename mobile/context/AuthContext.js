import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authLogin, authSignup } from '../api/client';

export const STORAGE_KEY_USER_ID = '@hunar_userId';
// Note: Changed from '@hunar_token' to 'userToken' to match the interceptor in client.js
export const STORAGE_KEY_TOKEN   = 'userToken'; 
export const STORAGE_KEY_NAME    = '@hunar_userName';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Restore session on app startup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userId = await AsyncStorage.getItem(STORAGE_KEY_USER_ID);
        const token = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
        const name = await AsyncStorage.getItem(STORAGE_KEY_NAME);

        if (userId && token && name) {
          setCurrentUser({ userId, token, name });
        }
      } catch (error) {
        console.warn("Failed to restore session from AsyncStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // ---------------------------------------------------------------------------
  // Save new session to storage & update state
  // ---------------------------------------------------------------------------
  const login = async (email, password) => {
    try {
      const user = await authLogin(email, password);
      
      // Save to AsyncStorage
      await AsyncStorage.multiSet([
        [STORAGE_KEY_USER_ID, user.userId],
        [STORAGE_KEY_TOKEN, user.token],
        [STORAGE_KEY_NAME, user.name || "User"]
      ]);
      
      setCurrentUser(user);
    } catch (error) {
      throw error; // Re-throw to allow component to show Alert
    }
  };

  const signup = async (name, email, password) => {
    try {
      const user = await authSignup(name, email, password);
      
      // Save to AsyncStorage
      await AsyncStorage.multiSet([
        [STORAGE_KEY_USER_ID, user.userId],
        [STORAGE_KEY_TOKEN, user.token],
        [STORAGE_KEY_NAME, user.name || name]
      ]);
      
      setCurrentUser(user);
    } catch (error) {
      throw error; // Re-throw to allow component to show Alert
    }
  };

  // ---------------------------------------------------------------------------
  // Clear session from storage & state
  // ---------------------------------------------------------------------------
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY_USER_ID,
        STORAGE_KEY_TOKEN,
        STORAGE_KEY_NAME
      ]);
      setCurrentUser(null);
    } catch (error) {
      console.warn("Failed to clear session during logout:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // Prevent rendering children while checking initial token (prevents flash)
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
