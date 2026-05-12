# Farmer Data Collection Mobile App

This is the React Native (Expo) mobile app for farmers to collect and submit logistics data.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`

## Installation

1. Install dependencies:
```bash
cd app
npm install
```

2. Start the development server:
```bash
npx expo start
```

## Running the App

### On Physical Device
1. Install the "Expo Go" app from the App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in the terminal with the Expo Go app

### On Simulator/Emulator
1. Press `i` for iOS Simulator (macOS only)
2. Press `a` for Android Emulator
3. Press `w` to open in web browser

## Features

- Photo capture for automatic data extraction
- Manual form submission as fallback
- Offline support with local queue
- Multi-language support (Dutch primary)
- Real-time AI processing feedback

## Backend Connection

The app connects to the API running on `http://localhost:8000` by default. Make sure the backend services are running before starting the app.

## Development

The app uses:
- React Native with Expo
- React Navigation for routing
- AsyncStorage for offline queue
- Expo Camera and Image Picker for photo functionality