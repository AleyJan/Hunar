import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';

export default function TrackingScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>My Bookings — Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.bgLight, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 16, color: THEME.colors.textDark },
});