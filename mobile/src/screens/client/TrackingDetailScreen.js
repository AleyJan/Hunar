import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Animated, Image,
    Share, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { serviceAPI } from '../../services/api';
import api from '../../services/api';
import { THEME } from '../../constants/theme';

// Islamabad sector coordinates
const SECTOR_COORDS = {
    // B Sectors
    "B-17": { latitude: 33.6844, longitude: 72.8122 },
    "B-18": { latitude: 33.6668, longitude: 72.7845 },
    // C Sectors
    "C-14": { latitude: 33.7291, longitude: 72.9372 },
    "C-15": { latitude: 33.7198, longitude: 72.9190 },
    "C-16": { latitude: 33.7102, longitude: 72.9004 },
    // D Sectors
    "D-11": { latitude: 33.7335, longitude: 72.9870 },
    "D-12": { latitude: 33.7225, longitude: 72.9695 },
    "D-13": { latitude: 33.7130, longitude: 72.9510 },
    "D-14": { latitude: 33.7035, longitude: 72.9325 },
    "D-15": { latitude: 33.6940, longitude: 72.9140 },
    "D-16": { latitude: 33.6845, longitude: 72.8955 },
    "D-17": { latitude: 33.6750, longitude: 72.8770 },
    // E Sectors
    "E-7": { latitude: 33.7258, longitude: 73.0482 },
    "E-8": { latitude: 33.7229, longitude: 73.0298 },
    "E-9": { latitude: 33.7171, longitude: 73.0116 },
    "E-10": { latitude: 33.7125, longitude: 72.9940 },
    "E-11": { latitude: 33.7022, longitude: 72.9774 },
    "E-12": { latitude: 33.7095, longitude: 72.9610 },
    "E-16": { latitude: 33.6665, longitude: 72.8885 },
    "E-17": { latitude: 33.6570, longitude: 72.8700 },
    "E-18": { latitude: 33.6475, longitude: 72.8515 },
    // F Sectors
    "F-5": { latitude: 33.7268, longitude: 73.0920 },
    "F-6": { latitude: 33.7297, longitude: 73.0745 },
    "F-7": { latitude: 33.7214, longitude: 73.0564 },
    "F-8": { latitude: 33.7118, longitude: 73.0371 },
    "F-9": { latitude: 33.7028, longitude: 73.0178 },
    "F-10": { latitude: 33.6934, longitude: 72.9995 },
    "F-11": { latitude: 33.6841, longitude: 72.9810 },
    "F-12": { latitude: 33.6910, longitude: 72.9635 },
    "F-14": { latitude: 33.6625, longitude: 72.9245 },
    "F-15": { latitude: 33.6530, longitude: 72.9060 },
    "F-16": { latitude: 33.6435, longitude: 72.8875 },
    "F-17": { latitude: 33.6340, longitude: 72.8690 },
    // G Sectors
    "G-5": { latitude: 33.7240, longitude: 73.1001 },
    "G-6": { latitude: 33.7196, longitude: 73.0825 },
    "G-7": { latitude: 33.7101, longitude: 73.0641 },
    "G-8": { latitude: 33.7006, longitude: 73.0450 },
    "G-9": { latitude: 33.6912, longitude: 73.0260 },
    "G-10": { latitude: 33.6819, longitude: 73.0075 },
    "G-11": { latitude: 33.6726, longitude: 72.9890 },
    "G-12": { latitude: 33.6710, longitude: 72.9700 },
    "G-13": { latitude: 33.6540, longitude: 72.9515 },
    "G-14": { latitude: 33.6444, longitude: 72.9333 },
    "G-15": { latitude: 33.6350, longitude: 72.9150 },
    "G-16": { latitude: 33.6255, longitude: 72.8965 },
    "G-17": { latitude: 33.6160, longitude: 72.8780 },
    // H Sectors
    "H-8": { latitude: 33.6888, longitude: 73.0531 },
    "H-9": { latitude: 33.6795, longitude: 73.0345 },
    "H-10": { latitude: 33.6702, longitude: 73.0160 },
    "H-11": { latitude: 33.6610, longitude: 72.9970 },
    "H-12": { latitude: 33.6449, longitude: 72.9912 },
    "H-13": { latitude: 33.6420, longitude: 72.9605 },
    "H-14": { latitude: 33.6325, longitude: 72.9420 },
    "H-15": { latitude: 33.6230, longitude: 72.9235 },
    "H-16": { latitude: 33.6135, longitude: 72.9050 },
    "H-17": { latitude: 33.6040, longitude: 72.8865 },
    // I Sectors
    "I-8": { latitude: 33.6765, longitude: 73.0620 },
    "I-9": { latitude: 33.6672, longitude: 73.0435 },
    "I-10": { latitude: 33.6578, longitude: 73.0250 },
    "I-11": { latitude: 33.6485, longitude: 73.0065 },
    "I-12": { latitude: 33.6390, longitude: 72.9880 },
    "I-14": { latitude: 33.6190, longitude: 72.9288 },
    "I-15": { latitude: 33.6095, longitude: 72.9100 },
    "I-16": { latitude: 33.6000, longitude: 72.8915 },
    "I-18": { latitude: 33.5810, longitude: 72.8545 },
};

// Calculate haversine distance between two coords (km)
const haversineKm = (c1, c2) => {
    const R = 6371;
    const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
    const dLng = ((c2.longitude - c1.longitude) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((c1.latitude * Math.PI) / 180) *
        Math.cos((c2.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3).toFixed(1));
};

const getMidpoint = (c1, c2) => ({
    latitude: (c1.latitude + c2.latitude) / 2,
    longitude: (c1.longitude + c2.longitude) / 2,
    latitudeDelta: Math.abs(c1.latitude - c2.latitude) * 3 + 0.03,
    longitudeDelta: Math.abs(c1.longitude - c2.longitude) * 3 + 0.03,
});

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

    // Provider info — use trackingData first, fallback to booking's populated providerId
    const providerName = trackingData?.provider?.name || booking?.providerId?.name || '';
    const providerPhone = trackingData?.provider?.phone || booking?.providerId?.phone || '';
    const providerSector = trackingData?.provider?.sector || booking?.providerId?.sector || '';

    console.log('DEBUG providerSector:', providerSector);
    console.log('DEBUG trackingData provider:', trackingData?.provider?.sector);
    console.log('DEBUG booking providerId sector:', booking?.providerId?.sector);
    const providerRating = trackingData?.provider?.rating || booking?.providerId?.rating || null;
    const alreadyRated = booking?.rating && booking.rating > 0;

    // Map coordinates — computed from sectors
    const userCoords = SECTOR_COORDS[booking?.sector] || null;
    const providerCoords = SECTOR_COORDS[providerSector] || null;

    // Real distance between sectors
    const realDistanceKm = userCoords && providerCoords
        ? haversineKm(userCoords, providerCoords)
        : null;
    const realTravelMin = realDistanceKm
        ? Math.ceil((realDistanceKm / 30) * 60) // 30 km/h city speed
        : null;

    const mapRegion = userCoords && providerCoords && (booking?.sector !== providerSector)
        ? getMidpoint(userCoords, providerCoords)
        : userCoords
            ? { ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }
            : { latitude: 33.6844, longitude: 73.0479, latitudeDelta: 0.08, longitudeDelta: 0.08 };

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
            mediaTypes: ImagePicker.MediaType.Images,
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

            const uploadRes = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (!uploadData.secure_url) throw new Error('Upload failed');

            await api.patch(`/book/${booking.bookingId}/add-photo`, { photoUrl: uploadData.secure_url });
            setPhotos(prev => [...prev, uploadData.secure_url]);
            Alert.alert('✅ Upload Ho Gaya!', 'Photo save ho gayi');
        } catch (err) {
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

Booking ID:  ${booking?.bookingId || ''}
Date:        ${new Date(booking?.scheduledAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}

SERVICE DETAILS
───────────────
Service:     ${booking?.serviceType?.replace(/_/g, ' ').toUpperCase() || ''}
Location:    ${booking?.sector || ''}
Complexity:  ${booking?.complexity || ''}
Urgency:     ${booking?.urgency?.toUpperCase() || ''}

PROVIDER
───────────────
Name:        ${provider?.name || 'N/A'}
Phone:       ${provider?.phone || 'N/A'}
Sector:      ${provider?.sector || 'N/A'}
Rating:      ⭐ ${provider?.rating || 'N/A'}

PRICING
───────────────
Base Rate:      Rs. ${booking?.pricing?.baseRate || 0}
Distance Fee:   Rs. ${booking?.pricing?.distanceFee || 0}
  (${realDistanceKm ? realDistanceKm + ' km road distance' : 'calculated'})
Urgency:        Rs. ${booking?.pricing?.urgencyPremium || 0}
Discount:      -Rs. ${booking?.pricing?.loyaltyDiscount || 0}
───────────────
TOTAL:          Rs. ${booking?.pricing?.totalAmount || 0}

Receipt ID: HUNAR-RCPT-${booking?.bookingId?.slice(-8) || ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for using HUNAR!
Pakistan's AI Service Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
        try {
            await Share.share({ message: receipt, title: `HUNAR Receipt — ${booking?.bookingId}` });
        } catch (err) { console.log('Share error:', err.message); }
    };

    const handleRateService = () => navigation.navigate('Feedback', { booking });
    const handleGoHome = () => navigation.reset({ index: 0, routes: [{ name: 'ClientTabs' }] });

    // ETA display — use real calculated distance
    const etaDisplay = isPending ? '—'
        : currentStep >= 2 ? '0'
            : realTravelMin ? `~${realTravelMin}`
                : '~12';

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

                {/* Provider Info Card */}
                {providerName ? (
                    <View style={styles.providerInfoCard}>
                        <View style={styles.providerInfoHeader}>
                            <View style={styles.providerAvatar}>
                                <Text style={styles.providerAvatarText}>
                                    {providerName.slice(0, 2).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.providerInfoName}>{providerName}</Text>
                                <Text style={styles.providerInfoSector}>
                                    📍 {providerSector}{providerRating ? `  ⭐ ${providerRating}` : ''}
                                    {realDistanceKm ? `  · ${realDistanceKm} km away` : ''}
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
                ) : null}

                {/* Google Map */}
                <View style={styles.mapCard}>
                    <MapView

                        style={styles.realMap}
                        region={mapRegion}
                        showsTraffic={false}
                        showsBuildings={false}
                        showsPointsOfInterest={false}
                    >
                        {/* User location marker */}
                        {userCoords ? (
                            <Marker coordinate={userCoords} title="Your Location" description={booking?.sector || ''}>
                                <View style={styles.userMarker}>
                                    <Ionicons name="home" size={16} color={THEME.colors.white} />
                                </View>
                            </Marker>
                        ) : null}

                        {/* Provider location marker */}
                        {providerCoords ? (
                            <Marker coordinate={providerCoords} title={providerName || 'Provider'} description={providerSector || ''}>
                                <View style={[styles.providerMarker, currentStep >= 2 && { backgroundColor: THEME.colors.success }]}>
                                    <Ionicons name={currentStep >= 2 ? 'checkmark-circle' : 'person'} size={16} color={THEME.colors.white} />
                                </View>
                            </Marker>
                        ) : null}

                        {/* Route line */}
                        {userCoords && providerCoords && booking?.sector !== providerSector ? (
                            <Polyline
                                coordinates={[providerCoords, userCoords]}
                                strokeColor={currentStep >= 2 ? THEME.colors.success : THEME.colors.primary}
                                strokeWidth={3}
                                lineDashPattern={currentStep >= 2 ? undefined : [10, 6]}
                            />
                        ) : null}
                    </MapView>

                    {/* ETA overlay */}
                    <View style={styles.etaOverlay}>
                        <Text style={styles.etaText}>
                            {isPending ? '⏳ Awaiting provider...'
                                : currentStep === 0 ? '🔄 Confirming...'
                                    : currentStep === 1 ? `🚗 ~${realTravelMin || 12} min away`
                                        : currentStep === 2 ? '📍 Provider arrived!'
                                            : currentStep === 3 ? '🔧 Service in progress'
                                                : '✅ Done!'}
                        </Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{etaDisplay}</Text>
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
                            <Text style={styles.statValue}>
                                {realDistanceKm ? `${realDistanceKm} km` : booking?.sector || ''}
                            </Text>
                            <Text style={styles.statLabel}>Distance</Text>
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

                {/* Completion section */}
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

                        <TouchableOpacity style={styles.receiptBtn} onPress={handleDownloadReceipt}>
                            <Ionicons name="receipt-outline" size={18} color={THEME.colors.white} />
                            <Text style={styles.receiptBtnText}>Receipt Download / Share Karein</Text>
                        </TouchableOpacity>
                    </>
                )}

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
    providerInfoSector: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 2 },
    providerInfoRight: { alignItems: 'flex-end', gap: 4 },
    providerInfoPhone: { fontSize: 12, color: THEME.colors.textDark, fontWeight: '600' },
    providerInfoCall: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: THEME.colors.primaryLight,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    providerInfoCallText: { fontSize: 11, color: THEME.colors.primary, fontWeight: '600' },

    mapCard: { backgroundColor: THEME.colors.white, borderRadius: 16, overflow: 'hidden', ...THEME.shadows.premium },
    realMap: { height: 220, width: '100%' },
    etaOverlay: {
        position: 'absolute', top: 10, alignSelf: 'center',
        backgroundColor: 'rgba(11,61,46,0.88)',
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    },
    etaText: { color: THEME.colors.white, fontSize: 12, fontWeight: '700' },

    userMarker: {
        backgroundColor: THEME.colors.primary,
        borderRadius: 20, padding: 6,
        borderWidth: 2, borderColor: THEME.colors.white,
    },
    providerMarker: {
        backgroundColor: THEME.colors.urgencyHigh,
        borderRadius: 20, padding: 6,
        borderWidth: 2, borderColor: THEME.colors.white,
    },

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

    photoCard: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16, ...THEME.shadows.premium },
    photoSub: { fontSize: 12, color: THEME.colors.textMuted, marginBottom: 12, lineHeight: 18 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    photoThumb: { width: 90, height: 90, borderRadius: 10 },
    uploadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: THEME.colors.primaryLight, borderRadius: 12, paddingVertical: 12,
        borderWidth: 1.5, borderColor: THEME.colors.primary, borderStyle: 'dashed',
    },
    uploadBtnText: { fontSize: 13, color: THEME.colors.primary, fontWeight: '600' },

    receiptBtn: {
        backgroundColor: THEME.colors.primaryDark, borderRadius: 14, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
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
