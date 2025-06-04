import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';
import { PGPService } from '../services/PGPService';
import { copyToClipboard, formatFingerprint, formatDate } from '../utils/helpers';
import { RootStackParamList, StoredKeyPair } from '../types';

type KeyDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'KeyDetails'
>;

type KeyDetailsScreenRouteProp = RouteProp<RootStackParamList, 'KeyDetails'>;

interface Props {
  navigation: KeyDetailsScreenNavigationProp;
  route: KeyDetailsScreenRouteProp;
}

export const KeyDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { keyId } = route.params;
  const [keyPair, setKeyPair] = useState<StoredKeyPair | null>(null);
  const [publicKeyArmored, setPublicKeyArmored] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKeyDetails();
  }, [keyId]);

  const loadKeyDetails = async () => {
    setIsLoading(true);
    
    try {
      const keys = await PGPService.getAllKeys();
      const foundKey = keys.find(k => k.keyId === keyId);
      
      if (foundKey) {
        setKeyPair(foundKey);
        
        // Get the armored public key for export
        const publicKeyResult = await PGPService.exportPublicKey(keyId);
        if (publicKeyResult.success && publicKeyResult.data) {
          setPublicKeyArmored(publicKeyResult.data);
        }
      } else {
        Alert.alert('Error', 'Key not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load key details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPublicKey = async () => {
    if (publicKeyArmored) {
      await copyToClipboard(publicKeyArmored);
      Alert.alert('Exported', 'Public key copied to clipboard');
    }
  };

  const handleDeleteKey = () => {
    if (!keyPair) return;

    Alert.alert(
      'Delete Key',
      `Are you sure you want to delete the key for ${keyPair.name}?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await PGPService.deleteKey(keyId);
              
              if (result.success) {
                Alert.alert(
                  'Success',
                  'Key deleted successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.navigate('KeyManagement'),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to delete key');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const handleUseForOperation = (operation: 'encrypt' | 'decrypt' | 'sign' | 'verify') => {
    navigation.navigate('PGPOperation', { operation });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading key details...</Text>
        </View>
      </View>
    );
  }

  if (!keyPair) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Key not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Key Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{keyPair.name}</Text>
            <Text style={styles.email}>{keyPair.email}</Text>
            
            <View style={styles.badges}>
              {keyPair.hasPrivateKey && (
                <View style={[styles.badge, styles.privateBadge]}>
                  <Text style={styles.badgeText}>🔐 Private Key Available</Text>
                </View>
              )}
              <View style={[styles.badge, styles.publicBadge]}>
                <Text style={styles.badgeText}>🔓 Public Key Available</Text>
              </View>
            </View>
          </View>

          {/* Key Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Information</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Key ID</Text>
                <TouchableOpacity onPress={() => copyToClipboard(keyPair.keyId)}>
                  <Text style={styles.infoValue}>{keyPair.keyId}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fingerprint</Text>
                <TouchableOpacity onPress={() => copyToClipboard(keyPair.fingerprint)}>
                  <Text style={[styles.infoValue, styles.fingerprint]}>
                    {formatFingerprint(keyPair.fingerprint)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {formatDate(keyPair.createdAt)}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Algorithm</Text>
                <Text style={styles.infoValue}>RSA-4096</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.actionGrid}>
              <CustomButton
                title="🔒 Encrypt"
                onPress={() => handleUseForOperation('encrypt')}
                variant="primary"
                size="medium"
              />
              
              {keyPair.hasPrivateKey && (
                <CustomButton
                  title="🔓 Decrypt"
                  onPress={() => handleUseForOperation('decrypt')}
                  variant="primary"
                  size="medium"
                />
              )}
              
              {keyPair.hasPrivateKey && (
                <CustomButton
                  title="✍️ Sign"
                  onPress={() => handleUseForOperation('sign')}
                  variant="primary"
                  size="medium"
                />
              )}
              
              <CustomButton
                title="✅ Verify"
                onPress={() => handleUseForOperation('verify')}
                variant="primary"
                size="medium"
              />
            </View>
          </View>

          {/* Export Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export & Share</Text>
            
            <CustomButton
              title="📤 Export Public Key"
              onPress={handleExportPublicKey}
              variant="secondary"
              size="large"
            />
            
            <Text style={styles.exportNote}>
              Share your public key with others so they can encrypt messages for you and verify your signatures.
            </Text>
          </View>

          {/* Public Key Preview */}
          {publicKeyArmored && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Public Key (ASCII Armored)</Text>
              
              <TouchableOpacity 
                style={styles.keyPreview}
                onPress={handleExportPublicKey}
              >
                <Text style={styles.keyPreviewText} numberOfLines={8}>
                  {publicKeyArmored}
                </Text>
                <Text style={styles.tapToCopy}>Tap to copy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>
              ⚠️ Danger Zone
            </Text>
            
            <CustomButton
              title="🗑️ Delete Key"
              onPress={handleDeleteKey}
              variant="danger"
              size="large"
            />
            
            <Text style={styles.dangerNote}>
              This will permanently delete the key. This action cannot be undone.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  privateBadge: {
    backgroundColor: '#ffebee',
  },
  publicBadge: {
    backgroundColor: '#e8f5e8',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dangerTitle: {
    color: '#d32f2f',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Courier',
  },
  fingerprint: {
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exportNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  keyPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  keyPreviewText: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'Courier',
    lineHeight: 14,
  },
  tapToCopy: {
    fontSize: 10,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dangerNote: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
