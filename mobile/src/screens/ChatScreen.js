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

const ChatScreen = ({ navigation }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: "Assalam-o-Alaikum! Main aapki kis tarah madad kar sakta hoon? (e.g., 'Mujhe G-13 mein AC technician chahiye')",
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  
  const flatListRef = useRef();

  // Scroll to bottom when new messages or loading states are added
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, isAnalyzing]);

  const handleSend = () => {
    if (!inputText.trim()) {
      setPopupVisible(true);
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAnalyzing(true);

    // Simulate AI Agent processing delay and parameter extraction
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Maine aapki requirement samajh li hai. Main best karigars dhund raha hoon.',
        extractedData: {
          service: 'AC Repair',
          location: 'G-13'
        },
        hasAction: true
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleFindKarigar = () => {
    navigation.navigate('Matching');
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAI]}>
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAI]}>
          <Text style={styles.messageText}>{item.text}</Text>
          
          {/* Dynamic Tags for AI Extracted Parameters */}
          {item.extractedData && (
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Service: {item.extractedData.service}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Location: {item.extractedData.location}</Text>
              </View>
            </View>
          )}

          {/* Action Button Integration inside AI Bubble */}
          {item.hasAction && (
            <CustomButton 
              title="Find Best Karigar" 
              onPress={handleFindKarigar} 
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          )}
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
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Loading State representing Agent Workflow */}
        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="small" color="#6c63ff" />
            <Text style={styles.analyzingText}>Hunar AI is analyzing your requirement...</Text>
          </View>
        )}

        {/* Multilingual Input Box */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type here in Roman Urdu, English..."
            placeholderTextColor="#8a8d9e"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.7}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Error Protection */}
      <CustomPopup 
        visible={popupVisible}
        title="Empty Message"
        message="Please type your requirement before sending."
        onClose={() => setPopupVisible(false)}
        confirmText="Got it"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3a', // Deep Blue Theme
  },
  keyboardView: {
    flex: 1,
  },
  chatContainer: {
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
  messageWrapperAI: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
  },
  messageBubbleUser: {
    backgroundColor: '#6c63ff', // Royal Purple
    borderBottomRightRadius: 4, // Chat tail effect
  },
  messageBubbleAI: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Dark overlay
    borderBottomLeftRadius: 4, // Chat tail effect
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.4)',
  },
  tagText: {
    color: '#a09de6',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 18,
    backgroundColor: '#ffffff', // High contrast button inside the AI bubble
    paddingVertical: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#1a1f3a', // Deep blue text
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  analyzingText: {
    color: '#a09de6',
    fontSize: 14,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(26, 31, 58, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 120,
    minHeight: 52,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6c63ff', // Sleek primary send button
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 0,
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 18,
    transform: [{ rotate: '-45deg' }], // Tilts arrow for a paper-plane look
    marginLeft: 2,
    marginBottom: 2,
  },
});

export default ChatScreen;
