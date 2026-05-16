import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import CustomButton from '../components/CustomButton';
import CustomPopup from '../components/CustomPopup';

const DisputeScreen = ({ navigation }) => {
  const [userClaim, setUserClaim] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [caseClosed, setCaseClosed] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  const [disputeLogs, setDisputeLogs] = useState([
    {
      id: '1',
      sender: 'system',
      text: "🤖 AI Mediator active. Reading job logs for Amjad Khan (AC Expert)...",
    },
    {
      id: '2',
      sender: 'system',
      text: "📝 Amjad Khan states: 'Work was completed, but the outdoor unit had a pre-existing wiring fault.'",
    }
  ]);

  const flatListRef = useRef();

  // Auto-scroll logic as logs are appended
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [disputeLogs, isResolving]);

  const handleSubmitClaim = () => {
    if (!userClaim.trim()) {
      setPopupVisible(true);
      return;
    }

    const newLog = {
      id: Date.now().toString(),
      sender: 'user',
      text: userClaim.trim()
    };

    setDisputeLogs(prev => [...prev, newLog]);
    setUserClaim('');
    setIsResolving(true);

    // Simulate AI Mediation processing over 3 seconds
    setTimeout(() => {
      const verdictLog = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "⚖️ Verdict: Evidence suggests partial completion. A 50% refund (PKR 750) has been credited back to your Hunar Wallet. Case Closed."
      };
      setDisputeLogs(prev => [...prev, verdictLog]);
      setIsResolving(false);
      setCaseClosed(true);
    }, 3000);
  };

  const handleReturnHome = () => {
    navigation.replace('Chat');
  };

  const renderLog = ({ item }) => {
    const isUser = item.sender === 'user';
    const isVerdict = item.sender === 'ai';

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperSystem]}>
        <View style={[
          styles.messageBubble, 
          isUser ? styles.messageBubbleUser : styles.messageBubbleSystem,
          isVerdict && styles.messageBubbleVerdict
        ]}>
          <Text style={[styles.messageText, isVerdict && styles.verdictText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Amber Alert Header */}
        <View style={styles.headerBadge}>
          <Text style={styles.badgeIcon}>🔒</Text>
          <Text style={styles.badgeText}>Secured AI Dispute Room - Case #HUNAR-992</Text>
        </View>

        {/* Live Case Timeline */}
        <FlatList
          ref={flatListRef}
          data={disputeLogs}
          keyExtractor={item => item.id}
          renderItem={renderLog}
          contentContainerStyle={styles.logsContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Loading Indicator for AI Verdict */}
        {isResolving && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="small" color="#ff453a" />
            <Text style={styles.analyzingText}>Claude AI Mediator is reviewing evidence...</Text>
          </View>
        )}

        {/* Conditional Layout: Claim Input vs Resolution Return */}
        {!caseClosed ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="State your side of the story..."
              placeholderTextColor="#8a8d9e"
              value={userClaim}
              onChangeText={setUserClaim}
              multiline
              maxLength={400}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitClaim} activeOpacity={0.7}>
              <Text style={styles.submitButtonText}>Submit Claim</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            <CustomButton 
              title="Back to Home Dashboard" 
              onPress={handleReturnHome} 
              style={styles.homeButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Safety Validation */}
      <CustomPopup 
        visible={popupVisible}
        title="Empty Claim"
        message="Please state your side of the story before submitting your case to the AI."
        onClose={() => setPopupVisible(false)}
        confirmText="Got it"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3a', // Deep Blue Background
  },
  keyboardView: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.15)', // Premium amber/red tint
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 69, 58, 0.4)',
  },
  badgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  badgeText: {
    color: '#ffcccc', // Light red readability
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 20,
    width: '100%',
    flexDirection: 'row',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperSystem: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 18,
  },
  messageBubbleUser: {
    backgroundColor: '#6c63ff', // Royal Purple
    borderBottomRightRadius: 4,
  },
  messageBubbleSystem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  messageBubbleVerdict: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)', // Gold/Amber tint for final verdict
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderBottomLeftRadius: 18, // Rounded to stand out from normal system messages
    borderTopLeftRadius: 4,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 24,
  },
  verdictText: {
    color: '#FFD700', // Gold text to emphasize the final judgment
    fontWeight: 'bold',
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  analyzingText: {
    color: '#ffcccc',
    fontSize: 14,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(26, 31, 58, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 69, 58, 0.4)', // Amber/Red border matching theme
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    color: '#ffffff',
    fontSize: 15,
    minHeight: 80,
    maxHeight: 140,
    marginBottom: 14,
  },
  submitButton: {
    backgroundColor: '#ff453a', // Solid red warning action button
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#ff453a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'rgba(26, 31, 58, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  homeButton: {
    backgroundColor: '#6c63ff', // High Contrast Reset Button
    paddingVertical: 18,
    shadowOpacity: 0.4,
    elevation: 8,
  }
});

export default DisputeScreen;
