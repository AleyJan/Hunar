import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../services/api';
import { THEME } from '../../constants/theme';

const STATUS_COLORS = {
    confirmed: THEME.colors.success,
    pending: THEME.colors.urgencyMedium,
    provider_cancelled: THEME.colors.urgencyHigh,
    completed: THEME.colors.primary,
    disputed: THEME.colors.urgencyHigh,
};

function BookingCard({ booking, onPress }) {
    const statusColor = STATUS_COLORS[booking.status] || THEME.colors.textMuted;
    const isNew = booking.status === 'pending' &&
        (Date.now() - new Date(booking.createdAt).getTime()) < 10 * 60 * 1000;

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(booking)}>
            {isNew && (
                <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW REQUEST</Text>
                </View>
            )}

            <View style={styles.cardHeader}>
                <View style={styles.serviceIcon}>
                    <Ionicons name="construct-outline" size={20} color={THEME.colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.serviceType}>
                        {booking.serviceType?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.userName}>
                        👤 {booking.userId?.name} · 📞 {booking.userId?.phone}
                    </Text>
                    <Text style={styles.location}>
                        📍 {booking.sector} · {new Date(booking.scheduledAt).toLocaleString('en-PK', {
                            dateStyle: 'medium', timeStyle: 'short',
                        })}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {booking.status?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="cash-outline" size={14} color={THEME.colors.primary} />
                    <Text style={styles.footerText}>Rs. {booking.pricing?.totalAmount}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons
                        name="flash-outline" size={14}
                        color={booking.urgency === 'high' ? THEME.colors.urgencyHigh : THEME.colors.textMuted}
                    />
                    <Text style={styles.footerText}>{booking.urgency?.toUpperCase()}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="layers-outline" size={14} color={THEME.colors.textMuted} />
                    <Text style={styles.footerText}>{booking.complexity || ''}</Text>
                </View>
                <TouchableOpacity style={styles.viewBtn} onPress={() => onPress(booking)}>
                    <Text style={styles.viewBtnText}>View</Text>
                    <Ionicons name="arrow-forward" size={12} color={THEME.colors.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

export default function ProviderDashboard({ navigation }) {
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const intervalRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        fetchBookings();
        intervalRef.current = setInterval(fetchBookings, 30000);
        return () => {
            isMounted.current = false;
            clearInterval(intervalRef.current);
        };
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await providerAPI.getBookings();
            if (isMounted.current) setBookings(res.data.data || []);
        } catch (err) {
            if (err.response?.status === 401) {
                clearInterval(intervalRef.current);
                logout();
                return;
            }
            console.log('Bookings fetch error:', err.message);
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    const handleLogout = () => {
        clearInterval(intervalRef.current);
        isMounted.current = false;
        logout();
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const filteredBookings = bookings.filter(b => {
        if (filter === 'all') return true;
        if (filter === 'pending') return b.status === 'pending' || b.status === 'confirmed';
        if (filter === 'completed') return b.status === 'completed';
        if (filter === 'cancelled') return b.status === 'provider_cancelled';
        return true;
    });

    const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;
    const totalEarnings = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0) * 0.9, 0);

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
                    <Text style={styles.headerTitle}>HUNAR Provider</Text>
                    <Text style={styles.headerSub}>{user?.name || ''} · {user?.sector || ''}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color={THEME.colors.accent} />
                        <Text style={styles.ratingText}>{user?.rating || ''}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{completedCount}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNum, { color: THEME.colors.primary }]}>
                        Rs. {Math.round(totalEarnings)}
                    </Text>
                    <Text style={styles.statLabel}>Earned (90%)</Text>
                </View>
            </View>

            {/* HUNAR Smart Insights & Workload Forecasting */}
            <View style={styles.insightsCard}>
                <View style={styles.insightsHeader}>
                    <Ionicons name="trending-up-outline" size={16} color={THEME.colors.accent} />
                    <Text style={styles.insightsTitle}>HUNAR SMART INSIGHTS & DEMAND FORECAST</Text>
                </View>
                <Text style={styles.insightsText}>
                    📈 <Text style={{ fontWeight: '700', color: THEME.colors.accent }}>Demand Forecast:</Text> High customer demand forecasted in <Text style={{ fontWeight: '700', color: THEME.colors.white }}>{user?.sector || 'Islamabad'}</Text> today for <Text style={{ fontWeight: '700', color: THEME.colors.white }}>{user?.services?.[0] || 'Home Services'}</Text>.
                </Text>
                <View style={styles.insightsDivider} />
                <Text style={styles.insightsText}>
                    ⚡ <Text style={{ fontWeight: '700', color: THEME.colors.accent }}>Utilization Slots:</Text> Open slots between <Text style={{ fontWeight: '700', color: THEME.colors.white }}>11:00 AM - 01:00 PM</Text> and <Text style={{ fontWeight: '700', color: THEME.colors.white }}>04:00 PM - 06:00 PM</Text> to balance your workload and maximize earnings by up to 25%.
                </Text>
            </View>

            <View style={styles.filterRow}>
                {['all', 'pending', 'completed', 'cancelled'].map(f => (
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
                        onPress={(b) => navigation.navigate('ProviderJobDetail', { booking: b })}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[THEME.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={THEME.colors.textMuted} />
                        <Text style={styles.emptyTitle}>Koi booking nahi</Text>
                        <Text style={styles.emptySubTitle}>Jab user booking kare ga, yahan dikhega</Text>
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
    headerTitle: { fontSize: 20, fontWeight: '900', color: THEME.colors.white, letterSpacing: 1 },
    headerSub: { fontSize: 12, color: THEME.colors.accent, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },

    insightsCard: {
        backgroundColor: THEME.colors.primaryDark,
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: THEME.colors.accent + '40',
        ...THEME.shadows.premium,
    },
    insightsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    insightsTitle: {
        fontSize: 11,
        fontWeight: '805',
        color: THEME.colors.accent,
        letterSpacing: 0.5,
    },
    insightsText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 16,
    },
    insightsDivider: {
        height: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginVertical: 8,
    },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    ratingText: { color: THEME.colors.white, fontSize: 13, fontWeight: '700' },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: THEME.colors.white,
        borderBottomWidth: 1, borderBottomColor: THEME.colors.border,
    },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statNum: { fontSize: 18, fontWeight: '900', color: THEME.colors.textDark },
    statLabel: { fontSize: 10, color: THEME.colors.textMuted, marginTop: 2 },

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
    newBadge: {
        backgroundColor: THEME.colors.urgencyHigh,
        alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: 20, marginBottom: 8,
    },
    newBadgeText: { color: THEME.colors.white, fontSize: 10, fontWeight: '800' },

    cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    serviceIcon: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: THEME.colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    serviceType: { fontSize: 14, fontWeight: '700', color: THEME.colors.textDark },
    userName: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 },
    location: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '800' },

    cardFooter: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 12, paddingTop: 10,
        borderTopWidth: 0.5, borderTopColor: THEME.colors.border,
        gap: 12,
    },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11, color: THEME.colors.textDark, fontWeight: '600' },
    viewBtn: {
        marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: THEME.colors.primaryLight,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    },
    viewBtnText: { fontSize: 12, color: THEME.colors.primary, fontWeight: '700' },

    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.textDark },
    emptySubTitle: { fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center' },
});