import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { serviceAPI } from '../../services/api';
import { THEME } from '../../constants/theme';
import AgentChatBubble from '../../components/AgentChatBubble';
import ReasoningTraceBox from '../../components/ReasoningTraceBox';

const QUICK_PROMPTS = [
    'AC bilkul kaam nahi kar raha G-13 mein',
    'Plumber chahiye G-13 mein urgent',
    'Electrician chahiye F-10 mein kal',
    'Carpenter G-11 mein chahiye',
];

export default function AIRequestHub({ navigation }) {
    const { user, logout } = useAuth();
    const flatListRef = useRef(null);

    const [messages, setMessages] = useState([
        {
            id: '1',
            isUser: false,
            text: `Assalam o Alaikum ${user?.name?.split(' ')[0] || ''}! 👋\n\nKaunsi service chahiye? Roman Urdu, English, ya mix mein bolo — main samjhunga!`,
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastTrace, setLastTrace] = useState(null);
    const [conversation, setConversation] = useState('');
    const [awaitingReply, setAwaitingReply] = useState(false);

    const addMessage = (msg) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), ...msg }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleSend = async (text) => {
        const message = text || input.trim();
        if (!message) return;

        setInput('');
        addMessage({ isUser: true, text: message });
        setLoading(true);

        // Build full conversation context
        const fullContext = conversation
            ? `${conversation}. User added: ${message}`
            : message;

        // Update conversation memory
        setConversation(fullContext);

        try {
            const res = await serviceAPI.parseRequest(fullContext, user?.sector || 'G-13');
            const data = res.data.data;
            const parsed = data.parsed;
            const trace = data.trace;

            setLastTrace(trace);

            if (data.needsClarification) {
                setAwaitingReply(true);
                addMessage({
                    isUser: false,
                    text: data.clarifyingQuestion,
                    isClarification: true,
                });
            } else {
                setAwaitingReply(false);
                setConversation(''); // reset after successful parse

                const summary =
                    `Samajh gaya! Yeh mila:\n\n` +
                    `🔧 Service: ${parsed.service?.replace(/_/g, ' ').toUpperCase()}\n` +
                    `📍 Location: ${parsed.sector || user?.sector || 'Islamabad'}\n` +
                    `⚡ Urgency: ${parsed.urgency?.toUpperCase()}\n` +
                    `💰 Budget: ${parsed.budgetSensitivity === 'price_sensitive' ? 'Kam budget' : 'Normal'}\n` +
                    `🎯 Confidence: ${Math.round((parsed.confidence || 0) * 100)}%`;

                addMessage({ isUser: false, text: summary });

                setTimeout(() => {
                    addMessage({
                        isUser: false,
                        text: `Best providers dhundh raha hun ${parsed.sector || user?.sector || 'aapke area'} mein...`,
                    });
                    setTimeout(() => {
                        navigation.navigate('Matching', { parsed });
                    }, 1200);
                }, 800);
            }
        } catch (err) {
            console.log('Parse error:', err.message);
            addMessage({
                isUser: false,
                text: 'Network error. Backend se connection nahi ho raha. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isLast = item.id === messages[messages.length - 1]?.id;
        return (
            <View>
                <AgentChatBubble
                    message={item.text || ''}
                    isUser={item.isUser}
                    isClarification={item.isClarification}
                />
                {!item.isUser && isLast && lastTrace ? (
                    <ReasoningTraceBox trace={lastTrace} />
                ) : null}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <StatusBar barStyle="light-content" backgroundColor={THEME.colors.primaryDark} />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>HUNAR AI</Text>
                    <Text style={styles.headerSub}>
                        {user?.sector ? `Sector: ${user.sector}` : 'Islamabad'}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Online</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatArea}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {loading && (
                <View style={styles.typingRow}>
                    <ActivityIndicator size="small" color={THEME.colors.primary} />
                    <Text style={styles.typingText}>HUNAR AI soch raha hai...</Text>
                </View>
            )}

            {awaitingReply && (
                <View style={styles.contextBanner}>
                    <Ionicons name="chatbubble-ellipses" size={13} color={THEME.colors.accent} />
                    <Text style={styles.contextText}>
                        Context yaad hai — bas jawab do
                    </Text>
                </View>
            )}

            <View style={styles.quickRow}>
                <FlatList
                    horizontal
                    data={QUICK_PROMPTS}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={i => i}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.quickChip, { marginRight: 8 }]}
                            onPress={() => {
                                setConversation('');
                                setAwaitingReply(false);
                                handleSend(item);
                            }}
                        >
                            <Text style={styles.quickChipText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                />
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder={
                        awaitingReply
                            ? 'Jawab do — context yaad hai...'
                            : 'Kuch bhi likho — Urdu ya English...'
                    }
                    placeholderTextColor={THEME.colors.textMuted}
                    multiline
                    maxLength={300}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
                    onPress={() => handleSend()}
                    disabled={!input.trim() || loading}
                >
                    <Ionicons name="send" size={18} color={THEME.colors.white} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: THEME.colors.primaryDark,
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: THEME.colors.white, letterSpacing: 2 },
    headerSub: { fontSize: 12, color: THEME.colors.accent, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    onlineBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, gap: 6,
    },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.success },
    onlineText: { color: THEME.colors.white, fontSize: 11, fontWeight: '600' },
    logoutBtn: { padding: 4 },
    chatArea: {
        padding: 16,
        paddingBottom: 8,
        backgroundColor: THEME.colors.bgLight,
        flexGrow: 1,
    },
    typingRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 8,
        backgroundColor: THEME.colors.bgLight, gap: 8,
    },
    typingText: { fontSize: 12, color: THEME.colors.textMuted, fontStyle: 'italic' },
    contextBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: THEME.colors.accentLight,
        paddingHorizontal: 16, paddingVertical: 6,
        gap: 6,
    },
    contextText: { fontSize: 11, color: THEME.colors.accent, fontWeight: '600' },
    quickRow: {
        backgroundColor: THEME.colors.bgLight,
        paddingVertical: 10,
        borderTopWidth: 0.5,
        borderTopColor: THEME.colors.border,
    },
    quickChip: {
        backgroundColor: THEME.colors.primaryLight,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: THEME.colors.primary,
    },
    quickChipText: { color: THEME.colors.primary, fontSize: 12, fontWeight: '600' },
    inputRow: {
        flexDirection: 'row', alignItems: 'flex-end',
        padding: 12, gap: 10,
        backgroundColor: THEME.colors.white,
        borderTopWidth: 0.5, borderTopColor: THEME.colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: THEME.colors.bgLight,
        borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 14, color: THEME.colors.textDark,
        maxHeight: 100, borderWidth: 1, borderColor: THEME.colors.border,
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: THEME.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        ...THEME.shadows.float,
    },
});