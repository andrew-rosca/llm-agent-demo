import * as openpgp from 'openpgp';
import * as SecureStore from 'expo-secure-store';
import {
  PGPResult,
  StoredKeyPair,
} from '../types';

export class PGPService {
  private static readonly KEYS_STORAGE_KEY = 'pgp_keys';
  private static readonly PRIVATE_KEY_PREFIX = 'pgp_private_';

  /**
   * Generate a new PGP key pair
   */
  static async generateKeyPair(
    name: string, 
    email: string, 
    passphrase: string, 
    keySize: number = 4096
  ): Promise<PGPResult> {
    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: keySize,
        userIDs: [{ name, email }],
        passphrase,
      });

      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      const fingerprint = publicKeyObj.getFingerprint();
      const keyId = fingerprint.substring(fingerprint.length - 16);

      const keyPair: StoredKeyPair = {
        keyId,
        name,
        email,
        fingerprint,
        hasPrivateKey: true,
        createdAt: new Date(),
        publicKeyArmored: publicKey,
      };

      // Store private key securely
      await SecureStore.setItemAsync(
        `${this.PRIVATE_KEY_PREFIX}${keyId}`,
        privateKey
      );

      // Store key info
      await this.saveKeyInfo(keyPair);

      return {
        success: true,
        keyPair,
        keyId,
        userId: `${name} <${email}>`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Import an existing key
   */
  static async importKey(keyContent: string, passphrase: string = ''): Promise<PGPResult> {
    try {
      let publicKeyObj: openpgp.Key;
      let hasPrivateKey = false;
      let privateKeyArmored: string | undefined;

      // Try to read as private key first
      try {
        const privateKeyObj = await openpgp.readPrivateKey({ armoredKey: keyContent });
        publicKeyObj = privateKeyObj.toPublic();
        hasPrivateKey = true;
        privateKeyArmored = keyContent;
      } catch {
        // Try to read as public key
        publicKeyObj = await openpgp.readKey({ armoredKey: keyContent });
      }

      const user = publicKeyObj.users[0];
      const userID = user.userID;
      const fingerprint = publicKeyObj.getFingerprint();
      const keyId = fingerprint.substring(fingerprint.length - 16);

      const keyPair: StoredKeyPair = {
        keyId,
        name: userID?.name || 'Unknown',
        email: userID?.email || 'unknown@email.com',
        fingerprint,
        hasPrivateKey,
        createdAt: new Date(),
        publicKeyArmored: publicKeyObj.armor(),
      };

      // Store private key if available
      if (hasPrivateKey && privateKeyArmored) {
        await SecureStore.setItemAsync(
          `${this.PRIVATE_KEY_PREFIX}${keyId}`,
          privateKeyArmored
        );
      }

      // Store key info
      await this.saveKeyInfo(keyPair);

      return {
        success: true,
        keyPair,
        keyId,
        userId: `${keyPair.name} <${keyPair.email}>`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Encrypt a message using a public key
   */
  static async encryptMessage(message: string, recipientKeyId: string): Promise<PGPResult> {
    try {
      const keys = await this.getAllKeys();
      const recipientKey = keys.find(k => k.keyId === recipientKeyId);
      
      if (!recipientKey) {
        return {
          success: false,
          error: 'Recipient key not found',
        };
      }

      const publicKey = await openpgp.readKey({ armoredKey: recipientKey.publicKeyArmored });

      const encryptedMessage = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: publicKey,
      });

      return {
        success: true,
        data: encryptedMessage as string,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to encrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Decrypt a message using a private key
   */
  static async decryptMessage(
    encryptedMessage: string, 
    keyId: string, 
    passphrase: string
  ): Promise<PGPResult> {
    try {
      const privateKeyArmored = await SecureStore.getItemAsync(`${this.PRIVATE_KEY_PREFIX}${keyId}`);
      
      if (!privateKeyArmored) {
        return {
          success: false,
          error: 'Private key not found',
        };
      }

      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase,
      });

      const message = await openpgp.readMessage({
        armoredMessage: encryptedMessage,
      });

      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
      });

      return {
        success: true,
        data: decrypted as string,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to decrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Sign a message using a private key
   */
  static async signMessage(
    message: string, 
    keyId: string, 
    passphrase: string
  ): Promise<PGPResult> {
    try {
      const privateKeyArmored = await SecureStore.getItemAsync(`${this.PRIVATE_KEY_PREFIX}${keyId}`);
      
      if (!privateKeyArmored) {
        return {
          success: false,
          error: 'Private key not found',
        };
      }

      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase,
      });

      const signedMessage = await openpgp.sign({
        message: await openpgp.createCleartextMessage({ text: message }),
        signingKeys: privateKey,
      });

      return {
        success: true,
        data: signedMessage as string,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Verify a signed message using a public key
   */
  static async verifyMessage(signedMessage: string, keyId: string): Promise<PGPResult> {
    try {
      const keys = await this.getAllKeys();
      const verificationKey = keys.find(k => k.keyId === keyId);
      
      if (!verificationKey) {
        return {
          success: false,
          error: 'Verification key not found',
        };
      }

      const publicKey = await openpgp.readKey({ armoredKey: verificationKey.publicKeyArmored });
      
      const message = await openpgp.readCleartextMessage({
        cleartextMessage: signedMessage,
      });

      const verificationResult = await openpgp.verify({
        message,
        verificationKeys: publicKey,
      });

      const { verified } = verificationResult.signatures[0];
      const isVerified = await verified;

      return {
        success: true,
        verified: isVerified,
        data: verificationResult.data as string,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to verify message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        verified: false,
      };
    }
  }

  /**
   * Export a public key
   */
  static async exportPublicKey(keyId: string): Promise<PGPResult> {
    try {
      const keys = await this.getAllKeys();
      const keyToExport = keys.find(k => k.keyId === keyId);
      
      if (!keyToExport) {
        return {
          success: false,
          error: 'Key not found',
        };
      }

      return {
        success: true,
        data: keyToExport.publicKeyArmored,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get all stored keys
   */
  static async getAllKeys(): Promise<StoredKeyPair[]> {
    try {
      const stored = await SecureStore.getItemAsync(this.KEYS_STORAGE_KEY);
      if (!stored) return [];
      
      const keys: StoredKeyPair[] = JSON.parse(stored);
      
      // Convert stored date strings back to Date objects
      return keys.map(key => ({
        ...key,
        createdAt: new Date(key.createdAt),
      }));
    } catch (error) {
      console.error('Failed to load keys:', error);
      return [];
    }
  }

  /**
   * Delete a key
   */
  static async deleteKey(keyId: string): Promise<PGPResult> {
    try {
      const existingKeys = await this.getAllKeys();
      const updatedKeys = existingKeys.filter(k => k.keyId !== keyId);
      
      await SecureStore.setItemAsync(
        this.KEYS_STORAGE_KEY,
        JSON.stringify(updatedKeys)
      );
      
      // Remove private key from secure storage if it exists
      try {
        await SecureStore.deleteItemAsync(`${this.PRIVATE_KEY_PREFIX}${keyId}`);
      } catch {
        // Private key might not exist, ignore error
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Save key info to storage
   */
  private static async saveKeyInfo(keyPair: StoredKeyPair): Promise<void> {
    const existingKeys = await this.getAllKeys();
    const updatedKeys = existingKeys.filter(k => k.keyId !== keyPair.keyId);
    updatedKeys.push(keyPair);
    
    await SecureStore.setItemAsync(
      this.KEYS_STORAGE_KEY,
      JSON.stringify(updatedKeys)
    );
  }
}
