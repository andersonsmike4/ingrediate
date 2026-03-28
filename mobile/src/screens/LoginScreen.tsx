import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      let errorMessage = 'Something went wrong. Please try again.';

      // Network error (fetch fails, timeout)
      if (error instanceof TypeError || error.message === 'Network request failed') {
        errorMessage = 'Unable to connect. Check your internet connection.';
      }
      // Auth error (401)
      else if (error.message === 'Unauthorized' || error.message?.toLowerCase().includes('invalid')) {
        errorMessage = 'Invalid email or password';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.primary }]}>Ingrediate</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
          accessibilityLabel="Email"
          accessibilityHint="Enter your email address"
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          accessibilityLabel="Password"
          accessibilityHint="Enter your password"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          accessibilityHint="Sign in to your account"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Signup')}
          disabled={isLoading}
          accessibilityRole="link"
          accessibilityLabel="Sign up"
          accessibilityHint="Create a new account"
        >
          <Text style={[styles.linkText, { color: colors.textSecondary }]}>
            Don't have an account? <Text style={[styles.linkTextBold, { color: colors.primary }]}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: '600',
  },
});
