import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import CustomButton from '../components/CustomButton';
import CustomPopup from '../components/CustomPopup';

const TrackingScreen = ({ navigation }) => {
  // jobStatus: 0 = riding, 1 = arrived/working, 2 = completed
  const [jobStatus, setJobStatus] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);

  const statusMessages = [
    "🛵 Karigar is riding to your location...",
    "⚡ Karigar arrived & Work started...",
    "✅ Work completed successfully!"
  ];

  const handleSimulateArrival = () => {
    setJobStatus(1);
  };

  const handleSimulateCompletion = () => {
    setJobStatus(2);
  };

  const handleProceedToPayment = () => {
    try {
      navigation.navigate('Feedback');
    } catch (error) {
      setPopupVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Panel - Karigar Details */}
      <View style={styles.topPanel}>
        <Text style={styles.providerName}>Amjad Khan is on his way!</Text>
        {jobStatus === 0 && <Text style={styles.etaText}>ETA: 12 Mins</Text>}
        {jobStatus === 1 && <Text style={styles.etaText}>Status: In Progress</Text>}
        {jobStatus === 2 && <Text style={styles.etaText}>Status: Finished</Text>}
      </View>

      {/* Live Progress Container */}
      <View style={styles.progressContainer}>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusMessages[jobStatus]}</Text>
          
          {/* Visual Indicator of Progress */}
          <View style={styles.progressTracker}>
            <View style={[styles.progressDot, jobStatus >= 0 && styles.progressDotActive]} />
            <View style={[styles.progressLine, jobStatus >= 1 && styles.progressLineActive]} />
            <View style={[styles.progressDot, jobStatus >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, jobStatus >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, jobStatus >= 2 && styles.progressDotActive]} />
          </View>
        </View>
      </View>

      {/* Interactive Controls & Complete Action */}
      <View style={styles.bottomPanel}>
        {jobStatus < 2 ? (
          <View style={styles.simulationControls}>
            <Text style={styles.simulationLabel}>Presentation Controls:</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.simButton, jobStatus >= 1 && styles.simButtonDisabled]} 
                onPress={handleSimulateArrival}
                disabled={jobStatus >= 1}
                activeOpacity={0.7}
              >
                <Text style={styles.simButtonText}>Simulate Arrival</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.simButton, jobStatus === 2 && styles.simButtonDisabled]} 
                onPress={handleSimulateCompletion}
                disabled={jobStatus === 2}
                activeOpacity={0.7}
              >
                <Text style={styles.simButtonText}>Simulate Completion</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CustomButton 
            title="Proceed to Payment & Rating" 
            onPress={handleProceedToPayment} 
            style={styles.proceedButton}
          />
        )}
      </View>

      {/* Fallback Custom Error Popup */}
      <CustomPopup 
        visible={popupVisible}
        title="Navigation Error"
        message="Unable to load the rating screen. Please try again."
        onClose={() => setPopupVisible(false)}
        confirmText="OK"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3a', // Deep Blue
  },
  topPanel: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.2)',
    alignItems: 'center',
    marginTop: 20,
  },
  providerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  etaText: {
    fontSize: 16,
    color: '#6c63ff', // Royal Purple
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusBox: {
    width: '100%',
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  statusText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 30,
  },
  progressTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressDotActive: {
    backgroundColor: '#6c63ff', // Royal Purple
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  progressLine: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#6c63ff',
  },
  bottomPanel: {
    padding: 24,
    paddingBottom: 40,
  },
  simulationControls: {
    width: '100%',
    alignItems: 'center',
  },
  simulationLabel: {
    color: '#8a8d9e',
    fontSize: 12,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  simButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  simButtonDisabled: {
    opacity: 0.4,
  },
  simButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#6c63ff', // Massive Royal Purple
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }
});

export default TrackingScreen;
