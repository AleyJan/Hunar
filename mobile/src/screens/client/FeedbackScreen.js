import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, TextInput, ActivityIndicator,
    Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { serviceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';

const ISSUE_TYPES = [
    { key: 'overcharge', label: 'Price Dispute', icon: 'cash-outline' },
    { key: 'poor_quality', label: 'Poor Quality', icon: 'thumbs-down-outline' },
    { key: 'no_show', label: 'No Show', icon: 'person-remove-outline' },
    { key: 'rude_behavior', label: 'Rude Behavior', icon: 'time-outline' },
    { key: 'overrun', label: 'Work Overrun', icon: 'alert-circle-outline' },
    { key: 'other', label: 'Other Issue', icon: 'ellipsis-horizontal' },
];

export default function FeedbackScreen({ navigation, route }) {
    const { booking } = route.params || {};
    const { user } = useAuth();

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [showDispute, setShowDispute] = useState(false);
    const [disputeDesc, setDisputeDesc] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [disputeLoading, setDisputeLoading] = useState(false);
    const [disputeResult, setDisputeResult] = useState(null);

    const ratingLabels = ['', 'Bohat Bura', 'Bura', 'Theek Tha', 'Acha', 'Bohat Acha!'];

    const handleSubmitFeedback = async () => {
        if (rating === 0) {
            Alert.alert('Rating Zaroor Dein', 'Pehle stars select karein');
            return;
        }
        setFeedbackLoading(true);
        try {
            await serviceAPI.submitFeedback(booking?.bookingId, { rating, review, userId: user?.id });
            Alert.alert(
                'Shukriya! 🙏',
                'Aapka feedback save ho gaya. Provider ki reputation update ho gayi.',
                [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'ClientTabs' }] }) }]
            );
        } catch (err) {
            Alert.alert('Error', 'Feedback submit nahi hua. Try again.');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const handleSubmitDispute = async () => {
        if (!selectedIssue) {
            Alert.alert('Issue Select Karein', 'Pehle masla select karein');
            return;
        }
        if (!disputeDesc.trim()) {
            Alert.alert('Description Zaroor Hai', 'Masle ka description likhen');
            return;
        }
        setDisputeLoading(true);
        try {
            // Submit rating first if not already rated
            if (rating > 0 && !booking?.rating) {
                await serviceAPI.submitFeedback(booking?.bookingId, {
                    rating,
                    review: `Dispute filed: ${selectedIssue}`,
                    userId: user?.id,
                });
            } else if (!booking?.rating) {
                // Submit default rating 1 if no rating given with dispute
                await serviceAPI.submitFeedback(booking?.bookingId, {
                    rating: 1,
                    review: `Dispute filed: ${selectedIssue}`,
                    userId: user?.id,
                });
            }

            const res = await serviceAPI.raiseDispute({
                bookingId: booking?.bookingId,
                issueType: selectedIssue,
                description: disputeDesc,
                userId: user?.id,
            });
            setDisputeResult(res.data.data);
        } catch (err) {
            console.log('Dispute error full:', JSON.stringify(err.response?.data));
            Alert.alert('Error', err.response?.data?.message || 'Dispute submit nahi hua. Try again.');
        } finally {
            setDisputeLoading(false);
        }
    };

    if (disputeResult) {
        return (
            <View style={{ flex: 1, backgroundColor: THEME.colors.bgLight }}>
                <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Dispute Result</Text>
                </View>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.disputeResultCard}>
                        <Ionicons name="shield-checkmark" size={56} color={THEME.colors.primary} />
                        <Text style={styles.disputeResolution}>
                            {disputeResult.resolution?.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                        {disputeResult.refundPercentage > 0 && (
                            <View style={styles.refundBadge}>
                                <Text style={styles.refundPct}>{disputeResult.refundPercentage}% Refund</Text>
                            </View>
                        )}
                        {disputeResult.resolutionAmount > 0 && (
                            <Text style={styles.disputeAmount}>Rs. {disputeResult.resolutionAmount}</Text>
                        )}
                        <Text style={styles.disputeMessage}>
                            {disputeResult.actionMessage || disputeResult.resolutionReason}
                        </Text>

                        {disputeResult.trace && (
                            <View style={styles.traceBox}>
                                <Text style={styles.traceTitle}>🤖 AI Mediator Reasoning</Text>
                                <Text style={styles.traceText}>{disputeResult.trace.reasoning}</Text>
                            </View>
                        )}

                        <View style={styles.nextStepBox}>
                            <Ionicons name="information-circle-outline" size={16} color={THEME.colors.primary} />
                            <Text style={styles.nextStepText}>
                                Provider ko 24 ghante mein respond karna hoga. Agar reject kiya toh HUNAR team review karegi.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ClientTabs' }] })}
                    >
                        <Text style={styles.submitBtnText}>Dashboard pe Wapas Jao</Text>
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
                    <Text style={styles.headerTitle}>Rate Your Experience</Text>
                    <Text style={styles.headerSub}>{booking?.bookingId}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.ratingCard}>
                    <Text style={styles.ratingQuestion}>Service kaisi thi?</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={42}
                                    color={star <= rating ? THEME.colors.accent : THEME.colors.border}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>}
                </View>

                <View style={styles.reviewCard}>
                    <Text style={styles.sectionTitle}>Apni Rai Likhen (optional)</Text>
                    <TextInput
                        style={styles.reviewInput}
                        value={review}
                        onChangeText={setReview}
                        placeholder="Kuch bhi likho — Roman Urdu ya English mein..."
                        placeholderTextColor={THEME.colors.textMuted}
                        multiline
                        numberOfLines={4}
                        maxLength={300}
                    />
                    <Text style={styles.charCount}>{review.length}/300</Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, (feedbackLoading || rating === 0) && { opacity: 0.6 }]}
                    onPress={handleSubmitFeedback}
                    disabled={feedbackLoading || rating === 0}
                >
                    {feedbackLoading ? (
                        <ActivityIndicator color={THEME.colors.white} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color={THEME.colors.white} />
                            <Text style={styles.submitBtnText}>Feedback Submit Karein</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.disputeToggle}
                    onPress={() => setShowDispute(!showDispute)}
                >
                    <Ionicons
                        name={showDispute ? 'chevron-up' : 'alert-circle-outline'}
                        size={18}
                        color={THEME.colors.urgencyHigh}
                    />
                    <Text style={styles.disputeToggleText}>
                        {showDispute ? 'Dispute band karein' : 'Koi masla hai? Dispute raise karein'}
                    </Text>
                </TouchableOpacity>

                {showDispute && (
                    <View style={styles.disputeCard}>
                        <Text style={styles.sectionTitle}>Masle ka Type Select Karein</Text>
                        <View style={styles.issueGrid}>
                            {ISSUE_TYPES.map(issue => (
                                <TouchableOpacity
                                    key={issue.key}
                                    style={[styles.issueChip, selectedIssue === issue.key && styles.issueChipActive]}
                                    onPress={() => setSelectedIssue(issue.key)}
                                >
                                    <Ionicons
                                        name={issue.icon}
                                        size={16}
                                        color={selectedIssue === issue.key ? THEME.colors.white : THEME.colors.urgencyHigh}
                                    />
                                    <Text style={[styles.issueText, selectedIssue === issue.key && styles.issueTextActive]}>
                                        {issue.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Masle ki Detail Likhen</Text>
                        <TextInput
                            style={styles.reviewInput}
                            value={disputeDesc}
                            onChangeText={setDisputeDesc}
                            placeholder="Kya hua? Detail mein batayein..."
                            placeholderTextColor={THEME.colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.aiNote}>
                            <Ionicons name="bulb-outline" size={16} color={THEME.colors.accent} />
                            <Text style={styles.aiNoteText}>
                                Groq AI aapka dispute analyze karega aur fair refund percentage decide karega. Provider ko 24 ghante mein respond karna hoga.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.disputeBtn, disputeLoading && { opacity: 0.6 }]}
                            onPress={handleSubmitDispute}
                            disabled={disputeLoading}
                        >
                            {disputeLoading ? (
                                <ActivityIndicator color={THEME.colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="shield-outline" size={18} color={THEME.colors.white} />
                                    <Text style={styles.disputeBtnText}>AI Mediator Ko Bhejo</Text>
                                </>
                            )}
                        </TouchableOpacity>
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
    content: { padding: 16, gap: 16, paddingBottom: 40 },

    ratingCard: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 20,
        alignItems: 'center', ...THEME.shadows.premium,
    },
    ratingQuestion: { fontSize: 18, fontWeight: '700', color: THEME.colors.textDark, marginBottom: 16 },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    ratingLabel: { fontSize: 16, fontWeight: '700', color: THEME.colors.accent },

    reviewCard: { backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16, ...THEME.shadows.premium },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: THEME.colors.textDark, marginBottom: 10 },
    reviewInput: {
        backgroundColor: THEME.colors.bgLight, borderRadius: 12, padding: 12,
        fontSize: 14, color: THEME.colors.textDark, textAlignVertical: 'top',
        minHeight: 90, borderWidth: 1, borderColor: THEME.colors.border,
    },
    charCount: { fontSize: 11, color: THEME.colors.textMuted, textAlign: 'right', marginTop: 4 },

    submitBtn: {
        backgroundColor: THEME.colors.primary, borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        ...THEME.shadows.float,
    },
    submitBtnText: { color: THEME.colors.white, fontSize: 15, fontWeight: '800' },

    disputeToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, justifyContent: 'center',
    },
    disputeToggleText: { color: THEME.colors.urgencyHigh, fontSize: 14, fontWeight: '600' },

    disputeCard: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: THEME.colors.urgencyHigh, ...THEME.shadows.premium,
    },
    issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    issueChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1.5, borderColor: THEME.colors.urgencyHigh, backgroundColor: THEME.colors.white,
    },
    issueChipActive: { backgroundColor: THEME.colors.urgencyHigh },
    issueText: { fontSize: 12, color: THEME.colors.urgencyHigh, fontWeight: '600' },
    issueTextActive: { color: THEME.colors.white },

    aiNote: {
        flexDirection: 'row', gap: 8, alignItems: 'flex-start',
        backgroundColor: '#FFF8E7', borderRadius: 10, padding: 10, marginTop: 12,
    },
    aiNoteText: { fontSize: 12, color: THEME.colors.textDark, flex: 1, lineHeight: 18 },

    disputeBtn: {
        backgroundColor: THEME.colors.urgencyHigh, borderRadius: 14, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14,
    },
    disputeBtnText: { color: THEME.colors.white, fontSize: 14, fontWeight: '700' },

    disputeResultCard: {
        backgroundColor: THEME.colors.white, borderRadius: 16, padding: 24,
        alignItems: 'center', gap: 12, ...THEME.shadows.premium,
    },
    disputeResolution: { fontSize: 18, fontWeight: '900', color: THEME.colors.textDark, textAlign: 'center' },
    refundBadge: { backgroundColor: THEME.colors.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    refundPct: { fontSize: 16, fontWeight: '800', color: THEME.colors.primary },
    disputeAmount: { fontSize: 26, fontWeight: '900', color: THEME.colors.primary },
    disputeMessage: { fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center', lineHeight: 20 },
    traceBox: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, width: '100%' },
    traceTitle: { color: THEME.colors.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 },
    traceText: { color: '#CBD5E1', fontSize: 11, lineHeight: 18 },
    nextStepBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: THEME.colors.primaryLight, borderRadius: 10, padding: 10, width: '100%',
    },
    nextStepText: { fontSize: 12, color: THEME.colors.primaryDark, flex: 1, lineHeight: 18 },
});