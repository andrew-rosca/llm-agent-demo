import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { PGPService } from '../services/PGPService';
import { copyToClipboard, detectPGPContent } from '../utils/helpers';
import { RootStackParamList, StoredKeyPair, PGPOperationType } from '../types';

type PGPOperationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PGPOperation'
>;

type PGPOperationScreenRouteProp = RouteProp<RootStackParamList, 'PGPOperation'>;

interface Props {
  navigation: PGPOperationScreenNavigationProp;
  route: PGPOperationScreenRouteProp;
}

export const PGPOperationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { operation: initialOperation } = route.params;
  
  const [operation, setOperation] = useState<PGPOperationType>(initialOperation);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [recipientKeyId, setRecipientKeyId] = useState('');
  const [availableKeys, setAvailableKeys] = useState<StoredKeyPair[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [inputError, setInputError] = useState('');

  useEffect(() => {
    loadAvailableKeys();
  }, []);

  const loadAvailableKeys = async () => {
    try {
      const keys = await PGPService.getAllKeys();
      setAvailableKeys(keys);
      
      // Auto-select first available key
      if (keys.length > 0) {
        setSelectedKeyId(keys[0].keyId);
        setRecipientKeyId(keys[0].keyId);
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  };

  const validateInput = (): boolean => {
    setInputError('');

    if (!inputText.trim()) {
      setInputError('Input text is required');
      return false;
    }

    // Validate input based on operation
    switch (operation) {
      case 'decrypt':
        if (detectPGPContent(inputText) !== 'message') {
          setInputError('Please enter a valid PGP encrypted message');
          return false;
        }
        break;
      case 'verify':
        if (detectPGPContent(inputText) === 'unknown') {
          setInputError('Please enter a valid PGP signed message');
          return false;
        }
        break;
    }

    // Validate key selection
    if ((operation === 'encrypt' && !recipientKeyId) || 
        (['decrypt', 'sign', 'verify'].includes(operation) && !selectedKeyId)) {
      Alert.alert('Error', 'Please select a key for this operation');
      return false;
    }

    return true;
  };

  const handleOperation = async () => {
    if (!validateInput()) {
      return;
    }

    setIsProcessing(true);
    setOutputText('');

    try {
      let result;

      switch (operation) {
        case 'encrypt':
          result = await PGPService.encryptMessage(inputText, recipientKeyId);
          break;
        case 'decrypt':
          result = await PGPService.decryptMessage(inputText, selectedKeyId, passphrase);
          break;
        case 'sign':
          result = await PGPService.signMessage(inputText, selectedKeyId, passphrase);
          break;
        case 'verify':
          result = await PGPService.verifyMessage(inputText, selectedKeyId);
          break;
        default:
          throw new Error('Invalid operation');
      }

      if (result.success) {
        if (operation === 'verify') {
          Alert.alert(
            'Verification Result',
            result.verified ? 'Signature is valid ✅' : 'Signature is invalid ❌',
            [{ text: 'OK' }]
          );
          if (result.data) {
            setOutputText(result.data);
          }
        } else {
          setOutputText(result.data || '');
        }
      } else {
        Alert.alert('Operation Failed', result.error || 'Operation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyOutput = async () => {
    if (outputText) {
      await copyToClipboard(outputText);
      Alert.alert('Copied', 'Output copied to clipboard');
    }
  };

  const handleClearAll = () => {
    setInputText('');
    setOutputText('');
    setPassphrase('');
    setInputError('');
  };

  const getOperationTitle = () => {
    switch (operation) {
      case 'encrypt':
        return 'Encrypt Message';
      case 'decrypt':
        return 'Decrypt Message';
      case 'sign':
        return 'Sign Message';
      case 'verify':
        return 'Verify Signature';
      default:
        return 'PGP Operation';
    }
  };

  const getOperationDescription = () => {
    switch (operation) {
      case 'encrypt':
        return 'Encrypt a message using a public key';
      case 'decrypt':
        return 'Decrypt a message using your private key';
      case 'sign':
        return 'Create a digital signature for a message';
      case 'verify':
        return 'Verify the signature of a message';
      default:
        return '';
    }
  };

  const getInputPlaceholder = () => {
    switch (operation) {
      case 'encrypt':
        return 'Enter the message you want to encrypt...';
      case 'decrypt':
        return 'Paste the encrypted PGP message here...';
      case 'sign':
        return 'Enter the message you want to sign...';
      case 'verify':
        return 'Paste the signed PGP message here...';
      default:
        return 'Enter your message...';
    }
  };

  const needsPassphrase = ['decrypt', 'sign'].includes(operation);
  const needsRecipient = operation === 'encrypt';
  const privateKeys = availableKeys.filter(key => key.hasPrivateKey);
  const publicKeys = availableKeys;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>{getOperationTitle()}</Text>
            <Text style={styles.subtitle}>{getOperationDescription()}</Text>

            {/* Operation Selector */}
            <View style={styles.operationSelector}>
              <Text style={styles.sectionTitle}>Operation</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={operation}
                  onValueChange={(value: PGPOperationType) => {
                    setOperation(value);
                    setInputText('');
                    setOutputText('');
                    setInputError('');
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="🔒 Encrypt Message" value="encrypt" />
                  <Picker.Item label="🔓 Decrypt Message" value="decrypt" />
                  <Picker.Item label="✍️ Sign Message" value="sign" />
                  <Picker.Item label="✅ Verify Signature" value="verify" />
                </Picker>
              </View>
            </View>

            {/* Key Selection */}
            {needsRecipient && (
              <View style={styles.keySelector}>
                <Text style={styles.sectionTitle}>Recipient's Public Key</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={recipientKeyId}
                    onValueChange={setRecipientKeyId}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a public key..." value="" />
                    {publicKeys.map((key) => (
                      <Picker.Item
                        key={key.keyId}
                        label={`${key.name} <${key.email}>`}
                        value={key.keyId}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {!needsRecipient && (
              <View style={styles.keySelector}>
                <Text style={styles.sectionTitle}>
                  {needsPassphrase ? 'Your Private Key' : 'Your Key'}
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedKeyId}
                    onValueChange={setSelectedKeyId}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a key..." value="" />
                    {(needsPassphrase ? privateKeys : publicKeys).map((key) => (
                      <Picker.Item
                        key={key.keyId}
                        label={`${key.name} <${key.email}>`}
                        value={key.keyId}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Input Text */}
            <CustomInput
              label="Input Message"
              value={inputText}
              onChangeText={setInputText}
              placeholder={getInputPlaceholder()}
              error={inputError}
              multiline
              numberOfLines={6}
              style={styles.textArea}
            />

            {/* Passphrase */}
            {needsPassphrase && (
              <CustomInput
                label="Passphrase"
                value={passphrase}
                onChangeText={setPassphrase}
                placeholder="Enter your private key passphrase"
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <CustomButton
                title={isProcessing ? 'Processing...' : getOperationTitle()}
                onPress={handleOperation}
                loading={isProcessing}
                disabled={isProcessing}
                variant="primary"
                size="large"
              />

              <CustomButton
                title="Clear All"
                onPress={handleClearAll}
                variant="secondary"
                size="medium"
                disabled={isProcessing}
              />
            </View>

            {/* Output */}
            {outputText ? (
              <View style={styles.outputSection}>
                <View style={styles.outputHeader}>
                  <Text style={styles.sectionTitle}>Output</Text>
                  <CustomButton
                    title="📋 Copy"
                    onPress={handleCopyOutput}
                    variant="secondary"
                    size="small"
                  />
                </View>
                <View style={styles.outputContainer}>
                  <Text style={styles.outputText}>{outputText}</Text>
                </View>
              </View>
            ) : null}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  operationSelector: {
    marginBottom: 24,
  },
  keySelector: {
    marginBottom: 24,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  outputSection: {
    marginTop: 24,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    minHeight: 120,
  },
  outputText: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
});
