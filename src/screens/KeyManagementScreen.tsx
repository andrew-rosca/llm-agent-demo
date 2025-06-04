import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';
import { PGPService } from '../services/PGPService';
import { formatFingerprint, formatDate } from '../utils/helpers';
import { RootStackParamList, StoredKeyPair } from '../types';

type KeyManagementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'KeyManagement'
>;

interface Props {
  navigation: KeyManagementScreenNavigationProp;
}

interface KeyItemProps {
  keyPair: StoredKeyPair;
  onPress: () => void;
  onDelete: () => void;
}

const KeyItem: React.FC<KeyItemProps> = ({ keyPair, onPress, onDelete }) => {
  const handleDelete = () => {
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
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.keyItem} onPress={onPress}>
      <View style={styles.keyHeader}>
        <View style={styles.keyInfo}>
          <Text style={styles.keyName}>{keyPair.name}</Text>
          <Text style={styles.keyEmail}>{keyPair.email}</Text>
        </View>
        <View style={styles.keyBadges}>
          {keyPair.hasPrivateKey && (
            <View style={[styles.badge, styles.privateBadge]}>
              <Text style={styles.badgeText}>🔐 Private</Text>
            </View>
          )}
          <View style={[styles.badge, styles.publicBadge]}>
            <Text style={styles.badgeText}>🔓 Public</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.keyDetails}>
        <Text style={styles.keyId}>
          Key ID: {keyPair.keyId.substring(0, 16)}...
        </Text>
        <Text style={styles.fingerprint}>
          {formatFingerprint(keyPair.fingerprint)}
        </Text>
        <Text style={styles.createdDate}>
          Created: {formatDate(keyPair.createdAt)}
        </Text>
      </View>

      <View style={styles.keyActions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const KeyManagementScreen: React.FC<Props> = ({ navigation }) => {
  const [keys, setKeys] = useState<StoredKeyPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadKeys = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }

    try {
      const storedKeys = await PGPService.getAllKeys();
      setKeys(storedKeys);
    } catch (error) {
      Alert.alert('Error', 'Failed to load keys');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadKeys(false);
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const result = await PGPService.deleteKey(keyId);
      
      if (result.success) {
        Alert.alert('Success', 'Key deleted successfully');
        loadKeys(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to delete key');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleViewKey = (keyPair: StoredKeyPair) => {
    navigation.navigate('KeyDetails', { keyId: keyPair.keyId });
  };

  useFocusEffect(
    useCallback(() => {
      loadKeys();
    }, [])
  );

  const renderKeyItem = ({ item }: { item: StoredKeyPair }) => (
    <KeyItem
      keyPair={item}
      onPress={() => handleViewKey(item)}
      onDelete={() => handleDeleteKey(item.keyId)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔑</Text>
      <Text style={styles.emptyStateTitle}>No Keys Found</Text>
      <Text style={styles.emptyStateDescription}>
        You haven't added any PGP keys yet. Generate a new key pair or import an existing key to get started.
      </Text>
      <View style={styles.emptyStateActions}>
        <CustomButton
          title="Generate Key Pair"
          onPress={() => navigation.navigate('GenerateKey')}
          variant="primary"
          size="medium"
        />
        <CustomButton
          title="Import Key"
          onPress={() => navigation.navigate('ImportKey')}
          variant="secondary"
          size="medium"
        />
      </View>
    </View>
  );

  const getKeyStats = () => {
    const totalKeys = keys.length;
    const privateKeys = keys.filter(k => k.hasPrivateKey).length;
    const publicKeys = keys.length; // All keys have public component
    
    return { totalKeys, privateKeys, publicKeys };
  };

  const { totalKeys, privateKeys, publicKeys } = getKeyStats();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading keys...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Key Management</Text>
        <Text style={styles.subtitle}>
          Manage your PGP keys and key pairs
        </Text>
        
        {totalKeys > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalKeys}</Text>
              <Text style={styles.statLabel}>Total Keys</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{privateKeys}</Text>
              <Text style={styles.statLabel}>Private Keys</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{publicKeys}</Text>
              <Text style={styles.statLabel}>Public Keys</Text>
            </View>
          </View>
        )}
      </View>

      {totalKeys === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={keys}
            renderItem={renderKeyItem}
            keyExtractor={(item) => item.keyId}
            style={styles.keyList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#007AFF"
              />
            }
          />

          <View style={styles.actionButtons}>
            <CustomButton
              title="➕ Generate New Key"
              onPress={() => navigation.navigate('GenerateKey')}
              variant="primary"
              size="medium"
            />
            <CustomButton
              title="📥 Import Key"
              onPress={() => navigation.navigate('ImportKey')}
              variant="secondary"
              size="medium"
            />
          </View>
        </>
      )}
    </SafeAreaView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  keyList: {
    flex: 1,
    padding: 20,
  },
  keyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  keyEmail: {
    fontSize: 14,
    color: '#666',
  },
  keyBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  privateBadge: {
    backgroundColor: '#ffebee',
  },
  publicBadge: {
    backgroundColor: '#e8f5e8',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  keyDetails: {
    marginBottom: 12,
  },
  keyId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  fingerprint: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  createdDate: {
    fontSize: 12,
    color: '#666',
  },
  keyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyStateActions: {
    gap: 12,
    width: '100%',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
