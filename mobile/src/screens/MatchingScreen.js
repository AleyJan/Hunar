import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import AgentTimeline from '../components/AgentTimeline';
import ServiceCard from '../components/ServiceCard';
import CustomPopup from '../components/CustomPopup';
import { getMatches } from '../api/client';

const MatchingScreen = ({ navigation, route }) => {
  const { extracted } = route.params || {};
  const [logs, setLogs] = useState([]);
  const [isMatched, setIsMatched] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [fetchedProvider, setFetchedProvider] = useState(null);

  // Workflow steps replicating Agent logic
  const workflowLogs = [
    { message: "🔍 Multi-Agent Orchestrator dispatched..." },
    { message: "🤖 Checking available verified Electricians/Technicians in G-13..." },
    { message: "🤝 Negotiating standard price brackets with top matches..." },
    { message: "✅ Match Found! Best matching profile secured." }
  ];

  useEffect(() => {
    let currentLogIndex = 0;
    
    // Fetch real data quietly while simulation runs
    const fetchRealMatch = async () => {
      try {
        const result = await getMatches(
           extracted?.services?.[0] || 'Any',
           extracted?.location || 'Any',
           'Normal',
           false
        );
        if (result && result.matches && result.matches.length > 0) {
          setFetchedProvider(result.matches[0]);
        }
      } catch (e) {
        // Silent catch for dummy flow, will fallback to mock
      }
    };
    fetchRealMatch();
    
    // Push a log every 1.5 seconds to simulate real-time processing
    const intervalId = setInterval(() => {
      if (currentLogIndex < workflowLogs.length) {
        setLogs(prev => [...prev, workflowLogs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(intervalId);
        setIsMatched(true);
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, []);

  const handleAcceptAndTrack = () => {
    // Pass extracted params down if needed later
    navigation.navigate('Tracking', { booking: fetchedProvider });
  };

  const defaultMockProvider = {
    name: "Amjad Khan (AC Expert)",
    serviceType: "AC Technician",
    rating: "4.9 ⭐ (120+ Jobs)",
    price: "PKR 1,500",
    distance: "15 Mins"
  };

  const displayProvider = fetchedProvider ? {
    name: fetchedProvider.name,
    serviceType: extracted?.services?.[0] || "Verified Professional",
    rating: fetchedProvider.rating + " ⭐ (" + Math.floor(Math.random() * 100 + 20) + " Jobs)",
    price: "PKR " + (fetchedProvider.priceRate || "1,500"),
    distance: (fetchedProvider.distanceKm || "2.5") + " km"
  } : defaultMockProvider;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Finding Best Karigar...</Text>
        {!isMatched && <ActivityIndicator size="small" color="#6c63ff" style={styles.loader} />}
      </View>

      <View style={styles.content}>
        {/* Render Agent Timeline visualization */}
        <AgentTimeline logs={logs} />
        
        {/* Render Match Card when ready */}
        {isMatched && (
          <View style={styles.matchContainer}>
            <Text style={styles.matchTitle}>Top Match Secured</Text>
            <ServiceCard 
              provider={displayProvider} 
              onSelect={handleAcceptAndTrack} 
              buttonTitle="Accept & Track"
            />
          </View>
        )}
      </View>

      {/* Fallback Custom Error Popup */}
      <CustomPopup 
        visible={popupVisible}
        title="Matching Error"
        message="An issue occurred while matching you with a provider."
        onClose={() => setPopupVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3a', // Dark Deep Blue
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loader: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  matchContainer: {
    marginTop: 20,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    marginLeft: 4,
  }
});

export default MatchingScreen;
