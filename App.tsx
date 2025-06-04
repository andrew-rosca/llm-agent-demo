import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  HomeScreen,
  GenerateKeyScreen,
  ImportKeyScreen,
  PGPOperationScreen,
  KeyManagementScreen,
  KeyDetailsScreen,
} from './src/screens';
import { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const AppContent = () => (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'PGP Mobile' }}
        />
        <Stack.Screen
          name="GenerateKey"
          component={GenerateKeyScreen}
          options={{ title: 'Generate Key Pair' }}
        />
        <Stack.Screen
          name="ImportKey"
          component={ImportKeyScreen}
          options={{ title: 'Import Key' }}
        />
        <Stack.Screen
          name="PGPOperation"
          component={PGPOperationScreen}
          options={{ title: 'PGP Operations' }}
        />
        <Stack.Screen
          name="KeyManagement"
          component={KeyManagementScreen}
          options={{ title: 'Key Management' }}
        />
        <Stack.Screen
          name="KeyDetails"
          component={KeyDetailsScreen}
          options={{ title: 'Key Details' }}
        />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );

  // Use SafeAreaProvider only on mobile platforms
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <AppContent />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
