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
import { StackNavigationProp } from '@react-navigation/stack';
import CustomDocumentPicker from '../components/CustomDocumentPicker';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { PGPService } from '../services/PGPService';
import { detectPGPContent } from '../utils/helpers';
import { RootStackParamList } from '../types';

type ImportKeyScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ImportKey'
>;

interface Props {
  navigation: ImportKeyScreenNavigationProp;
}

export const ImportKeyScreen: React.FC<Props> = ({ navigation }) => {
  const [keyText, setKeyText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [keyError, setKeyError] = useState('');

  const validateKey = (text: string): boolean => {
    if (!text.trim()) {
      setKeyError('Key content is required');
      return false;
    }

    const detectedType = detectPGPContent(text);
    if (detectedType === 'unknown') {
      setKeyError('Invalid PGP key format. Please paste a valid PGP key.');
      return false;
    }

    setKeyError('');
    return true;
  };

  const handleImportKey = async () => {
    if (!validateKey(keyText)) {
      return;
    }

    setIsImporting(true);

    try {
      const result = await PGPService.importKey(keyText.trim(), passphrase);

      if (result.success) {
        Alert.alert(
          'Success',
          `PGP key imported successfully!\n\nKey ID: ${result.keyId}\nUser ID: ${result.userId}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Import Failed', result.error || 'Failed to import key');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while importing the key');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await CustomDocumentPicker.pick({
        type: [CustomDocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        
        // On web, we can directly use the file content
        if (Platform.OS === 'web' && file.content) {
          setKeyText(file.content);
          Alert.alert(
            'File Loaded',
            `Successfully loaded key from: ${file.name}`
          );
        } else {
          // On mobile, show the file selection message
          Alert.alert(
            'File Selected',
            `Selected: ${file.name}\n\nPlease copy and paste the key content manually for now.`
          );
        }
      }
    } catch (error) {
      if (!CustomDocumentPicker.isCancel(error)) {
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  const getKeyInfo = () => {
    if (!keyText.trim()) return null;

    const detectedType = detectPGPContent(keyText);
    switch (detectedType) {
      case 'public-key':
        return {
          type: 'Public Key',
          icon: '🔓',
          description: 'This key can be used to encrypt messages and verify signatures',
        };
      case 'private-key':
        return {
          type: 'Private Key',
          icon: '🔐',
          description: 'This key can decrypt messages and create signatures',
        };
      case 'message':
        return {
          type: 'Encrypted Message',
          icon: '💬',
          description: 'This appears to be an encrypted message, not a key',
        };
      default:
        return null;
    }
  };

  const keyInfo = getKeyInfo();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>Import PGP Key</Text>
            <Text style={styles.subtitle}>
              Import an existing PGP public or private key
            </Text>

            <View style={styles.importOptions}>
              <CustomButton
                title="📁 Pick Key File"
                onPress={handlePickFile}
                variant="secondary"
                size="medium"
                disabled={isImporting}
              />
              <Text style={styles.orText}>or paste key below</Text>
            </View>

            <CustomInput
              label="PGP Key Content"
              value={keyText}
              onChangeText={setKeyText}
              placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;...&#10;-----END PGP PUBLIC KEY BLOCK-----"
              error={keyError}
              multiline
              numberOfLines={8}
              autoCapitalize="none"
              style={styles.keyInput}
            />

            {keyInfo && (
              <View style={styles.keyInfoBox}>
                <Text style={styles.keyInfoTitle}>
                  {keyInfo.icon} {keyInfo.type} Detected
                </Text>
                <Text style={styles.keyInfoDescription}>
                  {keyInfo.description}
                </Text>
              </View>
            )}

            {detectPGPContent(keyText) === 'private-key' && (
              <CustomInput
                label="Passphrase (if required)"
                value={passphrase}
                onChangeText={setPassphrase}
                placeholder="Enter passphrase to unlock private key"
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📋 Supported Formats:</Text>
              <Text style={styles.infoText}>
                • ASCII-armored PGP keys{'\n'}
                • Public key blocks{'\n'}
                • Private key blocks{'\n'}
                • Keys exported from GPG, Kleopatra, or other PGP tools
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <CustomButton
                title={isImporting ? 'Importing...' : 'Import Key'}
                onPress={handleImportKey}
                loading={isImporting}
                disabled={isImporting || !keyText.trim()}
                variant="primary"
                size="large"
              />

              <CustomButton
                title="Cancel"
                onPress={() => navigation.goBack()}
                variant="secondary"
                size="large"
                disabled={isImporting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  importOptions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  keyInput: {
    minHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  keyInfoBox: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  keyInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  keyInfoDescription: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
});
