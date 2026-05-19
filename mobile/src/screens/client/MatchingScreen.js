import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { serviceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import ReasoningTraceBox from '../../components/ReasoningTraceBox';
import DynamicInvoice from '../../components/DynamicInvoice';

function ProviderCard({ provider, index, onSelect, isTopPick }) {
    const [expanded, setExpanded] = useState(false);
    const riskColor = {
        low: THEME.colors.success,
        medium: THEME.colors.urgencyMedium,
        high: THEME.colors.urgencyHigh,
    }[provider.riskFlag] || THEME.colors.textMuted;

    return (
        <View style={[styles.card, isTopPick && styles.topPickCard]}>
            {isTopPick && (
                <View style={styles.topPickBadge}>
                    <Ionicons name="star" size={11} color={THEME.colors.primaryDark} />
                    <Text style={styles.topPickText}>Top Pick</Text>
                </View>
            )}

            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: ['#0B6623', '#D4AF37', '#0EA5E9'][index % 3] }]}>
                    <Text style={styles.avatarText}>{provider.name?.slice(0, 2).toUpperCase()}</Text>
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    <Text style={styles.providerMeta}>
                        {provider.sector} · {provider.distanceKm?.toFixed(1)} km · ~{provider.travelTimeMinutes} min
                    </Text>
                    <View style={styles.pillRow}>
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>⭐ {provider.rating}</Text>
                        </View>
                        <View style={[styles.pill, { backgroundColor: riskColor + '20' }]}>
                            <Text style={[styles.pillText, { color: riskColor }]}>Risk: {provider.riskFlag}</Text>
                        </View>
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>⏱ {provider.onTimeRate}%</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.scoreBox}>
                    <Text style={styles.scoreNum}>{provider.aiScore || provider.score}</Text>
                    <Text style={styles.scoreLabel}>AI Score</Text>
                </View>
            </View>

            {provider.aiReason && (
                <View style={styles.reasonBox}>
                    <Ionicons name="bulb-outline" size={13} color={THEME.colors.accent} />
                    <Text style={styles.reasonText}>{provider.aiReason}</Text>
                </View>
            )}

            <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(!expanded)}>
                <Text style={styles.expandText}>{expanded ? 'Kam dikhao' : 'Aur details dekho'}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={THEME.colors.primary} />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hourly Rate</Text>
                        <Text style={styles.detailValue}>Rs. {provider.hourlyRate}/hr</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Experience</Text>
                        <Text style={styles.detailValue}>{provider.experienceYears} years</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Cancel Rate</Text>
                        <Text style={styles.detailValue}>{(provider.cancellationRate * 100).toFixed(0)}%</Text>
                    </View>
                    {provider.certifications?.length > 0 && (
                        <View style={styles.certRow}>
                            {provider.certifications.map((c, i) => (
                                <View key={i} style={styles.certChip}>
                                    <Text style={styles.certText}>✓ {c}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <TouchableOpacity style={styles.selectBtn} onPress={() => onSelect(provider)}>
                <Text style={styles.selectBtnText}>Select — Rs. {provider.priceEst || provider.hourlyRate}</Text>
                <Ionicons name="arrow-forward" size={16} color={THEME.colors.white} />
            </TouchableOpacity>
        </View>
    );
}

export default function MatchingScreen({ navigation, route }) {
    const { parsed } = route.params || {};
    const { user } = useAuth();

    const [providers, setProviders] = useState([]);
    const [pricing, setPricing] = useState(null);
    const [trace, setTrace] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchMatches(); }, []);

    const fetchMatches = async () => {
        try {
            const rawService = parsed?.service || 'ac_repair';

            // Handle comma-separated string like "ac_repair, electrical"
            const serviceToMatch = typeof rawService === 'string' && rawService.includes(',')
                ? rawService.split(',')[0].trim()
                : Array.isArray(rawService)
                    ? rawService[0]
                    : rawService;

            const res = await serviceAPI.matchProviders({
                service: serviceToMatch,
                location: parsed?.sector || user?.sector || 'G-13',
                urgency: parsed?.urgency || 'medium',
                budgetSensitive: parsed?.budgetSensitivity === 'price_sensitive',
                userId: user?.id,
                multipleServices: parsed?.multipleServices || false,
            });

            const data = res.data.data;
            setProviders(data.top3 || []);
            setPricing(data.pricing);
            setTrace(data.reasoningTrace?.[0]);
        } catch (err) {
            console.log('Match error:', err.message);
            Alert.alert('Error', 'Providers load nahi ho sake. Backend check karein.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProvider = (provider) => {
        navigation.navigate('Booking', { provider, parsed, pricing });
    };

    const rawService = parsed?.service || 'Service';
    const serviceDisplay = typeof rawService === 'string' && rawService.includes(',')
        ? rawService.split(',').map(s => s.trim()).join(' + ')
        : Array.isArray(rawService)
            ? rawService.join(' + ')
            : rawService?.replace(/_/g, ' ') || 'Service';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Text style={styles.loadingText}>AI best providers dhundh raha hai...</Text>
                <Text style={styles.loadingSubText}>7 factors pe scoring ho rahi hai</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={THEME.colors.white} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{providers.length} Providers Found</Text>
                    <Text style={styles.headerSub}>
                        {serviceDisplay} · {parsed?.sector || user?.sector}
                    </Text>
                </View>
                <View style={[
                    styles.urgencyBadge,
                    parsed?.urgency === 'high' && { backgroundColor: THEME.colors.urgencyHigh },
                    parsed?.urgency === 'medium' && { backgroundColor: THEME.colors.urgencyMedium },
                    parsed?.urgency === 'low' && { backgroundColor: THEME.colors.urgencyLow },
                ]}>
                    <Text style={styles.urgencyText}>{(parsed?.urgency || 'medium').toUpperCase()}</Text>
                </View>
            </View>

            {parsed?.multipleServices && (
                <View style={styles.multiServiceBanner}>
                    <Ionicons name="layers-outline" size={16} color={THEME.colors.primary} />
                    <Text style={styles.multiServiceText}>
                        Multiple services detected — showing providers for {serviceDisplay}
                    </Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {trace && <ReasoningTraceBox trace={trace} />}

                {providers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={THEME.colors.textMuted} />
                        <Text style={styles.emptyTitle}>Koi provider nahi mila</Text>
                        <Text style={styles.emptySubTitle}>
                            Is waqt koi available nahi. Kal subah try karein ya doosra area select karein.
                        </Text>
                    </View>
                ) : (
                    providers.map((provider, index) => (
                        <ProviderCard
                            key={provider.providerId || index}
                            provider={provider}
                            index={index}
                            isTopPick={index === 0}
                            onSelect={handleSelectProvider}
                        />
                    ))
                )}

                {pricing && (
                    <DynamicInvoice pricing={{
                        ...pricing,
                        distanceKm: providers[0]?.distanceKm,
                    }} />
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: THEME.colors.bgLight,
    },
    loadingText: { fontSize: 16, fontWeight: '700', color: THEME.colors.textDark, marginTop: 16 },
    loadingSubText: { fontSize: 13, color: THEME.colors.textMuted, marginTop: 6 },

    header: {
        backgroundColor: THEME.colors.primaryDark,
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: THEME.colors.white },
    headerSub: { fontSize: 12, color: THEME.colors.accent, marginTop: 2 },
    urgencyBadge: {
        backgroundColor: THEME.colors.urgencyMedium,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    urgencyText: { color: THEME.colors.white, fontSize: 10, fontWeight: '800' },

    multiServiceBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: THEME.colors.primaryLight,
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: THEME.colors.border,
    },
    multiServiceText: { fontSize: 12, color: THEME.colors.primary, fontWeight: '600', flex: 1 },

    scrollContent: { padding: 16, gap: 12 },

    card: {
        backgroundColor: THEME.colors.white,
        borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: THEME.colors.border,
        ...THEME.shadows.premium, marginBottom: 12,
    },
    topPickCard: { borderColor: THEME.colors.primary, borderWidth: 2 },
    topPickBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: THEME.colors.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, marginBottom: 10,
    },
    topPickText: { color: THEME.colors.white, fontSize: 11, fontWeight: '700' },

    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    avatar: {
        width: 46, height: 46, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: THEME.colors.white, fontWeight: '800', fontSize: 15 },
    cardInfo: { flex: 1 },
    providerName: { fontSize: 15, fontWeight: '700', color: THEME.colors.textDark },
    providerMeta: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 2 },
    pillRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
    pill: {
        backgroundColor: THEME.colors.bgLight,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 20, borderWidth: 1, borderColor: THEME.colors.border,
    },
    pillText: { fontSize: 11, color: THEME.colors.textDark, fontWeight: '600' },
    scoreBox: { alignItems: 'center' },
    scoreNum: { fontSize: 24, fontWeight: '900', color: THEME.colors.primary },
    scoreLabel: { fontSize: 9, color: THEME.colors.textMuted, textAlign: 'center' },

    reasonBox: {
        flexDirection: 'row', gap: 6,
        backgroundColor: '#FFF8E7', borderRadius: 8,
        padding: 8, marginTop: 10,
        borderLeftWidth: 3, borderLeftColor: THEME.colors.accent,
    },
    reasonText: { fontSize: 11, color: THEME.colors.textDark, flex: 1, lineHeight: 16 },

    expandBtn: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 4,
        paddingVertical: 8, marginTop: 8,
    },
    expandText: { fontSize: 12, color: THEME.colors.primary, fontWeight: '600' },
    expandedContent: { marginTop: 8, gap: 6 },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 0.5, borderBottomColor: THEME.colors.border,
    },
    detailLabel: { fontSize: 12, color: THEME.colors.textMuted },
    detailValue: { fontSize: 12, fontWeight: '600', color: THEME.colors.textDark },
    certRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
    certChip: {
        backgroundColor: THEME.colors.primaryLight,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    certText: { fontSize: 11, color: THEME.colors.primary, fontWeight: '600' },

    selectBtn: {
        backgroundColor: THEME.colors.primary,
        borderRadius: 12, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8, marginTop: 12,
        ...THEME.shadows.float,
    },
    selectBtnText: { color: THEME.colors.white, fontSize: 14, fontWeight: '700' },

    emptyState: { alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.textDark, marginTop: 16 },
    emptySubTitle: { fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center', marginTop: 8 },
});