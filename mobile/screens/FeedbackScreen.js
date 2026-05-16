import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { submitFeedback, submitDispute } from '../api/client';
import { SCREENS } from '../navigation/AppNavigator';

const ISSUES = [
  { key: 'late_arrival', label: 'Late Arrival' },
  { key: 'bad_quality', label: 'Bad Quality' },
  { key: 'overcharged', label: 'Overcharged' },
  { key: 'unprofessional', label: 'Unprofessional' },
  { key: 'no_show', label: 'No Show' }
];

export default function FeedbackScreen() {
  const [rating, setRating] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useAuth();
  
  const { booking, provider } = route.params || {};

  const handleToggleIssue = (issueKey) => {
    setSelectedIssues((prev) => {
      if (prev.includes(issueKey)) {
        // filter out if directly matched removing it exclusively
        return prev.filter((item) => item !== issueKey);
      } else {
        // spreading and physically pushing logic adding it safely
        return [...prev, issueKey];
      }
    });
  };

  const handleSubmitFeedback = async () => {
    // 1. Guard verify rating present
    if (rating === 0) {
      Alert.alert("Rating Required", "Pehle rating dein (1 se 5 stars)");
      return;
    }

    // 2. Flip loading submitting to lock form
    setIsSubmitting(true);

    try {
      // 3. Initiate the normal Feedback API flow
      await submitFeedback(booking?.bookingId, rating, reviewText, currentUser.userId);
      
      // 4. Show success mapped perfectly to reset stack
      Alert.alert("Success", "Shukriya! Aapka feedback save ho gaya.", [
        { 
          text: 'OK', 
          onPress: () => {
             // Reset stack totally clears historical views to Chat root logically
             navigation.reset({
               index: 0,
               routes: [{ name: SCREENS.CHAT }],
             });
          }
        }
      ]);
    } catch (error) {
      // 5. Normal feedback explicitly failing fallback setup
      Alert.alert("Error", "Feedback submit nahi hua. Dobara try karein.");
    } finally {
      // 6. Reset form submitting lock
      setIsSubmitting(false);
    }
  };

  const handleDispute = async () => {
    // 1. Guard check ensuring an issue stands logically connected
    if (selectedIssues.length === 0) {
      Alert.alert("Issue Required", "Pehle issue select karein");
      return;
    }
    
    // 2. Explicit secondary guard ensuring Claude text constraint works cleanly
    if (reviewText.trim().length < 10) {
      Alert.alert("Detail Required", "Thodi detail likhein (kam az kam 10 characters)");
      return;
    }

    // 3. Lock API request preventing spam requests
    setIsDisputing(true);

    try {
      // 4. Hit Dispute directly passing the selected issue manually
      const result = await submitDispute(
        booking?.bookingId, 
        selectedIssues[0], 
        reviewText, 
        currentUser.userId
      );
      
      // 5. Fire Claude's result message dynamically showing Action alert
      Alert.alert("Dispute Resolution", result.actionMessage, [
        {
          text: 'OK',
          onPress: () => {
             // Success resets stack entirely locking user off feedback loops securely
             navigation.reset({
               index: 0,
               routes: [{ name: SCREENS.CHAT }],
             });
          }
        }
      ]);
    } catch (error) {
      // 6. Alert logic explicitly bound
      Alert.alert("Error", "Dispute submit nahi hua.");
    } finally {
      // 7. Toggle Dispute locks
      setIsDisputing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Nabil's Dummy UI Shell
  // ---------------------------------------------------------------------------

  if (!booking) {
    return <View style={styles.centerContainer}><Text>Error: Booking missing.</Text></View>;
  }

  const renderStars = () => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.starIcon, rating >= star && styles.starActive]}>
              {rating >= star ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Block */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rate Provider</Text>
        <Text style={styles.headerSub}>Booking: {booking.bookingId}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How was exactly the service with {booking.providerName}?</Text>
        
        {/* Rating Stars mapped correctly pulling WARNING color for exact matching */}
        {renderStars()}

        {/* Written Review */}
        <TextInput
          style={styles.textInput}
          placeholder="Apna experience batayein..."
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#6b7280"
        />

        {/* Feedback Button */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmitFeedback} 
          disabled={isSubmitting || isDisputing}
        >
          {isSubmitting ? (
             <ActivityIndicator color="#ffffff" />
          ) : (
             <Text style={styles.submitBtnText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* DISPUTE SYSTEM integrated via ERROR primary tracking */}
      <View style={[styles.card, styles.disputeCard]}>
        <Text style={styles.disputeTitle}>Koyi masla hua? (Dispute)</Text>
        <Text style={styles.disputeSub}>
          Agar service theek nahi mili ya extra charge hua hai, toh niche verify karein. 
          AI apko refund calculate karke dega.
        </Text>
        
        {/* Issue Chips toggling logic correctly executing */}
        <View style={styles.issuesContainer}>
          {ISSUES.map((issue) => {
            const isSelected = selectedIssues.includes(issue.key);
            return (
              <TouchableOpacity
                key={issue.key}
                style={[styles.issueChip, isSelected && styles.issueChipActive]}
                onPress={() => handleToggleIssue(issue.key)}
              >
                <Text style={[styles.issueText, isSelected && styles.issueTextActive]}>{issue.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dispute Button */}
        <TouchableOpacity 
          style={[styles.disputeBtn, (!selectedIssues.length || reviewText.length < 10) && styles.disputeBtnDisabled]} 
          onPress={handleDispute} 
          disabled={isSubmitting || isDisputing || !selectedIssues.length || reviewText.length < 10}
        >
          {isDisputing ? (
             <ActivityIndicator color="#ffffff" />
          ) : (
             <Text style={styles.disputeBtnText}>Raise AI Dispute</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Minimal placeholder styles, mapping specifically to ERROR components representing disputes
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#ffffff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e8eaf0', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1f3a' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#ffffff', margin: 15, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e8eaf0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1f3a', textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  starIcon: { fontSize: 40, color: '#e8eaf0', marginHorizontal: 5 },
  starActive: { color: '#ffd166' }, 
  textInput: { borderWidth: 1, borderColor: '#e8eaf0', borderRadius: 8, padding: 15, fontSize: 14, minHeight: 100, backgroundColor: '#f7f8fc', color: '#1a1f3a', marginBottom: 20 },
  submitBtn: { backgroundColor: '#06d6a0', padding: 15, borderRadius: 8, alignItems: 'center' }, 
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  disputeCard: { borderColor: '#ff6b6b', backgroundColor: '#fff5f5' }, 
  disputeTitle: { fontSize: 18, fontWeight: 'bold', color: '#ff6b6b', marginBottom: 5 },
  disputeSub: { fontSize: 13, color: '#1a1f3a', marginBottom: 15, lineHeight: 18 },
  issuesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  issueChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8eaf0', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, margin: 4 },
  issueChipActive: { backgroundColor: '#ff6b6b', borderColor: '#ff6b6b' },
  issueText: { fontSize: 13, color: '#6b7280' },
  issueTextActive: { color: '#ffffff', fontWeight: 'bold' },
  disputeBtn: { backgroundColor: '#ff6b6b', padding: 15, borderRadius: 8, alignItems: 'center' },
  disputeBtnDisabled: { backgroundColor: '#ffd4d4' },
  disputeBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
