/**
 * Format a PGP key fingerprint for display
 */
export const formatFingerprint = (fingerprint: string): string => {
  return fingerprint.match(/.{1,4}/g)?.join(' ') || fingerprint;
};

/**
 * Truncate text for display
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate passphrase strength
 */
export const validatePassphrase = (passphrase: string): { valid: boolean; message: string } => {
  if (passphrase.length < 8) {
    return { valid: false, message: 'Passphrase must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passphrase)) {
    return { 
      valid: false, 
      message: 'Passphrase must contain at least one lowercase letter, one uppercase letter, and one number' 
    };
  }
  
  return { valid: true, message: 'Strong passphrase' };
};

/**
 * Copy text to clipboard with fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // In React Native, we'll use Expo Clipboard
    const { setStringAsync } = await import('expo-clipboard');
    await setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Get key short ID from fingerprint
 */
export const getShortKeyId = (fingerprint: string): string => {
  return fingerprint.substring(fingerprint.length - 8).toUpperCase();
};

/**
 * Sanitize text input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[\x00-\x1F\x7F]/g, '');
};

/**
 * Check if text is likely encrypted PGP message
 */
export const isPGPMessage = (text: string): boolean => {
  return text.includes('-----BEGIN PGP MESSAGE-----') && 
         text.includes('-----END PGP MESSAGE-----');
};

/**
 * Check if text is PGP public key
 */
export const isPGPPublicKey = (text: string): boolean => {
  return text.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') && 
         text.includes('-----END PGP PUBLIC KEY BLOCK-----');
};

/**
 * Check if text is PGP private key
 */
export const isPGPPrivateKey = (text: string): boolean => {
  return text.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----') && 
         text.includes('-----END PGP PRIVATE KEY BLOCK-----');
};

/**
 * Check if text is signed PGP message
 */
export const isPGPSignedMessage = (text: string): boolean => {
  return text.includes('-----BEGIN PGP SIGNED MESSAGE-----') && 
         text.includes('-----END PGP SIGNATURE-----');
};

/**
 * Detect PGP content type
 */
export const detectPGPContent = (text: string): 'message' | 'public-key' | 'private-key' | 'signed-message' | 'unknown' => {
  if (isPGPMessage(text)) return 'message';
  if (isPGPPublicKey(text)) return 'public-key';
  if (isPGPPrivateKey(text)) return 'private-key';
  if (isPGPSignedMessage(text)) return 'signed-message';
  return 'unknown';
};

/**
 * Check passphrase strength
 */
export const checkPassphraseStrength = (passphrase: string): 'weak' | 'medium' | 'strong' => {
  if (passphrase.length < 8) return 'weak';
  
  let score = 0;
  if (passphrase.length >= 12) score++;
  if (/[a-z]/.test(passphrase)) score++;
  if (/[A-Z]/.test(passphrase)) score++;
  if (/\d/.test(passphrase)) score++;
  if (/[^a-zA-Z\d]/.test(passphrase)) score++;
  
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
};

/**
 * Validate email format (alias for isValidEmail)
 */
export const validateEmail = isValidEmail;
