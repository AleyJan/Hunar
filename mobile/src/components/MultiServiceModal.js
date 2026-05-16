import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import CustomButton from './CustomButton';

const MultiServiceModal = ({ visible, onClose, services, onSelectFlow }) => {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Split Service Flow</Text>
                <Text style={styles.subtitle}>Select how you want to proceed</Text>
              </View>
              
              <ScrollView style={styles.servicesList}>
                {services && services.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <CustomButton 
                      title="Select" 
                      onPress={() => onSelectFlow(service)} 
                      style={styles.selectBtn}
                      textStyle={styles.selectBtnText}
                    />
                  </View>
                ))}
              </ScrollView>
              
              <CustomButton 
                title="Cancel" 
                onPress={onClose} 
                style={styles.cancelButton} 
                textStyle={styles.cancelButtonText}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 31, 58, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1f3a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c63ff',
  },
  servicesList: {
    marginBottom: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceName: {
    fontSize: 16,
    color: '#1a1f3a',
    flex: 1,
  },
  selectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  selectBtnText: {
    color: '#6c63ff',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    shadowOpacity: 0,
    elevation: 0,
  },
  cancelButtonText: {
    color: '#1a1f3a',
  },
});

export default MultiServiceModal;
