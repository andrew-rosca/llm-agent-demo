import { Platform } from 'react-native';

// Web-compatible secure storage interface
class CustomSecureStore {
  static async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, use localStorage with encryption warning
      console.warn('Web storage is not as secure as native secure storage');
      localStorage.setItem(key, value);
    } else {
      // For mobile, use Expo SecureStore
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  }

  static async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // For web, use localStorage
      return localStorage.getItem(key);
    } else {
      // For mobile, use Expo SecureStore
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
  }

  static async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, use localStorage
      localStorage.removeItem(key);
    } else {
      // For mobile, use Expo SecureStore
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  }
}

export default CustomSecureStore;
