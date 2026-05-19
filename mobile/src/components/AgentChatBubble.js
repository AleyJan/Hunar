import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

export default function AgentChatBubble({ message, isUser, isClarification }) {
    return (
        <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
            {!isUser && (
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>H</Text>
                </View>
            )}
            <View style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleAgent,
                isClarification && styles.bubbleClarify,
            ]}>
                {!isUser && (
                    <Text style={styles.agentTag}>HUNAR AI</Text>
                )}
                <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
                    {message}
                </Text>
                {isClarification && (
                    <View style={styles.clarifyBadge}>
                        <Text style={styles.clarifyBadgeText}>Needs Clarification</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        marginVertical: 6,
        alignItems: 'flex-end',
        maxWidth: '85%',
    },
    rowUser: { alignSelf: 'flex-end' },
    rowAgent: { alignSelf: 'flex-start' },
    avatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: THEME.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 8,
    },
    avatarText: { color: THEME.colors.white, fontWeight: '800', fontSize: 14 },
    bubble: {
        padding: 12, borderRadius: 16, maxWidth: '90%',
        ...THEME.shadows.premium,
    },
    bubbleUser: {
        backgroundColor: THEME.colors.primary,
        borderBottomRightRadius: 2,
    },
    bubbleAgent: {
        backgroundColor: THEME.colors.bgCard,
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    bubbleClarify: {
        borderColor: THEME.colors.urgencyMedium,
        borderWidth: 1.5,
        backgroundColor: '#FFFBEB',
    },
    agentTag: {
        fontSize: 10, fontWeight: '700',
        color: THEME.colors.primary,
        marginBottom: 4, textTransform: 'uppercase',
    },
    text: { fontSize: 14, lineHeight: 20 },
    textUser: { color: THEME.colors.white },
    textAgent: { color: THEME.colors.textDark },
    clarifyBadge: {
        backgroundColor: THEME.colors.urgencyMedium,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 4, alignSelf: 'flex-start', marginTop: 8,
    },
    clarifyBadgeText: { color: THEME.colors.white, fontSize: 10, fontWeight: 'bold' },
});