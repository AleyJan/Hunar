import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import CustomButton from '../components/CustomButton';
import CustomPopup from '../components/CustomPopup';
import { useAuth } from '../context/AuthContext';
import { submitFeedback } from '../api/client';

const FeedbackScreen = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const { booking } = route.params || {};
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({ title: '', message: '', isSuccess: false });

  const handleStarPress = (starNumber) => {
    setRating(starNumber);
  };

  const handleFileDispute = () => {
    // Dynamically route the user to the AI Dispute resolution room
    navigation.navigate('Dispute');
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setPopupConfig({
        title: 'Missing Rating',
        message: 'Please provide a star rating before submitting.',
        isSuccess: false
      });
      setPopupVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback(
        booking?.id || 'BKG-dummy',
        rating,
        reviewText,
        currentUser?.userId
      );
      
      setPopupConfig({
        title: 'Success!',
        message: 'Thank you for your feedback! Your review helps us maintain high quality standards.',
        isSuccess: true
      });
      setPopupVisible(true);
    } catch (e) {
      setPopupConfig({
        title: 'Error',
        message: 'Failed to submit review.',
        isSuccess: false
      });
      setPopupVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
    // Only route to Chat on a successful review submission
    if (popupConfig.isSuccess) {
      navigation.replace('Chat');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Bill Summary Card */}
          <View style={styles.billCard}>
            <Text style={styles.billTitle}>Payment Summary</Text>
            <Text style={styles.billAmount}>PKR 1,500</Text>
            <Text style={styles.billSubtitle}>Paid seamlessly via Hunar Wallet</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingPrompt}>How was Amjad's service?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => handleStarPress(star)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.starIcon, rating >= star ? styles.starFilled : styles.starEmpty]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingTextLabel}>
              {rating === 0 && 'Tap a star to rate'}
              {rating === 1 && 'Terrible'}
              {rating === 2 && 'Poor'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent!'}
            </Text>
          </View>

          {/* The Presentation Twist: Dynamic Dispute Trigger */}
          {rating > 0 && rating <= 3 && (
            <View style={styles.disputeCard}>
              <Text style={styles.disputeIcon}>⚠️</Text>
              <Text style={styles.disputeText}>
                Are you unsatisfied with Amjad's service? Open an instant automated dispute inside our AI Resolution Room.
              </Text>
              <CustomButton 
                title="File a Dispute" 
                onPress={handleFileDispute} 
                style={styles.disputeButton}
                textStyle={styles.disputeButtonText}
              />
            </View>
          )}

          {/* Standard Review Route */}
          {rating >= 4 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Leave a comment (Optional)</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience..."
                placeholderTextColor="#8a8d9e"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <CustomButton 
                title="Submit Review" 
                onPress={handleSubmitReview} 
                disabled={isSubmitting}
                style={styles.submitButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Safety Error & Success Overlays */}
      <CustomPopup 
        visible={popupVisible}
        title={popupConfig.title}
        message={popupConfig.message}
        onClose={handlePopupClose}
        confirmText={popupConfig.isSuccess ? "Return to Chat" : "Got it"}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3a', // Dark Deep Blue
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    flexGrow: 1,
  },
  billCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)', // Purple tint for sleek aesthetics
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  billTitle: {
    color: '#a09de6',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  billAmount: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  billSubtitle: {
    color: '#8a8d9e',
    fontSize: 14,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  ratingPrompt: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  starIcon: {
    fontSize: 48,
  },
  starFilled: {
    color: '#FFD700', // Gold color for filled stars
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  starEmpty: {
    color: 'rgba(255, 255, 255, 0.15)', // Dim white for empty stars
  },
  ratingTextLabel: {
    color: '#a09de6',
    fontSize: 16,
    fontWeight: '600',
    minHeight: 20,
  },
  disputeCard: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)', // Premium amber/red tint
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    alignItems: 'center',
  },
  disputeIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  disputeText: {
    color: '#ffcccc', // Light red for readability
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  disputeButton: {
    backgroundColor: '#ff453a', // Solid red alert button
    width: '100%',
    shadowColor: '#ff453a',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  disputeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  reviewSection: {
    width: '100%',
  },
  reviewLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  reviewInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    color: '#ffffff',
    fontSize: 15,
    minHeight: 120,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#6c63ff', // Sharp Royal Purple
    paddingVertical: 16,
    shadowColor: '#6c63ff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  }
});

export default FeedbackScreen;
