# Copilot Instructions for PGP Mobile App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a React Native mobile application built with Expo that provides PGP (Pretty Good Privacy) cryptographic operations. The app allows users to:

- Generate PGP key pairs (public/private keys)
- Import and manage existing keys
- Encrypt text messages using public keys
- Decrypt messages using private keys
- Sign messages with private keys
- Verify message signatures with public keys

## Technology Stack
- React Native with Expo
- TypeScript
- OpenPGP.js for cryptographic operations
- React Navigation for screen navigation
- Expo SecureStore for secure key storage
- React Native Document Picker for importing keys

## Code Guidelines
- Use TypeScript for all components and utilities
- Follow React Native best practices
- Use functional components with React hooks
- Implement proper error handling for cryptographic operations
- Store private keys securely using Expo SecureStore
- Provide clear user feedback for operations
- Use modern ES6+ syntax and async/await patterns

## Security Considerations
- Never log or expose private keys
- Use secure storage for sensitive data
- Validate all user inputs
- Handle cryptographic errors gracefully
- Provide clear security warnings to users
