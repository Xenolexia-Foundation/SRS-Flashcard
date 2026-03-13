# SRS Flashcard — React Native (Expo)

Mobile app for the same SRS flashcard flow: decks, cards, and spaced repetition. Data is stored locally with **AsyncStorage** (separate from the web/Electron app).

## Prerequisites

- Node.js 18+
- iOS: Xcode (for simulator) or [Expo Go](https://expo.dev/go) on device
- Android: Android Studio emulator or Expo Go on device

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Then:

- **iOS simulator:** press `i` in the terminal (macOS only)
- **Android emulator:** press `a` (emulator must be running)
- **Expo Go:** scan the QR code with the Expo Go app on your phone
- **Web:** press `w` to open in the browser

## Scripts

| Command      | Description              |
|-------------|--------------------------|
| `npm start` | Start Expo dev server    |
| `npm run ios` | Start with iOS simulator |
| `npm run android` | Start with Android     |
| `npm run web` | Start with web target  |

## Structure

- `src/core/` — types, SRS algorithm, AsyncStorage-backed storage (mirrors web logic)
- `src/screens/` — DeckList, DeckDetail, Review
- `src/navigation.tsx` — stack param types

Data is **not** shared with the web or Electron app; each platform has its own storage.
