import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />

            <View style={styles.hero}>
                <View style={styles.logoCircle}>
                    <Ionicons name="construct" size={48} color={THEME.colors.white} />
                </View>
                <Text style={styles.appName}>HUNAR</Text>
                <Text style={styles.tagline}>Islamabad ka Smart Service Marketplace</Text>
                <Text style={styles.sub}>
                    Plumber, Electrician, AC Technician — sab kuch ek jagah. AI-powered matching.
                </Text>
            </View>

            <View style={styles.features}>
                {[
                    { icon: 'language', text: 'Roman Urdu / English — koi bhi bolo' },
                    { icon: 'analytics', text: 'AI se best provider dhundta hai' },
                    { icon: 'shield-checkmark', text: 'Fixed prices, no overcharging' },
                ].map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <Ionicons name={f.icon} size={20} color={THEME.colors.primary} />
                        </View>
                        <Text style={styles.featureText}>{f.text}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.btnPrimaryText}>Shuru Karein — Register</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.btnSecondaryText}>Already account hai? Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.primaryDark,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: THEME.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        ...THEME.shadows.float,
    },
    appName: {
        fontSize: 42,
        fontWeight: '900',
        color: THEME.colors.white,
        letterSpacing: 6,
    },
    tagline: {
        fontSize: 16,
        color: THEME.colors.accent,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center',
    },
    sub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    features: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    featureIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: THEME.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    featureText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        flex: 1,
    },
    buttons: {
        gap: 12,
    },
    btnPrimary: {
        backgroundColor: THEME.colors.accent,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        ...THEME.shadows.float,
    },
    btnPrimaryText: {
        color: THEME.colors.primaryDark,
        fontSize: 16,
        fontWeight: '800',
    },
    btnSecondary: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    btnSecondaryText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        fontWeight: '600',
    },
});