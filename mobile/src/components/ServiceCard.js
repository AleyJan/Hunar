import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import CustomButton from './CustomButton';

const ServiceCard = ({ provider, onSelect, buttonTitle = "Select Provider" }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder} />
        <View style={styles.info}>
          <Text style={styles.name}>{provider.name}</Text>
          <Text style={styles.service}>{provider.serviceType}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ {provider.rating}</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.price}>${provider.price}/hr</Text>
        <Text style={styles.distance}>{provider.distance} away</Text>
      </View>
      
      <CustomButton 
        title={buttonTitle} 
        onPress={() => onSelect(provider)} 
        style={styles.selectButton} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1f3a',
    marginBottom: 4,
  },
  service: {
    fontSize: 14,
    color: '#6c63ff',
  },
  ratingBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#6c63ff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1f3a',
  },
  distance: {
    fontSize: 14,
    color: '#888',
  },
  selectButton: {
    paddingVertical: 12,
  },
});

export default ServiceCard;
