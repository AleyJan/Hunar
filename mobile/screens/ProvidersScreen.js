import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getMatches } from '../api/client';
import { SCREENS } from '../navigation/AppNavigator';

export default function ProvidersScreen() {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('bestMatch'); // 'bestMatch', 'nearest', 'cheapest', 'highestRated'
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();

  // Handle params safely
  const extracted = route.params?.extracted || {};
  const { services = [], location = 'Unknown', urgency, budgetSensitive } = extracted;

  const loadProviders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // API call using Phase 1 getMatches mapping
      const result = await getMatches(services[0] || 'Unknown Service', location, urgency, budgetSensitive);
      setProviders(result.matches || []);
    } catch (e) {
      setError('Providers load nahi ho sake. Dobara try karein.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
  };

  // ---------------------------------------------------------------------------
  // CLIENT-SIDE SORTING
  // ---------------------------------------------------------------------------
  // useMemo ensures we only recalculate the sorted array when `providers` or `activeFilter` changes
  const sortedProviders = useMemo(() => {
    const listCopy = [...providers]; // Shallow copy so we never mutate the React state directly
    switch (activeFilter) {
      case 'nearest':
        return listCopy.sort((a, b) => a.distanceKm - b.distanceKm);
      case 'cheapest':
        return listCopy.sort((a, b) => a.rate - b.rate);
      case 'highestRated':
        return listCopy.sort((a, b) => b.rating - a.rating);
      case 'bestMatch':
      default:
        // sort by combined AI score descending
        return listCopy.sort((a, b) => b.score - a.score);
    }
  }, [providers, activeFilter]);

  const handleSelectProvider = (provider) => {
    // Navigate passing the selected provider to specific pricing screen setup
    navigation.navigate(SCREENS.PRICING, { provider, extracted });
  };

  // ---------------------------------------------------------------------------
  // Nabil's Dummy UI Shell
  // ---------------------------------------------------------------------------
  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={{ marginTop: 10, color: '#1a1f3a' }}>Finding best matching providers...</Text>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProviders}>
          <Text style={styles.retryButtonText}>Dobara Try Karein</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty State - Guided recovery
  if (providers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Is waqt koi provider available nahi</Text>
        <Text style={styles.hintText}>Alternate times zaroor try karein in {location}:</Text>
        {["Kal Subah (9:00 AM)", "Dopahar (2:00 PM)", "Shaam (5:00 PM)"].map((slot, i) => (
          <View key={i} style={styles.slotChip}>
            <Text style={{ color: '#6b7280' }}>{slot}</Text>
          </View>
        ))}
      </View>
    );
  }

  // Normal Loaded State
  const renderProvider = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectProvider(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.avatar}</Text></View>
        <View>
          <Text style={styles.providerName}>{item.name}</Text>
          <Text style={styles.providerDetail}>{item.skills.join(', ')} • {item.sector}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>⭐ {item.rating} ({item.reviewCount})</Text>
        <Text style={styles.stat}>📍 {item.distanceKm} km</Text>
        <Text style={styles.statRate}>RS {item.rate}</Text>
      </View>
      <Text style={styles.reasonText}>{item.reason}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Provider</Text>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'bestMatch', label: 'Best Match' },
          { key: 'nearest', label: 'Nearest' },
          { key: 'cheapest', label: 'Cheapest' },
          { key: 'highestRated', label: 'Highest Rated' },
        ].map((f) => (
          <TouchableOpacity 
            key={f.key} 
            onPress={() => handleFilterChange(f.key)}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sortedProviders}
        keyExtractor={item => item.id}
        renderItem={renderProvider}
        contentContainerStyle={{ padding: 15 }}
      />
    </View>
  );
}

// Minimal placeholder styles, using exact Design System colors
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fc', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#1a1f3a', padding: 20, textAlign: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8eaf0' },
  errorText: { color: '#ff6b6b', fontSize: 16, marginBottom: 15, textAlign: 'center' }, 
  retryButton: { backgroundColor: '#6c63ff', padding: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#1a1f3a', marginBottom: 10, textAlign: 'center' },
  hintText: { color: '#6b7280', marginBottom: 15, textAlign: 'center' },
  slotChip: { backgroundColor: '#e8eaf0', padding: 12, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' },
  filterContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#e8eaf0' },
  filterChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#e8eaf0' },
  filterChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  filterChipText: { color: '#6b7280', fontSize: 12 },
  filterChipTextActive: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e8eaf0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  providerName: { fontSize: 18, fontWeight: 'bold', color: '#1a1f3a' },
  providerDetail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e8eaf0', paddingVertical: 12 },
  stat: { color: '#1a1f3a', fontSize: 14 },
  statRate: { color: '#06d6a0', fontWeight: 'bold', fontSize: 14 }, 
  reasonText: { color: '#1a1f3a', fontSize: 13, fontStyle: 'italic', backgroundColor: '#ffd166', padding: 10, borderRadius: 6, marginTop: 5, overflow: 'hidden' }, 
});
