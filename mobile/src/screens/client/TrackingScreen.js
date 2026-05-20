import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import api from '../../services/api';

const STATUS_COLORS = {
    pending: THEME.colors.urgencyMedium,
    confirmed: THEME.colors.success,
    en_route: '#0EA5E9',
    arrived: '#0EA5E9',
    in_progress: THEME.colors.primary,
    completed: THEME.colors.primary,
    cancelled: THEME.colors.urgencyHigh,
    provider_cancelled: THEME.colors.urgencyHigh,
    disputed: THEME.colors.urgencyHigh,
};

const STATUS_ICONS = {
    pending: 'time-outline',
    confirmed: 'checkmark-circle-outline',
    en_route: 'car-outline',
    arrived: 'location-outline',
    in_progress: 'construct-outline',
    completed: 'star-outline',
    cancelled: 'close-circle-outline',
    provider_cancelled: 'close-circle-outline',
    disputed: 'alert-circle-outline',
};

function AltProviderCard({ provider, onBook }) {
    return (
        <TouchableOpacity style={styles.altProviderCard} onPress={() => onBook(provider)}>
            <View style={styles.altProviderAvatar}>
                <Text style={styles.altProviderAvatarText}>
                    {provider.name?.slice(0, 2).toUpperCase()}
                </Text>
            </View>
            <View style={styles.altProviderInfo}>
                <Text style={styles.altProviderName}>{provider.name}</Text>
                <Text style={styles.altProviderMeta}>
                    {provider.sector} · ⭐{provider.rating} · Rs{provider.hourlyRate}/hr
                </Text>
            </View>
            <View style={styles.altProviderScore}>
                <Text style={styles.altProviderScoreNum}>{provider.aiScore || provider.score}</Text>
                <Text style={styles.altProviderScoreLabel}>AI Score</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={THEME.colors.primary} />
        </TouchableOpacity>
    );
}

function BookingCard({ booking, onPress, onBookAlternative }) {
    const statusColor = STATUS_COLORS[booking.status] || THEME.colors.textMuted;
    const statusIcon = STATUS_ICONS[booking.status] || 'help-outline';

    const [altProviders, setAltProviders] = useState([]);
    const [loadingAlt, setLoadingAlt] = useState(false);
    const [showAlt, setShowAlt] = useState(false);
    const [altLoaded, setAltLoaded] = useState(false);

    const fetchAlternatives = async () => {
        if (altLoaded) { setShowAlt(true); return; }
        setShowAlt(true);
        setLoadingAlt(true);
        try {
            const res = await api.post('/match', {
                service: booking.serviceType,
                location: booking.sector,
                urgency: booking.urgency || 'medium',
            });
            setAltProviders(res.data.data?.top3?.slice(0, 3) || []);
            setAltLoaded(true);
        } catch (err) {
            console.log('Alt providers error:', err.message);
        } finally {
            setLoadingAlt(false);
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(booking)}
            activeOpacity={['cancelled', 'provider_cancelled'].includes(booking.status) ? 1 : 0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.serviceIcon}>
                    <Ionicons name="construct-outline" size={18} color={THEME.colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.serviceType}>
                        {booking.serviceType?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.bookingId}>{booking.bookingId}</Text>
                    <Text style={styles.scheduledAt}>
                        📅 {new Date(booking.scheduledAt).toLocaleString('en-PK', {
                            dateStyle: 'medium', timeStyle: 'short',
                        })}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={statusIcon} size={12} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {booking.status?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.amount}>Rs. {booking.pricing?.totalAmount}</Text>
                <Text style={styles.sector}>📍 {booking.sector}</Text>
                {booking.status === 'pending' && (
                    <View style={styles.pendingChip}>
                        <Text style={styles.pendingChipText}>Awaiting Provider</Text>
                    </View>
                )}
                {booking.status === 'completed' && (
                    <View style={styles.completedChip}>
                        <Text style={styles.completedChipText}>
                            {booking.rating ? `⭐ ${booking.rating}` : 'Rate it'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Provider cancelled */}
            {booking.status === 'provider_cancelled' && (
                <View style={styles.cancelledCard}>
                    <Text style={styles.cancelledTitle}>❌ Provider ne reject kar diya</Text>

                    {/* Suggested slots */}
                    {booking.suggestedSlots?.length > 0 && (
                        <View style={styles.suggestedSlotsSection}>
                            <Text style={styles.cancelledSub}>Provider in slots mein available hai:</Text>
                            <View style={styles.suggestedRow}>
                                {booking.suggestedSlots.map(slot => (
                                    <View key={slot} style={styles.suggestedChip}>
                                        <Text style={styles.suggestedChipText}>⭐ {slot}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Load alternatives on demand */}
                    <TouchableOpacity style={styles.showAltBtn} onPress={fetchAlternatives}>
                        <Ionicons name="search-outline" size={14} color={THEME.colors.primary} />
                        <Text style={styles.showAltBtnText}>
                            {showAlt ? 'Alternative Providers' : 'AI se Alternative Providers Dhundho'}
                        </Text>
                        {!showAlt && <Ionicons name="chevron-down" size={14} color={THEME.colors.primary} />}
                    </TouchableOpacity>

                    {showAlt && (
                        <View style={styles.altProvidersSection}>
                            {loadingAlt ? (
                                <View style={styles.altLoadingRow}>
                                    <ActivityIndicator size="small" color={THEME.colors.primary} />
                                    <Text style={styles.altLoadingText}>AI providers dhundh raha hai...</Text>
                                </View>
                            ) : altProviders.length > 0 ? (
                                altProviders.map((p, i) => (
                                    <AltProviderCard
                                        key={i}
                                        provider={p}
                                        onBook={(provider) => onBookAlternative(booking, provider)}
                                    />
                                ))
                            ) : (
                                <Text style={styles.cancelledSub}>
                                    Koi alternative provider nahi mila. Kal subah try karein.
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* Cancelled by user */}
            {booking.status === 'cancelled' && (
                <View style={styles.cancelledCard}>
                    <Text style={styles.cancelledTitle}>🚫 Booking Cancel Ho Gayi</Text>
                    <Text style={styles.cancelledSub}>
                        {booking.cancellationReason || 'Aap ne yeh booking cancel ki thi'}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function TrackingScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/book/my-bookings');
            setBookings(res.data.data || []);
        } catch (err) {
            console.log('Bookings fetch error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => { setRefreshing(true); fetchBookings(); };

    const handleBookAlternative = (originalBooking, provider) => {
        const parsed = {
            service: originalBooking.serviceType,
            sector: originalBooking.sector,
            urgency: originalBooking.urgency || 'medium',
            complexity: originalBooking.complexity || 'intermediate',
        };
        navigation.navigate('Booking', { provider, parsed, pricing: null });
    };

    const filteredBookings = bookings.filter(b => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['pending', 'confirmed', 'en_route', 'arrived', 'in_progress'].includes(b.status);
        if (filter === 'completed') return b.status === 'completed';
        if (filter === 'cancelled') return ['cancelled', 'provider_cancelled'].includes(b.status);
        return true;
    });

    const activeCount = bookings.filter(b => ['pending', 'confirmed', 'en_route', 'arrived', 'in_progress'].includes(b.status)).length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;
    const cancelledCount = bookings.filter(b => ['cancelled', 'provider_cancelled'].includes(b.status)).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Text style={styles.loadingText}>Aapki bookings load ho rahi hain...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Bookings</Text>
                    <Text style={styles.headerSub}>{user?.name}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.headerStats}>
                        <View style={styles.statBadge}>
                            <Text style={styles.statNum}>{activeCount}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                        <View style={styles.statBadge}>
                            <Text style={styles.statNum}>{completedCount}</Text>
                            <Text style={styles.statLabel}>Done</Text>
                        </View>
                        {cancelledCount > 0 && (
                            <View style={[styles.statBadge, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                                <Text style={[styles.statNum, { color: THEME.colors.urgencyHigh }]}>{cancelledCount}</Text>
                                <Text style={styles.statLabel}>Cancelled</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.filterRow}>
                {['all', 'active', 'completed', 'cancelled'].map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredBookings}
                keyExtractor={item => item.bookingId}
                renderItem={({ item }) => (
                    <BookingCard
                        booking={item}
                        onPress={(b) => {
                            const navigable = ['pending', 'confirmed', 'en_route', 'arrived', 'in_progress', 'completed'];
                            if (navigable.includes(b.status)) {
                                navigation.navigate('Tracking', { booking: b });
                            }
                        }}
                        onBookAlternative={handleBookAlternative}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={THEME.colors.textMuted} />
                        <Text style={styles.emptyTitle}>Koi booking nahi</Text>
                        <Text style={styles.emptySubTitle}>AI Assistant se pehli booking karein</Text>
                        <TouchableOpacity
                            style={styles.bookNowBtn}
                            onPress={() => navigation.navigate('AI Assistant')}
                        >
                            <Text style={styles.bookNowText}>Booking Karein</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: THEME.colors.bgLight, gap: 12,
    },
    loadingText: { fontSize: 14, color: THEME.colors.textMuted },

    header: {
        backgroundColor: THEME.colors.primaryDark,
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: THEME.colors.white },
    headerSub: { fontSize: 12, color: THEME.colors.accent, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoutBtn: { padding: 4 },
    headerStats: { flexDirection: 'row', gap: 8 },
    statBadge: {
        alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    },
    statNum: { fontSize: 16, fontWeight: '900', color: THEME.colors.white },
    statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)' },

    filterRow: {
        flexDirection: 'row', backgroundColor: THEME.colors.white,
        paddingHorizontal: 12, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: THEME.colors.border, gap: 6,
    },
    filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME.colors.border },
    filterTabActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    filterText: { fontSize: 12, color: THEME.colors.textMuted, fontWeight: '600' },
    filterTextActive: { color: THEME.colors.white },

    listContent: { padding: 16, gap: 12, paddingBottom: 40 },

    card: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: THEME.colors.border,
        ...THEME.shadows.premium, marginBottom: 4,
    },
    cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    serviceIcon: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: THEME.colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    serviceType: { fontSize: 14, fontWeight: '700', color: THEME.colors.textDark },
    bookingId: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 1 },
    scheduledAt: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 2 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    statusText: { fontSize: 9, fontWeight: '800' },

    cardFooter: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 10, paddingTop: 10,
        borderTopWidth: 0.5, borderTopColor: THEME.colors.border, gap: 10,
    },
    amount: { fontSize: 13, fontWeight: '700', color: THEME.colors.primary },
    sector: { fontSize: 12, color: THEME.colors.textMuted, flex: 1 },
    pendingChip: { backgroundColor: THEME.colors.urgencyMedium + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    pendingChipText: { fontSize: 10, color: THEME.colors.urgencyMedium, fontWeight: '700' },
    completedChip: { backgroundColor: THEME.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    completedChipText: { fontSize: 10, color: THEME.colors.primary, fontWeight: '700' },

    cancelledCard: {
        marginTop: 10, paddingTop: 10,
        borderTopWidth: 0.5, borderTopColor: THEME.colors.border,
    },
    cancelledTitle: { fontSize: 12, fontWeight: '700', color: THEME.colors.urgencyHigh, marginBottom: 8 },
    cancelledSub: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 4 },

    suggestedSlotsSection: { marginBottom: 8 },
    suggestedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    suggestedChip: {
        backgroundColor: '#FFF8E7',
        borderWidth: 1, borderColor: THEME.colors.accent,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    suggestedChipText: { fontSize: 11, color: THEME.colors.accent, fontWeight: '700' },

    showAltBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: THEME.colors.primaryLight,
        borderRadius: 10, padding: 10, marginTop: 8,
    },
    showAltBtnText: { fontSize: 12, color: THEME.colors.primary, fontWeight: '600', flex: 1 },

    altProvidersSection: { gap: 8, marginTop: 8 },
    altLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
    altLoadingText: { fontSize: 12, color: THEME.colors.textMuted },

    altProviderCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: THEME.colors.primaryLight,
        borderRadius: 12, padding: 10,
        borderWidth: 1, borderColor: THEME.colors.primary + '30',
    },
    altProviderAvatar: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: THEME.colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    altProviderAvatarText: { color: THEME.colors.white, fontWeight: '800', fontSize: 12 },
    altProviderInfo: { flex: 1 },
    altProviderName: { fontSize: 13, fontWeight: '700', color: THEME.colors.textDark },
    altProviderMeta: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 2 },
    altProviderScore: { alignItems: 'center', marginRight: 4 },
    altProviderScoreNum: { fontSize: 18, fontWeight: '900', color: THEME.colors.primary },
    altProviderScoreLabel: { fontSize: 9, color: THEME.colors.textMuted },

    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.textDark },
    emptySubTitle: { fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center' },
    bookNowBtn: { backgroundColor: THEME.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
    bookNowText: { color: THEME.colors.white, fontWeight: '700', fontSize: 14 },
});