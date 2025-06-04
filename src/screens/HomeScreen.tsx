import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { PGPService } from '../services/PGPService';
import { StoredKeyPair } from '../types';
import CustomButton from '../components/CustomButton';
import { formatDate, getShortKeyId } from '../utils/helpers';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [keyPairs, setKeyPairs] = useState<StoredKeyPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadKeyPairs();
  }, []);

  const loadKeyPairs = async () => {
    try {
      const keys = await PGPService.getAllKeys();
      setKeyPairs(keys);
    } catch (error) {
      console.error('Failed to load key pairs:', error);
      Alert.alert('Error', 'Failed to load key pairs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadKeyPairs();
  };

  const navigateToOperation = (operation: string) => {
    if (operation === 'generate') {
      navigation.navigate('GenerateKey');
    } else if (operation === 'import') {
      navigation.navigate('ImportKey');
    } else {
      navigation.navigate('PGPOperation', { operation });
    }
  };

  const navigateToKeyManagement = () => {
    navigation.navigate('KeyManagement');
  };

  const deleteKey = async (keyId: string) => {
    Alert.alert(
      'Delete Key',
      'Are you sure you want to delete this key pair? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PGPService.deleteKey(keyId);
              loadKeyPairs();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete key pair');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>PGP Mobile</Text>
        <Text style={styles.subtitle}>Secure messaging on the go</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigateToOperation('encrypt')}
          >
            <Text style={styles.actionIcon}>🔒</Text>
            <Text style={styles.actionTitle}>Encrypt</Text>
            <Text style={styles.actionSubtitle}>Secure your messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigateToOperation('decrypt')}
          >
            <Text style={styles.actionIcon}>🔓</Text>
            <Text style={styles.actionTitle}>Decrypt</Text>
            <Text style={styles.actionSubtitle}>Read encrypted messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigateToOperation('sign')}
          >
            <Text style={styles.actionIcon}>✍️</Text>
            <Text style={styles.actionTitle}>Sign</Text>
            <Text style={styles.actionSubtitle}>Verify authenticity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigateToOperation('verify')}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionTitle}>Verify</Text>
            <Text style={styles.actionSubtitle}>Check signatures</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Keys ({keyPairs.length})</Text>
          <TouchableOpacity onPress={navigateToKeyManagement}>
            <Text style={styles.manageLink}>Manage</Text>
          </TouchableOpacity>
        </View>

        {keyPairs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔑</Text>
            <Text style={styles.emptyStateTitle}>No Keys Found</Text>
            <Text style={styles.emptyStateText}>
              Generate or import a key pair to get started with PGP operations.
            </Text>
            <View style={styles.emptyStateActions}>
              <CustomButton
                title="Generate Key"
                onPress={() => navigateToOperation('generate')}
                style={styles.emptyStateButton}
              />
              <CustomButton
                title="Import Key"
                onPress={() => navigateToOperation('import')}
                variant="secondary"
                style={styles.emptyStateButton}
              />
            </View>
          </View>
        ) : (
          <View>
            {keyPairs.slice(0, 3).map((keyPair) => (
              <TouchableOpacity
                key={keyPair.keyId}
                style={styles.keyCard}
                onPress={() => navigation.navigate('KeyDetails', { keyId: keyPair.keyId })}
              >
                <View style={styles.keyInfo}>
                  <Text style={styles.keyName}>{keyPair.name}</Text>
                  <Text style={styles.keyEmail}>{keyPair.email}</Text>
                  <Text style={styles.keyMeta}>
                    ID: {getShortKeyId(keyPair.fingerprint)} • {formatDate(keyPair.createdAt)}
                  </Text>
                </View>
                <View style={styles.keyActions}>
                  {keyPair.hasPrivateKey && (
                    <View style={styles.keyBadge}>
                      <Text style={styles.keyBadgeText}>Private</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => deleteKey(keyPair.keyId)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            
            {keyPairs.length > 3 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={navigateToKeyManagement}
              >
                <Text style={styles.showMoreText}>
                  Show {keyPairs.length - 3} more keys
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Management</Text>
        <CustomButton
          title="Generate New Key Pair"
          onPress={() => navigateToOperation('generate')}
          style={styles.sectionButton}
        />
        <CustomButton
          title="Import Existing Keys"
          onPress={() => navigateToOperation('import')}
          variant="secondary"
          style={styles.sectionButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  
  manageLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  actionCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  
  emptyStateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  emptyStateButton: {
    flex: 1,
    minWidth: 120,
  },
  
  keyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  
  keyInfo: {
    flex: 1,
  },
  
  keyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  keyEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  
  keyMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  
  keyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  keyBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  
  keyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  deleteButton: {
    padding: 8,
  },
  
  deleteButtonText: {
    fontSize: 16,
  },
  
  showMoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  
  showMoreText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  sectionButton: {
    marginBottom: 8,
  },
});

export default HomeScreen;
