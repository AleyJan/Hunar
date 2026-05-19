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

function BookingCard({ booking, onPress }) {
    const statusColor = STATUS_COLORS[booking.status] || THEME.colors.textMuted;
    const statusIcon = STATUS_ICONS[booking.status] || 'help-outline';

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(booking)}>
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

            {/* Provider cancelled — show suggested slots */}
            {booking.status === 'provider_cancelled' && (
                <View style={styles.cancelledCard}>
                    <Text style={styles.cancelledTitle}>❌ Provider ne reject kar diya</Text>
                    {booking.suggestedSlots?.length > 0 ? (
                        <View>
                            <Text style={styles.cancelledSub}>
                                Provider in slots mein available hai:
                            </Text>
                            <View style={styles.suggestedRow}>
                                {booking.suggestedSlots.map(slot => (
                                    <View key={slot} style={styles.suggestedChip}>
                                        <Text style={styles.suggestedChipText}>⭐ {slot}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={styles.cancelledHint}>
                                Usi provider ko doosre slot pe book karne ke liye AI Assistant use karein
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.cancelledSub}>
                            Doosra provider dhundhne ke liye AI Assistant use karein
                        </Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function TrackingScreen({ navigation }) {
    const { user } = useAuth();
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
                            if (['pending', 'confirmed', 'en_route', 'arrived', 'in_progress'].includes(b.status)) {
                                navigation.navigate('Tracking', { booking: b });
                            } else if (b.status === 'completed' && !b.rating) {
                                navigation.navigate('Feedback', { booking: b });
                            }
                        }}
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
    headerStats: { flexDirection: 'row', gap: 8 },
    statBadge: {
        alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    },
    statNum: { fontSize: 16, fontWeight: '900', color: THEME.colors.white },
    statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)' },

    filterRow: {
        flexDirection: 'row',
        backgroundColor: THEME.colors.white,
        paddingHorizontal: 12, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: THEME.colors.border,
        gap: 6,
    },
    filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME.colors.border },
    filterTabActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    filterText: { fontSize: 12, color: THEME.colors.textMuted, fontWeight: '600' },
    filterTextActive: { color: THEME.colors.white },

    listContent: { padding: 16, gap: 12, paddingBottom: 40 },

    card: {
        backgroundColor: THEME.colors.white,
        borderRadius: 16, padding: 14,
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
        borderTopWidth: 0.5, borderTopColor: THEME.colors.border,
        gap: 10,
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
    cancelledTitle: { fontSize: 12, fontWeight: '700', color: THEME.colors.urgencyHigh, marginBottom: 6 },
    cancelledSub: { fontSize: 11, color: THEME.colors.textMuted, marginBottom: 6 },
    cancelledHint: { fontSize: 10, color: THEME.colors.textMuted, marginTop: 4, fontStyle: 'italic' },
    suggestedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    suggestedChip: {
        backgroundColor: '#FFF8E7',
        borderWidth: 1, borderColor: THEME.colors.accent,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    suggestedChipText: { fontSize: 11, color: THEME.colors.accent, fontWeight: '700' },

    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.textDark },
    emptySubTitle: { fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center' },
    bookNowBtn: { backgroundColor: THEME.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
    bookNowText: { color: THEME.colors.white, fontWeight: '700', fontSize: 14 },
});