import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import CustomButton from '../components/CustomButton';
import CustomPopup from '../components/CustomPopup';

const SignInScreen = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({ title: '', message: '' });

  const handleSignIn = () => {
    // Error Protection: Validating inputs and using CustomPopup instead of Alert
    if (!emailOrPhone.trim() || !password.trim()) {
      setPopupConfig({
        title: 'Validation Error',
        message: 'Please enter both your Email/Phone and Password to sign in.'
      });
      setPopupVisible(true);
      return;
    }
    
    // Simulate successful sign in and replace route to Chat as the main app platform
    navigation.replace('Chat');
  };

  const handleSignUpNavigation = () => {
    // Safely navigate to the SignUp form
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <View style={styles.formContainer}>
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
              placeholder="Enter your password"
              placeholderTextColor="#8a8d9e"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.forgotPasswordContainer} activeOpacity={0.7}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton 
            title="Sign In" 
            onPress={handleSignIn} 
            style={styles.signInButton}
          />

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUpNavigation} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Popup acting as our styled alert overlay */}
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
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 48,
    marginTop: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#ffffff', // White text layers
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#a09de6', // Lighter purple for subtitle contrast
    letterSpacing: 0.2,
  },
  formContainer: {
    width: '100%',
  },
  inputBlock: {
    marginBottom: 24,
  },
  label: {
    color: '#ffffff', // White text layers
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.4)', // Neat subtle purple borders
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#ffffff', // White text input
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 36,
  },
  forgotPassword: {
    color: '#6c63ff', // Sharp Royal Purple
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
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

export default SignInScreen;
