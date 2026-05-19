import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in when app starts
    useEffect(() => {
        const loadSession = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('user_token');
                const savedUser = await AsyncStorage.getItem('user_data');
                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch (e) {
                console.log('Session load error:', e);
            } finally {
                setLoading(false);
            }
        };
        loadSession();
    }, []);

    const login = async (phone, password) => {
        const res = await authAPI.login(phone, password);
        const { token, user, role } = res.data;
        await AsyncStorage.setItem('user_token', token);
        await AsyncStorage.setItem('user_data', JSON.stringify({ ...user, role }));
        setToken(token);
        setUser({ ...user, role });
        return res.data;
    };

    const register = async (userData) => {
        const res = await authAPI.register(userData);
        const { token, user, role } = res.data;
        await AsyncStorage.setItem('user_token', token);
        await AsyncStorage.setItem('user_data', JSON.stringify({ ...user, role }));
        setToken(token);
        setUser({ ...user, role });
        return res.data;
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user_token');
            await AsyncStorage.removeItem('user_data');
        } catch (e) {
            console.log('Logout error:', e);
        } finally {
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);