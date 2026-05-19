import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export default function DynamicInvoice({ pricing }) {
    if (!pricing) return null;

    const {
        baseRate, distanceFee, urgencyPremium,
        complexityMultiplier, loyaltyDiscount,
        surgeMultiplier, totalAmount, distanceKm,
    } = pricing;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>HUNAR Verified Price Quote</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Base Service Rate</Text>
                <Text style={styles.value}>Rs. {baseRate}</Text>
            </View>

            <View style={styles.row}>
                <View>
                    <Text style={styles.label}>Travel Fee</Text>
                    {distanceKm && <Text style={styles.subtext}>({distanceKm?.toFixed(1)} km @ Rs. 50/km)</Text>}
                </View>
                <Text style={styles.value}>Rs. {distanceFee}</Text>
            </View>

            {urgencyPremium > 0 && (
                <View style={styles.row}>
                    <Text style={[styles.label, { color: THEME.colors.urgencyHigh }]}>Urgency Premium</Text>
                    <Text style={[styles.value, { color: THEME.colors.urgencyHigh }]}>+ Rs. {urgencyPremium}</Text>
                </View>
            )}

            {loyaltyDiscount > 0 && (
                <View style={styles.row}>
                    <Text style={[styles.label, { color: THEME.colors.success }]}>Loyalty Discount</Text>
                    <Text style={[styles.value, { color: THEME.colors.success }]}>- Rs. {loyaltyDiscount}</Text>
                </View>
            )}

            <View style={styles.divider} />

            {complexityMultiplier > 1 && (
                <View style={styles.rowSub}>
                    <Text style={styles.subtext}>Complexity Factor</Text>
                    <Text style={styles.subValue}>x {complexityMultiplier}</Text>
                </View>
            )}

            {surgeMultiplier > 1 && (
                <View style={styles.rowSub}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="thunderstorm-outline" size={14} color={THEME.colors.urgencyMedium} />
                        <Text style={[styles.subtext, { color: THEME.colors.urgencyMedium, marginLeft: 4 }]}>Surge Applied</Text>
                    </View>
                    <Text style={[styles.subValue, { color: THEME.colors.urgencyMedium, fontWeight: '700' }]}>x {surgeMultiplier}</Text>
                </View>
            )}

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Estimated Price</Text>
                <Text style={styles.totalValue}>Rs. {Math.round(totalAmount)}</Text>
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={THEME.colors.primary} />
                <Text style={styles.infoText}>
                    HUNAR enforces standard prices. Providers cannot overcharge you.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: THEME.colors.bgCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        ...THEME.shadows.premium,
        marginVertical: 12,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.colors.textDark,
        marginBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
    label: {
        color: THEME.colors.textDark,
        fontSize: 13,
        fontWeight: '500',
    },
    value: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.colors.textDark,
    },
    subtext: {
        fontSize: 11,
        color: THEME.colors.textMuted,
    },
    divider: {
        height: 1,
        backgroundColor: THEME.colors.border,
        marginVertical: 10,
    },
    rowSub: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 3,
    },
    subValue: {
        fontSize: 12,
        color: THEME.colors.textDark,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: THEME.colors.primary,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: THEME.colors.textDark,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: THEME.colors.primary,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: THEME.colors.primaryLight,
        padding: 10,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
    },
    infoText: {
        color: THEME.colors.primaryDark,
        fontSize: 11,
        marginLeft: 8,
        flex: 1,
    },
});