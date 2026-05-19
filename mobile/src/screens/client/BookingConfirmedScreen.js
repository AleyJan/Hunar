import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

export default function BookingConfirmedScreen({ navigation, route }) {
    const { booking, sms, provider } = route.params || {};
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleTrackBooking = () => {
        navigation.navigate('Tracking', { booking });
    };

    const handleGoHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'ClientTabs' }],
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primary} />

            {/* Success Header */}
            <View style={styles.successHeader}>
                <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
                    <Ionicons name="checkmark" size={48} color={THEME.colors.white} />
                </Animated.View>
                <Text style={styles.successTitle}>Booking Confirmed!</Text>
                <Text style={styles.successSub}>
                    {provider?.name} kal aayenge aapke ghar
                </Text>
                <View style={styles.bookingIdBadge}>
                    <Text style={styles.bookingIdText}>{booking?.bookingId}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Booking Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Booking Details</Text>

                    {[
                        { icon: 'construct-outline', label: 'Service', value: booking?.serviceType?.replace(/_/g, ' ').toUpperCase() },
                        { icon: 'person-outline', label: 'Provider', value: provider?.name },
                        { icon: 'call-outline', label: 'Phone', value: provider?.phone },
                        { icon: 'calendar-outline', label: 'Time', value: booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tomorrow' },
                        { icon: 'location-outline', label: 'Location', value: booking?.sector },
                        { icon: 'cash-outline', label: 'Total', value: `Rs. ${booking?.pricing?.totalAmount || 0}` },
                        { icon: 'time-outline', label: 'Status', value: booking?.status === 'pending' ? '⏳ Awaiting Provider' : 'Confirmed ✓' },
                    ].map((item, i) => (
                        <View key={i} style={styles.detailRow}>
                            <View style={styles.detailLeft}>
                                <Ionicons name={item.icon} size={16} color={THEME.colors.primary} />
                                <Text style={styles.detailLabel}>{item.label}</Text>
                            </View>
                            <Text style={[
                                styles.detailValue,
                                item.label === 'Total' && { color: THEME.colors.primary, fontWeight: '800', fontSize: 15 },
                                item.label === 'Status' && { color: THEME.colors.success },
                            ]}>
                                {item.value}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* SMS Simulation */}
                <View style={styles.smsCard}>
                    <View style={styles.smsHeader}>
                        <Ionicons name="logo-whatsapp" size={20} color={THEME.colors.success} />
                        <Text style={styles.smsTitle}>WhatsApp Notification Sent</Text>
                        <View style={styles.sentBadge}>
                            <Text style={styles.sentBadgeText}>Simulated</Text>
                        </View>
                    </View>
                    <View style={styles.smsBubble}>
                        <Text style={styles.smsText}>
                            {sms?.userMessage || `✅ HUNAR Booking Confirmed!\nID: ${booking?.bookingId}\nProvider: ${provider?.name}\nPhone: ${provider?.phone}\nTotal: Rs. ${booking?.pricing?.totalAmount}`}
                        </Text>
                    </View>
                </View>

                {/* Provider Earnings */}
                <View style={styles.earningsCard}>
                    <Ionicons name="information-circle-outline" size={16} color={THEME.colors.primary} />
                    <Text style={styles.earningsText}>
                        Provider receives Rs. {Math.round((booking?.pricing?.totalAmount || 0) * 0.9)} (90%).
                        HUNAR platform fee: Rs. {Math.round((booking?.pricing?.totalAmount || 0) * 0.1)} (10%).
                    </Text>
                </View>

                {/* Progress Steps */}
                <View style={styles.stepsCard}>
                    <Text style={styles.cardTitle}>What happens next?</Text>
                    {[
                        { icon: 'checkmark-circle', label: 'Booking Confirmed', done: true },
                        { icon: 'car-outline', label: 'Provider En Route', done: false },
                        { icon: 'home-outline', label: 'Provider Arrived', done: false },
                        { icon: 'construct-outline', 'label': 'Service In Progress', done: false },
                        { icon: 'star-outline', label: 'Rate Your Experience', done: false },
                    ].map((step, i) => (
                        <View key={i} style={styles.stepRow}>
                            <View style={[styles.stepIcon, step.done && styles.stepIconDone]}>
                                <Ionicons
                                    name={step.icon}
                                    size={16}
                                    color={step.done ? THEME.colors.white : THEME.colors.textMuted}
                                />
                            </View>
                            <Text style={[styles.stepText, step.done && styles.stepTextDone]}>
                                {step.label}
                            </Text>
                            {step.done && (
                                <Ionicons name="checkmark" size={14} color={THEME.colors.success} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Action Buttons */}
                <TouchableOpacity style={styles.trackBtn} onPress={handleTrackBooking}>
                    <Ionicons name="navigate-outline" size={20} color={THEME.colors.white} />
                    <Text style={styles.trackBtnText}>Track Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
                    <Text style={styles.homeBtnText}>Ghar Wapas Jao</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    successHeader: {
        backgroundColor: THEME.colors.primary,
        paddingTop: 60,
        paddingBottom: 30,
        alignItems: 'center',
        gap: 10,
    },
    checkCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: THEME.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        ...THEME.shadows.float,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: THEME.colors.white,
    },
    successSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    bookingIdBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 4,
    },
    bookingIdText: {
        color: THEME.colors.white,
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 1,
    },

    content: { padding: 16, gap: 14, paddingBottom: 40 },

    card: {
        backgroundColor: THEME.colors.white,
        borderRadius: 16,
        padding: 16,
        ...THEME.shadows.premium,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.colors.textDark,
        marginBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: THEME.colors.border,
    },
    detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailLabel: { fontSize: 13, color: THEME.colors.textMuted },
    detailValue: { fontSize: 13, fontWeight: '600', color: THEME.colors.textDark },

    smsCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: THEME.colors.success,
    },
    smsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    smsTitle: { fontSize: 13, fontWeight: '700', color: THEME.colors.success, flex: 1 },
    sentBadge: {
        backgroundColor: THEME.colors.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    sentBadgeText: { color: THEME.colors.white, fontSize: 10, fontWeight: '700' },
    smsBubble: {
        backgroundColor: THEME.colors.white,
        borderRadius: 10,
        padding: 12,
    },
    smsText: { fontSize: 12, color: THEME.colors.textDark, lineHeight: 20 },

    earningsCard: {
        backgroundColor: THEME.colors.primaryLight,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    earningsText: { fontSize: 12, color: THEME.colors.primaryDark, flex: 1, lineHeight: 18 },

    stepsCard: {
        backgroundColor: THEME.colors.white,
        borderRadius: 16,
        padding: 16,
        ...THEME.shadows.premium,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: THEME.colors.border,
    },
    stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.colors.bgLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    stepIconDone: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    stepText: { flex: 1, fontSize: 13, color: THEME.colors.textMuted },
    stepTextDone: { color: THEME.colors.textDark, fontWeight: '600' },

    trackBtn: {
        backgroundColor: THEME.colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        ...THEME.shadows.float,
    },
    trackBtnText: { color: THEME.colors.white, fontSize: 15, fontWeight: '800' },

    homeBtn: {
        borderWidth: 1.5,
        borderColor: THEME.colors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    homeBtnText: { color: THEME.colors.primary, fontSize: 14, fontWeight: '600' },
});