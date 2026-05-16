import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { SCREENS } from '../navigation/AppNavigator';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();
  const { signup } = useAuth();

  const handleSignup = async () => {
    // Validate inputs before hitting the API
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Saray fields daalein");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password kam az kam 6 characters ka hona chahiye");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords match nahi kar rahe");
      return;
    }

    setIsSubmitting(true);
    try {
      // Call auth context which saves to AsyncStorage
      await signup(name, email, password);
      // On success: navigation handles redirect automatically
    } catch (error) {
      Alert.alert("Signup Failed", error.message || "Apka signup fail ho gaya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // UI SHELL
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#6b7280"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#6b7280"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#6b7280"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#6b7280"
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignup} 
        disabled={isSubmitting} // Passed to Nabil's loading prop equivalent
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate(SCREENS.LOGIN)} style={styles.linkButton}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// Minimal placeholder styles, using Design System colors
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f7f8fc' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1f3a', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e8eaf0', padding: 15, borderRadius: 8, marginBottom: 15, backgroundColor: '#ffffff', color: '#1a1f3a' },
  button: { backgroundColor: '#6c63ff', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  linkButton: { padding: 10 },
  linkText: { color: '#6c63ff', textAlign: 'center' },
});
