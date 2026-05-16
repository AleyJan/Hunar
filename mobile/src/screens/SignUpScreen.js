import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import CustomButton from '../components/CustomButton';
import CustomPopup from '../components/CustomPopup';

const SignUpScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({ title: '', message: '' });

  const handleSignUp = () => {
    // Validate all fields are filled
    if (!fullName.trim() || !emailOrPhone.trim() || !password.trim() || !confirmPassword.trim()) {
      setPopupConfig({
        title: 'Validation Error',
        message: 'All fields are required to create an account.'
      });
      setPopupVisible(true);
      return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      setPopupConfig({
        title: 'Password Mismatch',
        message: 'Your passwords do not match. Please try again.'
      });
      setPopupVisible(true);
      return;
    }

    // Simulate successful registration and replace route to Chat
    navigation.replace('Chat');
  };

  const handleSignInNavigation = () => {
    navigation.navigate('SignIn');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Hunar and discover local talents</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#8a8d9e"
                value={fullName}
                onChangeText={setFullName}
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>Email or Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or phone"
                placeholderTextColor="#8a8d9e"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#8a8d9e"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor="#8a8d9e"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <CustomButton 
              title="Sign Up" 
              onPress={handleSignUp} 
              style={styles.signUpButton}
            />

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignInNavigation} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Popup for robust error handling without system alerts */}
      <CustomPopup 
        visible={popupVisible}
        title={popupConfig.title}
        message={popupConfig.message}
        onClose={() => setPopupVisible(false)}
        confirmText="Got it"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3a', // Dark Deep Blue background
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 50,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#ffffff', // White text layer
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#a09de6', // Purple subtitle styling
    letterSpacing: 0.2,
  },
  formContainer: {
    width: '100%',
  },
  inputBlock: {
    marginBottom: 20,
  },
  label: {
    color: '#ffffff', // White label layers
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.4)', // Sleek purple boundary
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  signUpButton: {
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#6c63ff', // Sharp Royal Purple
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#8a8d9e',
    fontSize: 15,
  },
  footerLink: {
    color: '#6c63ff', // Sharp Royal Purple
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
