import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Animated, Image,
    Share, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { serviceAPI } from '../../services/api';
import api from '../../services/api';
import { THEME } from '../../constants/theme';

const STATUS_STEPS = [
    { key: 'confirmed', label: 'Booking Confirmed', icon: 'checkmark-circle' },
    { key: 'en_route', label: 'Provider En Route', icon: 'car' },
    { key: 'arrived', label: 'Provider Arrived', icon: 'location' },
    { key: 'in_progress', label: 'Service In Progress', icon: 'construct' },
    { key: 'completed', label: 'Service Completed', icon: 'star' },
];

const STATUS_TO_STEP = {
    confirmed: 0, en_route: 1, arrived: 2, in_progress: 3, completed: 4,
};

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dm1z6bbwc/image/upload';
const CLOUDINARY_PRESET = 'hunarAi';

export default function TrackingDetailScreen({ navigation, route }) {
    const { booking } = route.params || {};
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const startTimeRef = useRef(Date.now());
    const intervalRef = useRef(null);

    const initialStep = booking?.status === 'completed' ? 4 : 0;

    const [trackingData, setTrackingData] = useState(null);
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [loading, setLoading] = useState(booking?.status !== 'completed');
    const [isPending, setIsPending] = useState(false);
    const [photos, setPhotos] = useState(booking?.photos || []);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        if (booking?.status === 'completed') { setLoading(false); return; }

        fetchTracking();
        intervalRef.current = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= 4) { clearInterval(intervalRef.current); return 4; }
                return prev;
            });
            fetchTracking();
        }, 8000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const fetchTracking = async () => {
        if (!booking?.bookingId) { setLoading(false); return; }
        try {
            const res = await serviceAPI.getTracking(booking.bookingId);
            const data = res.data.data;
            setTrackingData(data);

            if (data.currentStatus === 'pending') {
                setIsPending(true); setCurrentStep(0); setLoading(false); return;
            }
            setIsPending(false);

            if (data.currentStatus === 'completed') {
                setCurrentStep(4); setLoading(false);
                if (intervalRef.current) clearInterval(intervalRef.current);
                return;
            }

            const dbStep = STATUS_TO_STEP[data.currentStatus];
            if (dbStep !== undefined) { setCurrentStep(dbStep); setLoading(false); return; }
        } catch (err) {
            console.log('Tracking fetch error:', err.message);
        }

        const s = (Date.now() - startTimeRef.current) / 1000;
        let step = 0;
        if (s > 8) step = 1; if (s > 20) step = 2;
        if (s > 35) step = 3; if (s > 50) step = 4;
        setCurrentStep(step);
        setLoading(false);
    };

    const handlePickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Chahiye', 'Gallery access allow karein');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (result.canceled) return;

        setUploadingPhoto(true);
        try {
            const uri = result.assets[0].uri;
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            const formData = new FormData();
            formData.append('file', { uri, name: filename, type });
            formData.append('upload_preset', CLOUDINARY_PRESET);
            formData.append('folder', 'hunar_evidence');

            const uploadRes = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadData.secure_url)
                throw new Error('Upload failed');

            // Save to MongoDB
            await api.patch(`/book/${booking.bookingId}/add-photo`, {
                photoUrl: uploadData.secure_url,
            });

            setPhotos(prev => [...prev, uploadData.secure_url]);
            Alert.alert('✅ Upload Ho Gaya!', 'Photo save ho gayi');
        } catch (err) {
            console.log('Upload error:', err.message);
            Alert.alert('Upload Failed', 'Photo upload nahi hui. Try again.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleDownloadReceipt = async () => {
        const provider = trackingData?.provider || booking?.providerId;
        const receipt = `
╔══════════════════════════════╗
║       HUNAR RECEIPT          ║
╚══════════════════════════════╝

Booking ID:  ${booking?.bookingId}
Date:        ${new Date(booking?.scheduledAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}

SERVICE DETAILS
───────────────
Service:     ${booking?.serviceType?.replace(/_/g, ' ').toUpperCase()}
Location:    ${booking?.sector}
Complexity:  ${booking?.complexity}
Urgency:     ${booking?.urgency?.toUpperCase()}

PROVIDER
───────────────
Name:        ${provider?.name || 'N/A'}
Phone:       ${provider?.phone || 'N/A'}
Rating:      ⭐ ${provider?.rating || 'N/A'}

PRICING
───────────────
Base Rate:      Rs. ${booking?.pricing?.baseRate}
Distance Fee:   Rs. ${booking?.pricing?.distanceFee}
Urgency:        Rs. ${booking?.pricing?.urgencyPremium}
Discount:      -Rs. ${booking?.pricing?.loyaltyDiscount || 0}
───────────────
TOTAL:          Rs. ${booking?.pricing?.totalAmount}

Receipt ID: HUNAR-RCPT-${booking?.bookingId?.slice(-8)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for using HUNAR!
Pakistan's AI Service Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

        try {
            await Share.share({ message: receipt, title: `HUNAR Receipt — ${booking?.bookingId}` });
        } catch (err) {
            console.log('Share error:', err.message);
        }
    };

    const handleRateService = () => navigation.navigate('Feedback', { booking });
    const handleGoHome = () => navigation.reset({ index: 0, routes: [{ name: 'ClientTabs' }] });

    const providerName = trackingData?.provider?.name || booking?.providerId?.name;
    const providerPhone = trackingData?.provider?.phone || booking?.providerId?.phone;
    const providerSector = trackingData?.provider?.sector || booking?.providerId?.sector;
    const providerRating = booking?.providerId?.rating;
    const alreadyRated = booking?.rating && booking.rating > 0;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.colors.bgLight }}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="location" size={40} color={THEME.colors.primary} />
                </Animated.View>
                <Text style={{ color: THEME.colors.textMuted, marginTop: 12, fontSize: 14 }}>
                    Tracking load ho rahi hai...
                </Text>
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
                    <Text style={styles.headerTitle}>Live Tracking</Text>
                    <Text style={styles.headerSub}>{booking?.bookingId}</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    isPending && { backgroundColor: THEME.colors.urgencyMedium },
                    currentStep === 4 && { backgroundColor: THEME.colors.success },
                ]}>
                    <Text style={styles.statusBadgeText}>
                        {isPending ? 'Pending' : currentStep === 4 ? 'Done ✓' : 'Live'}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {isPending && (
                    <View style={styles.pendingCard}>
                        <Ionicons name="time-outline" size={24} color={THEME.colors.urgencyMedium} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.pendingTitle}>Provider Confirmation Ka Intezaar</Text>
                            <Text style={styles.pendingText}>
                                Provider ne abhi accept nahi kiya. Jab accept karega, tracking shuru ho gi.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Provider Info */}
                {!!providerName && (
                    <View style={styles.providerInfoCard}>
                        <View style={styles.providerInfoHeader}>
                            <View style={styles.providerAvatar}>
                                <Text style={styles.providerAvatarText}>{providerName?.slice(0, 2).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.providerInfoName}>{providerName}</Text>
                                <Text style={styles.providerInfoSector}>
                                    📍 {providerSector}{providerRating ? `  ⭐ ${providerRating}` : ''}
                                </Text>
                            </View>
                            <View style={styles.providerInfoRight}>
                                <Text style={styles.providerInfoPhone}>{providerPhone}</Text>
                                <View style={styles.providerInfoCall}>
                                    <Ionicons name="call-outline" size={14} color={THEME.colors.primary} />
                                    <Text style={styles.providerInfoCallText}>Call</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Map */}
                <View style={styles.mapCard}>
                    <View style={styles.mapPlaceholder}>
                        <View style={styles.mapGrid}>
                            {[...Array(6)].map((_, i) => (
                                <View key={i} style={styles.mapRow}>
                                    {[...Array(6)].map((_, j) => <View key={j} style={styles.mapCell} />)}
                                </View>
                            ))}
                        </View>
                        <View style={[styles.mapDot, styles.userDot]}>
                            <Ionicons name="home" size={12} color={THEME.colors.white} />
                        </View>
                        <Animated.View style={[
                            styles.mapDot, styles.providerDot,
                            !isPending && currentStep >= 1 && { transform: [{ scale: pulseAnim }] },
                        ]}>
                            <Ionicons name="car" size={12} color={THEME.colors.white} />
                        </Animated.View>
                        <View style={styles.etaBadge}>
                            <Text style={styles.etaText}>
                                {isPending ? 'Awaiting provider...'
                                    : currentStep === 0 ? 'Confirming...'
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
                                {isPending ? '—' : currentStep < 2 ? '~12' : currentStep < 3 ? '0' : '—'}
                            </Text>
                            <Text style={styles.statLabel}>Min Away</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue} numberOfLines={2}>
                                {isPending ? 'Pending' : STATUS_STEPS[currentStep]?.label}
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
                        const isDone = !isPending && index < currentStep;
                        const isActive = !isPending && index === currentStep;
                        const isPend = isPending || index > currentStep;
                        return (
                            <View key={step.key} style={styles.stepRow}>
                                <View style={styles.stepLeft}>
                                    <Animated.View style={[
                                        styles.stepCircle,
                                        isDone && styles.stepCircleDone,
                                        isActive && styles.stepCircleActive,
                                        isPend && styles.stepCirclePending,
                                        isActive && { transform: [{ scale: pulseAnim }] },
                                    ]}>
                                        <Ionicons
                                            name={isDone ? 'checkmark' : step.icon}
                                            size={14}
                                            color={isPend ? THEME.colors.textMuted : THEME.colors.white}
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
                                        isPend && styles.stepLabelPending,
                                    ]}>
                                        {step.label}
                                    </Text>
                                    {isActive && <Text style={styles.stepSubLabel}>Abhi ho raha hai...</Text>}
                                    {isDone && <Text style={styles.stepSubLabelDone}>Completed ✓</Text>}
                                    {isPending && index === 0 && <Text style={styles.stepSubLabel}>Provider ka intezaar hai...</Text>}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Completion Checklist + Photo Upload + Receipt */}
                {currentStep === 4 && !isPending && (
                    <>
                        <View style={styles.checklistCard}>
                            <Text style={styles.cardTitle}>Service Completion Checklist</Text>
                            {['Job Completed', 'Area Cleaned Up', 'Customer Satisfaction Confirmed', 'Payment Collected', 'Receipt Issued'].map((item, i) => (
                                <View key={i} style={styles.checkItem}>
                                    <View style={styles.checkIcon}>
                                        <Ionicons name="checkmark" size={14} color={THEME.colors.white} />
                                    </View>
                                    <Text style={styles.checkText}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Photo Evidence */}
                        <View style={styles.photoCard}>
                            <Text style={styles.cardTitle}>📸 Kaam ka Saboot</Text>
                            <Text style={styles.photoSub}>
                                Service ki photos upload karein — future disputes mein kaam aayengi
                            </Text>

                            {/* Uploaded Photos */}
                            {photos.length > 0 && (
                                <View style={styles.photosGrid}>
                                    {photos.map((url, i) => (
                                        <Image key={i} source={{ uri: url }} style={styles.photoThumb} />
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.uploadBtn, uploadingPhoto && { opacity: 0.6 }]}
                                onPress={handlePickPhoto}
                                disabled={uploadingPhoto}
                            >
                                {uploadingPhoto ? (
                                    <>
                                        <ActivityIndicator color={THEME.colors.primary} size="small" />
                                        <Text style={styles.uploadBtnText}>Upload Ho Raha Hai...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="camera-outline" size={18} color={THEME.colors.primary} />
                                        <Text style={styles.uploadBtnText}>
                                            {photos.length > 0 ? 'Aur Photo Add Karein' : 'Photo Upload Karein'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Receipt Download */}
                        <TouchableOpacity style={styles.receiptBtn} onPress={handleDownloadReceipt}>
                            <Ionicons name="receipt-outline" size={18} color={THEME.colors.white} />
                            <Text style={styles.receiptBtnText}>Receipt Download / Share Karein</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Rate or Already Rated */}
                {currentStep === 4 && !isPending ? (
                    alreadyRated ? (
                        <View style={styles.alreadyRatedCard}>
                            <Ionicons name="star" size={22} color={THEME.colors.accent} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.alreadyRatedTitle}>Rating Di Ja Chuki Hai ⭐ {booking.rating}/5</Text>
                                {booking.review ? (
                                    <Text style={styles.alreadyRatedReview}>"{booking.review}"</Text>
                                ) : null}
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.rateBtn} onPress={handleRateService}>
                            <Ionicons name="star-outline" size={20} color={THEME.colors.white} />
                            <Text style={styles.rateBtnText}>Rate Your Experience</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <View style={styles.waitingCard}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <Ionicons name="time-outline" size={24} color={THEME.colors.primary} />
                        </Animated.View>
                        <Text style={styles.waitingText}>
                            {isPending
                                ? 'Provider ke accept karne ka intezaar hai...'
                                : 'Live updates har 8 seconds mein aate hain'}
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

    pendingCard: {
        backgroundColor: '#FFF8E7', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        borderWidth: 1, borderColor: THEME.colors.urgencyMedium,
    },
    pendingTitle: { fontSize: 14, fontWeight: '700', color: THEME.colors.textDark },
    pendingText: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 4, lineHeight: 18 },

    providerInfoCard: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 14, ...THEME.shadows.premium },
    providerInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    providerAvatar: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    providerAvatarText: { color: THEME.colors.white, fontWeight: '800', fontSize: 15 },
    providerInfoName: { fontSize: 15, fontWeight: '700', color: THEME.colors.textDark },
    providerInfoSector: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 },
    providerInfoRight: { alignItems: 'flex-end', gap: 4 },
    providerInfoPhone: { fontSize: 12, color: THEME.colors.textDark, fontWeight: '600' },
    providerInfoCall: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: THEME.colors.primaryLight,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    providerInfoCallText: { fontSize: 11, color: THEME.colors.primary, fontWeight: '600' },

    mapCard: { backgroundColor: THEME.colors.white, borderRadius: 16, overflow: 'hidden', ...THEME.shadows.premium },
    mapPlaceholder: {
        height: 180, backgroundColor: '#E8F0E8',
        position: 'relative', justifyContent: 'center', alignItems: 'center',
    },
    mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 },
    mapRow: { flex: 1, flexDirection: 'row' },
    mapCell: { flex: 1, borderWidth: 0.5, borderColor: THEME.colors.primary },
    mapDot: {
        position: 'absolute', width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    userDot: { backgroundColor: THEME.colors.primary, bottom: 40, left: '35%' },
    providerDot: { backgroundColor: THEME.colors.urgencyHigh, top: 40, right: '30%' },
    etaBadge: {
        backgroundColor: THEME.colors.primaryDark,
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    },
    etaText: { color: THEME.colors.white, fontSize: 12, fontWeight: '700' },
    statsRow: { flexDirection: 'row', padding: 14, borderTopWidth: 1, borderTopColor: THEME.colors.border },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 12, fontWeight: '700', color: THEME.colors.textDark, textAlign: 'center' },
    statLabel: { fontSize: 10, color: THEME.colors.textMuted, marginTop: 2, textAlign: 'center' },
    statDivider: { width: 1, backgroundColor: THEME.colors.border },

    stepsCard: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16, ...THEME.shadows.premium },
    cardTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.textDark, marginBottom: 16 },
    stepRow: { flexDirection: 'row', gap: 12, minHeight: 50 },
    stepLeft: { alignItems: 'center', width: 28 },
    stepCircle: {
        width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
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

    checklistCard: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16, ...THEME.shadows.premium },
    checkItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: THEME.colors.border,
    },
    checkIcon: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: THEME.colors.success, alignItems: 'center', justifyContent: 'center',
    },
    checkText: { fontSize: 13, color: THEME.colors.textDark, fontWeight: '500' },

    photoCard: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16,
        ...THEME.shadows.premium,
    },
    photoSub: { fontSize: 12, color: THEME.colors.textMuted, marginBottom: 12, lineHeight: 18 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    photoThumb: { width: 90, height: 90, borderRadius: 10 },
    uploadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: THEME.colors.primaryLight,
        borderRadius: 12, paddingVertical: 12,
        borderWidth: 1.5, borderColor: THEME.colors.primary, borderStyle: 'dashed',
    },
    uploadBtnText: { fontSize: 13, color: THEME.colors.primary, fontWeight: '600' },

    receiptBtn: {
        backgroundColor: THEME.colors.primaryDark,
        borderRadius: 14, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
    },
    receiptBtnText: { color: THEME.colors.white, fontSize: 14, fontWeight: '700' },

    alreadyRatedCard: {
        backgroundColor: '#FFF8E7', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: THEME.colors.accent,
    },
    alreadyRatedTitle: { fontSize: 14, fontWeight: '700', color: THEME.colors.textDark },
    alreadyRatedReview: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 4, fontStyle: 'italic' },

    rateBtn: {
        backgroundColor: THEME.colors.accent, borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        ...THEME.shadows.float,
    },
    rateBtnText: { color: THEME.colors.primaryDark, fontSize: 15, fontWeight: '800' },

    waitingCard: {
        backgroundColor: THEME.colors.primaryLight, borderRadius: 12, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    waitingText: { fontSize: 13, color: THEME.colors.primary, flex: 1 },

    homeBtn: {
        borderWidth: 1.5, borderColor: THEME.colors.primary,
        borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    },
    homeBtnText: { color: THEME.colors.primary, fontSize: 14, fontWeight: '600' },
});