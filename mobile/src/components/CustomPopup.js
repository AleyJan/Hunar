import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import CustomButton from './CustomButton';

const CustomPopup = ({ visible, title, message, onClose, onConfirm, confirmText = 'OK', cancelText = 'Cancel', showCancel = false }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popupContainer}>
              {title && <Text style={styles.title}>{title}</Text>}
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.buttonContainer}>
                {showCancel && (
                  <CustomButton 
                    title={cancelText} 
                    onPress={onClose} 
                    style={styles.cancelButton} 
                    textStyle={styles.cancelButtonText} 
                  />
                )}
                <CustomButton 
                  title={confirmText} 
                  onPress={onConfirm || onClose} 
                  style={styles.confirmButton} 
                />
              </View>
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
    backgroundColor: 'rgba(26, 31, 58, 0.85)', // Deep Blue with opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1f3a', // Deep Blue
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  cancelButtonText: {
    color: '#1a1f3a',
  },
  confirmButton: {
    flex: 1,
  },
});

export default CustomPopup;
