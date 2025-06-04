# PGP Mobile App

A React Native mobile application built with Expo that provides comprehensive PGP (Pretty Good Privacy) cryptographic operations. The app enables users to generate, import, and manage PGP keys, as well as encrypt, decrypt, sign, and verify messages.

## Features

### 🔐 Key Management
- **Generate PGP Key Pairs**: Create new public/private key pairs with configurable settings
- **Import Existing Keys**: Import PGP keys from files or clipboard
- **Key Storage**: Secure storage of keys using Expo SecureStore
- **Key Details**: View comprehensive key information including fingerprints, creation dates, and key strength

### 🔒 Cryptographic Operations
- **Message Encryption**: Encrypt messages using recipient's public keys
- **Message Decryption**: Decrypt received messages using your private key
- **Digital Signatures**: Sign messages with your private key
- **Signature Verification**: Verify message signatures using sender's public key

### 📱 User Experience
- **Modern UI**: Clean, intuitive interface with Material Design principles
- **Security Warnings**: Clear security guidance and warnings
- **Passphrase Strength**: Real-time passphrase strength checking
- **Key Detection**: Automatic detection of PGP content types
- **Cross-Platform**: Works on iOS and Android

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Cryptography**: OpenPGP.js
- **Navigation**: React Navigation 6
- **Storage**: Expo SecureStore
- **UI Components**: Custom components with consistent styling

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd llm-agent-demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

## Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CustomButton.tsx # Styled button component
│   └── CustomInput.tsx  # Styled input component
├── screens/            # Application screens
│   ├── HomeScreen.tsx          # Main dashboard
│   ├── GenerateKeyScreen.tsx   # Key generation form
│   ├── ImportKeyScreen.tsx     # Key import interface
│   ├── PGPOperationScreen.tsx  # Encrypt/decrypt/sign/verify
│   ├── KeyManagementScreen.tsx # Key overview
│   └── KeyDetailsScreen.tsx    # Individual key details
├── services/           # Business logic and API
│   └── PGPService.ts   # PGP operations service
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types and interfaces
└── utils/             # Helper functions
    └── helpers.ts     # Utility functions
```

### Available Scripts

- `npm run start` - Start Expo development server
- `npm run build:typescript` - Check TypeScript compilation
- `npm run install:deps` - Install dependencies

### VS Code Tasks

The project includes VS Code tasks for development:
- **Start Expo Development Server**: Launch the development server
- **Build TypeScript**: Check for TypeScript errors
- **Install Dependencies**: Update project dependencies
- **Start Expo Development Server (Web)**: Launch web version

## Security Considerations

### Key Storage
- Private keys are encrypted and stored using Expo SecureStore
- Passphrases are never logged or exposed in the app
- Key material is handled securely throughout the application

### Cryptographic Operations
- Uses industry-standard OpenPGP.js library
- Implements proper key validation and verification
- Provides clear security warnings and guidance to users
- Validates input data and sanitizes user inputs

### Best Practices
- Strong passphrase requirements with real-time strength checking
- Clear separation between public and private key operations
- Secure clipboard operations for sensitive data
- Input validation and error handling throughout

## Usage Guide

### Generating Your First Key Pair

1. Open the app and tap "Generate New Key Pair"
2. Enter your full name and email address
3. Create a strong passphrase (the app will show strength indicators)
4. Confirm your passphrase
5. Tap "Generate Key Pair" and wait for completion

### Importing Existing Keys

1. Navigate to "Import Key" from the main menu
2. Either pick a key file or paste the key content directly
3. Enter the passphrase if importing a private key
4. Tap "Import Key" to add it to your keyring

### Encrypting a Message

1. Go to "PGP Operations" and select "Encrypt Message"
2. Select the recipient's public key
3. Enter your message
4. Tap "Encrypt Message" to generate the encrypted output
5. Copy the result to share with the recipient

### Decrypting a Message

1. Go to "PGP Operations" and select "Decrypt Message"
2. Paste the encrypted PGP message
3. Select your private key and enter your passphrase
4. Tap "Decrypt Message" to reveal the original content

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- OpenPGP.js team for the excellent cryptographic library
- Expo team for the amazing development platform
- React Native community for continuous improvements
