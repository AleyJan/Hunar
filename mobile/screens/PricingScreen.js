import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPrice, confirmBook } from '../api/client';
import { SCREENS } from '../navigation/AppNavigator';

export default function PricingScreen() {
  const [priceData, setPriceData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useAuth();

  const { provider, extracted } = route.params || {};

  const loadPrice = async () => {
    if (!provider || !extracted) return;
    setIsLoadingPrice(true);
    try {
      const data = await getPrice(
        provider.id, 
        extracted.services?.[0] || 'Unknown Service', 
        extracted.urgency, 
        provider.distanceKm, 
        currentUser.userId
      );
      setPriceData(data);
    } catch (error) {
      Alert.alert("Error", "Price calculate nahi ho saka. Dobara try karein.");
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    loadPrice();
  }, []);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = async () => {
    // 1. Guard clause checking slot
    if (!selectedSlot) {
      Alert.alert("Time Required", "Pehle ek time slot chunein");
      return;
    }

    // 2. Set loading state before network request
    setIsConfirming(true);

    try {
      // 3. Make the API confirmBook call
      const result = await confirmBook(
        provider.id,
        currentUser.userId,
        extracted.services?.[0], 
        selectedSlot,
        priceData.total,
        extracted.location 
      );
      
      // 4. On absolute success navigate directly
      navigation.navigate(SCREENS.BOOKING_CONFIRMED, { booking: result });
      
    } catch (error) {
      // 5. Explicitly handle HTTP 409 conflict correctly
      if (error.response?.status === 409) {
        const nextSlots = error.response?.data?.nextAvailable || [];
        const slotsMsg = nextSlots.length > 0 ? `\nAvailable slots: ${nextSlots.join(', ')}` : '';
        Alert.alert("Slot Taken", `Yeh slot already book ho chuka hai.${slotsMsg}`);
      } else {
        // 6. Provide universal fallback error
        Alert.alert("Error", "Booking fail ho gayi. Dobara try karein.");
      }
    } finally {
      // 7. Reset the state in finally to unblock button
      setIsConfirming(false);
    }
  };

  const handleBudgetOption = () => {
    // Navigate BACK with a cloned parameter tracking the budget sensitivity manually
    const modifiedExtracted = { ...extracted, budgetSensitive: true };
    // Instruct React Navigation to push the view replacing its extracted constraints
    navigation.navigate(SCREENS.PROVIDERS, { extracted: modifiedExtracted });
  };

  // ---------------------------------------------------------------------------
  // Nabil's Dummy UI Shell
  // ---------------------------------------------------------------------------

  if (!provider) {
    return <View style={styles.centerContainer}><Text>Error: Provider is missing.</Text></View>;
  }

  if (isLoadingPrice) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.loadingText}>Calculating fare breakdown...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* HEADER SECTION */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Booking {provider.name}</Text>
        <Text style={styles.headerSubtext}>{extracted.services?.[0]} • {provider.sector}</Text>
      </View>

      {/* TIME SLOTS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Slots (Pick One)</Text>
        <View style={styles.slotsContainer}>
          {provider.slots && provider.slots.map((slot, index) => (
            <TouchableOpacity 
              key={index}
              style={[styles.slotChip, selectedSlot === slot && styles.slotChipSelected]}
              onPress={() => handleSelectSlot(slot)}
              disabled={isConfirming}
            >
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* PRICING DETAILS SECTION */}
      {priceData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Estimate</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Base Rate:</Text><Text style={styles.priceValue}>PKR {priceData.baseRate}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Distance Fee:</Text><Text style={styles.priceValue}>PKR {priceData.distanceFee}</Text></View>
            {priceData.urgencyPremium > 0 && <View style={styles.priceRow}><Text style={styles.priceLabel}>Urgency Premium:</Text><Text style={styles.priceValue}>PKR {priceData.urgencyPremium}</Text></View>}
            {priceData.loyaltyDiscount > 0 && <View style={styles.priceRow}><Text style={styles.priceLabel}>Loyalty Discount:</Text><Text style={[styles.priceValue, styles.discountText]}>- PKR {priceData.loyaltyDiscount}</Text></View>}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Estimate</Text>
              <Text style={styles.totalValue}>PKR {priceData.total}</Text>
            </View>
            <Text style={styles.breakdownText}>{priceData.breakdown}</Text>
          </View>
        </View>
      )}

      {/* CHEAPER ALTERNATIVE SECTION */}
      {priceData?.alternative && (
        <View style={styles.alternativeCard}>
          <Text style={styles.alternativeTitle}>Budget Option available 💰</Text>
          <Text style={styles.alternativeDesc}>
            {priceData.alternative.name} can do this for PKR {priceData.alternative.total}.
          </Text>
          <TouchableOpacity style={styles.alternativeBtn} onPress={handleBudgetOption}>
            <Text style={styles.alternativeBtnText}>Cheaper options dekhein</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONFIRM BOOKING BUTTON */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.confirmBtn, !selectedSlot && styles.confirmBtnDisabled]} 
          onPress={handleConfirm}
          disabled={isConfirming || !selectedSlot}
        >
          {isConfirming ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Booking (PKR {priceData?.total})</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fc' },
  loadingText: { marginTop: 15, color: '#6b7280' },
  headerBox: { backgroundColor: '#ffffff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e8eaf0', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1f3a' },
  headerSubtext: { fontSize: 14, color: '#6b7280', marginTop: 5 },
  section: { marginTop: 20, paddingHorizontal: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1f3a', marginBottom: 12 },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  slotChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8eaf0', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginRight: 10, marginBottom: 10 },
  slotChipSelected: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  slotText: { color: '#1a1f3a', fontSize: 14 },
  slotTextSelected: { color: '#ffffff', fontWeight: 'bold' },
  priceCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e8eaf0' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { color: '#6b7280', fontSize: 14 },
  priceValue: { color: '#1a1f3a', fontSize: 14, fontWeight: '500' },
  discountText: { color: '#06d6a0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e8eaf0' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1a1f3a' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#6c63ff' },
  breakdownText: { fontSize: 11, color: '#6b7280', marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
  alternativeCard: { backgroundColor: '#ffd166', padding: 15, marginHorizontal: 15, marginTop: 20, borderRadius: 10, borderWidth: 1, borderColor: '#e8eaf0' },
  alternativeTitle: { fontWeight: 'bold', color: '#1a1f3a', fontSize: 15, marginBottom: 5 },
  alternativeDesc: { color: '#1a1f3a', fontSize: 13, marginBottom: 15 },
  alternativeBtn: { backgroundColor: '#ffffff', padding: 10, borderRadius: 8, alignItems: 'center' },
  alternativeBtnText: { color: '#1a1f3a', fontWeight: 'bold' },
  bottomSection: { paddingHorizontal: 15, marginTop: 30 },
  confirmBtn: { backgroundColor: '#06d6a0', padding: 16, borderRadius: 8, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#a0aabf' },
  confirmBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
