import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { serviceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import DynamicInvoice from '../../components/DynamicInvoice';

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
];

export default function BookingScreen({ navigation, route }) {
    const { provider, parsed, pricing } = route.params || {};
    const { user } = useAuth();

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [priceData, setPriceData] = useState(pricing);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [rejectedSlots, setRejectedSlots] = useState([]);
    const [suggestedSlots, setSuggestedSlots] = useState([]);
    const [unavailableToday, setUnavailableToday] = useState(false);

    useEffect(() => {
        if (provider && !priceData) fetchPrice();
        fetchBookedSlots();
    }, []);

    const fetchPrice = async () => {
        try {
            const res = await serviceAPI.getPrice({
                providerId: provider.providerId,
                service: parsed?.service,
                urgency: parsed?.urgency || 'medium',
                distanceKm: provider.distanceKm,
                userId: user?.id,
                jobComplexity: provider.complexity || 'intermediate',
            });
            setPriceData(res.data.data?.pricing || res.data.pricing);
        } catch (err) {
            console.log('Price fetch error:', err.message);
        }
    };

    const fetchBookedSlots = async () => {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const date = tomorrow.toISOString().split('T')[0];
            const res = await serviceAPI.getBookedSlots(provider.providerId, date);
            console.log('Booked slots response:', JSON.stringify(res.data));
            setBookedSlots(res.data.bookedSlots || []);
            setRejectedSlots(res.data.rejectedSlots || []);
            setSuggestedSlots(res.data.suggestedSlots || []);
            setUnavailableToday(res.data.providerUnavailableToday || false);
        } catch (err) {
            console.log('Booked slots error:', err.message);
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedSlot) {
            Alert.alert('Slot Select Karein', 'Pehle ek time slot choose karein');
            return;
        }
        setLoading(true);
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const [hours, minutes] = selectedSlot.split(':');
            tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const res = await serviceAPI.bookProvider({
                providerId: provider.providerId,
                serviceType: parsed?.service || 'ac_repair',
                scheduledAt: tomorrow.toISOString(),
                sector: parsed?.sector || user?.sector || 'G-13',
                complexity: provider.complexity || 'intermediate',
                urgency: parsed?.urgency || 'medium',
                pricing: {
                    baseRate: priceData?.baseRate || provider.hourlyRate,
                    distanceFee: priceData?.distanceFee || 0,
                    urgencyPremium: priceData?.urgencyPremium || 0,
                    loyaltyDiscount: priceData?.loyaltyDiscount || 0,
                    complexityMultiplier: priceData?.complexityMultiplier || 1,
                    surgeMultiplier: priceData?.surgeMultiplier || 1,
                    totalAmount: priceData?.totalAmount || provider.hourlyRate,
                },
            });

            const booking = res.data.data?.booking || res.data.booking;
            const sms = res.data.data?.smsSimulation || {};
            navigation.navigate('BookingConfirmed', { booking, sms, provider });

        } catch (err) {
            Alert.alert('Booking Failed', err.response?.data?.message || 'Kuch masla hua.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={THEME.colors.white} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Booking Confirm Karein</Text>
                    <Text style={styles.headerSub}>{provider?.name}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.providerCard}>
                    <View style={styles.providerHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{provider?.name?.slice(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={styles.providerInfo}>
                            <Text style={styles.providerName}>{provider?.name}</Text>
                            <Text style={styles.providerMeta}>
                                {provider?.sector} · {provider?.distanceKm?.toFixed(1)} km away
                            </Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}><Text style={styles.badgeText}>⭐ {provider?.rating}</Text></View>
                                <View style={styles.badge}><Text style={styles.badgeText}>⏱ {provider?.onTimeRate}% on-time</Text></View>
                                <View style={styles.badge}><Text style={styles.badgeText}>AI Score: {provider?.aiScore}</Text></View>
                            </View>
                        </View>
                    </View>

                    {provider?.certifications?.length > 0 && (
                        <View style={styles.certRow}>
                            {provider.certifications.map((c, i) => (
                                <View key={i} style={styles.certChip}>
                                    <Ionicons name="checkmark-circle" size={12} color={THEME.colors.primary} />
                                    <Text style={styles.certText}>{c}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.serviceRow}>
                        <View style={styles.serviceItem}>
                            <Text style={styles.serviceLabel}>Service</Text>
                            <Text style={styles.serviceValue}>{parsed?.service?.replace(/_/g, ' ').toUpperCase()}</Text>
                        </View>
                        <View style={styles.serviceItem}>
                            <Text style={styles.serviceLabel}>Urgency</Text>
                            <Text style={[styles.serviceValue, {
                                color: parsed?.urgency === 'high' ? THEME.colors.urgencyHigh : THEME.colors.textDark,
                            }]}>
                                {parsed?.urgency?.toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.serviceItem}>
                            <Text style={styles.serviceLabel}>Location</Text>
                            <Text style={styles.serviceValue}>{parsed?.sector || user?.sector}</Text>
                        </View>
                    </View>
                </View>

                {provider?.aiReason && (
                    <View style={styles.reasonBox}>
                        <Ionicons name="bulb-outline" size={16} color={THEME.colors.accent} />
                        <View style={styles.reasonContent}>
                            <Text style={styles.reasonTitle}>Why AI picked this provider</Text>
                            <Text style={styles.reasonText}>{provider.aiReason}</Text>
                        </View>
                    </View>
                )}

                {/* Time Slot Picker */}
                <View style={styles.slotSection}>
                    <Text style={styles.sectionTitle}>Time Slot Choose Karein</Text>

                    {unavailableToday ? (
                        <View style={styles.unavailableBanner}>
                            <Ionicons name="alert-circle-outline" size={16} color={THEME.colors.urgencyHigh} />
                            <Text style={styles.unavailableText}>
                                Provider aaj available nahi. Doosra provider choose karein.
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.sectionSub}>Kal ke liye available slots</Text>
                    )}

                    {suggestedSlots.length > 0 && (
                        <View style={styles.suggestedBanner}>
                            <Ionicons name="checkmark-circle-outline" size={16} color={THEME.colors.accent} />
                            <Text style={styles.suggestedText}>
                                Provider ne yeh slots suggest kiye: {suggestedSlots.join(', ')}
                            </Text>
                        </View>
                    )}

                    <View style={styles.slotGrid}>
                        {TIME_SLOTS.map(slot => {
                            const isBooked = bookedSlots.includes(slot);
                            const isRejected = rejectedSlots.includes(slot);
                            const isSuggested = suggestedSlots.includes(slot);
                            const isSelected = selectedSlot === slot;
                            const isDisabled = isBooked || isRejected;

                            return (
                                <TouchableOpacity
                                    key={slot}
                                    style={[
                                        styles.slotBtn,
                                        isSelected && styles.slotBtnActive,
                                        isBooked && styles.slotBtnBooked,
                                        isRejected && styles.slotBtnRejected,
                                        isSuggested && !isDisabled && styles.slotBtnSuggested,
                                    ]}
                                    onPress={() => !isDisabled && setSelectedSlot(slot)}
                                    disabled={isDisabled}
                                    activeOpacity={isDisabled ? 1 : 0.7}
                                >
                                    {isBooked && <Ionicons name="close" size={10} color={THEME.colors.urgencyHigh} style={{ marginBottom: 2 }} />}
                                    {isRejected && <Ionicons name="ban" size={10} color="#F97316" style={{ marginBottom: 2 }} />}
                                    {isSuggested && !isDisabled && <Ionicons name="star" size={10} color={THEME.colors.accent} style={{ marginBottom: 2 }} />}

                                    <Text style={[
                                        styles.slotText,
                                        isSelected && styles.slotTextActive,
                                        isBooked && styles.slotTextBooked,
                                        isRejected && styles.slotTextRejected,
                                        isSuggested && !isDisabled && styles.slotTextSuggested,
                                    ]}>
                                        {slot}
                                    </Text>

                                    {isBooked && <Text style={styles.slotBookedLabel}>Booked</Text>}
                                    {isRejected && <Text style={styles.slotRejectedLabel}>Unavailable</Text>}
                                    {isSuggested && !isDisabled && <Text style={styles.slotSuggestedLabel}>Suggested</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {priceData && (
                    <DynamicInvoice pricing={{ ...priceData, distanceKm: provider?.distanceKm }} />
                )}

                <View style={styles.smsPreview}>
                    <View style={styles.smsHeader}>
                        <Ionicons name="chatbubble-ellipses" size={16} color={THEME.colors.success} />
                        <Text style={styles.smsTitle}>WhatsApp Notification Preview</Text>
                    </View>
                    <Text style={styles.smsText}>
                        {`✅ HUNAR Booking!\nService: ${parsed?.service?.replace(/_/g, ' ')}\nProvider: ${provider?.name}\nTime: ${selectedSlot || 'TBD'} Tomorrow\nLocation: ${parsed?.sector || user?.sector}\nTotal: Rs. ${priceData?.totalAmount || provider?.hourlyRate}`}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.confirmBtn, (!selectedSlot || loading) && { opacity: 0.6 }]}
                    onPress={handleConfirmBooking}
                    disabled={!selectedSlot || loading}
                >
                    {loading ? (
                        <ActivityIndicator color={THEME.colors.white} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color={THEME.colors.white} />
                            <Text style={styles.confirmBtnText}>
                                Confirm Booking — Rs. {priceData?.totalAmount || provider?.hourlyRate}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Doosra Provider Dekho</Text>
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
    content: { padding: 16, gap: 16, paddingBottom: 40 },

    providerCard: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16,
        borderWidth: 2, borderColor: THEME.colors.primary, ...THEME.shadows.premium,
    },
    providerHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    avatar: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: THEME.colors.white, fontWeight: '900', fontSize: 18 },
    providerInfo: { flex: 1 },
    providerName: { fontSize: 17, fontWeight: '800', color: THEME.colors.textDark },
    providerMeta: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 },
    badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
    badge: { backgroundColor: THEME.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, color: THEME.colors.primary, fontWeight: '600' },
    certRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    certChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: THEME.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    certText: { fontSize: 11, color: THEME.colors.primary, fontWeight: '600' },
    serviceRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: THEME.colors.border, paddingTop: 12 },
    serviceItem: { flex: 1, alignItems: 'center' },
    serviceLabel: { fontSize: 10, color: THEME.colors.textMuted, textTransform: 'uppercase' },
    serviceValue: { fontSize: 13, fontWeight: '700', color: THEME.colors.textDark, marginTop: 4 },

    reasonBox: {
        backgroundColor: '#FFF8E7', borderRadius: 12, padding: 14,
        flexDirection: 'row', gap: 10, borderLeftWidth: 4, borderLeftColor: THEME.colors.accent,
    },
    reasonContent: { flex: 1 },
    reasonTitle: { fontSize: 12, fontWeight: '700', color: THEME.colors.textDark, marginBottom: 4 },
    reasonText: { fontSize: 12, color: THEME.colors.textMuted, lineHeight: 18 },

    slotSection: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16, ...THEME.shadows.premium },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.textDark },
    sectionSub: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2, marginBottom: 14 },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },

    unavailableBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF0F0', borderRadius: 10, padding: 10,
        marginTop: 8, marginBottom: 10,
        borderWidth: 1, borderColor: THEME.colors.urgencyHigh,
    },
    unavailableText: { fontSize: 12, color: THEME.colors.urgencyHigh, flex: 1, fontWeight: '600' },

    suggestedBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF8E7', borderRadius: 10, padding: 10,
        marginTop: 4, marginBottom: 10,
        borderWidth: 1, borderColor: THEME.colors.accent,
    },
    suggestedText: { fontSize: 12, color: '#92400E', flex: 1, fontWeight: '600' },

    slotBtn: {
        width: '30%', paddingVertical: 10, borderRadius: 10,
        alignItems: 'center', backgroundColor: THEME.colors.bgLight,
        borderWidth: 1, borderColor: THEME.colors.border,
    },
    slotBtnActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
    slotBtnBooked: { backgroundColor: '#FFF0F0', borderColor: THEME.colors.urgencyHigh, opacity: 0.6 },
    slotBtnRejected: { backgroundColor: '#FFF4ED', borderColor: '#F97316', opacity: 0.7 },
    slotBtnSuggested: { backgroundColor: '#FFF8E7', borderColor: THEME.colors.accent, borderWidth: 2 },

    slotText: { fontSize: 13, fontWeight: '600', color: THEME.colors.textDark },
    slotTextActive: { color: THEME.colors.white },
    slotTextBooked: { color: THEME.colors.urgencyHigh, textDecorationLine: 'line-through' },
    slotTextRejected: { color: '#F97316', textDecorationLine: 'line-through' },
    slotTextSuggested: { color: THEME.colors.accent, fontWeight: '800' },

    slotBookedLabel: { fontSize: 8, color: THEME.colors.urgencyHigh, fontWeight: '700' },
    slotRejectedLabel: { fontSize: 8, color: '#F97316', fontWeight: '700' },
    slotSuggestedLabel: { fontSize: 8, color: THEME.colors.accent, fontWeight: '700' },

    smsPreview: {
        backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: THEME.colors.success,
    },
    smsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    smsTitle: { fontSize: 12, fontWeight: '700', color: THEME.colors.success },
    smsText: { fontSize: 12, color: THEME.colors.textDark, lineHeight: 20 },

    confirmBtn: {
        backgroundColor: THEME.colors.primary, borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        ...THEME.shadows.float,
    },
    confirmBtnText: { color: THEME.colors.white, fontSize: 15, fontWeight: '800' },
    backBtn: { borderWidth: 1.5, borderColor: THEME.colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    backBtnText: { color: THEME.colors.primary, fontSize: 14, fontWeight: '600' },
});