import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReasoningTraceBox({ trace }) {
    const [expanded, setExpanded] = useState(false);

    if (!trace) return null;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.8}>
                <View style={styles.headerLeft}>
                    <Ionicons name="bulb-outline" size={20} color={THEME.colors.accent} />
                    <Text style={styles.headerTitle}>AI Agent Reasoning Trace</Text>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={THEME.colors.textMuted}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.body}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: THEME.colors.primaryLight }]}>
                            <Text style={styles.badgeText}>
                                Confidence: {((trace.confidence || 0) * 100).toFixed(0)}%
                            </Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Step: {trace.step}</Text>
                        </View>
                    </View>

                    <Text style={styles.reasoningText}>{trace.reasoning}</Text>

                    <View style={styles.divider} />

                    <View style={styles.decisionRow}>
                        <Text style={styles.decisionLabel}>Decision Outcome:</Text>
                        <Text style={styles.decisionValue}>{trace.decision}</Text>
                    </View>

                    {trace.fallback_considered && (
                        <View style={styles.fallbackContainer}>
                            <Text style={styles.fallbackText}>
                                <Text style={{ fontWeight: 'bold' }}>Fallback: </Text>
                                {trace.fallback_considered}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 8,
    },
    body: {
        paddingHorizontal: 12,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        paddingTop: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    badge: {
        backgroundColor: '#334155',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    badgeText: {
        color: '#E2E8F0',
        fontSize: 11,
        fontWeight: '600',
    },
    reasoningText: {
        color: '#CBD5E1',
        fontSize: 12,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 10,
    },
    decisionRow: {
        backgroundColor: 'rgba(11, 102, 35, 0.2)',
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: THEME.colors.primary,
    },
    decisionLabel: {
        color: '#86EFAC',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    decisionValue: {
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    fallbackContainer: {
        marginTop: 10,
    },
    fallbackText: {
        color: '#94A3B8',
        fontSize: 11,
        fontStyle: 'italic',
    },
});