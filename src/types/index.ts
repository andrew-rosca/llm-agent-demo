export interface PGPKeyPair {
  id: string;
  name: string;
  email: string;
  publicKey: string;
  privateKey?: string;
  fingerprint: string;
  createdAt: Date;
}

export interface PGPMessage {
  id: string;
  content: string;
  encrypted?: boolean;
  signed?: boolean;
  senderKeyId?: string;
  recipientKeyId?: string;
  createdAt: Date;
}

export interface EncryptionResult {
  encryptedMessage: string;
  success: boolean;
  error?: string;
}

export interface DecryptionResult {
  decryptedMessage: string;
  success: boolean;
  verified?: boolean;
  error?: string;
}

export interface SignatureResult {
  signedMessage: string;
  success: boolean;
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  message: string;
  signerKeyId?: string;
  success: boolean;
  error?: string;
}

export interface KeyGenerationParams {
  name: string;
  email: string;
  passphrase: string;
  keySize?: number;
}

export type PGPOperation = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'generate';
export type PGPOperationType = 'encrypt' | 'decrypt' | 'sign' | 'verify';

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  GenerateKey: undefined;
  ImportKey: undefined;
  PGPOperation: { operation: PGPOperationType };
  KeyManagement: undefined;
  KeyDetails: { keyId: string };
};

// Additional PGP Service Types
export interface PGPResult {
  success: boolean;
  error?: string;
  data?: string;
  keyId?: string;
  userId?: string;
  verified?: boolean;
  keyPair?: StoredKeyPair;
}

export interface StoredKeyPair {
  keyId: string;
  name: string;
  email: string;
  fingerprint: string;
  hasPrivateKey: boolean;
  createdAt: Date;
  publicKeyArmored: string;
}

export interface PassphraseStrength {
  score: number; // 0-4
  feedback: string[];
}

export interface NavigationState {
  index: number;
  routes: Array<{
    key: string;
    name: string;
    params?: object;
  }>;
}
