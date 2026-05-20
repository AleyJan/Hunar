import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import api from '../../services/api';

const STATUS_CONFIG = {
    open: { color: THEME.colors.urgencyMedium, icon: 'time-outline', label: 'Open' },
    ai_resolved: { color: '#8B5CF6', icon: 'bulb-outline', label: 'AI Resolved' },
    provider_accepted: { color: THEME.colors.success, icon: 'checkmark-circle-outline', label: 'Resolved' },
    provider_rejected: { color: THEME.colors.urgencyHigh, icon: 'close-circle-outline', label: 'Rejected' },
    human_review: { color: '#F97316', icon: 'people-outline', label: 'Human Review' },
    closed: { color: THEME.colors.textMuted, icon: 'lock-closed-outline', label: 'Closed' },
};

const ISSUE_LABELS = {
    overcharge: 'Overcharge',
    no_show: 'No Show',
    poor_quality: 'Poor Quality',
    rude_behavior: 'Rude Behavior',
    cancellation: 'Cancellation',
    overrun: 'Work Overrun',
    other: 'Other',
};

const getDisputeStatusConfig = (dispute) => {
    if (dispute.status === 'human_review') {
        if (dispute.humanResolutionStatus === 'resolved') {
            return { color: THEME.colors.success, icon: 'checkmark-circle-outline', label: 'Human Resolved' };
        }
        return { color: '#F97316', icon: 'people-outline', label: 'Human Referred' };
    }
    if (dispute.status === 'provider_accepted') {
        return { color: THEME.colors.success, icon: 'checkmark-circle-outline', label: 'Issue Resolved' };
    }
    if (dispute.status === 'closed' && dispute.humanResolutionStatus === 'resolved') {
        return { color: THEME.colors.success, icon: 'checkmark-circle-outline', label: 'Human Resolved' };
    }
    return STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
};

function DisputeCard({ dispute, user, onRespond, onAdminResolve }) {
    const config = getDisputeStatusConfig(dispute);
    const isProvider = user?.role === 'provider';

    return (
        <View style={[styles.card, { borderLeftColor: config.color, borderLeftWidth: 4 }]}>
            <View style={styles.cardHeader}>
                <View style={styles.issueIcon}>
                    <Ionicons name="alert-circle-outline" size={18} color={config.color} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.issueType}>{ISSUE_LABELS[dispute.issueType] || dispute.issueType}</Text>
                    <Text style={styles.bookingId}>Booking: {dispute.bookingId}</Text>
                    <Text style={styles.date}>
                        {new Date(dispute.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={12} color={config.color} />
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
            </View>

            {/* AI Resolution */}
            {dispute.resolution && (
                <View style={styles.resolutionBox}>
                    <View style={styles.resolutionHeader}>
                        <Ionicons name="bulb-outline" size={14} color="#8B5CF6" />
                        <Text style={styles.resolutionTitle}>🤖 AI Resolution Plan</Text>
                    </View>
                    <Text style={styles.resolutionText}>{dispute.resolutionReason}</Text>

                    {dispute.resolutionAmount > 0 && (
                        <View style={styles.refundRow}>
                            <Ionicons name="cash-outline" size={14} color={THEME.colors.success} />
                            <Text style={styles.refundText}>
                                Refund: Rs. {dispute.resolutionAmount}
                                {dispute.refundPercentage > 0 ? ` (${dispute.refundPercentage}%)` : ''}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* AI Reasoning */}
            {dispute.aiReasoning && (
                <View style={styles.reasoningBox}>
                    <Text style={styles.reasoningLabel}>AI Mediation Logic:</Text>
                    <Text style={styles.reasoningText} numberOfLines={4}>{dispute.aiReasoning}</Text>
                </View>
            )}

            {/* Provider response status */}
            {dispute.providerResponse && (
                <View style={[styles.providerResponseBox,
                    { backgroundColor: dispute.providerResponse === 'accepted' ? '#F0FDF4' : '#FFF0F0' }
                ]}>
                    <Ionicons
                        name={dispute.providerResponse === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={dispute.providerResponse === 'accepted' ? THEME.colors.success : THEME.colors.urgencyHigh}
                    />
                    <Text style={styles.providerResponseText}>
                        {isProvider
                            ? `Aapne yeh AI decision ${dispute.providerResponse === 'accepted' ? 'ACCEPT' : 'REJECT'} kar dia hai.`
                            : `Provider: ${dispute.providerResponse === 'accepted' ? 'Resolution Accept Ki' : 'Resolution Reject Ki — Human Review Mein'}`}
                    </Text>
                </View>
            )}

            {/* Human review / referred notice */}
            {(dispute.status === 'human_review' || dispute.humanResolutionStatus === 'resolved') && (
                <View style={styles.humanReviewBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Ionicons 
                            name={dispute.humanResolutionStatus === 'resolved' ? 'checkmark-circle-outline' : 'people-outline'} 
                            size={14} 
                            color={dispute.humanResolutionStatus === 'resolved' ? THEME.colors.success : '#F97316'} 
                        />
                        <Text style={[styles.humanReviewText, dispute.humanResolutionStatus === 'resolved' && { color: '#065F46' }]}>
                            {dispute.humanResolutionStatus === 'resolved'
                                ? `👨‍💼 Human Manager Verdict: ${dispute.humanResolutionDetails || 'Resolved successfully.'}`
                                : `⚠️ Referred to Human Review. Team review kar rahi hai. Jald decision ho jayega.`}
                        </Text>
                    </View>

                    {/* Hackathon Admin Resolve Trigger */}
                    {dispute.humanResolutionStatus !== 'resolved' && (
                        <TouchableOpacity 
                            style={styles.adminResolveBtn} 
                            onPress={() => onAdminResolve(dispute._id)}
                        >
                            <Ionicons name="shield-checkmark" size={12} color={THEME.colors.white} />
                            <Text style={styles.adminResolveBtnText}>Demo Admin: Resolve Human Dispute</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Interactive Provider Respond Controls */}
            {isProvider && dispute.status === 'ai_resolved' && !dispute.providerResponse && (
                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.acceptBtn]} 
                        onPress={() => onRespond(dispute._id, 'accepted')}
                    >
                        <Ionicons name="checkmark" size={14} color={THEME.colors.white} />
                        <Text style={styles.actionBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn]} 
                        onPress={() => onRespond(dispute._id, 'rejected')}
                    >
                        <Ionicons name="close" size={14} color={THEME.colors.white} />
                        <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Info row */}
            <View style={styles.providerRow}>
                <Ionicons name={isProvider ? 'person-outline' : 'construct-outline'} size={12} color={THEME.colors.textMuted} />
                <Text style={styles.providerName}>
                    {isProvider 
                        ? `Client: ${dispute.userId?.name} · 📞 ${dispute.userId?.phone}`
                        : `Provider: ${dispute.providerId?.name} · ⭐ ${dispute.providerId?.rating || '0.0'}`}
                </Text>
            </View>
        </View>
    );
}

export default function DisputeScreen() {
    const { user, logout } = useAuth();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchDisputes(); }, []);

    const fetchDisputes = async () => {
        try {
            const res = await api.get('/dispute/my-disputes');
            setDisputes(res.data.data || []);
        } catch (err) {
            console.log('Disputes error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleProviderRespond = async (disputeId, response) => {
        try {
            const res = await api.patch(`/dispute/${disputeId}/provider-respond`, { 
                response,
                note: response === 'accepted' ? 'Accepted AI resolution plan.' : 'Rejected AI plan. Requires human review.'
            });
            Alert.alert(
                'Success', 
                response === 'accepted' 
                    ? 'Aapne AI decision accept kar liya hai! Issue solved.' 
                    : 'Decision rejected. Escalated to human review.'
            );
            fetchDisputes();
        } catch (err) {
            console.log('Provider respond error:', err.message);
            Alert.alert('Error', 'Sufficient permissions nahi hain ya network issue hai.');
        }
    };

    const handleAdminResolve = async (disputeId) => {
        try {
            await api.patch(`/dispute/${disputeId}/admin-resolve`, {
                resolutionDetails: "Manager has reviewed the proof and resolved in client's favor with full refund.",
                refundAmount: 500
            });
            Alert.alert('Demo Admin Success', 'Dispute solved by Human Admin! Notifications dispatched to both.');
            fetchDisputes();
        } catch (err) {
            console.log('Admin resolve error:', err.message);
            Alert.alert('Error', 'Could not mock admin resolution.');
        }
    };

    const filteredDisputes = disputes.filter(d => {
        if (filter === 'all') return true;
        if (filter === 'open') return ['open', 'ai_resolved'].includes(d.status);
        if (filter === 'review') return d.status === 'human_review';
        if (filter === 'closed') return ['provider_accepted', 'closed'].includes(d.status) || d.humanResolutionStatus === 'resolved';
        return true;
    });

    const openCount = disputes.filter(d => ['open', 'ai_resolved'].includes(d.status)).length;
    const reviewCount = disputes.filter(d => d.status === 'human_review' && d.humanResolutionStatus !== 'resolved').length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>
                        {user?.role === 'provider' ? 'Disputes Ledger' : 'My Disputes'}
                    </Text>
                    <Text style={styles.headerSub}>{user?.name} · {user?.role?.toUpperCase()}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.headerStats}>
                        {openCount > 0 && (
                            <View style={styles.statBadge}>
                                <Text style={styles.statNum}>{openCount}</Text>
                                <Text style={styles.statLabel}>Action</Text>
                            </View>
                        )}
                        {reviewCount > 0 && (
                            <View style={[styles.statBadge, { backgroundColor: 'rgba(249,115,22,0.2)' }]}>
                                <Text style={[styles.statNum, { color: '#F97316' }]}>{reviewCount}</Text>
                                <Text style={styles.statLabel}>Referred</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.filterRow}>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'open', label: 'Action Required' },
                    { key: 'review', label: 'Human Review' },
                    { key: 'closed', label: 'Closed' },
                ].map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredDisputes}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchDisputes(); }}
                        colors={[THEME.colors.primary]}
                    />
                }
                renderItem={({ item }) => (
                    <DisputeCard 
                        dispute={item} 
                        user={user} 
                        onRespond={handleProviderRespond} 
                        onAdminResolve={handleAdminResolve}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="shield-checkmark-outline" size={48} color={THEME.colors.textMuted} />
                        <Text style={styles.emptyTitle}>Koi dispute nahi</Text>
                        <Text style={styles.emptySubTitle}>
                            {user?.role === 'provider'
                                ? 'Mubarak ho! Aap ke khilaf koi dispute active nahi hai.'
                                : 'Service complete hone ke baad Rate Your Experience se dispute file karein'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.colors.bgLight },

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
    filterTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME.colors.border },
    filterTabActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    filterText: { fontSize: 11, color: THEME.colors.textMuted, fontWeight: '600' },
    filterTextActive: { color: THEME.colors.white },

    listContent: { padding: 16, gap: 12, paddingBottom: 40 },

    card: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: THEME.colors.border, ...THEME.shadows.premium,
    },
    cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
    issueIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: THEME.colors.bgLight,
        alignItems: 'center', justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    issueType: { fontSize: 14, fontWeight: '700', color: THEME.colors.textDark },
    bookingId: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 1 },
    date: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 1 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    statusText: { fontSize: 9, fontWeight: '800' },

    resolutionBox: {
        backgroundColor: '#F5F3FF', borderRadius: 10, padding: 10, marginBottom: 8,
    },
    resolutionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    resolutionTitle: { fontSize: 12, fontWeight: '700', color: '#8B5CF6' },
    resolutionText: { fontSize: 12, color: THEME.colors.textDark, lineHeight: 18 },
    refundRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    refundText: { fontSize: 13, fontWeight: '700', color: THEME.colors.success },

    reasoningBox: {
        backgroundColor: THEME.colors.bgLight, borderRadius: 8, padding: 8, marginBottom: 8,
    },
    reasoningLabel: { fontSize: 10, fontWeight: '700', color: THEME.colors.textMuted, marginBottom: 4 },
    reasoningText: { fontSize: 11, color: THEME.colors.textMuted, lineHeight: 16 },

    providerResponseBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 8, padding: 8, marginBottom: 8,
    },
    providerResponseText: { fontSize: 12, fontWeight: '600', color: THEME.colors.textDark, flex: 1 },

    humanReviewBox: {
        flexDirection: 'column', gap: 8,
        backgroundColor: '#FFF4ED', borderRadius: 8, padding: 8, marginBottom: 8,
        borderWidth: 1, borderColor: '#F97316',
    },
    humanReviewText: { fontSize: 11, color: '#92400E', flex: 1, lineHeight: 16 },

    actionRow: {
        flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 8,
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10,
    },
    acceptBtn: { backgroundColor: THEME.colors.success },
    rejectBtn: { backgroundColor: THEME.colors.urgencyHigh },
    actionBtnText: { color: THEME.colors.white, fontSize: 12, fontWeight: '800' },

    adminResolveBtn: {
        backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 8, marginTop: 6, alignSelf: 'flex-start',
    },
    adminResolveBtnText: { color: THEME.colors.white, fontSize: 10, fontWeight: '700' },

    providerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingTop: 8, borderTopWidth: 0.5, borderTopColor: THEME.colors.border,
    },
    providerName: { fontSize: 11, color: THEME.colors.textMuted },

    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.textDark },
    emptySubTitle: { fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});