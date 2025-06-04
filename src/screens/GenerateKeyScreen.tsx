import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { PGPService } from '../services/PGPService';
import { isValidEmail, checkPassphraseStrength } from '../utils/helpers';
import { RootStackParamList } from '../types';

type GenerateKeyScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GenerateKey'
>;

interface Props {
  navigation: GenerateKeyScreenNavigationProp;
}

export const GenerateKeyScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passphraseError, setPassphraseError] = useState('');
  const [confirmPassphraseError, setConfirmPassphraseError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setNameError('');
    setEmailError('');
    setPassphraseError('');
    setConfirmPassphraseError('');

    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate passphrase
    if (!passphrase) {
      setPassphraseError('Passphrase is required');
      isValid = false;
    } else {
      const strength = checkPassphraseStrength(passphrase);
      if (strength === 'weak') {
        setPassphraseError('Passphrase is too weak. Please use a stronger passphrase.');
        isValid = false;
      }
    }

    // Validate passphrase confirmation
    if (!confirmPassphrase) {
      setConfirmPassphraseError('Please confirm your passphrase');
      isValid = false;
    } else if (passphrase !== confirmPassphrase) {
      setConfirmPassphraseError('Passphrases do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleGenerateKey = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);

    try {
      const result = await PGPService.generateKeyPair(name.trim(), email.trim(), passphrase);

      if (result.success && result.keyPair) {
        Alert.alert(
          'Success',
          'PGP key pair generated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to generate key pair');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while generating keys');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPassphraseStrengthColor = (): string => {
    if (!passphrase) return '#e0e0e0';
    const strength = checkPassphraseStrength(passphrase);
    switch (strength) {
      case 'weak':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'strong':
        return '#4caf50';
      default:
        return '#e0e0e0';
    }
  };

  const getPassphraseStrengthText = (): string => {
    if (!passphrase) return '';
    const strength = checkPassphraseStrength(passphrase);
    switch (strength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>Generate PGP Key Pair</Text>
            <Text style={styles.subtitle}>
              Create a new PGP key pair for encrypting and signing messages
            </Text>

            <View style={styles.form}>
              <CustomInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                error={nameError}
                autoCapitalize="words"
              />

              <CustomInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <CustomInput
                label="Passphrase"
                value={passphrase}
                onChangeText={setPassphrase}
                placeholder="Enter a strong passphrase"
                error={passphraseError}
                secureTextEntry
                autoCapitalize="none"
              />

              {passphrase ? (
                <View style={styles.strengthIndicator}>
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: getPassphraseStrengthColor() },
                    ]}
                  />
                  <Text style={styles.strengthText}>
                    {getPassphraseStrengthText()}
                  </Text>
                </View>
              ) : null}

              <CustomInput
                label="Confirm Passphrase"
                value={confirmPassphrase}
                onChangeText={setConfirmPassphrase}
                placeholder="Confirm your passphrase"
                error={confirmPassphraseError}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>⚠️ Important Security Notes:</Text>
              <Text style={styles.infoText}>
                • Your passphrase protects your private key{'\n'}
                • Choose a strong, unique passphrase{'\n'}
                • Store your passphrase safely - it cannot be recovered{'\n'}
                • Key generation may take a few moments
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <CustomButton
                title={isGenerating ? 'Generating...' : 'Generate Key Pair'}
                onPress={handleGenerateKey}
                loading={isGenerating}
                disabled={isGenerating}
                variant="primary"
                size="large"
              />

              <CustomButton
                title="Cancel"
                onPress={() => navigation.goBack()}
                variant="secondary"
                size="large"
                disabled={isGenerating}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  strengthIndicator: {
    marginTop: 8,
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  strengthText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
});
