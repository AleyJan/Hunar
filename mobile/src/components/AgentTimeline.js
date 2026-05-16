import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const AgentTimeline = ({ logs }) => {
  const renderItem = ({ item }) => (
    <View style={styles.logItem}>
      <View style={styles.dot} />
      <Text style={styles.logText}>{item.message}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agent Thinking Log</Text>
      <FlatList
        data={logs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)', // Light Purple tint
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  header: {
    color: '#6c63ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContainer: {
    paddingLeft: 8,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6c63ff',
    marginRight: 12,
  },
  logText: {
    color: '#e0e0e0', // Light gray for deep blue backgrounds
    fontSize: 14,
    flex: 1,
  },
});

export default AgentTimeline;
