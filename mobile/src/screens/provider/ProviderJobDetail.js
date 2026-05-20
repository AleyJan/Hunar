import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator,
    Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { providerAPI } from '../../services/api';
import api from '../../services/api';
import { THEME } from '../../constants/theme';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const STATUS_COLORS = {
    confirmed: THEME.colors.success,
    pending: THEME.colors.urgencyMedium,
    provider_cancelled: THEME.colors.urgencyHigh,
    completed: THEME.colors.primary,
};

export default function ProviderJobDetail({ navigation, route }) {
    const { booking } = route.params || {};

    const [bookingStatus, setBookingStatus] = useState(booking?.status);
    const [loading, setLoading] = useState(false);
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [availOption, setAvailOption] = useState('');
    const [selectedAltSlots, setSelectedAltSlots] = useState([]);
    const [actionDone, setActionDone] = useState(false);
    const [actionResult, setActionResult] = useState(null);

    useEffect(() => {
        const refreshStatus = async () => {
            try {
                const res = await api.get(`/book/${booking.bookingId}`);
                setBookingStatus(res.data.data?.status);
            } catch (err) {
                console.log('Status refresh error:', err.message);
            }
        };
        refreshStatus();
    }, []);

    const handleAccept = async () => {
        Alert.alert(
            'Booking Accept Karein?',
            `${booking.userId?.name} ki booking accept karna chahte hain?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept', onPress: async () => {
                        setLoading(true);
                        try {
                            const res = await providerAPI.acceptBooking(booking.bookingId);
                            setBookingStatus('confirmed');
                            setActionDone(true);
                            setActionResult({ type: 'accepted', data: res.data });
                        } catch (err) {
                            Alert.alert('Error', 'Booking accept nahi hua. Try again.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async () => {
        if (!availOption) {
            Alert.alert('Option Select Karein', 'Pehle availability option choose karein');
            return;
        }
        setLoading(true);
        try {
            const reason = availOption === 'other_slots'
                ? `Provider doosre slots mein available hai: ${selectedAltSlots.join(', ')}. ${rejectReason}`
                : availOption === 'not_today'
                    ? `Provider aaj available nahi. ${rejectReason}`
                    : rejectReason || 'Doosri wajah';

            const res = await providerAPI.rejectBooking(booking.bookingId, {
                reason,
                availabilityType: availOption,
                suggestedSlots: selectedAltSlots,
            });

            setBookingStatus('provider_cancelled');
            setActionDone(true);
            setActionResult({ type: 'rejected', data: res.data, altSlots: selectedAltSlots });
        } catch (err) {
            Alert.alert('Error', 'Booking reject nahi hua. Try again.');
        } finally {
            setLoading(false);
        }
    };

    if (actionDone) {
        const isAccepted = actionResult?.type === 'accepted';
        return (
            <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
                <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={THEME.colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Job {isAccepted ? 'Accepted' : 'Rejected'}</Text>
                </View>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.resultCard}>
                        <Ionicons
                            name={isAccepted ? 'checkmark-circle' : 'close-circle'}
                            size={64}
                            color={isAccepted ? THEME.colors.success : THEME.colors.urgencyHigh}
                        />
                        <Text style={styles.resultTitle}>
                            {isAccepted ? 'Booking Accept Ho Gayi!' : 'Booking Reject Ho Gayi'}
                        </Text>
                        <Text style={styles.resultSub}>
                            {isAccepted
                                ? `User ${booking.userId?.name} ko notify kar diya gaya.`
                                : `User ${booking.userId?.name} ko alternatives ke saath notify kar diya gaya.`}
                        </Text>

                        {!isAccepted && actionResult?.altSlots?.length > 0 && (
                            <View style={styles.altCard}>
                                <Text style={styles.altTitle}>Aapke suggested slots user ko bheje gaye:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                                    {actionResult.altSlots.map(slot => (
                                        <View key={slot} style={styles.altSlotChip}>
                                            <Text style={styles.altSlotText}>{slot}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {!isAccepted && actionResult?.data?.alternatives?.length > 0 && (
                            <View style={styles.altCard}>
                                <Text style={styles.altTitle}>AI ne yeh alternative providers suggest kiye:</Text>
                                {actionResult.data.alternatives.map((p, i) => (
                                    <View key={i} style={styles.altRow}>
                                        <Ionicons name="person-outline" size={14} color={THEME.colors.primary} />
                                        <Text style={styles.altText}>
                                            {p.name} · {p.sector} · ⭐{p.rating} · Rs{p.hourlyRate}/hr
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Dashboard pe Wapas Jao</Text>
                    </TouchableOpacity>
                </ScrollView>
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
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Job Details</Text>
                    <Text style={styles.headerSub}>{booking?.bookingId}</Text>
                </View>
                {/* Live status badge */}
                <View style={[styles.liveBadge, {
                    backgroundColor: bookingStatus === 'confirmed'
                        ? THEME.colors.success + '20'
                        : THEME.colors.urgencyMedium + '20'
                }]}>
                    <Text style={[styles.liveBadgeText, {
                        color: bookingStatus === 'confirmed'
                            ? THEME.colors.success
                            : THEME.colors.urgencyMedium
                    }]}>
                        {bookingStatus?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Customer Details</Text>
                    {[
                        { icon: 'person-outline', value: booking?.userId?.name },
                        { icon: 'call-outline', value: booking?.userId?.phone },
                        { icon: 'location-outline', value: `${booking?.sector} · ${booking?.userId?.sector}` },
                    ].map((item, i) => (
                        <View key={i} style={styles.infoRow}>
                            <Ionicons name={item.icon} size={16} color={THEME.colors.primary} />
                            <Text style={styles.infoText}>{item.value}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Job Details</Text>
                    {[
                        { icon: 'construct-outline', label: 'Service', value: booking?.serviceType?.replace(/_/g, ' ').toUpperCase() },
                        { icon: 'calendar-outline', label: 'Scheduled', value: new Date(booking?.scheduledAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) },
                        { icon: 'flash-outline', label: 'Urgency', value: booking?.urgency?.toUpperCase() },
                        { icon: 'layers-outline', label: 'Complexity', value: booking?.complexity },
                        { icon: 'cash-outline', label: 'Your Earnings', value: `Rs. ${Math.round((booking?.pricing?.totalAmount || 0) * 0.9)} (90%)` },
                    ].map((item, i) => (
                        <View key={i} style={styles.detailRow}>
                            <View style={styles.detailLeft}>
                                <Ionicons name={item.icon} size={14} color={THEME.colors.primary} />
                                <Text style={styles.detailLabel}>{item.label}</Text>
                            </View>
                            <Text style={[
                                styles.detailValue,
                                item.label === 'Your Earnings' && { color: THEME.colors.primary, fontWeight: '800' },
                                item.label === 'Urgency' && booking?.urgency === 'high' && { color: THEME.colors.urgencyHigh },
                            ]}>
                                {item.value}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Price Breakdown</Text>
                    {[
                        { label: 'Base Rate', value: `Rs. ${booking?.pricing?.baseRate}` },
                        { label: 'Distance Fee', value: `Rs. ${booking?.pricing?.distanceFee}` },
                        { label: 'Urgency', value: `Rs. ${booking?.pricing?.urgencyPremium}` },
                        { label: 'Total', value: `Rs. ${booking?.pricing?.totalAmount}`, bold: true },
                        { label: 'Your Share 90%', value: `Rs. ${Math.round((booking?.pricing?.totalAmount || 0) * 0.9)}`, green: true },
                    ].map((item, i) => (
                        <View key={i} style={[styles.detailRow, item.bold && { borderTopWidth: 2, borderTopColor: THEME.colors.primary, marginTop: 4, paddingTop: 8 }]}>
                            <Text style={styles.detailLabel}>{item.label}</Text>
                            <Text style={[
                                styles.detailValue,
                                item.bold && { fontSize: 16, fontWeight: '900' },
                                item.green && { color: THEME.colors.primary, fontWeight: '800' },
                            ]}>
                                {item.value}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Accept/Reject buttons — only show if pending */}
                {(bookingStatus === 'pending') && !showRejectBox && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.acceptBtn, loading && { opacity: 0.6 }]}
                            onPress={handleAccept}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color={THEME.colors.white} />
                                : <><Ionicons name="checkmark-circle-outline" size={20} color={THEME.colors.white} /><Text style={styles.acceptBtnText}>Accept Job</Text></>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowRejectBox(true)}>
                            <Ionicons name="close-circle-outline" size={20} color={THEME.colors.urgencyHigh} />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Already confirmed — show info */}
                {bookingStatus === 'confirmed' && (
                    <View style={styles.confirmedCard}>
                        <Ionicons name="checkmark-circle" size={24} color={THEME.colors.success} />
                        <Text style={styles.confirmedText}>
                            Aap ne yeh booking accept kar li hai. Customer ko notify kar diya gaya.
                        </Text>
                    </View>
                )}

                {/* Reject Box */}
                {showRejectBox && (
                    <View style={styles.rejectCard}>
                        <Text style={styles.rejectTitle}>Kyun reject kar rahe hain?</Text>

                        <Text style={styles.rejectSubTitle}>Kya aap available hain?</Text>
                        <View style={styles.availabilityRow}>
                            {[
                                { key: 'other_slots', label: '✅ Doosre slots mein available hun' },
                                { key: 'not_today', label: '❌ Aaj bilkul available nahi' },
                                { key: 'other_reason', label: '⚠️ Doosri wajah' },
                            ].map(opt => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[styles.availOption, availOption === opt.key && styles.availOptionActive]}
                                    onPress={() => { setAvailOption(opt.key); setSelectedAltSlots([]); }}
                                >
                                    <Text style={[styles.availOptionText, availOption === opt.key && styles.availOptionTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {availOption === 'other_slots' && (
                            <View style={styles.altSlotsSection}>
                                <Text style={styles.rejectSubTitle}>Kaunse slots available hain?</Text>
                                <View style={styles.altSlotsGrid}>
                                    {TIME_SLOTS.map(slot => (
                                        <TouchableOpacity
                                            key={slot}
                                            style={[styles.altSlotBtn, selectedAltSlots.includes(slot) && styles.altSlotBtnActive]}
                                            onPress={() => setSelectedAltSlots(prev =>
                                                prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
                                            )}
                                        >
                                            <Text style={[styles.altSlotText2, selectedAltSlots.includes(slot) && styles.altSlotTextActive2]}>
                                                {slot}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <Text style={[styles.rejectSubTitle, { marginTop: 12 }]}>Wajah (optional)</Text>
                        <TextInput
                            style={styles.rejectInput}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder="Koi aur wajah ho to likhen..."
                            placeholderTextColor={THEME.colors.textMuted}
                            multiline
                            numberOfLines={2}
                        />

                        <View style={styles.rejectActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowRejectBox(false); setAvailOption(''); setSelectedAltSlots([]); }}>
                                <Text style={styles.cancelBtnText}>Wapas Jao</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmRejectBtn, loading && { opacity: 0.6 }]}
                                onPress={handleReject}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color={THEME.colors.white} size="small" />
                                    : <Text style={styles.confirmRejectBtnText}>Reject Karein</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Status info for other statuses */}
                {bookingStatus !== 'pending' && bookingStatus !== 'confirmed' && !showRejectBox && (
                    <View style={styles.statusCard}>
                        <Ionicons
                            name={bookingStatus === 'completed' ? 'checkmark-circle' : 'information-circle'}
                            size={24}
                            color={STATUS_COLORS[bookingStatus] || THEME.colors.textMuted}
                        />
                        <Text style={styles.statusCardText}>
                            Yeh booking already {bookingStatus?.replace(/_/g, ' ')} hai
                        </Text>
                    </View>
                )}

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
    headerTitle: { fontSize: 16, fontWeight: '800', color: THEME.colors.white },
    headerSub: { fontSize: 12, color: THEME.colors.accent, marginTop: 2 },
    liveBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveBadgeText: { fontSize: 9, fontWeight: '800' },
    content: { padding: 16, gap: 14, paddingBottom: 40 },

    card: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16, ...THEME.shadows.premium },
    cardTitle: {
        fontSize: 14, fontWeight: '700', color: THEME.colors.textDark,
        marginBottom: 12, borderBottomWidth: 1, borderBottomColor: THEME.colors.border, paddingBottom: 8,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: THEME.colors.border },
    infoText: { fontSize: 14, color: THEME.colors.textDark, fontWeight: '500' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: THEME.colors.border },
    detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailLabel: { fontSize: 12, color: THEME.colors.textMuted },
    detailValue: { fontSize: 13, fontWeight: '600', color: THEME.colors.textDark },

    actionRow: { flexDirection: 'row', gap: 12 },
    acceptBtn: {
        flex: 1, backgroundColor: THEME.colors.primary, borderRadius: 14, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...THEME.shadows.float,
    },
    acceptBtnText: { color: THEME.colors.white, fontSize: 15, fontWeight: '800' },
    rejectBtn: {
        flex: 0.5, borderWidth: 2, borderColor: THEME.colors.urgencyHigh, borderRadius: 14, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    rejectBtnText: { color: THEME.colors.urgencyHigh, fontSize: 14, fontWeight: '700' },

    confirmedCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: THEME.colors.success,
    },
    confirmedText: { fontSize: 13, color: THEME.colors.success, fontWeight: '600', flex: 1 },

    rejectCard: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16,
        borderWidth: 2, borderColor: THEME.colors.urgencyHigh, ...THEME.shadows.premium,
    },
    rejectTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.textDark, marginBottom: 12 },
    rejectSubTitle: { fontSize: 13, fontWeight: '600', color: THEME.colors.textDark, marginBottom: 8 },

    availabilityRow: { gap: 8, marginBottom: 12 },
    availOption: { padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: THEME.colors.border, backgroundColor: THEME.colors.bgLight },
    availOptionActive: { borderColor: THEME.colors.primary, backgroundColor: THEME.colors.primaryLight },
    availOptionText: { fontSize: 13, color: THEME.colors.textDark },
    availOptionTextActive: { color: THEME.colors.primary, fontWeight: '700' },

    altSlotsSection: { marginBottom: 8 },
    altSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    altSlotBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: THEME.colors.border, backgroundColor: THEME.colors.bgLight },
    altSlotBtnActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    altSlotText2: { fontSize: 12, fontWeight: '600', color: THEME.colors.textDark },
    altSlotTextActive2: { color: THEME.colors.white },

    rejectInput: {
        backgroundColor: THEME.colors.bgLight, borderRadius: 10, padding: 12,
        fontSize: 14, color: THEME.colors.textDark, textAlignVertical: 'top',
        minHeight: 70, borderWidth: 1, borderColor: THEME.colors.border, marginBottom: 12,
    },
    rejectActions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, color: THEME.colors.textMuted, fontWeight: '600' },
    confirmRejectBtn: { flex: 1, backgroundColor: THEME.colors.urgencyHigh, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    confirmRejectBtnText: { fontSize: 14, color: THEME.colors.white, fontWeight: '700' },

    statusCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: THEME.colors.bgLight, borderRadius: 12, padding: 14 },
    statusCardText: { fontSize: 14, color: THEME.colors.textDark, fontWeight: '500' },

    resultCard: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, ...THEME.shadows.premium },
    resultTitle: { fontSize: 20, fontWeight: '900', color: THEME.colors.textDark, textAlign: 'center' },
    resultSub: { fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center', lineHeight: 20 },
    altCard: { backgroundColor: THEME.colors.primaryLight, borderRadius: 10, padding: 12, width: '100%', gap: 8, marginTop: 8 },
    altTitle: { fontSize: 12, fontWeight: '700', color: THEME.colors.primaryDark, marginBottom: 4 },
    altRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    altText: { fontSize: 12, color: THEME.colors.textDark, flex: 1 },
    altSlotChip: { backgroundColor: THEME.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    altSlotText: { color: THEME.colors.white, fontWeight: '700', fontSize: 12 },
    backBtn: { backgroundColor: THEME.colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...THEME.shadows.float },
    backBtnText: { color: THEME.colors.white, fontSize: 15, fontWeight: '800' },
});