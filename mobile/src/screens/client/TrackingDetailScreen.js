import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { serviceAPI } from '../../services/api';
import { THEME } from '../../constants/theme';

const STATUS_STEPS = [
    { key: 'confirmed', label: 'Booking Confirmed', icon: 'checkmark-circle' },
    { key: 'en_route', label: 'Provider En Route', icon: 'car' },
    { key: 'arrived', label: 'Provider Arrived', icon: 'location' },
    { key: 'in_progress', label: 'Service In Progress', icon: 'construct' },
    { key: 'completed', label: 'Service Completed', icon: 'star' },
];

export default function TrackingDetailScreen({ navigation, route }) {
    const { booking } = route.params || {};
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const startTimeRef = useRef(Date.now());

    const [trackingData, setTrackingData] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Start pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        // Initial fetch
        fetchTracking();

        // Poll every 8 seconds
        const interval = setInterval(fetchTracking, 8000);

        return () => clearInterval(interval);
    }, []);

    const fetchTracking = async () => {
        // Calculate step purely based on time elapsed since screen opened
        // This avoids conflict with backend timing
        const secondsElapsed = (Date.now() - startTimeRef.current) / 1000;
        let step = 0;
        if (secondsElapsed > 8) step = 1;
        if (secondsElapsed > 20) step = 2;
        if (secondsElapsed > 35) step = 3;
        if (secondsElapsed > 50) step = 4;

        setCurrentStep(step);

        // Also fetch backend data for display info
        if (booking?.bookingId) {
            try {
                const res = await serviceAPI.getTracking(booking.bookingId);
                setTrackingData(res.data.data);
            } catch (err) {
                console.log('Tracking fetch error:', err.message);
            }
        }

        setLoading(false);
    };

    const handleRateService = () => navigation.navigate('Feedback', { booking });

    const handleGoHome = () =>
        navigation.reset({ index: 0, routes: [{ name: 'ClientTabs' }] });

    return (
        <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={THEME.colors.white} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Live Tracking</Text>
                    <Text style={styles.headerSub}>{booking?.bookingId}</Text>
                </View>
                <View style={[styles.statusBadge, currentStep === 4 && { backgroundColor: THEME.colors.success }]}>
                    <Text style={styles.statusBadgeText}>{currentStep === 4 ? 'Done ✓' : 'Live'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Simulated Map */}
                <View style={styles.mapCard}>
                    <View style={styles.mapPlaceholder}>
                        <View style={styles.mapGrid}>
                            {[...Array(6)].map((_, i) => (
                                <View key={i} style={styles.mapRow}>
                                    {[...Array(6)].map((_, j) => (
                                        <View key={j} style={styles.mapCell} />
                                    ))}
                                </View>
                            ))}
                        </View>

                        <View style={[styles.mapDot, styles.userDot]}>
                            <Ionicons name="home" size={12} color={THEME.colors.white} />
                        </View>

                        <Animated.View style={[
                            styles.mapDot, styles.providerDot,
                            currentStep >= 1 && { transform: [{ scale: pulseAnim }] },
                        ]}>
                            <Ionicons name="car" size={12} color={THEME.colors.white} />
                        </Animated.View>

                        <View style={styles.etaBadge}>
                            <Text style={styles.etaText}>
                                {currentStep === 0 ? 'Confirming...'
                                    : currentStep === 1 ? '~12 min away'
                                        : currentStep === 2 ? 'Arrived!'
                                            : currentStep === 3 ? 'Working...'
                                                : 'Done ✓'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {currentStep < 2 ? '~12' : currentStep < 3 ? '0' : '—'}
                            </Text>
                            <Text style={styles.statLabel}>Min Away</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue} numberOfLines={2}>
                                {STATUS_STEPS[currentStep]?.label}
                            </Text>
                            <Text style={styles.statLabel}>Status</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{booking?.sector}</Text>
                            <Text style={styles.statLabel}>Location</Text>
                        </View>
                    </View>
                </View>

                {/* Progress Steps */}
                <View style={styles.stepsCard}>
                    <Text style={styles.cardTitle}>Booking Progress</Text>
                    {STATUS_STEPS.map((step, index) => {
                        const isDone = index < currentStep;
                        const isActive = index === currentStep;
                        const isPending = index > currentStep;

                        return (
                            <View key={step.key} style={styles.stepRow}>
                                <View style={styles.stepLeft}>
                                    <Animated.View style={[
                                        styles.stepCircle,
                                        isDone && styles.stepCircleDone,
                                        isActive && styles.stepCircleActive,
                                        isPending && styles.stepCirclePending,
                                        isActive && { transform: [{ scale: pulseAnim }] },
                                    ]}>
                                        <Ionicons
                                            name={isDone ? 'checkmark' : step.icon}
                                            size={14}
                                            color={isPending ? THEME.colors.textMuted : THEME.colors.white}
                                        />
                                    </Animated.View>
                                    {index < STATUS_STEPS.length - 1 && (
                                        <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                                    )}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[
                                        styles.stepLabel,
                                        isDone && styles.stepLabelDone,
                                        isActive && styles.stepLabelActive,
                                        isPending && styles.stepLabelPending,
                                    ]}>
                                        {step.label}
                                    </Text>
                                    {isActive && <Text style={styles.stepSubLabel}>Abhi ho raha hai...</Text>}
                                    {isDone && <Text style={styles.stepSubLabelDone}>Completed ✓</Text>}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Completion Checklist */}
                {currentStep === 4 && (
                    <View style={styles.checklistCard}>
                        <Text style={styles.cardTitle}>Service Completion Checklist</Text>
                        {[
                            'Job Completed',
                            'Area Cleaned Up',
                            'Customer Satisfaction Confirmed',
                            'Payment Collected',
                            'Receipt Issued',
                        ].map((item, i) => (
                            <View key={i} style={styles.checkItem}>
                                <View style={styles.checkIcon}>
                                    <Ionicons name="checkmark" size={14} color={THEME.colors.white} />
                                </View>
                                <Text style={styles.checkText}>{item}</Text>
                            </View>
                        ))}
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="camera-outline" size={24} color={THEME.colors.textMuted} />
                            <Text style={styles.photoText}>Photo Evidence Placeholder</Text>
                        </View>
                    </View>
                )}

                {currentStep === 4 ? (
                    <TouchableOpacity style={styles.rateBtn} onPress={handleRateService}>
                        <Ionicons name="star-outline" size={20} color={THEME.colors.white} />
                        <Text style={styles.rateBtnText}>Rate Your Experience</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.waitingCard}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <Ionicons name="time-outline" size={24} color={THEME.colors.primary} />
                        </Animated.View>
                        <Text style={styles.waitingText}>
                            Live updates har 8 seconds mein aate hain
                        </Text>
                    </View>
                )}

                <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
                    <Text style={styles.homeBtnText}>Back To Dashboard</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: THEME.colors.primaryDark,
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: THEME.colors.white },
    headerSub: { fontSize: 12, color: THEME.colors.accent, marginTop: 2 },
    statusBadge: {
        backgroundColor: THEME.colors.urgencyHigh,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    statusBadgeText: { color: THEME.colors.white, fontSize: 11, fontWeight: '700' },

    content: { padding: 16, gap: 14, paddingBottom: 40 },

    mapCard: {
        backgroundColor: THEME.colors.white,
        borderRadius: 16, overflow: 'hidden',
        ...THEME.shadows.premium,
    },
    mapPlaceholder: {
        height: 180, backgroundColor: '#E8F0E8',
        position: 'relative', justifyContent: 'center', alignItems: 'center',
    },
    mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 },
    mapRow: { flex: 1, flexDirection: 'row' },
    mapCell: { flex: 1, borderWidth: 0.5, borderColor: THEME.colors.primary },
    mapDot: {
        position: 'absolute',
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    userDot: { backgroundColor: THEME.colors.primary, bottom: 40, left: '35%' },
    providerDot: { backgroundColor: THEME.colors.urgencyHigh, top: 40, right: '30%' },
    etaBadge: {
        backgroundColor: THEME.colors.primaryDark,
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    },
    etaText: { color: THEME.colors.white, fontSize: 12, fontWeight: '700' },

    statsRow: {
        flexDirection: 'row', padding: 14,
        borderTopWidth: 1, borderTopColor: THEME.colors.border,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 12, fontWeight: '700', color: THEME.colors.textDark, textAlign: 'center' },
    statLabel: { fontSize: 10, color: THEME.colors.textMuted, marginTop: 2, textAlign: 'center' },
    statDivider: { width: 1, backgroundColor: THEME.colors.border },

    stepsCard: {
        backgroundColor: THEME.colors.white,
        borderRadius: 16, padding: 16,
        ...THEME.shadows.premium,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.textDark, marginBottom: 16 },

    stepRow: { flexDirection: 'row', gap: 12, minHeight: 50 },
    stepLeft: { alignItems: 'center', width: 28 },
    stepCircle: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    stepCircleDone: { backgroundColor: THEME.colors.success },
    stepCircleActive: { backgroundColor: THEME.colors.primary },
    stepCirclePending: { backgroundColor: THEME.colors.bgLight, borderWidth: 1, borderColor: THEME.colors.border },
    stepLine: { width: 2, flex: 1, backgroundColor: THEME.colors.border, marginVertical: 4 },
    stepLineDone: { backgroundColor: THEME.colors.success },

    stepContent: { flex: 1, paddingTop: 4, paddingBottom: 12 },
    stepLabel: { fontSize: 13, color: THEME.colors.textMuted },
    stepLabelDone: { color: THEME.colors.textDark, fontWeight: '600' },
    stepLabelActive: { color: THEME.colors.primary, fontWeight: '700' },
    stepLabelPending: { color: THEME.colors.textMuted },
    stepSubLabel: { fontSize: 11, color: THEME.colors.primary, marginTop: 2, fontStyle: 'italic' },
    stepSubLabelDone: { fontSize: 11, color: THEME.colors.success, marginTop: 2 },

    checklistCard: {
        backgroundColor: THEME.colors.white,
        borderRadius: 16, padding: 16,
        ...THEME.shadows.premium,
    },
    checkItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 0.5, borderBottomColor: THEME.colors.border,
    },
    checkIcon: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: THEME.colors.success,
        alignItems: 'center', justifyContent: 'center',
    },
    checkText: { fontSize: 13, color: THEME.colors.textDark, fontWeight: '500' },
    photoPlaceholder: {
        alignItems: 'center', gap: 8, paddingVertical: 16,
        backgroundColor: THEME.colors.bgLight, borderRadius: 10, marginTop: 12,
        borderWidth: 1, borderStyle: 'dashed', borderColor: THEME.colors.border,
    },
    photoText: { fontSize: 12, color: THEME.colors.textMuted },

    rateBtn: {
        backgroundColor: THEME.colors.accent,
        borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10,
        ...THEME.shadows.float,
    },
    rateBtnText: { color: THEME.colors.primaryDark, fontSize: 15, fontWeight: '800' },

    waitingCard: {
        backgroundColor: THEME.colors.primaryLight,
        borderRadius: 12, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    waitingText: { fontSize: 13, color: THEME.colors.primary, flex: 1 },

    homeBtn: {
        borderWidth: 1.5, borderColor: THEME.colors.primary,
        borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    },
    homeBtnText: { color: THEME.colors.primary, fontSize: 14, fontWeight: '600' },
});