import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { parseRequest } from '../api/client';
import { SCREENS } from '../navigation/AppNavigator';

const QUICK_REPLIES = ['Plumber chahiye', 'AC theek karo', 'Electrician bhejo', 'Kal subah chahiye'];

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [multiServices, setMultiServices] = useState([]);
  const [showMultiModal, setShowMultiModal] = useState(false);

  const flatListRef = useRef(null);
  const navTimeoutRef = useRef(null);
  
  const navigation = useNavigation();
  const { currentUser } = useAuth();

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  const addMessage = (type, text, extracted = null) => {
    const newMessage = { id: Date.now().toString() + Math.random().toString(), type, text, extracted };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || inputText;
    
    // 1. Guard clause
    if (!textToSend || textToSend.trim() === '') return;

    // 2. Capture and clear immediately (feels fast)
    setInputText('');

    // 3. Add user message
    addMessage('user', textToSend.trim());
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // 4. Set loading state
    setIsSending(true);

    try {
      // 5. Call API
      const parsedResult = await parseRequest(textToSend.trim(), currentUser.userId);
      const { services, confidence, clarifyQuestion } = parsedResult;

      // 7. Outcome branching
      if (confidence < 0.7) {
        // A. Low confidence Outcome
        addMessage('bot', clarifyQuestion || "Mujhe theek se samajh nahi aya, kya aap tafseel se batayenge?");
      } 
      else if (services && services.length > 1) {
        // B. Multi-service Outcome
        addMessage('bot', `${services.length} services detect ki hain: ${services.join(' aur ')}`);
        setMultiServices(services);
        setShowMultiModal(true);
      } 
      else {
        // C. Normal (1 service) high confidence
        addMessage('bot', null, parsedResult);
        navTimeoutRef.current = setTimeout(() => {
          navigation.navigate(SCREENS.PROVIDERS, { extracted: parsedResult });
        }, 1500);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      // 8. Error catch
      addMessage('bot', 'Connection error. Internet check karein aur dobara try karein.');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      // 9. Reset loading
      setIsSending(false);
    }
  };

  const handleQuickReply = (chipText) => {
    handleSend(chipText);
  };

  const handleMultiSeparate = () => {
    setShowMultiModal(false);
    navigation.navigate(SCREENS.PROVIDERS, { 
      extracted: { services: [multiServices[0]] } // Only pass first service
    });
  };

  const handleMultiCombined = () => {
    setShowMultiModal(false);
    navigation.navigate(SCREENS.PROVIDERS, { 
      extracted: { services: multiServices, multiSkill: true } 
    });
  };

  // ---------------------------------------------------------------------------
  // Nabil's Dummy UI Shell
  // ---------------------------------------------------------------------------
  const renderMessage = ({ item }) => {
    const isBot = item.type === 'bot';
    return (
      <View style={[styles.messageWrapper, isBot ? styles.botWrapper : styles.userWrapper]}>
        {item.text ? <Text style={[styles.messageText, isBot && styles.botText]}>{item.text}</Text> : null}
        {item.extracted && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Searching for: {item.extracted.services.join(', ')}</Text>
            <Text style={styles.cardDetail}>Location: {item.extracted.location}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hunar Assistant</Text>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      {isSending && <ActivityIndicator color="#6c63ff" style={{ marginVertical: 10 }} />}

      <View style={styles.quickRepliesContainer}>
        {QUICK_REPLIES.map((reply, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => handleQuickReply(reply)}>
            <Text style={styles.chipText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Apni service type karein..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend(null)}
          placeholderTextColor="#6b7280"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(null)} disabled={isSending || !inputText.trim()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMultiModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Multi-Service Detected</Text>
            <Text style={styles.modalBody}>
              Aap ne {multiServices.join(' aur ')} ka zikar kiya hai. 
              Kya aap ek provider chahte hain jo dono kaam janta ho, ya sirf pehli service?
            </Text>
            <TouchableOpacity style={styles.modalBtnMain} onPress={handleMultiCombined}>
              <Text style={styles.modalBtnTextMain}>Dono Kaam (Combo)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnSec} onPress={handleMultiSeparate}>
              <Text style={styles.modalBtnTextSec}>Sirf {multiServices[0]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Minimal placeholder styles, using Design System colors
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fc' },
  header: { fontSize: 20, fontWeight: 'bold', color: '#1a1f3a', padding: 20, textAlign: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8eaf0' },
  messageWrapper: { padding: 12, marginHorizontal: 15, marginVertical: 5, borderRadius: 8, maxWidth: '80%' },
  userWrapper: { backgroundColor: '#6c63ff', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  botWrapper: { backgroundColor: '#fff', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e8eaf0', borderBottomLeftRadius: 2 },
  messageText: { color: '#fff', fontSize: 16 },
  botText: { color: '#1a1f3a' },
  card: { backgroundColor: '#e8eaf0', padding: 15, borderRadius: 5, marginTop: 5 },
  cardTitle: { fontWeight: 'bold', color: '#1a1f3a', fontSize: 16 },
  cardDetail: { color: '#6b7280', marginTop: 4 },
  quickRepliesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 10 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#6c63ff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 15, margin: 5 },
  chipText: { color: '#6c63ff', fontSize: 14, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e8eaf0' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e8eaf0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, marginRight: 10, color: '#1a1f3a', backgroundColor: '#f7f8fc' },
  sendBtn: { backgroundColor: '#6c63ff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 31, 58, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 12, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1f3a', marginBottom: 12 },
  modalBody: { color: '#6b7280', fontSize: 16, marginBottom: 25, lineHeight: 22 },
  modalBtnMain: { backgroundColor: '#6c63ff', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  modalBtnTextMain: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalBtnSec: { backgroundColor: '#f7f8fc', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e8eaf0' },
  modalBtnTextSec: { color: '#1a1f3a', fontWeight: 'bold', fontSize: 16 }
});
