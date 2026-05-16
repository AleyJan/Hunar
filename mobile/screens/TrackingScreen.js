import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getTracking } from '../api/client';
import { SCREENS } from '../navigation/AppNavigator';

const STATUS_TO_STEP = {
  confirmed: 0,
  en_route: 1,
  arrived: 2,
  in_progress: 3,
  completed: 4,
};

export default function TrackingScreen() {
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params || {};

  const feedbackTimerRef = useRef(null);

  // ---------------------------------------------------------------------------
  // SYSTEM 1: REAL API POLLING (every 30s)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!booking) return;

    // Fetch immediately on mount
    const fetchStatus = async () => {
      try {
        const result = await getTracking(booking.bookingId);
        setTrackingStatus(result);
        setStepIndex(prev => Math.max(prev, STATUS_TO_STEP[result.status] ?? 0));
      } catch (error) {
        console.warn("Polling error:", error);
      }
    };
    
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 30000);

    return () => clearInterval(intervalId);
  }, [booking]);

  // ---------------------------------------------------------------------------
  // SYSTEM 2: HACKATHON DEMO SIMULATION (Moves every 8s)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let t1, t2, t3, t4;
    
    t1 = setTimeout(() => setStepIndex(prev => Math.max(prev, 1)), 8000);
    t2 = setTimeout(() => setStepIndex(prev => Math.max(prev, 2)), 16000);
    t3 = setTimeout(() => setStepIndex(prev => Math.max(prev, 3)), 24000);
    t4 = setTimeout(() => setStepIndex(prev => Math.max(prev, 4)), 32000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // COMPLETION CONDITION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (stepIndex === 4) {
      feedbackTimerRef.current = setTimeout(() => {
        navigation.navigate(SCREENS.FEEDBACK, { booking });
      }, 3000);
    }
    
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [stepIndex, navigation, booking]);

  // ---------------------------------------------------------------------------
  // Nabil's Dummy UI Shell
  // ---------------------------------------------------------------------------

  const stepLabels = [
    "Booking Confirmed",
    "Provider En Route",
    "Arrived",
    "Work In Progress",
    "Service Complete"
  ];

  if (!booking) {
    return <View style={styles.centerContainer}><Text style={styles.mapText}>No booking data.</Text></View>;
  }

  // Completion State Render
  if (stepIndex === 4) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.completeCircle}>
          <Text style={styles.completeCheck}>✓</Text>
        </View>
        <Text style={styles.completeTitle}>Service Complete!</Text>
        <Text style={styles.completeSub}>Navigating to Feedback...</Text>
        <TouchableOpacity 
          style={styles.nowBtn} 
          onPress={() => navigation.navigate(SCREENS.FEEDBACK, { booking })}
        >
          <Text style={styles.nowBtnText}>Give Feedback Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tracking Booking</Text>
        <Text style={styles.headerRef}>{booking.bookingId}</Text>
      </View>

      {/* Map Block Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>[ Map Component Block ]</Text>
        {trackingStatus && trackingStatus.eta && (
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>{trackingStatus.eta}</Text>
          </View>
        )}
      </View>

      {/* Dynamic Status Stepper */}
      <View style={styles.stepperContainer}>
        <Text style={styles.providerLabel}>{booking.providerName} is handling your request</Text>
        
        <View style={styles.stepperLine}>
          {stepLabels.map((label, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={[styles.stepDot, stepIndex >= idx && styles.stepDotActive]} />
              <View style={styles.stepContent}>
                <Text style={[styles.stepText, stepIndex >= idx && styles.stepTextActive]}>{label}</Text>
                {stepIndex === idx && trackingStatus?.message && (
                  <Text style={styles.stepSubtext}>{trackingStatus.message}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// Minimal placeholder styles, mapped precisely to Design System
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fc' },
  header: { backgroundColor: '#ffffff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e8eaf0', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1f3a' },
  headerRef: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  mapPlaceholder: { height: 250, backgroundColor: '#e8eaf0', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#6b7280', fontStyle: 'italic' },
  etaBox: { position: 'absolute', bottom: 15, right: 15, backgroundColor: '#6c63ff', padding: 10, borderRadius: 8 },
  etaLabel: { color: '#ffffff', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  etaValue: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  stepperContainer: { backgroundColor: '#ffffff', flex: 1, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20 },
  providerLabel: { fontSize: 16, fontWeight: 'bold', color: '#1a1f3a', marginBottom: 20, textAlign: 'center' },
  stepperLine: { paddingLeft: 10 },
  stepRow: { flexDirection: 'row', marginBottom: 25 },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e8eaf0', marginTop: 4, marginRight: 15 },
  stepDotActive: { backgroundColor: '#06d6a0' },
  stepContent: { flex: 1 },
  stepText: { fontSize: 15, color: '#6b7280' },
  stepTextActive: { color: '#1a1f3a', fontWeight: 'bold' },
  stepSubtext: { color: '#6c63ff', fontSize: 12, marginTop: 4 },
  completeCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#06d6a0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  completeCheck: { color: '#ffffff', fontSize: 40, fontWeight: 'bold' },
  completeTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1f3a' },
  completeSub: { color: '#6b7280', marginTop: 10, marginBottom: 30 },
  nowBtn: { backgroundColor: '#6c63ff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  nowBtnText: { color: '#ffffff', fontWeight: 'bold' },
});
